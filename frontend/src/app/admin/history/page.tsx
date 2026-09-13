'use client';

import React, { useState } from 'react';
import { API_BASE_URL, fetcher } from '@/lib/api';
import useSWR from 'swr';
import { Clock, CheckCircle, XCircle, MagnifyingGlass, CaretDown, Check, CircleNotch } from '@phosphor-icons/react';
import { Listbox, Transition } from '@headlessui/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

const FILTER_OPTIONS = [
  { id: 'ALL', name: 'Semua Riwayat' },
  { id: 'KYC', name: 'Verifikasi KYC' },
  { id: 'PROFILE_EDIT', name: 'Ubah Profil' },
  { id: 'BANK_ACCOUNT_ADD', name: 'Tambah Rekening' },
  { id: 'WITHDRAWAL', name: 'Penarikan Dana' }
];

export default function AdminHistoryDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState(FILTER_OPTIONS[0]);

  const { data, isLoading: loading } = useSWR(`${API_BASE_URL}/admin/requests/history`, fetcher, {
    refreshInterval: 10000
  });

  const requests = data?.requests || [];
  
  const filteredRequests = requests.filter((req: any) => {
    const matchesSearch = req.merchants?.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          req.merchants?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType.id === 'ALL' || req.request_type === filterType.id;
    return matchesSearch && matchesFilter;
  });

  if (loading) return <div className="text-center py-20 text-slate-500 flex items-center justify-center gap-2"><CircleNotch weight="bold" className="animate-spin w-5 h-5"/> Memuat riwayat pengajuan...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Riwayat Pengajuan Merchant</h1>
          <p className="text-slate-500 mt-1">Lihat kembali seluruh pengajuan KYC, Ubah Profil, dan Rekening Bank yang telah diproses.</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          <Listbox value={filterType} onChange={setFilterType}>
            <div className="relative w-full md:w-56 z-20">
              <Listbox.Button className="relative w-full cursor-default rounded-xl bg-white py-2.5 pl-4 pr-10 text-left shadow-sm border border-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00DDFD]">
                <span className="block truncate font-semibold text-slate-700">{filterType.name}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                  <CaretDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
                </span>
              </Listbox.Button>
              <Transition as={React.Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm border border-slate-100">
                  {FILTER_OPTIONS.map((opt) => (
                    <Listbox.Option key={opt.id} className={({ active }) => `relative cursor-default select-none py-2.5 pl-10 pr-4 ${active ? 'bg-slate-50 text-slate-900' : 'text-slate-700'}`} value={opt}>
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
          <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto">
            <MagnifyingGlass weight="bold" className="w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari merchant..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-sm font-semibold text-black placeholder:text-slate-400 w-full md:w-64" 
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {filteredRequests.length === 0 ? (
           <div className="text-center py-20">
             <div className="w-16 h-16 bg-blue-50 rounded-full mx-auto flex items-center justify-center mb-4">
                <Clock weight="fill" className="w-8 h-8 text-blue-500" />
             </div>
             <h3 className="text-lg font-bold text-slate-800">Riwayat Kosong</h3>
             <p className="text-slate-500">Belum ada pengajuan yang telah diproses.</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                  <th className="p-4">Tanggal / Waktu Diproses</th>
                  <th className="p-4">Merchant</th>
                  <th className="p-4">Tipe Pengajuan</th>
                  <th className="p-4">Detail Pengajuan</th>
                  <th className="p-4">Status & Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((req: any) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 align-top">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Clock weight="bold" className="w-4 h-4" />
                        <span>{format(new Date(req.updated_at), 'dd MMM yyyy, HH:mm', { locale: id })}</span>
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <p className="font-bold text-slate-900">{req.merchants?.business_name}</p>
                      <p className="text-sm text-slate-500">{req.merchants?.email}</p>
                    </td>
                    <td className="p-4 align-top">
                      {req.request_type === 'KYC' ? (
                        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-lg text-xs border border-blue-200">Verifikasi KYC</span>
                      ) : req.request_type === 'PROFILE_EDIT' ? (
                        <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 font-bold px-2.5 py-1 rounded-lg text-xs border border-purple-200">Ubah Profil</span>
                      ) : req.request_type === 'BANK_ACCOUNT_ADD' ? (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-lg text-xs border border-emerald-200">Tambah Rekening</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 font-bold px-2.5 py-1 rounded-lg text-xs border border-orange-200">Penarikan Dana</span>
                      )}
                    </td>
                    <td className="p-4 align-top">
                      {req.request_type === 'KYC' && (
                         <div className="space-y-4">
                            {req.payload?.data && (
                               <div className="text-sm space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                  <p><span className="text-slate-500">NIK:</span> <span className="font-bold text-black">{req.payload.data.nik}</span></p>
                                  <p><span className="text-slate-500">Nama Lengkap:</span> <span className="font-bold text-black">{req.payload.data.fullName}</span></p>
                                  <p><span className="text-slate-500">Alamat:</span> <span className="font-bold text-black">{req.payload.data.address}</span></p>
                                  <p><span className="text-slate-500">Tempat Jualan:</span> <span className="font-bold text-black">{req.payload.data.salesChannel === 'offline' ? 'Offline' : req.payload.data.salesChannel === 'online' ? 'Online' : 'Keduanya (Offline & Online)'}</span></p>
                               </div>
                            )}
                         </div>
                      )}
                      {req.request_type === 'PROFILE_EDIT' && (
                         <div className="text-sm space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <p><span className="text-slate-500">Nama Pemilik:</span> <span className="font-bold text-black">{req.payload.ownerName}</span></p>
                            <p><span className="text-slate-500">Nama Usaha:</span> <span className="font-bold text-black">{req.payload.businessName}</span></p>
                            <p><span className="text-slate-500">Tipe Usaha:</span> <span className="font-bold text-black">{req.payload.businessType}</span></p>
                         </div>
                      )}
                      {req.request_type === 'BANK_ACCOUNT_ADD' && (
                         <div className="text-sm space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <p><span className="text-slate-500">Bank/Dompet:</span> <span className="font-bold text-black">{req.payload.bankName}</span></p>
                            <p><span className="text-slate-500">Atas Nama:</span> <span className="font-bold text-black">{req.payload.accountName}</span></p>
                            <p><span className="text-slate-500">Nomor Rekening:</span> <span className="font-bold text-black">{req.payload.accountNumber}</span></p>
                         </div>
                      )}
                      {req.request_type === 'WITHDRAWAL' && (
                         <div className="text-sm space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <p><span className="text-slate-500">Nominal:</span> <span className="font-bold text-black">Rp {new Intl.NumberFormat('id-ID').format(req.payload.amount)}</span></p>
                            <p><span className="text-slate-500">Tujuan:</span> <span className="font-bold text-black">{req.payload.bankCode} - {req.payload.accountNumber}</span></p>
                            <p><span className="text-slate-500">Atas Nama:</span> <span className="font-bold text-black">{req.payload.accountName}</span></p>
                            <p><span className="text-slate-500">Tipe:</span> <span className="font-bold text-black">{req.payload.payoutType === 'INSTANT_PAID' ? 'Instan' : 'Terjadwal'}</span></p>
                         </div>
                      )}
                    </td>
                    <td className="p-4 align-top">
                      <div className={cn(
                         "inline-flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-lg text-xs border",
                         req.status === 'APPROVED' ? "bg-green-50 text-green-700 border-green-200" :
                         req.status === 'REJECTED' ? "bg-red-50 text-red-700 border-red-200" :
                         "bg-yellow-50 text-yellow-700 border-yellow-200"
                      )}>
                        {req.status === 'APPROVED' ? <CheckCircle weight="fill" className="w-4 h-4" /> :
                         req.status === 'REJECTED' ? <XCircle weight="fill" className="w-4 h-4" /> :
                         <Clock weight="fill" className="w-4 h-4" />}
                        {req.status}
                      </div>
                      {req.notes && (
                         <p className="text-xs text-slate-500 mt-2 p-2 bg-slate-50 rounded-md border border-slate-100"><span className="font-semibold">Alasan:</span> {req.notes}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
