import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Link as LinkIcon, Mail } from 'lucide-react';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  shareUrl?: string;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({ 
  isOpen, 
  onClose, 
  title = "공유", 
  shareUrl = window.location.href 
}) => {
  
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Fixie와 함께한 대화 내용입니다: ${title}`,
          url: shareUrl,
        });
        onClose();
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('공유 실패:', error);
          handleCopyLink(); // 시스템 공유 실패 시 클립보드 복사로 대체
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    alert('링크가 복사되었습니다!');
    onClose();
  };
   
  const isNativeShareSupported = typeof navigator !== 'undefined' && !!navigator.share;

  const shareLinks = [
    {
      name: '링크 복사',
      icon: <LinkIcon size={24} className="text-slate-700" />,
      bgColor: 'bg-slate-100',
      action: handleCopyLink
    },
    {
      name: 'WhatsApp',
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className="text-white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.438 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
      bgColor: 'bg-[#25D366]',
      action: () => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareUrl)}`, '_blank')
    },
    {
      name: '메신저',
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className="text-white">
          <path d="M12 0C5.31 0 0 4.98 0 11.12c0 3.51 1.74 6.64 4.46 8.64.23.17.37.44.37.73v2.85c0 .54.59.88 1.05.58l3.18-2.11c.21-.14.46-.19.7-.15a13.36 13.36 0 002.24.19c6.69 0 12-4.98 12-11.12S18.69 0 12 0zm1.14 14.89l-2.9-3.09-5.66 3.09 6.22-6.61 2.9 3.09 5.66-3.09-6.22 6.61z"/>
        </svg>
      ),
      bgColor: 'bg-gradient-to-tr from-[#00c6ff] via-[#0072ff] to-[#00c6ff]',
      action: () => window.open(`https://www.facebook.com/dialog/send?link=${encodeURIComponent(shareUrl)}&app_id=123456789&redirect_uri=${encodeURIComponent(shareUrl)}`, '_blank')
    },
    {
      name: 'Facebook',
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className="text-white">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      bgColor: 'bg-[#1877F2]',
      action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')
    },
    {
      name: 'X',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="text-white">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      bgColor: 'bg-black',
      action: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`, '_blank')
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center p-0 md:p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-sm bg-white rounded-t-[32px] md:rounded-[32px] overflow-hidden shadow-2xl p-8"
          >
            <div className="flex justify-between items-center mb-8">
              <span className="w-10 h-10" /> {/* Spacer */}
              <h3 className="text-lg font-bold text-slate-800">{title}</h3>
              <button 
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative overflow-visible">
              <motion.div 
                drag="x"
                dragConstraints={{ left: -100, right: 0 }} // 아이콘 개수에 따라 유동적이지만 여기선 적정값
                className="flex items-center gap-4 cursor-grab active:cursor-grabbing py-4 px-1"
              >
                {shareLinks.map((link) => (
                  <button
                    key={link.name}
                    onClick={link.action}
                    className="flex flex-col items-center gap-3 min-w-[72px] group relative"
                  >
                    <div className={`w-14 h-14 ${link.bgColor} rounded-[22px] flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:shadow-md transition-all duration-300 ring-0 group-hover:ring-4 ring-slate-50`}>
                      {link.icon}
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">{link.name}</span>
                  </button>
                ))}
              </motion.div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50">
               <button 
                 onClick={handleCopyLink}
                 className="w-full py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
               >
                 <LinkIcon size={18} /> 링크 복사하기
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
