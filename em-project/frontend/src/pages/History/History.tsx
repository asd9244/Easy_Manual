import React from 'react';
import { motion } from 'motion/react';
import { 
  Share2, 
  FileText 
} from 'lucide-react';
import { Screen } from '@/src/types/index';


// 1. 필요한 프롭스 타입 정의
interface HistoryProps {
  historyFilter: 'all' | 'completed' | 'visit';
  setHistoryFilter: (filter: 'all' | 'completed' | 'visit') => void;
  setScreen: (screen: Screen) => void;
  setIsChatReadOnly: (readOnly: boolean) => void;
}

export const History: React.FC<HistoryProps> = ({ historyFilter, setHistoryFilter, setScreen, setIsChatReadOnly }: HistoryProps) => {
  // 나중에 이 데이터는 Spring Boot API에서 받아옴
  const historyItems = [
    { title: "세탁기 필터 청소", date: "2024.03.28", status: "completed", device: "스마트 세탁기" },
    { title: "공기청정기 소음 문제", date: "2024.03.25", status: "visit", device: "공기 청정기" },
    { title: "세탁기 E1 에러", date: "2024.03.20", status: "completed", device: "스마트 세탁기" },
  ];

  // 필터링 로직
  const filteredItems = historyFilter === 'all' 
    ? historyItems 
    : historyItems.filter(item => item.status === historyFilter);

  return (
    <div className="space-y-8 no-scrollbar pb-20">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-fixie-steel">질문 이력</h1>
        {/* 공유 버튼 */}
        <button className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-400 hover:text-theme-primary transition-all border border-slate-50">
          <Share2 size={20} />
        </button>
      </header>

      {/* 필터 카테고리 탭 */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {[
          { id: 'all', label: '전체' },
          { id: 'completed', label: '가이드 완료' },
          { id: 'visit', label: '방문 권장' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setHistoryFilter(cat.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              historyFilter === cat.id 
                ? 'bg-theme-primary text-white shadow-lg shadow-theme-primary/30' 
                : 'bg-white text-slate-400 hover:text-slate-600'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 이력 카드 리스트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => {
            // 실제로는 클릭한 ID에 맞는 메시지를 불러와야 하지만, 일단 이동부터!
            setIsChatReadOnly(true); 
            setScreen('chat');
          }}
            className="bg-white p-6 rounded-4xl shadow-sm border border-slate-50 flex flex-col"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-bold text-slate-300 tracking-tight">{item.date}</span>
              <div className={`px-3 py-1 rounded-lg text-[10px] font-bold ${
                item.status === 'completed' ? 'bg-theme-primary/10 text-theme-primary' : 'bg-theme-secondary/10 text-theme-secondary'
              }`}>
                {item.status === 'completed' ? '가이드 완료' : '방문 권장'}
              </div>
            </div>
            <h4 className="font-bold text-fixie-steel text-xl mb-1">{item.title}</h4>
            <p className="text-sm text-slate-400 mb-8">{item.device}</p>
            
            {/* 하단 액션 버튼 */}
            <div className="flex gap-3 mt-auto">
              <button className="flex-1 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-fixie-steel hover:bg-slate-50 transition-all shadow-sm">
                <FileText size={18} className="text-slate-400" /> PDF 저장
              </button>
              <button className="flex-1 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-fixie-steel hover:bg-slate-50 transition-all shadow-sm">
                <Share2 size={18} className="text-slate-400" /> 링크 공유
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};