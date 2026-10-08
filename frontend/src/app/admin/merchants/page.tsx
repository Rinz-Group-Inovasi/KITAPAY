'use client';

import React, { useState } from 'react';
import { API_BASE_URL, fetcher } from '@/lib/api';
import useSWR from 'swr';
import { CircleNotch, MagnifyingGlass, CheckCircle, WarningCircle, UserCircle, Globe, Buildings, Money, SignIn } from '@phosphor-icons/react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase/client';
import { id } from 'date-fns/locale';

interface MerchantKycData {
  nik?: string;
  fullName?: string;
  address?: string;
  salesChannel?: string;
  websiteUrl?: string;
  npwp?: string;
  directorName?: string;
}

interface MerchantData {
  id: string;
  email: string;
  business_name: string;
  verification_status: 'UNVERIFIED' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
  available_balance: number;
  sandbox_balance: number;
  created_at: string;
  kyc_data?: MerchantKycData;
}

export default function AdminMerchantsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data, isLoading } = useSWR(`${API_BASE_URL}/admin/merchants`, fetcher, {
    refreshInterval: 15000
  });

  const handleImpersonate = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/merchants/${id}/impersonate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          redirectTo: window.location.origin + '/dashboard',
        }),
      });
      const data = await res.json();
      if (data.link) {
        await supabase.auth.signOut();
        window.location.href = data.link;
      } else {
        alert(data.error || 'Gagal login sebagai merchant');
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat impersonate');
    }
  };

  const merchants: MerchantData[] = data?.merchants || [];

  const filteredMerchants = merchants.filter(m => 
    m.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.kyc_data?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return <div className="text-center py-20 text-slate-500 flex items-center justify-center gap-2"><CircleNotch weight="bold" className="animate-spin w-5 h-5"/> Memuat data merchant...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Data Merchant</h1>
          <p className="text-slate-500 mt-1">Daftar seluruh merchant terdaftar beserta detail KYC dan saldo.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto">
          <MagnifyingGlass weight="bold" className="w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari merchant, email, nama..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-sm font-semibold text-black placeholder:text-slate-400 w-full md:w-64" 
          />
        </div>
      </div>

      <div className="grid gap-6">
        {filteredMerchants.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800">Tidak ada data</h3>
            <p className="text-slate-500">Merchant yang Anda cari tidak ditemukan.</p>
          </div>
        ) : (
          filteredMerchants.map((merchant) => (
            <div key={merchant.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                
                {/* Header / Basic Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        {merchant.business_name}
                        {merchant.verification_status === 'VERIFIED' ? (
                          <CheckCircle weight="fill" className="text-green-500 w-5 h-5" />
                        ) : (
                          <WarningCircle weight="fill" className="text-yellow-500 w-5 h-5" />
                        )}
                      </h2>
                      <p className="text-slate-500 font-medium">{merchant.email}</p>
                    </div>
                    <button
                      onClick={() => handleImpersonate(merchant.id)}
                      className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                      title="Login sebagai Merchant ini"
                    >
                      <SignIn className="w-4 h-4" />
                      <span>Impersonate</span>
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg font-semibold">
                      ID: {merchant.id.split('-')[0]}...
                    </span>
                    <span className="text-slate-400">
                      Bergabung: {format(new Date(merchant.created_at), 'dd MMM yyyy', { locale: id })}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-xs font-bold text-slate-400 mb-1">SALDO LIVE</p>
                      <p className="font-bold text-slate-900 text-lg">{formatRupiah(merchant.available_balance)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 mb-1">SALDO SANDBOX</p>
                      <p className="font-bold text-orange-500 text-lg">{formatRupiah(merchant.sandbox_balance)}</p>
                    </div>
                  </div>
                </div>

                {/* Vertical Divider */}
                <div className="hidden lg:block w-px bg-slate-200"></div>
                <div className="block lg:hidden h-px bg-slate-200 w-full"></div>

                {/* KYC Details */}
                <div className="flex-[1.5] bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <UserCircle weight="duotone" className="w-5 h-5 text-[#00DDFD]" />
                    Data Pengajuan KYC
                  </h3>
                  
                  {merchant.kyc_data ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                      <div>
                        <p className="text-slate-500 mb-1">Nama Lengkap Sesuai KTP</p>
                        <p className="font-bold text-slate-900">{merchant.kyc_data.fullName || '-'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1">NIK</p>
                        <p className="font-bold text-slate-900 font-mono">{merchant.kyc_data.nik || '-'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-slate-500 mb-1">Alamat Lengkap</p>
                        <p className="font-bold text-slate-900">{merchant.kyc_data.address || '-'}</p>
                      </div>
                      
                      <div className="col-span-1 md:col-span-2 my-2 border-t border-slate-200/60"></div>
                      
                      <div>
                        <p className="text-slate-500 flex items-center gap-1.5 mb-1">
                           <Buildings weight="bold" /> Jalur Penjualan
                        </p>
                        <p className="font-bold text-slate-900 capitalize">
                          {merchant.kyc_data.salesChannel === 'both' ? 'Offline & Online' : merchant.kyc_data.salesChannel || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 flex items-center gap-1.5 mb-1">
                           <Globe weight="bold" /> Website / Medsos
                        </p>
                        {merchant.kyc_data.websiteUrl ? (
                          <a href={merchant.kyc_data.websiteUrl.startsWith('http') ? merchant.kyc_data.websiteUrl : `https://${merchant.kyc_data.websiteUrl}`} target="_blank" rel="noopener noreferrer" className="font-bold text-[#00DDFD] hover:underline">
                            {merchant.kyc_data.websiteUrl}
                          </a>
                        ) : (
                          <p className="font-bold text-slate-900">-</p>
                        )}
                      </div>
                      
                      {(merchant.kyc_data.npwp || merchant.kyc_data.directorName) && (
                        <>
                          <div className="col-span-1 md:col-span-2 my-2 border-t border-slate-200/60"></div>
                          <div>
                            <p className="text-slate-500 mb-1">NPWP Badan Usaha</p>
                            <p className="font-bold text-slate-900 font-mono">{merchant.kyc_data.npwp || '-'}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 mb-1">Nama Direktur</p>
                            <p className="font-bold text-slate-900">{merchant.kyc_data.directorName || '-'}</p>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium italic">
                      Belum ada data KYC terverifikasi.
                    </div>
                  )}
                </div>

              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
