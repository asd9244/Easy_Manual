import React from "react";
import {motion} from "motion/react";
import {
  Play,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import {Message} from "@/src/types/index";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessageBubbleProps {
  msg: Message;
  onFeedback: (messageId: string, isLike: boolean) => void;
  onImageClick: (images: string[], index: number) => void;
  onVideoClick: (url: string) => void;
  showSummarizeAction?: boolean;
  onSummarizeAiTurn?: (aiMessageId: string) => void;
  summarizingAiMessageId?: string | null;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  msg,
  onFeedback,
  onImageClick,
  onVideoClick,
  showSummarizeAction,
  onSummarizeAiTurn,
  summarizingAiMessageId,
}) => {
  const anchorId = msg.type !== "status" ? `chat-msg-${msg.id}` : undefined;
  const isSummarizingThis =
    summarizingAiMessageId != null && summarizingAiMessageId === msg.id;

  if (msg.type === "status") {
    return (
      <motion.div
        key={msg.id}
        layout
        initial={{opacity: 0, y: 10}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.3}}
        className="flex gap-3 justify-center w-full"
      >
        <div className="flex items-center gap-1.5 px-4 py-1 italic bg-slate-100/50 backdrop-blur-sm text-slate-400 text-[10px] md:text-[11px] font-bold border border-slate-100 rounded-full">
          <span>{msg.text}</span>
        </div>
      </motion.div>
    );
  }

  const bubbleBody = (
    <>
      {msg.attachments && msg.attachments.length > 0 && (
        <div
          className={`
            grid gap-2 mb-3 max-w-[320px]
            ${
              msg.attachments.length === 1
                ? "grid-cols-1"
                : msg.attachments.length === 2
                  ? "grid-cols-2"
                  : msg.attachments.length >= 3
                    ? "grid-cols-3"
                    : ""
            }
          `}
        >
          {msg.attachments.map((url, i) => (
            <div
              key={i}
              onClick={() => onImageClick(msg.attachments || [], i)}
              className={`
                relative overflow-hidden rounded-xl border border-white/20 cursor-pointer hover:opacity-90 transition-opacity
                ${
                  msg.attachments &&
                  msg.attachments.length >= 3 &&
                  i === 2 &&
                  msg.attachments.length > 3
                    ? 'after:content-["+' +
                      (msg.attachments.length - 3) +
                      '"] after:absolute after:inset-0 after:bg-black/50 after:flex after:items-center after:justify-center after:text-white after:font-bold'
                    : ""
                }
                ${msg.attachments && msg.attachments.length >= 3 && i >= 3 ? "hidden" : ""}
                aspect-square
              `}
            >
              <img
                src={url}
                alt="Attachment"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          ))}
        </div>
      )}

      <div className="text-sm leading-relaxed mb-1 px-1 whitespace-pre-wrap markdown-content">
        <div
          className={`prose prose-sm max-w-none ${
            msg.senderType === "USER" ? "prose-invert" : "prose-slate"
          }`}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
        </div>
      </div>

      {msg.senderType === "AI" && (
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

          {msg.type === "guide" && msg.videoUrl && (
            <div className="relative overflow-hidden rounded-2xl aspect-video bg-slate-800 shadow-sm group">
              <video
                src={msg.videoUrl}
                className="w-full h-full object-cover opacity-80"
              />
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

          {msg.id !== "1" &&
            msg.id !== "welcome" &&
            (msg.type as string) !== "status" && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex flex-wrap gap-2 mb-3">
                  {(msg.manualLink ||
                    msg.referencedPage ||
                    (msg.manualImageUrls &&
                      msg.manualImageUrls.length > 0)) && (
                    <button
                      className="flex items-center gap-2 px-4 py-3 bg-theme-primary/10 hover:bg-theme-primary text-theme-primary hover:text-white rounded-2xl transition-all text-xs font-black shadow-sm border border-theme-primary/10"
                      onClick={() => {
                        if (
                          msg.manualImageUrls &&
                          msg.manualImageUrls.length > 0
                        ) {
                          onImageClick(msg.manualImageUrls, 0);
                        } else if (msg.manualLink) {
                          window.open(msg.manualLink, "_blank");
                        }
                      }}
                    >
                      <FileText size={14} strokeWidth={2.5} />
                      {msg.referencedPage
                        ? `매뉴얼 P.${msg.referencedPage} 열기`
                        : "상세 매뉴얼 보기"}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3 px-1">
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
                    Helpful?
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onFeedback(msg.id, true)}
                      className="p-1.5 text-slate-300 hover:text-theme-primary transition-colors"
                    >
                      <ThumbsUp size={14} />
                    </button>
                    <button
                      onClick={() => onFeedback(msg.id, false)}
                      className="p-1.5 text-slate-300 hover:text-red-400 transition-colors"
                    >
                      <ThumbsDown size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}
        </div>
      )}
    </>
  );

  if (msg.senderType === "USER") {
    return (
      <motion.div
        key={msg.id}
        id={anchorId}
        layout
        initial={{opacity: 0, y: 10}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.3}}
        className="flex gap-3 justify-end w-full"
      >
        <div className="max-w-[85%] p-1.5 relative bg-fixie-steel text-white rounded-3xl rounded-tr-none shadow-md">
          <div className="p-3">{bubbleBody}</div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key={msg.id}
      id={anchorId}
      layout
      initial={{opacity: 0, y: 10}}
      animate={{opacity: 1, y: 0}}
      transition={{duration: 0.3}}
      className="flex gap-3 justify-start w-full"
    >
      <div className="w-8 h-8 rounded-full bg-wing-gradient flex items-center justify-center shrink-0 self-end mb-1">
        <span className="text-white font-bold italic text-[10px]">F</span>
      </div>
      <div className="max-w-[85%] flex flex-col gap-2 min-w-0 flex-1">
        {showSummarizeAction && onSummarizeAiTurn && (
          <div className="flex justify-end">
            <button
              type="button"
              disabled={isSummarizingThis}
              onClick={() => onSummarizeAiTurn(msg.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-theme-primary/10 text-theme-primary border border-theme-primary/15 hover:bg-theme-primary/15 transition-colors disabled:opacity-60 disabled:cursor-wait"
            >
              <Sparkles size={14} />
              {isSummarizingThis ? "요약 중…" : "이 답변 요약"}
            </button>
          </div>
        )}
        <div className="p-1.5 relative bg-white/70 backdrop-blur-md text-slate-700 rounded-3xl rounded-tl-none border border-white/40 shadow-sm">
          <div className="p-3">{bubbleBody}</div>
        </div>
      </div>
    </motion.div>
  );
};
