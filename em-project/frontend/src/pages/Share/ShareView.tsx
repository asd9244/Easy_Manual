import React from 'react';
import { ChevronLeft, Share2, Download, ExternalLink } from 'lucide-react';
import { Screen } from '@/src/types/index';
import { FixieLogo } from '@/src/components/common/FixieLogo';

interface ShareViewProps {
  setScreen: (screen: Screen) => void;
}

export const ShareView: React.FC<ShareViewProps> = ({ setScreen }) => {
  return (
    <div className="flex flex-col h-[calc(100dvh-5rem)] md:h-dvh bg-fixie-mist md:rounded-3xl md:shadow-xl overflow-hidden relative">      
      {/* 1. 상단 읽기 전용 배너 */}
      <div className="bg-fixie-steel text-white text-[11px] py-1.5 px-4 flex justify-between items-center font-bold tracking-tight">
        <span>⚠️ 읽기 전용 모드로 조회 중입니다</span>
        <span className="opacity-60">ID: #DX-9241</span>
      </div>

      {/* 2. 헤더 */}
      <header className="p-4 bg-white flex items-center justify-between border-b border-slate-50 z-10">        
        <div className="flex items-center gap-3 text-left">
          <button onClick={() => setScreen('history')} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div className="text-left">
            <h3 className="font-bold text-slate-800 text-lg leading-tight">세탁기 소음 문제 가이드</h3>
            <p className="text-[10px] text-slate-400 font-bold">공유됨 • 2024.03.28</p>
          </div>
        </div>
        <div className="flex gap-2">
            <button className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-theme-primary transition-colors cursor-default">
              <Download size={20} />
            </button>
            <button className="w-10 h-10 bg-theme-primary/10 rounded-xl flex items-center justify-center text-theme-primary cursor-default">
              <Share2 size={20} />
            </button>
        </div>
      </header>

      {/* 3. 메시지 리스트 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar pb-60">
        <div className="flex justify-center my-4">
           <span className="text-[10px] bg-slate-100 text-slate-400 px-3 py-1 rounded-full font-bold">2024년 3월 28일 목요일</span>
        </div>

        <div className="flex justify-end">
          <div className="max-w-[85%] p-4 bg-fixie-steel text-white rounded-3xl rounded-tr-none text-sm shadow-md font-medium text-left">
            세탁기에서 심한 소음과 진동이 발생해요. 탈수 버튼만 누르면 덜덜거리는 소리가 납니다.
          </div>
        </div>

        <div className="flex justify-start gap-3">
          <div className="w-8 h-8 rounded-full bg-wing-gradient flex items-center justify-center shrink-0 shadow-lg shadow-theme-primary/20">
            <span className="text-white font-bold italic text-[10px]">F</span>
          </div>
          <div className="max-w-[85%] p-4 bg-white text-slate-700 rounded-3xl rounded-tl-none border border-theme-primary/10 shadow-sm text-sm leading-relaxed text-left">
            현재 증상은 **E1 에러 코드(수평 불균형)**와 밀접한 관련이 있습니다. 세탁기의 네 다리 수평이 맞지 않거나, 세탁물이 한쪽으로 쏠렸을 때 발생하는 전형적인 현상입니다.
            <br/><br/>
            조치 방법으로는 기기를 멈춘 후 내부 세트물을 고르게 펴주시고, 세탁기 상단을 눌러 흔들림이 있는지 확인해 주세요.
          </div>
        </div>

        <div className="flex justify-start gap-3 pl-11">
           <div className="bg-white border border-slate-100 rounded-2xl p-3 flex items-center gap-3 shadow-sm max-w-[200px]">
              <div className="w-10 h-10 bg-theme-primary/5 rounded-lg flex items-center justify-center text-theme-primary">
                 <Download size={18} />
              </div>
              <div className="text-left">
                 <p className="text-[11px] font-bold text-slate-700">진단 리포트.pdf</p>
                 <p className="text-[9px] text-slate-400">1.2 MB • 생성 완료</p>
              </div>
           </div>
        </div>
      </div>
      
      {/* 4. 하단 앱 설치 유도 레이어 (CTA) */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent pt-12 z-20">
         <div className="bg-white border border-slate-100 shadow-2xl rounded-4xl p-6 flex flex-col items-center text-center gap-4 border-t-2 border-t-theme-primary/20">
            <div className="w-12 h-12 bg-fixie-mist rounded-2xl flex items-center justify-center mb-1">
               <FixieLogo size={32} />
            </div>
            <div>
               <h4 className="font-bold text-slate-800">픽시(Fixie) 앱에서 더 자세히 보기</h4>
               <p className="text-xs text-slate-400 mt-1">AI와 대화하며 문제를 1분 만에 해결하세요.</p>
            </div>
            <button className="w-full h-14 bg-fixie-steel text-white font-bold rounded-2xl shadow-lg shadow-theme-primary/30 flex items-center justify-center gap-2 hover:scale-[0.98] transition-transform">
               앱 설치하고 대화 시작하기 <ExternalLink size={18} />
            </button>
         </div>
      </div>
    </div>
  );
};
