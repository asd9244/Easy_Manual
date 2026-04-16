import React from 'react';
import { Message, Device } from '@/src/types/index';
import { chatService } from '@/src/services/chatService';
import { MIN_LOADING_TIME } from '../constants';

interface UseChatSendParams {
  activeRoomId: number | null;
  setActiveRoomId: (id: number | null) => void;
  activeDeviceId: number | null;
  isGuestMode: boolean;
  setIsGuestMode: (v: boolean) => void;
  devices: Device[];
  isLoadingDevices?: boolean;
  isAnalyzing: boolean;
  setIsAnalyzing: React.Dispatch<React.SetStateAction<boolean>>;
  inputText: string;
  setInputText: (v: string) => void;
  attachedFiles: string[];
  setAttachedFiles: React.Dispatch<React.SetStateAction<string[]>>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onRoomCreated?: (id: number) => void;
  markRoomOwned: (id: number) => void;
  startLoading: () => void;
  stopLoading: () => void;
  questionCategory?: string | null;
}

export function useChatSend({
  activeRoomId,
  setActiveRoomId,
  activeDeviceId,
  isGuestMode,
  setIsGuestMode,
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
  markRoomOwned,
  startLoading,
  stopLoading,
  questionCategory,
}: UseChatSendParams) {

  const handleChatError = (error: any) => {
    console.error('채팅 오류:', error);
    let errorDetail = error.response?.data?.message || error.message;

    if (error.response?.status === 500) {
      errorDetail = '서버 엔진에서 기기 정보를 처리하지 못했습니다. 기기 상태를 다시 확인해주세요.';
    }

    const errorMsg: Message = {
      id: String(Date.now() + 1),
      senderType: 'AI',
      text: `⚠️ 오류가 발생했습니다: ${errorDetail}`,
      type: 'status',
    };
    setMessages(prev => [...prev, errorMsg]);
  };

  const performAsk = async (roomId: number, text: string, mediaUrl?: string) => {
    const minDelay = new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME));

    try {
      const responsePromise =
        roomId === -1
          ? new Promise(resolve =>
              setTimeout(
                () =>
                  resolve({
                    id: Date.now(),
                    message: '현재 기기 정보 확인이 어렵습니다. 잠시 후 다시 시도해 주시거나 [가이드]에서 기기 상태를 확인해 주세요.',
                  }),
                800,
              ),
            )
          : chatService.askQuestion(roomId, text, mediaUrl);

      const response = await responsePromise;
      await minDelay;

      const data = response as any;
      const referencedPage = data.referencedPage || data.referenced_page;
      const manualImageUrls = data.manualImageUrls || data.manual_image_urls || [];
      const aiMessage = data.message || data.ai_answer || data.text || '대답을 생성할 수 없습니다.';

      const fixieMsg: Message = {
        id: String(data.id || Date.now() + 1),
        senderType: 'AI',
        text: aiMessage,
        type: 'guide',
        referencedPage,
        manualImageUrls,
        mediaUrl: data.mediaUrl || data.media_url,
      };

      setMessages(prev => [...prev, fixieMsg]);
    } catch (error) {
      await minDelay;
      throw error;
    }
  };

  const startNewChat = async (query: string) => {
    setIsAnalyzing(true);
    try {
      if (!devices || devices.length === 0) {
        const welcomeMsg: Message = {
          id: 'guest-notice-' + Date.now(),
          senderType: 'AI',
          text: '등록된 기기 정보가 없지만, 보내주신 이미지를 기반으로 분석을 시작할 수 있습니다. 어떤 도움이 필요하신가요?',
          type: 'status',
        };
        setMessages(prev => [...prev, welcomeMsg]);

        try {
          setIsGuestMode(true);
          const guestRoom = await chatService.createChatRoom(0, questionCategory);
          const guestRoomId = guestRoom.roomId;
          markRoomOwned(guestRoomId);
          setActiveRoomId(guestRoomId);
          onRoomCreated?.(guestRoomId);

          if (query !== 'ocr_image') {
            await sendMessage(query, guestRoomId);
          }
        } catch {
          setActiveRoomId(-1);
          if (query !== 'ocr_image') {
            await sendMessage(query, -1);
          }
        }
        return;
      }

      const devId = activeDeviceId ? String(activeDeviceId) : devices[0].id;
      const newRoom = await chatService.createChatRoom(devId, questionCategory);
      const newRoomId = newRoom.roomId;
      markRoomOwned(newRoomId);
      setActiveRoomId(newRoomId);
      onRoomCreated?.(newRoomId);

      if (query === 'ocr_image') {
        const ocrMsg: Message = {
          id: 'ocr-notice-' + Date.now(),
          senderType: 'AI',
          text: '방금 스캔하신 이미지를 분석 중입니다. 잠시만 기다려주세요...',
          type: 'status',
        };
        setMessages(prev => [...prev, ocrMsg]);
      } else {
        await sendMessage(query, newRoomId);
      }
    } catch (error) {
      console.error('새 채팅 시작 실패:', error);
      handleChatError(error);
    } finally {
      setTimeout(() => stopLoading(), MIN_LOADING_TIME);
    }
  };

  const sendMessage = async (customText?: string, targetRoomId?: number) => {
    if (isAnalyzing && !targetRoomId) return;

    const userText = customText || inputText;
    const userAttachments = [...attachedFiles];

    if (!userText.trim() && userAttachments.length === 0) return;
    // 방이 이미 만들어진 뒤(예: startNewChat → sendMessage(roomId))에는 기기 목록 로딩과 무관하게 질문 전송해야 함.
    // isLoadingDevices 시점에 여기서 return 하면 AI 요청이 조용히 생략되어 간헐적 미연결처럼 보임.
    if (isLoadingDevices && !targetRoomId) return;

    const newUserMsg: Message = { id: Date.now().toString(), senderType: 'USER', text: userText, attachments: userAttachments };
    setMessages(prev => [...prev, newUserMsg]);
    setInputText('');
    setAttachedFiles([]);

    if (!targetRoomId && !activeRoomId) {
      startLoading();
      try {
        if (!devices || devices.length === 0 || !activeDeviceId) {
          setIsGuestMode(true);
          setActiveRoomId(-1);
          await performAsk(-1, userText, userAttachments[0]);
        } else {
          const newRoom = await chatService.createChatRoom(activeDeviceId, questionCategory);
          if (newRoom?.roomId) {
            const newId = newRoom.roomId;
            markRoomOwned(newId);
            setActiveRoomId(newId);
            onRoomCreated?.(newId);
            await performAsk(newId, userText, userAttachments[0]);
          } else {
            throw new Error('채팅방을 생성할 수 없습니다.');
          }
        }
      } catch {
        setIsGuestMode(true);
        setActiveRoomId(-1);
        await performAsk(-1, userText, userAttachments[0]);
      } finally {
        stopLoading();
      }
    } else {
      startLoading();
      try {
        await performAsk(targetRoomId || activeRoomId!, userText, userAttachments[0]);
      } catch (error) {
        handleChatError(error);
      } finally {
        stopLoading();
      }
    }
  };

  return { sendMessage, startNewChat, handleChatError };
}
