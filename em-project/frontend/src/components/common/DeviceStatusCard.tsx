import React, {useState} from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WashingMachine, ChevronDown } from 'lucide-react';
import { GlassCard } from './GlassCard';

export const DeviceStatusCard = ({ 
  title, 
  model, 
  icon: Icon = WashingMachine,
  status = '정상', // '정상', '점검 필요', '교체 필요'
  lastCheck = '2일 전',
  filterStatus = '30일 후',
  repairCount = '2회',
  isWarning = false,
  onChatClick // 채팅 버튼 클릭 핸들러 추가
}: any) => {
  
  // 카드 확장 상태 관리
  const [isExpanded, setIsExpanded] = useState(false);

  // 상태에 따른 뱃지 색상 결정
  const badgeStyle = 
    status === '정상' ? 'bg-theme-primary/10 text-theme-primary' :
    status === '점검 필요' ? 'bg-yellow-100 text-yellow-600' :
    'bg-red-50 text-red-500';

  return (
      <GlassCard className="active:scale-[0.98] group cursor-pointer">

      {/* 1. 카드 헤더 (아이콘, 이름, 상태 뱃지) */}
      <div className="flex justify-between items-start mb-6"
      onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/30 backdrop-blur-md rounded-2xl flex items-center justify-center text-slate-500">
            <Icon size={24} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-lg">{title}</h4>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{model}</p>
          </div>
        </div>

        {/* 상태 및 채팅 버튼 */}
        <div className="flex items-center gap-2">
          {/* 채팅 버튼 추가 */}
          <button 
            onClick={(e) => {
              e.stopPropagation(); // 카드 확장 방지
              onChatClick && onChatClick();
            }}
            className="w-10 h-10 bg-theme-primary/10 text-theme-primary rounded-xl flex items-center justify-center hover:bg-theme-primary hover:text-white transition-all shadow-sm group/btn"
          >
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="transition-transform"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </motion.div>
          </button>

          <div className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${badgeStyle}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${status === '정상' ? 'bg-theme-primary' : status === '점검 필요' ? 'bg-yellow-500' : 'bg-red-500'}`} />
            {status}
          </div>
          {/* 💡 열리면 화살표가 위로 휙! 돌아감 */}
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronDown size={18} className="text-slate-300" />
          </motion.div>
        </div>
      </div>


      {/* 2. 숨겨진 상세 정보  */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: 24 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            className="overflow-hidden"
          >

      {/* 2. 핵심 정보 요약 */}
      <div className="grid grid-cols-3 gap-4 mb-6 text-left">
        <div>
          <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><span className="text-slate-300">🕒</span> 마지막 점검</p>
          <p className="text-sm font-bold text-slate-700 mt-1">{lastCheck}</p>
        </div>
        <div className={isWarning ? 'bg-red-50 -m-2 p-2 rounded-xl' : ''}>
          <p className={`text-[10px] font-bold flex items-center gap-1 ${isWarning ? 'text-red-400' : 'text-slate-400'}`}>
            <span className={isWarning ? 'text-red-300' : 'text-slate-300'}>⚗️</span> 필터 교체
          </p>
          <p className={`text-sm font-bold mt-1 ${isWarning ? 'text-red-500' : 'text-slate-700'}`}>{filterStatus}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><span className="text-slate-300">🔧</span> 수리 이력</p>
          <p className="text-sm font-bold text-slate-700 mt-1">{repairCount}</p>
        </div>
      </div>

      {/* 3. 최근 수리 이력 타임라인 바 */}
      <div className="space-y-2 border-t border-slate-50 pt-4">
        <p className="text-[10px] text-slate-400 font-bold text-left">최근 수리 이력</p>
        <div className="flex gap-1 h-1.5 w-full">
          <div className="bg-theme-primary rounded-l-full flex-1 opacity-50" />
          <div className="bg-theme-secondary flex-1 opacity-50" />
          <div className="bg-theme-primary rounded-r-full flex-1" />
        </div>
        <div className="flex justify-between text-[9px] text-slate-300 font-bold px-1">
          <span>배수 청소</span>
          <span>필터 교체</span>
          <span>점검</span>
        </div>
      </div>
      </motion.div>
      )}
      </AnimatePresence>
    </GlassCard>
  );
};