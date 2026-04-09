import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Camera, Scan as ScanIcon, QrCode } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';

export const ScanScreen = ({ onClose, onScan }: any) => {
  const [mode, setMode] = useState<'ocr' | 'qr'>('ocr');
  const [isLocalAnalyzing, setIsLocalAnalyzing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("카메라 접근 실패:", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (mode === 'ocr') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode]);

  const handleQRScan = (result: any) => {
    if (result && result.length > 0) {
      const scannedText = result[0].rawValue;
      // Mock 동작: QR에 'AF17' 등의 모델명이 들어있다고 가정
      alert(`스캔 완료! 인식된 기기 모델: ${scannedText} (Mock: AF17)`);
      // onScan(scannedText) 처럼 부모로 올려서 기기등록으로 이어질 수 있으나 현재는 Home/Chat으로 이동
      onScan(scannedText);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-6rem)] space-y-6">
      
      {/* 1. 상단 헤더 영역 (뒤로가기 + 제목) */}
      <header className="flex items-center gap-4">
        <button 
          onClick={onClose} 
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800">기기 스캔</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {mode === 'ocr' ? '가전제품을 스캔하여 즉시 도움을 받으세요' : '가전제품의 QR 코드를 스캔하세요'}
          </p>
        </div>
      </header>

      {/* 모드 토글 스위치 */}
      <div className="flex bg-slate-100 p-1 rounded-2xl mx-auto w-full max-w-sm relative">
        <div 
          className={`absolute inset-y-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm transition-transform duration-300 ease-out z-0
            ${mode === 'qr' ? 'translate-x-[calc(100%+0px)]' : 'translate-x-0'}`} 
        />
        <button 
          onClick={() => setMode('ocr')}
          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 z-10 transition-colors 
            ${mode === 'ocr' ? 'text-theme-primary' : 'text-slate-400'}`}
        >
          <Camera size={16} /> 사물/설명서 인식
        </button>
        <button 
          onClick={() => setMode('qr')}
          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 z-10 transition-colors
            ${mode === 'qr' ? 'text-theme-primary' : 'text-slate-400'}`}
        >
          <QrCode size={16} /> QR 코드
        </button>
      </div>

      {/* 2. 카메라 스캐너 뷰파인더 영역 */}
      <div className="relative flex-1 bg-[#475569] rounded-4xl overflow-hidden shadow-inner flex items-center justify-center">
        <AnimatePresence mode="wait">
          {mode === 'ocr' ? (
            <motion.div 
              key="ocr"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black"
            >
              {/* 실시간 카메라 비디오 */}
              <video 
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover opacity-70"
              />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Camera size={56} className="text-white/20" />
              </div>

              {/* 스캔 가이드라인 */}
              <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-theme-primary rounded-tl-3xl z-10" />
              <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-theme-primary rounded-tr-3xl z-10" />
              <div className="absolute bottom-8 left-8 w-12 h-12 border-b-2 border-l-2 border-theme-primary rounded-bl-3xl z-10" />
              <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-theme-primary rounded-br-3xl z-10" />

              {/* 위아래 스캔 레이저 라인 애니메이션 */}
              <motion.div
                className="absolute left-8 right-8 h-px bg-theme-primary shadow-[0_0_15px_var(--theme-primary)] z-10"
                animate={{ top: ['15%', '85%', '15%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />

              <p className="absolute bottom-6 w-full text-center text-white/80 text-[11px] font-bold tracking-wide z-10">
                가전제품 또는 라벨에 카메라를 가져다 대세요
              </p>
            </motion.div>
          ) : (
            <motion.div 
              key="qr"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <Scanner 
                onScan={handleQRScan}
                onError={(e) => console.log(e)}
              />
              <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. 하단 스캔 시작 버튼 (OCR 모드일때만 노출) */}
      <AnimatePresence>
        {mode === 'ocr' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className="flex justify-center pt-2"
          >
            <button
              onClick={async () => {
                if (isLocalAnalyzing) return;
                setIsLocalAnalyzing(true);
                // 지능형 분석 연출을 위한 딜레이 (1.5초)
                await new Promise(resolve => setTimeout(resolve, 1500));
                setIsLocalAnalyzing(false);
                onScan('ocr_image');
              }}
              disabled={isLocalAnalyzing}
              className="flex items-center gap-3 px-10 py-4 bg-wing-gradient text-white rounded-full font-bold shadow-lg shadow-theme-primary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-70 disabled:scale-100"
            >
              {isLocalAnalyzing ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <ScanIcon size={20} />
                  </motion.div>
                  기기 분석 중...
                </>
              ) : (
                <>
                  <ScanIcon size={20} />
                  분석 시작
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};