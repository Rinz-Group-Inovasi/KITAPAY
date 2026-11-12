'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { WarningCircle, X } from '@phosphor-icons/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

interface ConfirmModalContextType {
  confirm: (message: React.ReactNode, title?: string) => Promise<boolean>;
}

const ConfirmModalContext = createContext<ConfirmModalContextType | undefined>(undefined);

export function ConfirmModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<React.ReactNode>('');
  const [title, setTitle] = useState('Konfirmasi');
  const [resolvePromise, setResolvePromise] = useState<(value: boolean) => void>();

  const confirm = useCallback((msg: React.ReactNode, titleOverride?: string) => {
    setMessage(msg);
    if (titleOverride) setTitle(titleOverride);
    else setTitle('Konfirmasi');
    
    setIsOpen(true);
    
    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolvePromise) resolvePromise(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolvePromise) resolvePromise(false);
  };

  return (
    <ConfirmModalContext.Provider value={{ confirm }}>
      {children}
      
      {isOpen && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in"
            onClick={handleCancel}
          ></div>
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm relative z-10 animate-in zoom-in-95 fade-in duration-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center shrink-0">
                  <WarningCircle weight="fill" className="w-6 h-6" />
                </div>
                <button 
                  onClick={handleCancel}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  <X weight="bold" className="w-5 h-5" />
                </button>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
              <div className="text-slate-500 text-sm">{message}</div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3 rounded-b-3xl">
              <button
                onClick={handleCancel}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirm}
                className="px-5 py-2.5 text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-colors"
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmModalContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmModalContext);
  if (!context) {
    return {
      confirm: async (msg: React.ReactNode, title?: string) => {
        if (typeof window !== 'undefined') {
          return window.confirm(typeof msg === 'string' ? msg : (title || 'Konfirmasi'));
        }
        return true;
      }
    };
  }
  return context;
}
