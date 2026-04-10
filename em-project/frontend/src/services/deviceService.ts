import { api } from '@/src/api/apiService';
import { Device } from '@/src/types/index';
import { WashingMachine, Wind, Tv, ShieldCheck } from 'lucide-react';

/**
 * 기기 관리 API 서비스
 */
export const deviceService = {
  /**
   * 내 기기 목록 조회
   * GET /api/devices
   */
  getMyDevices: async (): Promise<Device[]> => {
    try {
      const response = await api.get('/devices');
      if (response.data && Array.isArray(response.data)) {
        return response.data.map((d: any) => ({
          id: String(d.id),
          name: d.alias || d.model,
          model: d.model,
          alias: d.alias,
          image: d.image || 'https://picsum.photos/seed/appliance/400/400',
          // 모델명에 따른 아이콘 매핑 (임시)
          icon: deviceService.getIconByModel(d.model)
        }));
      }
      return [];
    } catch (error) {
      console.error("기기 목록 조회 실패:", error);
      throw error;
    }
  },

  /**
   * 기기 등록
   * POST /api/devices
   */
  registerDevice: async (model: string, alias?: string) => {
    try {
      // 프론트엔드에서는 model 변수를 쓰지만, 백엔드 DTO(DeviceRegisterRequest)는 modelName을 기대하므로 키값을 맞춰줍니다.
      const response = await api.post('/devices', { modelName: model, alias: alias || model });
      return response.data;
    } catch (error: any) {
      console.error("기기 등록 실패:", error);
      // 백엔드에서 내려준 실제 에러 메시지를 꺼내서 던집니다.
      const errorMessage = error.response?.data?.message || error.response?.data || "기기 등록에 실패했습니다.";
      throw new Error(typeof errorMessage === 'string' ? errorMessage : "알 수 없는 오류가 발생했습니다.");
    }
  },

  /**
   * 모델명 검색
   * GET /api/devices/search?query=...
   */
  searchModels: async (query: string) => {
    try {
      const response = await api.get('/devices/search', { params: { query } });
      return response.data;
    } catch (error) {
      console.error("모델 검색 실패:", error);
      throw error;
    }
  },

  /**
   * 모델명에 따른 아이콘 매핑 유틸리티
   */
  getIconByModel: (model: string) => {
    const m = model.toLowerCase();
    if (m.includes('세탁기') || m.includes('washer')) return WashingMachine;
    if (m.includes('에어컨') || m.includes('air')) return Wind;
    if (m.includes('tv') || m.includes('티비')) return Tv;
    return ShieldCheck; // 기본 아이콘
  }
};
