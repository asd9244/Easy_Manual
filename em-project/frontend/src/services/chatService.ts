import { api } from '@/src/api/apiService';
import { Message } from '@/src/types/index';

/** 채팅방 목록 API 한 행 (camel/snake 혼용 가능) */
export interface ChatRoomListRow {
  id: number;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
  userDeviceId?: number;
  deviceId?: number;
  deviceName?: string;
  device_name?: string;
}

interface ChatMessageRaw {
  id: number | string;
  senderType: 'USER' | 'AI';
  message: string;
  createdAt?: string;
  referencedPage?: number | string;
  manualImageUrls?: string[];
}

/** AI 질문 응답(JSON 필드명 변형 허용) */
export interface AskQuestionResponse {
  id?: number | string;
  message?: string;
  ai_answer?: string;
  text?: string;
  referencedPage?: number | string;
  referenced_page?: number | string;
  manualImageUrls?: string[];
  manual_image_urls?: string[];
}

/**
 * 채팅 및 AI 상담 API 서비스
 * [수정] 모든 요청은 apiService의 api 인스턴스를 통해 수행 (Bearer 토큰 자동 주입)
 */
export const chatService = {
  /**
   * 내 채팅방 목록 조회
   */
  getChatRooms: async (): Promise<ChatRoomListRow[]> => {
    try {
      const response = await api.get('/chat/rooms');
      const rows = response.data;
      return Array.isArray(rows) ? (rows as ChatRoomListRow[]) : [];
    } catch (error) {
      console.error("채팅방 목록 조회 실패:", error);
      throw error;
    }
  },

  /**
   * 채팅방 생성
   */
  createChatRoom: async (userDeviceId: string | number, questionCategory?: string | null) => {
    try {
      const response = await api.post('/chat/rooms', {
        userDeviceId: Number(userDeviceId),
        ...(questionCategory ? { questionCategory } : {}),
      });
      const data = response.data;
      return {
        roomId: data.roomId || data.room_id
      };
    } catch (error) {
      console.error("채팅방 생성 실패:", error);
      throw error;
    }
  },

  /**
   * 공유 화면용: 비로그인으로 방 제목·기기명 조회
   */
  getShareRoomSummary: async (roomId: number) => {
    const response = await api.get(`/chat/rooms/${roomId}/share-summary`);
    return response.data as {
      title?: string;
      deviceName?: string;
    };
  },

  /**
   * 본인 채팅방 대화 텍스트 AI 요약 (인증 필요)
   */
  summarizeConversation: async (roomId: number) => {
    const response = await api.post(`/chat/rooms/${roomId}/summarize`);
    return response.data as { summary: string };
  },

  /**
   * 특정 AI 답변 한 턴만 요약 (직전 USER + 해당 AI, 인증 필요)
   */
  summarizeTurn: async (roomId: number, aiMessageId: string | number) => {
    const response = await api.post(
      `/chat/rooms/${roomId}/messages/${aiMessageId}/summarize`,
    );
    return response.data as { summary: string };
  },

  /**
   * 대화 내역 조회
   */
  getMessages: async (roomId: number): Promise<Message[]> => {
    try {
      const response = await api.get(`/chat/rooms/${roomId}/messages`);
      if (response.data && Array.isArray(response.data)) {
        return response.data.map((m: ChatMessageRaw) => ({
          id: String(m.id),
          senderType: m.senderType, 
          text: m.message,
          timestamp: m.createdAt,
          type: m.senderType === 'AI' ? 'guide' : undefined,
          referencedPage: m.referencedPage,
          manualImageUrls: m.manualImageUrls || []
        }));
      }
      return [];
    } catch (error) {
      console.error("대화 내역 조회 실패:", error);
      throw error;
    }
  },

  /**
   * AI에게 질문하기
   */
  askQuestion: async (roomId: number, message: string): Promise<AskQuestionResponse> => {
    try {
      const response = await api.post(`/chat/rooms/${roomId}/ask`, { message });
      return response.data as AskQuestionResponse;
    } catch (error) {
      console.error("AI 질문 실패:", error);
      throw error;
    }
  },

  /**
   * 채팅방 삭제
   */
  deleteChatRoom: async (roomId: number) => {
    try {
      const response = await api.delete(`/chat/rooms/${roomId}`);
      return response.data;
    } catch (error) {
      console.error("채팅방 삭제 실패:", error);
      throw error;
    }
  },

  /**
   * [추가] 모든 채팅방 일괄 삭제
   */
  deleteAllChatRooms: async () => {
    try {
      const response = await api.delete('/chat/rooms');
      return response.data;
    } catch (error) {
      console.error("전체 채팅방 삭제 실패:", error);
      throw error;
    }
  },

  /**
   * [신규] 채팅방 제목 수정
   */
  updateChatRoomTitle: async (roomId: number, title: string) => {
    try {
      const response = await api.patch(`/chat/rooms/${roomId}`, { title });
      return response.data;
    } catch (error) {
      console.error("채팅방 제목 수정 실패:", error);
      throw error;
    }
  },
};
