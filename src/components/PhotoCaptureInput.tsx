import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, X, RefreshCw, Eye, Loader2, Sparkles, Check, AlertCircle, RotateCw } from 'lucide-react';

// Helper to rescue large images before sending them to the API route (prevents Vercel 4.5MB limit crashes & timeouts)
const compressAndResizeImage = (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1600;
      const MAX_HEIGHT = 1600;
      let width = img.width;
      let height = img.height;

      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        if (width > height) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        } else {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

interface PhotoCaptureInputProps {
  label: string;
  value: string; // Base64 string
  onChange: (base64: string) => void;
  id: string;
  docType?: 'customs' | 'owner_id' | 'witness1_id' | 'witness2_id';
  onScanComplete?: (data: any) => void;
}

export function PhotoCaptureInput({ label, value, onChange, id, docType, onScanComplete }: PhotoCaptureInputProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // AI Extraction States
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');
  const [extractSuccess, setExtractSuccess] = useState(false);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Reset states when the image changes (or is deleted)
  useEffect(() => {
    if (!value) {
      setExtractError('');
      setExtractSuccess(false);
      setExtracting(false);
    }
  }, [value]);

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      setStream(mediaStream);
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(err => console.error("Video error:", err));
        }
      }, 100);
    } catch (err) {
      console.error("Camera access failed:", err);
      alert("لا يمكن الوصول للكاميرا. يرجى التأكد من الصلاحيات أو رفع ملف من الجهاز.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        
        // Draw the current video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get base64 Data URL (using standard toDataURL)
        const base64 = canvas.toDataURL('image/jpeg', 0.82);
        
        compressAndResizeImage(base64).then(compressed => {
          onChange(compressed);
        });
        
        // Close camera
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const handleExtract = async () => {
    if (!value || !docType || !onScanComplete) return;
    setExtracting(true);
    setExtractError('');
    setExtractSuccess(false);

    try {
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: value,
          docType: docType === 'witness1_id' || docType === 'witness2_id' ? 'witness' : docType
        })
      });

      const rawText = await response.text();
      let parsedBody: any = null;
      try {
        parsedBody = rawText ? JSON.parse(rawText) : null;
      } catch {
        parsedBody = null;
      }

      if (!response.ok) {
        throw new Error(parsedBody?.error || 'حدث خطأ أثناء قراءة الصورة');
      }

      const extractedData = parsedBody;
      setExtractSuccess(true);
      onScanComplete(extractedData);
    } catch (err: any) {
      console.error("Extraction error:", err);
      setExtractError(err.message || 'فشل استخراج البيانات بالذكاء الاصطناعي');
    } finally {
      setExtracting(false);
    }
  };

  const handleRotate = () => {
    if (!value) return;
    const img = new Image();
    if (!value.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalHeight || img.height;
        canvas.height = img.naturalWidth || img.width;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        onChange(canvas.toDataURL('image/jpeg', 0.88));
      } catch (err) {
        console.error('Failed to rotate image:', err);
      }
    };
    img.src = value;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const rawBase64 = reader.result as string;
        compressAndResizeImage(rawBase64).then(compressed => {
          onChange(compressed);
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-3 group w-full" id={`photo-container-${id}`}>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mr-6 group-focus-within:text-primary-500 transition-colors">
        {label}
      </label>
      
      <div className="w-full min-h-[140px] bg-white border border-slate-200/60 rounded-3xl p-4 flex flex-col items-center justify-center relative shadow-sm hover:shadow transition-all group-focus-within:border-primary-500/30">
        
        {showCamera ? (
          <div className="w-full flex flex-col items-center gap-3">
            <div className="relative w-full aspect-video max-w-xs bg-black rounded-2xl overflow-hidden border border-slate-200">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={capturePhoto}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all shadow-sm"
              >
                التقاط صورة
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl font-bold text-xs transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        ) : value ? (
          <div className="relative w-full flex flex-col items-center">
            {/* Image Preview */}
            <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
              <img 
                src={value} 
                alt="preview" 
                className="w-full h-full object-cover" 
              />
              <button
                type="button"
                onClick={handleRotate}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-900/75 text-white flex items-center justify-center hover:bg-slate-900 transition-all shadow focus:outline-none"
                title="تدوير الصورة 90 درجة"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                className="absolute top-1 left-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all shadow focus:outline-none"
                title="إزالة الصورة"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-[10px] text-emerald-600 font-bold mt-2">تم تحميل الصورة بنجاح</span>

            {/* AI Extraction Button if docType and onScanComplete are provided */}
            {docType && onScanComplete && (
              <div className="mt-4 w-full flex flex-col items-center border-t border-slate-100/70 pt-3">
                {extracting ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 border border-primary-100/50 rounded-2xl font-black text-xs animate-pulse">
                    <Loader2 className="w-4 h-4 text-primary-600 animate-spin" />
                    جاري استخراج البيانات بالذكاء الاصطناعي...
                  </div>
                ) : extractSuccess ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100/50 rounded-2xl font-black text-xs animate-bounce">
                    <Check className="w-4 h-4 text-emerald-600" />
                    تم تفريغ واستخراج البيانات بنجاح!
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleExtract}
                      className="flex items-center gap-4 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-2xl font-black text-xs transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-emerald-100/60 cursor-pointer select-none"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-100 animate-pulse" />
                      استخراج البيانات وتعبئة الحقول
                    </button>
                    {extractError && (
                      <div className="mt-2 text-[10px] text-red-500 font-bold bg-red-50 px-3 py-1 border border-red-100 rounded-xl flex items-center gap-1 max-w-[200px] text-center">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{extractError}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

        ) : (
          <div className="flex flex-col items-center justify-center py-4 w-full">
            <span className="text-xs text-slate-400 font-bold mb-4">لم يتم تحديد صورة بعد</span>
            
            <div className="flex items-center gap-3">
              {/* Camera Button */}
              <button
                type="button"
                onClick={startCamera}
                className="flex items-center gap-2 px-4 py-3 bg-primary-50 text-primary-600 hover:bg-primary-100/70 border border-primary-100/50 rounded-2xl font-black text-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Camera className="w-4 h-4" />
                تصوير مباشر
              </button>
              
              {/* Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100/70 border border-indigo-100/50 rounded-2xl font-black text-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Upload className="w-4 h-4" />
                ملف من الجهاز
              </button>
            </div>
          </div>
        )}

        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange}
          accept="image/*"
          className="hidden" 
        />
        
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
