import React, { useState } from 'react';
import { ChevronLeft, Check, HelpCircle as HelpIcon } from 'lucide-react';
import { Screen } from '@/src/types/index';
import { useToastStore } from '@/src/store/useToastStore';

interface SettingsSubpageProps {
  title: string;
  setScreen: (screen: Screen) => void;
}

const ToggleSwitch = ({ enabled, onClick }: { enabled: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-12 h-6 rounded-full transition-colors relative ${enabled ? 'bg-theme-primary' : 'bg-slate-200'}`}
  >
    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${enabled ? 'left-7' : 'left-1'}`} />
  </button>
);

export const SettingsSubpage: React.FC<SettingsSubpageProps> = ({ title, setScreen }) => {
  const [notif1, setNotif1] = useState(true);
  const [notif2, setNotif2] = useState(false);
  const [lang, setLang] = useState('ko');
  const showToast = useToastStore((state) => state.showToast);

  const toggleNotif1 = () => {
    setNotif1(!notif1);
    showToast(`푸시 알림이 ${!notif1 ? '켜졌습니다' : '꺼졌습니다'}.`, 'success');
  };

  const toggleNotif2 = () => {
    setNotif2(!notif2);
    showToast(`마케팅 수신이 ${!notif2 ? '동의되었습니다' : '해제되었습니다'}.`, 'success');
  };

  const renderContent = () => {
    switch (title) {
      case '알림 설정':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-50 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-700">푸시 알림</h4>
                  <p className="text-xs text-slate-400">기기 상태 및 주요 업데이트 알림을 받습니다.</p>
                </div>
                <ToggleSwitch enabled={notif1} onClick={toggleNotif1} />
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-700">마케팅 정보 수신</h4>
                  <p className="text-xs text-slate-400">이벤트 및 혜택 정보를 받습니다.</p>
                </div>
                <ToggleSwitch enabled={notif2} onClick={toggleNotif2} />
              </div>
            </div>
          </div>
        );
      case '언어 설정':
        return (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-50 overflow-hidden">
            {[
              { id: 'ko', label: '한국어 (Korean)', sub: '시스템 기본 언어' },
              { id: 'en', label: 'English (United States)', sub: 'Secondary language' },
              { id: 'jp', label: '日本語 (Japanese)', sub: 'アジア言語' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setLang(item.id)}
                className="w-full p-6 flex justify-between items-center border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
              >
                <div className="text-left">
                  <h4 className="font-bold text-slate-700">{item.label}</h4>
                  <p className="text-xs text-slate-400">{item.sub}</p>
                </div>
                {lang === item.id && <Check size={20} className="text-theme-primary" />}
              </button>
            ))}
          </div>
        );
      case '개인정보 처리방침':
        return (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-50 h-[500px] overflow-y-auto no-scrollbar prose prose-slate">
            <h4 className="font-bold mb-4">제1조 (목적)</h4>
            <p className="text-xs leading-relaxed text-slate-600 mb-6 text-left">
              본 방침은 이지매뉴얼(Fixie) 서비스(이하 '서비스') 이용과 관련하여 회원님의 소중한 개인정보를 보호하고, 관련 법령을 준수하고자 작성되었습니다. 회사는 회원의 개인정보를 보호하기 위해 최선을 다하고 있습니다.
            </p>
            <h4 className="font-bold mb-4">제2조 (개인정보 수집 항목 및 방법)</h4>
            <p className="text-xs leading-relaxed text-slate-600 mb-6 text-left">
              1. 수집항목(필수): 소셜 로그인 계정 정보(이메일, 닉네임), 프로필 이미지<br/>
              2. 수집항목(선택): 기기 등록 정보(제품명, 모델명), 서비스 이용 기록(검색어, 채팅 기반 진단 내용, 첨부 이미지 등)<br/>
              3. 수집방법: 회원가입 및 서비스 이용 중 자동 수집 또는 사용자 직접 입력
            </p>
            <h4 className="font-bold mb-4">제3조 (개인정보의 처리 목적)</h4>
            <p className="text-xs leading-relaxed text-slate-600 mb-6 text-left">
              회사는 다음의 목적을 위해 수집된 정보를 활용합니다.<br/>
              1. 회원 식별 및 가입 의사 확인, 계정 관리<br/>
              2. 맞춤형 AI 진단 가이드, 모델 매뉴얼 정보 제공 등 본질적 서비스 제공<br/>
              3. 신규 서비스 개발, 기능 개선 및 고객 문의(불만) 대응
            </p>
            <h4 className="font-bold mb-4">제4조 (개인정보의 보유 및 이용기간)</h4>
            <p className="text-xs leading-relaxed text-slate-600 mb-6 text-left">
              원칙적으로 개인정보 수집 및 처리 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관계법령의 규정에 의하여 보존할 필요가 있는 경우 다음과 같이 일정한 기간 동안 회원정보를 보관합니다.<br/>
              • 소비자의 불만 또는 분쟁처리에 관한 기록: 3년<br/>
              • 서비스 방문 기록: 3개월
            </p>
            <h4 className="font-bold mb-4">제5조 (개인정보의 제3자 제공 및 파기절차)</h4>
            <p className="text-xs leading-relaxed text-slate-600 mb-6 text-left">
              ① 회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 단, 회원의 사전 동의가 있거나 법령에 규정된 경우에 한합니다.<br/>
              ② 파기절차: 회원 탈퇴 혹은 목적 달성 시 복구 불가능한 기술적 방법으로 즉시 삭제됩니다.
            </p>            
            <h4 className="font-bold mb-4">제6조 (이용자의 권리와 행사방법)</h4>
            <p className="text-xs leading-relaxed text-slate-600 text-left">
              이용자는 언제든지 등록되어 있는 자신의 개인정보를 열람, 정정, 삭제(회원탈퇴)를 요청할 수 있습니다. 앱 내 설정 또는 고객센터를 통해 요청 시 지체 없이 조치하겠습니다.
            </p>
          </div>
        );
      case '고객 센터 / 도움말':
        return (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-50 flex items-center gap-4">
               <div className="w-12 h-12 bg-theme-primary/10 rounded-2xl flex items-center justify-center text-theme-primary">
                 <HelpIcon size={24} />
               </div>
               <div className="text-left">
                  <h4 className="font-bold text-slate-700">무엇을 도와드릴까요?</h4>
                  <p className="text-xs text-slate-400">자주 묻는 질문을 확인하거나 문의를 남겨주세요.</p>
               </div>
            </div>
            <div className="bg-white rounded-3xl shadow-sm border border-slate-50 overflow-hidden">
               {[
                 { q: '기기 등록은 어떻게 하나요?', a: '나의 가전 탭의 [+] 버튼을 눌러 모델을 스캔하거나 검색할 수 있습니다.' },
                 { q: 'AI 진단 내용 공유 방법', a: '대화창 상단의 [공유] 아이콘을 누르면 내역을 링크로 공유할 수 있습니다.' },
                 { q: '지원하는 스마트 기기 브랜드', a: '현재 삼성, LG 등 주요 제조사 브랜드를 우선적으로 지원 중입니다.' },
                 { q: '결제 및 구독 플랜 문의', a: '마이 프로필 페이지에서 현재 플랜 정보를 확인 및 변경할 수 있습니다.' }
               ].map((item, i) => (
                 <button 
                   key={i} 
                   onClick={() => showToast(item.a, 'info')}
                   className="w-full p-5 text-left text-sm font-bold text-slate-600 border-b border-slate-50 last:border-0 hover:bg-slate-50 flex justify-between items-center group"
                 >
                   {item.q}
                   <ChevronLeft size={16} className="rotate-180 text-slate-300 group-hover:text-theme-primary" />
                 </button>
               ))}
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-50 flex flex-col items-center justify-center min-h-[300px]">
             <Check size={48} className="text-slate-200 mb-4" />
             <p className="text-slate-400 font-bold">{title} 정보가 업데이트될 예정입니다.</p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-left pb-20 w-full px-4 md:px-0">
      <header className="flex items-center gap-4 mb-6 px-1">
        <button 
          onClick={() => setScreen('settings')} 
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">{title}</h1>
        </div>
      </header>

      {renderContent()}
    </div>
  );
};
