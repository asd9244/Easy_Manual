import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import type { Device } from '@/src/types/index';

interface GuideDevicePickModalProps {
  isOpen: boolean;
  devices: Device[];
  onSelect: (device: Device) => void;
  onClose: () => void;
}

export const GuideDevicePickModal: React.FC<GuideDevicePickModalProps> = ({
  isOpen,
  devices,
  onSelect,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end md:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="guide-device-pick-title"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="w-full max-w-md bg-white rounded-t-3xl md:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 id="guide-device-pick-title" className="text-base font-bold text-slate-800">
                어떤 기기로 가이드를 받을까요?
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
                aria-label="닫기"
              >
                <X size={20} />
              </button>
            </div>
            <ul className="overflow-y-auto p-3 space-y-2">
              {devices.map((device) => (
                <li key={String(device.id)}>
                  <button
                    type="button"
                    onClick={() => onSelect(device)}
                    className="w-full text-left px-4 py-3.5 rounded-2xl border border-slate-100 bg-slate-50/80 hover:border-theme-primary/40 hover:bg-theme-primary/5 transition-colors"
                  >
                    <p className="font-bold text-slate-800 text-sm">
                      {(device.alias && device.alias.trim()) || device.name}
                    </p>
                    {device.model ? (
                      <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{device.model}</p>
                    ) : null}
                    {device.productType ? (
                      <p className="text-[10px] text-theme-primary font-bold mt-1 uppercase tracking-wide">
                        {device.productType}
                      </p>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
