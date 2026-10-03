'use client';

import React, { useState, useEffect } from 'react';
import { getClientMerchantId } from '@/lib/api';
import { Storefront, User, Briefcase, Warning, CheckCircle, CaretDown, Check } from '@phosphor-icons/react';
import { Listbox, Transition } from '@headlessui/react';
import { useRouter } from 'next/navigation';

const BUSINESS_TYPE_OPTIONS = [
  { id: 'perorangan', name: 'Perorangan / UMKM' },
  { id: 'perseroan', name: 'Perseroan Berbadan Hukum (PT / CV)' }
];
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ToastProvider';
import useSWR from 'swr';
import { API_BASE_URL, fetcher } from '@/lib/api';

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const merchantId = user ? getClientMerchantId(user.id) : null;
  const { data: requestData, mutate: mutateRequest } = useSWR(
    merchantId && user ? `${API_BASE_URL}/requests/latest/${merchantId}?requestType=PROFILE_EDIT` : null,
    fetcher
  );
  
  // Form states
  const [ownerName, setOwnerName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('perorangan');
  const [hasPendingEdit, setHasPendingEdit] = useState(false);

  // Pending states
  const [pendingData, setPendingData] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!user) return;
    
    const merchantId = getClientMerchantId(user.id);
    const profileKey = `kitapay_profile_${merchantId}`;
    const editKey = `kitapay_profile_edit_${merchantId}`;
    
    const savedData = localStorage.getItem(profileKey + '_data');
    const pending = localStorage.getItem(editKey);
    
    if (pending) {
      try {
        const p = JSON.parse(pending);
        setOwnerName(p.ownerName || '');
        setBusinessName(p.businessName || '');
        setBusinessType(p.businessType || 'perorangan');
      } catch(e) {}
    } else if (savedData) {
      try {
        const p = JSON.parse(savedData);
        setOwnerName(p.ownerName || '');
        setBusinessName(p.businessName || '');
        setBusinessType(p.businessType || 'perorangan');
      } catch(e) {}
    }
    
    // Always fetch latest from API
    fetch('/api/merchant/profile')
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data && !data.error) {
           if (data.business_name && data.business_name !== 'My Business') setBusinessName(data.business_name);
           if (data.owner_name) setOwnerName(data.owner_name);
           if (data.business_type) setBusinessType(data.business_type);
        }
        setLoading(false);
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });
      
    return () => { isMounted = false; };
  }, [user]);

  useEffect(() => {
    if (requestData?.status === 'PENDING_REVIEW') {
      setHasPendingEdit(true);
      setPendingData(requestData.payload || null);
    } else {
      setHasPendingEdit(false);
      setPendingData(null);
      
      if (requestData?.status === 'APPROVED' && requestData.payload && user) {
        const merchantId = getClientMerchantId(user.id);
        const profileKey = `kitapay_profile_${merchantId}`;
        const dataKey = `kitapay_profile_${merchantId}_data`;
        const saved = localStorage.getItem(dataKey) || localStorage.getItem(profileKey);
        let savedProfile = null;
        try {
          if (saved && saved !== 'synced') savedProfile = JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
        
        if (!savedProfile || savedProfile.businessName !== requestData.payload.businessName || savedProfile.businessType !== requestData.payload.businessType) {
          localStorage.setItem(dataKey, JSON.stringify(requestData.payload));
          setOwnerName(requestData.payload.ownerName || '');
          setBusinessName(requestData.payload.businessName || '');
          setBusinessType(requestData.payload.businessType || 'perorangan');
          window.dispatchEvent(new Event('profileUpdated'));
        }
      }
    }
  }, [requestData, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSubmitting) return;
    setIsSubmitting(true);
    
    const savedData = localStorage.getItem(`kitapay_profile_${merchantId}_data`);
    let oldProfile = null;
    try { if (savedData) oldProfile = JSON.parse(savedData); } catch(e) {}
    
    const isChangedToPerseroan = oldProfile && oldProfile.businessType !== 'perseroan' && businessType === 'perseroan';
    
    const newProfile = { 
      ownerName, 
      businessName, 
      businessType,
      businessTypeChangedToPerseroan: isChangedToPerseroan
    };
    
    try {
      const res = await fetch(`${API_BASE_URL}/requests/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          email: user.email,
          requestType: 'PROFILE_EDIT',
          payload: newProfile
        })
      });

      if (res.ok) {
        const editKey = `kitapay_profile_edit_${merchantId}`;
        localStorage.setItem(editKey, JSON.stringify(newProfile));
        mutateRequest();
        window.scrollTo(0, 0);
        toast.success('Pengajuan perubahan profil berhasil dikirim ke Admin.');
      } else {
        throw new Error('Gagal mengajukan perubahan profil');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan saat mengajukan perubahan profil.');
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Memuat profil...</div>;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <User weight="duotone" className="w-6 h-6 text-[#00DDFD]" />
          Pengaturan Profil
        </h1>
        <p className="text-slate-500 text-sm mt-1">Kelola informasi data diri dan detail usaha Anda di sini.</p>
      </div>

      {hasPendingEdit && (
        <div className="bg-yellow-50 text-yellow-800 p-6 rounded-2xl border border-yellow-200 space-y-4">
          <div className="flex items-start space-x-4">
             <Warning weight="duotone" className="w-6 h-6 text-yellow-600 shrink-0 mt-0.5" />
             <div>
               <p className="font-bold text-lg">Menunggu Persetujuan Admin</p>
               <p className="mt-1 text-sm text-yellow-700">Pengajuan perubahan profil Anda sedang ditinjau. Form profil terkunci dan tidak dapat diedit lagi hingga pengajuan ini diproses.</p>
             </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-black mb-2">Nama Lengkap Pemilik</label>
            <div className="relative">
              <User weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                required 
                disabled={hasPendingEdit}
                type="text" 
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#00DDFD] focus:ring-1 focus:ring-[#00DDFD] text-black font-semibold bg-white disabled:opacity-60 disabled:cursor-not-allowed" 
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">Pastikan sesuai dengan Kartu Tanda Penduduk (KTP).</p>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-black mb-2">Nama Usaha / Bisnis</label>
            <div className="relative">
              <Storefront weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                required 
                disabled={hasPendingEdit}
                type="text" 
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#00DDFD] focus:ring-1 focus:ring-[#00DDFD] text-black font-semibold bg-white disabled:opacity-60 disabled:cursor-not-allowed" 
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">Nama yang akan muncul di halaman pembayaran (*Checkout*).</p>
          </div>
          
          <div className="relative z-50">
            <label className="block text-sm font-bold text-black mb-2">Tipe Usaha</label>
            <Listbox value={BUSINESS_TYPE_OPTIONS.find(o => o.id === businessType)} onChange={(opt: any) => setBusinessType(opt.id)} disabled={hasPendingEdit}>
              <div className="relative">
                <Listbox.Button className={`relative w-full cursor-pointer rounded-xl bg-white py-3.5 pl-12 pr-10 text-left border border-slate-300 focus:outline-none focus-visible:ring-1 focus-visible:border-[#00DDFD] focus-visible:ring-[#00DDFD] text-black font-semibold transition-colors ${hasPendingEdit ? 'opacity-60 cursor-not-allowed' : ''}`}>
                  <Briefcase weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
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
                            <span className={`block truncate ${selected ? 'font-bold text-[#00DDFD]' : 'font-semibold'}`}>{opt.name}</span>
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
            <p className="text-xs text-slate-500 mt-2">Mempengaruhi jenis dokumen yang wajib dilampirkan pada halaman KYC.</p>
          </div>

          {!hasPendingEdit && (
            <div className="pt-4 border-t border-slate-100">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-slate-900 text-white rounded-xl py-4 font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                 {isSubmitting ? (
                   <>
                     <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                     Memproses...
                   </>
                 ) : (
                   <>
                     <CheckCircle weight="bold" className="w-5 h-5" />
                     <span>Ajukan Perubahan Profil</span>
                   </>
                 )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
