import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Send,
  ChevronRight,
  Plus,
  WashingMachine,
  Play,
  Wind,
  Tv,
  Type,
  Camera,
  QrCode,
} from "lucide-react";

//쪼개놓은 파일들에서 불러오기
import {GlassCard} from "@/src/components/common/GlassCard";
import {TOP_GUIDES} from "@/src/constants/data";
import {Device, Screen} from "@/src/types/index";
import {DeviceStatusCard} from "@/src/components/common/DeviceStatusCard";

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
  return (
    <div className="max-w-3xl mx-auto space-y-10 text-left px-4 md:px-8">
      {/* 1. 상단 헤더 & 프로필 */}
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            내 대시보드
          </h1>
        </div>
        {/* 우측 상단 프로필 이미지 영역 */}
        <div className="w-12 h-12 rounded-full bg-wing-gradient flex items-center justify-center text-white shadow-lg shadow-theme-primary/20 cursor-pointer hover:scale-105 transition-transform">
          <span className="font-bold">U</span>
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

      {/* 4. 자주 찾는 가이드 TOP 5 (검색바 제거됨) */}
      <section className="pb-8">
        <h3 className="font-bold text-lg mb-4 px-1 text-slate-700">
          자주 찾는 가이드 TOP 5
        </h3>
        <div className="space-y-3">
          {[
            {
              title: "세탁기 진수가 안 돼",
              sub: "LG 세탁기 · 2.3천회 조회",
              color: "bg-theme-primary/60",
            },
            {
              title: "TV 화면 깜빡임 현상",
              sub: "삼성 TV · 1.8천회 조회",
              color: "bg-theme-primary/50",
            },
            {
              title: "에어컨 필터 청소 가이드",
              sub: "다이슨 HP07 · 1.5천회 조회",
              color: "bg-theme-primary/40",
            },
            {
              title: "세탁기 진동 심함",
              sub: "LG 세탁기 · 1.2천회 조회",
              color: "bg-theme-primary/30",
            },
            {
              title: "TV 스피커 소리 안 나옴",
              sub: "삼성 TV · 980회 조회",
              color: "bg-theme-primary/20",
            },
          ].map((guide, i) => (
            <motion.div
              key={i}
              whileTap={{scale: 0.99}}
              onClick={() => onGuideClick && onGuideClick(guide.title)}
              className="bg-white/40 backdrop-blur-xl p-4 rounded-3xl flex justify-between items-center shadow-sm border border-white/20 hover:border-theme-primary/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner ${guide.color}`}
                >
                  {i + 1}
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 text-sm">
                    {guide.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    {guide.sub}
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};
