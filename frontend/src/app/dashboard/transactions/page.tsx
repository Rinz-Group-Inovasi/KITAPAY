'use client';

import React, { useState, useEffect } from 'react';
import { MagnifyingGlass, Funnel, DownloadSimple, DotsThree, ArrowDownRight } from '@phosphor-icons/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import useSWR from 'swr';
import { getClientMerchantId, API_BASE_URL, fetcher } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useEnv } from '@/components/EnvProvider';
import { PageSkeleton } from '@/components/PageSkeleton';
import { useToast } from '@/components/ToastProvider';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

export default function TransactionsPage() {
  const { user } = useAuth();
  const isSandbox = useEnv();
  const merchantId = user ? getClientMerchantId(user.id) : null;
  const env = isSandbox ? 'sandbox' : 'live';
  const toast = useToast();
  const [resendingId, setResendingId] = useState<string | null>(null);

  const { data, error } = useSWR(
    merchantId ? `${API_BASE_URL}/merchant/transactions/${merchantId}?env=${env}` : null,
    fetcher,
    { refreshInterval: 15000 }
  );

  const transactions = data?.transactions || [];
  const loading = !data && !error;

  useEffect(() => {
    if (!loading) {
      window.dispatchEvent(new Event('envloaded'));
    }
  }, [loading]);

  const handleResendWebhook = async (txId: string) => {
    if (resendingId) return;
    setResendingId(txId);
    try {
      const res = await fetch(`${API_BASE_URL}/webhooks/resend/${txId}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Webhook berhasil dikirim ulang');
      } else {
        toast.error(`Gagal mengirim ulang webhook: ${data.error || 'Terjadi kesalahan'}`);
      }
    } catch {
      toast.error('Terjadi kesalahan saat menghubungi server');
    } finally {
      setResendingId(null);
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Transaksi</h1>
          <p className="text-slate-500 text-sm mt-1">Lihat dan kelola semua pembayaran masuk dan keluar Anda.</p>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button className="flex items-center justify-center space-x-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
            <DownloadSimple weight="bold" className="w-4 h-4" />
            <span>Ekspor</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50/50">
          <div className="relative w-full sm:w-96">
            <MagnifyingGlass weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari ID, nama, atau nominal..." 
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00DDFD]"
            />
          </div>
          <button className="flex items-center space-x-2 text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 w-full sm:w-auto justify-center">
            <Funnel weight="bold" className="w-4 h-4" />
            <span>Saring</span>
          </button>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">ID Transaksi</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Tanggal</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Tipe</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Nominal</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="py-4 px-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length > 0 ? (
                transactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-800 text-sm">{tx.external_id}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{tx.id.substring(0, 8)}...</div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">
                      {new Date(tx.created_at).toLocaleString('id-ID', { 
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                          <ArrowDownRight weight="bold" className="w-3 h-3" />
                        </div>
                        <span className="text-sm text-slate-700">Pembayaran Masuk</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm font-bold text-slate-800">
                      Rp {new Intl.NumberFormat('id-ID').format(tx.net_amount || tx.amount)}
                    </td>
                    <td className="py-4 px-6">
                      <span className={cn(
                        'text-xs font-bold px-3 py-1 rounded-full',
                        (tx.status === 'PAID' || tx.status === 'COMPLETED') && 'bg-green-100 text-green-700',
                        tx.status === 'PENDING' && 'bg-yellow-100 text-yellow-700',
                        tx.status === 'EXPIRED' && 'bg-red-100 text-red-700'
                      )}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Menu as="div" className="relative inline-block text-left">
                        <Menu.Button className="text-slate-400 hover:text-[#00DDFD] transition-colors p-2 rounded-lg hover:bg-slate-100 outline-none focus:ring-2 focus:ring-[#00DDFD]/50">
                          <DotsThree weight="bold" className="w-5 h-5" />
                        </Menu.Button>
                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10 border border-slate-100">
                            <div className="p-1.5">
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => handleResendWebhook(tx.id)}
                                    disabled={resendingId === tx.id}
                                    className={cn(
                                      active ? 'bg-slate-50 text-[#00DDFD]' : 'text-slate-700',
                                      'group flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50'
                                    )}
                                  >
                                    {resendingId === tx.id ? 'Mengirim...' : 'Kirim Ulang Webhook'}
                                  </button>
                                )}
                              </Menu.Item>
                            </div>
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                        <MagnifyingGlass weight="bold" className="w-5 h-5 text-slate-400" />
                      </div>
                      <p className="font-medium text-slate-700">Tidak ada transaksi</p>
                      <p className="text-sm mt-1">Semua pembayaran masuk Anda akan tampil di sini.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden flex flex-col space-y-3 p-4">
          {transactions.length > 0 ? (
            transactions.map((tx: any) => (
              <div key={tx.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{tx.external_id}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {new Date(tx.created_at).toLocaleString('id-ID', { 
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={cn(
                      'text-[10px] font-bold px-2.5 py-1 rounded-full',
                      (tx.status === 'PAID' || tx.status === 'COMPLETED') && 'bg-green-100 text-green-700',
                      tx.status === 'PENDING' && 'bg-yellow-100 text-yellow-700',
                      tx.status === 'EXPIRED' && 'bg-red-100 text-red-700'
                    )}>
                      {tx.status}
                    </span>
                    <Menu as="div" className="relative inline-block text-left">
                      <Menu.Button className="text-slate-400 hover:text-[#00DDFD] transition-colors p-1 rounded-lg hover:bg-slate-50 outline-none">
                        <DotsThree weight="bold" className="w-5 h-5" />
                      </Menu.Button>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 mt-1 w-48 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10 border border-slate-100">
                          <div className="p-1.5">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => handleResendWebhook(tx.id)}
                                  disabled={resendingId === tx.id}
                                  className={cn(
                                    active ? 'bg-slate-50 text-[#00DDFD]' : 'text-slate-700',
                                    'group flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50'
                                  )}
                                >
                                  {resendingId === tx.id ? 'Mengirim...' : 'Kirim Ulang Webhook'}
                                </button>
                              )}
                            </Menu.Item>
                          </div>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>
                </div>
                
                <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                      <ArrowDownRight weight="bold" className="w-3 h-3" />
                    </div>
                    <span className="text-sm font-medium text-slate-600">Pembayaran Masuk</span>
                  </div>
                  <div className="text-sm font-black text-slate-800">
                    Rp {new Intl.NumberFormat('id-ID').format(tx.amount)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-100">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                <MagnifyingGlass weight="bold" className="w-5 h-5 text-slate-400" />
              </div>
              <p className="font-medium text-slate-700">Tidak ada transaksi</p>
              <p className="text-sm mt-1">Semua pembayaran masuk Anda akan tampil di sini.</p>
            </div>
          )}
        </div>
        
        {/* Pagination Mockup */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-600 bg-slate-50/50">
          <div>Menampilkan 1 hingga {transactions?.length || 0} dari {transactions?.length || 0} entri</div>
          <div className="flex space-x-1">
            <button className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50" disabled>Sebelumnya</button>
            <button className="px-3 py-1 bg-[#00DDFD] text-slate-900 font-medium rounded-lg">1</button>
            <button className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50" disabled>Selanjutnya</button>
          </div>
        </div>
      </div>
    </div>
  );
}
