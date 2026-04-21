import { useEffect } from 'react';
import { motion } from 'motion/react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  useEffect(() => { 
    const timer = setTimeout(onComplete, 2800); 
    return () => clearTimeout(timer); 
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-fixie-mist overflow-hidden"
    >
      <div className="relative flex flex-col items-center justify-center h-64">
        
        {/* 1. 살아 숨 쉬는 리퀴드 오라 */}
        <motion.div
          className="absolute w-60 h-60 filter blur-md"
          style={{ background: 'var(--theme-primary)' , filter: 'blur(30px)'}} 
          animate={{
            borderRadius: [
              "30% 70% 70% 30% / 30% 30% 70% 70%", 
              "70% 30% 30% 70% / 70% 70% 30% 30%", 
              "30% 70% 70% 30% / 30% 30% 70% 70%"
            ],
            rotate: [0, 180, 360],
            scale: [0.8, 1.1, 0.8]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* 2. 리퀴드 오라의 그림자 (더 입체적으로 보이게) */}
        <motion.div
          className="absolute w-60 h-60 filter blur-xl"
          style={{ background: 'var(--theme-secondary)' , filter: 'blur(30px)'}} 
          animate={{ rotate: [360, 180, 0], scale: [1, 0.8, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* 3. 투명하고 맑은 유리 로고 (Glassmorphism) */}
        <motion.div
          className="relative z-10 w-24 h-24 bg-white/30 backdrop-blur-md rounded-full shadow-[0_8px_32px_rgba(125,227,209,0.3)] border border-white/60 flex items-center justify-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        >
          <span className="text-white font-bold italic text-5xl pr-1 drop-shadow-md">F</span>
        </motion.div>
      </div>

      {/* 4. 통통 튀는 타이포그래피 등장 */}
      <motion.div className="text-center absolute bottom-32">
        <motion.h2 
          className="text-3xl font-bold tracking-[0.3em] text-fixie-steel"
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", bounce: 0.5, delay: 0.5 }}
        >
          FIXIE
        </motion.h2>
        <motion.p 
          className="text-xs text-theme-primary uppercase tracking-[0.4em] mt-2 font-bold"
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", bounce: 0.5, delay: 0.6 }}
        >
          Smart Assistant
        </motion.p>
      </motion.div>
    </motion.div>
  );
};