'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useParams } from 'next/navigation';
import { API_BASE_URL, fetcher, simulatePayment } from '@/lib/api';
import { CheckCircle2, Clock, Loader2, AlertCircle, Building, X, ChevronRight, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

export default function SnapPage() {
  const { id } = useParams() as { id: string };
  const [simulating, setSimulating] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [step, setStep] = useState<'checkout' | 'payment'>('checkout');

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

  // Send success message to parent window when transaction is PAID
  useEffect(() => {
    if (transaction?.status === 'PAID' || transaction?.status === 'COMPLETED') {
      const msg = JSON.stringify({
        type: 'KITAPAY_SNAP_SUCCESS',
        payload: { transactionId: transaction.id, externalId: transaction.external_id }
      });
      if (window.opener) window.opener.postMessage(msg, '*');
      if (window.parent && window.parent !== window) window.parent.postMessage(msg, '*');
    }
  }, [transaction?.status]);

  const handleClose = () => {
    const msg = JSON.stringify({ type: 'KITAPAY_SNAP_CLOSE' });
    if (window.opener) window.opener.postMessage(msg, '*');
    if (window.parent && window.parent !== window) window.parent.postMessage(msg, '*');
  };

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      await simulatePayment(id);
      await mutate();
    } catch (err: any) {
      alert(err.message || 'Failed to simulate payment');
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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
        <h2 className="text-lg font-bold text-slate-800">Ups, Terjadi Kesalahan</h2>
        <p className="text-slate-500 text-sm mt-2">{(error as any)?.message || 'Transaksi tidak ditemukan.'}</p>
        <button onClick={handleClose} className="mt-6 px-6 py-2 bg-slate-100 rounded-full text-sm font-semibold hover:bg-slate-200">Tutup</button>
      </div>
    );
  }

  const isSandbox = transaction.is_sandbox === true;
  const isCompleted = transaction.status === 'COMPLETED' || transaction.status === 'PAID';
  const isExpired = transaction.status === 'EXPIRED';

  // Calculate real service fee and subtotal based on the transaction data in the DB
  const serviceFee = transaction.total_deduction || 0;
  const subtotal = transaction.net_amount || (transaction.amount - serviceFee);

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col relative overflow-hidden selection:bg-[#00DDFD]/30">
      
      {/* Top Header */}
      <div className="sticky top-0 z-20 bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center text-sm">
          <img src="/KitaPay Emblem.png" alt="KitaPay Emblem" className="h-6 sm:h-7 w-auto object-contain" />
          <span className="text-slate-300 mx-2">|</span>
          <span className="font-semibold text-slate-700 truncate max-w-[180px]">
            {transaction.merchants?.business_name || 'KitaPay Merchant'}
          </span>
        </div>
        <button onClick={handleClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {isSandbox && (
        <div className="bg-orange-100 text-orange-700 text-[10px] font-bold text-center py-1.5 uppercase tracking-widest border-b border-orange-200 shadow-inner">
          Uji Coba (Sandbox)
        </div>
      )}

      {/* Main Content (Scrollable) */}
      <div className="flex-1 overflow-y-auto pb-6">
        
        {isCompleted ? (
          <div className="bg-white m-4 p-8 rounded-2xl shadow-sm border border-emerald-100 text-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Pembayaran Berhasil!</h3>
            <p className="text-slate-500 text-sm mb-8">Terima kasih, pembayaran Anda telah diterima.</p>
            <button onClick={handleClose} className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">
              Selesai & Tutup
            </button>
          </div>
        ) : isExpired ? (
          <div className="bg-white m-4 p-8 rounded-2xl shadow-sm border border-red-100 text-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Waktu Habis</h3>
            <p className="text-slate-500 text-sm mb-8">Sesi pembayaran ini telah berakhir.</p>
            <button onClick={handleClose} className="w-full py-3.5 bg-slate-100 text-slate-800 rounded-xl font-bold hover:bg-slate-200 transition-colors">
              Tutup
            </button>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            
            {/* Header / Total Section */}
            <div className="bg-[#00DDFD] pt-8 pb-10 px-6 rounded-b-[2rem] shadow-sm mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10 text-center">
                <p className="text-xs font-medium text-white/90 mb-2">Total Pembayaran</p>
                <h2 className="text-3xl font-black text-white tabular-nums">
                  Rp {new Intl.NumberFormat('id-ID').format(transaction.amount)}
                </h2>
                <div className="mt-3 inline-flex px-3 py-1 bg-white/20 rounded-full text-[11px] text-white font-mono font-medium backdrop-blur-sm border border-white/30">
                  ID: {transaction.external_id}
                </div>
              </div>
            </div>

            <div className="px-5 space-y-6">
              
              {/* Checkout Step */}
              {step === 'checkout' && (
                <div className="animate-in slide-in-from-right-4 duration-300">
                  {/* Order Details */}
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-4">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Building className="w-4 h-4 text-slate-400" />
                      Rincian Tagihan
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Subtotal</span>
                        <span className="font-medium text-slate-800">Rp {new Intl.NumberFormat('id-ID').format(subtotal)}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Biaya Layanan</span>
                        <span className="font-medium text-slate-800">Rp {new Intl.NumberFormat('id-ID').format(serviceFee)}</span>
                      </div>
                      <div className="pt-3 border-t border-slate-100 flex justify-between items-center font-bold">
                        <span className="text-slate-800">Total</span>
                        <span className="text-slate-900 text-lg">Rp {new Intl.NumberFormat('id-ID').format(transaction.amount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800 mb-4">Pilih Metode Pembayaran</h3>
                    
                    <label className="flex items-center p-4 border-2 border-[#00DDFD] bg-[#00DDFD]/5 rounded-xl cursor-pointer transition-all">
                      <div className="w-16 h-10 bg-white rounded-lg border border-slate-100 flex items-center justify-center mr-4 shadow-sm px-2">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg" alt="QRIS" className="w-full h-auto object-contain" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800 text-sm">QRIS</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Scan dengan e-Wallet / M-Banking</p>
                      </div>
                      <div className="w-5 h-5 rounded-full border-4 border-[#00DDFD] flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-[#00DDFD] rounded-full" />
                      </div>
                    </label>

                    <button 
                      onClick={() => setStep('payment')}
                      className="w-full mt-6 py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center shadow-lg shadow-slate-900/20 active:scale-[0.98]"
                    >
                      Bayar Sekarang
                    </button>
                  </div>
                </div>
              )}

              {/* Payment Step */}
              {step === 'payment' && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg" alt="QRIS" className="h-4 w-auto object-contain" />
                      Scan QRIS
                    </h3>
                    <div className="flex items-center text-orange-600 text-xs font-bold tabular-nums bg-orange-50 px-2.5 py-1.5 rounded-lg border border-orange-100">
                      <Clock className="w-3.5 h-3.5 mr-1.5" />
                      {timeLeft}
                    </div>
                  </div>

                  {transaction.payment_method === 'QRIS' ? (
                    <div className="flex flex-col items-center">
                      <div className="bg-white p-4 rounded-3xl border-2 border-slate-100 shadow-md mb-6 relative group">
                         <QRCodeSVG value={transaction.qris_string} size={200} level="M" />
                      </div>
                      <p className="text-xs text-slate-500 text-center leading-relaxed font-medium bg-slate-50 p-4 rounded-xl">
                        Buka aplikasi e-Wallet atau Mobile Banking Anda (Gopay, OVO, Dana, BCA, dll), lalu arahkan kamera untuk memindai QR Code di atas.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                      <Building className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">Instruksi untuk {transaction.payment_method}</p>
                    </div>
                  )}

                  {transaction.status === 'PENDING' && isSandbox && (
                    <button 
                      onClick={handleSimulate}
                      disabled={simulating}
                      className="w-full mt-6 rounded-xl py-3.5 font-bold text-sm transition-all flex items-center justify-center bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20 active:scale-[0.98]"
                    >
                      {simulating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simulasikan Pembayaran (Sandbox)'}
                    </button>
                  )}
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {!isCompleted && !isExpired && (
        <div className="py-4 text-center border-t border-slate-100 bg-white z-10">
           <p className="text-[10px] text-slate-400 font-medium">Secured Payment by <span className="font-bold text-slate-600">KitaPay</span></p>
        </div>
      )}
    </div>
  );
}
