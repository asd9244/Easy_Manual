import React from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { THEMES } from '@/src/constants/data';
import { Screen, ThemeType } from '@/src/types/index';
import { motion } from 'motion/react';
import { authService } from '@/src/services/authService';

interface ThemeSelectProps {
  setScreen: (screen: Screen) => void;
  currentTheme: ThemeType;
  setCurrentTheme: (theme: ThemeType) => void;
}

export const ThemeSelect: React.FC<ThemeSelectProps> = ({ setScreen, currentTheme, setCurrentTheme }) => {
  return (
    <div className="max-w-2xl mx-auto space-y-8 text-left">
      <header className="flex items-center gap-4">
        <button onClick={() => setScreen('settings')} className="p-2 bg-white rounded-xl shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-slate-800">테마 설정</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {THEMES.map((theme) => (
          <motion.button
            key={theme.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={async () => {
              setCurrentTheme(theme.id);
              try {
                await authService.updateTheme(theme.id);
              } catch (err) {
                console.error("테마 백엔드 연동 실패:", err);
              }
            }}
            className={`relative p-6 rounded-3xl border-2 transition-all text-left overflow-hidden ${
              currentTheme === theme.id 
                ? 'border-theme-primary bg-white shadow-lg' 
                : 'border-slate-100 bg-white/50 hover:bg-white'
            }`}
          >
            {/* 배경에 살짝 비치는 테마 색상 원 */}
            <div 
              className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10" 
              style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}
            />

            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full shadow-inner" style={{ backgroundColor: theme.primary }} />
                <div className="w-8 h-8 rounded-full shadow-inner" style={{ backgroundColor: theme.secondary }} />
              </div>
              {currentTheme === theme.id && (
                <div className="w-6 h-6 bg-theme-primary rounded-full flex items-center justify-center text-white">
                  <Check size={14} strokeWidth={3} />
                </div>
              )}
            </div>

            <h3 className="font-bold text-slate-800 text-lg">{theme.name}</h3>
            <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-wider">{theme.vibe}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
};