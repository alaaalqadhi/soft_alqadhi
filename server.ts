import dotenv from 'dotenv';
import 'dotenv/config';
dotenv.config({ path: '.env.local' });
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
const { Pool } = pg;
import { GoogleGenAI, Type } from '@google/genai';
import fs from 'fs/promises';
import { existsSync, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lazy initializable Gemini client
let aiClient: GoogleGenAI | null = null;
let cachedApiKey: string | null = null;
function getGeminiClient() {
  const key = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
  if (!key) {
    throw new Error('مفتاح الذكاء الاصطناعي (GEMINI_API_KEY) غير مضاف في إعدادات الخادم (Environment Variables). يرجى إضافته في إعدادات المشروع على Vercel ثم إعادة النشر (Redeploy).');
  }
  if (!aiClient || cachedApiKey !== key) {
    cachedApiKey = key;
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Local Database Configuration
const IS_VERCEL = !!process.env.VERCEL;
const LOCAL_DB_PATH = IS_VERCEL 
  ? path.join('/tmp', 'db.json') 
  : path.join(process.cwd(), 'db.json');

interface LocalDBData {
  plates: any[];
  registrations: any[];
}

async function readLocalDb(): Promise<LocalDBData> {
  if (!existsSync(LOCAL_DB_PATH)) {
    const initialData: LocalDBData = {
      plates: [
        { id: "1", plate_number: "5544", plate_type: "خصوصي", received_date: new Date().toISOString(), status: "available" },
        { id: "2", plate_number: "8899", plate_type: "نقل", received_date: new Date(Date.now() - 3600000).toISOString(), status: "used" },
        { id: "3", plate_number: "1122", plate_type: "أجرة", received_date: new Date(Date.now() - 7200000).toISOString(), status: "available" },
        { id: "4", plate_number: "3300", plate_type: "حكومي", received_date: new Date(Date.now() - 10800000).toISOString(), status: "available" }
      ],
      registrations: [
        {
          id: "r1",
          plate_id: "2",
          plate_number: "8899",
          plate_type: "نقل",
          vehicle_type: "شاحنة نقل بضائع",
          vehicle_color: "أزرق",
          model_year: "2018",
          chassis_number: "XYZ123456789ABCDE",
          engine_number: "ENG-9988-XY",
          document_number: "CUSTOM-8821",
          owner_name: "علي بن أحمد الكبسي",
          owner_phone: "+96777123456",
          registration_date: new Date(Date.now() - 3600000).toISOString(),
          notes: "تمت المطابقة والفحص بنجاح",
          blood_type: "O+",
          id_type: "بطاقة شخصية",
          id_number: "01010045612",
          issue_place: "صنعاء",
          address: "الدائري الغربي - حي الجامعة",
          vehicle_make: "تويوتا",
          cylinders: "4",
          fuel_type: "ديزل",
          customs_office: "مكتب جمارك صنعاء",
          witness1_name: "عادل محمد صالح",
          witness1_id: "01012356789",
          witness1_relation: "صديق",
          witness1_phone: "777654321",
          witness1_address: "شارع تعز"
        }
      ]
    };
    await fs.writeFile(LOCAL_DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
  
  try {
    const content = await fs.readFile(LOCAL_DB_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    console.error("Error reading local db.json, returning empty structure:", e);
    return { plates: [], registrations: [] };
  }
}

async function writeLocalDb(data: LocalDBData): Promise<void> {
  await fs.writeFile(LOCAL_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// Load environment variables from vercel-env.json if it exists (highly convenient for Vercel deployment)
const vercelEnvPaths = [
  path.join(process.cwd(), 'vercel-env.json'),
  path.join(__dirname, 'vercel-env.json'),
  path.join(__dirname, '..', 'vercel-env.json'),
  path.join('/var/task', 'vercel-env.json')
];

let vercelEnvLoaded = false;
for (const p of vercelEnvPaths) {
  try {
    if (existsSync(p)) {
      const vercelEnvContent = readFileSync(p, 'utf-8');
      const vercelEnv = JSON.parse(vercelEnvContent);
      for (const [key, value] of Object.entries(vercelEnv)) {
        if (value && typeof value === 'string' && !process.env[key]) {
          process.env[key] = value;
          console.log(`[VERCEL ENV] Loaded environmental variable: ${key} from ${p}`);
        }
      }
      vercelEnvLoaded = true;
      break; // Stop scanning once successfully found and processed
    }
  } catch (err) {
    console.warn(`[VERCEL ENV] Failed to parse or read from path: ${p}`);
  }
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database Connection
const DEFAULT_DATABASE_URL = "postgresql://neondb_owner:npg_HOWZ16psMEtg@ep-steep-cell-ap2a94hb-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
let dbUrl = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;

// Ensure we warn if the URL is an HTTP/S REST API URL instead of Postgres protocol
if (dbUrl && (dbUrl.startsWith("http://") || dbUrl.startsWith("https://"))) {
  console.warn(`[WARNING] DATABASE_URL matches HTTP/S protocol instead of postgresql:// protocol.`);
  console.warn(`If using Supabase, please get the Postgres Connection String URI from Database -> Connection Strings.`);
}

let pool: any = null;
let sql: any = null;

if (dbUrl && !dbUrl.startsWith("http://") && !dbUrl.startsWith("https://")) {
  try {
    const isLocalhost = dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1");
    
    // Sanitize database URL: remove "channel_binding" options which are not supported by the node-postgres (pg) driver and cause crashes
    let sanitizedDbUrl = dbUrl;
    if (dbUrl.includes("channel_binding")) {
      try {
        const urlObj = new URL(dbUrl);
        urlObj.searchParams.delete("channel_binding");
        sanitizedDbUrl = urlObj.toString();
      } catch (err) {
        sanitizedDbUrl = dbUrl.replace(/[?&]channel_binding=[^&]+/g, "");
      }
    }

    pool = new Pool({
      connectionString: sanitizedDbUrl,
      ssl: !isLocalhost ? { rejectUnauthorized: false } : undefined,
      max: 15, // Optimization for serverless to handle higher concurrent spikes properly
      idleTimeoutMillis: 15000, // Shorter idle timeout since serverless gets containerized
      connectionTimeoutMillis: 3000, // Fail fast in 3 seconds at driver level
    });

    sql = async function sql(strings: TemplateStringsArray, ...values: any[]) {
      if (!pool) throw new Error("Database pool is not initialized.");
      let queryText = "";
      for (let i = 0; i < strings.length; i++) {
        queryText += strings[i];
        if (i < values.length) {
          queryText += `$${i + 1}`;
        }
      }
      const sanitizedValues = values.map(val => val === undefined ? null : val);
      const res = await pool.query(queryText, sanitizedValues);
      return res.rows;
    };
  } catch (err: any) {
    console.error("Failed to construct PG Pool wrapper:", err?.message || err);
  }
}

let useLocalFallback = !sql;

let dbInitCompleter: Promise<void> | null = null;
const getDBInit = (): Promise<void> => {
  if (!dbInitCompleter) {
    dbInitCompleter = initDB().catch(err => {
      console.error("Database initialization failed during getDBInit promise run:", err);
    });
  }
  return dbInitCompleter;
};

// Initialize Tables
const initDB = async () => {
    if (!sql) {
      console.log('Database connection failed: DATABASE_URL is missing. Operating in local filesystem storage mode.');
      useLocalFallback = true;
      return;
    }

    try {
      // Test the connection with a strict timeout of 2 seconds to avoid slowing down serverless boot
      await Promise.race([
        sql`SELECT 1`,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Postgres connection test timeout')), 2000))
      ]);
      
      let needsFullSchemaSetup = true;
      try {
        const tableCheck = await sql`
          SELECT COUNT(*)::integer as count FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename IN ('plates', 'registrations')
        `;
        const tablesExist = tableCheck && tableCheck[0] && parseInt(tableCheck[0].count as string, 10) === 2;

        if (tablesExist) {
          const columnCheck = await sql`
            SELECT COUNT(*)::integer as count FROM information_schema.columns 
            WHERE table_name = 'registrations' AND column_name = 'blood_type'
          `;
          if (columnCheck && columnCheck[0] && parseInt(columnCheck[0].count as string, 10) > 0) {
            needsFullSchemaSetup = false;
          }
        }
      } catch (checkErr) {
        console.log('Skipping fast check, executing schema setup:', checkErr);
      }

      if (needsFullSchemaSetup) {
        console.log('[DB INIT] Creating tables and running migrations on cloud database...');
        await sql`
          CREATE TABLE IF NOT EXISTS plates (
            id TEXT PRIMARY KEY,
            plate_number TEXT,
            plate_type TEXT NOT NULL,
            received_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            status TEXT NOT NULL DEFAULT 'available'
          )
        `;
        await sql`
          CREATE TABLE IF NOT EXISTS registrations (
            id TEXT PRIMARY KEY,
            plate_id TEXT REFERENCES plates(id),
            plate_number TEXT,
            plate_type TEXT NOT NULL,
            vehicle_type TEXT NOT NULL,
            vehicle_color TEXT,
            model_year TEXT,
            chassis_number TEXT NOT NULL,
            engine_number TEXT,
            document_number TEXT,
            owner_name TEXT NOT NULL,
            owner_phone TEXT,
            notes TEXT,
            registration_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            blood_type TEXT,
            id_type TEXT,
            id_number TEXT,
            issue_place TEXT,
            address TEXT,
            vehicle_make TEXT,
            vehicle_model TEXT,
            vehicle_shape TEXT,
            cylinders TEXT,
            fuel_type TEXT,
            customs_office TEXT,
            witness1_name TEXT,
            witness1_id TEXT,
            witness1_relation TEXT,
            witness1_phone TEXT,
            witness1_address TEXT,
            witness2_name TEXT,
            witness2_id TEXT,
            witness2_relation TEXT,
            witness2_phone TEXT,
            witness2_address TEXT,
            owner_photo TEXT,
            plate_photo TEXT
          )
        `;
        
        // Ensure columns exist (for existing databases)
        try {
          await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS plate_number TEXT`;
          await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS plate_type TEXT`;
          await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS vehicle_type TEXT`;
          await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS vehicle_color TEXT`;
          await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS model_year TEXT`;
          await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS chassis_number TEXT`;
          await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS engine_number TEXT`;
          await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS document_number TEXT`;
          await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS owner_name TEXT`;
          await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS owner_phone TEXT`;
          await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS notes TEXT`;
          await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS blood_type TEXT`;
          await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS id_type TEXT`;
          await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS id_number TEXT`;
          await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS issue_place TEXT`;
          await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS address TEXT`;
          await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS vehicle_make TEXT`;
          await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS vehicle_model TEXT`;
          await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS vehicle_shape TEXT`;
          await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS cylinders TEXT`;
          await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS fuel_type TEXT`;
          await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS customs_office TEXT`;
          await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS witness1_name TEXT`;
          await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS witness1_id TEXT`;
          await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS witness1_relation TEXT`;
          await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS witness1_phone TEXT`;
          await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS witness1_address TEXT`;
          await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS witness2_name TEXT`;
          await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS witness2_id TEXT`;
          await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS witness2_relation TEXT`;
          await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS witness2_phone TEXT`;
          await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS witness2_address TEXT`;
          await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS owner_photo TEXT`;
          await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS plate_photo TEXT`;
        } catch (e) {
          // Ignore error if column already exists
        }

        // Convert ID columns to TEXT to handle alphanumeric / long string inputs safely without SQL range limits
        try {
          // Drop foreign key constraint first so we can modify column types
          const hasConstraint = await sql`
            SELECT 1 FROM pg_constraint WHERE conname = 'registrations_plate_id_fkey'
          `;
          if (hasConstraint && hasConstraint.length > 0) {
            await sql`ALTER TABLE registrations DROP CONSTRAINT registrations_plate_id_fkey`;
          }
        } catch (e: any) {
          console.log('Notice: dropping constraint skipped or handled:', e?.message || e);
        }

        try {
          await sql`ALTER TABLE registrations ALTER COLUMN id TYPE TEXT USING id::TEXT`;
        } catch (e) { console.log('Notice: id conversion skipped or handled'); }

        try {
          await sql`ALTER TABLE registrations ALTER COLUMN plate_id TYPE TEXT USING plate_id::TEXT`;
        } catch (e) { console.log('Notice: plate_id conversion skipped or handled'); }

        try {
          await sql`ALTER TABLE plates ALTER COLUMN id TYPE TEXT USING id::TEXT`;
        } catch (e) { console.log('Notice: plates.id conversion skipped or handled'); }

        try {
          // Re-add foreign key constraint with TEXT types
          const hasConstraint = await sql`
            SELECT 1 FROM pg_constraint WHERE conname = 'registrations_plate_id_fkey'
          `;
          if (!hasConstraint || hasConstraint.length === 0) {
            await sql`ALTER TABLE registrations ADD CONSTRAINT registrations_plate_id_fkey FOREIGN KEY (plate_id) REFERENCES plates(id)`;
          }
        } catch (e: any) {
          console.log('Notice: recreating constraint skipped or handled:', e?.message || e);
        }

        try {
          await sql`ALTER TABLE plates ALTER COLUMN plate_number TYPE TEXT USING plate_number::TEXT`;
          await sql`ALTER TABLE plates ALTER COLUMN plate_number DROP NOT NULL`;
        } catch (e) { console.log('Notice: plates.plate_number conversion or nullability skipped atau handled'); }

        try {
          await sql`ALTER TABLE registrations ALTER COLUMN plate_number TYPE TEXT USING plate_number::TEXT`;
          await sql`ALTER TABLE registrations ALTER COLUMN plate_number DROP NOT NULL`;
        } catch (e) { console.log('Notice: registrations.plate_number conversion or nullability skipped atau handled'); }

        try {
          await sql`ALTER TABLE plates ALTER COLUMN received_date SET DEFAULT NOW()`;
        } catch (e) { console.log('Notice: setting default received_date skipped or handled', e); }

        try {
          // Sync plate statuses based on actual registrations to fix any inconsistencies
          await sql`UPDATE plates SET status = 'used' WHERE id IN (SELECT DISTINCT plate_id FROM registrations WHERE plate_id IS NOT NULL AND plate_id != '')`;
          await sql`UPDATE plates SET status = 'available' WHERE id NOT IN (SELECT DISTINCT plate_id FROM registrations WHERE plate_id IS NOT NULL AND plate_id != '') OR status IS NULL OR status = ''`;
          console.log('Database plate statuses synchronized successfully');
        } catch (e) {
          console.error('Notice: synchronizing plate statuses failed or skipped', e);
        }
      } else {
        console.log('[DB INIT] Database schema was previously initialized. Running incremental column checks...');
      }

      // Ensure all possible columns exist in the registrations table (always run on startup to support incremental updates)
      if (pool) {
        const expectedColumns = [
          'plate_number',
          'plate_type',
          'vehicle_type',
          'vehicle_color',
          'model_year',
          'chassis_number',
          'engine_number',
          'document_number',
          'owner_name',
          'owner_phone',
          'notes',
          'blood_type',
          'id_type',
          'id_number',
          'issue_place',
          'address',
          'vehicle_make',
          'vehicle_model',
          'vehicle_shape',
          'cylinders',
          'fuel_type',
          'customs_office',
          'witness1_name',
          'witness1_id',
          'witness1_relation',
          'witness1_phone',
          'witness1_address',
          'witness2_name',
          'witness2_id',
          'witness2_relation',
          'witness2_phone',
          'witness2_address',
          'owner_photo',
          'plate_photo'
        ];

        console.log('[DB INIT] Verifying and synchronizing registrations table columns...');
        for (const col of expectedColumns) {
          try {
            await pool.query(`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS ${col} TEXT`);
          } catch (colErr: any) {
            console.warn(`[DB INIT] Note: Failed to ensure column "${col}" exists or is updated:`, colErr?.message || colErr);
          }
        }
      }

      // Ensure high-performance database indexes exist to prevent query latency
      try {
        await sql`CREATE INDEX IF NOT EXISTS idx_plates_received_date ON plates (received_date DESC)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_registrations_registration_date ON registrations (registration_date DESC)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_registrations_plate_id ON registrations (plate_id)`;
        console.log('[DB INIT] High-performance indexing successfully verified.');
      } catch (idxErr) {
        console.warn('[DB INIT] Notice: index creation skipped or handled:', idxErr);
      }

      console.log('Database tables initialized successfully. Operating in cloud database mode.');
      useLocalFallback = false;

      // Run pre-population of local db.json in background to avoid blocking serverless boot time
      (async () => {
        try {
          const cloudPlates = await sql`SELECT * FROM plates`;
          const cloudRegs = await sql`SELECT * FROM registrations`;
          const initialData: LocalDBData = {
            plates: cloudPlates || [],
            registrations: cloudRegs || []
          };
          await fs.writeFile(LOCAL_DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
          console.log('[INIT DB ASYNC] Local backup file pre-populated successfully from cloud.');
        } catch (syncErr) {
          console.warn('[INIT DB ASYNC] Local fallback populator skipped in server background:', syncErr);
        }
      })();
    } catch (err) {
      console.error('Database connection or initialization failed. Falling back to local filesystem storage mode. Error:', err);
      useLocalFallback = true;
    }
  };

  getDBInit();

  // --- API Routes ---

  // Middleware to check database connection and await initialization
  app.use('/api', async (req, res, next) => {
    if (req.path === '/analyze-image') {
      return next();
    }
    // Both cloud mode and local fallback storage mode are supported. Await initialization with a strict timeout to prevent Vercel serverless function from timing out.
    try {
      await Promise.race([
        getDBInit(),
        new Promise((resolve) => setTimeout(resolve, 2500)) // Max 2.5 seconds timeout
      ]);
    } catch (e) {
      console.warn("Database initialization timed out or failed in API middleware. Proceeding with local fallback if DB is not ready.");
    }
    next();
  });

  app.post('/api/analyze-image', async (req, res) => {
    try {
      const { image, docType } = req.body;
      if (!image) {
        return res.status(400).json({ error: 'لم يتم توفير ملف الصورة' });
      }

      // Robustly extract raw base64 data and mime type if present in data URL format
      let base64Data = image;
      let mimeType = 'image/jpeg';
      
      if (typeof image === 'string' && image.startsWith('data:')) {
        const parts = image.split(';base64,');
        if (parts.length === 2) {
          mimeType = parts[0].replace('data:', '');
          base64Data = parts[1];
        }
      }

      const client = getGeminiClient();

      let systemInstruction = '';
      let schema: any = {};

      if (docType === 'customs') {
        systemInstruction = `
          أنت خبير في قراءة وتحليل وثائق جمارك السيارات والبيانات الجمركية (البيان الجمركي) في اليمن ومختلف الدول العربية بدقة متناهية.
          مهمتك هي استخراج معلومات السيارة الموضحة في الصورة بدقة تامة.
          إذا لم يكن أي حقل واضحاً أو موجوداً في الصورة، يرجى كتابة سلسلة نصية فارغة "" ولا تقم بالتخمين العشوائي للأرقام الحساسة.
          ركز بشكل كامل على:
          1. رقم الشاصي أو الهيكل (رقم الهيكل/Chassis): يتكون عادة من 17 حرفاً ورقماً، تأكد من نقله حرفياً وبدقة دون أخطاء.
          2. رقم المحرك (الماكينة): تأكد من قراءته بدقة.
          3. رقم البيان أو المستند الجمركي (رقم البيان).
          4. نوع السيارة، لونها، وسنة الصنع أو الموديل.
          5. اسم السيارة وماركتها (مثل تويوتا، لاندكروزر، هيلوكس، إلخ).
          6. عدد الاسطوانات (البستونات) ونوع الوقود ومكتب جمارك منفذ الدخول إن وجد.
        `;
        schema = {
          type: Type.OBJECT,
          properties: {
            chassis_number: { type: Type.STRING },
            engine_number: { type: Type.STRING },
            document_number: { type: Type.STRING },
            vehicle_type: { type: Type.STRING },
            vehicle_color: { type: Type.STRING },
            model_year: { type: Type.STRING },
            vehicle_make: { type: Type.STRING },
            cylinders: { type: Type.STRING },
            fuel_type: { type: Type.STRING },
            customs_office: { type: Type.STRING }
          }
        };
      } else if (docType === 'owner_id') {
        systemInstruction = `
          أنت خبير في قراءة وتحليل بطاقات الهوية الشخصية والبطاقات الوطنية وجوازات السفر اليمنية والعربية بدقة عالية جداً.
          مهمتك هي استخراج بيانات المالك الشخصية من صورة الهوية المرفقة.
          إذا لم يكن الحقل واضحاً أو موجوداً في الصورة، ضعه كقيمة نصية فارغة "".
          استخرج بدقة:
          1. اسم المالك الكامل (الاسم الرباعي أو الثلاثي المكتوب في الهوية).
          2. نوع الهوية (بطاقة شخصية، جواز سفر، إلخ).
          3. رقم الهوية أو الرقم الوطني (يتكون الرقم الوطني اليمني لبطاقة الهوية عادة من 11 رقماً).
          4. مكان الإصدار المذكور في البطاقة.
          5. العنوان أو محل الإقامة إن كان مكتوباً.
          6. فصيلة أو زمرة الدم إن كانت ظاهرة على البطاقة.
        `;
        schema = {
          type: Type.OBJECT,
          properties: {
            owner_name: { type: Type.STRING },
            id_type: { type: Type.STRING },
            id_number: { type: Type.STRING },
            issue_place: { type: Type.STRING },
            address: { type: Type.STRING },
            blood_type: { type: Type.STRING }
          }
        };
      } else {
        // witness
        systemInstruction = `
          أنت خبير في قراءة وتحليل بطاقات الهوية الشخصية والبطاقات الوطنية وجوازات السفر اليمنية والعربية بدقة عالية جداً.
          مهمتك هي قراءة بطاقة الهوية الخاصة بالمعرّف (أو الضامن / الشاهد)، واستخراج البيانات الشخصية الخاصة بصاحب البطاقة لتعبئتها كبيانات للمعرّف الفني.
          يرجى التركيز على قراءة البيانات بدقة شديدة دون أي تخمين عشوائي.
          إذا لم يكن الحقل واضحاً أو موجوداً في الصورة، ضعه كقيمة نصية فارغة "".
          استخرج بدقة:
          1. الاسم الكامل للمعرف (الاسم المكتوب على البطاقة بالكامل).
          2. رقم الهوية / الرقم الوطني التابع لصاحب البطاقة (الهوية الشخصية اليمنية الرقم الوطني يتكون عادة من 11 رقماً).
          3. عنوان أو محل إقامة المعرف المكتوب في البطاقة.
          4. رقم الهاتف إن كان مكتوباً أو مسجلاً، وإلا ضعه كقيمة فارغة "".
          5. صلة القرابة إن كان هناك ما يشير إليها، وإلا ضع قيمة فارغة "".
        `;
        schema = {
          type: Type.OBJECT,
          properties: {
            witness_name: { type: Type.STRING },
            witness_id: { type: Type.STRING },
            witness_phone: { type: Type.STRING },
            witness_address: { type: Type.STRING },
            witness_relation: { type: Type.STRING }
          }
        };
      }

      const contents = [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        },
        {
          text: `الرجاء استخراج البيانات المطلوبة من هذه الصورة وإعطائي النتيجة ككائن JSON متوافق تماماً مع التنسيق المطلوب.`
        }
      ];

      const response = await client.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts: contents },
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: schema
        }
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        throw new Error('لم يقم نموذج الذكاء الاصطناعي بإرجاع أي بيانات');
      }

      const cleanedJson = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsedData = JSON.parse(cleanedJson);
      res.json(parsedData);
    } catch (err: any) {
      console.error('Gemini image analysis error:', err);
      const rawMsg = String(err?.message || err || '');
      let userMessage = rawMsg || 'فشل في قراءة وتحليل الصورة من خلال الذكاء الاصطناعي';
      if (rawMsg.includes('API_KEY_INVALID') || rawMsg.includes('API key not valid') || err?.status === 403) {
        userMessage = 'مفتاح الذكاء الاصطناعي (GEMINI_API_KEY) غير صالح أو لا يملك الصلاحية. يرجى التحقق منه في إعدادات الخادم (Secrets / Environment Variables).';
      } else if (rawMsg.includes('RESOURCE_EXHAUSTED') || err?.status === 429) {
        userMessage = 'تم تجاوز حد الاستخدام المسموح به لمفتاح الذكاء الاصطناعي حالياً. يرجى المحاولة بعد قليل أو التحقق من حصة المفتاح.';
      }
      res.status(err?.status && err.status >= 400 && err.status < 600 ? err.status : 500).json({ error: userMessage });
    }
  });

  app.get('/api/plates', async (req, res) => {
    try {
      if (sql && !useLocalFallback) {
        try {
          const plates = await sql`SELECT * FROM plates ORDER BY received_date DESC`;
          return res.json(plates);
        } catch (dbErr) {
          console.warn('[DB GET PLATES FALLBACK] Failed to read from cloud, falling back to local text file:', dbErr);
        }
      }
      const db = await readLocalDb();
      const plates = [...db.plates].sort((a, b) => new Date(b.received_date).getTime() - new Date(a.received_date).getTime());
      res.json(plates);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/plates', async (req, res) => {
    try {
      const { plate_number, plate_type, received_date } = req.body;
      const id = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
      const dateToInsert = received_date ? new Date(received_date) : new Date();

      let newPlate = {
        id,
        plate_number,
        plate_type,
        received_date: dateToInsert.toISOString(),
        status: 'available'
      };

      // Write to SQL synchronously if available to prevent delay
      if (sql && !useLocalFallback) {
        try {
          const [inserted] = await sql`
            INSERT INTO plates (id, plate_number, plate_type, received_date, status)
            VALUES (${id}, ${plate_number}, ${plate_type}, ${dateToInsert}, 'available')
            RETURNING *
          `;
          if (inserted) {
            newPlate = {
              id: inserted.id,
              plate_number: inserted.plate_number,
              plate_type: inserted.plate_type,
              received_date: inserted.received_date ? new Date(inserted.received_date).toISOString() : newPlate.received_date,
              status: inserted.status || 'available'
            };
          }
          console.log('[SYNC] Successfully saved plate directly to cloud database:', id);
        } catch (dbErr) {
          console.warn('[SYNC FALLBACK] Failed to write plate to cloud directly, saved locally only:', dbErr);
        }
      }

      // Write locally as backup
      const db = await readLocalDb();
      db.plates.push(newPlate);
      await writeLocalDb(db);

      res.status(201).json(newPlate);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/plates/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      let updated: any = null;

      if (sql && !useLocalFallback) {
        try {
          const existingRows = await sql`SELECT * FROM plates WHERE id = ${id}`;
          if (existingRows.length === 0) {
            return res.status(404).json({ error: 'اللوحة غير موجودة في قاعدة البيانات السحابية' });
          }
          const existing = existingRows[0];
          updated = {
            id,
            plate_number: updates.plate_number !== undefined ? updates.plate_number : existing.plate_number,
            plate_type: updates.plate_type !== undefined ? updates.plate_type : existing.plate_type,
            status: updates.status !== undefined ? updates.status : existing.status,
            received_date: existing.received_date
          };

          await sql`
            UPDATE plates 
            SET plate_number = ${updated.plate_number}, plate_type = ${updated.plate_type}, status = ${updated.status}
            WHERE id = ${id}
          `;
          console.log('[SYNC] Successfully updated plate directly in cloud database:', id);

          const db = await readLocalDb();
          const localIdx = db.plates.findIndex(p => p.id === id);
          if (localIdx !== -1) {
            db.plates[localIdx] = updated;
          } else {
            db.plates.push(updated);
          }
          await writeLocalDb(db);
        } catch (dbErr: any) {
          console.error('[SYNC ERROR] Failed direct cloud update for plate:', id, dbErr);
          throw new Error(`فشل تحديث قاعدة البيانات السحابية: ${dbErr.message || dbErr}`);
        }
      } else {
        const db = await readLocalDb();
        const idx = db.plates.findIndex(p => p.id === id);
        if (idx === -1) {
          return res.status(404).json({ error: 'اللوحة غير موجودة' });
        }

        db.plates[idx] = {
          ...db.plates[idx],
          plate_number: updates.plate_number !== undefined ? updates.plate_number : db.plates[idx].plate_number,
          plate_type: updates.plate_type !== undefined ? updates.plate_type : db.plates[idx].plate_type,
          status: updates.status !== undefined ? updates.status : db.plates[idx].status
        };
        updated = db.plates[idx];
        await writeLocalDb(db);
      }

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/plates/:id', async (req, res) => {
    try {
      const { id } = req.params;

      if (sql && !useLocalFallback) {
        try {
          await sql`DELETE FROM registrations WHERE plate_id = ${id}`;
          await sql`DELETE FROM plates WHERE id = ${id}`;
          console.log('[SYNC] Successfully deleted plate and related registrations from cloud database:', id);

          const db = await readLocalDb();
          db.plates = db.plates.filter(p => p.id !== id);
          db.registrations = db.registrations.filter(r => r.plate_id !== id);
          await writeLocalDb(db);
        } catch (dbErr: any) {
          console.error('[SYNC ERROR] Failed direct cloud delete for plate:', id, dbErr);
          throw new Error(`فشل حذف اللوحة من قاعدة البيانات السحابية: ${dbErr.message || dbErr}`);
        }
      } else {
        const db = await readLocalDb();
        db.plates = db.plates.filter(p => p.id !== id);
        db.registrations = db.registrations.filter(r => r.plate_id !== id);
        await writeLocalDb(db);
      }

      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/registrations', async (req, res) => {
    try {
      if (sql && !useLocalFallback) {
        try {
          const registrations = await sql`SELECT * FROM registrations ORDER BY registration_date DESC`;
          return res.json(registrations);
        } catch (dbErr) {
          console.warn('[DB GET REGS FALLBACK] Failed to read registrations from cloud, falling back to local text file:', dbErr);
        }
      }
      const db = await readLocalDb();
      const registrations = [...db.registrations].sort((a, b) => new Date(b.registration_date).getTime() - new Date(a.registration_date).getTime());
      res.json(registrations);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/register-car', async (req, res) => {
    try {
      const { 
        plate_id, vehicle_type, vehicle_color, model_year, chassis_number, 
        engine_number, document_number, owner_name, owner_phone, notes,
        blood_type, id_type, id_number, issue_place, address,
        vehicle_make, vehicle_model, vehicle_shape, cylinders, fuel_type, customs_office,
        witness1_name, witness1_id, witness1_relation, witness1_phone, witness1_address,
        witness2_name, witness2_id, witness2_relation, witness2_phone, witness2_address,
        owner_photo, plate_photo
      } = req.body;

      const db = await readLocalDb();
      const plate = db.plates.find(p => p.id === plate_id);
      if (!plate || plate.status !== 'available') {
        return res.status(400).json({ error: 'اللوحة المحددة غير متوفرة أو مستخدمة مسبقاً' });
      }

      const id = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
      plate.status = 'used';

      const regDate = new Date().toISOString();
      let newRegistration = {
        id,
        plate_id,
        plate_number: plate.plate_number,
        plate_type: plate.plate_type,
        vehicle_type,
        vehicle_color,
        model_year,
        chassis_number,
        engine_number,
        document_number,
        owner_name,
        owner_phone,
        notes,
        registration_date: regDate,
        blood_type,
        id_type,
        id_number,
        issue_place,
        address,
        vehicle_make,
        vehicle_model,
        vehicle_shape,
        cylinders,
        fuel_type,
        customs_office,
        witness1_name,
        witness1_id,
        witness1_relation,
        witness1_phone,
        witness1_address,
        witness2_name,
        witness2_id,
        witness2_relation,
        witness2_phone,
        witness2_address,
        owner_photo,
        plate_photo
      };

      // Synchronous cloud save to prevent database delays
      if (sql && !useLocalFallback) {
        try {
          await sql`UPDATE plates SET status = 'used' WHERE id = ${plate_id}`;
          await sql`
            INSERT INTO registrations (
              id, plate_id, plate_number, plate_type, vehicle_type, vehicle_color, 
              model_year, chassis_number, engine_number, document_number, 
              owner_name, owner_phone, notes, registration_date,
              blood_type, id_type, id_number, issue_place, address,
              vehicle_make, vehicle_model, vehicle_shape, cylinders, fuel_type, customs_office,
              witness1_name, witness1_id, witness1_relation, witness1_phone, witness1_address,
              witness2_name, witness2_id, witness2_relation, witness2_phone, witness2_address,
              owner_photo, plate_photo
            ) VALUES (
              ${id}, ${plate_id}, ${plate.plate_number}, ${plate.plate_type}, 
              ${vehicle_type}, ${vehicle_color}, ${model_year}, ${chassis_number}, 
              ${engine_number}, ${document_number}, ${owner_name}, ${owner_phone}, ${notes},
              ${regDate},
              ${blood_type}, ${id_type}, ${id_number}, ${issue_place}, ${address},
              ${vehicle_make}, ${vehicle_model}, ${vehicle_shape}, ${cylinders}, ${fuel_type}, ${customs_office},
              ${witness1_name}, ${witness1_id}, ${witness1_relation}, ${witness1_phone}, ${witness1_address},
              ${witness2_name}, ${witness2_id}, ${witness2_relation}, ${witness2_phone}, ${witness2_address},
              ${owner_photo}, ${plate_photo}
            )
          `;
          console.log('[SYNC] Successfully saved registration directly to cloud database:', id);
        } catch (dbErr) {
          console.warn('[SYNC FALLBACK] Saved registration locally, skipped direct cloud write:', dbErr);
        }
      }

      db.registrations.push(newRegistration);
      await writeLocalDb(db);

      res.status(201).json(newRegistration);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/registrations/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const u = req.body;
      let updated: any = null;

      if (sql && !useLocalFallback) {
        try {
          // Check if registration exists globally
          const existingRows = await sql`SELECT * FROM registrations WHERE id = ${id}`;
          if (existingRows.length === 0) {
            return res.status(404).json({ error: 'العملية غير موجودة في قاعدة البيانات السحابية' });
          }

          const existing = existingRows[0];

          updated = {
            id,
            plate_id: u.plate_id !== undefined ? u.plate_id : existing.plate_id,
            plate_number: u.plate_number !== undefined ? u.plate_number : existing.plate_number,
            plate_type: u.plate_type !== undefined ? u.plate_type : existing.plate_type,
            vehicle_type: u.vehicle_type !== undefined ? u.vehicle_type : existing.vehicle_type,
            vehicle_color: u.vehicle_color !== undefined ? u.vehicle_color : existing.vehicle_color,
            model_year: u.model_year !== undefined ? u.model_year : existing.model_year,
            chassis_number: u.chassis_number !== undefined ? u.chassis_number : existing.chassis_number,
            engine_number: u.engine_number !== undefined ? u.engine_number : existing.engine_number,
            document_number: u.document_number !== undefined ? u.document_number : existing.document_number,
            owner_name: u.owner_name !== undefined ? u.owner_name : existing.owner_name,
            owner_phone: u.owner_phone !== undefined ? u.owner_phone : existing.owner_phone,
            notes: u.notes !== undefined ? u.notes : existing.notes,
            registration_date: existing.registration_date, // preserve the original registration date
            blood_type: u.blood_type !== undefined ? u.blood_type : existing.blood_type,
            id_type: u.id_type !== undefined ? u.id_type : existing.id_type,
            id_number: u.id_number !== undefined ? u.id_number : existing.id_number,
            issue_place: u.issue_place !== undefined ? u.issue_place : existing.issue_place,
            address: u.address !== undefined ? u.address : existing.address,
            vehicle_make: u.vehicle_make !== undefined ? u.vehicle_make : existing.vehicle_make,
            vehicle_model: u.vehicle_model !== undefined ? u.vehicle_model : existing.vehicle_model,
            vehicle_shape: u.vehicle_shape !== undefined ? u.vehicle_shape : existing.vehicle_shape,
            cylinders: u.cylinders !== undefined ? u.cylinders : existing.cylinders,
            fuel_type: u.fuel_type !== undefined ? u.fuel_type : existing.fuel_type,
            customs_office: u.customs_office !== undefined ? u.customs_office : existing.customs_office,
            witness1_name: u.witness1_name !== undefined ? u.witness1_name : existing.witness1_name,
            witness1_id: u.witness1_id !== undefined ? u.witness1_id : existing.witness1_id,
            witness1_relation: u.witness1_relation !== undefined ? u.witness1_relation : existing.witness1_relation,
            witness1_phone: u.witness1_phone !== undefined ? u.witness1_phone : existing.witness1_phone,
            witness1_address: u.witness1_address !== undefined ? u.witness1_address : existing.witness1_address,
            witness2_name: u.witness2_name !== undefined ? u.witness2_name : existing.witness2_name,
            witness2_id: u.witness2_id !== undefined ? u.witness2_id : existing.witness2_id,
            witness2_relation: u.witness2_relation !== undefined ? u.witness2_relation : existing.witness2_relation,
            witness2_phone: u.witness2_phone !== undefined ? u.witness2_phone : existing.witness2_phone,
            witness2_address: u.witness2_address !== undefined ? u.witness2_address : existing.witness2_address,
            owner_photo: u.owner_photo !== undefined ? u.owner_photo : existing.owner_photo,
            plate_photo: u.plate_photo !== undefined ? u.plate_photo : existing.plate_photo
          };

          await sql`
            UPDATE registrations SET 
              plate_number = ${updated.plate_number},
              plate_type = ${updated.plate_type},
              vehicle_type = ${updated.vehicle_type}, 
              vehicle_color = ${updated.vehicle_color}, 
              model_year = ${updated.model_year}, 
              chassis_number = ${updated.chassis_number}, 
              engine_number = ${updated.engine_number}, 
              document_number = ${updated.document_number}, 
              owner_name = ${updated.owner_name}, 
              owner_phone = ${updated.owner_phone}, 
              notes = ${updated.notes},
              blood_type = ${updated.blood_type},
              id_type = ${updated.id_type},
              id_number = ${updated.id_number},
              issue_place = ${updated.issue_place},
              address = ${updated.address},
              vehicle_make = ${updated.vehicle_make},
              vehicle_model = ${updated.vehicle_model},
              vehicle_shape = ${updated.vehicle_shape},
              cylinders = ${updated.cylinders},
              fuel_type = ${updated.fuel_type},
              customs_office = ${updated.customs_office},
              witness1_name = ${updated.witness1_name},
              witness1_id = ${updated.witness1_id},
              witness1_relation = ${updated.witness1_relation},
              witness1_phone = ${updated.witness1_phone},
              witness1_address = ${updated.witness1_address},
              witness2_name = ${updated.witness2_name},
              witness2_id = ${updated.witness2_id},
              witness2_relation = ${updated.witness2_relation},
              witness2_phone = ${updated.witness2_phone},
              witness2_address = ${updated.witness2_address},
              owner_photo = COALESCE(${updated.owner_photo}, owner_photo),
              plate_photo = COALESCE(${updated.plate_photo}, plate_photo)
            WHERE id = ${id}
          `;
          console.log('[SYNC] Successfully updated registration directly in cloud database:', id);

          const db = await readLocalDb();
          const localIdx = db.registrations.findIndex(r => r.id === id);
          if (localIdx !== -1) {
            db.registrations[localIdx] = updated;
          } else {
            db.registrations.push(updated);
          }
          await writeLocalDb(db);
        } catch (dbErr: any) {
          console.error('[SYNC ERROR] Failed direct cloud update for registration:', id, dbErr);
          throw new Error(`فشل تحديث قاعدة البيانات السحابية: ${dbErr.message || dbErr}`);
        }
      } else {
        const db = await readLocalDb();
        const idx = db.registrations.findIndex(r => r.id === id);
        if (idx === -1) {
          return res.status(404).json({ error: 'العملية غير موجودة' });
        }

        db.registrations[idx] = {
          ...db.registrations[idx],
          plate_number: u.plate_number !== undefined ? u.plate_number : db.registrations[idx].plate_number,
          plate_type: u.plate_type !== undefined ? u.plate_type : db.registrations[idx].plate_type,
          vehicle_type: u.vehicle_type !== undefined ? u.vehicle_type : db.registrations[idx].vehicle_type,
          vehicle_color: u.vehicle_color !== undefined ? u.vehicle_color : db.registrations[idx].vehicle_color,
          model_year: u.model_year !== undefined ? u.model_year : db.registrations[idx].model_year,
          chassis_number: u.chassis_number !== undefined ? u.chassis_number : db.registrations[idx].chassis_number,
          engine_number: u.engine_number !== undefined ? u.engine_number : db.registrations[idx].engine_number,
          document_number: u.document_number !== undefined ? u.document_number : db.registrations[idx].document_number,
          owner_name: u.owner_name !== undefined ? u.owner_name : db.registrations[idx].owner_name,
          owner_phone: u.owner_phone !== undefined ? u.owner_phone : db.registrations[idx].owner_phone,
          notes: u.notes !== undefined ? u.notes : db.registrations[idx].notes,
          blood_type: u.blood_type !== undefined ? u.blood_type : db.registrations[idx].blood_type,
          id_type: u.id_type !== undefined ? u.id_type : db.registrations[idx].id_type,
          id_number: u.id_number !== undefined ? u.id_number : db.registrations[idx].id_number,
          issue_place: u.issue_place !== undefined ? u.issue_place : db.registrations[idx].issue_place,
          address: u.address !== undefined ? u.address : db.registrations[idx].address,
          vehicle_make: u.vehicle_make !== undefined ? u.vehicle_make : db.registrations[idx].vehicle_make,
          vehicle_model: u.vehicle_model !== undefined ? u.vehicle_model : db.registrations[idx].vehicle_model,
          vehicle_shape: u.vehicle_shape !== undefined ? u.vehicle_shape : db.registrations[idx].vehicle_shape,
          cylinders: u.cylinders !== undefined ? u.cylinders : db.registrations[idx].cylinders,
          fuel_type: u.fuel_type !== undefined ? u.fuel_type : db.registrations[idx].fuel_type,
          customs_office: u.customs_office !== undefined ? u.customs_office : db.registrations[idx].customs_office,
          witness1_name: u.witness1_name !== undefined ? u.witness1_name : db.registrations[idx].witness1_name,
          witness1_id: u.witness1_id !== undefined ? u.witness1_id : db.registrations[idx].witness1_id,
          witness1_relation: u.witness1_relation !== undefined ? u.witness1_relation : db.registrations[idx].witness1_relation,
          witness1_phone: u.witness1_phone !== undefined ? u.witness1_phone : db.registrations[idx].witness1_phone,
          witness1_address: u.witness1_address !== undefined ? u.witness1_address : db.registrations[idx].witness1_address,
          witness2_name: u.witness2_name !== undefined ? u.witness2_name : db.registrations[idx].witness2_name,
          witness2_id: u.witness2_id !== undefined ? u.witness2_id : db.registrations[idx].witness2_id,
          witness2_relation: u.witness2_relation !== undefined ? u.witness2_relation : db.registrations[idx].witness2_relation,
          witness2_phone: u.witness2_phone !== undefined ? u.witness2_phone : db.registrations[idx].witness2_phone,
          witness2_address: u.witness2_address !== undefined ? u.witness2_address : db.registrations[idx].witness2_address,
          owner_photo: u.owner_photo !== undefined ? u.owner_photo : db.registrations[idx].owner_photo,
          plate_photo: u.plate_photo !== undefined ? u.plate_photo : db.registrations[idx].plate_photo
        };
        updated = db.registrations[idx];
        await writeLocalDb(db);
      }

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/registrations/:id', async (req, res) => {
    try {
      const { id } = req.params;

      if (sql && !useLocalFallback) {
        try {
          // Get the plate_id before deleting
          const regRows = await sql`SELECT plate_id FROM registrations WHERE id = ${id}`;
          if (regRows.length > 0 && regRows[0].plate_id) {
            await sql`UPDATE plates SET status = 'available' WHERE id = ${regRows[0].plate_id}`;
          }
          await sql`DELETE FROM registrations WHERE id = ${id}`;
          console.log('[SYNC] Successfully deleted registration from cloud database:', id);

          const db = await readLocalDb();
          const reg = db.registrations.find(r => r.id === id);
          if (reg) {
            const plate = db.plates.find(p => p.id === reg.plate_id);
            if (plate) {
              plate.status = 'available';
            }
          }
          db.registrations = db.registrations.filter(r => r.id !== id);
          await writeLocalDb(db);
        } catch (dbErr: any) {
          console.error('[SYNC ERROR] Failed direct cloud delete for registration:', id, dbErr);
          throw new Error(`فشل حذف العملية من قاعدة البيانات السحابية: ${dbErr.message || dbErr}`);
        }
      } else {
        const db = await readLocalDb();
        const reg = db.registrations.find(r => r.id === id);
        if (reg) {
          const plate = db.plates.find(p => p.id === reg.plate_id);
          if (plate) {
            plate.status = 'available';
          }
          db.registrations = db.registrations.filter(r => r.id !== id);
          await writeLocalDb(db);
        }
      }

      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/stats', async (req, res) => {
    try {
      if (sql && !useLocalFallback) {
        try {
          const [{ count: totalStr }] = await sql`SELECT count(*) FROM plates`;
          const [{ count: usedStr }] = await sql`SELECT count(*) FROM registrations`;
          const [{ count: availStr }] = await sql`SELECT count(*) FROM plates WHERE status = 'available'`;
          const recent = await sql`SELECT * FROM registrations ORDER BY registration_date DESC LIMIT 10`;

          return res.json({
            total: parseInt(totalStr as string, 10),
            used: parseInt(usedStr as string, 10),
            available: parseInt(availStr as string, 10),
            recent: recent || [],
            databaseType: 'cloud'
          });
        } catch (dbErr) {
          console.warn('[DB STATS FALLBACK] Failed to read stats from cloud database, falling back to local file:', dbErr);
        }
      }

      const db = await readLocalDb();
      const total = db.plates.length;
      const used = db.registrations.length;
      const available = db.plates.filter(p => p.status === 'available').length;
      const sortedRegs = [...db.registrations].sort((a,b) => new Date(b.registration_date).getTime() - new Date(a.registration_date).getTime());
      const recent = sortedRegs.slice(0, 10);

      res.json({
        total,
        used,
        available,
        recent,
        databaseType: sql ? 'cloud_offline' : 'local'
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/seed', async (req, res) => {
    try {
      const samples = [
        { plate_number: '1234', plate_type: 'خصوصي' },
        { plate_number: '5678', plate_type: 'نقل' },
        { plate_number: '9101', plate_type: 'أجرة' },
        { plate_number: '1122', plate_type: 'حكومي' },
        { plate_number: '3344', plate_type: 'خصوصي' }
      ];

      const db = await readLocalDb();
      for (const s of samples) {
        const id = Math.floor(100000000 + Math.random() * 1000000000).toString();
        db.plates.push({
          id,
          plate_number: s.plate_number,
          plate_type: s.plate_type,
          received_date: new Date().toISOString(),
          status: 'available'
        });

        if (sql && !useLocalFallback) {
          try {
            await sql`INSERT INTO plates (id, plate_number, plate_type, status) VALUES (${id}, ${s.plate_number}, ${s.plate_type}, 'available')`;
          } catch (dbErr) {
            // Silently allow local-only fallback
          }
        }
      }
      await writeLocalDb(db);
      res.json({ message: 'Data seeded successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/sync', async (req, res) => {
    try {
      if (!sql) {
        return res.status(400).json({ error: 'لم يتم تهيئة رابط قاعدة البيانات السحابية (DATABASE_URL).' });
      }

      // Check database connection
      try {
        await sql`SELECT 1`;
      } catch (connErr) {
        return res.status(503).json({ error: 'عذراً! تعذر الاتصال بقاعدة البيانات السحابية الآن. تأكد من صحة الرابط واتصالك بالإنترنت.' });
      }

      const db = await readLocalDb();

      // Fetch only metadata/IDs first to perform high performance comparison
      const cloudPlatesMeta = await sql`SELECT id, plate_number, plate_type, status FROM plates`;
      const cloudRegsMeta = await sql`SELECT id, plate_id, owner_name, owner_phone, document_number FROM registrations`;

      const cloudPlatesMap = new Map();
      if (cloudPlatesMeta) {
        cloudPlatesMeta.forEach((p: any) => cloudPlatesMap.set(p.id, p));
      }

      const cloudRegsMap = new Map();
      if (cloudRegsMeta) {
        cloudRegsMeta.forEach((r: any) => cloudRegsMap.set(r.id, r));
      }

      // Find local plates that are either missing from cloud or have updated fields
      const platesToUpload = db.plates.filter(lp => {
        const cp = cloudPlatesMap.get(lp.id);
        if (!cp) return true;
        return cp.plate_number !== lp.plate_number || 
               cp.plate_type !== lp.plate_type || 
               cp.status !== lp.status;
      });

      // Find local registrations that are either missing from cloud or have updated fields
      const regsToUpload = db.registrations.filter(lr => {
        const cr = cloudRegsMap.get(lr.id);
        if (!cr) return true;
        return cr.plate_id !== lr.plate_id ||
               cr.owner_name !== lr.owner_name ||
               cr.owner_phone !== lr.owner_phone ||
               cr.document_number !== lr.document_number;
      });

      let platesSyncedCount = 0;
      let regsSyncedCount = 0;

      // 1. Sync Plating only if they actually changed
      const plateBatchSize = 10;
      for (let i = 0; i < platesToUpload.length; i += plateBatchSize) {
        const chunk = platesToUpload.slice(i, i + plateBatchSize);
        await Promise.all(chunk.map(async (plate) => {
          const recDate = plate.received_date ? new Date(plate.received_date) : new Date();
          await sql`
            INSERT INTO plates (id, plate_number, plate_type, received_date, status)
            VALUES (${plate.id}, ${plate.plate_number}, ${plate.plate_type}, ${recDate}, ${plate.status || 'available'})
            ON CONFLICT (id) DO UPDATE SET
              plate_number = EXCLUDED.plate_number,
              plate_type = EXCLUDED.plate_type,
              status = EXCLUDED.status,
              received_date = EXCLUDED.received_date
          `;
          platesSyncedCount++;
        }));
      }

      // 2. Sync Registrations only if they actually changed (substantially minimizing database network limits)
      const regBatchSize = 5;
      for (let i = 0; i < regsToUpload.length; i += regBatchSize) {
        const chunk = regsToUpload.slice(i, i + regBatchSize);
        await Promise.all(chunk.map(async (reg) => {
          const regDate = reg.registration_date ? new Date(reg.registration_date) : new Date();
          await sql`
            INSERT INTO registrations (
              id, plate_id, plate_number, plate_type, vehicle_type, vehicle_color, 
              model_year, chassis_number, engine_number, document_number, 
              owner_name, owner_phone, notes, registration_date,
              blood_type, id_type, id_number, issue_place, address,
              vehicle_make, vehicle_model, vehicle_shape, cylinders, fuel_type, customs_office,
              witness1_name, witness1_id, witness1_relation, witness1_phone, witness1_address,
              witness2_name, witness2_id, witness2_relation, witness2_phone, witness2_address,
              owner_photo, plate_photo
            ) VALUES (
              ${reg.id}, ${reg.plate_id}, ${reg.plate_number}, ${reg.plate_type}, ${reg.vehicle_type}, ${reg.vehicle_color}, 
              ${reg.model_year}, ${reg.chassis_number}, ${reg.engine_number}, ${reg.document_number}, 
              ${reg.owner_name}, ${reg.owner_phone}, ${reg.notes}, ${regDate},
              ${reg.blood_type}, ${reg.id_type}, ${reg.id_number}, ${reg.issue_place}, ${reg.address},
              ${reg.vehicle_make}, ${reg.vehicle_model}, ${reg.vehicle_shape}, ${reg.cylinders}, ${reg.fuel_type}, ${reg.customs_office},
              ${reg.witness1_name}, ${reg.witness1_id}, ${reg.witness1_relation}, ${reg.witness1_phone}, ${reg.witness1_address},
              ${reg.witness2_name}, ${reg.witness2_id}, ${reg.witness2_relation}, ${reg.witness2_phone}, ${reg.witness2_address},
              ${reg.owner_photo}, ${reg.plate_photo}
            )
            ON CONFLICT (id) DO UPDATE SET
              plate_id = EXCLUDED.plate_id,
              plate_number = EXCLUDED.plate_number,
              plate_type = EXCLUDED.plate_type,
              vehicle_type = EXCLUDED.vehicle_type,
              vehicle_color = EXCLUDED.vehicle_color,
              model_year = EXCLUDED.model_year,
              chassis_number = EXCLUDED.chassis_number,
              engine_number = EXCLUDED.engine_number,
              document_number = EXCLUDED.document_number,
              owner_name = EXCLUDED.owner_name,
              owner_phone = EXCLUDED.owner_phone,
              notes = EXCLUDED.notes,
              blood_type = EXCLUDED.blood_type,
              id_type = EXCLUDED.id_type,
              id_number = EXCLUDED.id_number,
              issue_place = EXCLUDED.issue_place,
              address = EXCLUDED.address,
              vehicle_make = EXCLUDED.vehicle_make,
              vehicle_model = EXCLUDED.vehicle_model,
              vehicle_shape = EXCLUDED.vehicle_shape,
              cylinders = EXCLUDED.cylinders,
              fuel_type = EXCLUDED.fuel_type,
              customs_office = EXCLUDED.customs_office,
              witness1_name = EXCLUDED.witness1_name,
              witness1_id = EXCLUDED.witness1_id,
              witness1_relation = EXCLUDED.witness1_relation,
              witness1_phone = EXCLUDED.witness1_phone,
              witness1_address = EXCLUDED.witness1_address,
              witness2_name = EXCLUDED.witness2_name,
              witness2_id = EXCLUDED.witness2_id,
              witness2_relation = EXCLUDED.witness2_relation,
              witness2_phone = EXCLUDED.witness2_phone,
              witness2_address = EXCLUDED.witness2_address,
              owner_photo = COALESCE(EXCLUDED.owner_photo, registrations.owner_photo),
              plate_photo = COALESCE(EXCLUDED.plate_photo, registrations.plate_photo)
          `;
          regsSyncedCount++;
        }));
      }

      // 3. Bidirectional pull: only pull records from cloud not present locally
      const missingPlateIds = [];
      if (cloudPlatesMeta) {
        for (const cp of cloudPlatesMeta) {
          if (!db.plates.some(p => p.id === cp.id)) {
            missingPlateIds.push(cp.id);
          }
        }
      }

      const missingRegIds = [];
      if (cloudRegsMeta) {
        for (const cr of cloudRegsMeta) {
          if (!db.registrations.some(r => r.id === cr.id)) {
            missingRegIds.push(cr.id);
          }
        }
      }

      let dbAltered = false;
      if (missingPlateIds.length > 0) {
        const pulledPlates = await sql`SELECT * FROM plates WHERE id IN (${missingPlateIds})`;
        for (const cp of pulledPlates) {
          db.plates.push({
            id: cp.id,
            plate_number: cp.plate_number,
            plate_type: cp.plate_type,
            received_date: cp.received_date,
            status: cp.status
          });
        }
        dbAltered = true;
      }

      if (missingRegIds.length > 0) {
        const pulledRegs = await sql`SELECT * FROM registrations WHERE id IN (${missingRegIds})`;
        for (const cr of pulledRegs) {
          db.registrations.push({
            id: cr.id,
            plate_id: cr.plate_id,
            plate_number: cr.plate_number,
            plate_type: cr.plate_type,
            vehicle_type: cr.vehicle_type,
            vehicle_color: cr.vehicle_color,
            model_year: cr.model_year,
            chassis_number: cr.chassis_number,
            engine_number: cr.engine_number,
            document_number: cr.document_number,
            owner_name: cr.owner_name,
            owner_phone: cr.owner_phone,
            notes: cr.notes,
            registration_date: cr.registration_date,
            blood_type: cr.blood_type,
            id_type: cr.id_type,
            id_number: cr.id_number,
            issue_place: cr.issue_place,
            address: cr.address,
            vehicle_make: cr.vehicle_make,
            vehicle_model: cr.vehicle_model,
            vehicle_shape: cr.vehicle_shape,
            cylinders: cr.cylinders,
            fuel_type: cr.fuel_type,
            customs_office: cr.customs_office,
            witness1_name: cr.witness1_name,
            witness1_id: cr.witness1_id,
            witness1_relation: cr.witness1_relation,
            witness1_phone: cr.witness1_phone,
            witness1_address: cr.witness1_address,
            witness2_name: cr.witness2_name,
            witness2_id: cr.witness2_id,
            witness2_relation: cr.witness2_relation,
            witness2_phone: cr.witness2_phone,
            witness2_address: cr.witness2_address,
            owner_photo: cr.owner_photo,
            plate_photo: cr.plate_photo
          });
        }
        dbAltered = true;
      }

      if (dbAltered) {
        await writeLocalDb(db);
      }

      res.json({
        success: true,
        platesSynced: platesSyncedCount,
        regsSynced: regsSyncedCount,
        message: 'تمت مزامنة البيانات السحابية والمحلية ثنائية الاتجاه بنجاح!'
      });
    } catch (err: any) {
      console.error('[SYNC ROUTE ERROR]:', err);
      res.status(500).json({ error: 'عذراً! فشلت المزامنة المتقدمة لسبب تقني: ' + err.message });
    }
  });

  app.get('/api/backup', async (req, res) => {
    try {
      const db = await readLocalDb();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=backup.json');
      res.send(JSON.stringify(db, null, 2));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- End API Routes ---

  // Run DB init asynchronously in the background so it never blocks Web interface boot
  getDBInit().catch(err => {
    console.error("Database async init failed:", err);
  });

  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const startVite = async () => {
      try {
        const viteModuleStr = 'vi' + 'te';
        const { createServer } = await import(viteModuleStr) as any;
        const vite = await createServer({
          server: { middlewareMode: true },
          appType: 'spa',
        });
        app.use(vite.middlewares);
        
        app.listen(PORT, '0.0.0.0', () => {
          console.log(`Development Server running on http://localhost:${PORT}`);
        });
      } catch (err) {
        console.error("Failed to start Vite dev middleware:", err);
      }
    };
    startVite();
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });

    if (!process.env.VERCEL) {
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Production Server running on http://localhost:${PORT}`);
      });
    }
  }

  export default app;
