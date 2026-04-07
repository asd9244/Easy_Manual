import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Camera, Scan as ScanIcon } from 'lucide-react';

export const ScanScreen = ({ onClose, onScan }: any) => {
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
        <div>
          <h1 className="text-2xl font-bold text-slate-800">기기 스캔</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">가전제품을 스캔하여 즉시 도움을 받으세요</p>
        </div>
      </header>

      {/* 2. 카메라 스캐너 뷰파인더 영역 */}
      <div className="relative flex-1 bg-[#475569] rounded-4xl overflow-hidden shadow-inner flex items-center justify-center">
        {/* 가운데 카메라 아이콘 워터마크 */}
        <Camera size={56} className="text-white/10" />

        {/* 스캔 가이드라인 (네 모서리 둥근 괄호) */}
        <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-theme-primary rounded-tl-3xl" />
        <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-theme-primary rounded-tr-3xl" />
        <div className="absolute bottom-8 left-8 w-12 h-12 border-b-2 border-l-2 border-theme-primary rounded-bl-3xl" />
        <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-theme-primary rounded-br-3xl" />

        {/* 위아래로 스캔하는 레이저 라인 애니메이션 */}
        <motion.div
          className="absolute left-8 right-8 h-px bg-theme-primary shadow-[0_0_15px_var(--theme-primary)]"
          animate={{ top: ['15%', '85%', '15%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />

        {/* 하단 안내 문구 */}
        <p className="absolute bottom-6 w-full text-center text-white/60 text-[11px] font-bold tracking-wide">
          가전제품 또는 라벨에 카메라를 가져다 대세요
        </p>
      </div>

      {/* 3. 하단 스캔 시작 버튼 */}
      <div className="flex justify-center pt-2">
        <button
          onClick={onScan}
          className="flex items-center gap-2 px-10 py-4 bg-wing-gradient text-white rounded-full font-bold shadow-lg shadow-theme-primary/30 hover:scale-105 active:scale-95 transition-all"
        >
          <ScanIcon size={20} />
          스캔 시작
        </button>
      </div>
    </div>
  );
};