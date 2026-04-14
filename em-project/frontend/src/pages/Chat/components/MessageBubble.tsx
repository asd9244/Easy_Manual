import React from 'react';
import { motion } from 'motion/react';
import { Play, FileText, ThumbsUp, ThumbsDown, Image as ImageIcon } from 'lucide-react';
import { Message } from '@/src/types/index';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageBubbleProps {
  msg: Message;
  onFeedback: (messageId: string, isLike: boolean) => void;
  onImageClick: (images: string[], index: number) => void;
  onVideoClick: (url: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  msg,
  onFeedback,
  onImageClick,
  onVideoClick,
}) => (
  <motion.div
    key={msg.id}
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className={`flex gap-3 ${
      msg.type === 'status'
        ? 'justify-center w-full'
        : msg.senderType === 'USER'
          ? 'justify-end'
          : 'justify-start'
    }`}
  >
    {msg.senderType === 'AI' && msg.type !== 'status' && (
      <div className="w-8 h-8 rounded-full bg-wing-gradient flex items-center justify-center shrink-0">
        <span className="text-white font-bold italic text-[10px]">F</span>
      </div>
    )}
    <div
      className={`
        ${msg.type === 'status'
          ? 'bg-slate-100/50 backdrop-blur-sm text-slate-400 text-[10px] md:text-[11px] font-bold border border-slate-100 rounded-full px-5 py-1 text-center'
          : 'max-w-[85%] p-1.5 relative ' +
            (msg.senderType === 'USER'
              ? 'bg-fixie-steel text-white rounded-3xl rounded-tr-none shadow-md'
              : 'bg-white/70 backdrop-blur-md text-slate-700 rounded-3xl rounded-tl-none border border-white/40 shadow-sm')
        }
      `}
    >
      {msg.type !== 'status' ? (
        <div className="p-3">
          {/* 첨부 이미지 */}
          {msg.attachments && msg.attachments.length > 0 && (
            <div
              className={`
                grid gap-2 mb-3 max-w-[320px]
                ${msg.attachments.length === 1
                  ? 'grid-cols-1'
                  : msg.attachments.length === 2
                    ? 'grid-cols-2'
                    : msg.attachments.length >= 3
                      ? 'grid-cols-3'
                      : ''}
              `}
            >
              {msg.attachments.map((url, i) => (
                <div
                  key={i}
                  onClick={() => onImageClick(msg.attachments || [], i)}
                  className={`
                    relative overflow-hidden rounded-xl border border-white/20 cursor-pointer hover:opacity-90 transition-opacity
                    ${msg.attachments && msg.attachments.length >= 3 && i === 2 && msg.attachments.length > 3
                      ? 'after:content-["+' + (msg.attachments.length - 3) + '"] after:absolute after:inset-0 after:bg-black/50 after:flex after:items-center after:justify-center after:text-white after:font-bold'
                      : ''}
                    ${msg.attachments && msg.attachments.length >= 3 && i >= 3 ? 'hidden' : ''}
                    aspect-square
                  `}
                >
                  <img src={url} alt="Attachment" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
          )}

          {/* 메시지 텍스트 */}
          <div className="text-sm leading-relaxed mb-1 px-1 whitespace-pre-wrap markdown-content">
            <div className="prose prose-sm prose-slate max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
            </div>
          </div>

          {/* AI 응답 부가 정보 */}
          {msg.senderType === 'AI' && (
            <div className="mt-2 space-y-3">
              {msg.manualImageUrls && msg.manualImageUrls.length > 0 && (
                <div className="mb-2">
                  <p className="text-[11px] font-bold text-theme-primary mb-1.5 flex items-center gap-1">
                    <ImageIcon size={12} /> 매뉴얼 위치 이미지
                  </p>
                  <img
                    src={msg.manualImageUrls[0]}
                    alt="Manual Guide"
                    className="w-full rounded-2xl border border-white/20 shadow-sm cursor-pointer"
                    referrerPolicy="no-referrer"
                    onClick={() => onImageClick(msg.manualImageUrls!, 0)}
                  />
                </div>
              )}

              {msg.type === 'guide' && msg.videoUrl && (
                <div className="relative overflow-hidden rounded-2xl aspect-video bg-slate-800 shadow-sm group">
                  <video src={msg.videoUrl} className="w-full h-full object-cover opacity-80" />
                  <div
                    onClick={() => onVideoClick(msg.videoUrl!)}
                    className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors cursor-pointer z-10"
                  >
                    <button className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white shadow-lg hover:scale-105 active:scale-95 transition-all">
                      <Play fill="white" size={20} className="ml-1" />
                    </button>
                  </div>
                </div>
              )}

              {msg.id !== '1' && msg.id !== 'welcome' && (msg.type as string) !== 'status' && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(msg.manualLink || msg.referencedPage || (msg.manualImageUrls && msg.manualImageUrls.length > 0)) && (
                      <button
                        className="flex items-center gap-2 px-4 py-3 bg-theme-primary/10 hover:bg-theme-primary text-theme-primary hover:text-white rounded-2xl transition-all text-xs font-black shadow-sm border border-theme-primary/10"
                        onClick={() => {
                          if (msg.manualImageUrls && msg.manualImageUrls.length > 0) {
                            onImageClick(msg.manualImageUrls, 0);
                          } else if (msg.manualLink) {
                            window.open(msg.manualLink, '_blank');
                          }
                        }}
                      >
                        <FileText size={14} strokeWidth={2.5} />
                        {msg.referencedPage ? `매뉴얼 P.${msg.referencedPage} 열기` : '상세 매뉴얼 보기'}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 px-1">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Helpful?</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => onFeedback(msg.id, true)} className="p-1.5 text-slate-300 hover:text-theme-primary transition-colors">
                        <ThumbsUp size={14} />
                      </button>
                      <button onClick={() => onFeedback(msg.id, false)} className="p-1.5 text-slate-300 hover:text-red-400 transition-colors">
                        <ThumbsDown size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 px-4 py-1 italic">
          <span>{msg.text}</span>
        </div>
      )}
    </div>
  </motion.div>
);
