import React, { useState, useEffect } from 'react';
import { ChevronLeft, Share2, Download, ExternalLink, Mail, Link as LinkIcon, X, Sparkles } from 'lucide-react';
import { Screen, Message } from '@/src/types/index';
import { FixieLogo } from '@/src/components/common/FixieLogo';
import { chatService } from '@/src/services/chatService';
import { authService } from '@/src/services/authService';

interface ShareViewProps {
  setScreen: (screen: Screen) => void;
  roomId: number | null;
}

export const ShareView: React.FC<ShareViewProps> = ({ setScreen, roomId }) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [roomTitle, setRoomTitle] = useState('공유된 가이드');

  useEffect(() => {
    const fetchSharedData = async () => {
      if (!roomId) return;
      setIsLoading(true);
      try {
        // 1. 메시지 목록 조회
        const msgs = await chatService.getMessages(roomId);
        setMessages(msgs);

        // 2. 방 제목 조회를 위해 목록에서 찾기
        const rooms = await chatService.getChatRooms();
        const currentRoom = rooms.find((r: any) => Number(r.id) === roomId);
        if (currentRoom) {
          setRoomTitle(currentRoom.title || `${currentRoom.deviceName || '기기'} 가이드`);
        }
      } catch (error) {
        console.error("공유 데이터 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedData();
  }, [roomId]);

  return (
    <div className="flex flex-col h-[calc(100dvh-5rem)] md:h-dvh max-w-3xl mx-auto bg-fixie-mist md:rounded-3xl md:shadow-xl overflow-hidden relative">      
      {/* 1. 상단 읽기 전용 배너 */}
      <div className="bg-fixie-steel text-white text-[11px] py-1.5 px-4 flex justify-between items-center font-bold tracking-tight">
        <span>⚠️ 읽기 전용 모드로 조회 중입니다</span>
        <span className="opacity-60">ID: #{roomId}</span>
      </div>

      {/* 2. 헤더 */}
      <header className="p-4 bg-white flex items-center justify-between border-b border-slate-50 z-10">        
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
        <div className="flex gap-2">
            <button className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-theme-primary transition-colors cursor-default">
              <Download size={20} />
            </button>
            <button 
              onClick={() => setIsShareModalOpen(true)}
              className="w-10 h-10 bg-theme-primary/10 rounded-xl flex items-center justify-center text-theme-primary hover:bg-theme-primary/20 transition-colors"
            >
              <Share2 size={20} />
            </button>
        </div>
      </header>

      {/* 3. 메시지 리스트 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar pb-60 bg-white/50">
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

                {/* 진단 리포트 표시 (AI가 보낸 파일 느낌) */}
                {msg.type === 'status' && (
                   <div className="mt-3 bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center gap-3 shadow-sm">
                      <div className="w-10 h-10 bg-theme-primary/5 rounded-lg flex items-center justify-center text-theme-primary">
                         <Download size={18} />
                      </div>
                      <div className="text-left">
                         <p className="text-[11px] font-bold text-slate-700">진단 리포트.pdf</p>
                         <p className="text-[9px] text-slate-400">생성 완료</p>
                      </div>
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

      {/* 공유 모달 팝업 */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100 p-6">
            <button 
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 rounded-full"
            >
               <X size={20} />
            </button>

            <div className="text-center mb-6 mt-2">
               <div className="w-14 h-14 bg-theme-primary/10 rounded-full flex items-center justify-center text-theme-primary mx-auto mb-3">
                 <Share2 size={24} />
               </div>
               <h3 className="font-bold text-xl text-slate-800">가이드 공유</h3>
               <p className="text-sm text-slate-500 mt-1">이 가이드를 외부로 공유합니다.</p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
               <button onClick={() => { 
                 const shareUrl = window.location.href;
                 if (!(window as any).Kakao) {
                   alert("index.html에 카카오 SDK가 필요합니다. 환경 세팅 후 작동합니다.");
                   return;
                 }
                 if (!(window as any).Kakao.isInitialized()) {
                   // 임시 키 안내
                   const key = import.meta.env.VITE_KAKAO_APP_KEY || 'YOUR_KAKAO_KEY';
                   if (key === 'YOUR_KAKAO_KEY') {
                     alert('.env 파일에 VITE_KAKAO_APP_KEY를 등록해주세요!');
                     return;
                   }
                   (window as any).Kakao.init(key);
                 }
                 (window as any).Kakao.Share.sendDefault({
                   objectType: 'feed',
                   content: {
                     title: 'Fixie 문제 해결 가이드',
                     description: 'AI가 안내하는 해결 가이드를 확인해보세요.',
                     imageUrl: 'https://via.placeholder.com/800x400.png?text=Fixie+Guide',
                     link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
                   },
                 });
                 setIsShareModalOpen(false);
               }} className="flex flex-col items-center gap-2 group">
                 <div className="w-14 h-14 bg-[#FEE500] rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                   <span className="font-bold text-[#391B1B] text-xl">💬</span>
                 </div>
                 <span className="text-xs font-bold text-slate-600">카카오톡</span>
               </button>
               <button onClick={() => { 
                 const shareUrl = encodeURIComponent(window.location.href);
                 const title = encodeURIComponent('Fixie 문제 해결 가이드');
                 window.open(`https://mail.google.com/mail/?view=cm&fs=1&tf=1&su=${title}&body=${shareUrl}`, '_blank');
                 setIsShareModalOpen(false); 
               }} className="flex flex-col items-center gap-2 group">
                 <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                   <span className="font-bold text-2xl text-blue-500">G</span>
                 </div>
                 <span className="text-xs font-bold text-slate-600">Gmail</span>
               </button>
               <button onClick={() => { 
                 const shareUrl = encodeURIComponent(window.location.href);
                 const title = encodeURIComponent('Fixie 문제 해결 가이드');
                 window.location.href = `mailto:?subject=${title}&body=${title}%0A${shareUrl}`;
                 setIsShareModalOpen(false); 
               }} className="flex flex-col items-center gap-2 group">
                 <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                   <Mail size={24} className="text-slate-600" />
                 </div>
                 <span className="text-xs font-bold text-slate-600">이메일</span>
               </button>
            </div>

            <div className="pt-4 border-t border-slate-100">
               <button onClick={() => {
                 navigator.clipboard.writeText(window.location.href);
                 alert('링크가 복사되었습니다!');
                 setIsShareModalOpen(false);
               }} className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors">
                 <LinkIcon size={16} /> 링크 복사하기
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
