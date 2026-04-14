import React, { useState, useEffect } from 'react';
import { ChevronLeft, ExternalLink, X } from 'lucide-react';
import { Screen, Message } from '@/src/types/index';
import { FixieLogo } from '@/src/components/common/FixieLogo';
import { chatService } from '@/src/services/chatService';

interface ShareViewProps {
  setScreen: (screen: Screen) => void;
  roomId: number | null;
}

export const ShareView: React.FC<ShareViewProps> = ({ setScreen, roomId }) => {
  const [showInstallCta, setShowInstallCta] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [roomTitle, setRoomTitle] = useState('공유된 가이드');

  useEffect(() => {
    const fetchSharedData = async () => {
      if (!roomId) return;
      setIsLoading(true);
      try {
        const [msgs, summary] = await Promise.all([
          chatService.getMessages(roomId),
          chatService.getShareRoomSummary(roomId),
        ]);
        setMessages(msgs);
        setRoomTitle(summary.title || `${summary.deviceName || '기기'} 가이드`);
      } catch (error) {
        console.error("공유 데이터 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedData();
  }, [roomId]);

  return (
    <div className="flex flex-col min-h-dvh h-dvh w-full max-w-3xl mx-auto bg-fixie-mist overflow-hidden relative">      
      {/* 1. 상단 읽기 전용 배너 */}
      <div className="bg-fixie-steel text-white text-[11px] py-1.5 px-4 flex justify-between items-center font-bold tracking-tight">
        <span>⚠️ 읽기 전용 모드로 조회 중입니다</span>
        <span className="opacity-60">ID: #{roomId}</span>
      </div>

      {/* 2. 헤더 */}
      <header className="p-4 bg-white flex items-center border-b border-slate-50 z-10">        
        <div className="flex items-center gap-3 text-left">
          <button 
            onClick={() => {
              const token = localStorage.getItem('accessToken');
              if (token) setScreen('history');
              else setScreen('splash');
            }} 
            className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="text-left">
            <h3 className="font-bold text-slate-800 text-lg leading-tight">{roomTitle}</h3>
            <p className="text-[10px] text-slate-400 font-bold">공유됨</p>
          </div>
        </div>
      </header>

      {/* 3. 메시지 리스트 영역 */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar bg-white/50 ${showInstallCta ? 'pb-60' : 'pb-4'}`}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
             <div className="w-8 h-8 border-4 border-theme-primary border-t-transparent rounded-full animate-spin"></div>
             <p className="text-sm font-bold text-slate-400">내용을 불러오고 있습니다...</p>
          </div>
        ) : messages.length > 0 ? (
          messages.map((msg, idx) => (
            <div key={msg.id || idx} className={`flex ${msg.senderType === 'USER' ? 'justify-end' : 'justify-start gap-3'}`}>
              {msg.senderType === 'AI' && (
                <div className="w-8 h-8 rounded-full bg-wing-gradient flex items-center justify-center shrink-0 shadow-lg shadow-theme-primary/20">
                  <span className="text-white font-bold italic text-[10px]">F</span>
                </div>
              )}
              <div className={`max-w-[85%] p-4 text-sm shadow-sm ${
                msg.senderType === 'USER' 
                  ? 'bg-fixie-steel text-white rounded-3xl rounded-tr-none' 
                  : 'bg-white text-slate-700 rounded-3xl rounded-tl-none border border-theme-primary/10 leading-relaxed'
              }`}>
                <div className="whitespace-pre-wrap">{msg.text}</div>
                
                {/* 매뉴얼 이미지 원격 링크 표시 (있을 경우) */}
                {msg.manualImageUrls && msg.manualImageUrls.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {msg.manualImageUrls.map((url, i) => (
                      <img key={i} src={url} alt="Manual" className="rounded-xl border border-slate-100 hover:scale-[1.02] transition-transform cursor-pointer" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-sm font-bold text-slate-400">대화 내용이 없습니다.</p>
          </div>
        )}
      </div>
      
      {/* 4. 하단 앱 설치 유도 레이어 (CTA) */}
      {showInstallCta && (
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent pt-12 z-20">
         <div className="bg-white border border-slate-100 shadow-2xl rounded-4xl p-6 flex flex-col items-center text-center gap-4 border-t-2 border-t-theme-primary/20 relative">
            <button
              type="button"
              onClick={() => setShowInstallCta(false)}
              className="absolute top-3 right-3 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
              aria-label="앱 설치 안내 닫기"
            >
              <X size={20} />
            </button>
            <div className="w-12 h-12 bg-fixie-mist rounded-2xl flex items-center justify-center mb-1">
               <FixieLogo size={32} />
            </div>
            <div>
               <h4 className="font-bold text-slate-800">픽시(Fixie) 앱에서 더 자세히 보기</h4>
               <p className="text-xs text-slate-400 mt-1">AI와 대화하며 문제를 1분 만에 해결하세요.</p>
            </div>
            <button type="button" className="w-full h-14 bg-fixie-steel text-white font-bold rounded-2xl shadow-lg shadow-theme-primary/30 flex items-center justify-center gap-2 hover:scale-[0.98] transition-transform">
               앱 설치하고 대화 시작하기 <ExternalLink size={18} />
            </button>
         </div>
      </div>
      )}
    </div>
  );
};
