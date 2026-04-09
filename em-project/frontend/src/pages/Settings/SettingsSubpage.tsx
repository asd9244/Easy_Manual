import React, { useState } from 'react';
import { ChevronLeft, Check, HelpCircle as HelpIcon } from 'lucide-react';
import { Screen } from '@/src/types/index';

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
                <ToggleSwitch enabled={notif1} onClick={() => setNotif1(!notif1)} />
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-700">마케팅 정보 수신</h4>
                  <p className="text-xs text-slate-400">이벤트 및 혜택 정보를 받습니다.</p>
                </div>
                <ToggleSwitch enabled={notif2} onClick={() => setNotif2(!notif2)} />
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
            <h4 className="font-bold mb-4">제1조 (개인정보의 처리 목적)</h4>
            <p className="text-xs leading-relaxed text-slate-600 mb-6 text-left">
              'Fixie'는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
              <br/><br/>
              1. 홈페이지 회원가입 및 관리: 회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지...
            </p>
            <h4 className="font-bold mb-4">제2조 (개인정보의 처리 및 보유 기간)</h4>
            <p className="text-xs leading-relaxed text-slate-600 text-left">
              ① 'Fixie'는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
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
                 '기기 등록은 어떻게 하나요?',
                 'AI 진단 리포트를 공유하고 싶어요',
                 '회원 탈퇴는 어디서 하나요?',
                 '구독 플랜을 변경하고 싶습니다'
               ].map((q, i) => (
                 <button key={i} className="w-full p-5 text-left text-sm font-bold text-slate-600 border-b border-slate-50 last:border-0 hover:bg-slate-50 flex justify-between items-center group">
                   {q}
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
