// trigger recompile
'use client';

import React, { useState } from 'react';
import { FileText, MagnifyingGlass, Funnel, CheckCircle, Clock, XCircle, X, CircleNotch, Copy } from '@phosphor-icons/react';
import useSWR from 'swr';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getClientMerchantId, createPayment, API_BASE_URL, fetcher } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useEnv } from '@/components/EnvProvider';
import { PageSkeleton } from '@/components/PageSkeleton';
import { useToast } from '@/components/ToastProvider';

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

export default function InvoicePage() {
  const { user } = useAuth();
  const isSandbox = useEnv();
  const toast = useToast();

  const merchantId = user ? getClientMerchantId(user.id) : null;
  const env = isSandbox ? 'sandbox' : 'live';

  const { data, isLoading: loading, mutate } = useSWR(
    merchantId && user ? `${API_BASE_URL}/merchant/invoices/${merchantId}?env=${env}` : null,
    fetcher,
    { refreshInterval: 30000 }
  );

  const invoices = data?.invoices || [];
  const chargeFeeToCustomer = data?.chargeFeeToCustomer || false;

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [amount, setAmount] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [createdLink, setCreatedLink] = useState('');

  let calculatedGross = Number(amount) || 0;
  if (chargeFeeToCustomer && calculatedGross > 0) {
      if (calculatedGross <= 100000) {
          calculatedGross += 1500;
      } else {
          calculatedGross = Math.ceil(calculatedGross / 0.985);
      }
  }

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreating(true);
    setCreatedLink('');
    try {
      const res = await createPayment({
        merchantId: getClientMerchantId(user.id),
        amount: Number(amount),
        customerEmail: email,
        customerWhatsapp: whatsapp,
        paymentMethod: 'QRIS'
      });
      const link = `${window.location.origin}/checkout/${res.transactionId}`;
      setCreatedLink(link);
      toast.success('Invoice berhasil dibuat!');
      mutate(); // Refresh list
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setCreating(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(createdLink);
    toast.success('Link disalin ke clipboard!');
    setIsCreateOpen(false);
    setCreatedLink('');
    setAmount(''); setEmail(''); setWhatsapp('');
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className={cn("w-6 h-6", isSandbox ? "text-orange-500" : "text-[#00DDFD]")} />
            Invoice
          </h1>
          <p className="text-slate-500 text-sm mt-1">Kelola dan pantau semua invoice dan link pembayaran yang Anda buat.</p>
        </div>
        <button 
          onClick={() => { setAmount(''); setEmail(''); setWhatsapp(''); setCreatedLink(''); setIsCreateOpen(true); }}
          className={cn(
            "flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm w-full sm:w-auto justify-center",
            isSandbox ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-[#00DDFD] text-slate-900 hover:bg-[#00c5e3]"
          )}
        >
          <span>Buat Invoice Baru</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50/50">
          <div className="relative w-full sm:w-96">
            <MagnifyingGlass weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari ID invoice atau pelanggan..." 
              className={cn(
                "w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 text-slate-900",
                isSandbox ? "focus:ring-orange-500" : "focus:ring-[#00DDFD]"
              )}
            />
          </div>
          <button className="flex items-center space-x-2 text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 w-full sm:w-auto justify-center">
            <Funnel weight="bold" className="w-4 h-4" />
            <span>Saring</span>
          </button>
        </div>

        {/* Desktop List */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">ID Invoice</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Tanggal Dibuat</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Nominal</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="py-4 px-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length > 0 ? (
                invoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-800 text-sm">{inv.external_id}</div>
                      <div className="text-xs text-slate-500 mt-0.5">ID: {inv.id.substring(0, 8)}...</div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">
                      {new Date(inv.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-4 px-6 text-sm font-bold text-slate-800">
                      Rp {new Intl.NumberFormat('id-ID').format(inv.amount)}
                    </td>
                    <td className="py-4 px-6">
                      <span className={cn(
                        'text-xs font-bold px-3 py-1.5 rounded-lg flex items-center w-fit space-x-1.5',
                        (inv.status === 'PAID' || inv.status === 'COMPLETED') && (isSandbox ? 'bg-orange-500/10 text-orange-600' : 'bg-[#00DDFD]/10 text-[#00b5d1]'),
                        inv.status === 'PENDING' && 'bg-yellow-100 text-yellow-700',
                        inv.status === 'EXPIRED' && 'bg-red-100 text-red-700'
                      )}>
                        {(inv.status === 'PAID' || inv.status === 'COMPLETED') && <CheckCircle weight="fill" className="w-3 h-3" />}
                        {inv.status === 'PENDING' && <Clock weight="bold" className="w-3 h-3" />}
                        {inv.status === 'EXPIRED' && <XCircle weight="fill" className="w-3 h-3" />}
                        <span>{inv.status}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <a href={`/checkout/${inv.id}`} target="_blank" rel="noreferrer" className={cn(
                        "text-sm font-medium transition-colors",
                        isSandbox ? "text-orange-500 hover:text-orange-600" : "text-[#00DDFD] hover:text-[#00c5e3]"
                      )}>
                        Buka Link
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <MagnifyingGlass weight="duotone" className="w-8 h-8 text-slate-300 mb-3" />
                      <p>Tidak ada invoice ditemukan</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile List (Card View) */}
        <div className="md:hidden flex flex-col p-4 space-y-3">
          {invoices.length > 0 ? (
            invoices.map((inv: any) => (
              <div key={inv.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-slate-800 text-sm">{inv.external_id}</div>
                    <div className="text-xs text-slate-500 mt-0.5">ID: {inv.id.substring(0, 8)}...</div>
                  </div>
                  <span className={cn(
                    'text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center space-x-1',
                    (inv.status === 'PAID' || inv.status === 'COMPLETED') && (isSandbox ? 'bg-orange-500/10 text-orange-600' : 'bg-[#00DDFD]/10 text-[#00b5d1]'),
                    inv.status === 'PENDING' && 'bg-yellow-100 text-yellow-700',
                    inv.status === 'EXPIRED' && 'bg-red-100 text-red-700'
                  )}>
                    {(inv.status === 'PAID' || inv.status === 'COMPLETED') && <CheckCircle weight="fill" className="w-3 h-3" />}
                    {inv.status === 'PENDING' && <Clock weight="bold" className="w-3 h-3" />}
                    {inv.status === 'EXPIRED' && <XCircle weight="fill" className="w-3 h-3" />}
                    <span>{inv.status}</span>
                  </span>
                </div>
                
                <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                  <div className="text-xs text-slate-500">
                    {new Date(inv.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-sm font-black text-slate-800">
                    Rp {new Intl.NumberFormat('id-ID').format(inv.amount)}
                  </div>
                </div>
                
                <a href={`/checkout/${inv.id}`} target="_blank" rel="noreferrer" className={cn(
                  "mt-2 w-full text-center py-2 rounded-xl text-sm font-bold transition-colors",
                  isSandbox ? "bg-orange-50 text-orange-600 hover:bg-orange-100" : "bg-cyan-50 text-cyan-600 hover:bg-cyan-100"
                )}>
                  Buka Link
                </a>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-100">
              <MagnifyingGlass weight="duotone" className="w-8 h-8 text-slate-300 mb-3" />
              <p className="font-medium text-slate-700">Tidak ada invoice</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-1000 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-100 shadow-xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setIsCreateOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X weight="bold" className="w-5 h-5"/></button>
            <h2 className="text-xl font-bold mb-4 text-black">Buat Invoice Baru</h2>
            
            {createdLink ? (
               <div className="space-y-4">
                  <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 text-center">
                     <CheckCircle weight="fill" className="w-8 h-8 mx-auto mb-2 text-green-600" />
                     <p className="font-bold">Invoice Berhasil Dibuat!</p>
                     <p className="text-sm mt-1">Bagikan link ini ke pelanggan Anda untuk menerima pembayaran.</p>
                  </div>
                  <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                     <input type="text" readOnly value={createdLink} className="flex-1 bg-transparent text-sm text-slate-600 outline-none truncate px-2" />
                  </div>
                  <button onClick={copyLink} className={cn(
                    "w-full rounded-xl py-3 font-bold flex justify-center items-center gap-2",
                    isSandbox ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-[#00DDFD] text-slate-900 hover:bg-[#00c5e3]"
                  )}>
                     <Copy weight="bold" className="w-4 h-4" />
                     <span>Salin Link</span>
                  </button>
               </div>
            ) : (
               <form onSubmit={handleCreateInvoice} className="space-y-4">
                  <div>
                     <label className="block text-sm font-bold text-black mb-2">Nominal (Rp)</label>
                     <input required type="number" min="1000" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Contoh: 150000" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-[#00DDFD] focus:ring-1 focus:ring-[#00DDFD] text-black font-semibold bg-white placeholder-slate-500" />
                     {chargeFeeToCustomer && Number(amount) > 0 && (
                       <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                         Pelanggan akan ditagih sebesar <strong>Rp {new Intl.NumberFormat('id-ID').format(calculatedGross)}</strong>.<br/>
                         Anda akan menerima bersih <strong>Rp {new Intl.NumberFormat('id-ID').format(Number(amount))}</strong>.
                       </div>
                     )}
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-black mb-2">Email Pelanggan</label>
                     <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Contoh: pelanggan@email.com" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-[#00DDFD] focus:ring-1 focus:ring-[#00DDFD] text-black font-semibold bg-white placeholder-slate-500" />
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-black mb-2">WhatsApp Pelanggan (Opsional)</label>
                     <input type="text" placeholder="Contoh: 081234567890" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-[#00DDFD] focus:ring-1 focus:ring-[#00DDFD] text-black font-semibold bg-white placeholder-slate-500" />
                  </div>
                  <button disabled={creating} type="submit" className="w-full bg-slate-900 text-white rounded-xl py-3 font-semibold hover:bg-slate-800 flex justify-center items-center">
                    {creating ? <CircleNotch weight="bold" className="w-5 h-5 animate-spin" /> : 'Buat Link Pembayaran'}
                  </button>
               </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
