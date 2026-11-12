'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { PageSkeleton } from './PageSkeleton';
import { useToast } from '@/components/ToastProvider';

export function EnvToggle({ initialIsSandbox, kycStatus }: { initialIsSandbox: boolean, kycStatus?: string }) {
  const [isSandbox, setIsSandbox] = useState(initialIsSandbox);
  const [isPending, startTransition] = useTransition();
  const [showSkeleton, setShowSkeleton] = useState(false);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    const handleEnvLoaded = () => setShowSkeleton(false);
    window.addEventListener('envloaded', handleEnvLoaded);
    return () => window.removeEventListener('envloaded', handleEnvLoaded);
  }, []);

  const toggleEnv = (targetMode: 'live' | 'sandbox') => {
    if (targetMode === 'live' && kycStatus && kycStatus !== 'VERIFIED') {
      toast.error('Selesaikan verifikasi KYC terlebih dahulu untuk mengakses mode Live.');
      return;
    }
    
    const newValue = targetMode === 'sandbox';
    if (isSandbox === newValue) return;

    setIsSandbox(newValue);
    document.cookie = `kitapay_env=${newValue ? 'sandbox' : 'live'}; path=/; max-age=31536000`;
    
    setShowSkeleton(true);
    startTransition(() => {
      router.refresh();
    });

    // Failsafe
    setTimeout(() => {
      setShowSkeleton(false);
    }, 2000);
  };

  const isTransitioning = isPending || showSkeleton;

  return (
    <>
      <div className="flex items-center space-x-3 bg-slate-100 rounded-full p-1 border border-slate-200">
        <button
          onClick={() => toggleEnv('live')}
          disabled={isTransitioning}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
            !isSandbox ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
          } ${kycStatus !== 'VERIFIED' && isSandbox ? 'opacity-50 cursor-not-allowed' : ''} ${isTransitioning ? 'opacity-50 cursor-wait' : ''}`}
          title={kycStatus !== 'VERIFIED' ? 'Selesaikan KYC untuk mode Live' : 'Pindah ke mode Live'}
        >
          Live
        </button>
        <button
          onClick={() => toggleEnv('sandbox')}
          disabled={isTransitioning}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
            isSandbox ? 'bg-yellow-400 text-yellow-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          } ${isTransitioning ? 'opacity-50 cursor-wait' : ''}`}
        >
          Sandbox
        </button>
      </div>

      {isTransitioning && (
        <div className="fixed top-0 right-0 bottom-0 left-0 sm:left-64 z-9999 bg-slate-50 p-8 overflow-hidden pointer-events-none">
          <PageSkeleton />
        </div>
      )}
    </>
  );
}
