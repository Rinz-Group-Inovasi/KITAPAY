'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, Buildings, Image, CheckCircle, Warning, ArrowsClockwise, UploadSimple, Camera, XCircle, CaretDown, Check } from '@phosphor-icons/react';
import { Listbox, Transition } from '@headlessui/react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { getClientMerchantId, API_BASE_URL, fetcher } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';
import { PageSkeleton } from '@/components/PageSkeleton';
import useSWR from 'swr';

const SALES_CHANNEL_OPTIONS = [
  { id: 'offline', name: 'Toko Fisik (Offline)' },
  { id: 'online', name: 'Toko Online / Sosmed' },
  { id: 'both', name: 'Keduanya (Offline & Online)' }
];

export default function KYCPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const merchantId = user ? getClientMerchantId(user.id) : null;
  const { data, isLoading: loading, mutate } = useSWR(
    merchantId && user ? `${API_BASE_URL}/requests/latest/${merchantId}?requestType=KYC` : null,
    fetcher
  );

  const { data: profileRequestData } = useSWR(
    merchantId && user ? `${API_BASE_URL}/requests/latest/${merchantId}?requestType=PROFILE_EDIT` : null,
    fetcher
  );

  const [kycStatus, setKycStatus] = useState<string>('');
  const [rejectionNotes, setRejectionNotes] = useState<string>('');

  useEffect(() => {
    if (data) {
      if (data.merchantStatus) {
        setKycStatus(data.merchantStatus);
      } else {
        setKycStatus('UNVERIFIED');
      }
      
      const request = data.data;
      if (request) {
        setRejectionNotes(request.notes || '');
        if (request.payload) {
          if (request.payload.data) {
            setFormData(prev => ({ ...prev, ...request.payload.data }));
          }
          if (request.payload.documents) {
            const ktp = request.payload.documents.find((d: any) => d.type === 'ktp');
            const selfie = request.payload.documents.find((d: any) => d.type === 'selfie');
            const nib = request.payload.documents.find((d: any) => d.type === 'nib');
            const akta = request.payload.documents.find((d: any) => d.type === 'akta');
            if (ktp) setKtpUrl(ktp.url);
            if (selfie) setSelfieUrl(selfie.url);
            if (nib) setNibUrl(nib.url);
            if (akta) setAktaUrl(akta.url);
          }
        }
      }
    }
  }, [data]);

  const [updating, setUpdating] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  
  const [ktpUrl, setKtpUrl] = useState<string>('');
  const [nibUrl, setNibUrl] = useState<string>('');
  const [selfieUrl, setSelfieUrl] = useState<string>('');
  const [aktaUrl, setAktaUrl] = useState<string>('');
  
  // Upload states
  const [uploadingKtp, setUploadingKtp] = useState(false);
  const [uploadingNib, setUploadingNib] = useState(false);
  const [uploadingSelfie, setUploadingSelfie] = useState(false);
  const [uploadingAkta, setUploadingAkta] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    nik: '',
    fullName: '',
    address: '',
    salesChannel: 'offline', // offline, online, both
    websiteUrl: '',
    npwp: '',
    directorName: ''
  });

  const fetchProfile = () => {
    if (user) {
      // First try to load cached local data
      const merchantId = getClientMerchantId(user.id);
      const profileKey = `kitapay_profile_${merchantId}`;
      const savedData = localStorage.getItem(profileKey + '_data');
      if (savedData) {
        try {
          setProfile(JSON.parse(savedData));
        } catch(e) {}
      }
      
      // Then fetch from Supabase
      fetch('/api/merchant/profile')
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setProfile((prev: any) => ({ ...prev, businessName: data.business_name, businessType: data.business_type || prev?.businessType, ownerName: data.owner_name || prev?.ownerName }));
          }
        })
        .catch(console.error);
    }
  };

  useEffect(() => {
    fetchProfile();
    window.addEventListener('profileUpdated', fetchProfile);
    return () => window.removeEventListener('profileUpdated', fetchProfile);
  }, [user]);

  // Determine business type by checking the latest APPROVED profile edit, fallback to profile state
  const resolvedBusinessType = (profileRequestData?.data?.status === 'APPROVED' && profileRequestData?.data?.payload?.businessType) 
    ? profileRequestData.data.payload.businessType 
    : profile?.businessType;
    
  const isPerseroan = resolvedBusinessType === 'perseroan';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const uploadToCloudinary = async (file: File) => {
    const data = new FormData();
    data.append('file', file);

    const res = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: data,
    });
    
    if (!res.ok) throw new Error('Gagal unggah gambar');
    const json = await res.json();
    return json.secure_url;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'ktp' | 'nib' | 'selfie' | 'akta') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'ktp') setUploadingKtp(true);
    else if (type === 'nib') setUploadingNib(true);
    else if (type === 'akta') setUploadingAkta(true);
    else setUploadingSelfie(true);

    try {
      const url = await uploadToCloudinary(file);
      if (type === 'ktp') setKtpUrl(url);
      else if (type === 'nib') setNibUrl(url);
      else if (type === 'akta') setAktaUrl(url);
      else setSelfieUrl(url);
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengunggah file. Silakan coba lagi.');
    } finally {
      if (type === 'ktp') setUploadingKtp(false);
      else if (type === 'nib') setUploadingNib(false);
      else if (type === 'akta') setUploadingAkta(false);
      else setUploadingSelfie(false);
    }
  };

  const submitKycRequest = async () => {
    if (!user) return;
    
    // Basic validation
    if (!formData.nik || !formData.fullName || !formData.address) {
      return toast.error('Mohon lengkapi NIK, Nama Lengkap, dan Alamat.');
    }
    if ((formData.salesChannel === 'online' || formData.salesChannel === 'both') && !formData.websiteUrl) {
      return toast.error('Mohon lengkapi data Website / Sosial Media jualan Anda.');
    }
    if (isPerseroan && (!formData.npwp || !formData.directorName)) {
      return toast.error('Mohon lengkapi data NPWP dan Nama Direktur untuk perusahaan Anda.');
    }
    if (!ktpUrl) return toast.error('Mohon unggah foto KTP.');
    if (!selfieUrl) return toast.error('Mohon unggah foto Selfie dengan KTP.');
    if (isPerseroan && !nibUrl) return toast.error('Mohon unggah dokumen NPWP & NIB.');
    if (isPerseroan && !aktaUrl) return toast.error('Mohon unggah dokumen Akta Pendirian.');

    setUpdating(true);
    try {
      const merchantId = getClientMerchantId(user.id);
      
      const documents = [
        { type: 'ktp', url: ktpUrl },
        { type: 'selfie', url: selfieUrl }
      ];
      if (isPerseroan) {
        documents.push({ type: 'nib', url: nibUrl });
        documents.push({ type: 'akta', url: aktaUrl });
      }

      const res = await fetch(`${API_BASE_URL}/requests/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          email: user.email,
          businessName: profile?.businessName,
          requestType: 'KYC',
          payload: { 
            documents,
            data: formData
          }
        })
      });

      if (!res.ok) throw new Error('Gagal mengajukan KYC');
      const json = await res.json();
      
      if (json.autoVerified) {
        toast.success('KTP Anda terverifikasi secara otomatis oleh sistem kami! Fitur Live Mode Anda telah aktif.');
        mutate();
      } else {
        toast.success('Pengajuan KYC berhasil dikirim! Tim kami akan meninjau data Anda.');
        mutate();
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan saat mengajukan KYC.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <PageSkeleton />;

  const isFormLocked = kycStatus === 'PENDING_REVIEW' || kycStatus === 'VERIFIED';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Verifikasi Identitas (KYC)</h1>
        <p className="text-slate-500 text-sm mt-1 mb-4">Lengkapi data diri dan dokumen untuk membuka seluruh fitur Live Mode.</p>
        
        {/* Keamanan Data - Inline Block */}
        <div className="inline-flex items-center gap-2 bg-[#00DDFD]/10 text-[#00b5d1] text-xs font-semibold px-3 py-2 rounded-lg border border-[#00DDFD]/20">
          <ShieldCheck weight="duotone" className="w-4 h-4" />
          Data NIK dan KTP Anda dienkripsi secara aman sesuai regulasi Bank Indonesia.
        </div>
      </div>

      {/* Status Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row items-center gap-4 text-center md:text-left justify-between">
            {kycStatus === 'VERIFIED' ? (
              <>
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle weight="fill" className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-1">Terverifikasi Penuh</h2>
                    <p className="text-sm text-slate-500">Akun Anda sudah disetujui dan siap menerima pembayaran tanpa batas di mode Live.</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl px-4 py-2 border border-slate-100 text-sm font-bold text-green-600">
                  Status Live: Aktif
                </div>
              </>
            ) : kycStatus === 'PENDING_REVIEW' ? (
              <>
                 <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                    <ArrowsClockwise weight="bold" className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-1">Sedang Ditinjau</h2>
                    <p className="text-sm text-slate-500">Data KYC Anda sedang diperiksa oleh tim Admin. Mohon kesediaannya menunggu.</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl px-4 py-2 border border-slate-100 text-sm font-bold text-blue-600">
                  Status: Menunggu
                </div>
              </>
            ) : kycStatus === 'REJECTED' ? (
              <>
                 <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                    <XCircle weight="fill" className="w-8 h-8 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-1">Verifikasi Ditolak</h2>
                    <p className="text-sm text-slate-500">Pengajuan KYC Anda ditolak. Silakan perbaiki data dan ajukan ulang.</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl px-4 py-2 border border-slate-100 text-sm font-bold text-red-600">
                  Status Live: Terkunci
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center shrink-0">
                    <Warning weight="duotone" className="w-8 h-8 text-yellow-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-1">Belum Terverifikasi</h2>
                    <p className="text-sm text-slate-500">Akun Anda masih dalam mode Sandbox (Percobaan).</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl px-4 py-2 border border-slate-100 text-sm font-bold text-yellow-600">
                  Status Live: Terkunci
                </div>
              </>
            )}
      </div>

      {kycStatus === 'REJECTED' && rejectionNotes && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3">
          <Warning weight="duotone" className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-800 text-sm">Alasan Penolakan dari Admin:</h3>
            <p className="text-red-700 text-sm mt-1 whitespace-pre-wrap">{rejectionNotes}</p>
          </div>
        </div>
      )}

      {/* Form sections */}
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Informasi Pribadi & Usaha</h3>
            <p className="text-sm text-slate-500 mt-1">Pastikan data yang diisi sesuai dengan dokumen identitas resmi.</p>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-black mb-2">NIK (Sesuai KTP)</label>
                <input 
                  type="text" name="nik" value={formData.nik} onChange={handleInputChange} disabled={isFormLocked}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00DDFD] focus:border-[#00DDFD] text-black font-semibold disabled:bg-slate-50"
                  placeholder="Contoh: 3171234567890001" maxLength={16}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-2">Nama Lengkap (Sesuai KTP)</label>
                <input 
                  type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} disabled={isFormLocked}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00DDFD] focus:border-[#00DDFD] text-black font-semibold disabled:bg-slate-50"
                  placeholder="Nama lengkap Anda"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-2">Alamat Lengkap (Sesuai KTP)</label>
              <textarea 
                name="address" value={formData.address} onChange={handleInputChange} disabled={isFormLocked}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00DDFD] focus:border-[#00DDFD] text-black font-semibold disabled:bg-slate-50 min-h-25"
                placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <label className="block text-sm font-bold text-black mb-2">Tempat Berjualan</label>
                <Listbox value={SALES_CHANNEL_OPTIONS.find(o => o.id === formData.salesChannel) || SALES_CHANNEL_OPTIONS[0]} onChange={(opt: any) => setFormData({...formData, salesChannel: opt.id})} disabled={isFormLocked}>
                  <div className="relative">
                    <Listbox.Button className={`relative w-full cursor-pointer rounded-xl bg-white py-3 pl-4 pr-10 text-left border border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:border-[#00DDFD] focus-visible:ring-[#00DDFD] text-black font-semibold transition-colors ${isFormLocked ? 'bg-slate-50 opacity-80 cursor-not-allowed' : ''}`}>
                      <span className="block truncate">{(SALES_CHANNEL_OPTIONS.find(o => o.id === formData.salesChannel) || SALES_CHANNEL_OPTIONS[0]).name}</span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                        <CaretDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      </span>
                    </Listbox.Button>
                    <Transition as={React.Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                      <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm border border-slate-100">
                        {SALES_CHANNEL_OPTIONS.map((opt) => (
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
              </div>
              
              {(formData.salesChannel === 'online' || formData.salesChannel === 'both') && (
                <div>
                  <label className="block text-sm font-bold text-black mb-2">Website / Sosial Media Toko</label>
                  <input 
                    type="text" name="websiteUrl" value={formData.websiteUrl} onChange={handleInputChange} disabled={isFormLocked}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00DDFD] focus:border-[#00DDFD] text-black font-semibold disabled:bg-slate-50"
                    placeholder="instagram.com/tokoanda"
                  />
                </div>
              )}
            </div>

            {isPerseroan && (
              <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-black mb-2">Nomor NPWP Perusahaan</label>
                  <input 
                    type="text" name="npwp" value={formData.npwp} onChange={handleInputChange} disabled={isFormLocked}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00DDFD] focus:border-[#00DDFD] text-black font-semibold disabled:bg-slate-50"
                    placeholder="15 / 16 Digit NPWP"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-2">Nama Direktur Utama</label>
                  <input 
                    type="text" name="directorName" value={formData.directorName} onChange={handleInputChange} disabled={isFormLocked}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00DDFD] focus:border-[#00DDFD] text-black font-semibold disabled:bg-slate-50"
                    placeholder="Nama direktur penanggung jawab"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Dokumen Identitas</h3>
            <p className="text-sm text-slate-500 mt-1">Unggah dokumen resmi Anda. Dokumen harus jelas dan terbaca.</p>
          </div>
          
          <div className="divide-y divide-slate-100">
            {/* KTP */}
            <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
                  <Image weight="duotone" className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-black">Foto KTP</h4>
                  <p className="text-sm text-slate-500 mt-0.5">KTP asli, bukan fotokopi</p>
                </div>
              </div>
              {isFormLocked ? (
                <span className="font-bold text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">Data Terkunci</span>
              ) : ktpUrl ? (
                <span className="font-bold text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">Terunggah ✓</span>
              ) : (
                <div>
                  <input type="file" id="ktp-upload" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'ktp')} disabled={uploadingKtp} />
                  <label htmlFor="ktp-upload" className="flex items-center justify-center space-x-2 bg-white text-black hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-bold border border-slate-300 cursor-pointer">
                    {uploadingKtp ? <ArrowsClockwise weight="bold" className="w-4 h-4 animate-spin" /> : <UploadSimple weight="bold" className="w-4 h-4" />}
                    <span>Unggah</span>
                  </label>
                </div>
              )}
            </div>

            {/* Selfie */}
            <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
                  <Camera weight="duotone" className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-black">Selfie dengan KTP</h4>
                  <p className="text-sm text-slate-500 mt-0.5">Wajah dan KTP harus terlihat jelas</p>
                </div>
              </div>
              {isFormLocked ? (
                <span className="font-bold text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">Data Terkunci</span>
              ) : selfieUrl ? (
                <span className="font-bold text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">Terunggah ✓</span>
              ) : (
                <div>
                  <input type="file" id="selfie-upload" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'selfie')} disabled={uploadingSelfie} />
                  <label htmlFor="selfie-upload" className="flex items-center justify-center space-x-2 bg-white text-black hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-bold border border-slate-300 cursor-pointer">
                    {uploadingSelfie ? <ArrowsClockwise weight="bold" className="w-4 h-4 animate-spin" /> : <UploadSimple weight="bold" className="w-4 h-4" />}
                    <span>Unggah</span>
                  </label>
                </div>
              )}
            </div>

            {/* Document 3 - NPWP & NIB */}
            {isPerseroan && (
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
                    <Buildings weight="duotone" className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-black">NPWP & NIB Perusahaan</h4>
                    <p className="text-sm text-slate-500 mt-0.5">Digabung dalam 1 file PDF/Gambar</p>
                  </div>
                </div>
                {isFormLocked ? (
                  <span className="font-bold text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">Data Terkunci</span>
                ) : nibUrl ? (
                  <span className="font-bold text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">Terunggah ✓</span>
                ) : (
                  <div>
                    <input type="file" id="nib-upload" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'nib')} disabled={uploadingNib} />
                    <label htmlFor="nib-upload" className="flex items-center justify-center space-x-2 bg-white text-black hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-bold border border-slate-300 cursor-pointer">
                      {uploadingNib ? <ArrowsClockwise weight="bold" className="w-4 h-4 animate-spin" /> : <UploadSimple weight="bold" className="w-4 h-4" />}
                      <span>Unggah</span>
                    </label>
                  </div>
                )}
              </div>
            )}
            
            {/* Document 4 - Akta Pendirian */}
            {isPerseroan && (
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
                    <Buildings weight="duotone" className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-black">Akta Pendirian Perusahaan</h4>
                    <p className="text-sm text-slate-500 mt-0.5">Akta perusahaan resmi dari notaris</p>
                  </div>
                </div>
                {isFormLocked ? (
                  <span className="font-bold text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">Data Terkunci</span>
                ) : aktaUrl ? (
                  <span className="font-bold text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">Terunggah ✓</span>
                ) : (
                  <div>
                    <input type="file" id="akta-upload" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'akta')} disabled={uploadingAkta} />
                    <label htmlFor="akta-upload" className="flex items-center justify-center space-x-2 bg-white text-black hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-bold border border-slate-300 cursor-pointer">
                      {uploadingAkta ? <ArrowsClockwise weight="bold" className="w-4 h-4 animate-spin" /> : <UploadSimple weight="bold" className="w-4 h-4" />}
                      <span>Unggah</span>
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Submit Button */}
        {(!kycStatus || kycStatus === 'UNVERIFIED') && (
          <div className="pt-2 flex justify-end">
            <button 
              disabled={updating}
              onClick={submitKycRequest}
              className="w-full sm:w-auto min-w-50 flex items-center justify-center gap-2 bg-[#00DDFD] text-slate-900 font-bold py-3.5 px-6 rounded-xl hover:bg-[#00c5e3] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating ? <ArrowsClockwise weight="bold" className="w-5 h-5 animate-spin" /> : <ShieldCheck weight="bold" className="w-5 h-5" />}
              <span>Kirim Pengajuan KYC</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
