'use client';

import React, { useState, useEffect } from 'react';
import { FileText, PaperPlaneRight, GridFour, DotsThree, X, CircleNotch, ShieldCheck, Code } from '@phosphor-icons/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useRouter } from 'next/navigation';
import { createPayment, requestPayout, getClientMerchantId, API_BASE_URL, fetcher } from '@/lib/api';
import useSWR from 'swr';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useEnv } from '@/components/EnvProvider';
import { PageSkeleton } from '@/components/PageSkeleton';
import { useToast } from '@/components/ToastProvider';

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const isSandbox = useEnv();
  const [isAddFundOpen, setIsAddFundOpen] = useState(false);
  const [isPayoutOpen, setIsPayoutOpen] = useState(false);
  const [payoutType, setPayoutType] = useState<'SCHEDULED_FREE' | 'INSTANT_PAID'>('SCHEDULED_FREE');
  const [actionLoading, setActionLoading] = useState(false);
  const [showVerifiedBadge, setShowVerifiedBadge] = useState(false);
  
  const merchantId = user ? getClientMerchantId(user.id) : null;
  const env = isSandbox ? 'sandbox' : 'live';

  const { data, isLoading: pageLoading, mutate } = useSWR(
    merchantId && user ? `${API_BASE_URL}/merchant/dashboard/${merchantId}?liveUserId=${user.id}&env=${env}` : null,
    fetcher,
    { refreshInterval: 30000 }
  );

  const { data: tierData } = useSWR(
    merchantId && user ? `${API_BASE_URL}/tier/${merchantId}?env=${env}` : null,
    fetcher,
    { refreshInterval: 60000 }
  );

  const balance = data?.balance || 0;
  const pendingBalance = data?.pendingBalance || 0;
  const transactionCount = data?.transactionCount || 0;
  const uangMasuk = data?.uangMasuk || 0;
  const uangKeluar = data?.uangKeluar || 0;
  const kycStatus = data?.kycStatus || 'PENDING';
  const transactions = data?.transactions || [];

  useEffect(() => {
    if (data?.kycStatus === 'VERIFIED') {
      const hasSeen = localStorage.getItem('has_seen_verified_badge');
      if (!hasSeen) {
        setShowVerifiedBadge(true);
        localStorage.setItem('has_seen_verified_badge', 'true');
      }
    }
  }, [data?.kycStatus]);

  // Form states
  const [amount, setAmount] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [bankCode, setBankCode] = useState('BCA');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [chargeFeeToCustomer, setChargeFeeToCustomer] = useState(false);

  useEffect(() => {
    if (data && data.chargeFeeToCustomer !== undefined) {
      setChargeFeeToCustomer(data.chargeFeeToCustomer);
    }
  }, [data]);

  const handleToggleFeeSetting = async () => {
    if (!merchantId) return;
    const newStatus = !chargeFeeToCustomer;
    setChargeFeeToCustomer(newStatus); // optimistic UI
    try {
      await fetch(`${API_BASE_URL}/merchant/settings/${merchantId}?env=${env}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chargeFeeToCustomer: newStatus })
      });
      toast.success(newStatus ? 'Biaya kini dibebankan ke pelanggan' : 'Biaya kini ditanggung merchant');
      mutate();
    } catch (e) {
      setChargeFeeToCustomer(!newStatus); // revert
      toast.error('Gagal menyimpan pengaturan');
    }
  };

  // Kalkulasi gross real-time (Skema Flat Rp 1.500 & 1,5%)
  let calculatedGross = Number(amount) || 0;
  if (chargeFeeToCustomer && calculatedGross > 0) {
      if (calculatedGross <= 100000) {
          calculatedGross += 1500;
      } else {
          calculatedGross = Math.ceil(calculatedGross / 0.985);
      }
  }

  const handleAddFund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setActionLoading(true);
    try {
      const res = await createPayment({
        merchantId: getClientMerchantId(user.id),
        amount: Number(amount),
        customerEmail: email,
        customerWhatsapp: whatsapp,
        paymentMethod: 'QRIS'
      });
      setIsAddFundOpen(false);
      
      const snapUrl = `/snap/${res.transactionId}`;
      const snapWindow = window.open(snapUrl, "KitaPaySnap", "width=400,height=650");
      
      const listener = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'KITAPAY_SNAP_SUCCESS') {
            toast.success('Pembayaran QRIS Berhasil!');
            mutate();
            window.removeEventListener('message', listener);
            if (snapWindow) snapWindow.close();
          } else if (data.type === 'KITAPAY_SNAP_CLOSE') {
            window.removeEventListener('message', listener);
            if (snapWindow) snapWindow.close();
          }
        } catch (e) {}
      };
      
      window.addEventListener('message', listener);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setActionLoading(true);
    try {
      await requestPayout({
        merchantId: getClientMerchantId(user.id),
        amount: Number(amount),
        payoutType,
        bankCode,
        accountNumber,
        accountName
      });
      toast.success('Penarikan dana berhasil diajukan!');
      setIsPayoutOpen(false);
      mutate(); // refresh balance
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (pageLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
        
        {/* Verification Status */}
        {(kycStatus !== 'VERIFIED' || showVerifiedBadge) && (
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Status Verifikasi</h2>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
             <div className="flex flex-col items-center flex-1">
               {kycStatus === 'VERIFIED' ? (
                 <>
                   <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm mb-2 shadow-sm">✓</div>
                   <span className="text-sm font-medium text-slate-700">Terverifikasi</span>
                 </>
               ) : (
                 <>
                   <div className="w-8 h-8 rounded-full bg-yellow-400 text-yellow-900 flex items-center justify-center font-bold text-sm mb-2 shadow-sm">!</div>
                   <span className="text-sm font-medium text-slate-700">Belum Terverifikasi (Sandbox Only)</span>
                   <button onClick={() => router.push('/dashboard/kyc')} className={cn(
                     "mt-3 text-xs px-4 py-1.5 rounded-full font-bold transition-colors",
                     isSandbox ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-[#00DDFD] text-slate-900 hover:bg-[#00c5e3]"
                   )}>Verifikasi Sekarang</button>
                 </>
               )}
             </div>
          </div>
        </section>
        )}

        {/* Ikhtisar (Balances & Stats) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={cn(
            "p-6 rounded-3xl shadow-md border relative overflow-hidden",
            isSandbox ? "bg-linear-to-br from-orange-500 to-orange-400 border-orange-400 text-white" : "bg-linear-to-br from-slate-900 to-slate-800 border-slate-800 text-white"
          )}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-10 translate-x-10 blur-xl pointer-events-none" />
            <div className="relative">
              <p className="text-sm font-medium mb-2 opacity-80">{isSandbox ? 'Saldo Sandbox' : 'Saldo Aktif'}</p>
              <h3 className="text-3xl font-black tracking-tight">
                Rp {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.floor(balance))}
              </h3>
              <p className="text-xs opacity-70 mt-3 font-medium flex items-center gap-1.5">
                 <ShieldCheck weight="fill" className="w-4 h-4" />
                 Bisa ditarik kapan saja
              </p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
            <p className="text-sm text-slate-500 font-medium mb-2">Saldo Tertunda</p>
            <h3 className="text-2xl font-bold text-slate-800">
              Rp {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.floor(pendingBalance))}
            </h3>
            <p className="text-xs text-slate-400 mt-2 font-medium">(Menunggu proses settlement H+1)</p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
            <p className="text-sm text-slate-500 font-medium mb-2">Total Transaksi</p>
            <h3 className="text-2xl font-bold text-slate-800">{new Intl.NumberFormat('id-ID').format(transactionCount)}</h3>
            <p className="text-xs text-slate-400 mt-2 font-medium">(Total pembayaran sukses)</p>
          </div>
        </section>

        {/* Global Settings */}
        <section>
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-lg font-semibold text-slate-800">Pengaturan Toko</h2>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">Bebankan Biaya ke Pelanggan</h3>
              <p className="text-xs text-slate-500">Jika aktif, pelanggan akan menanggung biaya MDR QRIS (nominal yang Anda terima akan utuh).</p>
            </div>
            <button 
              onClick={handleToggleFeeSetting}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                chargeFeeToCustomer ? (isSandbox ? "bg-orange-500" : "bg-[#00DDFD]") : "bg-slate-200"
              )}
            >
              <span className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                chargeFeeToCustomer ? "translate-x-6" : "translate-x-1"
              )} />
            </button>
          </div>
        </section>

        {/* Payout Options */}
        <section>
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-lg font-semibold text-slate-800">Penarikan Dana</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className={cn(
               "p-6 rounded-2xl shadow-md border",
               isSandbox ? "bg-linear-to-br from-orange-500 to-orange-400 text-white border-orange-500" : "bg-linear-to-br from-[#00DDFD] to-[#00c5e3] text-slate-900 border-[#00DDFD]"
             )}>
                <h3 className="text-lg font-bold mb-2">Penarikan Terjadwal (Gratis)</h3>
                <p className="text-sm text-slate-800 mb-6 font-medium">Masuk antrean untuk hari Jumat. Dana akan sampai hari Sabtu. 0% Biaya Admin.</p>
                <button 
                  onClick={() => { setPayoutType('SCHEDULED_FREE'); setAmount(''); setIsPayoutOpen(true); }}
                  className={cn(
                    "bg-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors w-full shadow-sm",
                    isSandbox ? "text-orange-600" : "text-slate-900"
                  )}>
                  Tarik Dana Gratis
                </button>
             </div>
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-2">
                   <h3 className="text-lg font-bold text-slate-800">Settlement Instan</h3>
                   {tierData?.freeQuota?.remaining > 0 ? (
                     <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md">Gratis (Sisa {tierData.freeQuota.remaining}x)</span>
                   ) : (
                     <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-1 rounded-md">Biaya Rp 2.000</span>
                   )}
                </div>
                <p className="text-sm text-slate-500 mb-6">Tersedia Senin-Sabtu 09:00 - 16:00 WIB. Dana masuk seketika.</p>
                <button 
                  onClick={() => { setPayoutType('INSTANT_PAID'); setAmount(''); setIsPayoutOpen(true); }}
                  className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors w-full">
                  Pindahkan Dana Instan
                </button>
             </div>
          </div>
        </section>

        {/* Quick Links */}
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Akses Cepat</h2>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div onClick={() => router.push('/dashboard/invoice')} className="flex flex-col items-center justify-center p-4 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors",
                isSandbox ? "bg-orange-50 text-orange-500 group-hover:bg-orange-100" : "bg-[#00DDFD]/10 text-[#00b5d1] group-hover:bg-[#00DDFD]/20"
              )}>
                <FileText weight="duotone" className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium text-slate-600">Buat Invoice</span>
            </div>
            
            <div onClick={() => router.push('/dashboard/kyc')} className="flex flex-col items-center justify-center p-4 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors",
                isSandbox ? "bg-orange-50 text-orange-500 group-hover:bg-orange-100" : "bg-[#00DDFD]/10 text-[#00b5d1] group-hover:bg-[#00DDFD]/20"
              )}>
                <ShieldCheck weight="duotone" className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium text-slate-600">Verifikasi KYC</span>
            </div>
            
            <div onClick={() => router.push('/dashboard/api-keys')} className="flex flex-col items-center justify-center p-4 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors",
                isSandbox ? "bg-orange-50 text-orange-500 group-hover:bg-orange-100" : "bg-[#00DDFD]/10 text-[#00b5d1] group-hover:bg-[#00DDFD]/20"
              )}>
                <Code weight="duotone" className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium text-slate-600">API & Integrasi</span>
            </div>
          </div>
        </section>

        {/* Recent History */}
        <section>
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-lg font-semibold text-slate-800">Riwayat Terbaru</h2>
             <button className="text-sm font-medium text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 flex items-center space-x-2">
                <GridFour weight="bold" className="w-4 h-4" />
                <span>Saring</span>
             </button>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">ID Eksternal</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Tanggal</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Nominal</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="py-4 px-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 flex items-center space-x-3">
                      <span className="font-medium text-slate-800 text-sm">{row.external_id}</span>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">{new Date(row.created_at).toLocaleDateString()}</td>
                    <td className="py-4 px-6 text-sm font-medium text-slate-800">Rp {new Intl.NumberFormat('id-ID').format(row.net_amount || row.amount)}</td>
                    <td className="py-4 px-6">
                      <span className={cn(
                        'text-xs font-semibold px-3 py-1 rounded-full',
                        (row.status === 'PAID' || row.status === 'COMPLETED') && 'bg-green-100 text-green-700',
                        row.status === 'PENDING' && 'bg-yellow-100 text-yellow-700',
                        row.status === 'EXPIRED' && 'bg-red-100 text-red-700'
                      )}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="text-slate-400 hover:text-slate-600">
                        <DotsThree weight="bold" className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                   <tr><td colSpan={5} className="py-4 text-center text-slate-500">Belum ada transaksi ditemukan</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      {/* Modals */}
      {isAddFundOpen && (
        <div className="fixed inset-0 z-1000 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-100 shadow-xl relative">
            <button onClick={() => setIsAddFundOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X weight="bold" className="w-5 h-5"/></button>
            <h2 className="text-xl font-bold mb-4 text-black">Terima Pembayaran QRIS</h2>
            <form onSubmit={handleAddFund} className="space-y-4">
               <div>
                  <label className="block text-sm font-bold text-black mb-2">Nominal (Rp)</label>
                  <input required type="number" min="1000" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Contoh: 100000" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-[#00DDFD] focus:ring-1 focus:ring-[#00DDFD] text-black font-semibold bg-white placeholder-slate-500" />
                  
                  {chargeFeeToCustomer && Number(amount) > 0 && (
                    <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                      Pelanggan akan ditagih sebesar <strong>Rp {new Intl.NumberFormat('id-ID').format(calculatedGross)}</strong>.<br/>
                      Anda akan menerima bersih <strong>Rp {new Intl.NumberFormat('id-ID').format(Number(amount))}</strong>.
                    </div>
                  )}
               </div>
               <div>
                  <label className="block text-sm font-bold text-black mb-2">Email Anda</label>
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Contoh: anda@email.com" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-[#00DDFD] focus:ring-1 focus:ring-[#00DDFD] text-black font-semibold bg-white placeholder-slate-500" />
               </div>
               <div>
                  <label className="block text-sm font-bold text-black mb-2">WhatsApp</label>
                  <input required type="text" placeholder="Contoh: 081234567890" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-[#00DDFD] focus:ring-1 focus:ring-[#00DDFD] text-black font-semibold bg-white placeholder-slate-500" />
               </div>
               <button disabled={actionLoading} type="submit" className={cn(
                  "w-full rounded-xl py-3 font-bold flex justify-center items-center transition-colors",
                  isSandbox ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-[#00DDFD] text-slate-900 hover:bg-[#00c5e3]"
                )}>
                 {actionLoading ? <CircleNotch weight="bold" className="w-5 h-5 animate-spin" /> : 'Buat Pembayaran QRIS'}
               </button>
            </form>
          </div>
        </div>
      )}

      {isPayoutOpen && (
        <div className="fixed inset-0 z-1000 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-100 shadow-xl relative">
            <button onClick={() => setIsPayoutOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X weight="bold" className="w-5 h-5"/></button>
            <h2 className="text-xl font-bold mb-4 text-black">Tarik Dana {payoutType === 'INSTANT_PAID' ? 'Instan' : 'Terjadwal'}</h2>
            <form onSubmit={handleRequestPayout} className="space-y-4">
               <div>
                  <label className="block text-sm font-bold text-black mb-2">Nominal (Rp)</label>
                  <input required type="number" min="25000" max="2000000" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Contoh: 50000" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-[#00DDFD] focus:ring-1 focus:ring-[#00DDFD] text-black font-semibold bg-white placeholder-slate-500" />
                  {payoutType === 'INSTANT_PAID' && (
                    <div className="mt-2 text-xs text-slate-600">
                      {tierData?.freeQuota?.remaining > 0 ? (
                         <p className="text-green-600 font-medium mb-1">Bebas biaya layanan (Sisa {tierData.freeQuota.remaining} kuota bulan ini)</p>
                      ) : (
                         <p className="text-orange-600 font-medium mb-1">Biaya layanan Rp 2.000 (Otomatis dipotong dari saldo)</p>
                      )}
                      {Number(amount) > 0 && (
                        <p>Nominal yang akan ditransfer ke rekening: <strong>Rp {new Intl.NumberFormat('id-ID').format(Number(amount) - (tierData?.freeQuota?.remaining > 0 ? 0 : 2000))}</strong></p>
                      )}
                    </div>
                  )}
               </div>
               <div>
                  <label className="block text-sm font-bold text-black mb-2">Kode Bank</label>
                  <input required type="text" value={bankCode} onChange={e => setBankCode(e.target.value)} placeholder="Contoh: BCA" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-[#00DDFD] focus:ring-1 focus:ring-[#00DDFD] text-black font-semibold bg-white placeholder-slate-500" />
               </div>
               <div>
                  <label className="block text-sm font-bold text-black mb-2">Nomor Rekening</label>
                  <input required type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Contoh: 1234567890" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-[#00DDFD] focus:ring-1 focus:ring-[#00DDFD] text-black font-semibold bg-white placeholder-slate-500" />
               </div>
               <div>
                  <label className="block text-sm font-bold text-black mb-2">Nama Pemilik Rekening</label>
                  <input required type="text" value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="Contoh: Budi Santoso" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-[#00DDFD] focus:ring-1 focus:ring-[#00DDFD] text-black font-semibold bg-white placeholder-slate-500" />
               </div>
               <button disabled={actionLoading} type="submit" className="w-full bg-slate-900 text-white rounded-xl py-3 font-semibold hover:bg-slate-800 flex justify-center items-center">
                 {actionLoading ? <CircleNotch weight="bold" className="w-5 h-5 animate-spin" /> : 'Konfirmasi Penarikan'}
               </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
