import React from 'react';
import { ArrowLeft, Camera, LogOut } from 'lucide-react';
import { Screen } from '@/src/types/index';

interface ProfileProps {
  setScreen: (screen: Screen) => void;
}

export const Profile: React.FC<ProfileProps> = ({ setScreen }) => {
  return (
    <div className="max-w-2xl mx-auto space-y-8 text-left">
      {/* 1. 헤더: 뒤로가기 버튼과 제목 */}
      <header className="flex items-center gap-4">
        <button onClick={() => setScreen('settings')} className="p-2 bg-white rounded-xl shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">프로필 수정</h1>
      </header>

      {/* 2. 프로필 이미지 수정 영역 */}
      <div className="flex flex-col items-center py-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-wing-gradient flex items-center justify-center text-white text-3xl font-bold shadow-xl">
            U
          </div>
          <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-slate-100 text-theme-primary">
            <Camera size={16} />
          </button>
        </div>
        <p className="mt-4 text-xs text-slate-400 font-bold">프로필 사진 변경</p>
      </div>

      {/* 3. 닉네임 수정 폼 (직접 타이핑해볼 곳!) */}
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-400 ml-1">닉네임</label>
          <input 
            type="text" 
            defaultValue="사용자님" 
            className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-6 mt-2 focus:outline-none focus:ring-2 focus:ring-theme-primary/50 font-bold"
          />
        </div>
      </div>


      {/* 4. 회원 탈퇴 버튼 (빨간색으로 경고!) */}
      <div className="pt-10">
        <button 
          onClick={() => { if(confirm("정말로 탈퇴하시겠어요? 😢 모든 데이터가 사라집니다.")) setScreen('auth'); }}
          className="w-full p-4 text-red-400 font-bold text-sm hover:bg-red-50 rounded-2xl transition-colors flex items-center justify-center gap-2"
        >
          회원 탈퇴하기
        </button>
      </div>
    </div>
  );
};