import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronRight,
  Plus,
  WashingMachine,
  Wind,
  Tv,
  Type,
  Camera,
  QrCode,
} from "lucide-react";

import {Device, Screen} from "@/src/types/index";
import {DeviceStatusCard} from "@/src/components/common/DeviceStatusCard";
import {
  fetchGuideTop5,
  getGuideDisplayTitle,
  GUIDE_PRODUCT_TYPE_FILTERS,
  type GuideProductTypeFilter,
  type GuideTop5CategoryItem,
} from "@/src/services/guideService";

const GUIDE_RANK_COLORS = [
  "bg-theme-primary/60",
  "bg-theme-primary/50",
  "bg-theme-primary/40",
  "bg-theme-primary/30",
  "bg-theme-primary/20",
] as const;

// 1. App.tsx에서 넘겨줄 데이터들의 타입을 정의
interface HomeProps {
  setScreen: (screen: Screen) => void;
  devices: Device[];
  sliderRef: React.RefObject<HTMLDivElement | null>;
  sliderConstraints: {left: number; right: number};
  isLoading?: boolean;
  onGuideClick?: (title: string) => void;
  onOpenChat?: (deviceId: number) => void;
}

export const Home: React.FC<HomeProps> = ({
  setScreen,
  devices,
  isLoading,
  onGuideClick,
  onOpenChat,
}) => {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [guideFilter, setGuideFilter] = useState<GuideProductTypeFilter>("전체");
  const [guideTop5, setGuideTop5] = useState<GuideTop5CategoryItem[]>([]);
  const [guideLoading, setGuideLoading] = useState(true);
  const [guideError, setGuideError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setGuideLoading(true);
    setGuideError(null);
    fetchGuideTop5(guideFilter)
      .then((data) => {
        if (!cancelled) setGuideTop5(data.top5 ?? []);
      })
      .catch(() => {
        if (!cancelled) {
          setGuideError("목록을 불러오지 못했습니다.");
          setGuideTop5([]);
        }
      })
      .finally(() => {
        if (!cancelled) setGuideLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [guideFilter]);

  return (
    <div className="max-w-3xl mx-auto space-y-10 text-left px-4 md:px-8">
      {/* 1. 상단 헤더 & 프로필 */}
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            내 대시보드
          </h1>
        </div>
      </header>

      {/* 2. 기기 상태 대시보드 섹션 */}
      <section>
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="text-sm font-bold text-slate-700">
            기기 상태 대시보드
          </h3>
          <button
            onClick={() => setScreen("garage")}
            className="text-theme-primary text-sm font-bold hover:opacity-80 transition-opacity"
          >
            전체 보기
          </button>
        </div>

        {/* 새롭게 바뀐 카드들 */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8 bg-white/20 backdrop-blur-lg rounded-3xl border border-dashed border-white/30">
              <div className="w-8 h-8 border-4 border-theme-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-sm font-bold text-slate-400">
                기기 목록을 불러오는 중...
              </p>
            </div>
          ) : devices.length > 0 ? (
            /* 💡 진짜 devices 창고에서 데이터를 꺼내서 카드를 찍어낸다! */
            devices.map((device, idx) => (
              <DeviceStatusCard
                key={device.id || `home-device-${idx}`}
                title={device.name}
                model={device.model}
                icon={device.icon || WashingMachine} // fallback icon
                status="정상"
                lastCheck="오늘"
                filterStatus="양호"
                repairCount="0회"
                onChatClick={() => {
                  onOpenChat && onOpenChat(Number(device.id));
                }}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-8 bg-white/20 backdrop-blur-lg rounded-3xl border border-dashed border-white/30">
              <p className="text-sm font-bold text-slate-400">
                등록된 기기가 없습니다.
              </p>
            </div>
          )}

          <button
            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
            className={`w-full py-4 mt-2 border-2 border-dashed rounded-3xl flex items-center justify-center gap-2 font-bold transition-all duration-300 backdrop-blur-sm ${
              isAddMenuOpen 
                ? 'border-theme-primary text-theme-primary bg-white/20' 
                : 'border-white/30 text-slate-400 hover:bg-white/20 hover:border-theme-primary hover:text-theme-primary'
            }`}
          >
            <Plus size={20} className={`transition-transform duration-300 ${isAddMenuOpen ? 'rotate-45' : ''}`} />새 기기 추가
          </button>
          
          {/* 새 기기 추가 확장 메뉴 */}
          <AnimatePresence>
            {isAddMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-2 sm:p-3 border border-white/20 shadow-sm flex flex-col sm:flex-row gap-1 sm:gap-3">
                  {[
                    { icon: Type, label: "직접 입력", action: 'search' },
                    { icon: Camera, label: "라벨 스캔", action: 'ocr' },
                    { icon: QrCode, label: "QR 코드 스캔", action: 'qr' }
                  ].map((opt, i) => (
                    <motion.button 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => {
                          if (opt.action === 'qr') {
                            localStorage.setItem('scanInitialMode', 'qr');
                            setScreen('scan');
                          } else if (opt.action === 'ocr') {
                            localStorage.setItem('scanInitialMode', 'ocr');
                            setScreen('scan');
                          } else if (opt.action === 'search') {
                            localStorage.setItem('garageInitialMode', 'search');
                            setScreen("garage");
                          }
                          setIsAddMenuOpen(false);
                      }}
                      className="w-full sm:flex-1 px-4 py-3 sm:py-5 flex sm:flex-col items-center justify-between sm:justify-center hover:bg-white/30 rounded-xl transition-all text-left hover:shadow-sm group relative overflow-hidden sm:gap-3"
                    >
                      <div className="flex sm:flex-col items-center gap-3">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-theme-primary/10 text-theme-primary shadow-sm transition-transform group-hover:scale-110`}>
                          <opt.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <span className="font-bold text-slate-700 text-sm sm:text-center whitespace-nowrap">{opt.label}</span>
                      </div>
                      <ChevronRight size={16} className="text-slate-400 sm:hidden group-hover:text-theme-primary transition-colors" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* 4. 자주 찾는 가이드 TOP 5 */}
      <section className="pb-8">
        <h3 className="font-bold text-lg mb-3 px-1 text-slate-700">
          자주 찾는 가이드 TOP 5
        </h3>
        <div className="flex flex-wrap gap-2 mb-4 px-1">
          {GUIDE_PRODUCT_TYPE_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setGuideFilter(filter)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold border transition-colors ${
                guideFilter === filter
                  ? "bg-theme-primary text-white border-theme-primary shadow-sm"
                  : "bg-white/40 text-slate-600 border-white/30 hover:border-theme-primary/40"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {guideLoading ? (
          <div className="flex flex-col items-center justify-center p-8 bg-white/20 backdrop-blur-lg rounded-3xl border border-dashed border-white/30">
            <div className="w-8 h-8 border-4 border-theme-primary border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-sm font-bold text-slate-400">가이드 순위를 불러오는 중...</p>
          </div>
        ) : guideError ? (
          <p className="text-sm font-bold text-rose-500/90 px-1">{guideError}</p>
        ) : guideTop5.length === 0 ? (
          <p className="text-sm font-bold text-slate-400 px-1">표시할 가이드가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {guideTop5.map((item, i) => {
              const displayTitle = getGuideDisplayTitle(item.category, item.label);
              return (
              <motion.div
                key={`${item.category}-${item.rank}`}
                whileTap={{ scale: 0.99 }}
                onClick={() => onGuideClick && onGuideClick(displayTitle)}
                className="bg-white/40 backdrop-blur-xl p-4 rounded-3xl flex justify-between items-center shadow-sm border border-white/20 hover:border-theme-primary/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner ${GUIDE_RANK_COLORS[i] ?? GUIDE_RANK_COLORS[4]}`}
                  >
                    {item.rank}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-700 text-sm leading-snug">{displayTitle}</h4>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      이 주제 상담 {item.count}건
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </motion.div>
            );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
