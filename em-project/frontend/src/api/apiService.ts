import axios from 'axios';

// 기본 인스턴스 생성
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api', // Vite 프록시 활용을 위해 상대 경로 사용
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// [추가 API 1] 토큰 재발급(Refresh Token) API 주소 (가정)
const REFRESH_TOKEN_URL = '/auth/refresh';

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    // localStorage에서 토큰을 가져와 헤더에 추가
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // 백엔드의 통상적인 JWT 포맷 설정
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 만료된 토큰으로 인한 401 (Unauthorized) 에러 처리
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('Refresh token not found');
        }

        // 백엔드에 토큰 재발급 요청 (새로운 토큰을 받아옴)
        const response = await axios.post(REFRESH_TOKEN_URL, {
          refreshToken,
        });

        const newAccessToken = response.data.accessToken; // 응답 구조에 맞게 변경
        localStorage.setItem('accessToken', newAccessToken);

        // 변경된 토큰으로 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // [추가 API 2] 보안을 위한 강제 로그아웃
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        alert('세션이 만료되었습니다. 다시 로그인해 주세요.');
        // App.tsx 상태 변경을 트리거하거나 리다이렉트
        window.location.href = '/'; 
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
