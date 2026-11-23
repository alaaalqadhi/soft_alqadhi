/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Archive, 
  Car, 
  FileText, 
  Image,
  Settings, 
  LogOut, 
  Search, 
  PlusCircle,
  Clock,
  ShieldCheck,
  Shield,
  User,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
  Edit2,
  X,
  Database,
  ClipboardList,
  ClipboardCheck,
  ChevronLeft,
  ArrowRight,
  Plus,
  Save,
  SearchCode,
  TrendingUp,
  UserCheck,
  Lock as LockIcon,
  Menu,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Maximize2,
  Minimize2,
  RotateCw,
  ClipboardPaste,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { AIScannerModal } from './components/AIScannerModal';
import { PhotoCaptureInput } from './components/PhotoCaptureInput';

// Types
type MenuChoice = 'register' | 'full_archive' | 'reports' | 'home';

interface Registration {
  id: string;
  plate_id?: string | null;
  vehicle_type: string;
  vehicle_color: string;
  model_year: string;
  chassis_number: string;
  engine_number: string;
  document_number: string;
  owner_name: string;
  owner_phone: string;
  notes: string;
  registration_date: string;
  blood_type?: string;
  id_type?: string;
  id_number?: string;
  issue_place?: string;
  address?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_shape?: string;
  cylinders?: string;
  fuel_type?: string;
  customs_office?: string;
  witness1_name?: string;
  witness1_id?: string;
  witness1_relation?: string;
  witness1_phone?: string;
  witness1_address?: string;
  witness2_name?: string;
  witness2_id?: string;
  witness2_relation?: string;
  witness2_phone?: string;
  witness2_address?: string;
  plate_number?: string;
  plate_type?: string;
  owner_photo?: string;
  plate_photo?: string;
}

interface Stats {
  total: number;
  used: number;
  available: number;
  privateCount?: number;
  transportCount?: number;
  recent: Registration[];
  databaseType?: 'cloud' | 'local' | 'cloud_offline';
}

const getFriendlyErrorMessage = (err: any, fallback: string = 'حدث خطأ غير متوقع'): string => {
  const msg = err?.message || String(err);
  if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('networkerror') || msg.toLowerCase().includes('websocket')) {
    return 'تعذر الاتصال بقاعدة البيانات. يرجى التحقق من اتصال الإنترنت لديك أو المحاولة بعد لحظات.';
  }
  return msg || fallback;
};

function ScrollingTicker() {
  const welcomeMsg = "المهندس علاء القاضي - مرحبآ بك في نظام مصلحة الجمارك - جمارك محافظة تعز";
  return (
    <div className="bg-slate-900 text-white/70 py-3 overflow-hidden whitespace-nowrap relative z-[60] border-b border-white/5 no-print">
      <div className="flex animate-ticker items-center gap-24">
        <span className="text-xl font-black flex items-center gap-4 text-white">
          <ShieldCheck className="w-6 h-6 text-primary-400" />
          الأرشفة الرقمية للجنة الجمارك
        </span>
        <span className="text-xl font-black text-white/30">|</span>
        <span className="text-xl font-black text-primary-400 font-mono tracking-tighter uppercase">Technically Supervised by Eng. Ala'a Al-Qadhi</span>
        <span className="text-xl font-black text-white/30">|</span>
        <span className="text-lg font-bold tracking-tight">جمارك محافظة تعز - فرع الإصدار والترقيم الرقمي</span>
        <span className="text-xl font-black text-white/30">|</span>
        <span className="text-xl font-black flex items-center gap-4">
          <Clock className="w-8 h-8 text-primary-500/50" />
          {new Date().toLocaleDateString('ar-YE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>
    </div>
  );
}

// Sidebar Component
function Sidebar({ activeTab, setActiveTab, onLogout, isCollapsed, setIsCollapsed }: { 
  activeTab: MenuChoice, 
  setActiveTab: (t: MenuChoice) => void,
  onLogout: () => void,
  isCollapsed: boolean,
  setIsCollapsed: (c: boolean) => void
}) {
  const menuItems = [
    { id: 'home', label: 'الرئيسية', icon: ShieldCheck },
    { id: 'register', label: 'ترقيم جديد', icon: PlusCircle },
    { id: 'full_archive', label: 'البحث والتدقيق', icon: Search },
    { id: 'reports', label: 'الإحصائيات', icon: FileText },
  ];

  return (
    <aside className={`glass-dark text-slate-300 flex flex-col h-screen no-print shrink-0 relative z-[70] border-l-0 transition-all duration-300 ${
      isCollapsed ? 'w-0 md:w-20 overflow-hidden' : 'w-80'
    }`}>
      <div className={`p-10 pb-6 transition-all duration-300 ${isCollapsed ? 'px-4 py-6 flex justify-center' : ''}`}>
        <div className="flex items-center gap-5 group cursor-default">
          <button 
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(14,165,233,0.3)] transition-all hover:scale-110 shrink-0"
            title={isCollapsed ? "توسيع القائمة" : "طي القائمة"}
          >
            <ShieldCheck className="w-7 h-7 text-white" />
          </button>
          {!isCollapsed && (
            <div className="animate-in fade-in duration-300 overflow-hidden whitespace-nowrap">
              <h1 className="text-xl font-black tracking-tight text-white leading-tight">نظام الأرشفة</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">لجنة ترقيم الجمارك</p>
            </div>
          )}
        </div>
      </div>

      <nav className={`flex-1 py-10 space-y-3 transition-all duration-300 ${isCollapsed ? 'px-3' : 'px-6'}`}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id as MenuChoice)}
            title={item.label}
            className={`w-full flex items-center transition-all duration-300 group relative overflow-hidden ${
              isCollapsed ? 'justify-center p-4 rounded-xl' : 'gap-5 px-6 py-4 rounded-2xl'
            } ${
              activeTab === item.id 
                ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20' 
                : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <item.icon className={`w-6 h-6 transition-transform duration-300 shrink-0 ${activeTab === item.id ? 'scale-110 text-primary-400' : 'group-hover:scale-110 group-hover:text-white'}`} />
            {!isCollapsed && (
              <span className="font-black text-base animate-in fade-in duration-350 overflow-hidden whitespace-nowrap">{item.label}</span>
            )}
            {activeTab === item.id && !isCollapsed && (
              <motion.div 
                layoutId="activeTabIndicator"
                className="absolute right-0 top-1/4 bottom-1/4 w-1 bg-primary-500 rounded-l-full shadow-[0_0_10px_rgba(14,165,233,0.8)]"
              />
            )}
          </button>
        ))}
      </nav>

      <div className={`space-y-6 transition-all duration-300 ${isCollapsed ? 'p-4' : 'p-8'}`}>
        {!isCollapsed ? (
          <div className="p-5 rounded-3xl bg-white/5 border border-white/5 space-y-4 animate-in fade-in duration-300">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-black text-sm border border-primary-500/30">
                  مـ
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-white">المهندس علاء</span>
                  <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">المشرف الفني</span>
                </div>
             </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-black text-sm border border-primary-500/30" title="المهندس علاء القاضي - المشرف الفني">
              مـ
            </div>
          </div>
        )}
        
        <button 
          type="button"
          onClick={onLogout}
          title="تسجيل الخروج"
          className={`flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all font-black group ${
            isCollapsed ? 'w-12 h-12 rounded-xl mx-auto' : 'w-full gap-3 px-6 py-4 rounded-2xl text-sm'
          }`}
        >
          <LogOut className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          {!isCollapsed && <span className="animate-in fade-in duration-300 overflow-hidden whitespace-nowrap">تسجيل الخروج</span>}
        </button>
      </div>
    </aside>
  );
}

function StatCard({ label, value, icon: Icon, trend, color }: any) {
  return (
    <div className="card-premium p-8 rounded-5xl group relative overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color} bg-opacity-10 border border-current border-opacity-20 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
          <Icon className={`w-7 h-7 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</div>
      </div>
      <div className="flex items-end justify-between relative z-10">
        <div className="text-5xl font-black text-slate-800 font-mono tracking-tighter tabular-nums">{value.toLocaleString()}</div>
        {trend && (
          <div className="flex flex-col items-end">
            <span className="text-xs font-black text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 mb-1">{trend}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">معدل النمو</span>
          </div>
        )}
      </div>
      {/* Decorative tech line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-slate-100 to-transparent opacity-50" />
    </div>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<MenuChoice>('home');
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  
  // Auto collapse sidebar on all pages to give full width on simulated frame/device
  useEffect(() => {
    setIsSidebarCollapsed(true);
  }, [activeTab]);
  
  useEffect(() => {
    const savedLogin = localStorage.getItem('isLoggedIn');
    if (savedLogin === 'true') {
      setIsLoggedIn(true);
    }
    setLoading(false);
    sanitizeStylesheets();
  }, []);

  const fetchData = useCallback(async (silent: boolean = false) => {
    if (!isLoggedIn) return;
    if (!silent) setLoading(true);
    setFetchError(null);
    try {
      const [regsResult, statsResult] = await Promise.allSettled([
        fetch('/api/registrations?summary=1', { cache: 'no-store' }),
        fetch('/api/stats', { cache: 'no-store' })
      ]);

      let regsData: Registration[] | null = null;
      if (regsResult.status === 'fulfilled' && regsResult.value.ok) {
        const parsed = await regsResult.value.json();
        if (Array.isArray(parsed)) {
          regsData = parsed;
          setRegistrations(parsed);
        }
      }

      let statsData: Stats | null = null;
      if (statsResult.status === 'fulfilled' && statsResult.value.ok) {
        statsData = await statsResult.value.json();
        setStats(statsData);
      } else if (regsData) {
        setStats({
          total: regsData.length,
          used: regsData.length,
          available: 0,
          privateCount: regsData.filter(r => r.plate_type === 'خصوصي').length,
          transportCount: regsData.filter(r => r.plate_type === 'نقل').length,
          recent: regsData.slice(0, 10)
        });
      }

      if (!regsData && !statsData) {
        throw new Error('فشل تحميل البيانات من الخادم أو تعذر الاتصال بالخدمات');
      }
    } catch (err: any) {
      let friendlyMessage = err.message || 'حدث خطأ في الاتصال بقاعدة البيانات';
      if (friendlyMessage.toLowerCase().includes('failed to fetch') || friendlyMessage.toLowerCase().includes('networkerror') || friendlyMessage.toLowerCase().includes('websocket')) {
        friendlyMessage = 'جاري الاتصال بقاعدة البيانات ومزامنة الملفات (سيتم التحديث تلقائياً خلال ثوانٍ...)';
      }
      setFetchError(friendlyMessage);
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (isLoggedIn && (activeTab === 'home' || activeTab === 'full_archive' || activeTab === 'reports')) {
      fetchData(true);
    }
  }, [activeTab, isLoggedIn, fetchData]);

  // Self-healing background auto-retry loop for robust operation during hot reloads/reboots
  useEffect(() => {
    if (!fetchError || !isLoggedIn) return;
    
    const timer = setTimeout(() => {
      console.log('Auto-retrying database synchronization...');
      fetchData();
    }, 4500);
    
    return () => clearTimeout(timer);
  }, [fetchError, fetchData, isLoggedIn]);

  const onLogout = () => {
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
     return (
       <div className="flex flex-col min-h-screen bg-slate-950 selection:bg-primary-500 selection:text-white" dir="rtl">
         <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary-900/20 rounded-full blur-[200px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
         <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[150px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />
         <div className="relative z-10 flex flex-col min-h-screen">
           <ScrollingTicker />
           <div className="flex-1 flex flex-col justify-center py-12 px-6">
              <LoginView onLogin={() => setIsLoggedIn(true)} />
           </div>
         </div>
       </div>
     );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-900 selection:bg-primary-500 selection:text-white" dir="rtl">
      <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-primary-100/50 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-slate-200/30 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      
      {selectedReg && <CertificateModal registration={selectedReg} onClose={() => setSelectedReg(null)} />}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={onLogout} 
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={setIsSidebarCollapsed} 
      />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        <ScrollingTicker />
        
        <header className="h-24 glass-light border-b border-slate-200/50 flex items-center justify-between px-6 md:px-12 shrink-0 no-print z-50">
          <div className="flex items-center gap-4 md:gap-6">
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-500 hover:text-primary-500 hover:border-primary-100 shadow-sm transition-all focus:outline-none shrink-0"
              title={isSidebarCollapsed ? "توسيع القائمة" : "طي القائمة"}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
              {activeTab === 'home' ? 'نظرة عامة' : 
               activeTab === 'register' ? 'ترقيم مركبة' : 
               activeTab === 'full_archive' ? 'قاعة البيانات' : 
               'التحليل الرقمي'}
            </h2>
            <div className="w-[1.5px] h-8 bg-slate-200 rounded-full" />
             <div className="flex items-center gap-3 text-slate-400 font-black text-xs bg-slate-100/50 px-4 py-2 rounded-full border border-slate-200/50">
              <div className={`w-2 h-2 rounded-full animate-pulse ${stats?.databaseType === 'cloud' ? 'bg-emerald-500' : stats?.databaseType === 'cloud_offline' ? 'bg-rose-500' : 'bg-amber-500'}`} />
              {stats?.databaseType === 'cloud' ? 'قاعدة البيانات السحابية متصلة ومزامنة' : stats?.databaseType === 'cloud_offline' ? 'السحابة غير متصلة (التعديلات محفوظة محلياً)' : 'الوضع المحلي نشط (الرجاء مزامنة البيانات)'}
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="text-left">
                <p className="text-sm font-black text-slate-800">صادق القاضي</p>
                <p className="text-[9px] font-black text-primary-500 uppercase tracking-widest">إدارة المركز</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm transition-all hover:border-primary-300 hover:text-primary-500 cursor-pointer">
                <Settings className="w-6 h-6" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar p-0">
          <AnimatePresence mode="wait">
            {activeTab === 'home' ? (
              <motion.div 
                key="home"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-4 md:p-10 space-y-6 md:space-y-8"
              >
                <div className="flex flex-col gap-10">
                  {/* قسم التحليل اليومي - أصبح بانل عرضي علوي */}
                  <div className="card-premium bg-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden group shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-primary-600/10 blur-[120px] -mr-40" />
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-12 items-center">
                      <div className="lg:col-span-1 space-y-4">
                        <div className="w-20 h-20 bg-primary-500 rounded-3xl flex items-center justify-center shadow-[0_20px_40px_rgba(14,165,233,0.3)]">
                          <TrendingUp className="w-10 h-10 text-white" />
                        </div>
                        <div>
                          <h3 className="text-4xl font-black tracking-tight">التحليـل الفنـي</h3>
                          <p className="text-white/60 font-black text-[10px] uppercase tracking-[0.2em] mt-1">Technical Daily Insight</p>
                        </div>
                      </div>

                      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-8 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-md hover:bg-white/10 transition-all">
                          <span className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">إجمالي المركبات المرقمة</span>
                          <div className="flex items-end gap-3">
                            <span className="text-5xl font-black tabular-nums">{stats?.used ?? registrations.length}</span>
                            <span className="text-xs font-black text-slate-600 pb-2 uppercase">Ops</span>
                          </div>
                          <div className="mt-6 w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: '75%' }}
                               transition={{ duration: 1.5, ease: "easeOut" }}
                               className="h-full bg-primary-500 rounded-full" 
                            />
                          </div>
                        </div>
                        <div className="p-8 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all">
                          <span className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">لوحات خصوصي</span>
                          <div className="flex items-end gap-3">
                             <span className="text-4xl font-black text-primary-400 tabular-nums">{stats?.privateCount ?? registrations.filter(r => r.plate_type === 'خصوصي').length}</span>
                             <span className="text-xs font-black text-slate-600 pb-1.5 opacity-50 italic">Private</span>
                          </div>
                        </div>
                        <div className="p-8 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all">
                          <span className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">لوحات نقل</span>
                          <div className="flex items-end gap-3">
                             <span className="text-4xl font-black text-rose-400 tabular-nums">{stats?.transportCount ?? registrations.filter(r => r.plate_type === 'نقل').length}</span>
                             <span className="text-xs font-black text-slate-600 pb-1.5 opacity-50 italic">Transport</span>
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-1">
                        <button 
                          onClick={() => setActiveTab('reports')}
                          className="w-full py-6 bg-primary-500 text-white rounded-3xl font-black shadow-[0_20px_50px_rgba(14,165,233,0.3)] hover:bg-primary-600 transition-all flex items-center justify-center gap-4 active:scale-[0.98] text-xl group/btn"
                        >
                          <FileText className="w-7 h-7 group-hover:scale-110 transition-transform" />
                          عرض التقرير
                        </button>
                      </div>
                    </div>
                    <ShieldCheck className="absolute -bottom-20 -left-20 w-80 h-80 text-white/5 rotate-12 group-hover:scale-110 transition-transform duration-1000" />
                  </div>

                  {/* قسم النشاطات واللجنة - عريض بالكامل */}
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    <div className="xl:col-span-8 card-shadow bg-white rounded-[3rem] p-10 border border-slate-100">
                      <div className="flex items-center justify-between mb-10 pb-8 border-b border-slate-50">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600">
                             <Clock className="w-7 h-7" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-slate-800">أحدث عمليات الترقيم المؤرشفة</h3>
                            <p className="text-slate-400 font-bold text-sm">سجل فوري ومحدث لكافة البيانات الصادرة</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setActiveTab('full_archive')}
                          className="px-8 py-3 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-black transition-all shadow-lg shadow-slate-200"
                        >
                          عرض الأرشيف الشامل
                        </button>
                      </div>

                      <div className="space-y-4">
                        {(() => {
                          const recentSource = stats?.recent && stats.recent.length > 0 ? stats.recent : registrations;
                          return recentSource.length > 0 ? recentSource.slice(0, 5).map((reg) => (
                          <div key={reg.id} className="flex items-center justify-between p-6 rounded-[2rem] bg-slate-50/50 hover:bg-white hover:card-shadow transition-all border border-transparent hover:border-slate-100 group">
                            <div className="flex items-center gap-6">
                              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 group-hover:border-primary-100 transition-all">
                                <Car className="w-8 h-8 text-primary-600" />
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-xl font-black text-slate-800">
                                  {reg.vehicle_type} <span className="mx-2 text-slate-200">|</span> <span className="text-primary-700 font-mono tracking-tighter text-2xl" dir="ltr">{reg.plate_number}-4</span>
                                </h4>
                                <div className="flex items-center gap-4">
                                   <span className="text-xs font-black text-slate-400 flex items-center gap-2 uppercase tracking-wide">
                                      <User className="w-3.5 h-3.5" />
                                      {reg.owner_name}
                                   </span>
                                   <span className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                                   <span className="text-xs font-black text-slate-400 flex items-center gap-2 font-mono">
                                      <Clock className="w-3.5 h-3.5" />
                                      {new Date(reg.registration_date).toLocaleDateString('ar-YE', { day: 'numeric', month: 'short' })}
                                   </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                               <div className="px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black border border-emerald-100 flex items-center gap-2">
                                  <CheckCircle2 className="w-4 h-4" />
                                  موثق ومقيد
                               </div>
                               <button 
                                 onClick={() => setSelectedReg(reg)}
                                 className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary-600 hover:border-primary-200 transition-all hover:bg-primary-50 shadow-sm"
                                 title="عرض الإستمارة"
                               >
                                  <FileText className="w-6 h-6" />
                               </button>
                            </div>
                          </div>
                        )) : (
                          <div className="py-24 text-center bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm mb-6">
                              <Database className="w-10 h-10 text-slate-200" />
                            </div>
                            <p className="text-slate-400 font-black text-lg italic">لا توجد عمليات مقيدة حالياً في قاعدة البيانات</p>
                            <button 
                             onClick={() => setActiveTab('register')}
                             className="mt-6 px-10 py-4 bg-primary-600 text-white rounded-[1.5rem] font-black shadow-2xl shadow-primary-100 hover:bg-primary-700 transition-all active:scale-95"
                            >
                              إبدأ عملية تقييد جديدة
                            </button>
                          </div>
                        );
                        })()}
                      </div>
                    </div>

                    <div className="xl:col-span-4 space-y-8">
                       <div className="card-shadow bg-white rounded-[3rem] p-10 border border-slate-100 h-full flex flex-col justify-between">
                          <div className="space-y-10">
                            <div className="flex items-center gap-5">
                               <div className="w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center text-white shadow-xl">
                                  <UserCheck className="w-7 h-7" />
                               </div>
                               <div>
                                  <h4 className="text-xl font-black text-slate-800">إشراف اللجنة الفنية</h4>
                                  <p className="text-slate-400 text-xs font-bold mt-0.5">الرقابة والتدقيق الجمركي</p>
                               </div>
                            </div>

                            <div className="space-y-4">
                               <div className="flex items-center gap-5 p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:border-primary-200 transition-colors group">
                                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary-600 font-bold border border-slate-100 group-hover:scale-110 transition-transform">مـ</div>
                                  <div>
                                     <p className="text-base font-black text-slate-700">المهندس علاء القاضي</p>
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">رئيس اللجنة الفنية</p>
                                  </div>
                               </div>
                               <div className="flex items-center gap-5 p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:border-primary-200 transition-colors group">
                                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary-600 font-bold border border-slate-100 group-hover:scale-110 transition-transform">صـ</div>
                                  <div>
                                     <p className="text-base font-black text-slate-700">صادق القاضي</p>
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">مدير عام الترقيم</p>
                                  </div>
                               </div>
                            </div>
                          </div>

                          <div className="pt-10 space-y-6">
                             <div className="p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                <p className="text-xs font-bold text-slate-500 leading-relaxed text-center">
                                  يتم تدقيق كافة البيانات الفنية للمركبات قبل مطابقتها مع اللوحات الرسمية لضمان سلامة الأرشفة الوطنية.
                                </p>
                             </div>
                             <button 
                               onClick={() => setActiveTab('reports')}
                               className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black hover:bg-black transition-all flex items-center justify-center gap-3 shadow-2xl shadow-slate-200 active:scale-95"
                             >
                               <Settings className="w-6 h-6" />
                               إدارة إعدادات النظام
                             </button>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full min-h-full bg-slate-50 flex flex-col"
              >
                <div className="flex-1 p-4 md:p-10">
                   {loading && !fetchError && (
                    <div className="no-print absolute top-8 left-8 z-[60]">
                      <div className="bg-primary-600 text-white px-5 py-2 rounded-full flex items-center gap-3 shadow-xl animate-bounce">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-[10px] font-black tracking-widest uppercase">جاري التزامن...</span>
                      </div>
                    </div>
                  )}

                  {fetchError && (
                    <div className="no-print absolute top-8 left-8 z-[60]">
                      <div className="bg-red-600/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl flex flex-col md:flex-row items-center gap-4 shadow-xl border border-red-500/50 animate-in fade-in zoom-in max-w-sm">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-red-100 shrink-0" />
                          <span className="text-xs font-bold leading-relaxed">{fetchError}</span>
                        </div>
                        <button 
                          onClick={() => fetchData()}
                          disabled={loading}
                          className="bg-white/10 hover:bg-white/25 active:scale-95 text-white text-[10px] font-black px-3 py-1.5 rounded-lg border border-white/20 transition-all cursor-pointer whitespace-nowrap self-stretch md:self-auto text-center"
                        >
                          {loading ? 'جاري المحاولة...' : 'إعادة المحاولة'}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="h-full custom-scrollbar">
                    {activeTab === 'register' && <RegistrationView onRefresh={fetchData} />}
                    {activeTab === 'full_archive' && <FullArchiveView registrations={registrations} onRefresh={fetchData} />}
                    {activeTab === 'reports' && <ReportsView stats={stats} registrations={registrations} />}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function LoginView({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('صادق القاضي');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (username === 'صادق القاضي' && password === 'صادق القاضي') {
        localStorage.setItem('isLoggedIn', 'true');
        onLogin();
      } else {
        setError('بيانات الدخول الأمنية غير متطابقة. يرجى مراجعة المسؤول.');
      }
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء محاولة تسجيل الدخول.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center font-sans py-20 relative overflow-hidden" dir="rtl">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-[480px] w-full bg-slate-900 border border-white/5 rounded-[4rem] p-16 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.7)] relative z-10"
      >
          <div className="flex justify-center mb-16">
            <div className="w-24 h-24 bg-primary-500 rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_50px_rgba(14,165,233,0.3)] rotate-3">
              <ShieldCheck className="w-12 h-12 text-white" />
            </div>
          </div>

          <div className="text-center mb-16 space-y-4">
            <h1 className="text-4xl font-black text-white tracking-tighter leading-tight">بوابـة الدخـول</h1>
            <p className="text-slate-500 font-black text-xs uppercase tracking-[0.3em]">نظام أرشفة الترقيم - محافظة تعز</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl flex items-center gap-4 text-red-500 text-sm font-black"
                >
                  <AlertCircle className="w-6 h-6 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.25em] mr-6">الهوية الرقمية</label>
                <div className="relative group/field">
                   <User className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-600 group-focus-within/field:text-primary-500 transition-colors" />
                   <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-800/40 border-2 border-transparent p-6 pr-16 rounded-[2rem] text-white font-black placeholder:text-slate-700 outline-none focus:border-primary-500/20 focus:bg-slate-800 transition-all text-lg"
                    placeholder="اسم المستخدم..."
                   />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.25em] mr-6">مفتاح الدخول</label>
                <div className="relative group/field">
                   <LockIcon className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-600 group-focus-within/field:text-primary-500 transition-colors" />
                   <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-800/40 border-2 border-transparent p-6 pr-16 rounded-[2rem] text-white font-black placeholder:text-slate-700 outline-none focus:border-primary-500/20 focus:bg-slate-800 transition-all font-mono text-lg"
                    placeholder="••••••••"
                   />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 text-white p-6 rounded-3xl font-black text-xl hover:bg-primary-600 transition-all shadow-[0_20px_60px_rgba(14,165,233,0.3)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-5 group/btn"
            >
              {loading ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : (
                <>
                  <Database className="w-7 h-7 group-hover:scale-110 transition-transform" />
                  اتصـال بالخـادم
                </>
              )}
            </button>
          </form>

          <footer className="mt-16 text-center">
             <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em]">DESIGNED BY ENG. ALA'A AL-QADHI</p>
          </footer>
        </motion.div>
    </div>
  );
}



// Helper to convert OKLAB color to RGB/RGBA for html2canvas compatibility
function oklabToRgb(l: number, aComponent: number, bComponent: number, a: number = 1): string {
  // 1. Convert Oklab to LMS space
  const l_ = l + 0.3963377774 * aComponent + 0.2158037573 * bComponent;
  const m_ = l - 0.1055613458 * aComponent - 0.0638541728 * bComponent;
  const s_ = l - 0.0894841775 * aComponent - 1.2914855414 * bComponent;
  
  // 2. Transform non-linear LMS to linear LMS
  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;
  
  // 3. Convert LMS to linear RGB
  const rL = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const gL = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const bL = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;
  
  // 4. Convert linear RGB to standard sRGB (with gamma correction)
  const fn = (cVal: number) => {
    const abs = Math.abs(cVal);
    const converted = abs > 0.0031308 ? 1.055 * Math.pow(abs, 1 / 2.4) - 0.055 : 12.92 * abs;
    return Math.sign(cVal) * converted;
  };
  
  const r = Math.max(0, Math.min(255, Math.round(fn(rL) * 255)));
  const g = Math.max(0, Math.min(255, Math.round(fn(gL) * 255)));
  const b = Math.max(0, Math.min(255, Math.round(fn(bL) * 255)));
  
  return a === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a})`;
}

// Helper to convert OKLCH color to RGB/RGBA for html2canvas compatibility
function oklchToRgb(l: number, c: number, h: number, a: number = 1): string {
  // Convert cylindrical coords to Cartesian (aComponent, bComponent)
  const hRad = (h * Math.PI) / 180;
  const aComponent = c * Math.cos(hRad);
  const bComponent = c * Math.sin(hRad);
  return oklabToRgb(l, aComponent, bComponent, a);
}

// Unified parser to find and replace both oklch and oklab definitions in style strings, handled with deep nested parentheses safety.
function replaceUnsupportedColors(cssText: string): string {
  if (!cssText) return cssText;

  let pos = 0;
  let result = '';
  
  while (pos < cssText.length) {
    // Look for the next occurrence of "oklch(" or "oklab(" (case insensitive)
    const nextOklch = cssText.toLowerCase().indexOf('oklch(', pos);
    const nextOklab = cssText.toLowerCase().indexOf('oklab(', pos);
    
    let nextIdx = -1;
    let isOklab = false;
    
    if (nextOklch !== -1 && nextOklab !== -1) {
      if (nextOklch < nextOklab) {
        nextIdx = nextOklch;
        isOklab = false;
      } else {
        nextIdx = nextOklab;
        isOklab = true;
      }
    } else if (nextOklch !== -1) {
      nextIdx = nextOklch;
      isOklab = false;
    } else if (nextOklab !== -1) {
      nextIdx = nextOklab;
      isOklab = true;
    }
    
    if (nextIdx === -1) {
      // No more occurrences
      result += cssText.slice(pos);
      break;
    }
    
    // Add text up to the color function
    result += cssText.slice(pos, nextIdx);
    
    // Scan for matching closing parenthesis
    const startOffset = 6; // length of 'oklch(' or 'oklab(' are both 6 characters
    let depth = 1;
    let i = nextIdx + startOffset;
    
    while (i < cssText.length && depth > 0) {
      if (cssText[i] === '(') {
        depth++;
      } else if (cssText[i] === ')') {
        depth--;
      }
      i++;
    }
    
    const content = cssText.slice(nextIdx + startOffset, i - 1);
    
    // Now we replace this full matched block
    let replacement = 'rgb(255, 255, 255)'; // Safe fallback
    
    try {
      if (isOklab) {
        // oklab parse
        const cleanContent = content.replace(/,/g, ' ');
        const parts = cleanContent.trim().split(/\s+/).filter(Boolean);
        if (parts.length >= 3) {
          const lStr = parts[0];
          const aStrVal = parts[1];
          const bStrVal = parts[2];
          let l = lStr.endsWith('%') ? parseFloat(lStr) / 100 : parseFloat(lStr);
          let aComp = parseFloat(aStrVal);
          let bComp = parseFloat(bStrVal);
          
          let a = 1;
          if (parts.length >= 4) {
            const aStr = parts[3].trim();
            if (aStr !== '/' && !aStr.includes('var(')) {
              a = aStr.endsWith('%') ? parseFloat(aStr) / 100 : parseFloat(aStr);
            }
          }
          if (content.includes('/')) {
            const alphaSplit = content.split('/');
            const aStr = alphaSplit[alphaSplit.length - 1].trim();
            if (!aStr.includes('var(')) {
              a = aStr.endsWith('%') ? parseFloat(aStr) / 100 : parseFloat(aStr);
            }
          }
          
          if (!isNaN(l) && !isNaN(aComp) && !isNaN(bComp) && !isNaN(a)) {
            replacement = oklabToRgb(l, aComp, bComp, a);
          }
        }
      } else {
        // oklch parse
        const cleanContent = content.replace(/,/g, ' ');
        const parts = cleanContent.trim().split(/\s+/).filter(Boolean);
        if (parts.length >= 3) {
          const lStr = parts[0];
          const cStr = parts[1];
          const hStr = parts[2];
          let l = lStr.endsWith('%') ? parseFloat(lStr) / 100 : parseFloat(lStr);
          let c = parseFloat(cStr);
          let h = parseFloat(hStr);
          
          let a = 1;
          if (parts.length >= 4) {
            const aStr = parts[3].trim();
            if (aStr !== '/' && !aStr.includes('var(')) {
              a = aStr.endsWith('%') ? parseFloat(aStr) / 100 : parseFloat(aStr);
            }
          }
          if (content.includes('/')) {
            const alphaSplit = content.split('/');
            const aStr = alphaSplit[alphaSplit.length - 1].trim();
            if (!aStr.includes('var(')) {
              a = aStr.endsWith('%') ? parseFloat(aStr) / 100 : parseFloat(aStr);
            }
          }
          
          if (!isNaN(l) && !isNaN(c) && !isNaN(h) && !isNaN(a)) {
            replacement = oklchToRgb(l, c, h, a);
          }
        }
      }
    } catch (err) {
      replacement = 'rgb(255, 255, 255)';
    }
    
    result += replacement;
    pos = i;
  }
  
  return result;
}

// Global monkey-patches to convert oklch/oklab to standard sRGB/RGBA value lookups to shield html2canvas from unparsed modern colors
try {
  if (typeof window !== 'undefined' && window.getComputedStyle) {
    const originalGetComputedStyle = window.getComputedStyle;
    (window as any).getComputedStyle = function (el: Element, pseudoElt?: string | null) {
      const style = originalGetComputedStyle(el, pseudoElt);
      return new Proxy(style, {
        get(target, prop, receiver) {
          if (prop === '__target__') {
            return target;
          }
          if (prop === 'getPropertyValue') {
            return function (propertyName: string) {
              const val = target.getPropertyValue(propertyName);
              if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
                try {
                  return replaceUnsupportedColors(val);
                } catch (e) {
                  return 'rgb(255, 255, 255)';
                }
              }
              return val;
            };
          }
          // Do NOT pass receiver here to prevent "Illegal invocation" on native getter properties (e.g., .color, .length, etc.)
          const val = Reflect.get(target, prop);
          if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
            try {
              return replaceUnsupportedColors(val);
            } catch (e) {
              return 'rgb(255, 255, 255)';
            }
          }
          if (typeof val === 'function') {
            return val.bind(target);
          }
          return val;
        }
      });
    };
  }
} catch (e) {
  console.error('Failed to patch getComputedStyle:', e);
}

try {
  if (typeof CSSStyleDeclaration !== 'undefined' && CSSStyleDeclaration.prototype) {
    const originalGetPropertyValue = CSSStyleDeclaration.prototype.getPropertyValue;
    CSSStyleDeclaration.prototype.getPropertyValue = function(propertyName: string) {
      try {
        const context = (this as any)?.__target__ || this;
        const val = originalGetPropertyValue.call(context, propertyName);
        if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
          try {
            return replaceUnsupportedColors(val);
          } catch (e) {
            return 'rgb(255, 255, 255)';
          }
        }
        return val;
      } catch (e) {
        // Fallback to empty string for safety if any illegal invocation or issue occurs
        return '';
      }
    };
  }
} catch (e) {
  console.error('Failed to patch CSSStyleDeclaration.prototype.getPropertyValue:', e);
}

// Asynchronously sanitizes all document style tags and same-origin link stylesheets
// to convert unsupported CSS colors like oklch and oklab into rgb/rgba formats.
async function sanitizeStylesheets() {
  try {
    // 1. Process current style elements
    const styles = document.querySelectorAll('style');
    styles.forEach(s => {
      if (s.textContent && (s.textContent.includes('oklch') || s.textContent.includes('oklab'))) {
        s.textContent = replaceUnsupportedColors(s.textContent);
      }
    });

    // 2. Process stylesheet links sharing the same origin in parallel with a timeout to prevent hanging
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    const linksPromise = Array.from(links).map(async (linkNode) => {
      const link = linkNode as HTMLLinkElement;
      if (!link.href) return;
      try {
        const url = new URL(link.href);
        if (url.origin === window.location.origin) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1000); // 1-second timeout
          
          const res = await fetch(link.href, { signal: controller.signal });
          clearTimeout(timeoutId);
          
          if (res.ok) {
            const cssText = await res.text();
            if (cssText.includes('oklch') || cssText.includes('oklab')) {
              const cleanedCss = replaceUnsupportedColors(cssText);
              const styleEl = document.createElement('style');
              styleEl.textContent = cleanedCss;
              styleEl.setAttribute('data-sanitized-from', link.href);
              link.parentNode?.replaceChild(styleEl, link);
            }
          }
        }
      } catch (innerErr) {
        // Silent catch to prevent download blocks
      }
    });

    await Promise.all(linksPromise);
  } catch (err) {
    console.error('Error during styles sanitization:', err);
  }
}

// Safely copy computed sRGB/RGBA styles as inline styles to bypass Tailwind CSS v4 oklch/oklab parsing bugs in html2canvas
function copyStyles(src: HTMLElement, dest: HTMLElement) {
  try {
    const computed = window.getComputedStyle(src);
    for (let i = 0; i < computed.length; i++) {
      const prop = computed[i];
      let val = computed.getPropertyValue(prop);
      if (val) {
        if (val.includes('oklch') || val.includes('oklab')) {
          val = replaceUnsupportedColors(val);
        }
        dest.style.setProperty(prop, val);
      }
    }
  } catch (e) {
    // Fail-safe
  }
}

function inlineComputedStyles(srcEl: HTMLElement, destEl: HTMLElement) {
  try {
    const srcElements = srcEl.getElementsByTagName('*');
    const destElements = destEl.getElementsByTagName('*');
    
    copyStyles(srcEl, destEl);
    
    for (let i = 0; i < srcElements.length; i++) {
      const src = srcElements[i] as HTMLElement;
      const dest = destElements[i] as HTMLElement;
      if (src && dest) {
        copyStyles(src, dest);
      }
    }
  } catch (e) {
    // Fail-safe
  }
}

const TrafficPoliceLogo = ({ className = "w-16 h-16" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Background Circle */}
    <circle cx="50" cy="50" r="48" fill="#ffffff" />
    
    {/* Outer dual-color ring (Yemeni Flag themed ring) */}
    <circle cx="50" cy="50" r="46" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="144 144" strokeDashoffset="0" /> {/* Red top */}
    <circle cx="50" cy="50" r="46" stroke="#1e293b" strokeWidth="2.5" strokeDasharray="144 144" strokeDashoffset="144" /> {/* Black bottom */}
    <circle cx="50" cy="50" r="44.5" stroke="#ffffff" strokeWidth="1" />

    {/* Green Wreath (Laurel Wreath) */}
    {/* Left wreath */}
    <path d="M22 66 C15 54 16 38 25 28" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M23 60 L18 56" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M21 52 L16 49" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M21 44 L16 42" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M22 36 L18 33" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M25 29 L21 26" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />

    {/* Right wreath */}
    <path d="M78 66 C85 54 84 38 75 28" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M77 60 L82 56" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M79 52 L84 49" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M79 44 L84 42" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M78 36 L82 33" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M75 29 L79 26" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />

    {/* Eagle on top of the wreath */}
    <path d="M44 14 C47 11 50 12 50 12 C50 12 53 11 56 14 C52 14.5 50 16 50 16 C50 16 48 14.5 44 14 Z" fill="#94a3b8" stroke="#475569" strokeWidth="0.5" />
    <path d="M42 16 C45 15.5 50 17 50 17 C50 17 55 15.5 58 16 C54 17.5 50 18.5 50 18.5 C50 18.5 46 17.5 42 16 Z" fill="#cbd5e1" />

    {/* Central Red Octagon stop sign */}
    <polygon points="41,31 59,31 66,38 66,54 59,61 41,61 34,54 34,38" fill="#dc2626" stroke="#ffffff" strokeWidth="1" />

    {/* Elegant White Hand (representing authority / traffic stop) */}
    <path d="M43 56 L43 45 C43 44 44.5 44 44.5 45 L44.5 37.5 C44.5 36.5 46 36.5 46 37.5 L46 33.5 C46 32.5 47.5 32.5 47.5 33.5 L47.5 35 C47.5 34 49 34 49 35 L49 37 C49 36 50.5 36 50.5 37 L50.5 42.5 C50.5 41.5 52 41.5 52 42.5 L52 46 L53.5 46 C55.5 46 56.5 48.5 55.5 50 L52 56 Z" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.25" />
    
    {/* Micro Traffic Light inside the White Hand */}
    <rect x="46.5" y="42" width="4" height="11" rx="1.5" fill="#1e293b" />
    <circle cx="48.5" cy="44" r="1" fill="#ef4444" />
    <circle cx="48.5" cy="47.5" r="1" fill="#eab308" />
    <circle cx="48.5" cy="51" r="1" fill="#10b981" />

    {/* Pedestrian Crossing Zebra Striping below the Hand */}
    <rect x="40" y="55" width="16" height="4" fill="#111827" stroke="#ffffff" strokeWidth="0.5" />
    <line x1="43" y1="55" x2="43" y2="59" stroke="#ffffff" strokeWidth="1" />
    <line x1="46" y1="55" x2="46" y2="59" stroke="#ffffff" strokeWidth="1" />
    <line x1="49" y1="55" x2="49" y2="59" stroke="#ffffff" strokeWidth="1" />
    <line x1="52" y1="55" x2="52" y2="59" stroke="#ffffff" strokeWidth="1" />

    {/* Tiny Ministry of Interior Label (وزارة الداخلية) in the Red Octagon base / scroll */}
    <path d="M38 66 Q50 63 62 66" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M39 66 Q50 63.5 61 66" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" />
    <text x="50" y="65.5" fill="#fef08a" fontSize="2.2" fontWeight="950" textAnchor="middle" fontFamily="sans-serif">وزارة الداخلية</text>

    {/* Authentic bottom ribbon for General Traffic Directorate (الإدارة العامة للمرور) */}
    <path d="M18 73 C26 84 74 84 82 73 C76 81 24 81 18 73 Z" fill="#1e3b8a" stroke="#d97706" strokeWidth="0.75" />
    <text x="50" y="79" fill="#ffffff" fontSize="4.5" fontWeight="950" textAnchor="middle" fontFamily="sans-serif">الإدارة العامة للمرور</text>
  </svg>
);

const InteriorMinistryLogo = ({ className = "w-16 h-16" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Inner white circle for contrast */}
    <circle cx="50" cy="50" r="48" fill="#ffffff" />
    
    {/* Symmetrical Olive Leaves Wreath framing */}
    {/* Left branch */}
    <path d="M22 72 C12 55 15 32 30 20" stroke="#10b981" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M23 64 C20 62 17 60 17 60" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M20 54 C17 52 14 50 14 50" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M19 44 C16 42 13 40 13 40" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M21 34 C19 32 16 30 16 30" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M25 25 C23 23 20 21 20 21" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />

    {/* Right branch */}
    <path d="M78 72 C88 55 85 32 70 20" stroke="#10b981" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M77 64 C80 62 83 60 83 60" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M80 54 C83 52 86 50 86 50" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M81 44 C84 42 87 40 87 40" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M79 34 C81 32 84 30 84 30" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M75 25 C77 23 80 21 80 21" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />

    {/* Realistic Falcon / Eagle (spreading wings) */}
    {/* Body structure with highlights */}
    <path d="M50 48 Q46 58 45 61 Q50 63 55 61 Q54 58 50 48 Z" fill="#d97706" stroke="#78350f" strokeWidth="0.5" />
    
    {/* Wing spreading - Left */}
    <path d="M47 38 C32 28 20 38 18 53 C22 51 28 49 33 50 C28 54 24 60 23 65 C31 60 38 56 46 54" fill="#b45309" stroke="#78350f" strokeWidth="0.5" />
    <path d="M47 40 C35 32 24 41 22 52 C26 50 30 49 34 50 C30 53 27 57 26 61 C32 58 38 55 45 53" fill="#f59e0b" />
    
    {/* Wing spreading - Right */}
    <path d="M53 38 C68 28 80 38 82 53 C78 51 72 49 67 50 C72 54 76 60 77 65 C69 60 62 56 54 54" fill="#b45309" stroke="#78350f" strokeWidth="0.5" />
    <path d="M53 40 C65 32 76 41 78 52 C74 50 70 49 66 50 C70 53 73 57 74 61 C68 58 62 55 55 53" fill="#f59e0b" />

    {/* Falcon Head (profile looking right as shown in original logo) */}
    <path d="M49 31 C49 26 53 25 54 25 C55 25 57 27 55 31 C53 34 50 33 49 31 Z" fill="#b45309" stroke="#78350f" strokeWidth="0.5" />
    <path d="M50 30 C50 27 52 26 53 26 C54 26 54.5 27 53.5 30 Z" fill="#f59e0b" />
    <path d="M54 27 L57 28.5 L54 29 Z" fill="#78350f" /> {/* Beak */}
    <circle cx="51.5" cy="28" r="0.75" fill="#ffffff" />
    <circle cx="51.5" cy="28" r="0.4" fill="#000000" />

    {/* Tail feathers */}
    <path d="M46 58 L46 68 L50 71 L54 68 L54 58 Z" fill="#78350f" />
    <path d="M48 58 L48 67 L50 69 L52 67 L52 58 Z" fill="#b45309" />

    {/* Gold scroll/ribbon at bottom saying "وزارة الداخلية" */}
    <path d="M18 72 Q50 78 82 72 C78 77 22 77 18 72 Z" fill="#f59e0b" stroke="#78350f" strokeWidth="0.75" />
    <text x="50" y="75.5" fill="#501d00" fontSize="4" fontWeight="1000" textAnchor="middle" fontFamily="sans-serif">وزارة الداخلية</text>

    {/* Security focal circle (the security eye) at the absolute bottom */}
    <circle cx="50" cy="84" r="7" fill="#1e293b" />
    <circle cx="50" cy="84" r="5.5" fill="#ffffff" />
    <circle cx="50" cy="84" r="3" fill="#dc2626" />
    <circle cx="49" cy="83" r="1" fill="#ffffff" /> {/* Glare */}
  </svg>
);

const YemenEmblem = ({ className = "w-16 h-16" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Crossed Golden Flag Staffs behind the Eagle */}
    <line x1="28" y1="78" x2="92" y2="18" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="92" y1="78" x2="28" y2="18" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" />
    
    {/* Waving Yemeni Flags on Left and Right sides */}
    {/* Left Flag (Waving, hanging on left pole) */}
    {/* Top stripe (Red) */}
    <path d="M28 18 C38 15 42 22 50 19 V29 C42 32 38 25 28 28 Z" fill="#ef4444" />
    {/* Middle stripe (White) */}
    <path d="M28 28 C38 25 42 32 50 29 V34 C42 37 38 30 28 33 Z" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.5" />
    {/* Bottom stripe (Black) */}
    <path d="M28 33 C38 30 42 37 50 34 V39 C42 42 38 35 28 38 Z" fill="#1e293b" />

    {/* Right Flag (Waving, hanging on right pole) */}
    {/* Top stripe (Red) */}
    <path d="M92 18 C82 15 78 22 70 19 V29 C78 32 82 25 92 28 Z" fill="#ef4444" />
    {/* Middle stripe (White) */}
    <path d="M92 28 C82 25 78 32 70 29 V34 C78 37 82 30 92 33 Z" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.5" />
    {/* Bottom stripe (Black) */}
    <path d="M92 33 C82 30 78 37 70 34 V39 C78 42 82 35 92 38 Z" fill="#1e293b" />

    {/* Majestic Golden Eagle (wings spread horizontally) */}
    {/* Feathers Left Wing */}
    <path d="M56 28 C36 18 20 28 12 48 C20 46 28 42 35 43 C28 48 22 58 20 65 Q32 58 44 55" stroke="#78350f" strokeWidth="0.5" fill="#d97706" />
    <path d="M56 31 C39 22 25 31 16 48 C22 46 28 43 34 44 C28 49 24 57 22 62 Q32 56 43 54" fill="#fbbf24" style={{ mixBlendMode: 'multiply', opacity: 0.9 }} />
    
    {/* Feathers Right Wing */}
    <path d="M64 28 C84 18 100 28 108 48 C100 46 92 42 85 43 C92 48 98 58 100 65 Q88 58 76 55" stroke="#78350f" strokeWidth="0.5" fill="#d97706" />
    <path d="M64 31 C81 22 95 31 104 48 C98 46 92 43 86 44 C92 49 96 57 98 62 Q88 56 77 54" fill="#fbbf24" style={{ mixBlendMode: 'multiply', opacity: 0.9 }} />

    {/* Eagle Head (central, looking right or front-left. The official Yemeni eagle head looks to its right, which is the viewer's left) */}
    <path d="M60 14 C58 18 56 19 56 19 Q54 19 52 21 C54 22 56 22 58 24 Q59 21 60 14 Z" fill="#78350f" />
    <path d="M60 16 Q58 19 57 19.5 C55 19.5 54.5 21 53 21 C54 21.5 56 22 57.5 22.5 C58 21 59 19.5 60 16 Z" fill="#fbbf24" />
    <path d="M53 21 L50 22.5 L53 23.5 Z" fill="#b45309" /> {/* Beak */}
    <circle cx="56" cy="20" r="0.6" fill="#1e293b" />

    {/* Eagle body & feet */}
    <path d="M52 50 C50 63 52 68 50 75 C60 75 62 68 60 50 Z" fill="#d97706" stroke="#78350f" strokeWidth="0.5" />
    <path d="M54 50 C52 61 54 65 52 72 Q56 74 60 72 C58 65 60 61 58 50 Z" fill="#fbbf24" />
    
    {/* Tail feathers */}
    <path d="M52 75 L48 88 L60 88 L56 75 Z" fill="#78350f" stroke="#501d00" strokeWidth="0.5" />
    <path d="M54 75 L51 86 L57 86 L54 75 Z" fill="#b45309" />

    {/* Central Shield with Coffee Plant and Marib Dam */}
    <path d="M60 38 C50 38 48 50 48 54 C48 61 53 65 60 65 C67 65 72 61 72 54 C72 50 70 38 60 38 Z" fill="#ffffff" stroke="#b45309" strokeWidth="1.75" />
    
    {/* Top band (Yemeni Flag Red) */}
    <path d="M48.8 43 C50.5 40 55.5 39 60 39 C64.5 39 69.5 40 71.2 43 V46 H48.8 V43 Z" fill="#ef4444" />
    
    {/* Bottom band (Yemeni Flag Black) */}
    <path d="M48.8 59 H71.2 V62 C69.5 64 64.5 65 60 65 C55.5 65 50.5 64 48.8 62 V59 Z" fill="#1e293b" />

    {/* Coffee Plant in the center white stripe */}
    <line x1="60" y1="46" x2="60" y2="58" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="57" cy="49" r="1.2" fill="#ef4444" />
    <circle cx="63" cy="52" r="1.2" fill="#ef4444" />
    {/* Leaves */}
    <path d="M60 49 Q55 48 55 51 Q60 51 60 49 Z" fill="#10b981" />
    <path d="M60 52 Q65 51 65 54 Q60 54 60 52 Z" fill="#10b981" />

    {/* Marib Dam drawing at the bottom of the white stripe */}
    <path d="M50 56 Q60 58 70 56 L70 59 Q60 61 50 59 Z" fill="#d97706" />
    {/* Dam Brick texture lines */}
    <line x1="55" y1="56.5" x2="55" y2="59.5" stroke="#78350f" strokeWidth="0.5" />
    <line x1="60" y1="57" x2="60" y2="60" stroke="#78350f" strokeWidth="0.5" />
    <line x1="65" y1="56.5" x2="65" y2="59.5" stroke="#78350f" strokeWidth="0.5" />
    {/* Water wave lines */}
    <path d="M51 54 Q55 56 60 54 Q65 52 69 54" stroke="#0284c7" strokeWidth="0.75" fill="none" />

    {/* Golden Scroll held by Eagle talons at the bottom saying "الجمهورية اليمنية" */}
    <path d="M30 76 Q60 83 90 76 C85 81 35 81 30 76 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="0.75" />
    <text x="60" y="79.5" fill="#501d00" fontSize="4.2" fontWeight="1000" textAnchor="middle" fontFamily="sans-serif">الجمهورية اليمنية</text>
  </svg>
);

function CertificateModal({ registration, onClose }: { registration: Registration, onClose: () => void }) {
  const printRef = React.useRef<HTMLDivElement>(null);
  const [downloadingImage, setDownloadingImage] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // ترويسة الصفحة كمصورة مخصصة أو الرسم التلقائي
  const [customHeader, setCustomHeader] = useState<string | null>(() => {
    return localStorage.getItem('custom_header_banner') || null;
  });

  // خيار لتفعيل الترويسة الرسمية المعتمدة افتراضياً
  const [useStaticBanner, setUseStaticBanner] = useState(true);

  const handleHeaderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setCustomHeader(base64String);
        localStorage.setItem('custom_header_banner', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearHeader = () => {
    setCustomHeader(null);
    localStorage.removeItem('custom_header_banner');
    setUseStaticBanner(true); // العودة للترويسة الرسمية الافتراضية المعتمدة
  };

  // خيارات توسيع وملء الإطار لصورة اللوحة وصورة المالك
  const [plateExpanded, setPlateExpanded] = useState(false);
  const [plateFitMode, setPlateFitMode] = useState<'fill' | 'cover' | 'contain'>('fill');
  const [ownerExpanded, setOwnerExpanded] = useState(false);
  const [ownerFitMode, setOwnerFitMode] = useState<'fill' | 'cover' | 'contain'>('fill');

  const cycleFitMode = (current: 'fill' | 'cover' | 'contain'): 'fill' | 'cover' | 'contain' => {
    if (current === 'fill') return 'cover';
    if (current === 'cover') return 'contain';
    return 'fill';
  };

  const fitModeLabel = (mode: 'fill' | 'cover' | 'contain') => {
    if (mode === 'fill') return 'مليان الإطار';
    if (mode === 'cover') return 'تغطية متناسبة';
    return 'احتواء كامل';
  };

  const [platePhotoSrc, setPlatePhotoSrc] = useState<string>(registration.plate_photo || '');
  const [ownerPhotoSrc, setOwnerPhotoSrc] = useState<string>(registration.owner_photo || '');
  const [plateRotationFallback, setPlateRotationFallback] = useState(0);
  const [ownerRotationFallback, setOwnerRotationFallback] = useState(0);

  React.useEffect(() => {
    setPlatePhotoSrc(registration.plate_photo || '');
    setOwnerPhotoSrc(registration.owner_photo || '');
    setPlateRotationFallback(0);
    setOwnerRotationFallback(0);

    if (registration.id && registration.plate_photo === undefined && registration.owner_photo === undefined) {
      let cancelled = false;
      fetch(`/api/registrations/${registration.id}`, { cache: 'no-store' })
        .then(res => (res.ok ? res.json() : null))
        .then(fullReg => {
          if (!cancelled && fullReg) {
            if (fullReg.plate_photo) setPlatePhotoSrc(fullReg.plate_photo);
            if (fullReg.owner_photo) setOwnerPhotoSrc(fullReg.owner_photo);
          }
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }
  }, [registration.id, registration.plate_photo, registration.owner_photo]);

  const rotateImage90 = (src: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      if (!src.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalHeight || img.height;
          canvas.height = img.naturalWidth || img.width;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context unavailable'));
            return;
          }
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate(Math.PI / 2);
          ctx.drawImage(img, -img.width / 2, -img.height / 2);
          resolve(canvas.toDataURL('image/jpeg', 0.92));
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image for rotation'));
      img.src = src;
    });
  };

  const handleRotatePlate = async () => {
    if (!platePhotoSrc) return;
    try {
      const rotated = await rotateImage90(platePhotoSrc);
      setPlatePhotoSrc(rotated);
      setPlateRotationFallback(0);
    } catch {
      setPlateRotationFallback(prev => (prev + 90) % 360);
    }
  };

  const handleRotateOwner = async () => {
    if (!ownerPhotoSrc) return;
    try {
      const rotated = await rotateImage90(ownerPhotoSrc);
      setOwnerPhotoSrc(rotated);
      setOwnerRotationFallback(0);
    } catch {
      setOwnerRotationFallback(prev => (prev + 90) % 360);
    }
  };

  // Trigger proactive style sanitization when modal mounts to prevent html2canvas crashes on oklch/oklab
  React.useEffect(() => {
    sanitizeStylesheets();
  }, []);

  // Check if plate type is 'نقل' (transport) or another type. Default is 'خصوصي' (blue)
  const isNagl = registration.plate_type?.includes('نقل') || false;

  const themeColors = {
    primaryText: isNagl ? 'text-red-600' : 'text-blue-600',
    titleText: isNagl ? 'text-red-700' : 'text-blue-700',
    labelText: isNagl ? 'text-red-900' : 'text-blue-900',
    bgHeader: isNagl ? 'bg-red-600' : 'bg-blue-600',
    borderHeavy: isNagl ? 'border-red-600' : 'border-blue-600',
    borderLight: isNagl ? 'border-red-200' : 'border-blue-200',
    bulletBg: isNagl ? 'bg-red-500' : 'bg-blue-500',
    plateBorderBg: isNagl ? 'border-red-700' : 'border-blue-700',
    plateFlagBg: isNagl ? 'bg-red-900' : 'bg-blue-900',
    stampColor: isNagl ? 'text-red-600' : 'text-blue-600',
    qrBorder: isNagl ? 'border-red-950' : 'border-blue-950',
    qrPixels: isNagl ? 'bg-red-900' : 'bg-blue-900',
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = async () => {
    if (!printRef.current) return;
    setDownloadingImage(true);
    
    const originalElement = printRef.current;
    
    // Create a precise deep clone of the element to avoid mutating or moving React's live DOM node
    const element = originalElement.cloneNode(true) as HTMLDivElement;
    
    const oldScrollX = window.scrollX;
    const oldScrollY = window.scrollY;

    // Patch console to filter out html2canvas oklch parse errors
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    console.error = (...args: any[]) => {
      if (typeof args[0] === 'string' && (args[0].includes('oklch') || args[0].includes('oklab') || args[0].includes('unsupported color function'))) {
        return;
      }
      originalConsoleError(...args);
    };
    console.warn = (...args: any[]) => {
      if (typeof args[0] === 'string' && (args[0].includes('oklch') || args[0].includes('oklab') || args[0].includes('unsupported color function'))) {
        return;
      }
      originalConsoleWarn(...args);
    };

    try {
      await sanitizeStylesheets();
      element.querySelectorAll('.no-print').forEach(el => el.remove());
      // Find and process inline styles with oklch/oklab in the cloned element
      element.querySelectorAll('[style]').forEach(el => {
        const styleAttr = el.getAttribute('style');
        if (styleAttr && (styleAttr.includes('oklch') || styleAttr.includes('oklab'))) {
          el.setAttribute('style', replaceUnsupportedColors(styleAttr));
        }
      });

      // Set explicit crossOrigin anonymous attribute on all captured cloned images
      element.querySelectorAll('img').forEach(img => {
        img.setAttribute('crossOrigin', 'anonymous');
      });

      // Elevate the cloned element to the document body with forced fixed positioning and standard layout dimensions
      // We position it at (0,0) with z-index: -9999 so it is completely hidden behind our modal, preventing any flashes
      // and resolving html2canvas coordinate measurement bugs that happen when elements are outside the viewport bounds (-9999px)
      element.style.position = 'fixed';
      element.style.top = '0';
      element.style.left = '0';
      element.style.zIndex = '-9999';
      element.style.width = '800px';
      element.style.height = '1130px';
      element.style.margin = '0';
      element.style.boxSizing = 'border-box';
      element.style.boxShadow = 'none';
      element.style.transform = 'none';
      element.style.backgroundColor = '#ffffff';
      element.style.visibility = 'visible';
      
      document.body.appendChild(element);
      
      // We must construct html2canvas with useCORS: true and allowTaint: false to support custom base64 header and relative images safely
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: false,
        scale: 2.5, // High resolution
        backgroundColor: '#ffffff',
        logging: false,
        width: 800,
        height: 1130, // Standard height matching A4 aspect ratio 1:1.414 perfectly
        scrollX: 0,
        scrollY: 0,
        windowWidth: 800,
        windowHeight: 1130, // Standard height matching A4 aspect ratio perfectly
      });

      const url = canvas.toDataURL('image/png', 1.0);
      const a = document.createElement('a');
      a.href = url;
      a.download = `استمارة_ترقيم_${registration.plate_number ? (registration.plate_number + '-4') : registration.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert('فشل تنزيل الصورة: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      // Clean up the cloned node safely from the body
      if (element && element.parentNode === document.body) {
        document.body.removeChild(element);
      }

      // Restore console
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      window.scrollTo(oldScrollX, oldScrollY);
      setDownloadingImage(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    setDownloadingPdf(true);

    const originalElement = printRef.current;
    
    // Create a precise deep clone of the element to avoid mutating or moving React's live DOM node
    const element = originalElement.cloneNode(true) as HTMLDivElement;
    
    const oldScrollX = window.scrollX;
    const oldScrollY = window.scrollY;

    // Patch console to filter out html2canvas oklch parse errors
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    console.error = (...args: any[]) => {
      if (typeof args[0] === 'string' && (args[0].includes('oklch') || args[0].includes('oklab') || args[0].includes('unsupported color function'))) {
        return;
      }
      originalConsoleError(...args);
    };
    console.warn = (...args: any[]) => {
      if (typeof args[0] === 'string' && (args[0].includes('oklch') || args[0].includes('oklab') || args[0].includes('unsupported color function'))) {
        return;
      }
      originalConsoleWarn(...args);
    };

    try {
      await sanitizeStylesheets();
      element.querySelectorAll('.no-print').forEach(el => el.remove());
      // Find and process inline styles with oklch/oklab in the cloned element
      element.querySelectorAll('[style]').forEach(el => {
        const styleAttr = el.getAttribute('style');
        if (styleAttr && (styleAttr.includes('oklch') || styleAttr.includes('oklab'))) {
          el.setAttribute('style', replaceUnsupportedColors(styleAttr));
        }
      });

      // Set explicit crossOrigin anonymous attribute on all captured cloned images
      element.querySelectorAll('img').forEach(img => {
        img.setAttribute('crossOrigin', 'anonymous');
      });

      // Elevate the cloned element to the document body with forced fixed positioning and standard layout dimensions
      // We position it at (0,0) with z-index: -9999 so it is completely hidden behind our modal, preventing any flashes
      // and resolving html2canvas coordinate measurement bugs that happen when elements are outside the viewport bounds (-9999px)
      element.style.position = 'fixed';
      element.style.top = '0';
      element.style.left = '0';
      element.style.zIndex = '-9999';
      element.style.width = '800px';
      element.style.height = '1130px';
      element.style.margin = '0';
      element.style.boxSizing = 'border-box';
      element.style.boxShadow = 'none';
      element.style.transform = 'none';
      element.style.backgroundColor = '#ffffff';
      element.style.visibility = 'visible';

      document.body.appendChild(element);
      
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: false,
        scale: 2.5, // High resolution
        backgroundColor: '#ffffff',
        logging: false,
        width: 800,
        height: 1130, // Standard height matching A4 aspect ratio 1:1.414 perfectly
        scrollX: 0,
        scrollY: 0,
        windowWidth: 800,
        windowHeight: 1130, // Standard height matching A4 aspect ratio perfectly
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4', // Strict standard A4 format
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
      pdf.save(`استمارة_ترقيم_${registration.plate_number ? (registration.plate_number + '-4') : registration.id}.pdf`);
    } catch (err) {
      console.error(err);
      alert('فشل تنزيل PDF: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      // Clean up the cloned node safely from the body
      if (element && element.parentNode === document.body) {
        document.body.removeChild(element);
      }

      // Restore console
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      window.scrollTo(oldScrollX, oldScrollY);
      setDownloadingPdf(false);
    }
  };

  const PrintableRow = ({ label, value }: { label: string, value?: string }) => (
    <table 
      className={`border-b border-dotted ${themeColors.borderLight}`}
      style={{ 
        width: '100%',
        tableLayout: 'fixed',
        borderCollapse: 'collapse',
        letterSpacing: 'normal',
        margin: '0',
        padding: '0',
        backgroundColor: 'transparent'
      }}
      dir="rtl"
    >
      <tbody>
        <tr>
          {/* Label on the right */}
          <td 
            className={`text-right text-[12px] font-black ${themeColors.labelText}`} 
            style={{ 
              width: '85px', 
              whiteSpace: 'nowrap',
              padding: '2.5px 0',
              verticalAlign: 'middle',
              fontFamily: '"Vazirmatn", "Segoe UI", "Tahoma", "Arial", sans-serif'
            }}
          >
            {label}:
          </td>
          {/* Value on the left */}
          <td 
            className="text-left text-[11.5px] font-bold text-slate-900" 
            style={{ 
              padding: '2.5px 0',
              verticalAlign: 'middle',
              wordBreak: 'break-word',
              direction: 'rtl',
              textAlign: 'left',
              fontFamily: '"Vazirmatn", "Segoe UI", "Tahoma", "Arial", sans-serif'
            }}
          >
            {value || '---'}
          </td>
        </tr>
      </tbody>
    </table>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-[90vh]"
      >
        <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50">
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 ${themeColors.bgHeader}`}>
                <FileText className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h3 className="text-base md:text-xl font-black text-slate-800 leading-tight">إستمارة الترقيم الرسمية ({isNagl ? 'نقل' : 'خصوصي'})</h3>
                <p className="text-slate-400 text-[10px] md:text-xs font-bold font-mono tracking-widest">{registration.id}</p>
              </div>
            </div>
            
            {/* زر الإغلاق على الهاتف يكون واضح ومرئي بشكل منفصل */}
            <button 
              onClick={onClose}
              className="md:hidden p-2 hover:bg-slate-200 text-slate-400 rounded-xl transition-all shrink-0"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 w-full md:w-auto">
            {/* رفع ترويسة رئيسية مخصصة كصورة كاملة */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 w-full sm:w-auto justify-center">
              <label 
                className="px-2.5 py-1.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 text-[11px] font-bold rounded-lg cursor-pointer flex items-center gap-1 shadow-sm transition-all focus-within:ring-2 focus-within:ring-slate-300 select-none shrink-0"
                title="اضغط لرفع صورة الترويسة الكاملة لتظهر فوراً في أعلى الاستمارة"
              >
                <Image className="w-3 h-3 text-slate-500" />
                <span>رفع ترويسة مخصصة</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleHeaderUpload} 
                  className="hidden" 
                />
              </label>
              {customHeader && (
                <button 
                  onClick={handleClearHeader}
                  className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all shrink-0"
                  title="استعادة الترويسة الرسمية المعتمدة"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* أزرار توسيع وملء صورة اللوحة وصورة المالك */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 w-full sm:w-auto justify-center">
              <button
                type="button"
                onClick={() => setPlateExpanded(prev => !prev)}
                className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border transition-all flex items-center gap-1 shadow-sm select-none ${
                  plateExpanded ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
                title="توسيع أو تصغير إطار صورة اللوحة"
              >
                {plateExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                <span>{plateExpanded ? 'تصغير اللوحة' : 'توسيع اللوحة'}</span>
              </button>
              <button
                type="button"
                onClick={() => setPlateFitMode(prev => cycleFitMode(prev))}
                className="px-2.5 py-1.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 text-[11px] font-bold rounded-lg transition-all shadow-sm select-none"
                title="تغيير وضع ملء صورة اللوحة داخل الإطار"
              >
                اللوحة: {fitModeLabel(plateFitMode)}
              </button>
              <button
                type="button"
                onClick={handleRotatePlate}
                disabled={!platePhotoSrc}
                className="px-2.5 py-1.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 shadow-sm select-none disabled:opacity-40 disabled:pointer-events-none"
                title="تدوير صورة اللوحة 90 درجة"
              >
                <RotateCw className="w-3 h-3" />
                <span>تدوير اللوحة</span>
              </button>
              <button
                type="button"
                onClick={() => setOwnerExpanded(prev => !prev)}
                className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border transition-all flex items-center gap-1 shadow-sm select-none ${
                  ownerExpanded ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
                title="توسيع أو تصغير إطار صورة المالك"
              >
                {ownerExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                <span>{ownerExpanded ? 'تصغير المالك' : 'توسيع المالك'}</span>
              </button>
              <button
                type="button"
                onClick={() => setOwnerFitMode(prev => cycleFitMode(prev))}
                className="px-2.5 py-1.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 text-[11px] font-bold rounded-lg transition-all shadow-sm select-none"
                title="تغيير وضع ملء صورة المالك داخل الإطار"
              >
                المالك: {fitModeLabel(ownerFitMode)}
              </button>
              <button
                type="button"
                onClick={handleRotateOwner}
                disabled={!ownerPhotoSrc}
                className="px-2.5 py-1.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 shadow-sm select-none disabled:opacity-40 disabled:pointer-events-none"
                title="تدوير صورة المالك 90 درجة"
              >
                <RotateCw className="w-3 h-3" />
                <span>تدوير المالك</span>
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
              <button 
                onClick={handleDownloadPdf}
                disabled={downloadingPdf || downloadingImage}
                className={`flex-1 sm:flex-none px-4 py-2.5 text-white rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-md ${
                  isNagl ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {downloadingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                تحميل الاستمارة PDF
              </button>

              <button 
                onClick={handleDownloadImage}
                disabled={downloadingPdf || downloadingImage}
                className={`flex-1 sm:flex-none px-4 py-2.5 text-white rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none ${
                  isNagl ? 'bg-orange-600 hover:bg-orange-700 shadow-md' : 'bg-emerald-600 hover:bg-emerald-700 shadow-md'
                }`}
              >
                {downloadingImage ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Image className="w-3.5 h-3.5" />
                )}
                تنزيل صورة
              </button>

              {/* زر الإغلاق على الحواسب */}
              <button 
                onClick={onClose}
                className="hidden md:block p-2.5 hover:bg-slate-200 text-slate-400 rounded-xl transition-all shrink-0"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-8 bg-slate-100/30 flex justify-start md:justify-center">
          {/* تصميم الإستمارة الرسمي - مطابقة تامة للصورة مع تطبيق اللون الديناميكي */}
          <div 
            ref={printRef} 
            id="print-certificate-area" 
            className={`bg-white p-2.5 shadow-sm relative text-right w-[800px] shrink-0 border-[3.5px] rounded-[2.5rem] ${themeColors.borderHeavy}`}
            dir="rtl" 
            style={{ 
              fontFamily: '"Vazirmatn", "Inter", sans-serif', 
              width: '800px', 
              height: '1130px', 
              minHeight: '1130px', 
              maxHeight: '1130px', 
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}
          >
            {/* Inner Border Wrapper to achieve the authentic double-border look in the image */}
            <div 
              className={`w-full h-full border-[1.5px] rounded-[1.8rem] py-4 px-6 flex flex-col justify-between relative overflow-hidden ${themeColors.borderLight}`}
              style={{
                boxSizing: 'border-box',
                height: '100%'
              }}
            >
              {/* العلامة المائية الرسمية الممتدة على كامل طول وعرض الاستمارة */}
              <div
                className="absolute inset-x-1 top-[128px] bottom-2 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0"
                aria-hidden="true"
              >
                <img
                  src="/assets/aistudio/Screenshot_________________Google_44390101.jpg"
                  alt=""
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-fill"
                  style={{ opacity: 0.08 }}
                />
              </div>
              
              {/* الجزء الأول: ترويسة الصفحة الرسمية المعتمدة */}
              {customHeader || useStaticBanner ? (
                <div 
                  className={`mb-1.5 pb-1 border-b-2 flex justify-center items-center overflow-hidden mx-[-1.5rem] -mt-4 ${themeColors.borderLight}`}
                  style={{ boxSizing: 'border-box', height: '126px', minHeight: '126px', maxHeight: '126px', width: 'calc(100% + 3rem)' }}
                >
                  <img 
                    src={customHeader || "/assets/aistudio/______________69003-4_a2ff8133.png"} 
                    className="w-full h-full object-contain select-none" 
                    alt="الترويسة الرسمية" 
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    onError={() => {
                      if (!customHeader && useStaticBanner) {
                        setUseStaticBanner(false);
                      }
                    }}
                  />
                </div>
              ) : (
                <div 
                  className={`flex flex-col mb-2 pb-0.5 border-b-2 mx-[-1.5rem] px-2 ${themeColors.borderLight}`} 
                  style={{ boxSizing: 'border-box', width: 'calc(100% + 3rem)' }}
                >
                  
                  {/* صف الشعارات الثلاثة الممتد على العرض الكامل بشكل متناسق ومجموع في 3 مجموعات رئيسية */}
                  <div className="flex flex-row items-center justify-between w-full" style={{ boxSizing: 'border-box' }}>
                    
                    {/* المجموعة الأولى (اليمين): شعار المرور الدائري مع نصوصه جنباً لجنب */}
                    <div className="flex flex-row items-center gap-3 text-right">
                       <TrafficPoliceLogo className="w-[66px] h-[66px] shrink-0 filter drop-shadow-sm" />
                      <div className="text-right flex flex-col justify-center select-none" style={{ fontFamily: '"Vazirmatn", sans-serif' }}>
                        <h1 className="text-[11.5px] font-black text-slate-900 leading-tight">الجمهورية اليمنية</h1>
                        <h2 className="text-[10.5px] font-black text-slate-700 leading-tight">وزارة الداخلية</h2>
                        <h3 className="text-[10.5px] font-black text-slate-600 leading-tight">الإدارة العامة للمرور</h3>
                        <h4 className={`text-[11px] font-black ${isNagl ? 'text-red-600' : 'text-blue-800'} leading-none mt-0.5`}>لجنة الترقيم الجمركي</h4>
                      </div>
                    </div>

                    {/* المجموعة الثانية (الوسط): الطير الجمهوري اليميني كشعار وطني مركزي بمصدر موارد مدمج محلياً لمنع مشاكل CORS */}
                    <div className="flex justify-center items-center select-none">
                      <YemenEmblem className="w-[84px] h-[84px] shrink-0 filter drop-shadow-sm hover:scale-105 transition-transform duration-300" />
                    </div>

                    {/* المجموعة الثالثة (اليسار): نصوص وزارة الداخلية مع شعار الصقر العظيم جنباً لجنب */}
                    <div className="flex flex-row items-center gap-3 text-right">
                      <div className="text-right flex flex-col justify-center select-none" style={{ fontFamily: '"Vazirmatn", sans-serif' }}>
                        <h1 className="text-[11.5px] font-black text-slate-900 leading-tight">وزارة الداخلية</h1>
                        <h2 className="text-[10.5px] font-black text-slate-700 leading-tight">الإدارة العامة للمرور</h2>
                        <p className="text-[8.5px] font-black text-slate-400 mt-0.5 tracking-wider uppercase leading-none">TRAFFIC</p>
                        <p className="text-[8.5px] font-black text-slate-400 tracking-wider uppercase leading-none">AUTHORITY</p>
                      </div>
                      <InteriorMinistryLogo className="w-[66px] h-[66px] shrink-0 filter drop-shadow-sm" />
                    </div>

                  </div>

                  {/* عنوان الاستمارة العظيم متوسط بالكامل تحت صف الشعارات تماماً كصورة الواقع */}
                  <h2 className={`text-[21px] font-black text-center ${isNagl ? 'text-red-700' : 'text-blue-950'} tracking-wide leading-none mt-2 pb-0.5`} style={{ fontFamily: '"Vazirmatn", sans-serif' }}>
                    استمارة الفحص والترقيم
                  </h2>

                </div>
              )}

            {/* الجزء الثاني: لوحة الأرقام وصورة اللوحة والرقم التسلسلي */}
            <div className="flex flex-row gap-4 items-center mb-3 justify-between relative z-10" style={{ boxSizing: 'border-box' }}>
              {/* صندوق صورة اللوحة - 33% أو موسع 38% */}
              <div className={plateExpanded ? 'w-[38%] transition-all' : 'w-[33%] transition-all'}>
                <div className={`w-full ${plateExpanded ? 'h-32' : 'h-24'} border-2 border-dashed rounded-xl bg-white flex flex-col items-center justify-center relative overflow-hidden transition-all ${themeColors.borderHeavy}`}>
                  {platePhotoSrc ? (
                    <>
                      <img 
                        src={platePhotoSrc} 
                        className={`w-full h-full ${plateFitMode === 'fill' ? 'object-fill' : plateFitMode === 'cover' ? 'object-cover' : 'object-contain'}`}
                        style={plateRotationFallback ? { transform: `rotate(${plateRotationFallback}deg)` } : undefined}
                        alt="صورة اللوحة" 
                        referrerPolicy="no-referrer" 
                      />
                      <div className="no-print absolute top-1 left-1 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handleRotatePlate}
                          className="p-1 rounded-md bg-slate-900/65 hover:bg-slate-900 text-white transition-all"
                          title="تدوير صورة اللوحة 90 درجة"
                        >
                          <RotateCw className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPlateExpanded(prev => !prev)}
                          className="p-1 rounded-md bg-slate-900/65 hover:bg-slate-900 text-white transition-all"
                          title={plateExpanded ? 'تصغير صورة اللوحة' : 'توسيع صورة اللوحة'}
                        >
                          {plateExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                        </button>
                      </div>
                    </>
                  ) : (
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">صورة اللوحة</span>
                  )}
                </div>
              </div>

              {/* اللوحة الجميلة بالوسط - 42% */}
              <div className="w-[42%] flex flex-col items-center">
                <div className={`flex items-center bg-white border-2 rounded-xl overflow-hidden shadow-sm h-14 w-full ${themeColors.borderHeavy}`}>
                  <div className={`text-white px-2.5 h-full flex flex-col items-center justify-center border-l-2 min-w-[55px] ${themeColors.plateFlagBg} ${themeColors.borderHeavy}`}>
                    <span className="text-[9px] font-black opacity-85 uppercase leading-none">YEM</span>
                    <span className="text-[10px] font-black leading-none mt-0.5">اليمن</span>
                  </div>
                  <div className="flex flex-1 justify-around px-1 gap-0.5 items-center h-full" dir="ltr">
                    {/* فاصل 4 في البداية */}
                    <div className="flex-1 text-center h-full flex items-center justify-center bg-slate-50/70 border-r border-slate-300">
                      <span className={`text-xl font-black ${themeColors.primaryText} font-mono`}>4</span>
                    </div>
                    <div className="border-r border-slate-300 h-full flex items-center px-1">
                      <span className="text-[10px] font-bold text-slate-400 font-sans">-</span>
                    </div>
                    {String(registration.plate_number || '3655').trim().split('').map((char, i) => (
                      <div key={i} className="flex-1 text-center border-r last:border-0 border-slate-300 h-full flex items-center justify-center">
                        <span className={`text-xl font-black ${themeColors.primaryText}`}>{char}</span>
                      </div>
                    ))}
                  </div>
                  <div className={`px-2 border-r-2 bg-slate-100 h-full flex items-center justify-center min-w-[70px] ${themeColors.borderHeavy}`}>
                    <span className={`text-[12px] font-black ${themeColors.labelText}`}>{registration.plate_type || 'خصوصي'}</span>
                  </div>
                </div>
                {/* تاريخ الاصدار والانتهاء بالأسفل */}
                <div className="flex justify-between w-full mt-2 text-[8.5px] font-black text-slate-500 font-mono">
                  <span>إصدار: {new Date(registration.registration_date).toLocaleDateString('ar-YE')}</span>
                  <span>انتهاء: ---</span>
                </div>
              </div>

              {/* أرقام الاستمارة في اليسار - 25% */}
              <div className="w-[25%] text-left space-y-1">
                <p className={`text-[10.5px] font-black font-mono ${themeColors.primaryText}`}>رقم تسلسلي: REG-{String(registration.id).slice(-4)}</p>
                <p className="text-[10.5px] font-black text-slate-800 font-sans">رقم اللوحة: <span dir="ltr" className="font-mono text-[9px] font-black bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{registration.plate_number ? `4-${registration.plate_number}` : '4-3655'}</span></p>
                <p className="text-[10.5px] font-black text-slate-800">رقم الاستمارة: {registration.document_number || '---'}</p>
              </div>
            </div>

            {/* القسم الأول: البيانات الشخصية والعنوان */}
            <div className={`border-2 rounded-xl overflow-hidden mb-3 relative z-10 ${themeColors.borderHeavy}`} style={{ boxSizing: 'border-box' }}>
              <div className={`text-white py-1.5 px-3 flex items-center justify-between ${themeColors.bgHeader}`}>
                <span className="text-xs font-black flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                  البيانات الشخصية والعنوان
                </span>
                <span className="text-[11px] opacity-90 font-bold">بيانات المالك</span>
              </div>
              <div className="py-2.5 px-3 bg-transparent relative">
                <table className="w-full" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }} dir="rtl">
                  <tbody>
                    <tr>
                      {/* حقول البيانات - 75% من العرض */}
                      <td style={{ width: '75%', verticalAlign: 'top', padding: '0' }}>
                        <table className="w-full" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                          <tbody>
                            <tr>
                              <td className="pl-3 pb-1" style={{ width: '50%', verticalAlign: 'middle' }}>
                                <PrintableRow label="الاسم الرباعي" value={registration.owner_name} />
                              </td>
                              <td className="pr-3 pb-1" style={{ width: '50%', verticalAlign: 'middle' }}>
                                <PrintableRow label="رقم الهاتف" value={registration.owner_phone} />
                              </td>
                            </tr>
                            <tr>
                              <td className="pl-3 pb-1" style={{ width: '50%', verticalAlign: 'middle' }}>
                                <PrintableRow label="تاريخ الميلاد" value="---" />
                              </td>
                              <td className="pr-3 pb-1" style={{ width: '50%', verticalAlign: 'middle' }}>
                                <PrintableRow label="فصيلة الدم" value={registration.blood_type} />
                              </td>
                            </tr>
                            <tr>
                              <td className="pl-3 pb-1" style={{ width: '50%', verticalAlign: 'middle' }}>
                                <PrintableRow label="نوع الهوية" value={registration.id_type} />
                              </td>
                              <td className="pr-3 pb-1" style={{ width: '50%', verticalAlign: 'middle' }}>
                                <PrintableRow label="رقم الهوية" value={registration.id_number} />
                              </td>
                            </tr>
                            <tr>
                              <td className="pl-3 pb-1" style={{ width: '50%', verticalAlign: 'middle' }}>
                                <PrintableRow label="مكان الإصدار" value={registration.issue_place} />
                              </td>
                              <td className="pr-3 pb-1" style={{ width: '50%', verticalAlign: 'middle' }}>
                                <PrintableRow label="العنوان الحالي" value={registration.address} />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>

                      {/* الصورة الشخصية - 25% من العرض */}
                      <td style={{ width: '25%', verticalAlign: 'middle', borderRight: '1px solid #e2e8f0', paddingRight: '1rem', paddingLeft: '0' }}>
                        <div className="flex justify-center items-center h-full">
                          <div className={`${ownerExpanded ? 'w-28 h-32' : 'w-20 h-24'} border rounded-lg overflow-hidden bg-white flex items-center justify-center relative transition-all ${themeColors.borderLight}`}>
                            {ownerPhotoSrc ? (
                              <>
                                <img
                                  src={ownerPhotoSrc}
                                  className={`w-full h-full ${ownerFitMode === 'fill' ? 'object-fill' : ownerFitMode === 'cover' ? 'object-cover' : 'object-contain'}`}
                                  style={ownerRotationFallback ? { transform: `rotate(${ownerRotationFallback}deg)` } : undefined}
                                  alt="الشخصية"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="no-print absolute top-1 left-1 flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={handleRotateOwner}
                                    className="p-1 rounded-md bg-slate-900/65 hover:bg-slate-900 text-white transition-all"
                                    title="تدوير صورة المالك 90 درجة"
                                  >
                                    <RotateCw className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setOwnerExpanded(prev => !prev)}
                                    className="p-1 rounded-md bg-slate-900/65 hover:bg-slate-900 text-white transition-all"
                                    title={ownerExpanded ? 'تصغير صورة المالك' : 'توسيع صورة المالك'}
                                  >
                                    {ownerExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                                  </button>
                                </div>
                              </>
                            ) : (
                              <span className="text-[9px] text-slate-400 text-center px-1 font-bold">صورة 4×6</span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* القسم الثاني: البيانات الفنية للمركبة */}
            <div className={`border-2 rounded-xl overflow-hidden mb-3 relative z-10 ${themeColors.borderHeavy}`} style={{ boxSizing: 'border-box' }}>
              <div className={`text-white py-1.5 px-3 flex items-center justify-between relative z-10 ${themeColors.bgHeader}`}>
                <span className="text-xs font-black flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                  البيانات الفنية للمركبة
                </span>
                <span className="text-[11px] opacity-90 font-bold">مواصفات المركبة المسجلة</span>
              </div>
              <div className="py-2.5 px-3 bg-transparent relative z-10">
                <table className="w-full text-right" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }} dir="rtl">
                  <tbody>
                    <tr>
                      <td className="pl-3 pb-1" style={{ width: '50%', verticalAlign: 'middle' }}>
                        <PrintableRow label="رقم اللوحة" value={`${registration.plate_number ? ('4-' + registration.plate_number) : '4-3655'}`} />
                      </td>
                      <td className="pr-3 pb-1" style={{ width: '50%', verticalAlign: 'middle' }}>
                        <PrintableRow label="نوع اللوحة" value={registration.plate_type || 'خصوصي'} />
                      </td>
                    </tr>
                    <tr>
                      <td className="pl-3 pb-1" style={{ width: '50%', verticalAlign: 'middle' }}>
                        <PrintableRow label="الماركة" value={registration.vehicle_make} />
                      </td>
                      <td className="pr-3 pb-1" style={{ width: '50%', verticalAlign: 'middle' }}>
                        <PrintableRow label="نوع المركبة" value={registration.vehicle_type} />
                      </td>
                    </tr>
                    <tr>
                      <td className="pl-3 pb-1" style={{ width: '50%', verticalAlign: 'middle' }}>
                        <PrintableRow label="الشكل" value={registration.vehicle_shape} />
                      </td>
                      <td className="pr-3 pb-1" style={{ width: '50%', verticalAlign: 'middle' }}>
                        <PrintableRow label="اللون" value={registration.vehicle_color} />
                      </td>
                    </tr>
                    <tr>
                      <td className="pl-3 pb-1" style={{ width: '50%', verticalAlign: 'middle' }}>
                        <PrintableRow label="سنة الصنع" value={registration.model_year} />
                      </td>
                      <td className="pr-3 pb-1" style={{ width: '50%', verticalAlign: 'middle' }}>
                        <PrintableRow label="الطراز" value={registration.vehicle_model} />
                      </td>
                    </tr>
                  </tbody>
                </table>
                
                {/* رقم القاعدة VIN في سطر مستقل وبشكل مربعات ممتازة */}
                <div className="w-full py-1.5" style={{ boxSizing: 'border-box' }} dir="rtl">
                  <span className={`block text-[11px] font-black mb-1 ${themeColors.labelText}`}>رقم القاعدة VIN:</span>
                  <div className="flex flex-row-reverse gap-0.5 justify-start">
                    {(registration.chassis_number || '').padEnd(21, ' ').slice(0, 21).split('').map((char, i) => (
                      <div key={i} className={`w-[21px] h-7 border rounded flex items-center justify-center font-black text-[10px] bg-white/80 font-mono shadow-sm ${themeColors.borderHeavy} ${themeColors.primaryText}`}>
                        {char}
                      </div>
                    ))}
                  </div>
                </div>

                <table className="w-full text-right" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }} dir="rtl">
                  <tbody>
                    <tr>
                      <td className="pl-3 pb-1" style={{ width: '50%', verticalAlign: 'middle' }}>
                        <PrintableRow label="رقم المحرك" value={registration.engine_number} />
                      </td>
                      <td className="pr-3 pb-1" style={{ width: '50%', verticalAlign: 'middle' }}>
                        <PrintableRow label="نوع الوقود" value={registration.fuel_type} />
                      </td>
                    </tr>
                    <tr>
                      <td className="pl-3 pb-1" style={{ width: '50%', verticalAlign: 'middle' }}>
                        <PrintableRow label="عدد الأسطوانات" value={registration.cylinders} />
                      </td>
                      <td className="pr-3 pb-1" style={{ width: '50%', verticalAlign: 'middle' }}>
                        <PrintableRow label="رقم البيان الجمركي" value={registration.document_number} />
                      </td>
                    </tr>
                  </tbody>
                </table>
                
                <div className="w-full pt-1">
                  <PrintableRow label="جهة إصدار البيان" value={registration.customs_office} />
                </div>
              </div>
            </div>

            {/* القسم الثالث: بيــانات المعرفين */}
            <div className={`border-2 rounded-xl overflow-hidden mb-3 relative z-10 ${themeColors.borderHeavy}`} style={{ boxSizing: 'border-box' }}>
              <div className={`text-white py-1.5 px-3 flex items-center justify-between ${themeColors.bgHeader}`}>
                <span className="text-xs font-black flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                  بيانات المعرفين (الضامنين والشهود)
                </span>
                <span className="text-[11px] opacity-90 font-bold">الضمانة القانونية</span>
              </div>
              <div className="py-2.5 px-3 bg-transparent" dir="rtl">
                <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: '8px 0', tableLayout: 'fixed' }}>
                  <tbody>
                    <tr>
                      {/* المعرف الأول */}
                      <td style={{ width: '50%', verticalAlign: 'top', padding: '0' }}>
                        <div className={`border rounded-xl p-2.5 relative ${themeColors.borderHeavy}`}>
                          <span className={`absolute -top-2 right-4 bg-white px-2 text-[10px] font-black border-x ${themeColors.labelText} ${themeColors.borderHeavy}`}>المعرف الأول</span>
                          <div className="space-y-[3px] mt-0.5">
                            <PrintableRow label="الاسم" value={registration.witness1_name} />
                            <PrintableRow label="الرقم الوطني" value={registration.witness1_id} />
                            <PrintableRow label="نوع القرابة" value={registration.witness1_relation} />
                            <PrintableRow label="رقم الهاتف" value={registration.witness1_phone} />
                            <PrintableRow label="العنوان" value={registration.witness1_address} />
                          </div>
                        </div>
                      </td>

                      {/* المعرف الثاني */}
                      <td style={{ width: '50%', verticalAlign: 'top', padding: '0' }}>
                        <div className={`border rounded-xl p-2.5 relative ${themeColors.borderHeavy}`}>
                          <span className={`absolute -top-2 right-4 bg-white px-2 text-[10px] font-black border-x ${themeColors.labelText} ${themeColors.borderHeavy}`}>المعرف الثاني</span>
                          <div className="space-y-[3px] mt-0.5">
                            <PrintableRow label="الاسم" value={registration.witness2_name} />
                            <PrintableRow label="الرقم الوطني" value={registration.witness2_id} />
                            <PrintableRow label="نوع القرابة" value={registration.witness2_relation} />
                            <PrintableRow label="رقم الهاتف" value={registration.witness2_phone} />
                            <PrintableRow label="العنوان" value={registration.witness2_address} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* الجزء الرابع: التواقيع والباركود التوثيقي */}
            <div className={`flex flex-row items-end border-t-2 pt-3 justify-between relative z-10 ${themeColors.borderHeavy}`} style={{ boxSizing: 'border-box' }}>
              {/* التواقيع الثلاثة - 75% */}
              <div className="w-[75%] flex flex-row justify-between text-center pb-2 px-2">
                <div className="w-1/3 space-y-4">
                  <div className={`h-0.5 w-[75%] mx-auto ${themeColors.bgHeader}`} />
                  <p className={`text-[10px] font-black ${themeColors.labelText}`}>المختص الفني</p>
                </div>
                <div className="w-1/3 space-y-4">
                  <div className={`h-0.5 w-[75%] mx-auto ${themeColors.bgHeader}`} />
                  <p className={`text-[10px] font-black ${themeColors.labelText}`}>رئيس القسم الفني</p>
                </div>
                <div className="w-1/3 space-y-4">
                  <div className={`h-0.5 w-[75%] mx-auto ${themeColors.bgHeader}`} />
                  <p className={`text-[10px] font-black ${themeColors.labelText}`}>مدير الإصدار الآلي</p>
                </div>
              </div>

              {/* باركود رقمي Visual QR - 25% */}
              <div className="w-[25%] flex flex-col items-center">
                <div className={`w-12 h-12 border-2 bg-slate-50 p-1 flex items-center justify-center rounded ${themeColors.borderHeavy}`}>
                  {/* رمز مصفوفة البكسلات محاكي الماتريكس للبارات */}
                  <div className="grid grid-cols-5 gap-0.5 w-full h-full">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div key={i} className={`rounded-[1px] ${(i * 7 + 13) % 2 === 0 ? 'bg-slate-900' : 'bg-transparent'} ${themeColors.qrPixels}`} />
                    ))}
                  </div>
                </div>
                <span className={`text-[8.5px] font-black mt-1 uppercase tracking-widest ${themeColors.labelText}`}>التوثيق الرقمي</span>
              </div>
            </div>

          </div> {/* Closing inner border wrapper */}
        </div>
        </div>
      </motion.div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          .no-print { display: none !important; }
          #root { height: auto !important; overflow: visible !important; }
          #print-certificate-area, #print-certificate-area * { visibility: visible; }
          #print-certificate-area { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 800px !important; 
            height: 1130px !important;
            margin: 0 !important;
            padding: 10px !important;
            border: none !important;
            box-shadow: none !important;
          }
           /* Force background colors in print */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}} />
    </div>
  );
}
const InputField = ({ label, value, onChange, placeholder, required, type = "text" }: any) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [pasteFeedback, setPasteFeedback] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  useEffect(() => {
    if (!pasteFeedback) return;
    const timer = setTimeout(
      () => setPasteFeedback(null),
      pasteFeedback.type === 'success' ? 1800 : 4000
    );
    return () => clearTimeout(timer);
  }, [pasteFeedback]);

  const handlePasteClick = async () => {
    inputRef.current?.focus();
    setPasteFeedback(null);

    const applyPastedText = (raw: string) => {
      const normalized = raw.replace(/[\r\n]+/g, ' ').trim();
      if (!normalized) {
        setPasteFeedback({ type: 'info', message: 'الحافظة فارغة — انسخ النص أولاً' });
        return false;
      }
      onChange(normalized);
      setPasteFeedback({ type: 'success', message: 'تم اللصق' });
      return true;
    };

    try {
      if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
        const clipText = await navigator.clipboard.readText();
        applyPastedText(clipText);
        return;
      }
    } catch {
      // Clipboard API may be blocked by browser/iframe permissions; fall back below
    }

    try {
      const executed = document.execCommand('paste');
      if (executed) {
        return;
      }
    } catch {
      // Ignore legacy execCommand failure
    }

    setPasteFeedback({
      type: 'info',
      message: 'اضغط مطولاً داخل الحقل واختر «لصق» أو Ctrl+V',
    });
  };

  return (
    <div className="space-y-2 group">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mr-5 transition-colors group-focus-within:text-primary-500">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type={type}
          value={value ?? ''}
          onPaste={() => setPasteFeedback(null)}
          onChange={(e) => {
            setPasteFeedback(null);
            onChange(e.target.value);
          }}
          placeholder={placeholder}
          className="w-full p-5 pr-6 pl-20 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-slate-700 outline-none select-text focus:border-primary-500/20 focus:bg-white transition-colors duration-150 leading-relaxed"
        />
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handlePasteClick}
          title="لصق من الحافظة إلى الحقل"
          className={`absolute left-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1 transition-colors border ${
            pasteFeedback?.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-white text-slate-500 hover:text-primary-600 hover:border-primary-200 border-slate-200 shadow-sm active:scale-95'
          }`}
        >
          {pasteFeedback?.type === 'success' ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>تم</span>
            </>
          ) : (
            <>
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>لصق</span>
            </>
          )}
        </button>
      </div>
      {pasteFeedback?.type === 'info' && (
        <p className="text-[11px] font-bold text-amber-600 mr-4">{pasteFeedback.message}</p>
      )}
    </div>
  );
};

function RegistrationView({ onRefresh }: { onRefresh?: () => void }) {
  const initialFormState = {
    plate_number: '',
    plate_type: 'خصوصي' as 'خصوصي' | 'نقل',
    vehicle_type: '',
    vehicle_color: '',
    model_year: '',
    chassis_number: '',
    engine_number: '',
    document_number: '',
    owner_name: '',
    owner_phone: '',
    notes: '',
    blood_type: '',
    id_type: 'بطاقة شخصية',
    id_number: '',
    issue_place: '',
    address: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_shape: '',
    cylinders: '4',
    fuel_type: 'بنزين',
    customs_office: '',
    witness1_name: '',
    witness1_id: '',
    witness1_relation: '',
    witness1_phone: '',
    witness1_address: '',
    witness2_name: '',
    witness2_id: '',
    witness2_relation: '',
    witness2_phone: '',
    witness2_address: '',
    owner_photo: '',
    plate_photo: ''
  };
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showCertificate, setShowCertificate] = useState<Registration | null>(null);
  const [error, setError] = useState('');
  const [activeScanner, setActiveScanner] = useState<'customs' | 'owner_id' | 'witness1_id' | 'witness2_id' | null>(null);
  const [scanFeedback, setScanFeedback] = useState<string>('');

  const handleScanCompleteForType = (type: 'customs' | 'owner_id' | 'witness1_id' | 'witness2_id', scannedData: any) => {
    if (!scannedData || typeof scannedData !== 'object') return;

    const cleanText = (val: any): string => {
      if (val === null || val === undefined) return '';
      const str = String(val).trim();
      if (!str || ['غير واضح', 'غير موجود', 'غير متوفر', 'لا يوجد', 'غير محدد', 'null', 'undefined', 'n/a', 'na', '---', '--', '-'].includes(str.toLowerCase())) {
        return '';
      }
      return str;
    };

    const cleanDigits = (val: any): string => {
      return cleanText(val)
        .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
        .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
    };

    const normalizeBlood = (val: any): string => {
      const raw = cleanText(val).replace(/فصيلة|زمرة|الدم|:/g, '').trim().toUpperCase();
      if (!raw) return '';
      const match = raw.match(/^(AB|A|B|O)\s*([+-])$/) || raw.match(/^([+-])\s*(AB|A|B|O)$/);
      if (match) {
        return match[1] === '+' || match[1] === '-' ? `${match[2]}${match[1]}` : `${match[1]}${match[2]}`;
      }
      return raw;
    };

    const updates: Partial<typeof initialFormState> = {};
    const addUpdate = (field: keyof typeof initialFormState, nextVal: string) => {
      if (nextVal) {
        (updates as any)[field] = nextVal;
      }
    };

    if (type === 'customs') {
      addUpdate('document_number', cleanDigits(scannedData.document_number));
      addUpdate('customs_office', cleanText(scannedData.customs_office));
      addUpdate('vehicle_make', cleanText(scannedData.vehicle_make));
      addUpdate('vehicle_type', cleanText(scannedData.vehicle_type));
      addUpdate('vehicle_model', cleanText(scannedData.vehicle_model));
      addUpdate('vehicle_shape', cleanText(scannedData.vehicle_shape));
      addUpdate('vehicle_color', cleanText(scannedData.vehicle_color));
      addUpdate('model_year', cleanDigits(scannedData.model_year));
      addUpdate('chassis_number', cleanDigits(scannedData.chassis_number).replace(/\s+/g, '').toUpperCase());
      addUpdate('engine_number', cleanDigits(scannedData.engine_number));
      addUpdate('cylinders', cleanDigits(scannedData.cylinders));
      addUpdate('fuel_type', cleanText(scannedData.fuel_type));
    } else if (type === 'owner_id') {
      addUpdate('owner_name', cleanText(scannedData.owner_name));
      const scannedIdType = cleanText(scannedData.id_type);
      if (scannedIdType) {
        addUpdate('id_type', scannedIdType.includes('جواز') ? 'جواز سفر' : 'بطاقة شخصية');
      }
      addUpdate('id_number', cleanDigits(scannedData.id_number).replace(/\s+/g, ''));
      addUpdate('issue_place', cleanText(scannedData.issue_place));
      addUpdate('address', cleanText(scannedData.address));
      addUpdate('blood_type', normalizeBlood(scannedData.blood_type));
    } else if (type === 'witness1_id') {
      addUpdate('witness1_name', cleanText(scannedData.witness_name));
      addUpdate('witness1_id', cleanDigits(scannedData.witness_id).replace(/\s+/g, ''));
      addUpdate('witness1_phone', cleanDigits(scannedData.witness_phone));
      addUpdate('witness1_address', cleanText(scannedData.witness_address));
      addUpdate('witness1_relation', cleanText(scannedData.witness_relation));
    } else if (type === 'witness2_id') {
      addUpdate('witness2_name', cleanText(scannedData.witness_name));
      addUpdate('witness2_id', cleanDigits(scannedData.witness_id).replace(/\s+/g, ''));
      addUpdate('witness2_phone', cleanDigits(scannedData.witness_phone));
      addUpdate('witness2_address', cleanText(scannedData.witness_address));
      addUpdate('witness2_relation', cleanText(scannedData.witness_relation));
    }

    const filledCount = Object.keys(updates).length;
    if (filledCount > 0) {
      setFormData(prev => ({ ...prev, ...updates }));
      const sectionLabel =
        type === 'customs' ? 'البيان الجمركي' :
        type === 'owner_id' ? 'بطاقة المالك' :
        type === 'witness1_id' ? 'بطاقة المعرّف الأول' : 'بطاقة المعرّف الثاني';
      setScanFeedback(`تم استخراج وتعبئة ${filledCount} حقل من ${sectionLabel} بنجاح — يرجى مراجعة البيانات قبل الحفظ.`);
    }
  };

  const handleScanComplete = (scannedData: any) => {
    if (activeScanner) {
      handleScanCompleteForType(activeScanner, scannedData);
    }
  };


  const handleSubmit = async () => {
    if (!formData.plate_number.trim()) {
      setError('الرجاء إدخال رقم اللوحة يدوياً لإتمام عملية الترقيم');
      return;
    }
    if (formData.plate_type !== 'خصوصي' && formData.plate_type !== 'نقل') {
      setError('الرجاء اختيار نوع اللوحة (خصوصي أو نقل)');
      return;
    }
    if (!formData.vehicle_type.trim() || !formData.chassis_number.trim() || !formData.owner_name.trim()) {
      setError('الرجاء تعبئة الحقول المطلوبة (نوع المركبة، رقم الشاصيه، اسم المالك)');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/register-car', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'فشل عملية الترقيم');
      }

      const newReg = await res.json();
      setSuccess(true);
      setShowCertificate(newReg);
      setFormData(initialFormState);
      setScanFeedback('');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err, 'فشل عملية الترقيم'));
    } finally {
      setSubmitting(false);
    }
  };

  if (showCertificate) {
    return <CertificateModal registration={showCertificate} onClose={() => { setShowCertificate(null); setSuccess(false); }} />;
  }

  return (
    <div className="space-y-10 pb-20">
      <div className="bg-white p-12 rounded-[4rem] border border-slate-100 card-shadow relative group">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-8">
              <div className="w-20 h-20 bg-primary-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary-200 group-hover:rotate-6 transition-transform duration-500">
                <Car className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-4xl font-black text-slate-900 tracking-tight">تقييـد مركبـة جديـدة</h3>
                <p className="text-slate-400 font-black text-sm uppercase tracking-widest mt-1">New Digital Registration Entry</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-12">
            {scanFeedback && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-2xl flex items-center justify-between gap-4 text-sm font-black">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                  <span>{scanFeedback}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setScanFeedback('')}
                  className="text-emerald-500 hover:text-emerald-700"
                  title="إغلاق التنبيه"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {/* القسم الأول: البيانات الفنية والمستندات للمركبة */}
            <div className="bg-slate-50/50 p-10 rounded-[2.5rem] border border-slate-100 space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h4 className="text-xl font-black text-slate-800 flex items-center gap-4">
                   <div className="w-2 h-8 bg-amber-500 rounded-full" />
                   البيانات الفنية للمركبة والمستندات
                </h4>
                <button
                  type="button"
                  onClick={() => setActiveScanner('customs')}
                  className="flex items-center gap-3 px-5 py-3.5 bg-primary-50 text-primary-600 hover:bg-primary-100/80 rounded-2xl font-black text-sm border border-primary-200/50 shadow-sm hover:shadow transition-all hover:scale-[1.01] active:scale-[0.99] select-none"
                >
                  <Sparkles className="w-5 h-5 text-primary-600 animate-pulse" />
                  تصوير وقراءة البيان (AI)
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <InputField
                  label="رقم اللوحة"
                  value={formData.plate_number}
                  onChange={(v: any) => setFormData({ ...formData, plate_number: v })}
                  placeholder="أدخل رقم اللوحة يدوياً..."
                  required
                />
                <div className="space-y-2 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mr-5">
                    نوع اللوحة <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-50 rounded-2xl h-[68px]">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, plate_type: 'خصوصي' })}
                      className={`rounded-xl font-black text-base transition-all ${
                        formData.plate_type === 'خصوصي'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-transparent text-slate-500 hover:bg-white hover:text-slate-700'
                      }`}
                    >
                      خصوصي
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, plate_type: 'نقل' })}
                      className={`rounded-xl font-black text-base transition-all ${
                        formData.plate_type === 'نقل'
                          ? 'bg-red-600 text-white shadow-md'
                          : 'bg-transparent text-slate-500 hover:bg-white hover:text-slate-700'
                      }`}
                    >
                      نقل
                    </button>
                  </div>
                </div>
                <InputField label="رقم البيان الجمركي" value={formData.document_number} onChange={(v:any) => setFormData({...formData, document_number: v})} placeholder="رقم التسجيل" />
                <InputField label="جهة إصدار البيان" value={formData.customs_office} onChange={(v:any) => setFormData({...formData, customs_office: v})} placeholder="جمارك ميناء..." />
                
                <InputField label="ماركة السيارة" value={formData.vehicle_make} onChange={(v:any) => setFormData({...formData, vehicle_make: v})} placeholder="تويوتا، هيونداي..." />
                <InputField label="نوع المركبة (الفئة)" value={formData.vehicle_type} onChange={(v:any) => setFormData({...formData, vehicle_type: v})} placeholder="صالون، باص، نقل، شاحنة..." required />
                <InputField label="طراز المركبة (الموديل)" value={formData.vehicle_model} onChange={(v:any) => setFormData({...formData, vehicle_model: v})} placeholder="هايلكس، كورولا، كامري..." required />
                <InputField label="شكل السيارة (الهيكل)" value={formData.vehicle_shape} onChange={(v:any) => setFormData({...formData, vehicle_shape: v})} placeholder="حوض، قبة، عائلي..." />
                <InputField label="لون السيارة" value={formData.vehicle_color} onChange={(v:any) => setFormData({...formData, vehicle_color: v})} placeholder="أبيض، رصاصي..." />
                <InputField label="سنة الصنع" value={formData.model_year} onChange={(v:any) => setFormData({...formData, model_year: v})} placeholder="2025" />
                
                <InputField label="رقم الشاصيه (VIN)" value={formData.chassis_number} onChange={(v:any) => setFormData({...formData, chassis_number: v})} placeholder="رقم الهيكل VIN" required />
                <InputField label="رقم المحرك" value={formData.engine_number} onChange={(v:any) => setFormData({...formData, engine_number: v})} placeholder="رقم الموتور" />
                <InputField label="عدد الأسطوانات" value={formData.cylinders} onChange={(v:any) => setFormData({...formData, cylinders: v})} placeholder="4, 6, 8" />
                <InputField label="نوع الوقود" value={formData.fuel_type} onChange={(v:any) => setFormData({...formData, fuel_type: v})} placeholder="بنزين / ديزل" />
              </div>
            </div>

            {/* القسم الثاني: بيانات المالك الديموغرافية */}
            <div className="p-10 rounded-[2.5rem] border border-slate-100 space-y-8 bg-slate-50/20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h4 className="text-xl font-black text-slate-800 flex items-center gap-4">
                   <div className="w-2 h-8 bg-indigo-500 rounded-full" />
                   البيانات الشخصية للمالك
                </h4>
                <button
                  type="button"
                  onClick={() => setActiveScanner('owner_id')}
                  className="flex items-center gap-3 px-5 py-3.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100/80 rounded-2xl font-black text-sm border border-indigo-200/50 shadow-sm hover:shadow transition-all hover:scale-[1.01] active:scale-[0.99] select-none"
                >
                  <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                  تصوير وقراءة بطاقة المالك (AI)
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                   <InputField label="اسم المالك بالكامل" value={formData.owner_name} onChange={(v:any) => setFormData({...formData, owner_name: v})} placeholder="الاسم الرباعي من الهوية" required />
                </div>
                <InputField label="رقم الهاتف" value={formData.owner_phone} onChange={(v:any) => setFormData({...formData, owner_phone: v})} placeholder="771234567" />
                <InputField label="فصيلة الدم" value={formData.blood_type} onChange={(v:any) => setFormData({...formData, blood_type: v})} placeholder="A+, O-..." />
                
                <div className="space-y-2 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mr-5">
                    نوع الهوية
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-50 rounded-2xl h-[68px]">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, id_type: 'بطاقة شخصية' })}
                      className={`rounded-xl font-black text-sm transition-all ${
                        formData.id_type !== 'جواز سفر'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-transparent text-slate-500 hover:bg-white hover:text-slate-700'
                      }`}
                    >
                      بطاقة شخصية
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, id_type: 'جواز سفر' })}
                      className={`rounded-xl font-black text-sm transition-all ${
                        formData.id_type === 'جواز سفر'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-transparent text-slate-500 hover:bg-white hover:text-slate-700'
                      }`}
                    >
                      جواز سفر
                    </button>
                  </div>
                </div>
                <InputField label="رقم الهوية" value={formData.id_number} onChange={(v:any) => setFormData({...formData, id_number: v})} placeholder={formData.id_type === 'جواز سفر' ? 'رقم الجواز' : 'رقم البطاقة'} />
                <InputField label="مكان الإصدار" value={formData.issue_place} onChange={(v:any) => setFormData({...formData, issue_place: v})} placeholder="تعز، إب..." />
                <div className="md:col-span-2 lg:col-span-3">
                   <InputField label="العنوان الحالي" value={formData.address} onChange={(v:any) => setFormData({...formData, address: v})} placeholder="المدينة - الحي - الشارع" />
                </div>
              </div>
            </div>

            {/* القسم الثالث: الصورة الشخصية للمالك */}
            <div className="bg-slate-50/50 p-10 rounded-[2.5rem] border border-slate-100 space-y-8">
              <h4 className="text-xl font-black text-slate-800 flex items-center gap-4">
                 <div className="w-2 h-8 bg-pink-500 rounded-full" />
                 الصورة الشخصية للمالك
              </h4>
              <div className="max-w-md mx-auto bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center w-full">
                <PhotoCaptureInput 
                  label="صورة المالك الشخصية" 
                  value={formData.owner_photo} 
                  onChange={(v:any) => setFormData({...formData, owner_photo: v})} 
                  id="owner-photo" 
                />
              </div>
            </div>

            {/* القسم الرابع: بيانات المعرفين */}
            <div className="p-8 rounded-[2.5rem] border border-slate-100 space-y-8">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* المعرف الأول */}
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <h4 className="text-lg font-black text-slate-700 flex items-center gap-3">
                        <div className="w-2 h-6 bg-slate-400 rounded-full" />
                        بيانات المعرف الأول
                      </h4>
                      <button
                        type="button"
                        onClick={() => setActiveScanner('witness1_id')}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200/80 rounded-xl font-black text-xs border border-slate-200 shadow-sm hover:shadow transition-all hover:scale-[1.01] active:scale-[0.99] select-none"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-slate-500 animate-pulse" />
                        مسح بطاقة المعرّف 1
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="md:col-span-2">
                         <InputField label="اسم المعرف" value={formData.witness1_name} onChange={(v:any) => setFormData({...formData, witness1_name: v})} placeholder="الاسم الرباعي" />
                       </div>
                       <InputField label="الرقم الوطني" value={formData.witness1_id} onChange={(v:any) => setFormData({...formData, witness1_id: v})} placeholder="1029384756" />
                       <InputField label="صلة القرابة" value={formData.witness1_relation} onChange={(v:any) => setFormData({...formData, witness1_relation: v})} placeholder="أب، أخ، صديق..." />
                       <InputField label="رقم الهاتف" value={formData.witness1_phone} onChange={(v:any) => setFormData({...formData, witness1_phone: v})} placeholder="771234567" />
                       <InputField label="السكن" value={formData.witness1_address} onChange={(v:any) => setFormData({...formData, witness1_address: v})} placeholder="العنوان بالتفصيل" />
                    </div>
                  </div>

                  {/* المعرف الثاني */}
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <h4 className="text-lg font-black text-slate-700 flex items-center gap-3">
                        <div className="w-2 h-6 bg-slate-400 rounded-full" />
                        بيانات المعرف الثاني
                      </h4>
                      <button
                        type="button"
                        onClick={() => setActiveScanner('witness2_id')}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200/80 rounded-xl font-black text-xs border border-slate-200 shadow-sm hover:shadow transition-all hover:scale-[1.01] active:scale-[0.99] select-none"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-slate-500 animate-pulse" />
                        مسح بطاقة المعرّف 2
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="md:col-span-2">
                         <InputField label="اسم المعرف" value={formData.witness2_name} onChange={(v:any) => setFormData({...formData, witness2_name: v})} placeholder="الاسم الرباعي" />
                       </div>
                       <InputField label="الرقم الوطني" value={formData.witness2_id} onChange={(v:any) => setFormData({...formData, witness2_id: v})} placeholder="1029384756" />
                       <InputField label="صلة القرابة" value={formData.witness2_relation} onChange={(v:any) => setFormData({...formData, witness2_relation: v})} placeholder="أب، أخ، صديق..." />
                       <InputField label="رقم الهاتف" value={formData.witness2_phone} onChange={(v:any) => setFormData({...formData, witness2_phone: v})} placeholder="771234567" />
                       <InputField label="السكن" value={formData.witness2_address} onChange={(v:any) => setFormData({...formData, witness2_address: v})} placeholder="العنوان بالتفصيل" />
                    </div>
                  </div>
               </div>
            </div>

            {/* القسم الخامس: صورة اللوحة */}
            <div className="bg-slate-50/50 p-10 rounded-[2.5rem] border border-slate-100 space-y-8">
              <h4 className="text-xl font-black text-slate-800 flex items-center gap-4">
                 <div className="w-2 h-8 bg-blue-500 rounded-full" />
                 صورة اللوحة الرسمية للمركبة
              </h4>
              <div className="max-w-md mx-auto bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center w-full">
                <PhotoCaptureInput 
                  label="صورة اللوحة الرسمية للمركبة" 
                  value={formData.plate_photo} 
                  onChange={(v:any) => setFormData({...formData, plate_photo: v})} 
                  id="plate-photo" 
                />
              </div>
            </div>

            <InputField label="ملاحظات إضافية" value={formData.notes} onChange={(v:any) => setFormData({...formData, notes: v})} placeholder="أي تفاصيل أخرى لمدير اللجنة الفنية أو الجمارك..." />
          </div>

          <div className="mt-12 pt-10 border-t border-slate-50 flex flex-col md:flex-row justify-end gap-6">
            {error && (
              <div className="flex-1 bg-red-50 text-red-600 px-6 py-4 rounded-2xl flex items-center gap-4 text-sm font-black border border-red-100">
                <AlertCircle className="w-6 h-6 shrink-0" />
                {error}
              </div>
            )}
            <button 
              type="button"
              onClick={() => { setFormData(initialFormState); setError(''); setScanFeedback(''); }}
              className="px-10 py-5 border-2 border-slate-100 text-slate-400 rounded-[1.75rem] font-black text-xl hover:bg-slate-50 transition-all"
            >
              إلغاء التعبأة
            </button>
            <button 
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 md:flex-none bg-emerald-600 text-white px-16 py-5 rounded-[1.75rem] font-black text-2xl hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-100 flex items-center justify-center gap-5 disabled:opacity-50 active:scale-[0.98]"
            >
              {submitting ? <Loader2 className="w-10 h-10 animate-spin" /> : <ClipboardCheck className="w-10 h-10" />}
              حفظ وتصدير الإستمارة
            </button>
          </div>
        </div>
        <div className="absolute inset-0 overflow-hidden rounded-[4rem] pointer-events-none">
          <div className="absolute -top-64 -right-64 w-[500px] h-[500px] bg-emerald-50 rounded-full opacity-30 blur-[120px]" />
        </div>
      </div>

      {activeScanner && (
        <AIScannerModal
          docType={activeScanner}
          onClose={() => setActiveScanner(null)}
          onScanComplete={handleScanComplete}
          title={
            activeScanner === 'customs' ? 'تصوير وقراءة البيان الجمركي للسيارة' :
            activeScanner === 'owner_id' ? 'تصوير وقراءة البطاقة الشخصية للمالك' :
            activeScanner === 'witness1_id' ? 'تصوير وقراءة بطاقة المعرّف الأول' :
            'تصوير وقراءة بطاقة المعرّف الثاني'
          }
        />
      )}
    </div>
  );
}

function FullArchiveView({ registrations, onRefresh }: { registrations: Registration[], onRefresh?: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [editingReg, setEditingReg] = useState<Registration | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const sortedRegistrations = [...registrations].sort(
    (a, b) => new Date(b.registration_date || 0).getTime() - new Date(a.registration_date || 0).getTime()
  );

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filtered = sortedRegistrations.filter(r => {
    if (!normalizedSearch) return true;
    return (
      String(r.owner_name || '').toLowerCase().includes(normalizedSearch) ||
      String(r.plate_number || '').toLowerCase().includes(normalizedSearch) ||
      String(r.chassis_number || '').toLowerCase().includes(normalizedSearch) ||
      String(r.vehicle_type || '').toLowerCase().includes(normalizedSearch) ||
      String(r.vehicle_model || '').toLowerCase().includes(normalizedSearch) ||
      String(r.vehicle_make || '').toLowerCase().includes(normalizedSearch)
    );
  });

  const displayedRegistrations = normalizedSearch ? filtered : filtered.slice(0, 5);

  const handlePrint = () => {
    window.print();
  };

  const handleUpdateReg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReg) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/registrations/${editingReg.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingReg),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'فشل تحديث بيانات المعاملة');
      }

      alert('تم تحديث بيانات المعاملة بنجاح');
      setEditingReg(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error(err);
      alert(getFriendlyErrorMessage(err, 'حدث خطأ أثناء التحديث'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {selectedReg && <CertificateModal registration={selectedReg} onClose={() => setSelectedReg(null)} />}
      
      <AnimatePresence>
        {editingReg && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-6 no-print overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-4xl w-full card-shadow space-y-8 my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-800">تعديل بيانات معاملة الترقيم</h3>
                  <p className="text-sm text-slate-400 font-bold mt-1">تحديث معلومات المعاملة رقم: <span className="font-mono">{editingReg.id}</span></p>
                </div>
                <button onClick={() => setEditingReg(null)} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateReg} className="space-y-8 text-right" dir="rtl">
                {/* قسم بيانات المالك */}
                <div className="space-y-4">
                  <h4 className="text-lg font-black text-primary-600 border-r-4 border-primary-500 pr-3 text-right">بيانات المالك الرئيسي</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InputField 
                      label="الاسم الكامل للمالك" 
                      value={editingReg.owner_name || ''} 
                      onChange={(v:any) => setEditingReg({...editingReg, owner_name: v})} 
                      placeholder="الاسم الكامل" 
                      required 
                    />
                    <InputField 
                      label="رقم الهاتف" 
                      value={editingReg.owner_phone || ''} 
                      onChange={(v:any) => setEditingReg({...editingReg, owner_phone: v})} 
                      placeholder="771234567" 
                    />
                    <InputField 
                      label="رقم الهوية الإثباتية" 
                      value={editingReg.id_number || ''} 
                      onChange={(v:any) => setEditingReg({...editingReg, id_number: v})} 
                      placeholder="رقم الهوية" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2 group">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mr-5 transition-colors group-focus-within:text-primary-500">نوع الهوية</label>
                      <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-50 rounded-2xl h-[68px]">
                        <button
                          type="button"
                          onClick={() => setEditingReg({ ...editingReg, id_type: 'بطاقة شخصية' })}
                          className={`rounded-xl font-black text-xs transition-all ${
                            !String(editingReg.id_type || '').includes('جواز')
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'bg-transparent text-slate-500 hover:bg-white hover:text-slate-700'
                          }`}
                        >
                          بطاقة شخصية
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingReg({ ...editingReg, id_type: 'جواز سفر' })}
                          className={`rounded-xl font-black text-xs transition-all ${
                            String(editingReg.id_type || '').includes('جواز')
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'bg-transparent text-slate-500 hover:bg-white hover:text-slate-700'
                          }`}
                        >
                          جواز سفر
                        </button>
                      </div>
                    </div>
                    <InputField 
                      label="مكان الإصدار" 
                      value={editingReg.issue_place || ''} 
                      onChange={(v:any) => setEditingReg({...editingReg, issue_place: v})} 
                      placeholder="تعز، إب..." 
                    />
                    <InputField 
                      label="فصيلة الدم" 
                      value={editingReg.blood_type || ''} 
                      onChange={(v:any) => setEditingReg({...editingReg, blood_type: v})} 
                      placeholder="A+, O-..." 
                    />
                    <InputField 
                      label="العنوان الكامل" 
                      value={editingReg.address || ''} 
                      onChange={(v:any) => setEditingReg({...editingReg, address: v})} 
                      placeholder="المدينة - الحي - الشارع" 
                    />
                  </div>
                </div>

                {/* قسم بيانات المركبة واللوحة */}
                {/* قسم بيانات المركبة واللوحة */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-lg font-black text-primary-600 border-r-4 border-primary-500 pr-3 text-right">مواصفات المركبة واللوحة</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <InputField 
                      label="رقم اللوحة" 
                      value={editingReg.plate_number || ''} 
                      onChange={(v:any) => setEditingReg({...editingReg, plate_number: v})} 
                      placeholder="رقم اللوحة" 
                      required 
                    />
                    <div className="space-y-2 group">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mr-5 transition-colors group-focus-within:text-primary-500">نوع اللوحة</label>
                      <select 
                        value={editingReg.plate_type === 'نقل' ? 'نقل' : 'خصوصي'} 
                        onChange={e => setEditingReg({...editingReg, plate_type: e.target.value})} 
                        className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-slate-700 outline-none focus:border-primary-500/20 focus:bg-white transition-all text-right h-[68px]"
                      >
                        <option value="خصوصي">خصوصي</option>
                        <option value="نقل">نقل</option>
                      </select>
                    </div>
                    <InputField 
                      label="الماركة (الشركة الصانعة)" 
                      value={editingReg.vehicle_make || ''} 
                      onChange={(v:any) => setEditingReg({...editingReg, vehicle_make: v})} 
                      placeholder="تويوتا، هيونداي..." 
                    />
                    <InputField 
                      label="نوع المركبة (الفئة)" 
                      value={editingReg.vehicle_type || ''} 
                      onChange={(v:any) => setEditingReg({...editingReg, vehicle_type: v})} 
                      placeholder="صالون، باص، نقل..." 
                      required 
                    />
                    <InputField 
                      label="طراز المركبة (الموديل)" 
                      value={editingReg.vehicle_model || ''} 
                      onChange={(v:any) => setEditingReg({...editingReg, vehicle_model: v})} 
                      placeholder="هايلكس، كورولا..." 
                      required 
                    />
                    <InputField 
                      label="شكل المركبة (الهيكل)" 
                      value={editingReg.vehicle_shape || ''} 
                      onChange={(v:any) => setEditingReg({...editingReg, vehicle_shape: v})} 
                      placeholder="حوض، قبة، عائلي..." 
                    />
                    <InputField 
                      label="رقم الشاصية (VIN)" 
                      value={editingReg.chassis_number || ''} 
                      onChange={(v:any) => setEditingReg({...editingReg, chassis_number: v})} 
                      placeholder="رقم الشاصيه" 
                      required 
                    />
                    <InputField 
                      label="رقم المحرك" 
                      value={editingReg.engine_number || ''} 
                      onChange={(v:any) => setEditingReg({...editingReg, engine_number: v})} 
                      placeholder="رقم المحرك" 
                    />
                    <InputField 
                      label="لون المركبة" 
                      value={editingReg.vehicle_color || ''} 
                      onChange={(v:any) => setEditingReg({...editingReg, vehicle_color: v})} 
                      placeholder="أبيض، رصاصي..." 
                    />
                    <InputField 
                      label="سنة الصنع" 
                      value={editingReg.model_year || ''} 
                      onChange={(v:any) => setEditingReg({...editingReg, model_year: v})} 
                      placeholder="2025" 
                    />
                    <div className="space-y-2 group">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mr-5 transition-colors group-focus-within:text-primary-500">عدد الأسطوانات</label>
                      <select 
                        value={editingReg.cylinders || '4'} 
                        onChange={e => setEditingReg({...editingReg, cylinders: e.target.value})} 
                        className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-slate-700 outline-none focus:border-primary-500/20 focus:bg-white transition-all text-right h-[68px]"
                      >
                        <option>3</option>
                        <option>4</option>
                        <option>6</option>
                        <option>8</option>
                        <option>10</option>
                        <option>12</option>
                      </select>
                    </div>
                    <div className="space-y-2 group">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mr-5 transition-colors group-focus-within:text-primary-500">نوع الوقود</label>
                      <select 
                        value={editingReg.fuel_type || 'بنزين'} 
                        onChange={e => setEditingReg({...editingReg, fuel_type: e.target.value})} 
                        className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-slate-700 outline-none focus:border-primary-500/20 focus:bg-white transition-all text-right h-[68px]"
                      >
                        <option>بنزين</option>
                        <option>ديزل</option>
                        <option>غاز طبيعي</option>
                        <option>كهرباء</option>
                        <option>هجين (هايبرد)</option>
                      </select>
                    </div>
                    <InputField 
                      label="مكتب جمرك" 
                      value={editingReg.customs_office || ''} 
                      onChange={(v:any) => setEditingReg({...editingReg, customs_office: v})} 
                      placeholder="جهة إصدار البيان" 
                    />
                    <InputField 
                      label="رقم الصادر / البيان الجمركي" 
                      value={editingReg.document_number || ''} 
                      onChange={(v:any) => setEditingReg({...editingReg, document_number: v})} 
                      placeholder="رقم البيان" 
                    />
                  </div>
                </div>

                {/* قسم الضمانة القانونية (المعرفون) */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-lg font-black text-primary-600 border-r-4 border-primary-500 pr-3 text-right">الضمانة القانونية (المعرفون)</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* المعرّف الأول */}
                    <div className="border border-slate-100 rounded-[2rem] p-6 bg-slate-50/50 space-y-6">
                      <span className="font-black text-slate-700 block text-sm border-b pb-2">المعرّف الأول</span>
                      <div className="grid grid-cols-1 gap-6">
                        <InputField 
                          label="اسم المعرّف الأول" 
                          value={editingReg.witness1_name || ''} 
                          onChange={(v:any) => setEditingReg({...editingReg, witness1_name: v})} 
                          placeholder="الاسم الكامل" 
                        />
                        <div className="grid grid-cols-2 gap-6">
                          <InputField 
                            label="الرقم الوطني / الهوية" 
                            value={editingReg.witness1_id || ''} 
                            onChange={(v:any) => setEditingReg({...editingReg, witness1_id: v})} 
                            placeholder="1029384756" 
                          />
                          <InputField 
                            label="صلة القرابة" 
                            value={editingReg.witness1_relation || ''} 
                            onChange={(v:any) => setEditingReg({...editingReg, witness1_relation: v})} 
                            placeholder="أب، أخ، صديق..." 
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <InputField 
                            label="رقم الهاتف" 
                            value={editingReg.witness1_phone || ''} 
                            onChange={(v:any) => setEditingReg({...editingReg, witness1_phone: v})} 
                            placeholder="771234567" 
                          />
                          <InputField 
                            label="السكن" 
                            value={editingReg.witness1_address || ''} 
                            onChange={(v:any) => setEditingReg({...editingReg, witness1_address: v})} 
                            placeholder="العنوان بالتفصيل" 
                          />
                        </div>
                      </div>
                    </div>

                    {/* المعرّف الثاني */}
                    <div className="border border-slate-100 rounded-[2rem] p-6 bg-slate-50/50 space-y-6">
                      <span className="font-black text-slate-700 block text-sm border-b pb-2">المعرّف الثاني</span>
                      <div className="grid grid-cols-1 gap-6">
                        <InputField 
                          label="اسم المعرّف الثاني" 
                          value={editingReg.witness2_name || ''} 
                          onChange={(v:any) => setEditingReg({...editingReg, witness2_name: v})} 
                          placeholder="الاسم الكامل" 
                        />
                        <div className="grid grid-cols-2 gap-6">
                          <InputField 
                            label="الرقم الوطني / الهوية" 
                            value={editingReg.witness2_id || ''} 
                            onChange={(v:any) => setEditingReg({...editingReg, witness2_id: v})} 
                            placeholder="1029384756" 
                          />
                          <InputField 
                            label="صلة القرابة" 
                            value={editingReg.witness2_relation || ''} 
                            onChange={(v:any) => setEditingReg({...editingReg, witness2_relation: v})} 
                            placeholder="أب، أخ، صديق..." 
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <InputField 
                            label="رقم الهاتف" 
                            value={editingReg.witness2_phone || ''} 
                            onChange={(v:any) => setEditingReg({...editingReg, witness2_phone: v})} 
                            placeholder="771234567" 
                          />
                          <InputField 
                            label="السكن" 
                            value={editingReg.witness2_address || ''} 
                            onChange={(v:any) => setEditingReg({...editingReg, witness2_address: v})} 
                            placeholder="العنوان بالتفصيل" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* قسم الملاحظات الإضافية */}
                <div className="space-y-2 pt-4 border-t border-slate-100 text-right">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mr-5 transition-colors group-focus-within:text-primary-500 block mb-1">ملاحظات إضافية</label>
                  <textarea 
                    value={editingReg.notes || ''} 
                    onChange={e => setEditingReg({...editingReg, notes: e.target.value})} 
                    placeholder="اكتب أي معلومات تخص المركبة أو الفحص هنا..."
                    rows={2}
                    className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-slate-700 outline-none focus:border-primary-500/20 focus:bg-white focus:shadow-[0_0_30px_rgba(14,165,233,0.08)] transition-all resize-none text-right text-base leading-relaxed"
                  />
                </div>

                {/* قسم الصور والمستندات الشخصية */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-lg font-black text-primary-600 border-r-4 border-primary-500 pr-3 text-right">الصور الشخصية ولوحة المركبة</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center justify-center">
                    <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 space-y-4 flex flex-col items-center justify-center">
                      <span className="text-sm font-black text-slate-500 block mb-1">صورة المالك الشخصية</span>
                      <PhotoCaptureInput 
                        label="صورة المالك الشخصية" 
                        value={editingReg.owner_photo} 
                        onChange={(v:any) => setEditingReg({...editingReg, owner_photo: v})} 
                        id="edit-owner-photo" 
                      />
                    </div>
                    <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 space-y-4 flex flex-col items-center justify-center">
                      <span className="text-sm font-black text-slate-500 block mb-1">صورة اللوحة أو المركبة</span>
                      <PhotoCaptureInput 
                        label="صورة اللوحة أو المركبة" 
                        value={editingReg.plate_photo} 
                        onChange={(v:any) => setEditingReg({...editingReg, plate_photo: v})} 
                        id="edit-plate-photo" 
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setEditingReg(null)} 
                    className="flex-1 px-4 py-4 border-2 border-slate-100 text-slate-600 rounded-2xl font-black transition-all hover:bg-slate-50 hover:border-slate-200 text-center"
                  >
                    إلغاء التعديل
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="flex-[2] px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    حفظ التغييرات وتحديث المعاملة
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 card-shadow overflow-hidden">
        <div className="hidden print:block mb-6 pb-3 border-b-2 border-slate-200">
          <img
            src="/assets/aistudio/______________69003-4_a2ff8133.png"
            alt="الترويسة الرسمية"
            className="w-full h-auto max-h-32 object-contain mx-auto"
          />
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div>
            <h3 className="text-3xl font-black text-slate-800">الأرشيف العام للسيارات المرقمة</h3>
            <p className="text-slate-400 font-bold text-sm">
              {normalizedSearch
                ? `نتائج البحث: ${displayedRegistrations.length} معاملة`
                : `عرض آخر ${Math.min(5, filtered.length)} من أصل ${filtered.length} معاملة مسجلة (استخدم خانة البحث للوصول إلى أي معاملة أخرى)`}
            </p>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80 group">
              <Search className="w-5 h-5 absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
              <input 
                type="text" 
                placeholder="ابحث بالاسم، اللوحة أو الشاصيه..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-[60px] pr-14 pl-6 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-primary-500 focus:bg-white outline-none font-bold text-lg transition-all"
              />
            </div>
            {onRefresh && (
              <button
                type="button"
                onClick={() => onRefresh()}
                className="h-[60px] px-5 bg-slate-100 text-slate-700 rounded-2xl font-black flex items-center gap-2 hover:bg-slate-200 transition-all no-print"
                title="تحديث قائمة الأرشيف"
              >
                <RefreshCw className="w-5 h-5" />
                تحديث
              </button>
            )}
            <button 
              onClick={handlePrint}
              className="h-[60px] px-8 bg-slate-900 text-white rounded-2xl font-black flex items-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 no-print"
            >
              <Download className="w-5 h-5" />
              طباعة الأرشيف
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-50 rounded-[2rem]">
          <table className="w-full text-right border-collapse print-table">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">رقم اللوحة</th>
                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">بيانات المالك</th>
                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">نوع المركبة</th>
                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">رقم الشاصية</th>
                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest text-center no-print">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-bold">
              {displayedRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-slate-300 italic text-lg">لا توجد بيانات مطابقة لعملية البحث حالياً</td>
                </tr>
              ) : (
                displayedRegistrations.map(reg => (
                  <tr key={reg.id} className="hover:bg-primary-50/20 transition-all group">
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="text-2xl font-black text-slate-900 font-mono tracking-tighter group-hover:text-primary-600 transition-colors" dir="ltr">4-{reg.plate_number}</span>
                        <span className="text-[10px] text-slate-400 font-black uppercase opacity-60">{reg.plate_type}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="text-lg font-black text-slate-800">{reg.owner_name}</span>
                        <span className="text-xs text-slate-400">{reg.owner_phone || 'بدون هاتف'}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col">
                         <span className="text-sm font-black text-slate-700">
                           {reg.vehicle_make && `${reg.vehicle_make} `}
                           {reg.vehicle_type}
                           {reg.vehicle_model && ` (${reg.vehicle_model})`}
                         </span>
                         <span className="text-[10px] text-slate-400">
                           {reg.vehicle_color} - {reg.model_year}
                           {reg.vehicle_shape && ` | هيكل: ${reg.vehicle_shape}`}
                         </span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="text-sm font-mono text-slate-500 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">{reg.chassis_number}</span>
                    </td>
                    <td className="p-6 no-print">
                      <div className="flex justify-center gap-3">
                        <button 
                          onClick={() => setSelectedReg(reg)}
                          className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-primary-600 hover:text-white transition-all flex items-center justify-center border border-slate-100"
                          title="عرض إستمارة الترقيم"
                        >
                          <FileText className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => setEditingReg(reg)}
                          className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center border border-slate-100"
                          title="تعديل بيانات المعاملة"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ReportsView({ stats, registrations }: { stats: Stats | null, registrations: Registration[] }) {
  const [backingUp, setBackingUp] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  const handleBackup = async () => {
    setBackingUp(true);
    try {
      window.location.href = '/api/backup';
    } catch (err) {
      console.error(err);
      alert('فشل تصدير النسخة الاحتياطية');
    } finally {
      setTimeout(() => setBackingUp(false), 2000);
    }
  };

  const handleSyncCloud = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشلت عملية المزامنة');
      }
      alert(`تمت مزامنة البيانات السحابية والمحلية ثنائية الاتجاه بنجاح!\nالمركبات المدققة والمستخرجة: ${data.regsSynced}`);
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      alert(getFriendlyErrorMessage(err, 'عذراً! تعذر الاتصال بقاعدة البيانات السحابية حالياً. ستعمل الخدمة محلياً مؤقتاً لحين استقرار الاتصال.'));
    } finally {
      setSyncing(false);
    }
  };

  if (!stats) return <div className="text-center p-20 text-slate-400 font-black">جاري تحميل التقارير الذكية...</div>;

  const privateTotal = stats.privateCount ?? registrations.filter(r => r.plate_type === 'خصوصي').length;
  const transportTotal = stats.transportCount ?? registrations.filter(r => r.plate_type === 'نقل').length;

  return (
    <div className="max-w-full space-y-10 animate-in fade-in duration-700">
       <div className="flex flex-col md:flex-row justify-between items-center bg-white p-10 rounded-[3rem] border border-slate-100 card-shadow gap-6 relative overflow-hidden group">
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 bg-slate-950 rounded-3xl flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform duration-500">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-black text-3xl text-slate-800">أدوات التحكم النظامية</h3>
              <p className="text-slate-400 font-bold text-sm">إدارة البيانات، النسخ الاحتياطي، ومزامنة السحابة</p>
            </div>
          </div>
          <div className="flex items-center gap-6 w-full md:w-auto relative z-10 flex-wrap">
            <button 
              onClick={handleSyncCloud}
              disabled={syncing}
              className="flex-1 md:flex-none flex items-center justify-center gap-4 px-10 py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[1.75rem] text-xl font-black transition-all shadow-2xl active:scale-95 disabled:opacity-50 group hover:shadow-emerald-200"
            >
              <RefreshCw className={`w-7 h-7 ${syncing ? 'animate-spin' : 'group-hover:rotate-185 transition-transform duration-500'}`} />
              مزامنة السحابة ثنائية الاتجاه
            </button>
            <button 
              onClick={handleBackup}
              disabled={backingUp}
              className="flex-1 md:flex-none flex items-center justify-center gap-4 px-10 py-5 bg-slate-950 text-white rounded-[1.75rem] text-xl font-black transition-all shadow-2xl shadow-slate-200 active:scale-95 disabled:opacity-50 group hover:bg-slate-800"
            >
              <Database className={`w-7 h-7 ${backingUp ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
              تصدير الأرشيف الكامل
            </button>
          </div>
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-slate-50 rounded-full opacity-50 blur-3xl pointer-events-none" />
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard label="إجمالي المركبات المرقمة" value={stats.used} icon={Car} color="bg-emerald-600" />
        <StatCard label="مركبات الخصوصي" value={privateTotal} icon={ShieldCheck} color="bg-blue-600" />
        <StatCard label="مركبات النقل" value={transportTotal} icon={TrendingUp} color="bg-red-600" />
      </div>

      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 card-shadow">
        <div className="flex items-center gap-4 mb-10">
           <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
              <Clock className="w-6 h-6" />
           </div>
           <div>
              <h3 className="text-2xl font-black text-slate-800">سجل النشاطات العملياتية</h3>
              <p className="text-slate-400 font-bold text-sm">تتبع آخر 10 عمليات تسجيل تمت في النظام مؤخراً</p>
           </div>
        </div>
        
        <div className="space-y-4">
          {!stats || !Array.isArray(stats.recent) || stats.recent.length === 0 ? (
            <div className="py-20 text-center text-slate-300 italic text-lg bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">لا توجد سجلات نشاطات حالية</div>
          ) : (
            stats.recent.map((reg) => (
              <div key={reg.id} className="flex items-center justify-between p-6 bg-slate-50/30 hover:bg-white hover:card-shadow rounded-[2rem] border border-transparent hover:border-slate-50 transition-all group">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-primary-600 transition-colors">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-800">
                      ترقيم {reg.vehicle_make && `${reg.vehicle_make} `}{reg.vehicle_type}{reg.vehicle_model && ` (${reg.vehicle_model})`} - رقم اللوحة <span className="text-primary-700 font-mono tracking-tighter" dir="ltr">4-{reg.plate_number}</span>
                    </p>
                    <p className="text-xs text-slate-400 font-bold uppercase mt-0.5">المالك: {reg.owner_name}</p>
                  </div>
                </div>
                <div className="text-left flex flex-col items-end">
                  <p className="text-sm font-black text-slate-700">
                    {new Date(reg.registration_date).toLocaleDateString('ar-YE', { day: 'numeric', month: 'long' })}
                  </p>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">
                    الساعة: {new Date(reg.registration_date).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

