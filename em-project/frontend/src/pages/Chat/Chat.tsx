import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SocialShareModal } from '@/src/components/common/SocialShareModal';
import { Message, Screen, Device } from '@/src/types/index';
import { api } from '@/src/api/apiService';

import { useChatRoom, useChatSend, useSpeechRecognition } from './hooks';
import {
  ChatSkeleton,
  ChatHeader,
  MessageBubble,
  ChatComposer,
  VideoModal,
  VoiceModal,
  LightboxModal,
  ResumeSheet,
  SummaryModal,
} from './components';
import { getCategoriesForDevice, CategoryItem } from './constants';

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
  setInitialQuery?: (query: string) => void;
  devices: Device[];
  isLoadingDevices?: boolean;
  roomId: number | null;
  deviceId: number | null;
  initialDeviceName?: string | null;
  onRoomCreated?: (id: number) => void;
  onClose?: () => void;
}

export const Chat: React.FC<ChatProps> = ({ 
  setScreen, 
  messages, 
  isAnalyzing, 
  setIsAnalyzing, 
  attachedFiles, 
  setAttachedFiles, 
  chatEndRef, 
  handleSendMessage, 
  handleFileChange, 
  setMessages, 
  isReadOnly, 
  removeAttachment,
  initialQuery,
  setInitialQuery,
  devices,
  isLoadingDevices,
  roomId,
  deviceId,
  initialDeviceName,
  onRoomCreated,
  onClose
}) => {
  // ── 커스텀 훅 ──
  const room = useChatRoom({
    roomId, deviceId, devices, initialDeviceName,
    setMessages, setIsAnalyzing,
  });

  const [inputText, setInputText] = useState('');

  // ── 카테고리 선택 상태 ──
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);

  // 현재 기기의 제품명 (카테고리 목록 결정에 사용)
  const currentDeviceName =
    devices?.find(d => Number(d.id) === deviceId)?.name
    ?? room.selectedMentionDevice
    ?? null;

  // 카테고리 칩 노출 조건: 읽기전용 아님 + 아직 방이 없음(새 대화) + 기기 있음
  const showCategoryChips =
    !isReadOnly &&
    !room.activeRoomId &&
    (deviceId !== null || room.activeDeviceId !== null) &&
    messages.every(m => m.type === 'status');

  const { sendMessage, startNewChat } = useChatSend({
    activeRoomId: room.activeRoomId,
    setActiveRoomId: room.setActiveRoomId,
    activeDeviceId: room.activeDeviceId,
    isGuestMode: room.isGuestMode,
    setIsGuestMode: room.setIsGuestMode,
    devices,
    isLoadingDevices,
    isAnalyzing,
    setIsAnalyzing,
    inputText,
    setInputText,
    attachedFiles,
    setAttachedFiles,
    setMessages,
    onRoomCreated,
    markRoomOwned: room.markRoomOwned,
    startLoading: room.startLoading,
    stopLoading: room.stopLoading,
    questionCategory: selectedCategory?.value ?? null,
  });

  const speech = useSpeechRecognition(setInputText);

  // ── 로컬 UI 상태 ──
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [summaryText, setSummaryText] = useState('');

  // 멘션(@) 관련 상태
  const [showMentionPopover, setShowMentionPopover] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // ── 파생 값 ──
  const canSend = (inputText.trim().length > 0 || attachedFiles.length > 0) && (!!room.selectedMentionDevice || !!room.activeRoomId);

  // ── 이펙트 ──

  useEffect(() => {
    requestAnimationFrame(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [messages, isAnalyzing]);

  useEffect(() => {
    if (initialQuery && !room.hasProcessedInitialQuery.current) {
      startNewChat(initialQuery);
      room.hasProcessedInitialQuery.current = true;
      if (setInitialQuery) setInitialQuery('');
    }
  }, [initialQuery]);

  // ── 이벤트 핸들러 ──

  const handleFeedback = async (messageId: string, isLike: boolean) => {
    try {
      await api.post('/chat/feedback', { messageId, feedback: isLike ? 'LIKE' : 'DISLIKE' });
      alert(isLike ? '좋은 답변 피드백 감사합니다!' : '답변 개선에 참고하겠습니다.');
    } catch (error) {
      console.error("피드백 전송 실패:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputText(value);

    const mentionMatch = value.match(/@([^@\s]*)$/);
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      if (inputRef.current?.getBoundingClientRect()) setShowMentionPopover(true);
    } else {
      setShowMentionPopover(false);
      setMentionQuery('');
    }
  };

  const handleSelectMention = (deviceName: string) => {
    if (deviceName === '매뉴얼 즉시 보기') {
      if (room.activeDeviceId && devices) {
        const lastAiMsg = [...messages].reverse().find(m => m.senderType === 'AI' && m.manualImageUrls && m.manualImageUrls.length > 0);
        if (lastAiMsg?.manualImageUrls) {
          setLightboxImages(lastAiMsg.manualImageUrls);
          setLightboxIndex(0);
        } else {
          alert('현재 대화 중인 기기의 매뉴얼 정보를 찾을 수 없습니다. 분석 내용을 먼저 확인해 주세요.');
        }
      }
      setShowMentionPopover(false);
      setMentionQuery('');
      return;
    }

    setInputText(inputText.replace(/@([^@\s]*)$/, `@${deviceName} `));
    room.setSelectedMentionDevice(deviceName);

    const mentionedDevice = devices?.find(d => d.name === deviceName);
    if (mentionedDevice) {
      room.setActiveDeviceId(Number(mentionedDevice.id));
      room.setActiveRoomId(null);
      setMessages([{ id: 'system-' + Date.now(), senderType: 'AI', text: `✨ 새로운 [${deviceName}] 가이드 대화를 시작합니다.`, type: 'status' }]);
    }

    setShowMentionPopover(false);
    setMentionQuery('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSummarize = () => {
    setIsSummaryModalOpen(true);
    if (messages.length < 2) {
      setSummaryText('대화가 부족하여 요약할 내용이 없습니다. 궁금한 점을 더 말씀해 주세요!');
      return;
    }
    const userQueries = messages.filter(m => m.senderType === 'USER').map(m => m.text).slice(0, 3);
    setSummaryText(`이번 대화에서는 주로 **${room.selectedMentionDevice || '기기'}**의 **${userQueries[0]?.substring(0, 10) || '사용 방법'}** 등에 대해 알아보셨습니다. AI 가이드가 제안한 해결책을 확인하고 이 대화 내역을 공유해 보세요.`);
  };

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
  };

  const openVideo = (url: string) => {
    setCurrentVideoUrl(url);
    setIsVideoModalOpen(true);
  };

  // ── 렌더링 ──
  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
      <ChatHeader
        selectedMentionDevice={room.selectedMentionDevice}
        activeDeviceId={room.activeDeviceId}
        devices={devices}
        isReadOnly={isReadOnly}
        setScreen={setScreen}
        onSummarize={handleSummarize}
        onShare={() => setIsShareModalOpen(true)}
        onClose={onClose}
      />

      {/* 메시지 리스트 영역 */}
      <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6 no-scrollbar pb-[280px]">
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            onFeedback={handleFeedback}
            onImageClick={openLightbox}
            onVideoClick={openVideo}
          />
        ))}

        {/* 새 대화 시작 시 카테고리 선택 칩 */}
        {showCategoryChips && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              {selectedCategory ? '선택된 주제' : '어떤 주제로 도움이 필요하신가요?'}
            </p>
            {selectedCategory ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-theme-primary text-white text-sm font-semibold rounded-full">
                  {selectedCategory.label}
                </span>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 transition-colors"
                >
                  변경
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {getCategoriesForDevice(currentDeviceName).map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat)}
                    className="px-3.5 py-1.5 bg-white border border-slate-200 hover:border-theme-primary/60 hover:bg-theme-primary/5 text-slate-600 hover:text-theme-primary text-sm font-medium rounded-full transition-all active:scale-95"
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {isAnalyzing && (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
              className="pb-10"
            >
              <ChatSkeleton />
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>

      <ChatComposer
        inputText={inputText}
        canSend={canSend}
        attachedFiles={attachedFiles}
        selectedMentionDevice={room.selectedMentionDevice}
        showMentionPopover={showMentionPopover}
        mentionQuery={mentionQuery}
        devices={devices}
        inputRef={inputRef}
        onInputChange={handleInputChange}
        onSend={() => sendMessage()}
        onSendAndClearMention={() => { sendMessage(); room.setSelectedMentionDevice(null); }}
        onVoiceOpen={() => setIsVoiceModalOpen(true)}
        onFileChange={handleFileChange}
        onRemoveAttachment={removeAttachment}
        onToggleMentionPopover={() => { setShowMentionPopover(prev => !prev); setMentionQuery(''); }}
        onSelectMention={handleSelectMention}
      />

      {/* 모달 레이어 */}
      <VideoModal isOpen={isVideoModalOpen} videoUrl={currentVideoUrl} onClose={() => setIsVideoModalOpen(false)} />

      <VoiceModal
        isOpen={isVoiceModalOpen}
        isListening={speech.isListening}
        tempTranscript={speech.tempTranscript}
        onToggleListening={speech.toggleListening}
        onClose={() => { speech.stopListening(); setIsVoiceModalOpen(false); }}
      />

      <LightboxModal
        images={lightboxImages}
        index={lightboxIndex}
        onClose={() => setLightboxImages([])}
        onPrev={() => setLightboxIndex(prev => (prev - 1 + lightboxImages.length) % lightboxImages.length)}
        onNext={() => setLightboxIndex(prev => (prev + 1) % lightboxImages.length)}
      />

      <ResumeSheet
        rooms={room.pendingResumeRooms}
        onStartNew={() => {
          room.handleStartNew();
          setSelectedCategory(null);
        }}
        onResume={room.handleConfirmResume}
        onBack={room.handleBackFromResumeList}
      />

      <SummaryModal
        isOpen={isSummaryModalOpen}
        summaryText={summaryText}
        onClose={() => setIsSummaryModalOpen(false)}
        onShare={() => setIsShareModalOpen(true)}
      />

      <SocialShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={room.selectedMentionDevice ? `${room.selectedMentionDevice} 상담 내역` : "Fixie 대화 공유"}
        shareUrl={room.activeRoomId ? `${window.location.origin}/?share=${room.activeRoomId}` : window.location.href}
      />
    </div>
  );
};
