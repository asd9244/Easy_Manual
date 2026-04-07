import React, { useState } from 'react';
import { ChevronLeft, Mail, Lock, User, CheckCircle } from 'lucide-react';
import { api } from '@/src/api/apiService';

interface SignupProps {
  onBack: () => void;
}

export const Signup: React.FC<SignupProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isDone, setIsDone] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !nickname) return alert('모든 필드를 입력해주세요.');
    try {
      // POST /api/auth/signup 호출
      await api.post('/auth/signup', { email, password, nickname });
      setIsDone(true);
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || '회원가입에 실패했습니다. 서버 상태를 확인해주세요.');
    }
  };

  if (isDone) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
        <div className="w-16 h-16 bg-theme-primary/10 rounded-full flex items-center justify-center text-theme-primary mb-4">
          <CheckCircle size={32} />
        </div>
        <h3 className="font-bold text-slate-800 mb-2">회원가입 완료</h3>
        <p className="text-sm text-slate-500 mb-6">픽시의 회원이 되신 것을 환영합니다!</p>
        <button 
          onClick={onBack}
          className="w-full h-12 bg-wing-gradient rounded-xl text-white font-bold hover:scale-[0.98] transition-transform shadow-md"
        >
          로그인 화면으로
        </button>
      </div>
    );
  }

  return (
    <div className="w-full text-left">
      <button onClick={onBack} className="p-2 -ml-2 mb-4 text-slate-400 hover:text-slate-600">
        <ChevronLeft size={24} />
      </button>

      <h2 className="text-2xl font-bold text-slate-800 mb-2">회원가입</h2>
      <p className="text-slate-500 text-sm mb-8">픽시 서비스 이용을 위해 정보를 입력해주세요.</p>

      <div className="space-y-4">
        <div className="relative">
          <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="email" 
            placeholder="이메일 주소" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-theme-primary/50"
          />
        </div>
        
        <div className="relative">
          <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="password" 
            placeholder="비밀번호" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-theme-primary/50"
          />
        </div>

        <div className="relative">
          <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="닉네임 (예: 픽시마니아)" 
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-theme-primary/50"
          />
        </div>

        <button 
          onClick={handleSignup}
          className="w-full h-14 bg-fixie-steel rounded-2xl text-white font-bold shadow-md hover:bg-slate-700 hover:scale-[0.98] transition-transform mt-4"
        >
          가입하기
        </button>
      </div>
    </div>
  );
};
