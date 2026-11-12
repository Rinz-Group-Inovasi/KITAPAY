'use client';

import React, { useState } from 'react';
import { API_BASE_URL, fetcher } from '@/lib/api';
import useSWR from 'swr';
import { Clock, CheckCircle, XCircle, MagnifyingGlass, Image as ImageIcon, CircleNotch, Eye, X } from '@phosphor-icons/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

export default function SuperAdminAuditPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { data, isLoading: loading } = useSWR(`${API_BASE_URL}/admin/withdrawals/history`, fetcher, {
    refreshInterval: 10000
  });

  const history = data?.history || [];
  
  const filteredHistory = history.filter((req: any) => 
    req.merchants?.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    req.merchants?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="text-center py-20 text-slate-500 flex items-center justify-center gap-2"><CircleNotch weight="bold" className="animate-spin w-5 h-5"/> Memuat riwayat penarikan...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Penarikan (Super Admin)</h1>
          <p className="text-slate-500 mt-1">Pantau seluruh riwayat penarikan dan verifikasi bukti transfer.</p>
        </div>
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

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {filteredHistory.length === 0 ? (
           <div className="text-center py-20">
             <div className="w-16 h-16 bg-purple-50 rounded-full mx-auto flex items-center justify-center mb-4">
                <CheckCircle weight="fill" className="w-8 h-8 text-purple-500" />
             </div>
             <h3 className="text-lg font-bold text-slate-800">Tidak ada data</h3>
             <p className="text-slate-500">Belum ada riwayat penarikan yang ditemukan.</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                  <th className="p-4">Tanggal Update</th>
                  <th className="p-4">Merchant</th>
                  <th className="p-4">Total & Tujuan</th>
                  <th className="p-4">Status & Catatan</th>
                  <th className="p-4 w-40">Bukti Transfer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.map((req: any) => (
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
                       <p className="text-sm font-bold text-slate-900">
                         Rp {new Intl.NumberFormat('id-ID').format(
                           req.payload?.amount !== undefined && req.payload?.totalDeduction !== undefined && req.payload.amount === req.payload.totalDeduction && Number(req.payload?.fee || 0) > 0
                             ? req.payload.totalDeduction - Number(req.payload.fee)
                             : (req.payload?.amount ?? ((req.payload?.totalDeduction || 0) - Number(req.payload?.fee || 0)))
                         )}
                       </p>
                       <p className="text-xs text-slate-500 mt-0.5">{req.payload?.bankCode} - {req.payload?.accountNumber}</p>
                       <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            {req.payload?.payoutType === 'INSTANT_PAID' ? 'Instan' : 'Terjadwal'}
                          </span>
                          {Number(req.payload?.fee || 0) > 0 ? (
                            <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">
                              Biaya: Rp {new Intl.NumberFormat('id-ID').format(Number(req.payload.fee))}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                              Gratis
                            </span>
                          )}
                       </div>
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
                    <td className="p-4 align-top">
                      {req.payload?.bukti_transfer ? (
                         <button 
                           onClick={() => setPreviewImage(req.payload.bukti_transfer)}
                           className="flex items-center gap-1.5 text-xs font-bold text-[#00DDFD] bg-[#00DDFD]/10 hover:bg-[#00DDFD]/20 px-3 py-2 rounded-lg transition-colors border border-[#00DDFD]/20"
                         >
                           <Eye weight="bold" className="w-4 h-4" /> Lihat Bukti
                         </button>
                      ) : (
                         <span className="text-xs text-slate-400 italic">Tidak ada bukti</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative max-w-4xl w-full h-full max-h-[90vh] flex flex-col justify-center items-center">
            <button 
              onClick={() => setPreviewImage(null)} 
              className="absolute -top-4 -right-4 md:top-0 md:-right-12 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-md"
            >
              <X weight="bold" className="w-5 h-5"/>
            </button>
            <img src={previewImage} alt="Bukti Transfer" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
