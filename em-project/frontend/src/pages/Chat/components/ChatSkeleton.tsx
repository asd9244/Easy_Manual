import { motion } from 'motion/react';

export const ChatSkeleton = () => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }} 
    animate={{ opacity: 1, y: 0 }} 
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
    className="flex items-start gap-4 mb-6"
  >
    <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0 relative overflow-hidden">
      <motion.div 
        animate={{ x: ['-100%', '100%'] }} 
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
      />
    </div>
    <div className="space-y-3 w-full max-w-[80%]">
      <div className="h-4 bg-slate-200 rounded-full w-3/4 relative overflow-hidden">
        <motion.div 
          animate={{ x: ['-100%', '100%'] }} 
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
        />
      </div>
      <div className="h-4 bg-slate-200 rounded-full w-1/2 relative overflow-hidden">
        <motion.div 
          animate={{ x: ['-100%', '100%'] }} 
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear", delay: 0.2 }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
        />
      </div>
      <div className="h-32 bg-slate-100/50 rounded-3xl mt-4 w-full border border-slate-50 relative overflow-hidden">
        <motion.div 
          animate={{ x: ['-100%', '100%'] }} 
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
        />
      </div>
      <div className="flex gap-2">
        <div className="h-8 w-24 bg-slate-200 rounded-full relative overflow-hidden">
          <motion.div 
            animate={{ x: ['-100%', '100%'] }} 
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear", delay: 0.4 }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
          />
        </div>
        <div className="h-8 w-24 bg-slate-200 rounded-full relative overflow-hidden">
          <motion.div 
            animate={{ x: ['-100%', '100%'] }} 
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear", delay: 0.5 }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
          />
        </div>
      </div>
    </div>
  </motion.div>
);
