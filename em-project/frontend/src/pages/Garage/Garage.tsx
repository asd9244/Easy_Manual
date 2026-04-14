import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { 
  ChevronRight, 
  X, 
  Plus, 
  Type, 
  QrCode, 
  Trash2,
  Search,
  Camera,
  WashingMachine
} from 'lucide-react';
import { Device, Screen } from '@/src/types/index';
import { deviceService } from '@/src/services/deviceService';
import { DeviceStatusCard } from '@/src/components/common/DeviceStatusCard';

interface GarageProps {
  setScreen: (screen: Screen) => void;
  devices: Device[];
  setDevices: React.Dispatch<React.SetStateAction<Device[]>>;
  showGarageOptions: boolean;
  setShowGarageOptions: (show: boolean) => void;
  scannedModel?: string;
  setScannedModel?: (model: string) => void;
  onOpenChat?: (deviceId: number) => void;
}

export const Garage: React.FC<GarageProps> = ({ 
  setScreen, 
  devices, 
  setDevices, 
  showGarageOptions, 
  setShowGarageOptions,
  scannedModel,
  setScannedModel,
  onOpenChat,
}: GarageProps) => {
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [newNickname, setNewNickname] = useState(''); // 별명 수정을 위한 임시 상태

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

  // 대시보드(Home)에서 '모델명 직접 입력' 버튼을 눌렀을 때의 초기 세팅
  useEffect(() => {
    const initialMode = localStorage.getItem('garageInitialMode');
    if (initialMode === 'search') {
      setIsSearching(true);
      setShowGarageOptions(false);
      localStorage.removeItem('garageInitialMode'); // 1회성 사용 후 삭제
    }
  }, []);

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
        model: responseData.representativeModelName || model,
        image: responseData.image || 'https://picsum.photos/seed/appliance/400/400',
        icon: deviceService.getIconByModel(responseData.representativeModelName || model)
      };
      
      setDevices(prev => [...prev, newDevice]);
      setIsSearching(false);
      setSearchQuery('');
      alert("성공적으로 기기가 등록되었습니다! 🎉");
    } catch (error: any) {
      console.error("기기 등록 에러 내역:", error);
      alert(error.message || "기기 등록에 실패했습니다.");
    } finally {
      setIsRegistering(false);
    }
  };





  return (
    <div className="max-w-3xl mx-auto space-y-8 no-scrollbar px-4 md:px-8">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setScreen('home')}
          className="p-2.5 rounded-xl bg-white/90 shadow-sm border border-slate-100 text-slate-600 hover:bg-white hover:text-slate-800 shrink-0 transition-colors"
          aria-label="뒤로 가기"
        >
          <ChevronRight className="rotate-180" size={22} strokeWidth={2.25} />
        </button>
        <h1 className="text-xl font-bold text-slate-800">나의 가전</h1>
      </header>

      {/* 기기 목록: 홈「기기 상태 대시보드」와 동일한 DeviceStatusCard 폭(1열 전체 너비) */}
      <Reorder.Group
        axis="y"
        values={devices}
        onReorder={setDevices}
        className="flex flex-col gap-4 w-full"
      >
        {devices.map((device, idx) => (
          <Reorder.Item
            key={`device-item-${device.id}-${idx}`}
            value={device}
            className="w-full list-none cursor-grab active:cursor-grabbing"
          >
            <DeviceStatusCard
              title={device.name}
              model={device.model}
              icon={device.icon || WashingMachine}
              status="정상"
              lastCheck="오늘"
              filterStatus="양호"
              repairCount="0회"
              onSettingsClick={() => {
                setEditingDevice(device);
                setNewNickname(device.name);
              }}
              onChatClick={() => {
                onOpenChat?.(Number(device.id));
              }}
            />
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
                  { icon: Type, label: "모델명 직접 입력", color: "bg-blue-50 text-blue-500", action: 'search' },
                  { icon: Camera, label: "모델 라벨 스캔", color: "bg-purple-50 text-purple-500", action: 'ocr' },
                  { icon: QrCode, label: "QR 코드 스캔", color: "bg-orange-50 text-orange-500", action: 'qr' }
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
                          setIsSearching(true);
                        }
                        setShowGarageOptions(false);
                    }}
                    className="w-full p-4 flex items-center gap-4 hover:bg-white/80 rounded-3xl transition-all text-left hover:shadow-md group relative overflow-hidden"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${opt.color}`}>
                      <opt.icon size={20} />
                    </div>
                    <span className="font-bold text-fixie-steel">{opt.label}</span>
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
            key="device-edit-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div
              key={`device-edit-modal-container-${editingDevice.id}`}
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
                  value={newNickname} 
                  onChange={(e) => setNewNickname(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-theme-primary/50"
                  placeholder="별명을 입력하세요"
                />
              </div>
              {/* 2. 액션 버튼들 (저장, 취소, 삭제) */}
              <div className="flex flex-col gap-2">
                <button 
                  onClick={async () => {
                    if (!editingDevice) return;
                    try {
                      // [변경 사항 저장] 백엔드 API 호츨
                      await deviceService.updateDeviceAlias(String(editingDevice.id), newNickname);

                      // 기기 목록 업데이트 (UI 즉시 반영)
                      const updatedDevices = devices.map(d => 
                        d.id === editingDevice.id ? { ...d, name: newNickname } : d
                      );
                      setDevices(updatedDevices);
                      
                      setEditingDevice(null);
                      alert('기기 별명이 서버에 정상적으로 업데이트되었습니다.');
                    } catch (error) {
                      alert('기기 정보 변경 중 오류가 발생했습니다.');
                    }
                  }} 
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
                    onClick={async () => {
                      if (!editingDevice) return;
                      
                      if (window.confirm('기기를 삭제하시겠습니까? (과거 대화 내역은 보존됩니다)')) {
                        try {
                          await deviceService.deleteDevice(String(editingDevice.id));
                          
                          // UI 즉시 반영 (상위 상태 업데이트)
                          setDevices(prev => prev.filter(d => String(d.id) !== String(editingDevice.id)));
                          setEditingDevice(null);
                          alert('정상적으로 삭제되었습니다.');
                        } catch (err) {
                          alert('기기 삭제 중 오류가 발생했습니다. 다시 시도해 주세요.');
                        }
                      }
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
              className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white w-full max-w-md h-[85vh] sm:h-[600px] sm:max-h-[90vh] sm:rounded-3xl rounded-t-3xl p-6 shadow-2xl flex flex-col"
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

                {/* 검색 결과 목록 (높이 제한 및 스크롤) */}
                <div className="flex-1 overflow-y-auto px-1 py-2 space-y-4 no-scrollbar">
                  {searchResults.length > 0 ? (
                    searchResults.map((item: any, idx: number) => (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={item.manualId || idx}
                        className="w-full p-4 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-3"
                      >
                        {/* 매뉴얼 헤더 영역 */}
                        <div className="text-left border-b border-slate-200/50 pb-3 pl-1">
                          <p className="text-[10px] font-black text-theme-primary uppercase tracking-wider">{item.productType || 'Appliance'}</p>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">{item.representativeModelName || '제품명 없음'}</p>
                        </div>
                        
                        {/* 세부 지원 모델 및 개별 QR 리스트 영역 */}
                        <div className="space-y-2">
                          {(item.models || []).map((mod: any, mIdx: number) => (
                            <div key={mod.id || `mod-${idx}-${mIdx}`} className="flex items-center justify-between bg-white p-2.5 rounded-2xl shadow-sm border border-white hover:border-theme-primary/20 transition-all group">
                              <div className="flex items-center gap-3">
                                {mod.qrCodeUrl ? (
                                  <div className="w-10 h-10 p-1 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center justify-center shrink-0">
                                    <img src={mod.qrCodeUrl} alt="QR Code" className="max-w-full max-h-full object-contain" />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                    <QrCode size={16} className="text-slate-300" />
                                  </div>
                                )}
                                <p className="text-xs font-bold text-slate-600 group-hover:text-theme-primary transition-colors line-clamp-1">{mod.name}</p>
                              </div>
                              <button 
                                onClick={() => handleRegisterDevice(mod.name)}
                                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-theme-primary flex items-center justify-center text-slate-400 hover:text-white transition-all shrink-0 ml-2"
                                title="이 기기로 등록하기"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
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
                      <p className="text-xs text-slate-400 mb-6 px-10">
                        찾으시는 모델명이 올바른지 다시 확인해 주세요.<br/>(등록된 매뉴얼이 있는 기기만 추가할 수 있습니다)
                      </p>
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