import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Play, 
  Paperclip, 
  Mic, 
  Send,
  ArrowLeft,
  FileText,
  ShieldCheck,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { FixieLogo } from '@/src/components/common/FixieLogo';
import { Message, Screen } from '@/src/types/index';
import { api } from '@/src/api/apiService';


// 4. 채팅 페이지 JSX 구조
const SafetyCheck = ({ text }: { text: string }) => {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <div 
      onClick={() => setIsChecked(!isChecked)}
      className={`mt-3 flex items-center gap-3 p-3.5 border rounded-3xl cursor-pointer active:scale-[0.98] transition-all duration-300 ${
        isChecked 
          ? 'bg-theme-primary/10 border-theme-primary' 
          : 'bg-white/80 backdrop-blur-md border-white/20 hover:bg-white/90' 
      }`}
    >
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
        isChecked ? 'bg-theme-primary text-white shadow-sm' : 'bg-theme-primary/10 text-transparent'
      }`}>
        {isChecked && <ShieldCheck size={16} strokeWidth={2.5} />}
      </div>
      <span className={`text-sm font-bold transition-colors duration-300 ${
        isChecked ? 'text-slate-800' : 'text-slate-500'
      }`}>
        {text}
      </span>
    </div>
  );
};

// 1. 채팅 페이지에서 필요한 데이터와 함수 정의
interface ChatProps {
  setScreen: (screen: Screen) => void;
  messages: Message[];
  isAnalyzing: boolean;
  attachedFiles: string[];
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  handleSendMessage: (text: string) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeAttachment: (index: number) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isReadOnly?: boolean;
  setIsAnalyzing: React.Dispatch<React.SetStateAction<boolean>>;
  initialQuery?: string;
  setInitialQuery?: React.Dispatch<React.SetStateAction<string>>;
 }


 
// Chat 컴포넌트 정의
import { chatService } from '@/src/services/chatService';

export const Chat: React.FC<ChatProps> = ({setScreen, messages, setMessages, chatEndRef, removeAttachment, isAnalyzing, setIsAnalyzing, initialQuery, setInitialQuery }) => {
const [inputText, setInputText] = useState('');
const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
const [currentVideoUrl, setCurrentVideoUrl] = useState('');
const hasProcessedInitialQuery = useRef(false);

const handleFeedback = async (messageId: string, isLike: boolean) => {
  try {
    await api.post('/chat/feedback', {
      messageId,
      feedback: isLike ? 'LIKE' : 'DISLIKE'
    });
    alert(isLike ? '좋은 답변 피드백 감사합니다.' : '답변 개선에 참고하겠습니다.');
  } catch (error) {
    console.error("피드백 전송 실패:", error);
  }
};

// [UX] 전송 버튼 활성화 조건
const canSend = inputText.trim().length > 0 || attachedFiles.length > 0;

// 채팅 스크롤 관리
useEffect(() => {
  chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);

useEffect(() => {
  // initialQuery가 있으면 새 방을 만들고 시작
  if (initialQuery && !hasProcessedInitialQuery.current) {
    startNewChat(initialQuery);
    hasProcessedInitialQuery.current = true;
    if (setInitialQuery) setInitialQuery('');
  }
}, [initialQuery]);

const startNewChat = async (query: string) => {
  setIsAnalyzing(true);
  try {
    // 1. 새 채팅방 생성 (제목은 쿼리 내용으로)
    const newRoom = await chatService.createChatRoom(query.substring(0, 20));
    setActiveRoomId(newRoom.id);
    
    // 2. 초기 메시지 전송
    await onSendMessage(query, newRoom.id);
  } catch (error) {
    console.error("새 채팅 시작 실패:", error);
  } finally {
    setIsAnalyzing(false);
  }
};

const onSendMessage = async (customText?: string, targetRoomId?: number) => {
  if (isAnalyzing && !targetRoomId) return; 
  
  const userText = customText || inputText;
  const userAttachments = [...attachedFiles];
  
  if (!userText.trim() && userAttachments.length === 0) return;

  // UI 즉시 반영
  const newUserMsg: Message = { id: Date.now().toString(), senderType: 'USER', text: userText, attachments: userAttachments };
  setMessages(prev => [...prev, newUserMsg]);
  setInputText(''); 
  setAttachedFiles([]);
  
  if (!targetRoomId && !activeRoomId) {
    // 방이 없으면 생성 후 전송
    setIsAnalyzing(true);
    try {
      const newRoom = await chatService.createChatRoom(userText.substring(0, 20));
      setActiveRoomId(newRoom.id);
      await performAsk(newRoom.id, userText);
    } catch (error) {
      handleChatError(error);
    } finally {
      setIsAnalyzing(false);
    }
  } else {
    // 이미 방이 있으면 바로 전송
    setIsAnalyzing(true);
    try {
      await performAsk(targetRoomId || activeRoomId!, userText);
    } catch (error) {
      handleChatError(error);
    } finally {
      setIsAnalyzing(false);
    }
  }
};

const performAsk = async (roomId: number, text: string) => {
  const data = await chatService.askQuestion(roomId, text);
  
  const fixieMsg: Message = { 
    id: String(data.id || Date.now() + 1), 
    senderType: 'AI', 
    text: data.message || '답변을 생성할 수 없습니다.', 
    type: 'guide',
    referencedPage: data.referencedPage
  };
  setMessages(prev => [...prev, fixieMsg]);
};

const handleChatError = (error: any) => {
  console.error("채팅 오류:", error);
  const errorMsg: Message = { 
    id: String(Date.now() + 1), 
    senderType: 'AI', 
    text: `오류가 발생했습니다: ${error.response?.data?.message || error.message}` 
  };
  setMessages(prev => [...prev, errorMsg]);
};

  {/* 이미지 리사이징 함수 */}
  const resizeImage = (file: File, maxWidth: number = 800): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 가로 세로 비율 유지하며 리사이징
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context를 생성할 수 없습니다.'));
        
        ctx.drawImage(img, 0, 0, width, height);

        // JPEG 형식으로 압축 (0.7은 70% 품질 의미)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      };
      
      img.onerror = (err) => reject(err);
    };
    
    reader.onerror = (err) => reject(err);
  });
};

  {/* 파일 변경 핸들러_ 파일을 선택하면 서버로 바로 업로드 후 URL을 받아와 담기 */}
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsAnalyzing(true); 

    try {
      const fileArray = Array.from(files);
      const uploadedUrls: string[] = [];

      // 순차적으로 혹은 Promise.all로 업로드 (여기서는 S3 업로드 API 가정)
      for (const file of fileArray) {
        const formData = new FormData();
        formData.append('file', file);
        
        // 예시 엔드포인트: /upload (미디어 전용 S3 업로드 API)
        const response = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        // 백엔드에서 내려주는 URL을 추출한다고 가정
        if (response.data && response.data.url) {
          uploadedUrls.push(response.data.url);
        } else {
          // 서버 연결 안될 시 로컬 리사이즈로 폴백 (테스트 목적)
          const localUrl = await resizeImage(file, 1000);
          uploadedUrls.push(localUrl);
        }
      }

      setAttachedFiles(prev => [...prev, ...uploadedUrls]);
    } catch (error) {
      console.error("이미지 업로드 중 오류 발생:", error);
      // Fallback for local testing if API fails
      const fallbackUrls = await Promise.all(Array.from(files).map(f => resizeImage(f, 1000)));
      setAttachedFiles(prev => [...prev, ...fallbackUrls]);
    } finally {
      setIsAnalyzing(false);
    }
  };



  {/* 안전 확인 박스 */}
  return (
    <div className="flex flex-col h-[100dvh] md:h-[calc(100dvh-40px)] md:my-5 max-w-7xl mx-auto bg-white md:bg-white/90 md:backdrop-blur-xl md:rounded-3xl md:shadow-2xl overflow-hidden relative border border-white/20">      
      {/* 상단 헤더 */}
      <header className="p-5 md:p-7 bg-white/80 backdrop-blur-md flex items-center justify-between border-b border-white/20 z-10">        
        <div className="flex items-center gap-4">
          <button onClick={() => setScreen('home')} className="w-10 h-10 bg-white/50 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-500 hover:bg-white/80 transition-colors border border-white/20 shadow-sm">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h3 className="font-bold text-slate-800 text-xl tracking-tight leading-tight">Fixie 가이드</h3>
            <span className="text-[11px] text-theme-primary font-bold">온라인 · 도움 준비 완료</span>
          </div>
        </div>
        <button className="w-10 h-10 bg-theme-primary/10 rounded-xl flex items-center justify-center text-theme-primary hover:bg-theme-primary/20 transition-colors">
          <FileText size={20} />
        </button>
      </header>

      {/* 메시지 리스트 영역 */}
    <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6 no-scrollbar pb-36">
        {messages.map(msg => (
          <motion.div 
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.senderType === 'USER' ? 'justify-end' : 'justify-start'}`}
          >

            {/* Fixie 봇 프로필 아이콘 */}
            {msg.senderType === 'AI' && (
              <div className="w-8 h-8 rounded-full bg-wing-gradient flex items-center justify-center shrink-0">
                <span className="text-white font-bold italic text-[10px]">F</span>
              </div>
            )}
          {/* 메시지 컨텐츠 */}
          <div className={`max-w-[85%] p-1.5 relative ${
                msg.senderType === 'USER' 
                  ? 'bg-fixie-steel text-white rounded-3xl rounded-tr-none shadow-md' 
                  : 'bg-white/70 backdrop-blur-md text-slate-700 rounded-3xl rounded-tl-none border border-white/40 shadow-sm' 
          }`}>

            <div className="p-3">
              {/* 첨부 이미지 표시 */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {msg.attachments.map((url, i) => (
                    <img key={i} src={url} alt="Attachment" className="w-24 h-24 object-cover rounded-xl border border-white/20" referrerPolicy="no-referrer" />
                  ))}
                </div>
              )}
              
              
              {/* 가이드 타입 메시지 (비디오, 위치 이미지 포함) */}
              {msg.type === 'guide' && (
                <div className="mt-3 space-y-3">
                  
                  {/* 나중에 들어갈 동영상 자리 (미리 만들어두기) */}
                  {msg.videoUrl && (
                    <div className="relative overflow-hidden rounded-2xl aspect-video bg-slate-800 shadow-sm group">
                      
                      {/* 실제 동영상이 들어갈 태그 */}
                      <video src={msg.videoUrl} className="w-full h-full object-cover opacity-80" />
                      
                      {/* 예쁜 재생 버튼 오버레이 (가운데 반투명 버튼) */}
                      <div 
                        onClick={() => {
                          setCurrentVideoUrl(msg.videoUrl!);
                          setIsVideoModalOpen(true);
                        }}
                        className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors cursor-pointer z-10"
                      >
                        <button className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white shadow-lg hover:scale-105 active:scale-95 transition-all">
                          <Play fill="white" size={20} className="ml-1" />
                        </button>
                      </div>
                      
                      {/* 나중에 "동영상 생성 중" 상태를 보여주고 싶다면 아래 주석을 풀고 활용  */}
                      {/* <div className="absolute inset-0 flex items-center justify-center bg-slate-800 backdrop-blur-sm">
                        <span className="text-white/70 text-xs font-bold animate-pulse">AI가 동영상을 생성하고 있습니다...</span>
                      </div> 
                      */}
                    </div>
                  )}
                  {/* 안전 확인 박스 */}
                  <SafetyCheck text="전원을 뽑았나요?" />
                </div>
              )}
              
            <p className="text-sm p-3 leading-relaxed">{msg.text}</p>
            {/* 피드백 버튼*/}
            {msg.senderType === 'AI' && msg.type === 'guide' && (
              <div className="flex gap-3 mt-3 pt-2 border-t border-slate-200/50">
                <button 
                  onClick={() => handleFeedback(msg.id, true)} 
                  className="flex items-center gap-1 text-slate-300 hover:text-theme-primary transition-colors group"
                >
                  <ThumbsUp size={14} className="group-hover:scale-110 transition-transform" />
                </button>
                <button 
                  onClick={() => handleFeedback(msg.id, false)} 
                  className="flex items-center gap-1 text-slate-300 hover:text-red-400 transition-colors group"
                >
                  <ThumbsDown size={14} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>
            )}
           </div>
          </div>
          </motion.div>
        ))}

        {/* 분석 중 애니메이션 (FastAPI 연동 시 활용) */}
        {isAnalyzing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative flex flex-col items-center justify-center py-20 overflow-hidden rounded-3xl">
            <div className="absolute inset-0 z-0">
              <div className="absolute top-0 -left-4 w-72 h-72 bg-theme-primary rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-blob" />
              <div className="absolute top-0 -right-4 w-72 h-72 bg-theme-secondary rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-blob animation-delay-2000" />
            </div>
            <div className="relative z-10 bg-white/40 backdrop-blur-xl border border-white/20 p-8 rounded-3xl flex flex-col items-center gap-4 shadow-xl">
              <FixieLogo size={60} rainbow={true} />
              <p className="text-sm font-bold text-fixie-steel/70 tracking-tight animate-pulse">FIXIE TIME: 분석 중...</p>
            </div>
          </motion.div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* 하단 입력창 영역 */}
      <div className={`
        absolute left-0 right-0 transition-all duration-300
        /* 📱 모바일: 바닥에 딱 붙고 그림자 없는 플랫 스타일 */
        bottom-0 p-3 bg-white border-t border-slate-50
        /* 💻 데스크탑: 공중에 떠 있고 화려한 스타일 (여백 강화) */
        md:bottom-8 md:left-10 md:right-10 md:p-0 md:bg-transparent md:border-none
      `}>
        
        {/* 첨부파일 미리보기 (입력창 위에 동동 뜸) */}
        <AnimatePresence>
          {attachedFiles.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex flex-wrap gap-3 mb-3 p-3 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-100 shadow-lg w-max"
            >
              {attachedFiles.map((file, i) => (
                <div key={i} className="relative group">
                  <img src={file} alt="Preview" className="w-14 h-14 object-cover rounded-xl shadow-sm" />
                  <button onClick={() => removeAttachment(i)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 메인 입력 알약(Pill) */}
        <div className={`
          flex items-center gap-2 transition-all duration-300
          /* 모바일: 연한 회색 배경, 그림자 없음, 더 슬림하게 */
          bg-white/40 backdrop-blur-xl rounded-full p-1.5 pl-4 shadow-none border border-white/20
          /* 데스크탑: 흰색 배경, 화려한 그림자, 더 빵빵하게 */
          md:bg-white/60 md:backdrop-blur-xl md:p-2 md:pl-4 md:shadow-lg md:border-white/30
        `}>
          
          {/* 마이크 버튼 (모바일에서 조금 작게) */}
          <button className="p-2 text-theme-primary bg-theme-primary/10 rounded-full hover:bg-theme-primary/20 transition-colors">
            <Mic size={18} className="md:w-5 md:h-5" />
          </button>

          <input type="file" id="file-upload" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
          <label htmlFor="file-upload" className="p-2 text-slate-400 rounded-full hover:bg-slate-100 cursor-pointer transition-colors">
            <Paperclip size={18} className="md:w-5 md:h-5" />
          </label>

          <input 
            type="text" 
            value={inputText} // 입력창에 입력한 텍스트가 State에 실시간으로 반영되도록
            onChange={(e) => setInputText(e.target.value)} //쓸 때마다 State에 담기
            placeholder="질문을 입력하세요..." 
            className="flex-1 bg-transparent h-10 px-1 focus:outline-none text-[13px] md:text-sm text-slate-700 font-medium"
            onKeyDown={(e) => {
              // 한글 입력 중인 경우 Enter 키 무시 (조합 중인 경우)
              if (e.nativeEvent.isComposing) return;
              if (e.key === 'Enter' && (inputText || attachedFiles.length > 0)) {
                onSendMessage();
              }
            }}
          />
          
          {/* 전송 버튼 */}
          <button 
            className="w-10 h-10 md:w-12 md:h-12 bg-wing-gradient rounded-full flex items-center justify-center text-white shadow-md hover:scale-105 active:scale-95 transition-all shrink-0"
            onClick={() => {
              if (canSend) { // 보낼 수 있는 상태인지 확인하고
                onSendMessage(); // 이미 State에 담긴 값을 전송!
                // (입력창 비우기는 onSendMessage 함수 안에서 setInputText('')로 처리)
              }
            }}    
          >
            <Send className="w-4 h-4 md:w-4.5 md:h-4.5 -ml-0.5" />
          </button>
        </div>
      </div>

      {/* 비디오 모달 팝업 */}
      <AnimatePresence>
        {isVideoModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <div className="relative w-full max-w-4xl max-h-screen">
              <button 
                onClick={() => setIsVideoModalOpen(false)}
                className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors"
              >
                <X size={32} />
              </button>
              <div className="bg-black rounded-2xl overflow-hidden shadow-2xl aspect-video w-full flex items-center justify-center">
                {currentVideoUrl ? (
                  <video src={currentVideoUrl} controls autoPlay className="w-full h-full object-contain" />
                ) : (
                  <div className="text-white/50 text-sm">해당 영상을 불러올 수 없습니다.</div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};