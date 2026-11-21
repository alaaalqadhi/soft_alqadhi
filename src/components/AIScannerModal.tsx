import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Loader2, Sparkles, Check, AlertCircle, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Helper to rescue large images before sending them to the API route (prevents Vercel 4.5MB limit crashes & timeouts)
const compressAndResizeImage = (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1000; // Optimal size for document OCR scanning
      const MAX_HEIGHT = 1000;
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
        // Compress as image/jpeg with 0.75 quality for super high compression & decent OCR details
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

interface AIScannerModalProps {
  onClose: () => void;
  onScanComplete: (data: any) => void;
  docType: 'customs' | 'owner_id' | 'witness1_id' | 'witness2_id';
  title: string;
}

export function AIScannerModal({ onClose, onScanComplete, docType, title }: AIScannerModalProps) {
  const [activeMode, setActiveMode] = useState<'select' | 'camera' | 'upload'>('select');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [success, setSuccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      setCameraError('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setStream(mediaStream);
      setIsCameraActive(true);
      setActiveMode('camera');
      
      // Allow video element to bind and play
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(err => {
            console.error("Video play failed:", err);
          });
        }
      }, 100);
    } catch (err: any) {
      console.error('Camera access failed:', err);
      setCameraError('لا يمكن الوصول إلى الكاميرا. يرجى التأكد من منح الإذن أو استخدام خيار معرض الصور.');
      setActiveMode('upload');
    }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Set canvas dimensions matching current video size
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64 (using standard toDataURL, and wrapping with compression)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        
        compressAndResizeImage(dataUrl).then(compressed => {
          setCapturedImage(compressed);
        });
        
        // Stop camera stream to release webcam
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
        setIsCameraActive(false);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const rawBase64 = reader.result as string;
        compressAndResizeImage(rawBase64).then(compressed => {
          setCapturedImage(compressed);
          setActiveMode('upload');
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const processImageWithAI = async () => {
    if (!capturedImage) return;
    setScanning(true);
    setScanError('');
    
    try {
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: capturedImage,
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
        throw new Error(parsedBody?.error || 'حدث خطأ في قراءة الصورة بالذكاء الاصطناعي');
      }

      const extractedData = parsedBody;
      setSuccess(true);
      
      setTimeout(() => {
        onScanComplete(extractedData);
        onClose();
      }, 1200);
      
    } catch (err: any) {
      console.error('Scan processing error:', err);
      setScanError(err?.message || 'فشل الاتصال بخادم الذكاء الاصطناعي، يرجى المحاولة لاحقاً');
    } finally {
      setScanning(false);
    }
  };

  const resetScanner = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
    setCapturedImage(null);
    setActiveMode('select');
    setScanError('');
    setSuccess(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[200] p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] w-full max-w-2xl border border-slate-100 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-600">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">التحليل الفوري القائم على ذكاء الـ Gemini</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center min-h-[350px]">
          
          <AnimatePresence mode="wait">
            
            {/* 1. Mode Selection Screen */}
            {activeMode === 'select' && !capturedImage && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="w-full space-y-8 flex flex-col items-center py-6"
              >
                <div className="text-center max-w-md space-y-3">
                  <p className="text-slate-600 font-bold leading-relaxed">
                    باستخدام محرك الذكاء الاصطناعي، يمكنك تصوير أو اختيار صورة الهوية/الوثيقة وسيتم تعبئة البيانات تلقائياً في ثوانٍ معدودة.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-md">
                  {/* Camera Option */}
                  <button
                    onClick={startCamera}
                    type="button"
                    className="flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl group hover:border-primary-500 hover:bg-primary-50/20 transition-all duration-300 pointer-events-auto cursor-pointer"
                  >
                    <div className="w-14 h-14 bg-white shadow-md rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-primary-500 group-hover:scale-110 transition-all duration-300">
                      <Camera className="w-7 h-7 text-primary-500" />
                    </div>
                    <span className="mt-4 font-black text-slate-800 text-lg">الخيار الأول: تصوير مباشر</span>
                    <span className="text-[10px] text-primary-600 font-bold mt-1 bg-primary-50 px-3 py-1 rounded-full border border-primary-100/50">بث حي للكاميرا</span>
                  </button>

                  {/* Upload Option */}
                  <button
                    onClick={triggerFileSelect}
                    type="button"
                    className="flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl group hover:border-indigo-500 hover:bg-indigo-50/20 transition-all duration-300 pointer-events-auto cursor-pointer"
                  >
                    <div className="w-14 h-14 bg-white shadow-md rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-500 group-hover:scale-110 transition-all duration-300">
                      <Upload className="w-7 h-7 text-indigo-500" />
                    </div>
                    <span className="mt-4 font-black text-slate-800 text-lg">الخيار الثاني: صورة من الجهاز</span>
                    <span className="text-[10px] text-indigo-600 font-bold mt-1 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100/50">استوديو وملفات الجوال</span>
                  </button>
                </div>

                {cameraError && (
                  <div className="bg-amber-50 text-amber-600 px-6 py-4 rounded-2xl flex items-center gap-3 text-sm font-bold border border-amber-100 max-w-md">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {cameraError}
                  </div>
                )}
              </motion.div>
            )}

            {/* 2. Live Camera Screen */}
            {activeMode === 'camera' && isCameraActive && !capturedImage && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex flex-col items-center space-y-6"
              >
                <div className="relative w-full aspect-video md:max-w-md bg-black rounded-3xl overflow-hidden shadow-inner border border-slate-200">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted
                    className="w-full h-full object-cover scale-x-[-1] md:scale-x-1"
                  />
                  
                  {/* Overlay guidelines box */}
                  <div className="absolute inset-0 border-[30px] border-black/40 flex items-center justify-center">
                    <div className="w-[85%] h-[80%] border-2 border-dashed border-white/60 rounded-xl relative">
                      <div className="absolute top-2 right-2 text-white/50 text-[10px] font-black pointer-events-none">ضع المستند هنا</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={handleCapture}
                    type="button"
                    className="px-8 py-4 bg-primary-600 text-white rounded-2xl font-black shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    التقط فوتوغرافياً
                  </button>
                  <button
                    onClick={resetScanner}
                    type="button"
                    className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black transition-all active:scale-95"
                  >
                    تراجع
                  </button>
                </div>
              </motion.div>
            )}

            {/* 3. Image Captured / Preview (Scanning State) Screen */}
            {capturedImage && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex flex-col items-center space-y-6"
              >
                <div className="relative max-w-md w-full aspect-[4/3] bg-slate-100 rounded-3xl overflow-hidden shadow-md border border-slate-200">
                  <img 
                    src={capturedImage} 
                    alt="Captured Doc" 
                    className="w-full h-full object-contain"
                  />
                  
                  {/* Moving scanner laser overlay */}
                  {scanning && (
                    <div className="absolute inset-x-0 w-full bg-gradient-to-b from-primary-400/0 via-primary-500/50 to-primary-400/0 h-8 animate-scanner pointer-events-none" />
                  )}

                  {/* Soft Success/Scanning glass badge */}
                  {(scanning || success) && (
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex flex-col items-center justify-center gap-4">
                      {scanning && (
                        <>
                          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center shadow-lg">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                          </div>
                          <span className="text-white font-black text-lg text-center drop-shadow-sm px-6">
                            جاري ذكاء الـ Gemini...
                            <br />
                            <span className="text-xs font-bold text-white/80">قراءة وتفريغ محتويات المستند</span>
                          </span>
                        </>
                      )}
                      {success && (
                        <motion.div 
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="flex flex-col items-center gap-3"
                        >
                          <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg text-white">
                            <Check className="w-9 h-9 animate-bounce" />
                          </div>
                          <span className="text-white font-black text-xl drop-shadow-sm">تم استخراج البيانات بنجاح!</span>
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>

                {!scanning && !success && (
                  <div className="flex flex-col items-center gap-4 w-full max-w-md">
                    <div className="flex items-center gap-4 w-full">
                      <button
                        onClick={processImageWithAI}
                        type="button"
                        className="flex-1 px-8 py-5 bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-3"
                      >
                        <Sparkles className="w-6 h-6" />
                        الاستخراج بالذكاء الاصطناعي
                      </button>
                      
                      <button
                        onClick={resetScanner}
                        type="button"
                        className="px-6 py-5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black transition-all active:scale-95"
                      >
                        إعادة تصوير
                      </button>
                    </div>

                    {scanError && (
                      <div className="w-full bg-red-50 text-red-600 px-6 py-4 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red-100">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span className="leading-relaxed">{scanError}</span>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>

          {/* Hidden file input */}
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden" 
          />
          
          <canvas ref={canvasRef} className="hidden" />
          
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
          <span className="text-xs font-bold text-slate-400">نظام لجنة الترقيم - الإصدار الرقمي جمارك محافظة تعز</span>
          {capturedImage && !scanning && !success && (
            <button
              onClick={resetScanner}
              type="button"
              className="text-xs text-primary-600 hover:text-primary-700 font-bold underline"
            >
              الرجوع للبداية
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
