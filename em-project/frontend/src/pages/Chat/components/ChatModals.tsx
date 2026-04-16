import React from "react";
import {motion, AnimatePresence} from "motion/react";
import {
  X,
  ArrowLeft,
  Mic,
  MessageCircle,
  Sparkle,
  ClipboardCheck,
  Share2,
  ChevronRight,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {CategoryItem} from "../constants";

// ── VideoModal ──
interface VideoModalProps {
  isOpen: boolean;
  videoUrl: string;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  isOpen,
  videoUrl,
  onClose,
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{opacity: 0}}
        animate={{opacity: 1}}
        exit={{opacity: 0}}
        className="fixed inset-0 z-[160] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      >
        <div className="relative w-full max-w-4xl max-h-screen">
          <button
            onClick={onClose}
            className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors"
          >
            <X size={32} />
          </button>
          <div className="bg-black rounded-2xl overflow-hidden shadow-2xl aspect-video w-full flex items-center justify-center">
            {videoUrl ? (
              <video
                src={videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-white/50 text-sm">
                해당 영상을 불러올 수 없습니다.
              </div>
            )}
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ── VoiceModal ──
interface VoiceModalProps {
  isOpen: boolean;
  isListening: boolean;
  tempTranscript: string;
  onToggleListening: () => void;
  onClose: () => void;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({
  isOpen,
  isListening,
  tempTranscript,
  onToggleListening,
  onClose,
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{opacity: 0}}
        animate={{opacity: 1}}
        exit={{opacity: 0}}
        className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm md:p-4"
      >
        <motion.div
          initial={{y: "100%"}}
          animate={{y: 0}}
          exit={{y: "100%"}}
          transition={{type: "spring", damping: 25, stiffness: 200}}
          className="w-full max-w-3xl bg-white rounded-t-3xl md:rounded-3xl p-8 flex flex-col items-center gap-6 shadow-2xl relative"
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>

          <div className="text-center space-y-2 mt-4">
            <h3 className="text-xl font-bold text-slate-800">
              {isListening ? "듣고 있어요.." : "말씀하시려면 버튼을 누르세요"}
            </h3>
            <p className="text-sm text-slate-500">
              궁금한 점을 자유롭게 말씀해 주세요.
            </p>
          </div>

          <div
            className="relative w-32 h-32 flex items-center justify-center my-6 cursor-pointer"
            onClick={onToggleListening}
          >
            {isListening && (
              <>
                <div className="absolute inset-0 bg-theme-primary/20 rounded-full animate-ping opacity-75" />
                <div className="absolute inset-2 bg-theme-primary/30 rounded-full animate-pulse" />
              </>
            )}
            <div
              className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all ${isListening ? "bg-wing-gradient shadow-theme-primary/40" : "bg-slate-200 shadow-none"}`}
            >
              <Mic
                size={36}
                fill={isListening ? "white" : "#94a3b8"}
                className={isListening ? "text-white" : "text-slate-400"}
              />
            </div>
          </div>

          <div className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 min-h-[100px] flex items-center justify-center text-center">
            {isListening || tempTranscript ? (
              <span className="text-slate-700 text-sm font-bold animate-in fade-in">
                {tempTranscript || "언어 분석 중.."}
              </span>
            ) : (
              <span className="text-slate-400 text-sm font-medium italic">
                마이크를 눌러 음성 입력을 시작하세요.
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-700 transition-colors mt-2"
          >
            입력 완료
          </button>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ── LightboxModal ──
interface LightboxModalProps {
  images: string[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  images,
  index,
  onClose,
  onPrev,
  onNext,
}) => (
  <AnimatePresence>
    {images.length > 0 && (
      <motion.div
        initial={{opacity: 0}}
        animate={{opacity: 1}}
        exit={{opacity: 0}}
        className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-white/70 hover:text-white z-50 p-2"
        >
          <X size={32} />
        </button>

        {images.length > 1 && (
          <>
            <button
              onClick={onPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-4 z-50 transition-colors"
            >
              <ArrowLeft size={40} />
            </button>
            <button
              onClick={onNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-4 z-50 transition-colors rotate-180"
            >
              <ArrowLeft size={40} />
            </button>
          </>
        )}

        <div className="relative w-full h-full flex flex-col items-center justify-center gap-4">
          <motion.img
            key={index}
            initial={{opacity: 0, scale: 0.9}}
            animate={{opacity: 1, scale: 1}}
            src={images[index]}
            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
          />
          <div className="text-white/70 font-bold text-sm bg-black/50 px-4 py-2 rounded-full">
            {index + 1} / {images.length}
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ── ResumeSheet ──
interface ResumeSheetProps {
  rooms:
    | {id: number; title?: string; createdAt?: string; updatedAt?: string}[]
    | null;
  onStartNew: () => void;
  onResume: (roomId: number) => void;
  onBack: () => void;
}

export const ResumeSheet: React.FC<ResumeSheetProps> = ({
  rooms,
  onStartNew,
  onResume,
  onBack,
}) => {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diff = now.getTime() - d.getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "방금 전";
      if (mins < 60) return `${mins}분 전`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}시간 전`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `${days}일 전`;
      return `${d.getMonth() + 1}/${d.getDate()}`;
    } catch {
      return "";
    }
  };

  return (
    <AnimatePresence>
      {rooms && rooms.length > 0 && (
        <div className="fixed inset-0 z-[250] bg-black/40 backdrop-blur-sm flex items-end">
          <motion.div
            initial={{y: "100%"}}
            animate={{y: 0}}
            exit={{y: "100%"}}
            transition={{type: "spring", damping: 25, stiffness: 200}}
            className="w-full bg-white rounded-t-[40px] p-6 pt-5 md:max-w-3xl md:mx-auto md:rounded-3xl md:mb-10 shadow-2xl max-h-[70vh] flex flex-col"
          >
            <div className="flex items-start gap-3 shrink-0 w-full">
              <button
                type="button"
                onClick={onBack}
                aria-label="뒤로 가기"
                className="shrink-0 w-11 h-11 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors active:scale-95"
              >
                <ArrowLeft size={22} strokeWidth={2.25} />
              </button>
              <div className="flex-1 min-w-0 pt-0.5">
                <h3 className="text-lg font-bold text-slate-800 leading-tight">
                  이전 대화 목록
                </h3>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  이어서 대화할 항목을 선택하거나 새로 시작하세요.
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto mt-5 -mx-2 px-2 space-y-2 no-scrollbar">
              {rooms.map((room, idx) => (
                <motion.button
                  key={room.id}
                  initial={{opacity: 0, y: 10}}
                  animate={{opacity: 1, y: 0}}
                  transition={{delay: idx * 0.05}}
                  onClick={() => onResume(room.id)}
                  className="w-full text-left p-4 bg-slate-50 hover:bg-theme-primary/5 border border-slate-100 hover:border-theme-primary/20 rounded-2xl transition-all active:scale-[0.98] group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-700 group-hover:text-theme-primary truncate transition-colors text-sm">
                        {room.title || `대화 #${room.id}`}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatDate(room.updatedAt || room.createdAt)}
                      </p>
                    </div>
                    <div className="shrink-0 w-8 h-8 rounded-full bg-theme-primary/10 text-theme-primary flex items-center justify-center group-hover:bg-theme-primary group-hover:text-white transition-all">
                      <MessageCircle size={14} />
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            <button
              onClick={onStartNew}
              className="w-full mt-5 py-4 bg-wing-gradient text-white font-bold rounded-2xl hover:opacity-90 transition-all active:scale-[0.98] shadow-lg shadow-theme-primary/20 shrink-0"
            >
              + 새 대화 시작
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ── CategorySelectSheet ──
interface CategorySelectSheetProps {
  isOpen: boolean;
  deviceName: string | null;
  categories: CategoryItem[];
  onSelect: (category: CategoryItem) => void;
}

export const CategorySelectSheet: React.FC<CategorySelectSheetProps> = ({
  isOpen,
  deviceName,
  categories,
  onSelect,
}) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[250] bg-black/40 backdrop-blur-sm flex items-end">
        <motion.div
          initial={{y: "100%"}}
          animate={{y: 0}}
          exit={{y: "100%"}}
          transition={{type: "spring", damping: 25, stiffness: 200}}
          className="w-full bg-white rounded-t-[40px] p-6 pt-5 md:max-w-3xl md:mx-auto md:rounded-3xl md:mb-10 shadow-2xl max-h-[80vh] flex flex-col"
        >
          {/* 헤더 */}
          <div className="shrink-0 mb-5">
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            <h3 className="text-lg font-bold text-slate-800 leading-tight">
              어떤 도움이 필요하신가요?
            </h3>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {deviceName
                ? `${deviceName} 관련 주제를 선택하면 더 정확한 답변을 받을 수 있어요.`
                : "주제를 선택하면 더 정확한 답변을 받을 수 있어요."}
            </p>
          </div>

          {/* 카테고리 그리드 */}
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-2 gap-2.5">
              {categories
                .filter((c) => c.value !== "ETC")
                .map((cat, idx) => (
                  <motion.button
                    key={cat.value}
                    initial={{opacity: 0, y: 10}}
                    animate={{opacity: 1, y: 0}}
                    transition={{delay: idx * 0.04}}
                    onClick={() => onSelect(cat)}
                    className="flex items-center justify-between gap-2 p-4 bg-slate-50 hover:bg-theme-primary/5 border border-slate-100 hover:border-theme-primary/30 rounded-2xl transition-all active:scale-[0.97] group text-left"
                  >
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-theme-primary transition-colors leading-snug">
                      {cat.label}
                    </span>
                    <ChevronRight
                      size={14}
                      className="shrink-0 text-slate-300 group-hover:text-theme-primary transition-colors"
                    />
                  </motion.button>
                ))}
            </div>
          </div>

          {/* 기타 버튼 */}
          {categories.find((c) => c.value === "ETC") && (
            <button
              onClick={() => onSelect({value: "ETC", label: "기타"})}
              className="w-full mt-4 py-3.5 bg-slate-100 text-slate-500 font-semibold rounded-2xl hover:bg-slate-200 transition-all active:scale-[0.98] shrink-0 text-sm"
            >
              해당하는 항목이 없어요 (기타)
            </button>
          )}
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

/** 요약 본문을 Q/A 쌍으로 분리 (빈 줄 기준, 최대 3쌍). AI 프롬프트 형식과 맞춤 */
export function parseSummaryQAPairs(raw: string): { question: string; answer: string }[] {
  const normalized = raw.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  const segments = normalized
    .split(/\n\s*\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const pairs: { question: string; answer: string }[] = [];
  for (let i = 0; i < segments.length - 1 && pairs.length < 3; i += 2) {
    pairs.push({ question: segments[i], answer: segments[i + 1] });
  }
  return pairs;
}

// ── SummaryModal ──
interface SummaryModalProps {
  isOpen: boolean;
  summaryText: string;
  onClose: () => void;
  onShare: () => void;
  /** 기기별명(표시용) */
  deviceLabel?: string;
  /** 질문 내용 요약(한 줄·제목 등) */
  questionSummary?: string;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  isOpen,
  summaryText,
  onClose,
  onShare,
  deviceLabel,
  questionSummary,
}) => {
  const qaPairs = parseSummaryQAPairs(summaryText);
  const useCards = qaPairs.length > 0;

  const copySummary = () => {
    if (useCards) {
      const text = qaPairs
        .map(
          (p, i) =>
            `[질문 ${i + 1}]\n${p.question}\n\n[답변 요약]\n${p.answer}`,
        )
        .join("\n\n---\n\n");
      navigator.clipboard.writeText(text);
    } else {
      navigator.clipboard.writeText(summaryText);
    }
    alert("요약 내용이 복사되었습니다.");
  };

  return (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[300] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div
          initial={{opacity: 0, scale: 0.9, y: 20}}
          animate={{opacity: 1, scale: 1, y: 0}}
          exit={{opacity: 0, scale: 0.9, y: 20}}
          className="w-full max-w-lg bg-white rounded-[32px] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
        >
          <div className="bg-wing-gradient p-8 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <Sparkle size={18} />
              </div>
              <div className="min-w-0 flex-1 pr-12 space-y-4">
                <div>
                  <p className="text-[11px] font-bold text-white/60 mb-1">
                    기기별명
                  </p>
                  <p className="text-base font-bold text-white tracking-tight truncate">
                    {deviceLabel?.trim() || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-white/60 mb-1">
                    질문 내용 요약
                  </p>
                  <h3 className="text-lg sm:text-xl font-black leading-snug break-words [overflow-wrap:anywhere]">
                    {questionSummary?.trim() || '—'}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6 min-h-0 flex flex-col flex-1 overflow-hidden">
            {useCards ? (
              <div className="space-y-3 max-h-[min(52vh,22rem)] overflow-y-auto no-scrollbar">
                {qaPairs.map((pair, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden ring-1 ring-slate-100/80"
                  >
                    <div className="bg-gradient-to-br from-slate-50 to-white px-4 py-3 border-b border-slate-100">
                      <p className="text-[11px] font-bold text-slate-400 mb-1">
                        질문 {idx + 1}
                      </p>
                      <p className="text-sm font-bold text-fixie-steel leading-snug [overflow-wrap:anywhere]">
                        {pair.question}
                      </p>
                    </div>
                    <div className="px-4 py-3 bg-white">
                      <p className="text-[10px] font-bold text-theme-primary/70 mb-1.5">
                        답변 요약
                      </p>
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">
                        {pair.answer}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 shrink-0">
                <div className="prose prose-slate max-w-none prose-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {summaryText}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            <div className="flex gap-3 shrink-0 pt-1">
              <button
                type="button"
                onClick={copySummary}
                className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
              >
                <ClipboardCheck size={18} /> 클립보드 복사
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onShare();
                }}
                className="flex-1 py-4 bg-theme-primary text-white font-bold rounded-2xl hover:bg-theme-primary/90 transition-all shadow-lg shadow-theme-primary/20 flex items-center justify-center gap-2"
              >
                <Share2 size={18} /> 친구에게 공유
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
  );
};
