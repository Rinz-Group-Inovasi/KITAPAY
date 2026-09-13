'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getClientMerchantId } from '@/lib/api';
import { useEnv } from '@/components/EnvProvider';
import { createClientBrowser } from '@/lib/supabase/client';
import { Storefront, User, Briefcase, CheckCircle, CaretDown, Check } from '@phosphor-icons/react';
import { Listbox, Transition } from '@headlessui/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const BUSINESS_TYPE_OPTIONS = [
  { id: 'perorangan', name: 'Perorangan / UMKM' },
  { id: 'perseroan', name: 'Perseroan Berbadan Hukum (PT / CV)' }
];

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

export default function ProfileOnboarding() {
  const { user, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const isSandbox = useEnv();

  // Form states
  const [ownerName, setOwnerName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('perorangan');

  const supabase = createClientBrowser();

  useEffect(() => {
    let isMounted = true;
    if (loading) return;
    if (user) {
      const merchantId = getClientMerchantId(user.id);
      const profileKey = `kitapay_profile_${merchantId}`;
      const saved = localStorage.getItem(profileKey);
      
      // Fetch securely via API to bypass RLS
      fetch('/api/merchant/profile')
        .then(res => res.json())
        .then((data) => {
          if (!isMounted) return;
          if (data && !data.error) {
            if (data.business_name && data.business_name !== 'My Business') {
              setBusinessName(data.business_name);
            }
            
            // If already fully set up in DB, we can skip
            if (data.status === 'ACTIVE' || data.business_name !== 'My Business') {
               localStorage.setItem(profileKey, 'synced');
               setChecking(false);
               return;
            }
          }
          
          if (!saved || saved !== 'synced') {
            setIsOpen(true);
          }
          setChecking(false);
        })
        .catch(() => {
          if (isMounted) setChecking(false);
        });
    } else {
      setChecking(false);
    }
    
    return () => { isMounted = false; };
  }, [user, loading]);

  if (checking || !isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const merchantId = getClientMerchantId(user.id);
    const profileKey = `kitapay_profile_${merchantId}`;
    
    // Save to LocalStorage for instant UI updates and to store fields not yet in DB schema
    const profileData = { ownerName, businessName, businessType };
    localStorage.setItem(profileKey, 'synced');
    localStorage.setItem(profileKey + '_data', JSON.stringify(profileData));
    setIsOpen(false);
    
    // Sync with Supabase securely via API!
    await fetch('/api/merchant/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessName, ownerName, businessType })
    });
    
    // Dispatch an event so KYC page can refresh immediately if it's already mounted
    window.dispatchEvent(new Event('profileUpdated'));
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6", isSandbox ? "bg-orange-100 text-orange-500" : "bg-[#00DDFD]/10 text-[#00b5d1]")}>
           <User weight="duotone" className="w-8 h-8" />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Lengkapi Profil Anda</h2>
        <p className="text-sm text-slate-500 mb-6">Sebelum mulai menggunakan KitaPay, beri tahu kami sedikit tentang usaha Anda.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Lengkap Pemilik</label>
            <div className="relative">
              <User weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                required 
                type="text" 
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                placeholder="Sesuai KTP" 
                className={cn(
                  "w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 text-slate-900 font-medium bg-slate-50 focus:bg-white transition-colors",
                  isSandbox ? "focus:ring-orange-500" : "focus:ring-[#00DDFD]"
                )}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Usaha / Bisnis</label>
            <div className="relative">
              <Storefront weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                required 
                type="text" 
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                placeholder="Contoh: Toko Berkah" 
                className={cn(
                  "w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 text-slate-900 font-medium bg-slate-50 focus:bg-white transition-colors",
                  isSandbox ? "focus:ring-orange-500" : "focus:ring-[#00DDFD]"
                )}
              />
            </div>
          </div>
          
          <div className="relative z-50">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tipe Usaha</label>
            <Listbox value={BUSINESS_TYPE_OPTIONS.find(o => o.id === businessType)} onChange={(opt: any) => setBusinessType(opt.id)}>
              <div className="relative">
                <Listbox.Button className={cn(
                  "relative w-full cursor-default rounded-xl bg-slate-50 py-3 pl-10 pr-10 text-left border border-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:bg-white text-slate-900 font-medium transition-colors",
                  isSandbox ? "focus-visible:ring-orange-500" : "focus-visible:ring-[#00DDFD]"
                )}>
                  <Briefcase weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <span className="block truncate">{BUSINESS_TYPE_OPTIONS.find(o => o.id === businessType)?.name}</span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                    <CaretDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  </span>
                </Listbox.Button>
                <Transition as={React.Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                  <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm border border-slate-100">
                    {BUSINESS_TYPE_OPTIONS.map((opt) => (
                      <Listbox.Option key={opt.id} className={({ active }) => `relative cursor-default select-none py-3 pl-10 pr-4 ${active ? 'bg-slate-50 text-slate-900' : 'text-slate-700'}`} value={opt}>
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-bold text-[#00DDFD]' : 'font-medium'}`}>{opt.name}</span>
                            {selected ? (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#00DDFD]">
                                <Check className="h-4 w-4" aria-hidden="true" />
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

          <div className="pt-2">
            <button type="submit" className={cn(
              "w-full rounded-xl py-3.5 font-bold transition-colors flex items-center justify-center gap-2 shadow-sm",
              isSandbox ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-[#00DDFD] text-slate-900 hover:bg-[#00c5e3]"
            )}>
               <span>Simpan Profil</span>
               <CheckCircle weight="bold" className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
