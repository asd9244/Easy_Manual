import React, { useState } from 'react';
import { api } from '@/src/api/apiService';
import { ArrowLeft, Camera } from 'lucide-react';
import { Screen } from '@/src/types/index';

interface ProfileProps {
  setScreen: (screen: Screen) => void;
}

export const Profile: React.FC<ProfileProps> = ({ setScreen }) => {
  const [nickname, setNickname] = useState('사용자님');
  const [isSaving, setIsSaving] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 백엔드 명세서에 맞게 /users/me로 변경
      await api.put('/users/me', { nickname });
      alert('프로필이 성공적으로 업데이트 되었습니다!');
    } catch (error: any) {
      console.error("프로필 업데이트 실패:", error);
      const msg = error.response?.data?.message || '업데이트에 실패했습니다.';
      alert(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleWithdraw = async () => {
    if (!confirm("정말로 탈퇴하시겠어요? 😢 모든 데이터가 사라집니다. (즉시 로그아웃 및 초기화)")) return;

    setIsWithdrawing(true);
    try {
      // 1. 서버에 탈퇴 요청 (DELETE /api/users/me) - Vite 프록시 터널 이용
      const response = await api.delete('/users/me');

      // 2. 서버 응답 코드 엄격하게 확인 (200 OK 또는 204 No Content)
      if (response.status === 200 || response.status === 204) {
        console.log("회원 탈퇴 성공 (서버)");
        
        // 3. 성공 시 localStorage 싹 밀어버리기
        localStorage.clear();
        
        alert('회원 탈퇴가 안전하게 처리되었습니다. 그동안 이용해 주셔서 감사합니다.');
        
        // 4. 강제 새로고침(Full Reload)으로 모든 인메모리 상태 파기 및 초기화
        window.location.replace('/');
      } else {
        throw new Error(`탈퇴 실패 (상태 코드: ${response.status})`);
      }
    } catch (error: any) {
      console.error("회원 탈퇴 실패:", error);
      const msg = error.response?.data?.message || '회원 탈퇴 도중 오류가 발생했습니다. 다시 시도해 주세요.';
      alert(msg);
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 text-left pb-20 w-full">
      {/* 1. 헤더: 뒤로가기 버튼과 제목 */}
      <header className="flex items-center gap-4 px-1">
        <button onClick={() => setScreen('settings')} className="p-2 bg-white rounded-xl shadow-sm border border-slate-50 hover:bg-slate-50 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-slate-800">프로필 수정</h1>
      </header>

      {/* 2. 프로필 이미지 수정 영역 */}
      <div className="flex flex-col items-center py-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-wing-gradient flex items-center justify-center text-white text-3xl font-bold shadow-xl border-4 border-white">
            U
          </div>
          <button className="absolute bottom-0 right-0 p-2.5 bg-white rounded-full shadow-lg border border-slate-100 text-theme-primary hover:scale-110 transition-transform">
            <Camera size={16} />
          </button>
        </div>
        <p className="mt-4 text-xs text-slate-400 font-black uppercase tracking-widest">Change Avatar</p>
      </div>

      {/* 3. 닉네임 수정 폼 */}
      <div className="space-y-4">
        <div>
          <label className="text-xs font-black text-slate-400 ml-1 uppercase">Nickname</label>
          <input 
            type="text" 
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-6 mt-2 focus:outline-none focus:ring-2 focus:ring-theme-primary/30 font-bold text-slate-700 shadow-sm"
          />
        </div>
      </div>

      <div className="pt-4">
        <button 
          onClick={handleSave}
          disabled={isSaving || isWithdrawing}
          className="w-full h-14 bg-wing-gradient text-white font-bold rounded-2xl shadow-lg shadow-theme-primary/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {isSaving ? "처리 중..." : "변경사항 저장"}
        </button>
      </div>


      {/* 4. 회원 탈퇴 버튼 */}
      <div className="pt-10 border-t border-slate-200/50">
        <button 
          onClick={handleWithdraw}
          disabled={isSaving || isWithdrawing}
          className="w-full p-4 text-red-400 font-bold text-sm hover:bg-red-50 rounded-2xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isWithdrawing ? "탈퇴 처리 중..." : "회원 탈퇴하기"}
        </button>
      </div>
    </div>
  );
};