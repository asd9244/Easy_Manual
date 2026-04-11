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
  ThumbsDown,
  Image as ImageIcon,
  WashingMachine,
  AtSign
} from 'lucide-react';
import { FixieLogo } from '@/src/components/common/FixieLogo';
import { Message, Screen } from '@/src/types/index';
import { api } from '@/src/api/apiService';
import { DiagnosticReport } from '../Report/DiagnosticReport';


// 4. 채팅 페이지 JSX 구조
const SafetyCheck = ({ text }: { text: string }) => {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <div
      onClick={() => setIsChecked(!isChecked)}
      className={`mt-3 flex items-center gap-3 p-3.5 border rounded-3xl cursor-pointer active:scale-[0.98] transition-all duration-300 ${isChecked
          ? 'bg-theme-primary/10 border-theme-primary'
          : 'bg-white/80 backdrop-blur-md border-white/20 hover:bg-white/90'
        }`}
    >
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${isChecked ? 'bg-theme-primary text-white shadow-sm' : 'bg-theme-primary/10 text-transparent'
        }`}>
        {isChecked && <ShieldCheck size={16} strokeWidth={2.5} />}
      </div>
      <span className={`text-sm font-bold transition-colors duration-300 ${isChecked ? 'text-slate-800' : 'text-slate-500'
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
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  handleSendMessage: (text: string) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeAttachment: (index: number) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isReadOnly?: boolean;
  setIsAnalyzing: React.Dispatch<React.SetStateAction<boolean>>;
  attachedFiles: string[];
  setAttachedFiles: React.Dispatch<React.SetStateAction<string[]>>;
  initialQuery?: string;
  setInitialQuery?: React.Dispatch<React.SetStateAction<string>>;
  devices: any[];
  isLoadingDevices: boolean;
  roomId?: number | null;
  deviceId?: number | null;
}



// Chat 컴포넌트 정의
import { chatService } from '@/src/services/chatService';

export const Chat: React.FC<ChatProps> = ({ setScreen, messages, setMessages, chatEndRef, removeAttachment, isAnalyzing, setIsAnalyzing, attachedFiles, setAttachedFiles, initialQuery, setInitialQuery, devices, isLoadingDevices, roomId, deviceId }) => {
  const [inputText, setInputText] = useState('');
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [activeDeviceId, setActiveDeviceId] = useState<number | null>(deviceId || null); // 현재 대화 중인 기기 ID
  const [selectedMentionDevice, setSelectedMentionDevice] = useState<string | null>(null); // @ 어노테이션으로 선택된 기기

  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false); // 미등록 기기 모드
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const hasProcessedInitialQuery = useRef(false);
  const [isListening, setIsListening] = useState(false);
  const [tempTranscript, setTempTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  // 라이트박스(이미지 크게 보기) 상태
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // 멘션(@) 관련 상태
  const [showMentionPopover, setShowMentionPopover] = useState(false);
  const [mentionPosition, setMentionPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [mentionQuery, setMentionQuery] = useState(''); // 추가: 멘션 필터링을 위한 검색어
  const inputRef = useRef<HTMLInputElement>(null);

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

  // [UX] 전송 버튼 활성화 조건: (텍스트/파일 있음) AND (기기 멘션됨 OR 이미 활성화된 방이 있음)
  const canSend = (inputText.trim().length > 0 || attachedFiles.length > 0) && (!!selectedMentionDevice || !!activeRoomId);

  // 채팅 스크롤 관리 (안정성을 위해 requestAnimationFrame 사용)
  useEffect(() => {
    const scroll = () => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    requestAnimationFrame(scroll);
  }, [messages]);

  useEffect(() => {
    // initialQuery가 있으면 새 방을 만들고 시작
    if (initialQuery && !hasProcessedInitialQuery.current) {
      startNewChat(initialQuery);
      hasProcessedInitialQuery.current = true;
      if (setInitialQuery) setInitialQuery('');
    }
  }, [initialQuery]);

  // [추가] roomId가 있으면 대화 내역 불러오기
  useEffect(() => {
    if (roomId) {
      setActiveRoomId(roomId);
      loadRoomMessages(roomId);
      
      // 기존 방 진입 시: 해당 방의 기기 정보를 찾아서 Context 이름 세팅
      // (지금은 roomId와 deviceId 관계를 알 수 없으나, History에서 선택된 기기 정보를 전달하면 더 좋습니다. 
      //  임시로 activeDeviceId를 초기화하되, 추후 개선을 위해 null로 둡니다.)
      setActiveDeviceId(null); 
      setSelectedMentionDevice(null);
    } else if (deviceId) {
      // 홈에서 기기 카드를 눌러서 진입한 경우
      setActiveRoomId(null);
      setMessages([{ id: 'welcome', senderType: 'AI', text: '안녕하세요! 선택하신 기기에 대해 무엇을 도와드릴까요?', type: 'status' }]);
      setIsAnalyzing(false); // [추가] 인사말 등장 시 분석 애니메이션 즉시 해제
      setActiveDeviceId(deviceId);
      // 기기가 이미 선택되어 있으므로 @ 어노테이션 자동 세팅 → 전송 버튼 즉시 활성화
      const preSelectedDevice = devices?.find(d => Number(d.id) === deviceId);
      if (preSelectedDevice) {
        setSelectedMentionDevice(preSelectedDevice.name);
      }
    }
  }, [roomId, deviceId, devices]);

  const loadRoomMessages = async (id: number) => {
    setIsAnalyzing(true);
    try {
      const history = await chatService.getMessages(id);
      setMessages(history);
    } catch (error) {
      console.error("대화 내역 로드 실패:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startNewChat = async (query: string) => {
    setIsAnalyzing(true);

    try {
      // 0. 기기 체크 (미등록 기기 대응 UX 개선)
      if (!devices || devices.length === 0) {
        const welcomeMsg: Message = {
          id: 'guest-notice-' + Date.now(),
          senderType: 'AI',
          text: '등록된 기기 정보가 없지만, 보내주신 이미지를 기반으로 분석을 시작할 수 있습니다. 어떤 도움이 필요하신가요?'
        };
        setMessages(prev => [...prev, welcomeMsg]);

        // 기기가 없더라도 대화방 생성을 시도 (백엔드에서 0이나 Guest ID를 허용한다고 가정)
        try {
          setIsGuestMode(true);
          const guestRoom = await chatService.createChatRoom(0); // 0을 게스트 ID로 규약
          const guestRoomId = guestRoom.roomId;
          setActiveRoomId(guestRoomId);
          if (query !== 'ocr_image') {
            await onSendMessage(query, guestRoomId);
          }
        } catch (err) {
          console.warn("게스트 대화방 생성 실패, 가상 세션으로 전환:", err);
          // 서버 실패(500 에러 등) 시에도 가상 룸 ID(-1) 부여하여 대화 지속
          setActiveRoomId(-1);
          if (query !== 'ocr_image') {
            await onSendMessage(query, -1);
          }
        }
        return;
      }

      // 1. 새 채팅방 생성 (정상 기기 등록자)
      // activeDeviceId가 있으면 해당 기기로, 없으면 목록 첫 번째로 방 생성
      const deviceId = activeDeviceId ? String(activeDeviceId) : devices[0].id;
      const newRoom = await chatService.createChatRoom(deviceId);
      const newRoomId = newRoom.roomId;
      setActiveRoomId(newRoomId);

      // 2. 초기 메시지 전송
      if (query === 'ocr_image') {
        const ocrMsg: Message = {
          id: 'ocr-notice-' + Date.now(),
          senderType: 'AI',
          text: '스캔하신 이미지를 분석 중입니다. 잠시만 기다려주세요...'
        };
        setMessages(prev => [...prev, ocrMsg]);
      } else {
        await onSendMessage(query, newRoomId);
      }
    } catch (error) {
      console.error("새 채팅 시작 실패:", error);
      handleChatError(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onSendMessage = async (customText?: string, targetRoomId?: number) => {
    if (isAnalyzing && !targetRoomId) return;

    const userText = customText || inputText;
    const userAttachments = [...attachedFiles];

    if (!userText.trim() && userAttachments.length === 0) return;

    // 0. 로딩 중 방어
    if (isLoadingDevices) {
      // 기기 정보가 로드될 때까지는 전송을 잠시 막거나 대기
      return;
    }

    // UI 즉시 반영
    const newUserMsg: Message = { id: Date.now().toString(), senderType: 'USER', text: userText, attachments: userAttachments };
    setMessages(prev => [...prev, newUserMsg]);
    setInputText('');
    setAttachedFiles([]);

    if (!targetRoomId && !activeRoomId) {
      // 방이 없으면 생성 후 전송 (기기 유무 상관없이 게스트 모드 허용)
      setIsAnalyzing(true);
      try {
        if (!devices || devices.length === 0) {
          // 기기가 없으면 게스트 모드로 즉시 전환 및 가상 룸 생성
          setIsGuestMode(true);
          setActiveRoomId(-1);
          await performAsk(-1, userText, userAttachments[0]);
        } else {
          // 기기가 있으면 정상적으로 방 생성
          const idToCreate = activeDeviceId || (devices && devices[0].id);
          if (idToCreate) {
            const newRoom = await chatService.createChatRoom(idToCreate);
            if (newRoom && newRoom.roomId) {
              targetRoomId = newRoom.roomId;
              setActiveRoomId(newRoom.roomId);
              
              // 새 방에 대한 메시지 전송
              await performAsk(newRoom.roomId, userText, userAttachments[0]);
            } else {
              throw new Error("채팅방 정보를 생성할 수 없습니다.");
            }
          } else {
            throw new Error("기기 정보를 찾을 수 없습니다.");
          }
        }
      } catch (error) {
        console.warn("방 생성 실패, 가상 세션으로 전환:", error);
        setIsGuestMode(true);
        setActiveRoomId(-1);
        await performAsk(-1, userText, userAttachments[0]);
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      // 이미 방이 있으면 바로 전송
      setIsAnalyzing(true);
      try {
        await performAsk(targetRoomId || activeRoomId!, userText, userAttachments[0]);
      } catch (error) {
        handleChatError(error);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const performAsk = async (roomId: number, text: string, mediaUrl?: string) => {
    let data;

    if (roomId === -1) {
      // 가상 룸(서버 에러 시)일 경우
      await new Promise(resolve => setTimeout(resolve, 800));
      data = {
        id: Date.now(),
        message: `현재 기기 정보 확인이 어렵습니다. 잠시 후 다시 시도해 주시거나 [가라지]에서 기기 상태를 확인해 주세요.`
      };
    } else {
      data = await chatService.askQuestion(roomId, text, mediaUrl);
    }

    // [개선] 백엔드 응답(data)으로부터 필드 추출 시 카멜케이스와 스네이크케이스 모두 대응
    const referencedPage = (data as any).referencedPage || (data as any).referenced_page;
    const manualImageUrls = (data as any).manualImageUrls || (data as any).manual_image_urls || [];
    const aiMessage = (data as any).message || (data as any).ai_answer || data.text || '답변을 생성할 수 없습니다.';

    const fixieMsg: Message = {
      id: String(data.id || Date.now() + 1),
      senderType: 'AI',
      text: aiMessage,
      type: 'guide',
      referencedPage: referencedPage,
      manualImageUrls: manualImageUrls,
      mediaUrl: (data as any).mediaUrl || (data as any).media_url
    };
    
    setMessages(prev => [...prev, fixieMsg]);
  };

  const handleChatError = (error: any) => {
    console.error("채팅 오류:", error);
    let errorDetail = error.response?.data?.message || error.message;

    // 특정 에러 상황에 대한 친절한 안내 (500 에러 등)
    if (error.response?.status === 500) {
      errorDetail = "서버 엔진에서 기기 정보를 처리하지 못했습니다. 기기 상태를 다시 확인해주세요.";
    }

    const errorMsg: Message = {
      id: String(Date.now() + 1),
      senderType: 'AI',
      text: `⚠️ 오류가 발생했습니다: ${errorDetail}`
    };
    setMessages(prev => [...prev, errorMsg]);
  };

  {/* 이미지 리사이징 함수 */ }
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

  {/* 파일 변경 핸들러_ 파일을 선택하면 서버로 바로 업로드 후 URL을 받아와 담기 */ }
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 전체 화면 분석 로딩 대신 백그라운드에서 처리하도록 개선 (UX 향상)
    // setIsAnalyzing(true); 

    try {
      const fileArray = Array.from(files);
      const uploadedUrls: string[] = [];

      // 순차적으로 혹은 Promise.all로 업로드 (여기서는 S3 업로드 API 가정)
      for (const file of fileArray) {
        const formData = new FormData();
        formData.append('file', file);

        // 백엔드 이미지 업로드 API (FileController: POST /api/files/upload)
        const response = await api.post('/files/upload', formData, {
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
      // setIsAnalyzing(false);
    }
  };



  // --- STT (음성 인식) 로직 구현 ---
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ko-KR';

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setInputText(prev => prev + event.results[i][0].transcript);
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setTempTranscript(interimTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error("음성 인식 오류:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setTempTranscript('');
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTempTranscript('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleVoiceClose = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setIsVoiceModalOpen(false);
  };

  // 멘션 팝업 연동을 위한 인풋 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputText(value);

    // 정규표현식으로 '@' 이후의 텍스트 추출 (예: "안녕하세요 @에어" -> "에어")
    const mentionMatch = value.match(/@([^@\s]*)$/);
    
    if (mentionMatch) {
      const query = mentionMatch[1]; // @ 뒤의 검색어
      setMentionQuery(query);
      
      const rect = inputRef.current?.getBoundingClientRect();
      if (rect) {
        // 팝업 위치를 입력창 위로 동적으로 계산 (반응형 대응)
        setMentionPosition({ top: rect.top - 10, left: rect.left }); 
        setShowMentionPopover(true);
      }
    } else {
      setShowMentionPopover(false);
      setMentionQuery('');
    }
  };

    const handleSelectMention = (deviceName: string) => {
    if (deviceName === '매뉴얼 즉시 보기') {
      // 현재 기기 정보가 있는 경우 바로 라이트박스 오픈
      if (activeDeviceId && devices) {
        const currentDevice = devices.find(d => Number(d.id) === activeDeviceId);
        // 실제로는 기기 정보에 매뉴얼 URL이 있어야 함 (임시로 첫 AI 메시지에서 가져오거나 안내)
        const lastAiMsg = [...messages].reverse().find(m => m.senderType === 'AI' && m.manualImageUrls && m.manualImageUrls.length > 0);
        if (lastAiMsg?.manualImageUrls) {
          setLightboxImages(lastAiMsg.manualImageUrls);
          setLightboxIndex(0);
        } else {
          alert("현재 대화 중인 기기의 매뉴얼 정보를 찾을 수 없습니다. 분석 내용을 먼저 확인해 주세요.");
        }
      }
      setShowMentionPopover(false);
      setMentionQuery('');
      return;
    }

    if (deviceName === '진단 리포트 열기') {
      setIsReportModalOpen(true);
      setShowMentionPopover(false);
      setMentionQuery('');
      return;
    }

    // 현재 입력된 텍스트에서 마지막 @ 부분을 가전 이름으로 교체
    const newValue = inputText.replace(/@([^@\s]*)$/, `@${deviceName} `);
    setInputText(newValue);
    setSelectedMentionDevice(deviceName); // 선택된 기기 저장 → 전송 버튼 활성화
    
    // 멘션된 기기로 activeDeviceId 업데이트 → 이 기기로 채팅방 생성됨
    const mentionedDevice = devices?.find(d => d.name === deviceName);
    if (mentionedDevice) {
      setActiveDeviceId(Number(mentionedDevice.id));
      
      // 기기를 명시적으로 바꿨으므로 기존 방 ID 초기화 (새 대화 세션 시작)
      setActiveRoomId(null);

      // 사용자 경험을 위해 기존 대화 내용을 비우고 새로운 안내 메시지만 표시 (별도 페이지 효과)
      const systemMsg: Message = {
        id: 'system-' + Date.now(),
        senderType: 'AI',
        text: `✨ 새로운 [${deviceName}] 가이드 대화를 시작합니다.`,
        type: 'status' 
      };
      setMessages([systemMsg]);
    }
    
    setShowMentionPopover(false);
    setMentionQuery('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  {/* 안전 확인 박스 */ }
  return (
    <div className="flex flex-col h-[100dvh] md:h-[calc(100dvh-40px)] md:my-5 max-w-3xl mx-auto bg-white md:bg-white/90 md:backdrop-blur-xl md:rounded-3xl md:shadow-2xl overflow-hidden relative border border-white/20">
      {/* 상단 헤더 */}
      <header className="p-5 md:p-7 bg-white/80 backdrop-blur-md flex items-center justify-between border-b border-white/20 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => setScreen('home')} className="w-10 h-10 bg-white/50 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-500 hover:bg-white/80 transition-colors border border-white/20 shadow-sm">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h3 className="font-bold text-slate-800 text-xl tracking-tight leading-tight">
              {(() => {
                // 1순위: @ 버튼으로 선택 중인 기기
                if (activeDeviceId && devices) {
                  const targetDevice = devices.find(d => Number(d.id) === activeDeviceId);
                  if (targetDevice) return `${targetDevice.name} 가이드`;
                }
                
                // 2순위: 현재 표시중인 @ 멘션 텍스트 (아이콘 옆 텍스트)
                if (selectedMentionDevice) {
                  return `${selectedMentionDevice} 가이드`;
                }

                // 3순위: 기본 타이틀
                return 'Fixie 가이드';
              })()}
            </h3>
            <span className="text-[11px] text-theme-primary font-bold">온라인 · 도움 준비 완료</span>
          </div>
        </div>
        <button
          onClick={() => setIsReportModalOpen(true)}
          className="w-10 h-10 bg-theme-primary/10 rounded-xl flex items-center justify-center text-theme-primary hover:bg-theme-primary/20 transition-colors"
          title="진단 리포트"
        >
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
            className={`flex gap-3 ${
              msg.type === 'status' ? 'justify-center w-full' : 
              msg.senderType === 'USER' ? 'justify-end' : 'justify-start'
            }`}
          >

            {/* Fixie 봇 프로필 아이콘 (상태 메시지에는 미표시) */}
            {msg.senderType === 'AI' && msg.type !== 'status' && (
              <div className="w-8 h-8 rounded-full bg-wing-gradient flex items-center justify-center shrink-0">
                <span className="text-white font-bold italic text-[10px]">F</span>
              </div>
            )}
            {/* 메시지 컨텐츠 */}
            <div className={`
              ${msg.type === 'status' 
                ? 'bg-slate-100/50 backdrop-blur-sm text-slate-400 text-[11px] font-bold border border-slate-100 rounded-full px-4 py-0.5' 
                : 'max-w-[85%] p-1.5 relative ' + (msg.senderType === 'USER'
                  ? 'bg-fixie-steel text-white rounded-3xl rounded-tr-none shadow-md'
                  : 'bg-white/70 backdrop-blur-md text-slate-700 rounded-3xl rounded-tl-none border border-white/40 shadow-sm')
              }
            `}>
              <div className="p-3">

                {/* 첨부 이미지 표시 (그리드 레이아웃 적용) */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className={`
                    grid gap-2 mb-3 max-w-[320px]
                    ${msg.attachments.length === 1 ? 'grid-cols-1' : 
                      msg.attachments.length === 2 ? 'grid-cols-2' : 
                      msg.attachments.length >= 3 ? 'grid-cols-3' : ''}
                  `}>
                    {msg.attachments.map((url, i) => (
                      <div 
                        key={i} 
                        onClick={() => {
                          setLightboxImages(msg.attachments || []);
                          setLightboxIndex(i);
                        }}
                        className={`
                          relative overflow-hidden rounded-xl border border-white/20 cursor-pointer hover:opacity-90 transition-opacity
                          ${msg.attachments && msg.attachments.length >= 3 && i === 2 && msg.attachments.length > 3 ? 'after:content-["+'+(msg.attachments.length-3)+'"] after:absolute after:inset-0 after:bg-black/50 after:flex after:items-center after:justify-center after:text-white after:font-bold' : ''}
                          ${msg.attachments && msg.attachments.length >= 3 && i >= 3 ? 'hidden' : ''}
                          aspect-square
                        `}
                      >
                        <img 
                          src={url} 
                          alt="Attachment" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer" 
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* 메시지 텍스트 (사용자/AI 공통 노출) */}
                <p className="text-sm leading-relaxed mb-1 px-1 whitespace-pre-wrap">{msg.text}</p>

                {/* 가이드 타입 메시지 (매뉴얼 이미지, 비디오, 페이지 참고 등 포함) */}
                {msg.senderType === 'AI' && (
                  <div className="mt-2 space-y-3">

                    {/* 백엔드에서 온 매뉴얼 위치 이미지 */}
                    {msg.manualImageUrls && msg.manualImageUrls.length > 0 && (
                      <div className="mb-2">
                        <p className="text-[11px] font-bold text-theme-primary mb-1.5 flex items-center gap-1">
                          <ImageIcon size={12} /> 매뉴얼 위치 이미지
                        </p>
                        <img
                          src={msg.manualImageUrls[0]}
                          alt="Manual Guide"
                          className="w-full rounded-2xl border border-white/20 shadow-sm cursor-pointer"
                          referrerPolicy="no-referrer"
                          onClick={() => { setLightboxImages(msg.manualImageUrls!); setLightboxIndex(0); }}
                        />
                      </div>
                    )}

                    {msg.type === 'guide' && (
                      <>
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
                      </>
                    )}
                    
                    {/* [NEW] 실제 데이터가 있을 때만 매뉴얼 페이지 미리보기 표시 */}
                    {msg.senderType === 'AI' && msg.manualImageUrls && msg.manualImageUrls.length > 0 && (
                      <div className="mt-3">
                        <div className="text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1 uppercase tracking-tight">
                          <FileText size={10} />
                          Manual Preview ({msg.manualImageUrls.length}p)
                        </div>
                        <div 
                          className="w-full h-32 rounded-xl overflow-hidden border border-slate-200 cursor-zoom-in relative group"
                          onClick={() => {
                            setLightboxImages(msg.manualImageUrls!);
                            setLightboxIndex(0);
                          }}
                        >
                          <img src={msg.manualImageUrls[0]} alt="Manual" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                             <div className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-slate-700 shadow-lg">
                               <FileText size={14} />
                             </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 피드백 및 매뉴얼 버튼 영역 (강화됨) - 환영 인사가 아닐 때만 노출 */}
                    {msg.senderType === 'AI' && msg.id !== '1' && msg.id !== 'welcome' && (
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {/* 1. 매뉴얼 보기 버튼 (데이터 있을 때) */}
                          {(msg.manualLink || msg.referencedPage || (msg.manualImageUrls && msg.manualImageUrls.length > 0)) && (
                            <button 
                              className="flex items-center gap-2 px-4 py-3 bg-theme-primary/10 hover:bg-theme-primary text-theme-primary hover:text-white rounded-2xl transition-all text-xs font-black shadow-sm border border-theme-primary/10"
                              onClick={() => {
                                if (msg.manualImageUrls && msg.manualImageUrls.length > 0) {
                                  setLightboxImages(msg.manualImageUrls);
                                  setLightboxIndex(0);
                                } else if (msg.manualLink) {
                                  window.open(msg.manualLink, '_blank');
                                }
                              }}
                            >
                              <FileText size={14} strokeWidth={2.5} />
                              {msg.referencedPage ? `매뉴얼 P.${msg.referencedPage} 열기` : '상세 매뉴얼 보기'}
                            </button>
                          )}

                          {/* 2. 진단 리포트 열기 버튼 (환영 인사가 아닐 때만 노출) */}
                          {msg.id !== '1' && (
                            <button 
                              className="flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-800 text-slate-600 hover:text-white rounded-2xl transition-all text-xs font-black shadow-sm border border-slate-200"
                              onClick={() => setIsReportModalOpen(true)}
                            >
                              <ShieldCheck size={14} strokeWidth={2.5} />
                              AI 진단 리포트
                            </button>
                          )}
                        </div>

                        {/* 피드백 하단 배치 */}
                        <div className="flex items-center gap-3 px-1">
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Helpful?</span>
                          <button
                            onClick={() => handleFeedback(msg.id, true)}
                            className="text-slate-300 hover:text-theme-primary transition-colors"
                          >
                            <ThumbsUp size={14} />
                          </button>
                          <button
                            onClick={() => handleFeedback(msg.id, false)}
                            className="text-slate-300 hover:text-red-400 transition-colors"
                          >
                            <ThumbsDown size={14} />
                          </button>
                        </div>
                      </div>
                    )}
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
              className="flex items-center gap-3 mb-3 p-3 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-100 shadow-lg max-w-[calc(100%-16px)] md:max-w-full overflow-x-auto no-scrollbar"
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
          flex items-center gap-2 transition-all duration-300 relative
          bg-white/40 backdrop-blur-xl rounded-full p-1 pl-4 shadow-none border border-white/20
          md:bg-white/60 md:backdrop-blur-xl md:p-2 md:pl-4 md:shadow-lg md:border-white/30
        `}>

          {/* 마이크 버튼 */}
          <button
            onClick={() => setIsVoiceModalOpen(true)}
            className="p-2 text-theme-primary bg-theme-primary/10 rounded-full hover:bg-theme-primary/20 transition-colors"
          >
            <Mic size={18} className="md:w-5 md:h-5" />
          </button>

          <input type="file" id="file-upload" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
          <label htmlFor="file-upload" className="p-2 text-slate-400 rounded-full hover:bg-slate-100 cursor-pointer transition-colors">
            <Paperclip size={18} className="md:w-5 md:h-5" />
          </label>

          {/* @ 어노테이션 버튼 (모바일 친화적) */}
          <button
            id="mention-btn"
            onClick={() => {
              setShowMentionPopover(prev => !prev);
              setMentionQuery('');
            }}
            className={`p-2 rounded-full transition-all font-bold text-sm ${
              selectedMentionDevice
                ? 'text-white bg-theme-primary shadow-md shadow-theme-primary/30'
                : 'text-slate-400 bg-slate-100 hover:bg-theme-primary/10 hover:text-theme-primary'
            }`}
            title="기기 멘션하기"
          >
            @
          </button>

          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder="질문을 입력하세요..."
            className="flex-1 bg-transparent h-10 px-1 focus:outline-none text-[13px] md:text-sm text-slate-700 font-medium"
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;
              if (e.key === 'Enter' && canSend) {
                onSendMessage();
              }
            }}
          />

          {/* 전송 버튼: 기기 멘션(@)이 선택되어야 활성화 */}
          <button
            id="send-btn"
            disabled={!canSend}
            className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white shadow-md transition-all shrink-0 ${
              canSend
                ? 'bg-wing-gradient hover:scale-105 active:scale-95 cursor-pointer'
                : 'bg-slate-200 cursor-not-allowed opacity-60'
            }`}
            onClick={() => {
              if (canSend) {
                onSendMessage();
                setSelectedMentionDevice(null); // 전송 후 멘션 초기화
              }
            }}
          >
            <Send className="w-4 h-4 md:w-4.5 md:h-4.5 -ml-0.5" />
          </button>

          {/* 멘션(@) 기기 선택 팝업 (입력창 바로 위로 배치) */}
          <AnimatePresence>
            {showMentionPopover && (
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.98 }}
                className="absolute bottom-full left-0 mb-2 z-[100] bg-white/95 backdrop-blur-2xl border border-slate-200/60 rounded-2xl overflow-hidden w-64"
              >
                <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                  <p className="text-[10px] font-black text-theme-primary uppercase tracking-wider">가전 참조하기</p>
                </div>
                <div className="max-h-56 overflow-y-auto no-scrollbar">
                  {/* 카테고리 1: 기능 호출 */}
                  <div className="p-2 border-b border-slate-50">
                    <button
                      onClick={() => handleSelectMention('매뉴얼 즉시 보기')}
                      className="w-full text-left px-3 py-2.5 hover:bg-theme-primary/5 rounded-xl transition-colors flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-theme-primary/10 flex items-center justify-center text-theme-primary">
                        <FileText size={16} />
                      </div>
                      <span className="text-[13px] font-black text-slate-700">매뉴얼 즉시 보기</span>
                    </button>
                    <button
                      onClick={() => handleSelectMention('진단 리포트 열기')}
                      className="w-full text-left px-3 py-2.5 hover:bg-theme-primary/5 rounded-xl transition-colors flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-theme-secondary/10 flex items-center justify-center text-theme-secondary">
                        <ShieldCheck size={16} />
                      </div>
                      <span className="text-[13px] font-black text-slate-700">진단 리포트 열기</span>
                    </button>
                  </div>

                  {/* 카테고리 2: 기기 목록 */}
                  <div className="p-2 bg-slate-50/30">
                    <p className="px-3 py-1 text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">나의 가전 목록</p>
                    {devices && devices.length > 0 ? (
                      devices
                        .filter(d => d.name.toLowerCase().includes(mentionQuery.toLowerCase()) || d.model.toLowerCase().includes(mentionQuery.toLowerCase()))
                        .map((device, idx) => (
                          <button
                            key={device.id || `mention-device-${idx}`}
                            onClick={() => handleSelectMention(device.name)}
                            className="w-full text-left px-3 py-2.5 hover:bg-white rounded-xl hover:shadow-sm transition-all flex items-center gap-3"
                          >
                            <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-400">
                              <WashingMachine size={16} />
                            </div>
                            <div>
                              <p className="text-[13px] font-bold text-slate-700 leading-tight">{device.name}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{device.model}</p>
                            </div>
                          </button>
                        ))
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-xs text-slate-300 font-medium">등록된 기기가 없습니다</p>
                      </div>
                    )}
                  </div>
                  
                  {devices && devices.length > 0 && devices.filter(d => d.name.toLowerCase().includes(mentionQuery.toLowerCase())).length === 0 && mentionQuery && (
                    <div className="p-4 text-center text-[11px] text-slate-400">검색 결과가 없습니다</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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

      {/* STT(음성 인식) 모달 팝업 */}
      <AnimatePresence>
        {isVoiceModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm md:p-4"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-3xl bg-white rounded-t-3xl md:rounded-3xl p-8 flex flex-col items-center gap-6 shadow-2xl relative"
            >
              <button
                onClick={handleVoiceClose}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>

              <div className="text-center space-y-2 mt-4">
                <h3 className="text-xl font-bold text-slate-800">
                  {isListening ? "듣고 있어요..." : "말씀하시려면 버튼을 누르세요"}
                </h3>
                <p className="text-sm text-slate-500">궁금한 점을 자유롭게 말씀해주세요.</p>
              </div>

              {/* 마이크 파동 애니메이션 효과 */}
              <div
                className="relative w-32 h-32 flex items-center justify-center my-6 cursor-pointer"
                onClick={toggleListening}
              >
                {isListening && (
                  <>
                    <div className="absolute inset-0 bg-theme-primary/20 rounded-full animate-ping opacity-75"></div>
                    <div className="absolute inset-2 bg-theme-primary/30 rounded-full animate-pulse"></div>
                  </>
                )}
                <div className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all ${isListening ? 'bg-wing-gradient shadow-theme-primary/40' : 'bg-slate-200 shadow-none'}`}>
                  <Mic size={36} fill={isListening ? "white" : "#94a3b8"} className={isListening ? "text-white" : "text-slate-400"} />
                </div>
              </div>

              <div className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 min-h-[100px] flex items-center justify-center text-center">
                {isListening || tempTranscript ? (
                  <span className="text-slate-700 text-sm font-bold animate-in fade-in">
                    {tempTranscript || "언어 분석 중..."}
                  </span>
                ) : (
                  <span className="text-slate-400 text-sm font-medium italic">마이크를 눌러 음성 입력을 시작하세요.</span>
                )}
              </div>

              <button
                onClick={handleVoiceClose}
                className="w-full py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-700 transition-colors mt-2"
              >
                입력 완료
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 진단 리포트 오버레이 모달 */}
      <AnimatePresence>
        {isReportModalOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-[150] bg-slate-50 overflow-y-auto"
          >
            <DiagnosticReport
              setScreen={setScreen}
              roomId={activeRoomId ? String(activeRoomId) : undefined}
              onClose={() => setIsReportModalOpen(false)}
              shareUrl={activeRoomId ? `https://fixie.app/share/${activeRoomId}` : undefined}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 이미지 라이트박스(슬라이드) 모달 */}
      <AnimatePresence>
        {lightboxImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4"
          >
            <button 
              onClick={() => setLightboxImages([])}
              className="absolute top-6 right-6 text-white/70 hover:text-white z-50 p-2"
            >
              <X size={32} />
            </button>

            {/* 좌우 이동 버튼 */}
            {lightboxImages.length > 1 && (
              <>
                <button 
                  onClick={() => setLightboxIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-4 z-50 transition-colors"
                >
                  <ArrowLeft size={40} />
                </button>
                <button 
                  onClick={() => setLightboxIndex((prev) => (prev + 1) % lightboxImages.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-4 z-50 transition-colors rotate-180"
                >
                  <ArrowLeft size={40} />
                </button>
              </>
            )}

            <div className="relative w-full h-full flex flex-col items-center justify-center gap-4">
              <motion.img 
                key={lightboxIndex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                src={lightboxImages[lightboxIndex]} 
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
              />
              <div className="text-white/70 font-bold text-sm bg-black/50 px-4 py-2 rounded-full">
                {lightboxIndex + 1} / {lightboxImages.length}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};