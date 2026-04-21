import React, { useState, useEffect, useRef } from 'react';
import { Message, Device } from '@/src/types/index';
import { chatService, type ChatRoomListRow } from '@/src/services/chatService';
import { MIN_LOADING_TIME } from '../constants';

interface UseChatRoomParams {
  roomId: number | null;
  deviceId: number | null;
  devices: Device[];
  initialDeviceName?: string | null;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setIsAnalyzing: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useChatRoom({
  roomId,
  deviceId,
  devices,
  initialDeviceName,
  setMessages,
  setIsAnalyzing,
}: UseChatRoomParams) {
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [activeDeviceId, setActiveDeviceId] = useState<number | null>(deviceId ?? null);
  const [selectedMentionDevice, setSelectedMentionDevice] = useState<string | null>(initialDeviceName ?? null);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [pendingResumeRooms, setPendingResumeRooms] = useState<ChatRoomListRow[] | null>(null);

  const hasProcessedInitialQuery = useRef(false);
  const loadingOpsCount = useRef(0);

  const startLoading = () => {
    loadingOpsCount.current += 1;
    if (loadingOpsCount.current === 1) setIsAnalyzing(true);
  };

  const stopLoading = () => {
    loadingOpsCount.current = Math.max(0, loadingOpsCount.current - 1);
    if (loadingOpsCount.current === 0) setIsAnalyzing(false);
  };

  const loadRoomMessages = async (id: number) => {
    startLoading();
    const minDelay = new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME));
    try {
      const history = await chatService.getMessages(id);
      await minDelay;
      setMessages(history);
    } catch (error) {
      await minDelay;
      console.error('대화 내역 로드 실패:', error);
    } finally {
      stopLoading();
    }
  };

  // roomId / deviceId 진입 처리
  // ownedRoomRef: 이 세션에서 직접 생성한 방 ID. onRoomCreated 콜백으로 roomId prop이
  // 바뀌어도 불필요한 loadRoomMessages / syncRoomContext 를 건너뛴다.
  const ownedRoomRef = useRef<number | null>(null);

  const markRoomOwned = (id: number) => { ownedRoomRef.current = id; };

  useEffect(() => {
    let cancelled = false;

    if (roomId) {
      // 이 세션에서 방금 생성한 방이면 로드 생략 (onRoomCreated → roomId prop 변경 시)
      if (ownedRoomRef.current === roomId) return;

      setActiveRoomId(roomId);
      loadRoomMessages(roomId);

      const syncRoomContext = async () => {
        try {
          const rooms = await chatService.getChatRooms();
          if (cancelled) return;
          const currentRoom = rooms.find((r: ChatRoomListRow) => Number(r.id) === Number(roomId));
          if (currentRoom) {
            const devId = currentRoom.userDeviceId || currentRoom.deviceId;
            setActiveDeviceId(devId !== undefined ? Number(devId) : null);

            const roomDevName = currentRoom.deviceName || currentRoom.device_name;
            if (roomDevName && roomDevName !== '알 수 없는 기기') {
              setSelectedMentionDevice(roomDevName);
            } else {
              const dev = devices?.find(d => Number(d.id) === Number(devId));
              if (dev) setSelectedMentionDevice(dev.name);
            }
          }
        } catch (e) {
          if (!cancelled) console.error('방 컨텍스트 동기화 실패:', e);
        }
      };
      syncRoomContext();
    } else if (deviceId) {
      const resumeLastSession = async () => {
        try {
          const rooms = await chatService.getChatRooms();
          if (cancelled) return;
          const deviceRooms = rooms.filter(
            (r: ChatRoomListRow) => r.userDeviceId === deviceId || r.deviceId === deviceId,
          );

          if (deviceRooms.length > 0) {
            setPendingResumeRooms(deviceRooms);
          } else {
            setActiveRoomId(null);
            setMessages([
              { id: 'welcome', senderType: 'AI', text: '안녕하세요! 선택하신 기기에 대해 무엇을 도와드릴까요?', type: 'status' },
            ]);
          }
        } catch (e) {
          if (cancelled) return;
          console.error('이전 세션 확인 실패:', e);
          setActiveRoomId(null);
          setMessages([
            { id: 'welcome', senderType: 'AI', text: '안녕하세요! 선택하신 기기에 대해 무엇을 도와드릴까요?', type: 'status' },
          ]);
        } finally {
          setTimeout(() => {
            stopLoading();
            if (!cancelled) {
              setActiveDeviceId(deviceId);
            }
          }, 800);
        }
      };

      startLoading();
      resumeLastSession();

      const preSelectedDevice = devices?.find(d => Number(d.id) === deviceId);
      if (preSelectedDevice) setSelectedMentionDevice(preSelectedDevice.name);
    }

    return () => { cancelled = true; };
  }, [roomId, deviceId, devices, initialDeviceName]);

  const handleConfirmResume = async (selectedRoomId: number) => {
    setActiveRoomId(selectedRoomId);
    await loadRoomMessages(selectedRoomId);
    setPendingResumeRooms(null);
  };

  const handleStartNew = () => {
    setActiveRoomId(null);
    setMessages([{ id: 'welcome', senderType: 'AI', text: '✨ 새로운 대화 세션을 시작합니다.', type: 'status' }]);
    setPendingResumeRooms(null);
  };

  /** 목록 시트만 닫고 새 대화 입력으로 복귀 */
  const handleBackFromResumeList = () => {
    setPendingResumeRooms(null);
    setActiveRoomId(null);
    setMessages([
      { id: 'welcome', senderType: 'AI', text: '안녕하세요! 선택하신 기기에 대해 무엇을 도와드릴까요?', type: 'status' },
    ]);
  };

  return {
    activeRoomId,
    setActiveRoomId,
    activeDeviceId,
    setActiveDeviceId,
    selectedMentionDevice,
    setSelectedMentionDevice,
    isGuestMode,
    setIsGuestMode,
    pendingResumeRooms,
    loadRoomMessages,
    handleConfirmResume,
    handleStartNew,
    handleBackFromResumeList,
    startLoading,
    stopLoading,
    hasProcessedInitialQuery,
    markRoomOwned,
  };
}
