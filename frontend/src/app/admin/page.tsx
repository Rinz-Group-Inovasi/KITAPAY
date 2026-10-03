'use client';

import React, { useState } from 'react';
import { API_BASE_URL, fetcher } from '@/lib/api';
import useSWR from 'swr';
import { Clock, CheckCircle, XCircle, MagnifyingGlass, ArrowSquareOut, CircleNotch } from '@phosphor-icons/react';
import { useToast } from '@/components/ToastProvider';
import { useConfirm } from '@/components/ConfirmModalProvider';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface RequestData {
  id: string;
  merchant_id: string;
  request_type: 'KYC' | 'PROFILE_EDIT' | 'BANK_ACCOUNT_ADD';
  payload: any;
  status: string;
  created_at: string;
  merchants: {
    business_name: string;
    email: string;
  };
}

export default function AdminDashboard() {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const toast = useToast();
  const modal = useConfirm();

  const { data, isLoading: loading, mutate } = useSWR(`${API_BASE_URL}/admin/requests`, fetcher, {
    refreshInterval: 10000
  });

  const requests: RequestData[] = data?.requests || [];

  const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
    if (actionLoading) return;
    const actionText = action === 'approve' ? 'menyetujui' : 'menolak';
    const isConfirmed = await modal.confirm(`Anda yakin ingin ${actionText} pengajuan ini?`);
    if (!isConfirmed) return;
    
    setActionLoading(requestId);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/requests/${requestId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action === 'reject' ? { notes: 'Ditolak oleh admin' } : {})
      });
      if (res.ok) {
        mutate();
        toast.success(`Pengajuan berhasil ${action === 'approve' ? 'disetujui' : 'ditolak'}`);
      } else {
        toast.error('Gagal memproses aksi');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-500 flex items-center justify-center gap-2"><CircleNotch weight="bold" className="animate-spin w-5 h-5"/> Memuat antrean...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Antrean Pengajuan Merchant</h1>
          <p className="text-slate-500 mt-1">Kelola verifikasi KYC dan perubahan profil merchant di sini.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto">
          <MagnifyingGlass weight="bold" className="w-5 h-5 text-slate-400" />
          <input type="text" placeholder="Cari merchant..." className="bg-transparent border-none focus:outline-none text-sm font-semibold text-black placeholder:text-slate-400 w-full md:w-64" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {requests.length === 0 ? (
           <div className="text-center py-20">
             <div className="w-16 h-16 bg-green-50 rounded-full mx-auto flex items-center justify-center mb-4">
                <CheckCircle weight="fill" className="w-8 h-8 text-green-500" />
             </div>
             <h3 className="text-lg font-bold text-slate-800">Antrean Kosong</h3>
             <p className="text-slate-500">Tidak ada pengajuan yang perlu diproses saat ini.</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                  <th className="p-4">Tanggal / Waktu</th>
                  <th className="p-4">Merchant</th>
                  <th className="p-4">Tipe Pengajuan</th>
                  <th className="p-4">Detail Pengajuan</th>
                  <th className="p-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 align-top">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Clock weight="bold" className="w-4 h-4" />
                        <span>{format(new Date(req.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}</span>
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
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-lg text-xs border border-emerald-200">Tambah Rekening</span>
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
                                  {(req.payload.data.salesChannel === 'online' || req.payload.data.salesChannel === 'both') && (
                                    <p><span className="text-slate-500">Website/Sosmed:</span> <span className="font-bold text-black">{req.payload.data.websiteUrl}</span></p>
                                  )}
                                  {req.payload.data.npwp && (
                                    <p><span className="text-slate-500">NPWP PT/CV:</span> <span className="font-bold text-black">{req.payload.data.npwp}</span></p>
                                  )}
                                  {req.payload.data.directorName && (
                                    <p><span className="text-slate-500">Direktur:</span> <span className="font-bold text-black">{req.payload.data.directorName}</span></p>
                                  )}
                               </div>
                            )}
                            {req.payload?.documents && (
                               <div className="space-y-2">
                                  {req.payload.documents.map((doc: any, i: number) => (
                                     <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-semibold text-[#00DDFD] hover:underline bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 w-max">
                                       <ArrowSquareOut weight="bold" className="w-4 h-4" />
                                       {doc.type === 'ktp' ? 'Lihat KTP' : doc.type === 'selfie' ? 'Lihat Selfie KTP' : 'Lihat Legalitas (NPWP/NIB)'}
                                     </a>
                                  ))}
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
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex gap-2">
                        <button 
                          disabled={actionLoading === req.id}
                          onClick={() => handleAction(req.id, 'approve')}
                          className="flex-1 bg-green-100 text-green-700 hover:bg-green-200 px-3 py-2 rounded-lg font-bold text-sm transition-colors border border-green-200 flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <CheckCircle weight="fill" className="w-4 h-4" /> Setujui
                        </button>
                        <button 
                          disabled={actionLoading === req.id}
                          onClick={() => handleAction(req.id, 'reject')}
                          className="flex-1 bg-red-100 text-red-700 hover:bg-red-200 px-3 py-2 rounded-lg font-bold text-sm transition-colors border border-red-200 flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <XCircle weight="fill" className="w-4 h-4" /> Tolak
                        </button>
                      </div>
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
