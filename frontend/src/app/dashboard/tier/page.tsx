'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useEnv } from '@/components/EnvProvider';
import { API_BASE_URL, getClientMerchantId } from '@/lib/api';
import { PageSkeleton } from '@/components/PageSkeleton';
import { ShieldCheck, Target, Lightning, Trophy, LockKey, CircleNotch, CaretRight, Question } from '@phosphor-icons/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Link from 'next/link';

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

const ShieldKIcon = React.forwardRef<SVGSVGElement, any>((props, ref) => {
  const { weight, ...rest } = props;
  const maskId = React.useId().replace(/:/g, '');
  
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      width="1em"
      height="1em"
      fill="currentColor"
      {...rest}
    >
      {weight === 'fill' ? (
        <>
          <mask id={maskId}>
            <rect width="256" height="256" fill="white" />
            <path d="M108 88v80M148 88 L108 128 L148 168" stroke="black" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </mask>
          <path d="M208,40H48A16,16,0,0,0,32,56v58.77c0,89.57,75.92,118.81,91.82,124.08a16,16,0,0,0,10.36,0C150.08,233.58,224,204.34,224,114.77V56A16,16,0,0,0,208,40Z" fill="currentColor" mask={`url(#${maskId})`} />
        </>
      ) : weight === 'duotone' ? (
        <>
          <path d="M216,56v58.77c0,85.12-70.56,113-88,118.25-17.44-5.22-88-33.13-88-118.25V56Z" fill="currentColor" opacity="0.2" />
          <path d="M208,48H48A8,8,0,0,0,40,56v58.77c0,85.12,70.56,113,88,118.25,17.44-5.22,88-33.13,88-118.25V56A8,8,0,0,0,208,48ZM200,114.77c0,75.76-61.27,100.86-72,104.53-10.73-3.67-72-28.77-72-104.53V56H200Z" fill="currentColor" />
          <path d="M108 96v64M148 96l-40 32 40 32" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
      ) : (
        <>
          <path d="M208,48H48A8,8,0,0,0,40,56v58.77c0,85.12,70.56,113,88,118.25,17.44-5.22,88-33.13,88-118.25V56A8,8,0,0,0,208,48ZM200,114.77c0,75.76-61.27,100.86-72,104.53-10.73-3.67-72-28.77-72-104.53V56H200Z" fill="currentColor" />
          <path d="M108 96v64M148 96l-40 32 40 32" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
      )}
    </svg>
  );
});
ShieldKIcon.displayName = 'ShieldKIcon';

interface TierData {
  tier: string;
  currentMonthTransactions: number;
  nextTierThreshold: number;
  freeQuota: {
    max: number;
    used: number;
    remaining: number;
  };
}

const TIER_COLORS: Record<string, { bg: string; text: string; ring: string, icon: any, iconColor: string, iconWeight: 'fill' | 'duotone' }> = {
  'KitaPay Rookie': { bg: 'bg-amber-100', text: 'text-amber-800', ring: 'ring-amber-200', icon: ShieldKIcon, iconColor: 'text-amber-600', iconWeight: 'duotone' },
  'KitaPay Silver': { bg: 'bg-zinc-100', text: 'text-zinc-600', ring: 'ring-zinc-300', icon: ShieldKIcon, iconColor: 'text-zinc-500', iconWeight: 'duotone' },
  'KitaPay Gold': { bg: 'bg-yellow-100', text: 'text-yellow-700', ring: 'ring-yellow-300', icon: ShieldKIcon, iconColor: 'text-yellow-500', iconWeight: 'duotone' },
  'KitaPay Platinum': { bg: 'bg-indigo-100', text: 'text-indigo-700', ring: 'ring-indigo-300', icon: ShieldKIcon, iconColor: 'text-indigo-500', iconWeight: 'fill' },
};

export default function TierPage() {
  const { user } = useAuth();
  const isSandbox = useEnv();
  const [data, setData] = useState<TierData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTier() {
      if (!user) return;
      const merchantId = getClientMerchantId(user.id);
      const env = isSandbox ? 'sandbox' : 'live';
      
      try {
        const res = await fetch(`${API_BASE_URL}/tier/${merchantId}?env=${env}`);
        if (res.ok) {
          const d = await res.json();
          setData(d);
        }
      } catch (err) {
        console.error('Failed to fetch tier', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTier();
  }, [user, isSandbox]);

  if (loading) return <PageSkeleton />;
  if (!data) return <div className="p-8 text-center text-slate-500">Failed to load tier data.</div>;

  const currentTheme = TIER_COLORS[data.tier] || TIER_COLORS['KitaPay Rookie'];
  const CurrentIcon = currentTheme.icon;

  const progressPercent = data.nextTierThreshold > 0 
    ? Math.min(100, Math.round((data.currentMonthTransactions / data.nextTierThreshold) * 100))
    : 100;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
         <h1 className="text-2xl font-bold text-slate-900">Level Merchant</h1>
         <p className="text-sm text-slate-500 mt-1">
            Program apresiasi spesial bagi merchant setia KitaPay. Raih kuota penarikan instan gratis tanpa batas!
         </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* Main Badge Card */}
         <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 bg-linear-to-br from-white/0 to-slate-50/50 rounded-bl-[100px] pointer-events-none" />
            
            <div className="flex items-center gap-6 mb-8">
               <CurrentIcon weight={currentTheme.iconWeight} className={cn("w-20 h-20 drop-shadow-md", currentTheme.iconColor)} />
               <div>
                  <p className="text-sm font-bold text-slate-400 tracking-widest uppercase mb-1">Level Saat Ini</p>
                  <h2 className={cn("text-3xl font-black", currentTheme.text)}>{data.tier}</h2>
               </div>
            </div>

            <div>
               <div className="flex justify-between items-end mb-3">
                  <div>
                     <p className="text-sm text-slate-500 font-medium">Total Transaksi (Bulan Ini)</p>
                     <p className="text-xl font-bold text-slate-800">{data.currentMonthTransactions.toLocaleString('id-ID')} <span className="text-xs text-slate-400 font-normal">sukses</span></p>
                  </div>
                  {data.nextTierThreshold > 0 && (
                     <div className="text-right text-xs font-bold text-slate-400">
                        Target: {data.nextTierThreshold.toLocaleString('id-ID')}
                     </div>
                  )}
               </div>

               {data.nextTierThreshold > 0 ? (
                  <>
                     <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                           className={cn("h-full rounded-full transition-all duration-1000", currentTheme.bg.replace('100', '400'))}
                           style={{ width: `${progressPercent}%` }}
                        />
                     </div>
                     <p className="text-xs font-semibold text-slate-500 mt-3 flex items-center gap-1.5">
                        <Target weight="fill" className="w-4 h-4 text-slate-400" />
                        Tinggal {data.nextTierThreshold - data.currentMonthTransactions} transaksi lagi untuk naik level bulan ini!
                     </p>
                  </>
               ) : (
                  <div className="w-full h-3 bg-indigo-100 rounded-full overflow-hidden">
                     <div className="w-full h-full bg-indigo-500" />
                  </div>
               )}
            </div>
         </div>

         {/* Benefits Card (Free Quota) */}
         <div className="bg-[#00DDFD]/5 rounded-3xl p-8 border border-[#00DDFD]/20 relative overflow-hidden flex flex-col justify-center">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#00DDFD]/10 rounded-full blur-2xl" />
            
            <div className="mb-4">
               <h3 className="text-lg font-black text-slate-800 mb-1">Benefit Level Anda</h3>
               <p className="text-sm text-slate-600 leading-relaxed">
                  Sebagai merchant <strong className={currentTheme.text}>{data.tier}</strong>, Anda mendapatkan kuota gratis biaya admin (Rp 2.000) untuk Penarikan Instan ke <strong>semua Bank</strong>!
               </p>
               <p className="text-xs text-slate-500 mt-2 italic">
                  *Khusus penarikan ke Bank Jago, jika kuota habis, Anda tetap menikmati diskon 50% (Rp 1.000).
               </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mt-2">
               <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-700">Sisa Kuota Gratis</span>
                  <span className="text-xs font-bold text-slate-400">{data.freeQuota.used} / {data.freeQuota.max} Dipakai</span>
               </div>
               
               <div className="flex items-end gap-2">
                  <span className="text-4xl font-black text-[#00DDFD]">{data.freeQuota.remaining}x</span>
                  <span className="text-sm font-semibold text-slate-500 mb-1">penarikan gratis</span>
               </div>
               
               <Link href="/dashboard/withdraw" className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors">
                  Tarik Dana Sekarang
                  <CaretRight weight="bold" />
               </Link>
            </div>
         </div>
      </div>

      {/* Info All Tiers */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm">
         <h3 className="font-bold text-slate-800 mb-6 text-lg flex items-center gap-2">
            <Trophy weight="duotone" className="text-yellow-500 w-6 h-6" />
            Daftar Level & Benefit
         </h3>
         <div className="space-y-4">
            
            <div className="flex items-center justify-between p-4 rounded-2xl border border-amber-100 hover:bg-amber-50/50 bg-amber-50/30 transition-colors">
               <div className="flex items-center gap-4">
                  <ShieldKIcon weight="duotone" className="w-12 h-12 text-amber-600 drop-shadow-sm" />
                  <div>
                     <h4 className="font-bold text-amber-900">KitaPay Rookie</h4>
                     <p className="text-xs text-amber-700 font-medium mt-0.5">&lt; 500 Transaksi / bulan</p>
                  </div>
               </div>
               <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00DDFD]/10 text-[#00DDFD] text-xs font-bold">
                     <Lightning weight="fill" /> 1x Gratis ke Semua Bank
                  </span>
               </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
               <div className="flex items-center gap-4">
                  <ShieldKIcon weight="duotone" className="w-12 h-12 text-zinc-500 drop-shadow-sm" />
                  <div>
                     <h4 className="font-bold text-slate-800">KitaPay Silver</h4>
                     <p className="text-xs text-slate-500 font-medium mt-0.5">500 - 999 Transaksi / bulan</p>
                  </div>
               </div>
               <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00DDFD]/10 text-[#00DDFD] text-xs font-bold">
                     <Lightning weight="fill" /> 5x Gratis ke Semua Bank
                  </span>
               </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl border border-yellow-100 hover:bg-yellow-50/50 bg-yellow-50/30 transition-colors">
               <div className="flex items-center gap-4">
                  <ShieldKIcon weight="duotone" className="w-12 h-12 text-yellow-500 drop-shadow-sm" />
                  <div>
                     <h4 className="font-bold text-yellow-900">KitaPay Gold</h4>
                     <p className="text-xs text-yellow-700 font-medium mt-0.5">1.000 - 1.999 Transaksi / bulan</p>
                  </div>
               </div>
               <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-100 text-yellow-700 text-xs font-bold">
                     <Lightning weight="fill" /> 10x Gratis ke Semua Bank
                  </span>
               </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl border border-indigo-100 hover:bg-indigo-50/50 bg-indigo-50/30 transition-colors relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-bl from-indigo-100/50 to-transparent rounded-full -translate-y-10 translate-x-10 blur-xl" />
               <div className="flex items-center gap-4 relative">
                  <ShieldKIcon weight="fill" className="w-12 h-12 text-indigo-500 drop-shadow-md" />
                  <div>
                     <h4 className="font-bold text-indigo-900">KitaPay Platinum</h4>
                     <p className="text-xs text-indigo-700 font-medium mt-0.5">&ge; 2.000 Transaksi / bulan</p>
                  </div>
               </div>
               <div className="text-right relative">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold shadow-sm border border-indigo-500">
                     <Lightning weight="fill" className="text-yellow-300" /> 15x Gratis ke Semua Bank
                  </span>
               </div>
            </div>

         </div>
      </div>
    </div>
  );
}
