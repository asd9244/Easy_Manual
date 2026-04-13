import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Paperclip,
  Mic,
  Send,
  AtSign,
  FileText,
  WashingMachine,
} from 'lucide-react';
import { Device } from '@/src/types/index';

interface ChatComposerProps {
  inputText: string;
  canSend: boolean;
  attachedFiles: string[];
  selectedMentionDevice: string | null;
  showMentionPopover: boolean;
  mentionQuery: string;
  devices: Device[];
  inputRef: React.RefObject<HTMLInputElement | null>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSend: () => void;
  onSendAndClearMention: () => void;
  onVoiceOpen: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: (index: number) => void;
  onToggleMentionPopover: () => void;
  onSelectMention: (deviceName: string) => void;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  inputText,
  canSend,
  attachedFiles,
  selectedMentionDevice,
  showMentionPopover,
  mentionQuery,
  devices,
  inputRef,
  onInputChange,
  onSend,
  onSendAndClearMention,
  onVoiceOpen,
  onFileChange,
  onRemoveAttachment,
  onToggleMentionPopover,
  onSelectMention,
}) => (
  <div className={`
    absolute left-0 right-0 transition-all duration-300
    bottom-0 p-3 bg-white border-t border-slate-50
    md:bottom-8 md:left-10 md:right-10 md:p-0 md:bg-transparent md:border-none
  `}>
    {/* 첨부파일 미리보기 */}
    <AnimatePresence>
      {attachedFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="flex items-center gap-3 mb-3 p-3 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-100 shadow-lg max-w-[calc(100%-16px)] md:max-w-full overflow-x-auto no-scrollbar"
        >
          {attachedFiles.map((file, i) => (
            <div key={i} className="relative group">
              <img src={file} alt="Preview" className="w-14 h-14 object-cover rounded-xl shadow-sm" />
              <button onClick={() => onRemoveAttachment(i)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors">
                <X size={12} />
              </button>
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>

    {/* 메인 입력 Pill */}
    <div className={`
      flex items-center gap-2 transition-all duration-300 relative
      bg-white/40 backdrop-blur-xl rounded-full p-1 pl-4 shadow-none border border-white/20
      md:bg-white/60 md:backdrop-blur-xl md:p-2 md:pl-4 md:shadow-lg md:border-white/30
    `}>
      <button
        onClick={onVoiceOpen}
        className="p-2 text-theme-primary bg-theme-primary/10 rounded-full hover:bg-theme-primary/20 transition-colors"
      >
        <Mic size={18} className="md:w-5 md:h-5" />
      </button>

      <input type="file" id="file-upload" multiple accept="image/*" className="hidden" onChange={onFileChange} />
      <label htmlFor="file-upload" className="p-2 text-slate-400 rounded-full hover:bg-slate-100 cursor-pointer transition-colors">
        <Paperclip size={18} className="md:w-5 md:h-5" />
      </label>

      <button
        id="mention-btn"
        onClick={onToggleMentionPopover}
        className={`p-2 rounded-full transition-all font-bold text-sm ${
          selectedMentionDevice
            ? 'text-white bg-theme-primary shadow-md shadow-theme-primary/30'
            : 'text-slate-400 bg-slate-100 hover:bg-theme-primary/10 hover:text-theme-primary'
        }`}
      >
        <AtSign size={18} />
      </button>

      <input
        ref={inputRef}
        type="text"
        value={inputText}
        onChange={onInputChange}
        placeholder="질문을 입력하세요.."
        className="flex-1 bg-transparent h-10 px-1 focus:outline-none text-[13px] md:text-sm text-slate-700 font-medium"
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing) return;
          if (e.key === 'Enter' && canSend) onSend();
        }}
      />

      <button
        id="send-btn"
        disabled={!canSend}
        className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white shadow-md transition-all shrink-0 ${
          canSend
            ? 'bg-wing-gradient hover:scale-105 active:scale-95 cursor-pointer'
            : 'bg-slate-200 cursor-not-allowed opacity-60'
        }`}
        onClick={() => { if (canSend) onSendAndClearMention(); }}
      >
        <Send className="w-4 h-4 md:w-4.5 md:h-4.5 -ml-0.5" />
      </button>

      {/* 멘션(@) 기기 선택 팝업 */}
      <AnimatePresence>
        {showMentionPopover && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.98 }}
            className="absolute bottom-full left-0 mb-2 z-[100] bg-white/95 backdrop-blur-2xl border border-slate-200/60 rounded-2xl overflow-hidden w-64"
          >
            <div className="p-3 border-b border-slate-100 bg-slate-50/50">
              <p className="text-[10px] font-black text-theme-primary uppercase tracking-wider">가이드 참조하기</p>
            </div>
            <div className="max-h-56 overflow-y-auto no-scrollbar">
              <div className="p-2 border-b border-slate-50">
                <button
                  onClick={() => onSelectMention('매뉴얼 즉시 보기')}
                  className="w-full text-left px-3 py-2.5 hover:bg-theme-primary/5 rounded-xl transition-colors flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-theme-primary/10 flex items-center justify-center text-theme-primary">
                    <FileText size={16} />
                  </div>
                  <span className="text-[13px] font-black text-slate-700">매뉴얼 즉시 보기</span>
                </button>
              </div>

              <div className="p-2 bg-slate-50/30">
                <p className="px-3 py-1 text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">나의 가이드 목록</p>
                {devices && devices.length > 0 ? (
                  devices
                    .filter(d => d.name.toLowerCase().includes(mentionQuery.toLowerCase()) || d.model.toLowerCase().includes(mentionQuery.toLowerCase()))
                    .map((device, idx) => (
                      <button
                        key={device.id || `mention-device-${idx}`}
                        onClick={() => onSelectMention(device.name)}
                        className="w-full text-left px-3 py-2.5 hover:bg-white rounded-xl hover:shadow-sm transition-all flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-400">
                          <WashingMachine size={16} />
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-slate-700 leading-tight">{device.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{device.model}</p>
                        </div>
                      </button>
                    ))
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-xs text-slate-300 font-medium">등록된 기기가 없습니다</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>
);
