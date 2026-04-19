import React from 'react';
import { ArrowLeft, Share2 } from 'lucide-react';
import { Screen, Device } from '@/src/types/index';

interface ChatHeaderProps {
  selectedMentionDevice: string | null;
  activeDeviceId: number | null;
  devices: Device[];
  isReadOnly?: boolean;
  setScreen: (screen: Screen) => void;
  onShare: () => void;
  onClose?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  selectedMentionDevice,
  activeDeviceId,
  devices,
  isReadOnly,
  setScreen,
  onShare,
  onClose,
}) => {
  const title = (() => {
    if (selectedMentionDevice) return `${selectedMentionDevice} 가이드`;
    if (activeDeviceId !== null && devices) {
      const targetDevice = devices.find(d => Number(d.id) === activeDeviceId);
      if (targetDevice) return `${targetDevice.name} 가이드`;
    }
    return 'Fixie 가이드';
  })();

  return (
    <header className="shrink-0 p-5 md:p-7 bg-white/80 backdrop-blur-md flex items-center justify-between border-b border-white/20 z-10">
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            if (onClose) {
              onClose();
            } else if (selectedMentionDevice && isReadOnly) {
              setScreen('history');
            } else {
              setScreen('home');
            }
          }}
          className="w-10 h-10 bg-white/50 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-500 hover:bg-white/80 transition-colors border border-white/20 shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h3 className="font-bold text-fixie-steel text-lg md:text-xl leading-tight">
            {title}
          </h3>
          <span className="text-[11px] text-theme-primary font-bold">온라인 · 도움 준비 완료</span>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onShare}
          className="w-10 h-10 bg-fixie-steel/5 border border-fixie-steel/10 rounded-xl flex items-center justify-center text-fixie-steel hover:bg-fixie-steel/10 transition-all active:scale-95"
          title="공유하기"
        >
          <Share2 size={18} />
        </button>
      </div>
    </header>
  );
};
