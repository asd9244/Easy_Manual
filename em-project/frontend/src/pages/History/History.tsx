import React, { useState, useEffect } from 'react';
import { api } from '@/src/api/apiService';
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
  onRoomSelect?: (id: number) => void; // 추가
}

export const History: React.FC<HistoryProps> = ({ historyFilter, setHistoryFilter, setScreen, setIsChatReadOnly, onRoomSelect }: HistoryProps) => {
  const [historyItems, setHistoryItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await api.get('/chat/rooms');
        const items = res.data.map((room: any) => ({
          id: room.id,
          title: room.title || '알 수 없는 대화',
          date: new Date(room.createdAt).toLocaleDateString(),
          status: 'completed', // 백엔드에 상태가 없으므로 임시값
          device: '스마트 가전' // 백엔드 ChatRoomResponse에 기기명이 없으므로 임시값
        }));
        setHistoryItems(items);
      } catch (error) {
        console.error("채팅 목록 조회 실패:", error);
      }
    };
    fetchRooms();
  }, []);

  // 필터링 로직
  const filteredItems = historyFilter === 'all' 
    ? historyItems 
    : historyItems.filter(item => item.status === historyFilter);

  const handleShare = (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation(); // 카드 클릭(채팅 이동) 이벤트 방지
    const dummyUrl = `https://fixie.app/share/${id}`;
    navigator.clipboard.writeText(dummyUrl).then(() => {
      alert(`공유 링크가 클립보드에 복사되었습니다!\n${dummyUrl}\n(Mock 로직) 실제 서비스에서는 이 링크로 ShareView.tsx 화면이 열립니다.`);
    });
  };

  const handleGoToReport = (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 방지
    setScreen('report');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 no-scrollbar pb-20 px-4 md:px-8">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-fixie-steel">질문 이력</h1>
        {/* 상단 공통 공유 버튼 (예: 제일 최근 질문 이력 공유) */}
        <button 
          onClick={(e) => handleShare(e, 'latest')}
          className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-400 hover:text-theme-primary transition-all border border-slate-50"
        >
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
            className={`px-4 py-2 rounded-3xl text-xs font-bold transition-all whitespace-nowrap ${
              historyFilter === cat.id 
                ? 'bg-theme-primary text-white shadow-lg shadow-theme-primary/30' 
                : 'bg-white/80 backdrop-blur-md text-slate-400 hover:text-slate-600 border border-white/20'
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
              if (onRoomSelect) onRoomSelect(item.id);
              setIsChatReadOnly(true); 
              setScreen('chat');
            }}
            className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow"
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
              <button 
                onClick={handleGoToReport}
                className="flex-1 h-12 bg-white border border-slate-100 rounded-3xl flex items-center justify-center gap-2 text-sm font-bold text-fixie-steel hover:bg-slate-50 transition-all shadow-sm"
              >
                <FileText size={18} className="text-slate-400" /> PDF 저장
              </button>
              <button 
                onClick={(e) => handleShare(e, item.id || i)}
                className="flex-1 h-12 bg-white border border-slate-100 rounded-3xl flex items-center justify-center gap-2 text-sm font-bold text-fixie-steel hover:bg-slate-50 transition-all shadow-sm"
              >
                <Share2 size={18} className="text-slate-400" /> 링크 공유
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};