'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { Plus, Buildings, Wallet, Trash, CheckCircle, WarningCircle, X, CaretDown, Check } from '@phosphor-icons/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from '@/lib/supabase/client';
import { getClientMerchantId, API_BASE_URL, fetcher } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { Listbox, Transition } from '@headlessui/react';
import { PageSkeleton } from '@/components/PageSkeleton';
import { getLogo } from 'idn-finlogos';
import useSWR from 'swr';

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

interface BankAccount {
  id: string;
  type: 'BANK' | 'EWALLET';
  bankName: string;
  accountName: string;
  accountNumber: string;
  isPrimary: boolean;
  status: 'VERIFIED' | 'PENDING' | 'REJECTED';
}

const BANK_OPTIONS = [
  { id: 'bank-jago', name: 'Bank Jago', slug: 'jago', type: 'BANK' as const },
  { id: 'bri', name: 'BRI - Bank Rakyat Indonesia', slug: 'bri', type: 'BANK' as const },
  { id: 'bca', name: 'BCA - Bank Central Asia', slug: 'bca', type: 'BANK' as const },
  { id: 'gopay', name: 'GoPay', slug: 'gopay', type: 'EWALLET' as const },
  { id: 'dana', name: 'DANA', slug: 'dana', type: 'EWALLET' as const },
];

const LogoSVG = ({ slug, className }: { slug: string, className?: string }) => {
  return (
    <div className={cn("flex items-center justify-center", className || "w-12 h-6")}>
      <img src={`/logos/${slug}-logo.svg`} alt={slug} className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
    </div>
  );
};

export default function BankAccountsPage() {
  const { user } = useAuth();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedBank, setSelectedBank] = useState(BANK_OPTIONS[0]);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const { data: requestsData, mutate: mutateRequests } = useSWR(user ? `${API_BASE_URL}/requests/all/${getClientMerchantId(user.id)}?requestType=BANK_ACCOUNT_ADD` : null, fetcher, { refreshInterval: 5000 });

  const fetchAccounts = async () => {
    if (!user) return;
    const merchantId = getClientMerchantId(user.id);

    // Fetch from payouts history to extract unique banks used previously (VERIFIED by default)
    const { data: payouts } = await supabase.from('payouts').select('bank_code, account_name, account_number').eq('merchant_id', merchantId);
    
    let historyAccounts: BankAccount[] = [];
    if (payouts) {
      historyAccounts = payouts.map(p => ({
        id: `${p.bank_code}-${p.account_number}`,
        type: 'BANK',
        bankName: p.bank_code,
        accountName: p.account_name,
        accountNumber: p.account_number,
        isPrimary: false,
        status: 'VERIFIED'
      }));
    }

    const requestAccounts: BankAccount[] = (requestsData?.requests || []).map((req: any) => ({
      id: req.id,
      type: req.payload.type,
      bankName: req.payload.bankName,
      accountName: req.payload.accountName,
      accountNumber: req.payload.accountNumber,
      isPrimary: false,
      status: req.status === 'APPROVED' ? 'VERIFIED' : req.status
    }));

    // Sort requestAccounts so the oldest is first, meaning newest will be last and thus overwrite older ones in the Map
    // requestsData is ordered DESC (newest first), so we reverse it
    const sortedRequestAccounts = [...requestAccounts].reverse();

    // Merge and deduplicate (Request Accounts take precedence as they have real status)
    const allAccounts = [...historyAccounts, ...sortedRequestAccounts];
    const uniqueAccounts = Array.from(new Map(allAccounts.map(item => [item.accountNumber, item])).values());
    
    // Ensure at least one VERIFIED account is primary if there are accounts
    if (uniqueAccounts.length > 0 && !uniqueAccounts.find(a => a.isPrimary)) {
      const firstVerified = uniqueAccounts.find(a => a.status === 'VERIFIED');
      if (firstVerified) firstVerified.isPrimary = true;
    }
    
    setAccounts(uniqueAccounts);
    setLoading(false);
  };

  useEffect(() => {
    if (requestsData) {
       fetchAccounts();
    } else if (requestsData === undefined && user) {
       // Still loading
    }
  }, [user, requestsData]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSubmitting) return;
    const merchantId = getClientMerchantId(user.id);
    
    setIsSubmitting(true);
    try {
       const res = await fetch(`${API_BASE_URL}/requests/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            merchantId,
            requestType: 'BANK_ACCOUNT_ADD',
            payload: {
              type: selectedBank.type,
              bankName: selectedBank.name,
              accountName,
              accountNumber,
            }
          })
       });

       if (res.ok) {
          setIsAddOpen(false);
          setAccountNumber('');
          setAccountName('');
          mutateRequests();
       } else {
          const errData = await res.json();
          alert(errData.error || 'Gagal menyimpan rekening');
       }
    } catch (e) {
       console.error('Failed to submit bank account');
    } finally {
       setIsSubmitting(false);
    }
  };

  const removeAccount = async (accountNumberToRemove: string) => {
    if (!user) return;
    
    const accountToDelete = accounts.find(a => a.accountNumber === accountNumberToRemove);
    if (!accountToDelete) return;

    const updated = accounts.filter(a => a.accountNumber !== accountNumberToRemove);
    setAccounts(updated);

    const isRequest = requestsData?.requests?.some((r: any) => r.id === accountToDelete.id);
    if (isRequest) {
        try {
            await fetch(`${API_BASE_URL}/requests/${accountToDelete.id}?merchantId=${getClientMerchantId(user.id)}`, {
                method: 'DELETE'
            });
            mutateRequests();
        } catch (e) {
            console.error('Failed to delete request', e);
            mutateRequests();
        }
    }
  };

  const setPrimary = (accountNumberToPrimary: string) => {
    if (!user) return;
    const updated = accounts.map(a => ({
      ...a,
      isPrimary: a.accountNumber === accountNumberToPrimary
    }));
    setAccounts(updated);

  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Rekening Bank & E-Wallet</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola rekening tujuan untuk penarikan dana Anda.</p>
        </div>
        {!isAddOpen && (
          <button 
            onClick={() => setIsAddOpen(true)}
            className="flex items-center space-x-2 bg-[#00DDFD] text-slate-900 px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#00c5e3] transition-colors shadow-sm w-full sm:w-auto justify-center"
          >
            <Plus weight="bold" className="w-4 h-4" />
            <span>Tambah Rekening</span>
          </button>
        )}
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-1000 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 sm:p-8 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6 sticky top-0 bg-white z-10 pb-2">
              <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                <Buildings weight="duotone" className="w-6 h-6 text-[#00DDFD]" />
                Tambah Rekening Tujuan
              </h2>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors">
                <X weight="bold" className="w-5 h-5"/>
              </button>
            </div>
            
            <form className="space-y-6" onSubmit={handleAddAccount}>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">Pilih Bank / E-Wallet</label>
                     <Listbox value={selectedBank} onChange={setSelectedBank}>
                       <div className="relative mt-1">
                         <Listbox.Button className="relative w-full cursor-default rounded-xl border border-slate-300 bg-white py-3 pl-4 pr-10 text-left focus:outline-none focus-visible:border-[#00DDFD] focus-visible:ring-2 focus-visible:ring-white/75 sm:text-sm text-slate-800 font-semibold shadow-sm hover:border-slate-400 transition-colors">
                           <span className="flex items-center gap-3 truncate">
                              <LogoSVG slug={selectedBank.slug} />
                              {selectedBank.name}
                           </span>
                           <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                             <CaretDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
                           </span>
                         </Listbox.Button>
                         <Transition
                           as={Fragment}
                           leave="transition ease-in duration-100"
                           leaveFrom="opacity-100"
                           leaveTo="opacity-0"
                         >
                           <Listbox.Options className="absolute z-2000 mt-2 max-h-60 w-full overflow-auto rounded-xl bg-white py-2 text-base shadow-2xl ring-1 ring-black/5 focus:outline-none sm:text-sm">
                             {BANK_OPTIONS.map((bank, bankIdx) => (
                               <Listbox.Option
                                 key={bankIdx}
                                 className={({ active }) =>
                                   `relative cursor-pointer select-none py-3 pl-10 pr-4 transition-colors ${
                                     active ? 'bg-slate-50 text-slate-900' : 'text-slate-700'
                                   }`
                                 }
                                 value={bank}
                               >
                                 {({ selected }) => (
                                   <>
                                     <span className={`flex items-center gap-3 truncate ${selected ? 'font-bold text-[#00DDFD]' : 'font-semibold'}`}>
                                       <LogoSVG slug={bank.slug} />
                                       {bank.name}
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
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">Nomor Rekening / No. HP</label>
                     <input required type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Contoh: 1234567890" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-[#00DDFD] focus:ring-1 focus:ring-[#00DDFD] text-slate-800 font-semibold bg-white placeholder-slate-400 shadow-sm transition-colors hover:border-slate-400" />
                  </div>
                  <div className="md:col-span-2">
                     <label className="block text-sm font-bold text-slate-700 mb-2">Nama Pemilik Rekening</label>
                     <input required type="text" value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="Sesuai KTP (Contoh: Budi Santoso)" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-[#00DDFD] focus:ring-1 focus:ring-[#00DDFD] text-slate-800 font-semibold bg-white placeholder-slate-400 shadow-sm transition-colors hover:border-slate-400" />
                  </div>
               </div>
               
               <div className="bg-blue-50/50 border border-blue-100 text-blue-800 text-sm p-4 rounded-xl flex gap-3">
                 <WarningCircle weight="fill" className="w-5 h-5 shrink-0 mt-0.5 text-blue-500" />
                 <p>Pastikan nama pemilik rekening sama dengan nama identitas (KTP) yang terdaftar di sistem kami untuk menghindari penolakan pencairan.</p>
               </div>
  
               <div className="flex flex-col sm:flex-row gap-3 pt-2 sm:justify-end">
                 <button type="button" onClick={() => setIsAddOpen(false)} className="px-6 bg-slate-100 text-slate-700 rounded-xl py-3 font-semibold hover:bg-slate-200 transition-colors order-2 sm:order-1">
                   Batal
                 </button>
                 <button disabled={isSubmitting} type="submit" className="px-8 bg-[#00DDFD] text-slate-900 rounded-xl py-3 font-bold hover:bg-[#00c5e3] shadow-sm transition-colors disabled:opacity-50 order-1 sm:order-2">
                   {isSubmitting ? 'Mengajukan...' : 'Ajukan Rekening'}
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((acc) => (
          <div key={acc.id} className={cn(
            "bg-white rounded-2xl shadow-sm border p-6 flex flex-col justify-between h-48 relative overflow-hidden group transition-all",
            acc.isPrimary ? "border-[#00DDFD]" : "border-slate-200 hover:border-slate-300"
          )}>
            {acc.isPrimary && (
              <div className="absolute top-0 right-0 bg-[#00DDFD] text-slate-900 text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                UTAMA
              </div>
            )}
            
            <div>
              <div className="flex items-center space-x-3 mb-4">
                {(() => {
                  const bankOption = BANK_OPTIONS.find(b => b.name === acc.bankName || b.slug === acc.bankName?.toLowerCase());
                  if (bankOption) {
                    return (
                      <div className="w-12 h-8 rounded-lg bg-white border border-slate-100 shadow-sm flex items-center justify-center px-2">
                        <LogoSVG slug={bankOption.slug} className="w-full h-full" />
                      </div>
                    );
                  }
                  return (
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      acc.type === 'BANK' ? "bg-indigo-50 text-indigo-600" : "bg-teal-50 text-teal-600"
                    )}>
                      {acc.type === 'BANK' ? <Buildings weight="duotone" className="w-6 h-6" /> : <Wallet weight="duotone" className="w-6 h-6" />}
                    </div>
                  );
                })()}
                <div>
                  <h3 className="font-bold text-slate-800">{acc.bankName}</h3>
                  <div className="flex items-center space-x-1 mt-0.5">
                    {acc.status === 'VERIFIED' ? (
                      <CheckCircle weight="fill" className="w-4 h-4 text-green-500" />
                    ) : acc.status === 'REJECTED' ? (
                      <X weight="bold" className="w-4 h-4 text-red-500" />
                    ) : (
                      <WarningCircle weight="fill" className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className={cn(
                      "text-xs font-medium",
                      acc.status === 'VERIFIED' ? "text-green-600" : 
                      acc.status === 'REJECTED' ? "text-red-600" : "text-yellow-600"
                    )}>
                      {acc.status === 'VERIFIED' ? 'Terverifikasi' : 
                       acc.status === 'REJECTED' ? 'Ditolak' : 'Tertunda'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-lg font-mono font-medium text-slate-700 tracking-wider">{acc.accountNumber}</p>
                <p className="text-sm text-slate-500 uppercase">{acc.accountName}</p>
              </div>
            </div>

            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-2">
              {!acc.isPrimary && acc.status === 'VERIFIED' && (
                <button onClick={() => setPrimary(acc.accountNumber)} className="text-xs font-semibold text-slate-500 hover:text-[#00DDFD] bg-slate-100 hover:bg-[#00DDFD]/10 px-3 py-1.5 rounded-lg transition-colors">
                  Jadikan Utama
                </button>
              )}
              <button onClick={() => removeAccount(acc.accountNumber)} className="text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                <Trash weight="bold" className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        
        {!isAddOpen && (
          <div 
            onClick={() => setIsAddOpen(true)}
            className="border-2 border-dashed border-slate-200 rounded-2xl h-48 flex flex-col items-center justify-center text-slate-500 hover:border-[#00DDFD] hover:text-[#00DDFD] hover:bg-[#00DDFD]/5 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-[#00DDFD]/10 flex items-center justify-center mb-3 transition-colors">
              <Plus weight="bold" className="w-6 h-6" />
            </div>
            <span className="font-semibold">Tambah Rekening Baru</span>
          </div>
        )}
      </div>
    </div>
  );
}
