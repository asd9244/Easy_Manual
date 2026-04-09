import React, { useState } from 'react';
import { FixieLogo } from '@/src/components/common/FixieLogo';  
import { api } from '@/src/api/apiService';
import { FindPassword } from './FindPassword';
import { Signup } from './Signup';

export const AuthScreen = ({ onLogin }: any) => {
  const [authMode, setAuthMode] = useState<'login' | 'find-password' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailLogin = async () => {
    if (!email || !password) return alert('이메일과 비밀번호를 입력해주세요.');
    try {
      const response = await api.post('/auth/login', { email, password });
      // 토큰 저장
      const token = response.data.accessToken || response.data.token;
      if (token) localStorage.setItem('accessToken', token);
      onLogin(); // 성공 시 페이지 전환
    } catch (e: any) {
      console.error("로그인 에러:", e);
      alert(e.response?.data?.message || '로그인에 실패했습니다. 이메일이나 비밀번호를 확인해주세요.');
    }
  };

  return (
    <div className="min-h-screen bg-fixie-mist flex flex-col p-8 justify-center items-center text-center">
      <div className="max-w-sm w-full">
      
      {authMode === 'login' ? (
        <>
          {/* 1. 상단 로고 및 환영 인사 */}
          <div className="flex justify-center mb-10">
            <FixieLogo size={80} />
          </div>
          <h2 className="text-2xl font-bold text-fixie-steel">픽시에 오신 것을 환영합니다</h2>
          <p className="text-slate-500 mt-2 text-sm mb-10">가장 스마트한 기기 관리 파트너</p>

          <div className="space-y-3 mb-6 relative">
            <input 
              type="email" 
              placeholder="이메일" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-theme-primary/50"
            />
            <input 
              type="password" 
              placeholder="비밀번호" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-theme-primary/50"
            />
            <button 
              onClick={handleEmailLogin}
              className="w-full h-14 bg-fixie-steel rounded-2xl text-white font-bold shadow-md hover:bg-slate-700 transition-colors"
            >
              이메일로 시작하기
            </button>
            <div className="flex justify-between items-center mt-2">
              <button 
                onClick={() => setAuthMode('find-password')}
                className="text-xs text-slate-400 hover:text-theme-primary font-bold"
              >
                비밀번호를 잊으셨나요?
              </button>
              <button 
                onClick={() => setAuthMode('signup')}
                className="text-xs text-slate-400 hover:text-theme-primary font-bold"
              >
                회원가입
              </button>
            </div>
          </div>

          <div className="relative flex items-center py-4">
            <div className="flex-1 border-t border-slate-200"></div>
            <span className="shrink-0 text-xs text-slate-400 px-4 font-bold">또는 간편 로그인</span>
            <div className="flex-1 border-t border-slate-200"></div>
          </div>

          {/* 2. 로그인 버튼 영역 */}
          <div className="mt-4 space-y-4 w-full">
            {/* 구글 로그인 버튼 (SVG 아이콘 삽입) */}
            <button 
              onClick={() => window.location.href = '/oauth2/authorization/google'} 
              className="w-full h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors relative"
            >
              <svg className="w-5 h-5 absolute left-6" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              구글로 시작하기
            </button>

            {/* 카카오 로그인 버튼 (SVG 아이콘 삽입) */}
            <button 
              onClick={() => window.location.href = '/oauth2/authorization/kakao'} 
              className="w-full h-14 bg-[#FEE500] rounded-2xl flex items-center justify-center font-bold text-[#191919] shadow-sm hover:bg-[#FDD800] transition-colors relative"
            >
              <svg className="w-5 h-5 absolute left-6" viewBox="0 0 24 24" fill="#191919">
                <path d="M12 3c-5.52 0-10 3.48-10 7.76 0 2.74 1.8 5.16 4.54 6.48-.22.8-.78 2.84-.8 2.96-.06.2.08.28.2.22.18-.08 2.38-1.54 3.32-2.18.88.16 1.8.26 2.74.26 5.52 0 10-3.48 10-7.76C22 6.48 17.52 3 12 3z"/>
              </svg>
              카카오로 시작하기
            </button>
          </div>
        </>
      ) : authMode === 'find-password' ? (
        <FindPassword onBack={() => setAuthMode('login')} />
      ) : (
        <Signup onBack={() => setAuthMode('login')} />
      )}
      </div>
    </div>
  );
};