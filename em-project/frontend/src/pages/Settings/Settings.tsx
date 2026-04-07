import React from 'react';
import { 
  User, 
  Bell, 
  Globe, 
  Palette, 
  Shield, 
  HelpCircle, 
  LogOut, 
  ChevronRight 
} from 'lucide-react';
import { Screen, ThemeType } from '@/src/types/index';
import { Profile } from '../Profile/Profile';
import { ThemeSelect } from './ThemeSelect';

interface SettingsProps {
  setScreen: (screen: Screen) => void;
  currentTheme: ThemeType;
  setCurrentTheme: (theme: ThemeType) => void;
}

// 💡 반복되는 리스트 아이템을 깔끔하게 찍어내는 도구(컴포넌트)
const SettingsItem = ({ icon: Icon, title, subtitle, onClick }: any) => (
  <button 
    onClick={onClick}
    className="w-full p-4 bg-white flex items-center justify-between border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
  >
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-fixie-mist flex items-center justify-center text-slate-400">
        <Icon size={18} />
      </div>
      <div className="text-left">
        <h4 className="text-sm font-bold text-slate-700">{title}</h4>
        <p className="text-[11px] font-medium text-slate-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
    <ChevronRight size={18} className="text-slate-300" />
  </button>
);

export const Settings: React.FC<SettingsProps> = ({ setScreen }) => {
  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20 w-full text-left">
      <h1 className="text-2xl font-bold px-2 text-slate-800">설정</h1>

      {/* 1. 상단 프로필 카드 */}
      <div 
        onClick={() => setScreen('profile')} 
        className="flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        >
          
        <div className="w-14 h-14 rounded-full bg-wing-gradient flex items-center justify-center text-white text-xl font-bold shadow-inner">
          U
        </div>
        <div className="flex-1 text-left">
          <h3 className="font-bold text-slate-800">User</h3>
          <p className="text-xs text-slate-400 mt-0.5">사용자@이메일.com</p>
        </div>
        <ChevronRight size={18} className="text-slate-300" />
      </div>

      {/* 2. 계정 섹션 */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 px-4">계정</h3>
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
          <SettingsItem icon={User} title="프로필" subtitle="이름, 이메일, 사진" onClick={() => setScreen('profile')} />
          <SettingsItem icon={Bell} title="알림" subtitle="푸시 및 이메일 알림" onClick={() => setScreen('settings-notifications')} />
        </div>
      </div>

      {/* 3. 환경 설정 섹션 */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 px-4">환경 설정</h3>
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
          <SettingsItem icon={Palette} title="화면 설정" subtitle="테마 및 디스플레이" onClick={() => setScreen('theme-select')} />
          <SettingsItem icon={Shield} title="개인정보" subtitle="데이터 및 권한" onClick={() => setScreen('settings-privacy')} />
        </div>
      </div>

      {/* 4. 지원 섹션 */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 px-4">지원</h3>
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
          <SettingsItem icon={HelpCircle} title="도움말" subtitle="자주 묻는 질문 및 가이드" onClick={() => setScreen('settings-help')} />
        </div>
      </div>

      {/* 5. 로그아웃 버튼 */}
      <div className="pt-6">
        <button 
          onClick={() => setScreen('auth')}
          className="flex items-center justify-center gap-2 text-[#FF6B6B] font-bold w-full p-4 hover:bg-red-50 rounded-2xl transition-colors"
        >
          <LogOut size={18} /> 로그아웃
        </button>
      </div>
    </div>
  );
};