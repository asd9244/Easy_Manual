import React, { useState } from 'react';
import { ChevronLeft, Mail, Lock, CheckCircle } from 'lucide-react';
import { api } from '@/src/api/apiService';

interface FindPasswordProps {
  onBack: () => void;
}

export const FindPassword: React.FC<FindPasswordProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: 이메일 입력, 2: 인증번호 확인, 3: 완료

  const handleSendCode = async () => {
    if (!email) return alert('이메일을 입력해주세요.');
    try {
      // (가정) 비밀번호 찾기 이메일 발송 요청
      await api.post('/auth/find-password', { email });
      setStep(2);
    } catch (e) {
      console.error(e);
      alert('이메일 전송에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleVerifyCode = async () => {
    if (!authCode) return alert('인증번호를 입력해주세요.');
    try {
      // 인증번호 확인 API가 있다고 가정, 임시로 무조건 성공 처리
      // await api.post('/auth/verify-code', { email, code: authCode });
      setStep(3);
    } catch (e) {
      alert('잘못된 인증번호입니다.');
    }
  };

  return (
    <div className="w-full text-left">
      <button onClick={onBack} className="p-2 -ml-2 mb-4 text-slate-400 hover:text-slate-600">
        <ChevronLeft size={24} />
      </button>

      <h2 className="text-2xl font-bold text-slate-800 mb-2">비밀번호 찾기</h2>
      <p className="text-slate-500 text-sm mb-8">
        {step === 1 ? '가입하신 이메일 주소를 입력해주세요.' : step === 2 ? '이메일로 발송된 인증번호를 입력해주세요.' : '임시 비밀번호가 발송되었습니다.'}
      </p>

      {step === 1 && (
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
          <button 
            onClick={handleSendCode}
            className="w-full h-14 bg-wing-gradient rounded-2xl text-white font-bold shadow-md hover:scale-[0.98] transition-transform"
          >
            인증번호 발송
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="relative">
            <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="인증번호 6자리" 
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-theme-primary/50"
            />
          </div>
          <button 
            onClick={handleVerifyCode}
            className="w-full h-14 bg-wing-gradient rounded-2xl text-white font-bold shadow-md hover:scale-[0.98] transition-transform"
          >
            인증 확인
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-4">
            <CheckCircle size={32} />
          </div>
          <h3 className="font-bold text-slate-800 mb-2">인증 완료</h3>
          <p className="text-sm text-slate-500 mb-6">등록된 이메일로<br/>임시 비밀번호를 발송해드렸습니다.</p>
          <button 
            onClick={onBack}
            className="w-full h-12 bg-slate-100 rounded-xl text-slate-600 font-bold hover:bg-slate-200 transition-colors"
          >
            로그인 화면으로
          </button>
        </div>
      )}
    </div>
  );
};
