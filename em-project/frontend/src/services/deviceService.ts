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
        return response.data.map((d: any, idx: number) => ({
          // [수정] id가 없거나 빈 값("")일 경우에도 절대 중복되지 않는 고유값 생성
          id: (d.id !== undefined && d.id !== null && String(d.id).trim() !== "") 
            ? String(d.id) 
            : `device-ref-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
          name: d.alias || d.representativeModelName || '이름 없는 기기',
          model: d.representativeModelName || '',
          alias: d.alias,
          productType: d.productType || '',
          image: d.image || 'https://picsum.photos/seed/appliance/400/400',
          icon: deviceService.getIconByModel(d.representativeModelName || '')
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
   * 기기 삭제 (Soft Delete)
   * DELETE /api/devices/{deviceId}
   */
  deleteDevice: async (deviceId: string) => {
    try {
      // 백엔드는 물리적 삭제가 아닌 'DELETED' 상태값 변경으로 처리합니다.
      await api.delete(`/devices/${deviceId}`);
    } catch (error) {
      console.error("기기 삭제 API 오류:", error);
      throw error;
    }
  },

  /**
   * 기기 별명 수정
   * PATCH /api/devices/{deviceId}/alias
   */
  updateDeviceAlias: async (deviceId: string, alias: string) => {
    try {
      await api.patch(`/devices/${deviceId}/alias`, { alias });
    } catch (error) {
      console.error("기기 별명 수정 API 오류:", error);
      throw error;
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
