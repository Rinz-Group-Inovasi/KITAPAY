'use client';

import React, { useState, useEffect } from 'react';
import { MagnifyingGlass, ArrowsClockwise, CheckCircle, XCircle, CaretRight, Link, ArrowUpRight } from '@phosphor-icons/react';
import useSWR from 'swr';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getClientMerchantId, API_BASE_URL, fetcher } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useEnv } from '@/components/EnvProvider';
import { PageSkeleton } from '@/components/PageSkeleton';
import { useToast } from '@/components/ToastProvider';

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

export default function WebhooksPage() {
  const { user } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const isSandbox = useEnv();
  const toast = useToast();

  const merchantId = user ? getClientMerchantId(user.id) : null;
  const env = isSandbox ? 'sandbox' : 'live';

  const { data: logsData, isValidating: loading, mutate: mutateLogs } = useSWR(
    merchantId && user ? `${API_BASE_URL}/webhooks/logs/${merchantId}?env=${env}` : null,
    fetcher,
    { refreshInterval: 30000 }
  );

  const { data: settingsData, mutate: mutateSettings } = useSWR(
    merchantId && user ? `${API_BASE_URL}/merchant/webhook-settings/${merchantId}` : null,
    fetcher
  );

  const logs = logsData?.logs || [];
  const webhookUrl = settingsData?.webhookUrl || '';
  const sandboxWebhookUrl = settingsData?.sandboxWebhookUrl || '';

  const [localWebhookUrl, setLocalWebhookUrl] = useState('');
  const [localSandboxWebhookUrl, setLocalSandboxWebhookUrl] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    if (settingsData) {
      setLocalWebhookUrl(settingsData.webhookUrl || '');
      setLocalSandboxWebhookUrl(settingsData.sandboxWebhookUrl || '');
    }
  }, [settingsData]);

  const handleRefresh = async () => {
    await mutateLogs();
    toast.success('Data riwayat Webhook berhasil diperbarui!');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !merchantId) return;
    setSavingSettings(true);
    try {
      await fetch(`${API_BASE_URL}/merchant/webhook-settings/${merchantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: localWebhookUrl, sandboxWebhookUrl: localSandboxWebhookUrl })
      });
      setIsSettingsOpen(false);
      mutateSettings();
      toast.success('Pengaturan endpoint berhasil disimpan!');
    } catch (err) {
      toast.error('Gagal menyimpan pengaturan.');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  const successCount = logs.filter((l: any) => l.response_status >= 200 && l.response_status < 300).length;
  const failCount = logs.length - successCount;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Webhook Log</h1>
          <p className="text-slate-500 text-sm mt-1">Pantau notifikasi event real-time yang dikirimkan ke server Anda.</p>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button 
            onClick={handleRefresh}
            className="flex items-center justify-center space-x-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors w-full sm:w-auto"
          >
            <ArrowsClockwise weight="bold" className={cn("w-4 h-4", loading && "animate-spin")} />
            <span>Segarkan</span>
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold transition-colors w-full sm:w-auto",
              isSandbox ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-[#00DDFD] text-slate-900 hover:bg-[#00c5e3]"
            )}>
            Pengaturan Endpoint
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500 mb-1">Berhasil</p>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-slate-800">{successCount}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500 mb-1">Gagal</p>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-slate-800">{failCount}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500 mb-1">Endpoint Terdaftar ({isSandbox ? 'Sandbox' : 'Live'})</p>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 truncate">{isSandbox ? (sandboxWebhookUrl || 'Belum diatur') : (webhookUrl || 'Belum diatur')}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50/50">
          <div className="relative w-full sm:w-96">
            <MagnifyingGlass weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari ID event atau tipe..." 
              className={cn(
                "w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2",
                isSandbox ? "focus:ring-orange-500" : "focus:ring-[#00DDFD]"
              )}
            />
          </div>
        </div>

        {/* Desktop List */}
        <div className="hidden md:block divide-y divide-slate-100">
          {logs.length > 0 ? logs.map((wh: any) => (
            <React.Fragment key={wh.id}>
              <div onClick={() => setExpandedLogId(expandedLogId === wh.id ? null : wh.id)} className="p-4 sm:px-6 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center cursor-pointer group">
                <div className="flex items-start space-x-4">
                  <div className={cn(
                    "mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                    wh.response_status >= 200 && wh.response_status < 300 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                  )}>
                    {wh.response_status >= 200 && wh.response_status < 300 ? <CheckCircle weight="fill" className="w-5 h-5" /> : <XCircle weight="fill" className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-800">{wh.event_type}</span>
                      <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{wh.id.substring(0, 8)}...</span>
                    </div>
                    <div className="text-sm text-slate-500 mt-1 flex items-center space-x-2">
                      <Link weight="bold" className="w-4 h-4 text-slate-400" />
                      <span className="truncate max-w-50 sm:max-w-md">{isSandbox ? sandboxWebhookUrl : webhookUrl}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-2 sm:hidden">
                      {new Date(wh.created_at).toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="hidden sm:block text-right">
                    <div className="text-sm font-medium text-slate-800">{wh.response_status} {wh.response_status >= 200 && wh.response_status < 300 ? 'OK' : 'Error'}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{new Date(wh.created_at).toLocaleString('id-ID')}</div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <CaretRight weight="bold" className={cn("w-5 h-5 transition-transform", expandedLogId === wh.id ? "rotate-90" : "", isSandbox ? "text-slate-300 group-hover:text-orange-500" : "text-slate-300 group-hover:text-[#00DDFD]")} />
                  </div>
                </div>
              </div>
              
              {expandedLogId === wh.id && (
                <div className="bg-slate-50/80 p-4 sm:px-6 border-t border-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Request Payload</h4>
                      <pre className="bg-white text-slate-700 p-4 rounded-xl text-xs overflow-x-auto shadow-sm border border-slate-200 leading-relaxed font-mono">
                        {JSON.stringify(wh.payload, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Response Body (Status: {wh.response_status})</h4>
                      <pre className={cn(
                        "p-4 rounded-xl text-xs overflow-x-auto shadow-sm border leading-relaxed font-mono", 
                        wh.response_status >= 200 && wh.response_status < 300 
                          ? "bg-green-50 border-green-200 text-green-700" 
                          : "bg-red-50 border-red-200 text-red-700"
                      )}>
                        {wh.response_body || '(No content)'}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          )) : (
             <div className="p-8 text-center text-slate-500">Belum ada riwayat webhook.</div>
          )}
        </div>

        {/* Mobile List (Card View) */}
        <div className="md:hidden flex flex-col space-y-3 p-4 bg-slate-50/50">
          {logs.length > 0 ? logs.map((wh: any) => (
            <React.Fragment key={`mobile-${wh.id}`}>
              <div onClick={() => setExpandedLogId(expandedLogId === wh.id ? null : wh.id)} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col gap-3 cursor-pointer">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      wh.response_status >= 200 && wh.response_status < 300 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                    )}>
                      {wh.response_status >= 200 && wh.response_status < 300 ? <CheckCircle weight="fill" className="w-4 h-4" /> : <XCircle weight="fill" className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{wh.event_type}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">ID: {wh.id.substring(0, 8)}...</div>
                    </div>
                  </div>
                  <CaretRight weight="bold" className={cn("w-5 h-5 transition-transform", expandedLogId === wh.id ? "rotate-90" : "", isSandbox ? "text-slate-300" : "text-slate-300")} />
                </div>
                
                <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
                    <Link weight="bold" className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate max-w-37.5">{isSandbox ? sandboxWebhookUrl : webhookUrl}</span>
                  </div>
                  <div className={cn(
                    "text-xs font-bold px-2 py-1 rounded-md",
                    wh.response_status >= 200 && wh.response_status < 300 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  )}>
                    {wh.response_status}
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 text-right">
                  {new Date(wh.created_at).toLocaleString('id-ID')}
                </div>
              </div>
              
              {expandedLogId === wh.id && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-inner mb-2 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-1.5">Request Payload</h4>
                      <pre className="bg-white text-slate-700 p-3 rounded-xl text-[10px] overflow-x-auto shadow-sm border border-slate-200 leading-relaxed font-mono">
                        {JSON.stringify(wh.payload, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-1.5">Response (Status: {wh.response_status})</h4>
                      <pre className={cn(
                        "p-3 rounded-xl text-[10px] overflow-x-auto shadow-sm border leading-relaxed font-mono", 
                        wh.response_status >= 200 && wh.response_status < 300 
                          ? "bg-green-50 border-green-200 text-green-700" 
                          : "bg-red-50 border-red-200 text-red-700"
                      )}>
                        {wh.response_body || '(No content)'}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          )) : (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-100">
              <p className="font-medium text-slate-700">Belum ada riwayat webhook</p>
            </div>
          )}
        </div>
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 z-1000 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-100 shadow-xl relative">
            <button onClick={() => setIsSettingsOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><XCircle weight="bold" className="w-6 h-6"/></button>
            <h2 className="text-xl font-bold mb-4 text-black">Pengaturan Endpoint</h2>
            <form onSubmit={handleSaveSettings} className="space-y-4">
               <div>
                  <label className="block text-sm font-bold text-black mb-2">Live Webhook URL</label>
                  <input type="url" value={localWebhookUrl} onChange={e => setLocalWebhookUrl(e.target.value)} placeholder="Contoh: https://api.anda.com/webhook" className={cn(
                    "w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 text-black font-semibold bg-white placeholder-slate-500 focus:border-[#00DDFD] focus:ring-[#00DDFD]"
                  )} />
               </div>
               <div>
                  <label className="block text-sm font-bold text-black mb-2">Sandbox Webhook URL</label>
                  <input type="url" value={localSandboxWebhookUrl} onChange={e => setLocalSandboxWebhookUrl(e.target.value)} placeholder="Contoh: https://api.anda.com/webhook/test" className={cn(
                    "w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 text-black font-semibold bg-white placeholder-slate-500 focus:border-orange-500 focus:ring-orange-500"
                  )} />
               </div>
               <button disabled={savingSettings} type="submit" className={cn(
                 "w-full rounded-xl py-3 font-bold transition-colors",
                 isSandbox ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-[#00DDFD] text-slate-900 hover:bg-[#00c5e3]"
               )}>
                 {savingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
