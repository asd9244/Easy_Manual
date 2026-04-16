import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SocialShareModal } from '@/src/components/common/SocialShareModal';
import { Message, Screen, Device } from '@/src/types/index';
import { api } from '@/src/api/apiService';
import { chatService } from '@/src/services/chatService';

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
import { getCategoriesForProductType, CategoryItem } from './constants';

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
  /** TOP 5 등에서 전달된 질문 카테고리(createChatRoom). 칩 선택이 없을 때만 사용 */
  initialQuestionCategory?: string | null;
  onRoomCreated?: (id: number) => void;
  onClose?: () => void;
  /** 이력 질문 목록에서 진입 시 스크롤할 메시지 id */
  focusMessageId?: string | null;
  onConsumedFocusMessage?: () => void;
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
  initialQuestionCategory = null,
  onRoomCreated,
  onClose,
  focusMessageId,
  onConsumedFocusMessage,
}) => {
  // ── 커스텀 훅 ──
  const room = useChatRoom({
    roomId, deviceId, devices, initialDeviceName,
    setMessages, setIsAnalyzing,
  });

  const [inputText, setInputText] = useState('');

  // ── 카테고리 선택 상태 ──
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);

  // 현재 기기의 제품군 + 기기명 (카테고리 목록 결정에 사용)
  const currentDevice = devices?.find(d => Number(d.id) === deviceId);
  const currentProductType = currentDevice?.productType ?? null;
  const currentDeviceName = currentDevice?.name ?? room.selectedMentionDevice ?? null;

  // 카테고리 칩 노출 조건: 읽기전용 아님 + 아직 방이 없음(새 대화) + 기기 있음
  // TOP 5 등으로 initialQuestionCategory가 이미 있으면 중복 선택 UI를 띄우지 않음
  const showCategoryChips =
    !isReadOnly &&
    !room.activeRoomId &&
    (deviceId !== null || room.activeDeviceId !== null) &&
    messages.every(m => m.type === 'status') &&
    !initialQuestionCategory;

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
    questionCategory: selectedCategory?.value ?? initialQuestionCategory ?? null,
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
  const [summaryHeaderOverride, setSummaryHeaderOverride] = useState<{
    deviceLabel: string;
    questionSummary: string;
  } | null>(null);
  const [summarizingAiMessageId, setSummarizingAiMessageId] = useState<string | null>(null);

  // 멘션(@) 관련 상태
  const [showMentionPopover, setShowMentionPopover] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  /** 이력 포커스 직후 chatEnd 자동 스크롤이 덮어쓰지 않도록, 이 시각(ms)까지 억제 */
  const suppressAutoScrollUntilRef = useRef(0);
  const prevMessageCountRef = useRef(0);

  // ── 파생 값 ──
  const canSend = (inputText.trim().length > 0 || attachedFiles.length > 0) && (!!room.selectedMentionDevice || !!room.activeRoomId);

  const summaryModalDeviceLabel =
    (currentDevice?.alias && currentDevice.alias.trim()) ||
    currentDeviceName ||
    room.selectedMentionDevice ||
    '기기';

  const firstUserMessage = messages
    .filter((m) => m.senderType === 'USER')
    .map((m) => m.text?.trim())
    .find((t) => t && t.length > 0);

  const summaryModalQuestionLine = firstUserMessage
    ? (firstUserMessage.length > 56 ? `${firstUserMessage.slice(0, 56)}…` : firstUserMessage)
    : '질문 요약';

  // ── 이펙트 ──

  useEffect(() => {
    prevMessageCountRef.current = 0;
  }, [roomId]);

  useEffect(() => {
    const count = messages.length;
    const grew = count > prevMessageCountRef.current;
    prevMessageCountRef.current = count;
    const last = count > 0 ? messages[count - 1] : undefined;
    const userJustSent = grew && last?.senderType === 'USER';

    if (Date.now() < suppressAutoScrollUntilRef.current && !userJustSent) {
      return;
    }
    requestAnimationFrame(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [messages, isAnalyzing]);

  useEffect(() => {
    if (!initialQuery || room.hasProcessedInitialQuery.current) return;
    // 기기 목록이 아직이면 createChatRoom이 guest/잘못된 분기로 갈 수 있음. TOP 5 등 deviceId 진입 시 대기.
    if (isLoadingDevices) return;
    if (deviceId != null && (!devices || devices.length === 0)) return;

    startNewChat(initialQuery);
    room.hasProcessedInitialQuery.current = true;
    if (setInitialQuery) setInitialQuery('');
  }, [initialQuery, isLoadingDevices, deviceId, devices]);

  useEffect(() => {
    if (!focusMessageId || messages.length === 0) return;
    const el = document.getElementById(`chat-msg-${focusMessageId}`);
    if (!el) {
      // 아직 버블이 마운트되기 전: 맨 아래로 끌려가는 것만 잠시 막음 (onConsumed 호출 전이라 id 유지)
      suppressAutoScrollUntilRef.current = Math.max(
        suppressAutoScrollUntilRef.current,
        Date.now() + 8000,
      );
      return;
    }

    const t = window.setTimeout(() => {
      suppressAutoScrollUntilRef.current = Date.now() + 3200;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      onConsumedFocusMessage?.();
    }, 450);
    return () => window.clearTimeout(t);
  }, [focusMessageId, messages, onConsumedFocusMessage]);

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

  const handleSummarizeTurn = async (aiMessageId: string) => {
    const rid = room.activeRoomId;
    if (!rid) return;

    let userQ = '';
    const aiIdx = messages.findIndex((m) => m.id === aiMessageId);
    for (let i = aiIdx - 1; i >= 0; i--) {
      if (messages[i].senderType === 'USER') {
        userQ = messages[i].text?.trim() || '';
        break;
      }
    }
    const qLine =
      userQ.length > 80 ? `${userQ.slice(0, 80)}…` : userQ || '—';

    setSummaryHeaderOverride({
      deviceLabel: summaryModalDeviceLabel,
      questionSummary: qLine,
    });
    setSummarizingAiMessageId(aiMessageId);
    try {
      const { summary } = await chatService.summarizeTurn(rid, aiMessageId);
      setSummaryText(summary);
      setIsSummaryModalOpen(true);
    } catch (e) {
      console.error('턴 요약 실패:', e);
      alert('요약을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      setSummaryHeaderOverride(null);
    } finally {
      setSummarizingAiMessageId(null);
    }
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
            showSummarizeAction={!!room.activeRoomId}
            onSummarizeAiTurn={handleSummarizeTurn}
            summarizingAiMessageId={summarizingAiMessageId}
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
                {getCategoriesForProductType(currentProductType, currentDeviceName).map(cat => (
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
        onClose={() => {
          setIsSummaryModalOpen(false);
          setSummaryHeaderOverride(null);
        }}
        onShare={() => setIsShareModalOpen(true)}
        deviceLabel={summaryHeaderOverride?.deviceLabel ?? summaryModalDeviceLabel}
        questionSummary={summaryHeaderOverride?.questionSummary ?? summaryModalQuestionLine}
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
