import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const FixieLogo = ({ 
  size = 100, 
  ripple = false, 
  rainbow = false,
  src, 
  customSvg 
}: { 
  size?: number, 
  ripple?: boolean, 
  rainbow?: boolean,
  src?: string, 
  customSvg?: React.ReactNode 
}) => {
  const rainbowColors = [
    'var(--theme-primary)', 'var(--theme-secondary)', 'var(--theme-primary)', 
    'var(--theme-secondary)', 'var(--theme-primary)', 'var(--theme-secondary)', 'var(--theme-primary)',
  ];

  return (
    <div className="relative flex items-center justify-center">
      <AnimatePresence>
        {ripple && !rainbow && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-theme-primary/30"
                initial={{ width: size, height: size, opacity: 0.5 }}
                animate={{ width: size! * 2.5, height: size! * 2.5, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
              />
            ))}
          </>
        )}
        {rainbow && (
          <>
            {[...Array(7)].map((_, i) => (
              <motion.div
                key={`rainbow-${i}`}
                className="absolute rounded-full border-2"
                style={{ borderColor: rainbowColors[i], width: size, height: size }}
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 3.5, opacity: 0 }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.4, ease: "easeOut" }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
      <motion.div 
        className="relative z-10"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div 
          className="rounded-full bg-wing-gradient flex items-center justify-center shadow-lg overflow-hidden"
          style={{ width: size, height: size }}
        >
          {customSvg ? (
            <div className="w-full h-full flex items-center justify-center p-2">{customSvg}</div>
          ) : src ? (
            <img src={src} alt="Fixie Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="text-white font-bold italic" style={{ fontSize: size! * 0.4 }}>F</div>
          )}
        </div>
      </motion.div>
    </div>
  );
};