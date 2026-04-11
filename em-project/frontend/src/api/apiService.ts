import axios from 'axios';

/**
 * 전역 API 서비스 (axios 인스턴스)
 * 모든 요청에 자동으로 JWT 토큰을 주입하고, 401/403 에러를 처리합니다.
 */
export const api = axios.create({
  baseURL: '/api', // Vite 프록시 (/api -> http://localhost:8080) 활용
  timeout: 10000,
  withCredentials: true, // CORS 및 쿠키 공유를 위해 true 설정
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: 모든 요청 전에 실행
api.interceptors.request.use(
  (config) => {
    // 1. localStorage에서 최신 토큰을 읽어옵니다.
    const token = localStorage.getItem('accessToken');
    
    // 2. 토큰이 존재하면 Authorization 헤더에 Bearer 방식으로 주입합니다.
    if (token && token !== 'undefined' && token !== 'null') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: 응답 수신 후 실행
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 만약 403(Forbidden) 또는 401(Unauthorized) 에러가 발생했고, 재시도한 적이 없다면
    if ((error.response?.status === 403 || error.response?.status === 401) && !originalRequest._retry) {
      originalRequest._retry = true;

      // [주의] 현재 백엔드에 리프레시 토큰 로직이 없거나 불확실하므로, 
      // 반복적인 403 에러 방지를 위해 일단 로그아웃 처리 후 로그인 페이지로 유도합니다.
      console.warn('인증 오류 발생 (403/401). 세션을 초기화합니다.');
      
      // accessToken만 삭제 (deleted_device_ids 등 다른 설정은 보존)
      localStorage.removeItem('accessToken');
      window.location.href = '/';
    }

    return Promise.reject(error);
  }
);

export default api;
