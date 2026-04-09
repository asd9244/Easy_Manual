// --- Components ---
import { WashingMachine } from 'lucide-react';
import { motion } from 'motion/react';
import React from 'react';



interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  key?: React.Key;
  onClick?: () => void;
  variant?: 'default' | 'flat';
}

export const GlassCard = ({ children, className = "", onClick }: GlassCardProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        transition-all duration-300
        bg-transparent p-0 mb-0 shadow-none border-b border-slate-100 rounded-none
        md:glass md:rounded-3xl md:p-6 md:mb-4 md:border md:border-white/20 md:backdrop-blur-xl 
        md:shadow-sm md:hover:shadow-lg md:hover:border-theme-primary/20
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};

