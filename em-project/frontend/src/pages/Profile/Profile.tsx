import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/src/api/apiService';
import { authService } from '@/src/services/authService';
import { useToastStore } from '@/src/store/useToastStore';
import { ArrowLeft, Camera } from 'lucide-react';
import { Screen } from '@/src/types/index';

interface ProfileProps {
  setScreen: (screen: Screen) => void;
}

export const Profile: React.FC<ProfileProps> = ({ setScreen }) => {
  const [nickname, setNickname] = useState('User');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const { showToast } = useToastStore();

  // 최초 로드 시 서버로부터 유저 정보 호출
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get('/users/me');
        if (response.data && response.data.nickname) {
          setNickname(response.data.nickname);
        }
      } catch (error) {
        console.error("유저 정보 로드 실패:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };
    fetchUser();
    
    // 로컬 스토리지에서 프로필 이미지 불러오기 (프론트엔드 임시 처리)
    const storedImage = localStorage.getItem('profileImage');
    if (storedImage) {
      setProfileImage(storedImage);
    }
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfileImage(base64String);
        localStorage.setItem('profileImage', base64String);
        showToast('성공적으로 프로필 사진이 변경되었습니다! 🎉', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!nickname.trim()) return showToast('닉네임을 입력해주세요.', 'error');
    
    setIsSaving(true);
    try {
      const response = await api.put('/users/me', { nickname });
      // 서버에서 반환된 최신 데이터로 상태 갱신
      if (response.data && response.data.nickname) {
        setNickname(response.data.nickname);
      }
      showToast('프로필이 성공적으로 업데이트 되었습니다! 🎉', 'success');
      
      // 세션이나 다른 컴포넌트 동기화를 위해 페이지 리프레시 혹은 상태 트리거 (권장)
      // window.location.reload(); // 가장 확실한 동기화 방법 중 하나
    } catch (error: any) {
      console.error("프로필 업데이트 실패:", error);
      const msg = error.response?.data?.message || '업데이트에 실패했습니다.';
      showToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleWithdraw = async () => {
    if (!confirm("정말로 탈퇴하시겠어요? 😢 모든 데이터가 사라집니다. (즉시 로그아웃 및 초기화)")) return;

    setIsWithdrawing(true);
    try {
      // 1. 서비스 레이어를 통한 탈퇴 요청 (DELETE /api/users/me)
      const result = await authService.withdraw();

      // 2. 결과 확인 및 후속 조치 (성공 시에만 클린업 진행)
      if (result.success) {
        console.log("회원 탈퇴 성공 (서버)");
        
        // 3. 성공 후 로컬 데이터 정리
        authService.logout();
        
        // 4. 성공 알림 (브라우저 정책상 이동 전 짧게 보여주거나 생략될 수 있음)
        alert('회원 탈퇴가 안전하게 처리되었습니다. 그동안 이용해 주셔서 감사합니다.');
        
        // 5. 페이지 강제 이동 및 초기화
        window.location.replace('/');
      } else {
        // 실패 시 Toast 알림 (사용자 요청 사항)
        showToast(result.message || '탈퇴 도중 오류가 발생했습니다.', 'error');
      }
    } catch (error: any) {
      console.error("회원 탈퇴 처리 중 예외 발생:", error);
      showToast('처리 도중 예상치 못한 오류가 발생했습니다.', 'error');
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 text-left pb-20 w-full px-4 md:px-0">
      {/* 1. 헤더: 뒤로가기 버튼과 제목 */}
      <header className="flex items-center gap-4 px-1">
        <button onClick={() => setScreen('settings')} className="p-2 bg-white rounded-xl shadow-sm border border-slate-50 hover:bg-slate-50 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-800">프로필 수정</h1>
      </header>

      {/* 2. 프로필 이미지 수정 영역 */}
      <div className="flex flex-col items-center py-6">
        <div className="relative">
          {profileImage ? (
            <img src={profileImage} alt="Profile" className="w-24 h-24 rounded-full object-cover shadow-xl border-4 border-white" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-wing-gradient flex items-center justify-center text-white text-3xl font-bold shadow-xl border-4 border-white uppercase">
              {nickname.charAt(0)}
            </div>
          )}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 p-2.5 bg-white rounded-full shadow-lg border border-slate-100 text-theme-primary hover:scale-110 transition-transform"
          >
            <Camera size={16} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            accept="image/*" 
            className="hidden" 
          />
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
            className="w-full h-14 bg-white/80 backdrop-blur-md border border-slate-100 rounded-3xl px-6 mt-2 focus:outline-none focus:ring-2 focus:ring-theme-primary/30 font-bold text-slate-700 shadow-sm"
          />
        </div>
      </div>

      <div className="pt-4">
        <button 
          onClick={handleSave}
          disabled={isSaving || isWithdrawing}
          className="w-full h-14 bg-wing-gradient text-white font-bold rounded-3xl shadow-lg shadow-theme-primary/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {isSaving ? "처리 중..." : "변경사항 저장"}
        </button>
      </div>


      {/* 4. 회원 탈퇴 버튼 */}
      <div className="pt-10 border-t border-slate-200/50">
        <button 
          onClick={handleWithdraw}
          disabled={isSaving || isWithdrawing}
          className="w-full p-4 text-red-400 font-bold text-sm hover:bg-red-50 rounded-3xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isWithdrawing ? "탈퇴 처리 중..." : "회원 탈퇴하기"}
        </button>
      </div>
    </div>
  );
};