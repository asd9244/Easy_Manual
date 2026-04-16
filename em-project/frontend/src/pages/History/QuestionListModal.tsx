import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, MessageCircle, Loader2 } from 'lucide-react';
import { chatService } from '@/src/services/chatService';
import { Message } from '@/src/types/index';

const PAGE_SIZE = 3;
const SCROLL_LOAD_THRESHOLD_PX = 72;

interface QuestionListModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: number;
  deviceLabel: string;
  roomTitle: string;
  onSelectQuestion: (userMessageId: string) => void;
}

export const QuestionListModal: React.FC<QuestionListModalProps> = ({
  isOpen,
  onClose,
  roomId,
  deviceLabel,
  roomTitle,
  onSelectQuestion,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const listScrollRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);
  const filteredLengthRef = useRef(0);

  useEffect(() => {
    if (!isOpen || !roomId) return;
    setSearchQuery('');
    setVisibleCount(PAGE_SIZE);
    setLoading(true);
    chatService
      .getMessages(roomId)
      .then((msgs) => setMessages(msgs))
      .catch((e) => {
        console.error(e);
        setMessages([]);
      })
      .finally(() => setLoading(false));
  }, [isOpen, roomId]);

  const userQuestions = useMemo(() => {
    return messages.filter(
      (m) =>
        m.senderType === 'USER' &&
        m.text &&
        String(m.text).trim().length > 0,
    );
  }, [messages]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return userQuestions;
    return userQuestions.filter((m) =>
      String(m.text).toLowerCase().includes(q),
    );
  }, [userQuestions, searchQuery]);

  filteredLengthRef.current = filtered.length;

  const displayed = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  );

  const hasMore = filtered.length > visibleCount;

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setVisibleCount((c) => {
      const max = filteredLengthRef.current;
      if (c >= max) return c;
      return Math.min(c + PAGE_SIZE, max);
    });
    window.requestAnimationFrame(() => {
      loadingMoreRef.current = false;
    });
  }, []);

  const handleListScroll = useCallback(() => {
    const root = listScrollRef.current;
    if (!root || !hasMore) return;
    const { scrollTop, scrollHeight, clientHeight } = root;
    if (scrollHeight - scrollTop - clientHeight <= SCROLL_LOAD_THRESHOLD_PX) {
      loadMore();
    }
  }, [hasMore, loadMore]);

  /** 스크롤이 안 생기는 경우(질문이 짧을 때)에도 다음 묶음을 불러올 수 있게 표시 */
  const [showLoadMoreButton, setShowLoadMoreButton] = useState(false);
  useEffect(() => {
    const root = listScrollRef.current;
    if (!isOpen || loading || !hasMore || !root) {
      setShowLoadMoreButton(false);
      return;
    }
    const update = () => {
      const { scrollHeight, clientHeight } = root;
      setShowLoadMoreButton(scrollHeight <= clientHeight + 4);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(root);
    return () => ro.disconnect();
  }, [isOpen, loading, hasMore, displayed.length]);

  useEffect(() => {
    if (!isOpen) return;
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, isOpen]);

  const handlePick = (userMessageId: string) => {
    onSelectQuestion(userMessageId);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[220] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl h-[85vh] max-h-[85vh] min-h-0 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-400 mb-0.5">
                  질문 목록
                </p>
                <h3 className="text-lg font-black text-fixie-steel truncate">
                  {roomTitle}
                </h3>
                <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                  {deviceLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 shrink-0"
                aria-label="닫기"
              >
                <X size={22} />
              </button>
            </div>

            <div className="px-4 pt-3 pb-2 shrink-0">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="search"
                  placeholder="질문 검색…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 rounded-xl bg-slate-50 border border-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-theme-primary/20"
                />
              </div>
            </div>

            <div
              ref={listScrollRef}
              onScroll={handleListScroll}
              className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 pb-5 touch-pan-y overscroll-y-contain"
            >
              {loading ? (
                <div className="flex justify-center py-12 text-slate-400">
                  <Loader2 className="animate-spin" size={28} />
                </div>
              ) : displayed.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-10">
                  {userQuestions.length === 0
                    ? '표시할 질문이 없습니다.'
                    : '검색 결과가 없습니다.'}
                </p>
              ) : (
                <ul className="space-y-2">
                  {displayed.map((m) => (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => handlePick(m.id)}
                        className="w-full text-left flex gap-3 p-3 rounded-2xl border border-slate-100 bg-slate-50/80 hover:bg-theme-primary/5 hover:border-theme-primary/20 transition-all"
                      >
                        <MessageCircle
                          size={18}
                          className="text-theme-primary shrink-0 mt-0.5"
                        />
                        <span className="text-sm font-medium text-fixie-steel leading-snug break-words [overflow-wrap:anywhere]">
                          {m.text}
                        </span>
                      </button>
                    </li>
                  ))}
                  {hasMore && (
                    <li className="py-3">
                      {showLoadMoreButton ? (
                        <button
                          type="button"
                          onClick={loadMore}
                          className="w-full py-3 rounded-2xl text-sm font-bold text-theme-primary bg-theme-primary/10 border border-theme-primary/20 hover:bg-theme-primary/15 transition-colors"
                        >
                          다음 {PAGE_SIZE}개 보기
                        </button>
                      ) : (
                        <p className="text-center text-[11px] text-slate-400">
                          아래로 스크롤하면 다음 {PAGE_SIZE}개가 보여요
                        </p>
                      )}
                    </li>
                  )}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
