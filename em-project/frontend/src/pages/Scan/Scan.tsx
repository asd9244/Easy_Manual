import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';

export const ScanScreen = ({ onClose, onScan }: any) => {

  const handleQRScan = (result: any) => {
    if (result && result.length > 0) {
      const scannedText = result[0].rawValue;
      // 스캔된 원본 결과값 (모델명이나 URL)을 그대로 기기 등록(onScan)으로 넘김
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
            가전제품의 QR 코드를 스캔하세요
          </p>
        </div>
      </header>

      {/* 2. 카메라 스캐너 뷰파인더 영역 */}
      <div className="relative flex-1 bg-[#475569] rounded-4xl overflow-hidden shadow-inner flex items-center justify-center">
        <AnimatePresence mode="wait">
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
        </AnimatePresence>
      </div>
    </div>
  );
};