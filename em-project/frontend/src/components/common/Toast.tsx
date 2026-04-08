import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react';
import { useToastStore } from '@/src/store/useToastStore';

export const Toast: React.FC = () => {
  const { message, type, isVisible, hideToast } = useToastStore();

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="text-emerald-500" size={20} />;
      case 'error': return <XCircle className="text-rose-500" size={20} />;
      case 'warning': return <AlertCircle className="text-amber-500" size={20} />;
      default: return <Info className="text-blue-500" size={20} />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success': return 'bg-emerald-50 border-emerald-100';
      case 'error': return 'bg-rose-50 border-rose-100';
      case 'warning': return 'bg-amber-50 border-amber-100';
      default: return 'bg-blue-50 border-blue-100';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20, transition: { duration: 0.2 } }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-32px)] max-w-sm"
        >
          <div className={`flex items-center gap-3 p-4 rounded-2xl border shadow-lg ${getBgColor()} backdrop-blur-md`}>
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            <div className="flex-grow text-sm font-bold text-slate-700">
              {message}
            </div>
            <button 
              onClick={hideToast}
              className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
