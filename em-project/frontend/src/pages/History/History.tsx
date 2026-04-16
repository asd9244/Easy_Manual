import React, { useState, useEffect } from 'react';
import { api } from '@/src/api/apiService';
import { motion } from 'motion/react';
import { 
  Share2, 
  FileText,
  X,
  Trash2
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { chatService } from '@/src/services/chatService';
import { Search, Edit2 } from 'lucide-react';
import { SocialShareModal } from '../../components/common/SocialShareModal';
import { Screen } from '@/src/types/index';

// 로컬 스토리지에 기기 별명을 저장하던 로직을 백엔드로 이관하여 삭제하였습니다.

// 1. 필요한 프롭스 타입 정의
interface HistoryProps {
  historyFilter: 'all' | 'completed' | 'visit';
  setHistoryFilter: (filter: 'all' | 'completed' | 'visit') => void;
  setScreen: (screen: Screen) => void;
  setIsChatReadOnly: (readOnly: boolean) => void;
  onRoomSelect?: (id: number, deviceName?: string) => void; // 수정: 기기 이름 전달 추가
}

export const History: React.FC<HistoryProps> = ({ historyFilter, setHistoryFilter, setScreen, setIsChatReadOnly, onRoomSelect }: HistoryProps) => {
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedShareUrl, setSelectedShareUrl] = useState('');
  
  // [신규] 검색 및 제목 수정 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await api.get('/chat/rooms');
        const items = res.data.map((room: any) => {
          const serverName = room.deviceName || '알 수 없는 기기';
          return {
            id: room.id,
            title: room.title || '알 수 없는 대화',
            date: new Date(room.createdAt).toLocaleDateString(),
            status: 'completed',
            device: room.deviceAlias || room.deviceName || '알 수 없는 기기',
            model: room.modelName || '-',
            userDeviceId: room.userDeviceId,
            categoryLabel: room.questionCategoryLabel || '미지정',
          };
        });
        setHistoryItems(items);
      } catch (error) {
        console.error("채팅 목록 조회 실패:", error);
      }
    };
    fetchRooms();
  }, []);

  // 필터링 및 검색 로직 결합
  const filteredItems = historyItems
    .filter(item => historyFilter === 'all' || item.status === historyFilter)
    .filter(item => 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.device.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.model || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleShare = (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation(); 
    setSelectedShareUrl(`${window.location.origin}/?share=${id}`);
    setIsShareModalOpen(true);
  };

  const handleDeleteRoom = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (window.confirm('정말로 이 대화 내역을 삭제하시겠습니까?')) {
      try {
        await chatService.deleteChatRoom(id);
        setHistoryItems(prev => prev.filter(item => item.id !== id));
      } catch (error) {
        console.error("채팅방 삭제 실패:", error);
        alert("삭제에 실패했습니다. 다시 시도해 주세요.");
      }
    }
  };

  const handleDeleteAll = async () => {
    if (historyItems.length === 0) return;
    if (window.confirm('모든 질문 이력이 삭제됩니다. 정말로 계속하시겠습니까?')) {
      try {
        await chatService.deleteAllChatRooms();
        setHistoryItems([]);
        alert("모든 이력이 삭제되었습니다.");
      } catch (error) {
        console.error("전체 삭제 실패:", error);
        alert("삭제 중 오류가 발생했습니다.");
      }
    }
  };

  // [신규] 제목 수정 핸들러
  const openRenameModal = (e: React.MouseEvent, id: number, currentTitle: string) => {
    e.stopPropagation();
    setEditingRoomId(id);
    setNewTitle(currentTitle);
    setIsRenameModalOpen(true);
  };

  const handleRename = async () => {
    if (!editingRoomId || !newTitle.trim()) return;
    try {
      await chatService.updateChatRoomTitle(editingRoomId, newTitle);
      setHistoryItems(prev => prev.map(item => 
        item.id === editingRoomId ? { ...item, title: newTitle } : item
      ));
      setIsRenameModalOpen(false);
    } catch (error) {
      console.error("제목 수정 실패:", error);
      alert("제목 수정 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 no-scrollbar pb-20 px-4 md:px-8">
      <header className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-fixie-steel">질문 이력</h1>
          <p className="text-[10px] text-slate-400 font-medium">지난 대화 내역을 확인하고 공유할 수 있습니다.</p>
        </div>
        
        <div className="flex gap-2">
          {/* 전체 삭제 버튼 추가 */}
          {historyItems.length > 0 && (
            <button 
              onClick={handleDeleteAll}
              className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-300 hover:text-red-400 transition-all border border-slate-50 group"
              title="전체 삭제"
            >
              <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>
      </header>

      {/* [신규] 검색 바 */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text"
          placeholder="대화 제목 또는 기기 이름으로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-14 bg-white/80 backdrop-blur-md rounded-2xl pl-12 pr-4 border border-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-theme-primary/20 transition-all text-sm font-medium"
        />
      </div>

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

      {/* 이력 카드 리스트 — 한 줄에 카드 하나, 가로 전체 너비 */}
      <div className="flex flex-col gap-4 w-full">
        {filteredItems.length > 0 ? (
          filteredItems.map((item, i) => (
            <motion.div 
              key={item.id ?? i} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.4) }}
              onClick={() => {
                if (onRoomSelect) onRoomSelect(item.id, item.device);
                setIsChatReadOnly(true); 
                setScreen('history-detail');
              }}
              className="w-full bg-white/80 backdrop-blur-md p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow cursor-pointer group min-w-0"
            >
              <div className="flex justify-between items-start gap-3 mb-3">
                <span className="font-bold text-slate-400 tracking-tight shrink-0 text-xs">
                  {item.date}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                    item.status === 'completed' ? 'bg-theme-primary/10 text-theme-primary' : 'bg-theme-secondary/10 text-theme-secondary'
                  }`}>
                    {item.status === 'completed' ? '가이드 완료' : '방문 권장'}
                  </div>
                  <button 
                    onClick={(e) => handleDeleteRoom(e, item.id)}
                    className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all"
                    title="삭제"
                  >
                    <Trash2 size={15} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
              
              <div className="flex items-start gap-2 mb-3 group/title min-w-0">
                <h4 className="min-w-0 flex-1 font-bold text-fixie-steel text-lg sm:text-xl group-hover:text-theme-primary transition-colors break-words [overflow-wrap:anywhere] leading-snug">
                  {item.title}
                </h4>
                <button 
                  type="button"
                  onClick={(e) => openRenameModal(e, item.id, item.title)}
                  className="shrink-0 p-1.5 text-slate-300 hover:text-theme-primary opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-slate-50"
                  aria-label="제목 수정"
                >
                  <Edit2 size={15} />
                </button>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 mt-auto pt-2 mb-4">
                <span className="px-3 py-1.5 bg-wing-gradient/10 text-theme-primary border border-theme-primary/20 rounded-full text-xs font-bold truncate max-w-[150px]">
                  {item.categoryLabel}
                </span>
                <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-bold truncate max-w-[150px]">
                  {item.device}
                </span>
                {item.model && item.model !== '-' && (
                  <span className="px-3 py-1.5 bg-slate-50 text-slate-500 border border-slate-100 rounded-full text-xs font-semibold truncate max-w-[150px]">
                    {item.model}
                  </span>
                )}
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); alert('AI 요약 기능을 준비 중입니다.'); }}
                  className="flex-1 h-11 bg-white border border-slate-100 rounded-2xl flex items-center justify-center gap-2 text-[12px] font-bold text-fixie-steel hover:bg-slate-50 transition-all shadow-sm"
                >
                  <FileText size={16} className="text-slate-400" /> 대화 요약
                </button>
                <button 
                  onClick={(e) => handleShare(e, item.id || i)}
                  className="flex-1 h-11 bg-wing-gradient/5 border border-theme-primary/10 rounded-2xl flex items-center justify-center gap-2 text-[12px] font-bold text-theme-primary hover:bg-theme-primary/10 transition-all shadow-sm"
                >
                  <Share2 size={16} /> 링크 공유
                </button>
              </div>
            </motion.div>
          ))

        ) : (
          <div className="w-full py-12 text-center space-y-3">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={24} className="text-slate-300" />
            </div>
            <p className="text-slate-400 font-medium">표시할 질문 이력이 없습니다.</p>
          </div>
        )}
      </div>

      {/* 제목 수정 모달 */}
      <AnimatePresence>
        {isRenameModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl"
            >
              <h3 className="text-lg font-bold text-slate-800 mb-4">대화 제목 수정</h3>
              <input 
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full h-12 bg-slate-50 rounded-xl px-4 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-theme-primary/20 mb-6 font-bold"
                autoFocus
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsRenameModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  취소
                </button>
                <button 
                  onClick={handleRename}
                  className="flex-1 py-3 bg-theme-primary text-white font-bold rounded-xl hover:bg-theme-primary/90 transition-colors shadow-lg shadow-theme-primary/20"
                >
                  저장하기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 프리미엄 SNS 공유 모달 */}
      <SocialShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        shareUrl={selectedShareUrl}
      />
    </div>
  );
};