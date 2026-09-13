'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { requestPayout, getClientMerchantId, API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useEnv } from '@/components/EnvProvider';
import { useToast } from '@/components/ToastProvider';
import { Listbox, Transition } from '@headlessui/react';
import { CaretDown, Check, CreditCard, Clock, X, CircleNotch, CheckCircle, Calendar, ArrowRight, Lightning, WarningCircle } from '@phosphor-icons/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PageSkeleton } from '@/components/PageSkeleton';

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

function BankLogo({ bankName }: { bankName: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  
  useEffect(() => {
    import('idn-finlogos').then(({ getLogo }) => {
      // Create a slug from bankName (e.g. "Bank Central Asia" -> "bca", but usually it's already "BCA" or "MANDIRI")
      const slug = bankName.toLowerCase().replace(/[^a-z0-9]/g, '');
      getLogo(slug).then(res => {
         if (res && res.svg) {
            setSvg(res.svg);
         }
      }).catch(() => {});
    }).catch(() => {});
  }, [bankName]);

  if (!svg) return null;
  return <div className="h-6 flex items-center justify-center [&>svg]:h-full [&>svg]:w-auto object-contain" dangerouslySetInnerHTML={{ __html: svg }} />;
}

export default function WithdrawPage() {
  const { user } = useAuth();
  const isSandbox = useEnv();
  const [balance, setBalance] = useState(0);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [tierData, setTierData] = useState<any>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const [isPayoutOpen, setIsPayoutOpen] = useState(false);
  const [payoutType, setPayoutType] = useState<'SCHEDULED_FREE' | 'INSTANT_PAID'>('SCHEDULED_FREE');
  const [loading, setLoading] = useState(false);

  // Form states
  const [amount, setAmount] = useState('');
  const [bankCode, setBankCode] = useState('BCA');
  const toast = useToast();
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  const fetchData = async () => {
    if (!user) return;
    const merchantId = getClientMerchantId(user.id);
    const env = isSandbox ? 'sandbox' : 'live';

    // Fetch merchant
    const { data: merchant } = await supabase.from('merchants').select('available_balance, sandbox_balance').eq('id', merchantId).single();
    if (merchant) {
      setBalance(isSandbox ? (merchant.sandbox_balance || 0) : (merchant.available_balance || 0));
    }

    // Fetch verified bank accounts from requests via API
    try {
      const bankRes = await fetch(`${API_BASE_URL}/requests/all/${merchantId}?requestType=BANK_ACCOUNT_ADD&env=${env}`);
      if (bankRes.ok) {
        const bankData = await bankRes.json();
        const approvedAccounts = (bankData.requests || []).filter((req: any) => req.status === 'APPROVED');
        if (approvedAccounts.length > 0) {
          const parsedAccounts = approvedAccounts.map((req: any) => ({
            ...req.payload,
            id: req.id
          }));
          setAccounts(parsedAccounts);
          setSelectedAccount(parsedAccounts[0]);
        }
      }

      // Fetch withdrawal history via API
      const historyRes = await fetch(`${API_BASE_URL}/requests/all/${merchantId}?requestType=WITHDRAWAL&env=${env}`);
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        if (historyData.requests) setPayouts(historyData.requests);
      }
      // Fetch Tier Data
      const tierRes = await fetch(`${API_BASE_URL}/tier/${merchantId}?env=${env}`);
      if (tierRes.ok) {
        const t = await tierRes.json();
        setTierData(t);
      }

    } catch (e) {
      console.error('Failed to fetch data', e);
    }
    setIsPageLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user, isSandbox]);

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (Number(amount) > balance) {
      toast.error('Nominal penarikan melebihi saldo yang tersedia.');
      return;
    }

    if (Number(amount) < 10000) {
      toast.error('Minimal penarikan adalah Rp 10.000');
      return;
    }

    if (Number(amount) > 2000000) {
      toast.error('Maksimal penarikan adalah Rp 2.000.000 per transaksi');
      return;
    }
    
    setLoading(true);
    try {
      await requestPayout({
        merchantId: getClientMerchantId(user.id),
        amount: Number(amount),
        payoutType,
        bankCode: selectedAccount.bankName,
        accountNumber: selectedAccount.accountNumber,
        accountName: selectedAccount.accountName
      });
      toast.success('Payout requested successfully!');
      setIsPayoutOpen(false);
      setAmount('');
      fetchData(); // refresh data
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (isPageLoading) return <PageSkeleton />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Tarik Dana</h1>
        <p className="text-slate-500 text-sm mt-1">Kelola pencairan dana Anda dan riwayat penarikan ke rekening bank.</p>
      </div>

      {/* Balances & Quick Actions */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Balance Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-500 font-medium">Saldo Tersedia</p>
            <div className="bg-green-100 text-green-700 px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1">
              <CheckCircle weight="bold" className="w-3 h-3" />
              Siap Ditarik
            </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-800 mb-4">Rp {new Intl.NumberFormat('id-ID').format(balance)}</h3>
          <p className="text-xs text-slate-400">Total akumulasi dari semua transaksi yang berhasil diselesaikan.</p>
        </div>

        {/* Action Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 justify-center">
           <button 
             onClick={() => { fetchData(); setPayoutType('SCHEDULED_FREE'); setAmount(''); setIsPayoutOpen(true); }}
             className="w-full flex items-center justify-between bg-linear-to-r from-[#00DDFD] to-[#00c5e3] text-slate-900 px-4 py-3.5 rounded-xl font-bold hover:shadow-md transition-all">
             <div className="flex items-center gap-3">
                <Calendar weight="duotone" className="w-5 h-5" />
                <div className="text-left">
                   <div className="text-sm">Penarikan Terjadwal (Gratis)</div>
                   <div className="text-xs font-medium opacity-80 mt-0.5">Dana masuk dalam 1-2 hari kerja</div>
                </div>
             </div>
             <ArrowRight weight="bold" className="w-5 h-5 opacity-70" />
           </button>
           
           <button 
             onClick={() => { fetchData(); setPayoutType('INSTANT_PAID'); setAmount(''); setIsPayoutOpen(true); }}
             className="w-full flex items-center justify-between bg-slate-900 text-white px-4 py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-all">
             <div className="flex items-center gap-3">
                <Lightning weight="fill" className="w-5 h-5 text-orange-400" />
                <div className="text-left">
                   <div className="text-sm">Pencairan Instan</div>
                   <div className="text-xs font-medium text-slate-400 mt-0.5">
                     {tierData?.freeQuota?.remaining > 0 
                       ? `Gratis (Sisa ${tierData.freeQuota.remaining} kuota bulan ini)` 
                       : 'Biaya Rp 2.000 per penarikan'}
                   </div>
                </div>
             </div>
             <ArrowRight weight="bold" className="w-5 h-5 text-slate-500" />
           </button>
        </div>
      </section>

      {/* Info Card */}
      <section className="bg-slate-50 border border-slate-200 rounded-2xl p-5 md:p-6 text-sm text-slate-600 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-3 text-base flex items-center gap-2">
          <WarningCircle weight="fill" className="w-5 h-5 text-[#00DDFD]" />
          Informasi Penting Penarikan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <h4 className="font-semibold text-slate-800 mb-1">Batas Nominal (Limit)</h4>
            <ul className="list-disc list-inside space-y-1 opacity-90">
              <li>Minimal penarikan: <strong>Rp 10.000</strong></li>
              <li>Maksimal penarikan: <strong>Rp 2.000.000</strong> per transaksi</li>
              <li>Bisa melakukan penarikan berkali-kali jika saldo mencukupi.</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 mb-1">Ketentuan Waktu & Biaya</h4>
            <ul className="list-disc list-inside space-y-1 opacity-90">
              <li><strong>Terjadwal (Gratis):</strong> Penarikan hanya dapat dilakukan pada hari <strong>Jumat (09.00 - 20.00 WIB)</strong>. Dana akan diproses pada hari Sabtu.</li>
              <li>
                <strong>Instan:</strong> 
                {tierData?.freeQuota?.remaining > 0 
                  ? ` Gratis (${tierData.freeQuota.remaining}x tersisa bulan ini). Diproses saat itu juga.`
                  : ' Rp 2.000 per penarikan. Diproses saat itu juga.'}
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Payouts History */}
      <section>
        <div className="flex items-center justify-between mb-4">
           <h2 className="text-lg font-semibold text-slate-800">Riwayat Penarikan</h2>
        </div>
        {/* Desktop List */}
        <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Waktu Dibuat</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Tujuan</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Tipe</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Nominal</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Status & Info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payouts.length > 0 ? (
                payouts.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-sm text-slate-600 align-top">
                       {new Date(p.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className="py-4 px-6 align-top">
                       <div className="text-sm font-semibold text-slate-800">{p.payload.bankCode} - {p.payload.accountNumber}</div>
                       <div className="text-xs text-slate-500 mt-0.5 uppercase">{p.payload.accountName}</div>
                    </td>
                    <td className="py-4 px-6 align-top">
                       <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                          {p.payload.payoutType === 'INSTANT_PAID' ? 'Instan' : 'Terjadwal'}
                       </span>
                    </td>
                    <td className="py-4 px-6 text-sm font-bold text-slate-800 align-top">
                      Rp {new Intl.NumberFormat('id-ID').format(p.payload.amount)}
                    </td>
                    <td className="py-4 px-6 align-top">
                      <div className="flex flex-col gap-2">
                        <span className={cn(
                          'text-xs font-bold px-3 py-1.5 rounded-lg flex items-center w-fit space-x-1.5',
                          p.status === 'APPROVED' && 'bg-green-100 text-green-700',
                          p.status === 'PENDING' && 'bg-yellow-100 text-yellow-700',
                          p.status === 'REJECTED' && 'bg-red-100 text-red-700'
                        )}>
                          {p.status === 'APPROVED' && <CheckCircle weight="fill" className="w-3.5 h-3.5" />}
                          {p.status === 'PENDING' && <Clock weight="bold" className="w-3.5 h-3.5" />}
                          {p.status === 'REJECTED' && <WarningCircle weight="fill" className="w-3.5 h-3.5" />}
                          <span>{p.status === 'REJECTED' ? 'DITOLAK' : p.status === 'APPROVED' ? 'BERHASIL' : p.status}</span>
                        </span>
                        {p.status === 'REJECTED' && p.notes && (
                          <div className="text-xs bg-red-50 text-red-600 p-2 rounded-lg border border-red-100 font-medium">
                            <span className="font-bold block mb-0.5 text-red-800">Alasan:</span> {p.notes}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <CreditCard weight="duotone" className="w-8 h-8 text-slate-300 mb-3" />
                      <p>Belum ada riwayat penarikan</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile List (Card View) */}
        <div className="md:hidden flex flex-col space-y-3 mt-2">
          {payouts.length > 0 ? (
            payouts.map((p, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{p.payload.bankCode} - {p.payload.accountNumber}</div>
                    <div className="text-xs text-slate-500 mt-0.5 uppercase">{p.payload.accountName}</div>
                  </div>
                  <span className={cn(
                    'text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center space-x-1',
                    p.status === 'APPROVED' && 'bg-green-100 text-green-700',
                    p.status === 'PENDING' && 'bg-yellow-100 text-yellow-700',
                    p.status === 'REJECTED' && 'bg-red-100 text-red-700'
                  )}>
                    {p.status === 'APPROVED' && <CheckCircle weight="fill" className="w-3 h-3" />}
                    {p.status === 'PENDING' && <Clock weight="bold" className="w-3 h-3" />}
                    {p.status === 'REJECTED' && <WarningCircle weight="fill" className="w-3 h-3" />}
                    <span>{p.status === 'REJECTED' ? 'DITOLAK' : p.status === 'APPROVED' ? 'BERHASIL' : p.status}</span>
                  </span>
                </div>
                
                {p.status === 'REJECTED' && p.notes && (
                  <div className="text-xs bg-red-50 text-red-600 p-2 rounded-lg border border-red-100 font-medium">
                    <span className="font-bold block mb-0.5 text-red-800">Alasan Penolakan:</span> {p.notes}
                  </div>
                )}
                
                <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                  <div className="text-xs text-slate-500 flex flex-col gap-1">
                    <span>{new Date(p.created_at).toLocaleString('id-ID')}</span>
                    <span className="font-medium text-slate-600">
                      Tipe: {p.payload.payoutType === 'INSTANT_PAID' ? 'Instan' : 'Terjadwal'}
                    </span>
                  </div>
                  <div className="text-sm font-black text-slate-800">
                    Rp {new Intl.NumberFormat('id-ID').format(p.payload.amount)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-100">
              <CreditCard weight="duotone" className="w-8 h-8 text-slate-300 mb-3" />
              <p className="font-medium text-slate-700">Belum ada riwayat penarikan</p>
            </div>
          )}
        </div>
      </section>

      {/* Payout Modals */}
      {isPayoutOpen && (
        <div className="fixed inset-0 z-1000 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-100 shadow-xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setIsPayoutOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X weight="bold" className="w-5 h-5"/></button>
            <h2 className="text-xl font-bold mb-4 text-black">Tarik Dana {payoutType === 'INSTANT_PAID' ? 'Instan' : 'Terjadwal'}</h2>
            <form onSubmit={handleRequestPayout} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-black">Nominal (Rp)</label>
                    <button type="button" onClick={() => setAmount(balance.toString())} className="text-xs font-bold text-[#00DDFD] hover:text-[#00c5e3] bg-[#00DDFD]/10 px-2.5 py-1 rounded-md transition-colors">Tarik Semua</button>
                  </div>
                  <input 
                    required 
                    type="text" 
                    value={amount ? new Intl.NumberFormat('id-ID').format(Number(amount)) : ''} 
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setAmount(val);
                    }} 
                    placeholder="Contoh: 50.000" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-[#00DDFD] focus:ring-1 focus:ring-[#00DDFD] text-black font-semibold bg-white placeholder-slate-500" 
                  />
                  {payoutType === 'INSTANT_PAID' && (
                    <div className="mt-2 text-xs text-slate-600">
                      {tierData?.freeQuota?.remaining > 0 ? (
                         <div className="bg-[#00DDFD]/10 text-[#00DDFD] p-2 rounded-lg font-bold flex items-center gap-1.5 mb-2 border border-[#00DDFD]/20">
                            <Lightning weight="fill" />
                            GRATIS! Anda memiliki sisa {tierData.freeQuota.remaining}x kuota bebas biaya.
                         </div>
                      ) : selectedAccount?.bankName === 'JAGO' ? (
                         <p className="text-orange-600 font-medium mb-1">Biaya layanan Rp 1.000 (Diskon 50% khusus Bank Jago)</p>
                      ) : (
                         <p className="text-orange-600 font-medium mb-1">Biaya layanan Rp 2.000 (Otomatis dipotong dari nominal)</p>
                      )}
                      
                      {Number(amount) > 0 && (
                        <p>Nominal yang akan ditransfer ke rekening: <strong>Rp {new Intl.NumberFormat('id-ID').format(Math.max(0, Number(amount) - (tierData?.freeQuota?.remaining > 0 ? 0 : (selectedAccount?.bankName === 'JAGO' ? 1000 : 2000))))}</strong></p>
                      )}
                    </div>
                  )}
                  {Number(amount) > balance && (
                    <p className="text-xs text-red-600 mt-1 font-semibold">Nominal melebihi saldo yang Anda miliki (Rp {new Intl.NumberFormat('id-ID').format(balance)})</p>
                  )}
               </div>
               <div>
                  <label className="block text-sm font-bold text-black mb-2">Rekening Tujuan</label>
                  {accounts.length === 0 ? (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-700">
                      Anda belum memiliki rekening bank terverifikasi. Silakan tambahkan di menu Rekening Bank.
                    </div>
                  ) : (
                    <Listbox value={selectedAccount} onChange={setSelectedAccount}>
                      <div className="relative mt-1">
                        <Listbox.Button className="relative w-full cursor-default rounded-xl bg-white py-3 pl-4 pr-10 text-left shadow-sm border border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00DDFD]">
                          <span className="flex items-center gap-3 truncate font-semibold text-black">
                            {selectedAccount?.bankName && (
                               <BankLogo bankName={selectedAccount.bankName} />
                            )}
                            <span>{selectedAccount?.bankName} - {selectedAccount?.accountNumber} ({selectedAccount?.accountName})</span>
                          </span>
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                            <CaretDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
                          </span>
                        </Listbox.Button>
                        <Transition as={React.Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                          <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-1010 border border-slate-100">
                            {accounts.map((acc, accIdx) => (
                              <Listbox.Option key={accIdx} className={({ active }) => `relative cursor-default select-none py-3 pl-10 pr-4 ${active ? 'bg-slate-50 text-slate-900' : 'text-slate-700'}`} value={acc}>
                                {({ selected }) => (
                                  <>
                                    <span className={`flex flex-col truncate ${selected ? 'font-bold' : 'font-medium'}`}>
                                      <span className="flex items-center gap-2">
                                        {acc.bankName && (
                                           <BankLogo bankName={acc.bankName} />
                                        )}
                                        <span>{acc.bankName} - {acc.accountNumber}</span>
                                      </span>
                                      <span className="text-xs text-slate-500 font-normal mt-0.5">{acc.accountName}</span>
                                    </span>
                                    {selected ? (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#00DDFD]">
                                        <Check className="h-5 w-5" aria-hidden="true" />
                                      </span>
                                    ) : null}
                                  </>
                                )}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </Listbox>
                  )}
               </div>
                  <button type="submit" disabled={loading || Number(amount) > balance || accounts.length === 0} className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? <CircleNotch className="w-5 h-5 animate-spin" /> : 'Konfirmasi Penarikan'}
                  </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
