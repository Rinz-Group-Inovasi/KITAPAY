'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, X } from '@phosphor-icons/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const success = useCallback((msg: string) => addToast(msg, 'success'), [addToast]);
  const error = useCallback((msg: string) => addToast(msg, 'error'), [addToast]);
  const info = useCallback((msg: string) => addToast(msg, 'info'), [addToast]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ success, error, info }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-9999 flex flex-col gap-3 pointer-events-none w-full max-w-sm">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={cn(
              "flex items-center gap-3 p-4 rounded-2xl shadow-lg min-w-64 max-w-sm pointer-events-auto transform transition-all duration-300 animate-in slide-in-from-right-10 fade-in",
              toast.type === 'success' ? "bg-white border border-green-200 text-slate-800" :
              toast.type === 'error' ? "bg-red-500 text-white shadow-red-500/20" :
              "bg-white border border-slate-200 text-slate-800"
            )}
          >
            {toast.type === 'success' && <CheckCircle weight="fill" className="w-6 h-6 text-green-500" />}
            {toast.type === 'error' && <XCircle weight="fill" className="w-6 h-6 text-white" />}
            
            <p className="flex-1 text-sm font-semibold">{toast.message}</p>
            
            <button 
              onClick={() => removeToast(toast.id)}
              className={cn(
                "p-1 rounded-md opacity-70 hover:opacity-100 transition-opacity",
                toast.type === 'error' ? "hover:bg-red-600" : "hover:bg-slate-100"
              )}
            >
              <X weight="bold" className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
