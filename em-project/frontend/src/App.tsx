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
import { THEMES, TUTORIAL_STEPS } from '@/src/constants/data';
import { FixieLogo } from '@/src/components/common/FixieLogo';
import { api } from '@/src/api/apiService';

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
import { OAuthRedirectHandler } from '@/src/pages/Auth/OAuthRedirectHandler';
import { ScanScreen } from '@/src/pages/Scan/Scan'; 
import { Profile } from './pages/Profile/Profile';
import { DiagnosticReport } from '@/src/pages/Report/DiagnosticReport';
import { ShareView } from '@/src/pages/Share/ShareView';
import { SettingsSubpage } from '@/src/pages/Settings/SettingsSubpage';
import { Toast } from '@/src/components/common/Toast';
import { deviceService } from '@/src/services/deviceService';
import { authService } from '@/src/services/authService';

export default function App() {
  // --- 전역 상태 관리 ---
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const [screen, setScreen] = useState<Screen>(() => {
    if (window.location.pathname === '/oauth2/redirect') return 'splash';
    const token = localStorage.getItem('accessToken');
    if (token && token !== 'undefined' && token !== 'null') return 'home';
    return 'splash';
  });
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('magician');
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', senderType: 'AI', text: '안녕하세요! 저는 픽시입니다. 무엇을 도와드릴까요?' }
  ]);
  const [showGarageOptions, setShowGarageOptions] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'completed' | 'visit'>('all');
  const [tutorialStep, setTutorialStep] = useState(0);
  
  // 파이프라인 제어용 상태
  const [scannedModel, setScannedModel] = useState<string>('');
  const [initialChatQuery, setInitialChatQuery] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  // 버튼 클릭 시 채팅방 ID 초기화 (홈/가라지 등 이동할 때)
  const handleMenuClick = (id: Screen) => {
    setScreen(id);
    setIsChatReadOnly(false);
    if (id !== 'chat') setSelectedRoomId(null);
  };

  //  모바일 하단 메뉴용 (App 내부에 정의하여 상태 공유)
  const NavItem = ({ id, icon: Icon, label }: any) => {
    const isActive = screen === id;
    return (
      <button 
        onClick={() => handleMenuClick(id)}
        className={`relative flex flex-col items-center gap-1 transition-colors duration-200 ${
          isActive ? 'text-theme-primary' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <Icon size={24} />
        <span className="text-[10px] font-bold">{label}</span>
        {isActive && (
          <motion.div
            layoutId="mobile-active-dot"
            className="absolute -bottom-3 w-1.5 h-1.5 bg-theme-primary rounded-full"
          />
        )}
      </button>
    );
  };

  const chatEndRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [sliderConstraints, setSliderConstraints] = useState({ left: 0, right: 0 });
  // 채팅 입력창이 읽기 전용인지 여부
  const [isChatReadOnly, setIsChatReadOnly] = useState(false);
  const [nickname, setNickname] = useState('사용자');

  // --- 테마 적용 로직 ---
  useEffect(() => {
    const theme = THEMES.find(t => t.id === currentTheme) || THEMES[0];
    document.documentElement.style.setProperty('--theme-primary', theme.primary);
    document.documentElement.style.setProperty('--theme-secondary', theme.secondary);
  }, [currentTheme]);

  // --- 유저 정보 및 기기 목록 가져오기 ---
  useEffect(() => {
    const fetchData = async () => {
      if (!['home', 'garage', 'chat', 'profile'].includes(screen)) return;

      // 1. 유저 정보
      try {
        const userRes = await api.get('/users/me');
        if (userRes.data && userRes.data.nickname) {
          setNickname(userRes.data.nickname);
        }
      } catch (err) { console.error("유저 정보 로드 실패:", err); }

      // 2. 기기 목록
      setIsLoadingDevices(true);
      try {
        const fetchedDevices = await deviceService.getMyDevices();
        setDevices(fetchedDevices);
      } catch (error) {
        console.error("기기 목록 불러오기 실패:", error);
      } finally {
        setIsLoadingDevices(false);
      }
    };
    
    fetchData();
  }, [screen]);

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
  }, [screen]);
  

// 데스크탑 사이드바 메뉴용 
const SidebarItem = ({ id, icon: Icon, label }: any) => {
  const isActive = screen === id;
  return (
    <button 
      onClick={() => handleMenuClick(id)}  
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
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
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
      <Toast />
      <AnimatePresence mode="wait">
        {window.location.pathname === '/oauth2/redirect' ? (
          <OAuthRedirectHandler 
            key="oauth-handler"
            onLogin={() => {
              window.history.replaceState({}, '', '/');
              setScreen('home');
            }} 
          />
        ) : !showNav ? (
          <motion.div 
            key="auth-flow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {screen === 'splash' && <SplashScreen onComplete={() => setScreen('tutorial')} />}
            {screen === 'tutorial' && <TutorialScreen step={tutorialStep} setStep={setTutorialStep} onComplete={() => setScreen('auth')} />}
            {screen === 'auth' && <AuthScreen onLogin={() => setScreen('home')} />}
          </motion.div>
        ) : (
          <motion.div 
            key="main-app-layout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex min-h-screen"
          >
            {/* 1. 사이드바 (데스크탑 전용) */}
            <aside className="hidden md:flex flex-col w-64 bg-white/50 backdrop-blur-xl border-r border-slate-100 p-6 fixed h-full z-50">
              {/* 로고 영역 커스텀 클릭 -> 홈으로 이동 */}
              <div 
                className="flex items-center gap-3 mb-12 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => {
                  setScreen('home');
                  setIsChatReadOnly(false);
                }}
              >
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

            {/* 유저 프로필 영역 -> 클릭 시 프로필로 이동 */}
            <div 
              className="mt-auto pt-6 border-t border-slate-100 cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors -mx-2 px-4"
              onClick={() => setScreen('profile')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-wing-gradient flex items-center justify-center text-white font-bold">{nickname.substring(0,1).toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{nickname}님</p>
                  <p className="text-xs text-slate-400 truncate">Premium Member</p>
                </div>
              </div>
            </div>
          </aside>

            {/* 메인 콘텐츠 영역 */}
            <main className={`flex-1 ${showNav ? 'md:ml-64' : ''} ${screen === 'chat' ? 'p-0 pb-20 md:p-6' : 'p-6 pb-32'}`}>              
              <AnimatePresence mode="wait">
                {screen === 'home' && <Home key="home" setScreen={setScreen} devices={devices} isLoading={isLoadingDevices} sliderRef={sliderRef} sliderConstraints={sliderConstraints} onGuideClick={(title: string) => { setInitialChatQuery(title); setIsAnalyzing(true); setScreen('chat'); }} />}
                {screen === 'garage' && <Garage key="garage" setScreen={setScreen} devices={devices} setDevices={setDevices} showGarageOptions={showGarageOptions} setShowGarageOptions={setShowGarageOptions} scannedModel={scannedModel} setScannedModel={setScannedModel} />}
                {screen === 'chat' && <Chat key="chat" setScreen={setScreen} messages={messages} isAnalyzing={isAnalyzing} setIsAnalyzing={setIsAnalyzing} attachedFiles={attachedFiles} setAttachedFiles={setAttachedFiles} chatEndRef={chatEndRef} handleSendMessage={handleSendMessage} handleFileChange={handleFileChange} setMessages={setMessages} isReadOnly={isChatReadOnly} removeAttachment={(idx: number) => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))} initialQuery={initialChatQuery} setInitialQuery={setInitialChatQuery} devices={devices} roomId={selectedRoomId} />}
                {screen === 'history' && <History key="history" historyFilter={historyFilter} setHistoryFilter={setHistoryFilter} setScreen={setScreen} setIsChatReadOnly={setIsChatReadOnly} onRoomSelect={(id: number) => setSelectedRoomId(id)} />}
                {screen === 'settings' && <Settings key="settings" setScreen={setScreen} currentTheme={currentTheme} setCurrentTheme={setCurrentTheme} />}
                {screen === 'scan' && <ScanScreen key="scan" onClose={() => setScreen('home')} onScan={(model?: string) => { 
                  if (model) { 
                    const existingDevice = devices.find(d => d.model === model || d.name === model);
                    if (existingDevice) {
                      // 스마트 스캔: 이미 등록된 기기면 즉시 해당 기기의 채팅창으로 이동!
                      setSelectedRoomId(Number(existingDevice.id));
                      setInitialChatQuery(''); // 별도 자동 질문 없이 채팅창 진입
                      setIsAnalyzing(true); // 멋진 진입 애니메이션 효과 실행
                      setScreen('chat');
                    } else {
                      // 미등록 기기면 기기 추가(Garage) 창으로 자동 이동하여 등록 유도
                      setScannedModel(model); 
                      setScreen('garage'); 
                    }
                  } 
                }} />}
                {screen === 'theme-select' && (<ThemeSelect key="theme-select"setScreen={setScreen} currentTheme={currentTheme} setCurrentTheme={setCurrentTheme} />)}
                {screen === 'profile' && (<Profile key="profile" setScreen={setScreen} />)}  
                {screen === 'report' && (<DiagnosticReport key="report" setScreen={setScreen} />)}
                {screen === 'share' && (<ShareView key="share" setScreen={setScreen} />)}
                {screen === 'settings-notifications' && <SettingsSubpage key="s-notif" title="알림 설정" setScreen={setScreen} />}
                {screen === 'settings-language' && <SettingsSubpage key="s-lang" title="언어 설정" setScreen={setScreen} />}
                {screen === 'settings-privacy' && <SettingsSubpage key="s-priv" title="개인정보 처리방침" setScreen={setScreen} />}
                {screen === 'settings-help' && <SettingsSubpage key="s-help" title="고객 센터 / 도움말" setScreen={setScreen} />}
              </AnimatePresence>
            </main>

            {/* 하단 탭바 (모바일 전용) */}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
