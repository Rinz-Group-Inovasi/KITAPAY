'use client';

import React, { useState, useRef } from 'react';
import { API_BASE_URL, fetcher } from '@/lib/api';
import useSWR from 'swr';
import { Clock, CheckCircle, XCircle, FileText, X, CircleNotch, Image as ImageIcon, Money } from '@phosphor-icons/react';
import { useToast } from '@/components/ToastProvider';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

const getWithdrawalDetails = (payload: any) => {
  const fee = Number(payload?.fee || 0);
  let transferAmount = 0;
  if (payload?.amount !== undefined && payload?.totalDeduction !== undefined) {
    if (payload.amount === payload.totalDeduction && fee > 0) {
      transferAmount = payload.totalDeduction - fee;
    } else {
      transferAmount = payload.amount;
    }
  } else if (payload?.amount !== undefined) {
    transferAmount = payload.amount;
  } else if (payload?.totalDeduction !== undefined) {
    transferAmount = payload.totalDeduction - fee;
  }
  const totalDeduction = payload?.totalDeduction || (transferAmount + fee);
  return { fee, transferAmount, totalDeduction };
};

export default function AdminWithdrawalsPage() {
  const toast = useToast();
  
  const [selectedApproveId, setSelectedApproveId] = useState<string | null>(null);
  const [selectedRejectId, setSelectedRejectId] = useState<string | null>(null);
  
  const [rejectReason, setRejectReason] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading: loading, mutate } = useSWR(`${API_BASE_URL}/admin/requests`, fetcher, {
    refreshInterval: 10000
  });

  const withdrawals = (data?.requests || []).filter((r: any) => r.request_type === 'WITHDRAWAL');

  const selectedApproveReq = withdrawals.find((r: any) => r.id === selectedApproveId);
  const selectedRejectReq = withdrawals.find((r: any) => r.id === selectedRejectId);

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApproveId || !proofFile) return;
    
    setActionLoading(true);
    try {
      // 1. Upload proof
      const formData = new FormData();
      formData.append('file', proofFile);
      const uploadRes = await fetch(`${API_BASE_URL}/upload`, { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Gagal unggah bukti transfer');
      
      // 2. Approve request
      const res = await fetch(`${API_BASE_URL}/admin/requests/${selectedApproveId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bukti_transfer: uploadData.secure_url })
      });
      
      if (res.ok) {
        mutate();
        toast.success('Penarikan berhasil disetujui');
        setSelectedApproveId(null);
        setProofFile(null);
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Gagal memproses persetujuan');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan jaringan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRejectId || !rejectReason) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/requests/${selectedRejectId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: rejectReason })
      });
      
      if (res.ok) {
        mutate();
        toast.success('Penarikan berhasil ditolak');
        setSelectedRejectId(null);
        setRejectReason('');
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Gagal memproses penolakan');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan jaringan');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-500 flex items-center justify-center gap-2"><CircleNotch weight="bold" className="animate-spin w-5 h-5"/> Memuat antrean penarikan...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Permintaan Penarikan Dana</h1>
        <p className="text-slate-500 mt-1">Kelola dan proses pengajuan penarikan dana dari merchant.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {withdrawals.length === 0 ? (
           <div className="text-center py-20">
             <div className="w-16 h-16 bg-blue-50 rounded-full mx-auto flex items-center justify-center mb-4">
                <CheckCircle weight="fill" className="w-8 h-8 text-blue-500" />
             </div>
             <h3 className="text-lg font-bold text-slate-800">Tidak ada permintaan</h3>
             <p className="text-slate-500">Semua permintaan penarikan telah diproses.</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                  <th className="p-4">Tanggal / Waktu</th>
                  <th className="p-4">Merchant</th>
                  <th className="p-4">Tujuan Transfer</th>
                  <th className="p-4">Nominal Transfer</th>
                  <th className="p-4 w-48">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {withdrawals.map((req: any) => {
                  const { fee, transferAmount, totalDeduction } = getWithdrawalDetails(req.payload);
                  return (
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
                         <div className="text-sm">
                            <p className="font-bold text-slate-900">{req.payload?.bankCode}</p>
                            <p className="text-slate-700">{req.payload?.accountNumber}</p>
                            <p className="text-slate-500 mt-1 uppercase">{req.payload?.accountName}</p>
                         </div>
                      </td>
                      <td className="p-4 align-top">
                         <p className="text-lg font-bold text-slate-900">Rp {new Intl.NumberFormat('id-ID').format(transferAmount)}</p>
                         <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                           <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                             {req.payload?.payoutType === 'INSTANT_PAID' ? 'Instan' : 'Terjadwal'}
                           </span>
                           {fee > 0 ? (
                             <span className="text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">
                               Biaya: Rp {new Intl.NumberFormat('id-ID').format(fee)}
                             </span>
                           ) : (
                             <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                               Gratis
                             </span>
                           )}
                         </div>
                         {fee > 0 && (
                           <p className="text-[11px] text-slate-400 mt-1">Potong Saldo: Rp {new Intl.NumberFormat('id-ID').format(totalDeduction)}</p>
                         )}
                      </td>
                      <td className="p-4 align-top">
                        <div className="flex flex-col gap-2">
                          <button 
                            onClick={() => setSelectedApproveId(req.id)}
                            className="w-full bg-green-100 text-green-700 hover:bg-green-200 px-3 py-2 rounded-lg font-bold text-sm transition-colors border border-green-200 flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle weight="fill" className="w-4 h-4" /> Konfirmasi
                          </button>
                          <button 
                            onClick={() => setSelectedRejectId(req.id)}
                            className="w-full bg-red-100 text-red-700 hover:bg-red-200 px-3 py-2 rounded-lg font-bold text-sm transition-colors border border-red-200 flex items-center justify-center gap-1.5"
                          >
                            <XCircle weight="fill" className="w-4 h-4" /> Tolak
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Approve */}
      {selectedApproveId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl relative">
            <button onClick={() => { setSelectedApproveId(null); setProofFile(null); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X weight="bold" className="w-5 h-5"/></button>
            <h2 className="text-xl font-bold mb-1 text-slate-900">Konfirmasi Penarikan</h2>
            <p className="text-sm text-slate-500 mb-4">Unggah bukti transfer untuk menyelesaikan permintaan ini.</p>
            
            {selectedApproveReq && (() => {
              const { fee, transferAmount, totalDeduction } = getWithdrawalDetails(selectedApproveReq.payload);
              return (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-5 text-sm space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Merchant:</span>
                    <span className="font-bold text-slate-800">{selectedApproveReq.merchants?.business_name}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Tujuan:</span>
                    <span className="font-semibold text-slate-800">{selectedApproveReq.payload?.bankCode} - {selectedApproveReq.payload?.accountNumber} ({selectedApproveReq.payload?.accountName})</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-200 pt-1.5 mt-1">
                    <span className="text-xs text-slate-600 font-semibold">Nominal Ditransfer:</span>
                    <span className="font-extrabold text-base text-slate-900">Rp {new Intl.NumberFormat('id-ID').format(transferAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Biaya Admin:</span>
                    <span className={`font-bold ${fee > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {fee > 0 ? `Rp ${new Intl.NumberFormat('id-ID').format(fee)}` : 'Gratis'}
                    </span>
                  </div>
                  {fee > 0 && (
                    <div className="flex justify-between items-center text-[11px] text-slate-400">
                      <span>Total Potong Saldo:</span>
                      <span>Rp {new Intl.NumberFormat('id-ID').format(totalDeduction)}</span>
                    </div>
                  )}
                </div>
              );
            })()}

            <form onSubmit={handleApprove} className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()} 
                className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:bg-slate-50 transition-colors"
              >
                {proofFile ? (
                  <div className="flex flex-col items-center">
                    <ImageIcon weight="duotone" className="w-8 h-8 text-[#00DDFD] mb-2" />
                    <p className="text-sm font-semibold text-slate-700">{proofFile.name}</p>
                    <p className="text-xs text-slate-500 mt-1">Klik untuk mengganti gambar</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                      <ImageIcon weight="duotone" className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">Pilih gambar bukti transfer</p>
                    <p className="text-xs text-slate-500 mt-1">JPG, PNG (Maks 5MB)</p>
                  </div>
                )}
                <input required type="file" accept="image/*" ref={fileInputRef} onChange={e => setProofFile(e.target.files?.[0] || null)} className="hidden" />
              </div>
              
              <button disabled={actionLoading || !proofFile} type="submit" className="w-full bg-slate-900 text-white rounded-xl py-3 font-semibold hover:bg-slate-800 flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed mt-4">
                 {actionLoading ? <CircleNotch weight="bold" className="w-5 h-5 animate-spin" /> : 'Unggah & Selesai'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reject */}
      {selectedRejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl relative">
            <button onClick={() => { setSelectedRejectId(null); setRejectReason(''); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X weight="bold" className="w-5 h-5"/></button>
            <h2 className="text-xl font-bold mb-1 text-slate-900">Tolak Penarikan</h2>
            <p className="text-sm text-slate-500 mb-4">Saldo akan dikembalikan penuh ke merchant.</p>
            
            {selectedRejectReq && (() => {
              const { transferAmount, totalDeduction } = getWithdrawalDetails(selectedRejectReq.payload);
              return (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 text-xs space-y-1">
                  <p><span className="text-slate-500">Merchant:</span> <strong className="text-slate-800">{selectedRejectReq.merchants?.business_name}</strong></p>
                  <p><span className="text-slate-500">Nominal Transfer:</span> <strong className="text-slate-800">Rp {new Intl.NumberFormat('id-ID').format(transferAmount)}</strong></p>
                  <p><span className="text-slate-500">Saldo Dikembalikan:</span> <strong className="text-slate-800">Rp {new Intl.NumberFormat('id-ID').format(totalDeduction)}</strong></p>
                </div>
              );
            })()}

            <form onSubmit={handleReject} className="space-y-4">
              <div>
                 <label className="block text-sm font-bold text-slate-800 mb-2">Alasan Penolakan</label>
                 <textarea required value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} placeholder="Contoh: Rekening tujuan tidak valid" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-black placeholder-slate-400" />
              </div>
              <button disabled={actionLoading || !rejectReason} type="submit" className="w-full bg-red-600 text-white rounded-xl py-3 font-semibold hover:bg-red-700 flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed">
                 {actionLoading ? <CircleNotch weight="bold" className="w-5 h-5 animate-spin" /> : 'Tolak Penarikan'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
