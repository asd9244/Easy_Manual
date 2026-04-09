import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { 
  ChevronRight, 
  Settings, 
  X, 
  Plus, 
  Type, 
  QrCode, 
  ScanText,
  Trash2,
  Search 
} from 'lucide-react';
import { Device, Screen } from '@/src/types/index';
import { deviceService } from '@/src/services/deviceService';

interface GarageProps {
  setScreen: (screen: Screen) => void;
  devices: Device[];
  setDevices: React.Dispatch<React.SetStateAction<Device[]>>;
  showGarageOptions: boolean;
  setShowGarageOptions: (show: boolean) => void;
  scannedModel?: string;
  setScannedModel?: (model: string) => void;
}

export const Garage: React.FC<GarageProps> = ({ 
  setScreen, 
  devices, 
  setDevices, 
  showGarageOptions, 
  setShowGarageOptions,
  scannedModel,
  setScannedModel
}: GarageProps) => {
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (scannedModel && isSearching) {
      handleSearch(scannedModel);
      if (setScannedModel) setScannedModel('');
    } else if (scannedModel && !isSearching) {
      setIsSearching(true);
      setTimeout(() => {
        handleSearch(scannedModel);
        if (setScannedModel) setScannedModel('');
      }, 0);
    }
  }, [scannedModel, isSearching]);

  // 검색 API 연동
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await deviceService.searchModels(query);
      setSearchResults(results);
    } catch (error) {
      console.error("모델 검색 실패:", error);
    }
  };

  const handleRegisterDevice = async (model: string) => {
    setIsRegistering(true);
    try {
      const responseData = await deviceService.registerDevice(model);
      
      const newDevice: Device = {
        id: String(responseData.id),
        name: responseData.alias || model,
        model: responseData.model || model,
        image: responseData.image || 'https://picsum.photos/seed/appliance/400/400',
        icon: deviceService.getIconByModel(responseData.model || model)
      };
      
      setDevices(prev => [...prev, newDevice]);
      setIsSearching(false);
      setSearchQuery('');
      alert("성공적으로 기기가 등록되었습니다! 🎉");
    } catch (error) {
      console.error("기기 등록 실패:", error);
      alert("기기 등록에 실패했습니다. 이미 등록된 기기인지 확인해 주세요.");
    } finally {
      setIsRegistering(false);
    }
  };



  return (
    <div className="max-w-3xl mx-auto space-y-8 no-scrollbar px-4 md:px-8">
      <header className="flex items-center gap-4">
        {/* 모바일에서만 보이는 뒤로가기 버튼 */}
        <button 
          onClick={() => setScreen('home')} 
          className="p-2 bg-white rounded-xl shadow-sm md:hidden"
        >
          <ChevronRight className="rotate-180" />
        </button>
        <h1 className="text-xl font-bold">나의 가전</h1>
      </header>

      {/* 기기 목록 (드래그로 순서 변경 가능) */}
      <Reorder.Group 
        axis="y" 
        values={devices} 
        onReorder={setDevices}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {devices.map(device => (
          <Reorder.Item 
            key={device.id} 
            value={device}
            className="bg-white/80 backdrop-blur-md p-4 rounded-3xl flex items-center gap-4 shadow-sm border border-slate-100 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
          >
            <div className="w-20 h-20 rounded-2xl bg-slate-50/50 flex items-center justify-center text-theme-primary pointer-events-none">
              {device.icon ? (
                <device.icon size={40} />
              ) : (
                <img src={device.image} className="w-full h-full rounded-xl object-cover" alt={device.name} />
              )}
            </div>
            <div className="flex-1 pointer-events-none">
              <h4 className="font-bold">{device.name}</h4>
              <p className="text-sm text-slate-500">{device.model}</p>
            </div>
            <button 
              onClick={() => setEditingDevice(device)} 
              className="p-2 text-slate-300 hover:text-theme-primary transition-colors relative z-10"
            >
              <Settings size={20} />
            </button>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {/* 새 기기 추가 버튼 및 옵션 메뉴 */}
      <div className="relative max-w-md w-full">
        <motion.button 
          onClick={() => setShowGarageOptions(!showGarageOptions)}
          className={`w-full h-16 rounded-3xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all duration-300 z-20 relative ${
            showGarageOptions ? 'bg-fixie-steel text-white' : 'bg-wing-gradient text-white'
          }`}
          whileTap={{ scale: 0.98 }}
        >
          {showGarageOptions ? <X /> : <Plus />} 
          {showGarageOptions ? "닫기" : "새 기기 등록하기"}
        </motion.button>

        <AnimatePresence mode="wait">
          {showGarageOptions && (
            <>
              {/* 옵션 카드 등장 애니메이션 */}
              <motion.div 
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="absolute top-full mb-4 left-0 right-0 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-4 space-y-2 z-20 border border-white/50"
              >
                {[
                  { icon: Type, label: "모델명 직접 입력", color: "bg-blue-50 text-blue-500" },
                  { icon: QrCode, label: "QR 코드 스캔", color: "bg-orange-50 text-orange-500" },
                  { icon: ScanText, label: "OCR 라벨 스캔", color: "bg-theme-secondary/10 text-theme-secondary", ocr: true }
                ].map((opt, i) => (
                  <motion.button 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => {
                        if (opt.ocr) {
                          setScreen('scan'); // 라벨 스캔 누르면 스캔 화면으로
                        } else if (opt.label === "모델명 직접 입력") {
                          setIsSearching(true); // 직접 입력 누르면 검색창 열기!
                        }
                        setShowGarageOptions(false); // 버튼 누르면 옵션 메뉴는 닫기
                    }}
                    className="w-full p-4 flex items-center gap-4 hover:bg-white/80 rounded-3xl transition-all text-left hover:shadow-md group relative overflow-hidden"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${opt.color}`}>
                      <opt.icon size={20} />
                    </div>
                    <span className="font-bold text-fixie-steel">{opt.label}</span>
                    {opt.ocr && (
                      <motion.div 
                        className="absolute inset-0 bg-linear-to-r from-transparent via-theme-secondary/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                      />
                    )}
                  </motion.button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

    {/* 기기 관리 모달 */}
    <AnimatePresence>
        {editingDevice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative z-50"
            >
              <h3 className="font-bold text-lg mb-1 text-slate-800">기기 관리</h3>
              <p className="text-sm text-slate-500 mb-6">{editingDevice?.name}의 설정을 변경합니다.</p>
              
      
              {/* 1. 기기 이름 수정 입력칸 */}
              <div className="mb-6">
                <label className="text-xs font-bold text-slate-400 mb-2 block">기기 별명</label>
                <input 
                  type="text" 
                  defaultValue={editingDevice?.name} 
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-theme-primary/50"
                />
              </div>
              {/* 2. 액션 버튼들 (저장, 취소, 삭제) */}
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setEditingDevice(null)} 
                  className="w-full py-3 bg-wing-gradient text-white rounded-xl font-bold shadow-md hover:scale-[0.98] transition-transform"
                >
                  변경사항 저장
                </button>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => setEditingDevice(null)}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                  >
                    취소
                  </button>
                  <button 
                    onClick={() => {
                      // [임시 로직] 목록에서 현재 기기를 빼고 다시 저장한다!
                      setDevices(devices.filter(d => d.id !== editingDevice?.id));
                      setEditingDevice(null);
                    }}
                    className="flex items-center justify-center px-4 py-3 bg-red-50 text-red-500 rounded-xl font-bold hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

       <AnimatePresence>
          {isSearching && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm"
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white w-full max-w-md h-[80vh] sm:h-auto sm:rounded-3xl rounded-t-3xl p-6 shadow-2xl flex flex-col"
              >
                {/* 헤더 & 닫기 버튼 */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-xl text-slate-800">모델명 검색</h3>
                  <button onClick={() => { setIsSearching(false); setSearchQuery(''); }} className="p-2 bg-slate-50 rounded-full text-slate-400">
                    <X size={20} />
                  </button>
                </div>

                {/* 검색 입력창 */}
                <div className="relative mb-6">
                  <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-primary" />
                  <input 
                    type="text" 
                    placeholder="예: 휘센, FQ17..." 
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-3xl pl-12 pr-4 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-theme-primary/50"
                  />
                </div>

                {/* 검색 결과 목록 */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 custom-scrollbar">
                  {searchResults.length > 0 ? (
                    searchResults.map((item, idx) => (
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={idx}
                        onClick={() => handleRegisterDevice(item.model)}
                        className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-theme-primary/5 rounded-3xl border border-slate-100 transition-all group"
                      >
                        <div className="text-left">
                          <p className="text-sm font-bold text-slate-700 group-hover:text-theme-primary transition-colors">{item.model}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">{item.category || 'Appliance'}</p>
                        </div>
                        <Plus size={18} className="text-slate-300 group-hover:text-theme-primary transition-colors" />
                      </motion.button>
                    ))
                  ) : searchQuery.trim() !== '' ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="py-10 text-center"
                    >
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search size={24} className="text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-bold mb-1">검색 결과가 없습니다</p>
                      <p className="text-xs text-slate-400 mb-6 px-10">찾으시는 모델이 목록에 없나요?<br/>직접 정보를 입력하여 등록할 수 있습니다.</p>
                      
                      {/* 수동 입력 폼 토글/버튼 */}
                      <div className="space-y-4 px-4 text-left">
                        <div className="h-[1px] bg-slate-100 w-full mb-6"></div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">Model Name</label>
                          <input 
                            type="text"
                            placeholder="예: LG 휘센 에어컨"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 mt-1.5 focus:outline-none focus:ring-2 focus:ring-theme-primary/30 font-bold text-sm"
                          />
                        </div>
                        <button 
                          onClick={() => handleRegisterDevice(searchQuery)}
                          disabled={isRegistering || !searchQuery.trim()}
                          className="w-full h-12 bg-fixie-steel text-white font-bold rounded-xl shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                        >
                          {isRegistering ? "등록 중..." : "이 모델 직접 등록하기"}
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="text-center text-slate-400 py-10 text-sm font-bold">모델명이나 브랜드를 입력해주세요.</div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </AnimatePresence>
    </div>
  );
};