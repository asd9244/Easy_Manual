import React, { useEffect } from 'react';
import { FixieLogo } from '@/src/components/common/FixieLogo';

interface OAuthRedirectHandlerProps {
  onLogin: () => void;
}

/**
 * OAuth2 로그인 성공 후 백엔드에서 리다이렉트되는 주소(/oauth2/redirect)를 처리하는 컴포넌트입니다.
 * URL 쿼리 파라미터에서 token을 추출하여 localStorage에 저장합니다.
 */
export const OAuthRedirectHandler: React.FC<OAuthRedirectHandlerProps> = ({ onLogin }) => {
  useEffect(() => {
    // 1. URL에서 token 쿼리 스트링을 파싱합니다.
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (import.meta.env.DEV) {
      console.log('OAuth 리다이렉트 감지. 토큰 추출 시도...');
    }

    if (token) {
      // 2. 토큰을 localStorage에 저장합니다.
      localStorage.setItem('accessToken', token);
      if (import.meta.env.DEV) {
        console.log('토큰 저장 완료. 홈으로 이동합니다.');
      }

      // 3. 부모 컴포넌트(App.tsx)의 로그인 성공 상태를 업데이트합니다.
      // (즉시 이동을 위해 인위적인 지연 없이 바로 호출합니다.)
      onLogin();
    } else {
      if (import.meta.env.DEV) {
        console.info('OAuth 리다이렉트 URL 없음 (일반 접속). 로그인 화면 대기 중.');
      }
      // 토큰이 없으면 다시 인증 화면으로 보냅니다.
      // window.location.href = '/'; 
    }
  }, [onLogin]);

  return (
    <div className="min-h-screen bg-fixie-mist flex flex-col items-center justify-center gap-6">
      <div className="animate-bounce">
        <FixieLogo size={80} />
      </div>
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-xl font-bold text-slate-700">로그인 중입니다...</h2>
        <p className="text-sm text-slate-400 font-medium">잠시만 기다려주세요</p>
      </div>

      {/* 장식용 애니메이션 바 */}
      <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden relative">
        <div className="absolute inset-0 bg-wing-gradient w-1/2 rounded-full animate-progress-indefinite"></div>
      </div>
    </div>
  );
};
