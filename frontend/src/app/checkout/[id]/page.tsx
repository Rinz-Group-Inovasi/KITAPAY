'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { simulatePayment, fetcher, API_BASE_URL } from '@/lib/api';
import useSWR from 'swr';
import { CheckCircle2, AlertCircle, Clock, Building, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useToast } from '@/components/ToastProvider';

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

export default function CheckoutPage() {
  const { id } = useParams() as { id: string };
  const toast = useToast();
  const [simulating, setSimulating] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  const { data: transaction, isLoading: loading, mutate, error } = useSWR(
    id ? `${API_BASE_URL}/payments/${id}` : null,
    fetcher,
    { refreshInterval: (data) => (data?.status === 'PENDING' ? 3000 : 0) }
  );

  useEffect(() => {
    if (!transaction || transaction.status !== 'PENDING') return;
    const updateTime = () => {
      const expiry = new Date(transaction.expires_at).getTime();
      const now = new Date().getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        mutate();
      } else {
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [transaction, mutate]);

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      await simulatePayment(id);
      toast.success('Simulation successful! Status changed to PAID.');
      await mutate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to simulate payment');
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00DDFD] animate-spin" />
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-sm w-full">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-800">Ups, Terjadi Kesalahan</h2>
          <p className="text-slate-500 text-sm mt-2">{(error as any)?.message || 'Transaksi tidak ditemukan.'}</p>
        </div>
      </div>
    );
  }

  const isSandbox = transaction.is_sandbox === true;
  const isCompleted = transaction.status === 'COMPLETED' || transaction.status === 'PAID';
  const isExpired = transaction.status === 'EXPIRED';

  return (
    <div className="min-h-dvh bg-[#FAFAFA] flex flex-col items-center py-16 px-4 font-sans selection:bg-[#00DDFD]/30">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
        
        {/* Header / Brand */}
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="p-1 rounded-3xl bg-white ring-1 ring-black/5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] mb-5 inline-block">
            <div className={cn("w-14 h-14 rounded-[1.25rem] flex items-center justify-center bg-linear-to-tr", isSandbox ? "from-orange-100 to-orange-50" : "from-[#00DDFD]/20 to-[#00DDFD]/5")}>
              <span className={cn("font-black text-2xl tracking-tighter", isSandbox ? "text-orange-500" : "text-[#00DDFD]")}>
                {transaction.merchants?.business_name ? transaction.merchants.business_name.charAt(0).toUpperCase() : 'K'}
              </span>
            </div>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
            {transaction.merchants?.business_name || 'KitaPay Merchant'}
          </h1>
          <p className="text-slate-400 text-sm font-medium mt-1.5 tracking-wide">
            Selesaikan pembayaran Anda
          </p>
        </div>

        {/* The Outer Shell (Double-Bezel Architecture) */}
        <div className="p-1.5 rounded-[2.5rem] bg-black/2 ring-1 ring-black/5 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.05)] relative z-10 backdrop-blur-2xl">
          {/* The Inner Core */}
          <div className="bg-white rounded-[2.125rem] shadow-[inset_0_1px_1px_rgba(255,255,255,1)] overflow-hidden relative">
            
            {isSandbox && (
              <div className="absolute top-0 inset-x-0 bg-orange-400 text-white text-[10px] font-black text-center py-1 uppercase tracking-[0.2em] z-20">
                Uji Coba (Sandbox Mode)
              </div>
            )}

            {/* Total Amount Section */}
            <div className="p-10 text-center border-b border-black/4 relative">
              <div className="absolute inset-0 bg-linear-to-b from-black/2 to-transparent pointer-events-none" />
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
                Total Pembayaran
              </p>
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter tabular-nums drop-shadow-sm">
                Rp {new Intl.NumberFormat('id-ID').format(transaction.amount)}
              </h2>
              <div className="mt-5 inline-flex items-center px-5 py-2 rounded-full bg-slate-50 ring-1 ring-slate-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] text-xs font-semibold text-slate-500">
                <span className="truncate max-w-50 sm:max-w-full tracking-wide">ID: {transaction.external_id}</span>
              </div>
            </div>

            {/* Breakdown Section */}
            {(!isCompleted && !isExpired) && (
              <div className="px-8 py-6 border-b border-black/4 bg-slate-50/30">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Subtotal</span>
                    <span className="font-medium text-slate-700">Rp {new Intl.NumberFormat('id-ID').format(transaction.net_amount || transaction.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Biaya Layanan</span>
                    <span className="font-medium text-slate-700">Rp {new Intl.NumberFormat('id-ID').format(transaction.total_deduction || 0)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Content Section */}
            <div className="p-8">
              {isCompleted ? (
                <div className="text-center py-8 animate-in zoom-in-95 duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                  <div className="w-24 h-24 rounded-4xl bg-green-50 ring-1 ring-green-100 flex items-center justify-center mx-auto mb-8 shadow-[0_8px_32px_rgba(34,197,94,0.1)]">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Pembayaran Berhasil!</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-8 font-medium px-4">
                    Terima kasih, dana Anda telah sukses diproses dan diverifikasi oleh merchant.
                  </p>
                  <div className="bg-slate-50 rounded-2xl p-5 ring-1 ring-slate-100/50">
                     <div className="flex justify-between items-center text-sm mb-3">
                       <span className="text-slate-400 font-medium">Waktu Transaksi</span>
                       <span className="font-bold text-slate-700">
                          {new Date(transaction.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                       </span>
                     </div>
                     <div className="flex justify-between items-center text-sm">
                       <span className="text-slate-400 font-medium">Metode</span>
                       <span className="font-bold text-slate-700 uppercase tracking-widest text-xs">{transaction.payment_method}</span>
                     </div>
                  </div>
                </div>
              ) : isExpired ? (
                <div className="text-center py-8 animate-in zoom-in-95 duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                  <div className="w-24 h-24 rounded-4xl bg-red-50 ring-1 ring-red-100 flex items-center justify-center mx-auto mb-8 shadow-[0_8px_32px_rgba(239,68,68,0.1)]">
                    <AlertCircle className="w-12 h-12 text-red-500" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Waktu Habis</h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium px-4">
                    Sesi pembayaran ini telah kedaluwarsa. Silakan minta link baru dari merchant Anda.
                  </p>
                </div>
              ) : (
                <div className="animate-in fade-in duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm font-bold text-slate-900 tracking-wide">Instruksi Pembayaran</h3>
                    <div className="flex items-center text-orange-600 text-xs font-black bg-orange-50 px-3.5 py-1.5 rounded-full ring-1 ring-orange-100/50 tabular-nums">
                      <Clock className="w-3.5 h-3.5 mr-1.5" />
                      {timeLeft}
                    </div>
                  </div>

                  {/* QRIS Double-Bezel Display */}
                  {transaction.payment_method === 'QRIS' ? (
                    <div className="flex flex-col items-center">
                      <div className="p-1.5 rounded-4xl bg-slate-50 ring-1 ring-slate-100 shadow-[0_8px_24px_rgba(0,0,0,0.02)] mb-8">
                        <div className="bg-white p-5 rounded-[1.625rem] shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]">
                           <QRCodeSVG value={transaction.qris_string} size={220} level="M" />
                        </div>
                      </div>
                      <p className="text-[13px] text-slate-500 text-center font-medium leading-relaxed px-4">
                        Buka aplikasi e-wallet atau mobile banking favorit Anda, lalu <strong className="text-slate-800">scan QR Code</strong> di atas.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-slate-50 rounded-4xl ring-1 ring-slate-100 border border-slate-200 border-dashed">
                      <Building className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-sm text-slate-500 font-medium px-6">
                        Instruksi pembayaran untuk metode <strong className="text-slate-700 uppercase tracking-wider">{transaction.payment_method}</strong> sedang dalam pengembangan.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer actions inside the core */}
            <div className="bg-slate-50/50 p-6 border-t border-black/3">
               {transaction.status === 'PENDING' && isSandbox && (
                 <button 
                   onClick={handleSimulate}
                   disabled={simulating}
                   className={cn(
                     "group w-full rounded-full py-4 font-black text-sm tracking-wide transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex items-center justify-center active:scale-[0.98] mb-4 relative overflow-hidden",
                     isSandbox ? "bg-orange-500 text-white shadow-[0_8px_24px_rgba(249,115,22,0.25)] hover:bg-orange-600 hover:shadow-[0_12px_32px_rgba(249,115,22,0.35)]" : "bg-slate-900 text-white shadow-[0_8px_24px_rgba(0,0,0,0.2)] hover:bg-black hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)]"
                   )}
                 >
                   {simulating ? <Loader2 className="w-5 h-5 animate-spin relative z-10" /> : <span className="relative z-10">Simulasikan Bayar</span>}
                   <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] rounded-full" />
                 </button>
               )}
               
               <div className="text-center space-y-1 mt-4">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-bold">Bantuan Transaksi</p>
                  <p className="text-xs text-slate-600 font-medium">CS KitaPay: <strong className="text-slate-800">0812-3456-7890</strong></p>
               </div>
            </div>

          </div>
        </div>

        <div className="mt-8 text-center animate-in fade-in zoom-in-95 duration-1000 delay-300 fill-mode-both ease-[cubic-bezier(0.32,0.72,0,1)]">
           <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">
             Secured by <span className={cn(isSandbox ? "text-orange-500" : "text-[#00DDFD]")}>KitaPay</span>
           </p>
        </div>

      </div>
    </div>
  );
}
