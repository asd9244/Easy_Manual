import { api } from '@/src/api/apiService';

/**
 * 인증 및 계정 관련 API 서비스
 */
export const authService = {
  /**
   * 회원 탈퇴 API
   * DELETE /api/users/me
   */
  withdraw: async () => {
    try {
      // 1. 서버에 탈퇴 요청 전송 (Vite 프록시를 통해 /api/users/me로 전달됨)
      const response = await api.delete('/users/me');
      
      // 2. 응답 상태 코드 확인 (200 OK 또는 204 No Content)
      if (response.status === 200 || response.status === 204) {
        return { success: true };
      }
      
      // 예상외의 응답 코드 처리
      return { 
        success: false, 
        message: `탈퇴 처리 중 오류가 발생했습니다. (상태 코드: ${response.status})` 
      };
    } catch (error: any) {
      console.error("회원 탈퇴 API 호출 실패:", error);
      
      // 에러 응답에서 메시지 추출
      const errorMessage = error.response?.data?.message 
        || error.message 
        || '서버와의 통신이 원활하지 않습니다.';
        
      return { success: false, message: errorMessage };
    }
  },

  /**
   * 로그아웃 처리 (로컬 클린업)
   */
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.clear(); // 모든 저장 데이터 삭제
  },

  /**
   * 내 정보 수정 (닉네임 등)
   * PUT /api/users/me
   */
  updateProfile: async (nickname: string) => {
    try {
      const response = await api.put('/users/me', { nickname });
      return response.data;
    } catch (error) {
      console.error("프로필 업데이트 실패:", error);
      throw error;
    }
  }
};
