import { api } from '@/src/api/apiService';
import { Message } from '@/src/types/index';

/**
 * 채팅 및 AI 상담 API 서비스
 * [수정] 모든 요청은 apiService의 api 인스턴스를 통해 수행 (Bearer 토큰 자동 주입)
 */
export const chatService = {
  /**
   * 내 채팅방 목록 조회
   */
  getChatRooms: async () => {
    try {
      const response = await api.get('/chat/rooms');
      return response.data;
    } catch (error) {
      console.error("채팅방 목록 조회 실패:", error);
      throw error;
    }
  },

  /**
   * 채팅방 생성
   */
  createChatRoom: async (userDeviceId: string | number) => {
    try {
      const response = await api.post('/chat/rooms', { 
        userDeviceId: Number(userDeviceId)
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
   * 대화 내역 조회
   */
  getMessages: async (roomId: number): Promise<Message[]> => {
    try {
      const response = await api.get(`/chat/rooms/${roomId}/messages`);
      if (response.data && Array.isArray(response.data)) {
        return response.data.map((m: any) => ({
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
  askQuestion: async (roomId: number, message: string, mediaUrl?: string) => {
    try {
      const response = await api.post(`/chat/rooms/${roomId}/ask`, { 
        message,
        mediaUrl: mediaUrl || null
      });
      return response.data; // ChatMessageResponse
    } catch (error) {
      console.error("AI 질문 실패:", error);
      throw error;
    }
  }
};
