import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  Home as HomeIcon, 
  MessageCircle, 
  History as HistoryIcon, 
  Settings as SettingsIcon, 
  Plus, 
  Camera, 
  LogOut,
  X,
  Sparkles,
  Image as ImageIcon,
  Mic
} from 'lucide-react';

// 1. 우리가 쪼갠 파일들 임포트
import { Screen, Device, Message, ThemeType } from '@/src/types';
import { THEMES, MOCK_DEVICES, TUTORIAL_STEPS } from '@/src/constants/data';
import { FixieLogo } from '@/src/components/common/FixieLogo';

// 2. 페이지 컴포넌트 임포트
import { Home } from '@/src/pages/Home/Home';
import { Garage } from '@/src/pages/Garage/Garage';
import { Chat } from '@/src/pages/Chat/Chat';
import { History } from '@/src/pages/History/History';
import { Settings } from '@/src/pages/Settings/Settings';

import { ThemeSelect } from '@/src/pages/Settings/ThemeSelect';
import { SplashScreen } from '@/src/pages/SplashScreen/SplashScreen';
import { TutorialScreen } from '@/src/pages/TutorialScreen/tutorialScreen';
import { AuthScreen } from '@/src/pages/Auth/Auth';
import { ScanScreen } from '@/src/pages/Scan/Scan'; 
import { Profile } from './pages/Profile/Profile';



export default function App() {
  // --- 전역 상태 관리 ---
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const [screen, setScreen] = useState<Screen>('splash');
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('magician');
  const [devices, setDevices] = useState<Device[]>(MOCK_DEVICES);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'fixie', text: '안녕하세요! 저는 픽시입니다. 무엇을 도와드릴까요?' }
  ]);
  const [showGarageOptions, setShowGarageOptions] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'completed' | 'visit'>('all');
  const [tutorialStep, setTutorialStep] = useState(0);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [sliderConstraints, setSliderConstraints] = useState({ left: 0, right: 0 });
  // 채팅 입력창이 읽기 전용인지 여부 (분석 중일 때는 입력 금지)
  const [isChatReadOnly, setIsChatReadOnly] = useState(false);

  // --- 테마 적용 로직 ---
  useEffect(() => {
    const theme = THEMES.find(t => t.id === currentTheme) || THEMES[0];
    document.documentElement.style.setProperty('--theme-primary', theme.primary);
    document.documentElement.style.setProperty('--theme-secondary', theme.secondary);
  }, [currentTheme]);

  // --- 슬라이더 제약 조건 계산 로직 ---
 useEffect(() => {
    if (!sliderRef.current) return;
    const updateConstraints = () => {
      if (sliderRef.current) {
        const scrollWidth = sliderRef.current.scrollWidth;
        const clientWidth = sliderRef.current.clientWidth;
        setSliderConstraints({ left: -(scrollWidth - clientWidth), right: 0 });
      }
    };
    updateConstraints();
    const observer = new ResizeObserver(updateConstraints);
    observer.observe(sliderRef.current);
    return () => observer.disconnect();
  }, [screen]); // 화면이 바뀔 때마다 다시 계산
  



  
//  모바일 하단 메뉴용
const NavItem = ({ id, icon: Icon, label }: any) => {
  const isActive = screen === id;
  return (
    <button 
      onClick={() => { setScreen(id); setIsChatReadOnly(false); }}
      className={`relative flex flex-col items-center gap-1 transition-colors duration-200 ${
        isActive ? 'text-theme-primary' : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      <Icon size={24} />
      <span className="text-[10px] font-bold">{label}</span>
      
      {/* 모바일 마커(점) 애니메이션 */}
      {isActive && (
        <motion.div
          layoutId="mobile-active-dot"
          className="absolute -bottom-3 w-1.5 h-1.5 bg-theme-primary rounded-full"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
    </button>
  );
};

// 데스크탑 사이드바 메뉴용 
const SidebarItem = ({ id, icon: Icon, label }: any) => {
  const isActive = screen === id;
  return (
    <button 
      onClick={() => {
        setScreen(id);
        setIsChatReadOnly(false);
      }}  
      className={`relative w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-300 ${
        isActive ? 'bg-wing-gradient text-white shadow-md' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
      }`}
    >
      {/* 아이콘  */}
      <Icon size={20} className={`ml-2 transition-transform ${isActive ? 'scale-110' : ''}`} />
      <span className="font-bold text-sm">{label}</span>

      {/* 활성화 시 우측에 나타나는 하얀 점 */}
      {isActive && (
        <motion.div
          layoutId="sidebar-active-dot"
          className="absolute right-4 w-1.5 h-1.5 bg-white rounded-full"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
    </button>
  );
};

// --- 채팅 로직 ---
const showNav = !['splash', 'tutorial', 'auth'].includes(screen);
const handleSendMessage = (text: string) => { /* 로직 */ };
const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { /* 로직 */ };


  return (
    <div className="min-h-screen w-full overflow-x-hidden text-sm bg-fixie-mist text-fixie-steel font-sans selection:bg-theme-primary/30">
      <AnimatePresence mode="wait">
        {/* 1. 독립 화면들 */}
        {screen === 'splash' && <SplashScreen onComplete={() => setScreen('tutorial')} />}
        {screen === 'tutorial' && <TutorialScreen step={tutorialStep} setStep={setTutorialStep} onComplete={() => setScreen('auth')} />}
        {screen === 'auth' && <AuthScreen onLogin={() => setScreen('home')} />}

        {/* 2. 메인 레이아웃 (사이드바 + 메인 콘텐츠) */}
        {showNav && (
          <div className="flex min-h-screen">
            <aside className="hidden md:flex flex-col w-64 bg-white/50  backdrop-blur-xl border-r border-slate-100 p-6 fixed h-full z-50">
              <div className="flex items-center gap-3 mb-12">
              <FixieLogo size={42} />
                  <div className="flex flex-col mt-1">
                    <h1 className="text-xl font-black text-slate-800 leading-tight">Fixie</h1>
                    <h5 className="text-[12px] text-theme-primary">easy manual</h5>
                  </div>
                </div>

              {/*내비게이션*/}
             <nav className="flex-1 space-y-2 relative pr-2">
              <SidebarItem id="home" icon={HomeIcon} label="홈" />
              <SidebarItem id="chat" icon={MessageCircle} label="Fixie 가이드" />
              <SidebarItem id="scan" icon={Camera} label="기기 스캔" />
              <SidebarItem id="history" icon={HistoryIcon} label="이력" />
              <SidebarItem id="settings" icon={SettingsIcon} label="설정" />
            </nav>

            {/* 유저 프로필 영역 */}
            <div className="mt-auto pt-6 border-t border-slate-100">
              <div className="flex items-center gap-3 p-2">
                <div className="w-10 h-10 rounded-full bg-wing-gradient flex items-center justify-center text-white font-bold">U</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">사용자님</p>
                  <p className="text-xs text-slate-400 truncate">Premium Member</p>
                </div>
              </div>
            </div>
          </aside>

            {/* 메인 콘텐츠 영역 */}
            <main className={`flex-1 ${showNav ? 'md:ml-64' : ''} ${screen === 'chat' ? 'p-0 pb-20 md:p-6' : 'p-6 pb-32'}`}>              
              <AnimatePresence mode="wait">
                {screen === 'home' && <Home key="home" setScreen={setScreen} devices={devices} sliderRef={sliderRef} sliderConstraints={sliderConstraints} />}
                {screen === 'garage' && <Garage key="garage" setScreen={setScreen} devices={devices} setDevices={setDevices} showGarageOptions={showGarageOptions} setShowGarageOptions={setShowGarageOptions} />}
                {screen === 'chat' && <Chat key="chat" setScreen={setScreen} messages={messages} isAnalyzing={isAnalyzing} attachedFiles={attachedFiles} chatEndRef={chatEndRef} handleSendMessage={handleSendMessage} handleFileChange={handleFileChange} setMessages={setMessages}  isReadOnly={isChatReadOnly} removeAttachment={(idx) => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))} />}
                {screen === 'history' && <History key="history" historyFilter={historyFilter} setHistoryFilter={setHistoryFilter} setScreen={setScreen} setIsChatReadOnly={setIsChatReadOnly} />}
                {screen === 'settings' && <Settings key="settings" setScreen={setScreen} currentTheme={currentTheme} setCurrentTheme={setCurrentTheme} />}
                {screen === 'scan' && <ScanScreen onClose={() => setScreen('home')} onScan={() => { setIsAnalyzing(true); setScreen('chat'); }} />}
                {screen === 'theme-select' && (<ThemeSelect key="theme-select"setScreen={setScreen} currentTheme={currentTheme} setCurrentTheme={setCurrentTheme} />)}
                {screen === 'profile' && (<Profile key="profile" setScreen={setScreen} />)}  
              </AnimatePresence>
            </main>

            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-2 grid grid-cols-5 items-center justify-items-center z-50">              
            <NavItem id="home" icon={HomeIcon} label="홈" />
              <NavItem id="chat" icon={MessageCircle} label="픽시 가이드" />
              <div className="relative -top-6">
                <button onClick={() => setScreen('scan')} className="w-14 h-14 rounded-full bg-wing-gradient flex items-center justify-center text-white shadow-lg shadow-theme-primary/30 active:scale-95 transition-transform">
                  <Camera size={24} />
                </button>
              </div>
              <NavItem id="history" icon={HistoryIcon} label="이력" />
              <NavItem id="settings" icon={SettingsIcon} label="설정" />
            </nav>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

