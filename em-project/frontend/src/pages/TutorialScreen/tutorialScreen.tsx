import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FixieLogo } from '@/src/components/common/FixieLogo';
import { TUTORIAL_STEPS } from '@/src/constants/data';

interface TutorialScreenProps {
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  onComplete: () => void;
}

export const TutorialScreen = ({ step, setStep, onComplete }: TutorialScreenProps) => {
  const current = TUTORIAL_STEPS[step]; 
  const Icon = current.icon;

  return (
    <div className="min-h-screen bg-fixie-mist flex flex-col p-8 justify-between items-center text-center">
      <div className="mt-12">
        <FixieLogo size={60} />
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center max-w-xs">
        {/* 1. 아이콘 부드럽게 바뀌는 마법 상자 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="mb-8"
          >
            {/* 💡 바로 여기서 data.ts의 색상(current.color)이 적용된다! */}
            <div className={`w-24 h-24 rounded-3xl ${current.color} flex items-center justify-center text-white shadow-xl shadow-theme-primary/20`}>
              <Icon size={48} />
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* 2. 텍스트 부드럽게 바뀌는 마법 상자 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h2 className="text-2xl font-bold text-fixie-steel mb-4">{current.title}</h2>
            <p className="text-slate-500 leading-relaxed">{current.description}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="w-full max-w-sm mb-12 space-y-6">
        {/* 💡 3. 잃어버렸던 핵심! 테마 색상을 보여주는 진행도 점(Dots) 부활 */}
        <div className="flex justify-center gap-2">
          {TUTORIAL_STEPS.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-theme-primary' : 'w-2 bg-slate-200'}`}
            />
          ))}
        </div>
        
        <button 
          onClick={() => step < TUTORIAL_STEPS.length - 1 ? setStep(step + 1) : onComplete()}
          className="w-full h-14 bg-wing-gradient text-white rounded-2xl font-bold shadow-lg shadow-theme-primary/30"
        >
          {step === TUTORIAL_STEPS.length - 1 ? "시작하기" : "다음"}
        </button>
      </div>
    </div>
  );
};