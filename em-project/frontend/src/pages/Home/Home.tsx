import React from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  Send, 
  ChevronRight, 
  Plus, 
  WashingMachine, 
  Play, 
  Wind,
  Tv
} from 'lucide-react';

//쪼개놓은 파일들에서 불러오기
import { GlassCard } from '@/src/components/common/GlassCard';
import { TOP_GUIDES } from '@/src/constants/data';
import { Device, Screen } from '@/src/types/index';
import { DeviceStatusCard} from '@/src/components/common/DeviceStatusCard';

// 1. App.tsx에서 넘겨줄 데이터들의 타입을 정의
interface HomeProps {
  setScreen: (screen: Screen) => void;
  devices: Device[];
  sliderRef: React.RefObject<HTMLDivElement | null>;
  sliderConstraints: { left: number; right: number };
  isLoading?: boolean;
  onGuideClick?: (title: string) => void;
}

// 2. renderHome 대신 'Home'이라는 이름의 컴포넌트로 만들기.
export const Home: React.FC<HomeProps> = ({ setScreen, devices, isLoading, onGuideClick }) => {
  return (
    <div className="max-w-7xl mx-auto space-y-10 text-left px-4 md:px-8">
      
      {/* 1. 상단 헤더 & 프로필 */}
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-sm font-bold text-slate-500 mb-1 flex items-center gap-1">
            안녕하세요 👋
          </h2>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">내 대시보드</h1>
        </div>
        {/* 우측 상단 프로필 이미지 영역 */}
        <div className="w-12 h-12 rounded-full bg-wing-gradient flex items-center justify-center text-white shadow-lg shadow-theme-primary/20 cursor-pointer hover:scale-105 transition-transform">
          <span className="font-bold">U</span>
        </div>
      </header>

      {/* 2. 기기 상태 대시보드 섹션 */}
      <section>
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="text-sm font-bold text-slate-700">기기 상태 대시보드</h3>
          <button 
            onClick={() => setScreen('garage')}
            className="text-theme-primary text-sm font-bold hover:opacity-80 transition-opacity"
          >
            전체 보기
          </button>
        </div>

        {/* 새롭게 바뀐 카드들 */}
        <div className="space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-8 bg-white/20 backdrop-blur-lg rounded-3xl border border-dashed border-white/30">
                <div className="w-8 h-8 border-4 border-theme-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-sm font-bold text-slate-400">기기 목록을 불러오는 중...</p>
              </div>
            ) : devices.length > 0 ? (
              /* 💡 진짜 devices 창고에서 데이터를 꺼내서 카드를 찍어낸다! */
              devices.map(device => (
                <DeviceStatusCard 
                  key={device.id}
                  title={device.name} 
                  model={device.model} 
                  icon={device.icon || WashingMachine} // fallback icon
                  status="정상" 
                  lastCheck="오늘" 
                  filterStatus="양호" 
                  repairCount="0회" 
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center p-8 bg-white/20 backdrop-blur-lg rounded-3xl border border-dashed border-white/30">
                <p className="text-sm font-bold text-slate-400">등록된 기기가 없습니다.</p>
              </div>
            )}
            
            <button 
              onClick={() => setScreen('garage')} 
              className="w-full py-4 mt-2 border-2 border-dashed border-white/30 rounded-3xl flex items-center justify-center gap-2 text-slate-400 font-bold hover:bg-white/20 hover:border-theme-primary hover:text-theme-primary transition-all duration-300 backdrop-blur-sm"
            >
              <Plus size={20} />
              새 기기 추가
            </button>
        </div>


      </section>

      {/* 3. 검색 바 (질문하기) */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <div className="w-6 h-6 rounded-md bg-theme-primary/20 flex items-center justify-center text-theme-primary">
            <span className="font-bold text-xs italic">F</span>
          </div>
        </div>
        <input 
          type="text" 
          placeholder="Fixie에게 무엇이든 물어보세요..." 
          className="w-full h-16 bg-white/40 backdrop-blur-xl rounded-3xl pl-14 pr-32 shadow-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-theme-primary/50 text-sm font-medium transition-shadow group-hover:shadow-md"
        />
        <button onClick={() => setScreen('chat')} className="absolute right-3 top-1/2 -translate-y-1/2 bg-fixie-steel text-white w-10 h-10 md:w-auto md:h-auto md:px-6 md:py-2.5 rounded-full md:rounded-xl flex items-center justify-center font-bold text-sm hover:bg-slate-700 transition-colors shadow-md">
          <Send size={18} className="md:hidden -ml-0.5" />
          <span className="hidden md:block">질문하기</span>
        </button>
      </div>

      {/* 4. 자주 찾는 가이드 TOP 5 */}
      <section className="pb-8">
        <h3 className="font-bold text-lg mb-4 px-1 text-slate-700">자주 찾는 가이드 TOP 5</h3>
        <div className="space-y-3">
          {[
            { title: "세탁기 진수가 안 돼", sub: "LG 세탁기 · 2.3천회 조회", color: "bg-theme-primary/60" },
            { title: "TV 화면 깜빡임 현상", sub: "삼성 TV · 1.8천회 조회", color: "bg-theme-primary/50" },
            { title: "에어컨 필터 청소 가이드", sub: "다이슨 HP07 · 1.5천회 조회", color: "bg-theme-primary/40" },
            { title: "세탁기 진동 심함", sub: "LG 세탁기 · 1.2천회 조회", color: "bg-theme-primary/30" },
            { title: "TV 스피커 소리 안 나옴", sub: "삼성 TV · 980회 조회", color: "bg-theme-primary/20" }
          ].map((guide, i) => (
            <motion.div 
              key={i}
              whileTap={{ scale: 0.99 }}
              onClick={() => onGuideClick && onGuideClick(guide.title)}
              className="bg-white/40 backdrop-blur-xl p-4 rounded-3xl flex justify-between items-center shadow-sm border border-white/20 hover:border-theme-primary/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner ${guide.color}`}>
                  {i + 1}
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 text-sm">{guide.title}</h4>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">{guide.sub}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};