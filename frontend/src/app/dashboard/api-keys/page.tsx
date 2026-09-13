'use client';

import React, { useState, useEffect } from 'react';
import { Key, Copy, Check, Warning, Eye, EyeSlash, ArrowsClockwise } from '@phosphor-icons/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { useAuth } from '@/components/AuthProvider';
import { useEnv } from '@/components/EnvProvider';
import { useToast } from '@/components/ToastProvider';
import { useConfirm } from '@/components/ConfirmModalProvider';
import { API_BASE_URL, SANDBOX_MERCHANT_ID, fetcher } from '@/lib/api';
import { PageSkeleton } from '@/components/PageSkeleton';
import useSWR from 'swr';
import { jsPDF } from 'jspdf';

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

export default function ApiKeysPage() {
  const { user } = useAuth();
  const isSandbox = useEnv();
  const toast = useToast();
  const modal = useConfirm();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showLiveSecret, setShowLiveSecret] = useState(false);
  const [showTestSecret, setShowTestSecret] = useState(false);
  
  const { data, isLoading: loading, mutate } = useSWR(
    user ? `${API_BASE_URL}/merchant/api-keys/${user.id}` : null,
    fetcher
  );

  const [liveSecretKey, setLiveSecretKey] = useState<string | null>(null);
  const [sandboxSecretKey, setSandboxSecretKey] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setLiveSecretKey(data.liveSecretKey);
      setSandboxSecretKey(data.sandboxSecretKey);
    }
  }, [data]);

  const generateKey = async (type: 'live' | 'sandbox') => {
    const isConfirmed = await modal.confirm(
      <div className="space-y-4 mt-1">
        <p>Apakah Anda yakin ingin membuat/mereset Secret Key <strong className="text-slate-700">{type.toUpperCase()}</strong>?</p>
        <p>Key lama tidak akan bisa digunakan lagi.</p>
        <div className="bg-orange-50 text-orange-800 p-4 rounded-xl border border-orange-200">
          <p className="font-bold mb-1">PENTING:</p>
          <p>Key yang baru <strong>HANYA AKAN DITAMPILKAN SATU KALI</strong> setelah Anda menekan tombol konfirmasi ini. Pastikan Anda bersiap untuk menyalinnya.</p>
        </div>
      </div>
    );
    if (!isConfirmed) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/merchant/api-keys/${user?.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      if (res.ok) {
        const data = await res.json();
        if (type === 'live') setLiveSecretKey(data.key);
        else setSandboxSecretKey(data.key);
        
        downloadKeyPDF(type, data.key);
        
        toast.success(`Secret Key ${type.toUpperCase()} berhasil dibuat! PDF berhasil diunduh. Salin SEKARANG.`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal membuat key baru');
    }
  };

  const downloadKeyPDF = async (type: 'live' | 'sandbox', key: string) => {
    const doc = new jsPDF();
    
    const typeLabel = type === 'live' ? 'LIVE SECRET KEY' : 'SANDBOX SECRET KEY';
    const dateStr = new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) + ' WIB';
    
    // Header
    try {
      const img = new window.Image();
      img.src = '/KitaPay Blue Typograph.png';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      const imgWidth = 45;
      const imgHeight = (img.height * imgWidth) / img.width;
      doc.addImage(img, 'PNG', 20, 12, imgWidth, imgHeight);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(0, 221, 253); // #00DDFD
      doc.text("Security", 20 + imgWidth + 4, 12 + imgHeight - 2);
    } catch (e) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(0, 221, 253);
      doc.text("KitaPay Security", 20, 20);
    }
    
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text("KREDENSIAL API", 20, 35);
    
    // Status
    doc.setFontSize(10);
    doc.setTextColor(239, 68, 68);
    doc.text("[DOKUMEN RAHASIA]", 150, 35);

    // Line
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 42, 190, 42);
    
    // Content
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Tipe Key:", 20, 55);
    doc.text("Tanggal Dibuat:", 20, 65);
    doc.text("API Key:", 20, 85);
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(typeLabel, 60, 55);
    doc.text(dateStr, 60, 65);
    
    // Key Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(20, 90, 170, 20, 3, 3, "FD");
    
    doc.setFont("courier", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(key, 25, 103);
    
    // Warning
    doc.setFillColor(255, 247, 237);
    doc.setDrawColor(254, 215, 170);
    doc.roundedRect(20, 130, 170, 40, 3, 3, "FD");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(154, 52, 18);
    doc.text("PERINGATAN KEAMANAN:", 25, 140);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(194, 65, 12);
    doc.text("- Simpan file ini di tempat yang aman (Vault, .env file).", 25, 150);
    doc.text("- Jangan pernah bagikan atau commit kunci ini ke repository publik.", 25, 158);
    doc.text("- KitaPay TIDAK MENYIMPAN kunci asli ini. Jika hilang, Anda harus reset.", 25, 166);
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Dokumen ini di-generate otomatis secara aman di browser Anda.", 20, 280);
    
    doc.save(`KitaPay-${type.toUpperCase()}-SecretKey.pdf`);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const API_KEYS = [
    { id: 'pk_live', name: 'Live Public Key (Merchant ID)', key: user?.id || 'Memuat...', type: 'live', isSecret: false, canGenerate: false },
    { id: 'sk_live', name: 'Live Secret Key', key: liveSecretKey || '', type: 'live', isSecret: true, canGenerate: true },
    { id: 'pk_test', name: 'Sandbox Public Key (Merchant ID)', key: user?.id || 'Memuat...', type: 'test', isSecret: false, canGenerate: false }, // Use same ID for public key, separated by secret key
    { id: 'sk_test', name: 'Sandbox Secret Key', key: sandboxSecretKey || '', type: 'test', isSecret: true, canGenerate: true },
  ];

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Key weight="duotone" className="w-6 h-6 text-[#00DDFD]" />
          API Keys
        </h1>
        <p className="text-slate-500 text-sm mt-1">Kelola kredensial API Anda untuk mengakses layanan KitaPay.</p>
      </div>

      {/* Warning Banner */}
      <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl flex items-start space-x-3">
        <Warning weight="duotone" className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-orange-800">Peringatan Keamanan</h4>
          <p className="text-sm text-orange-700 mt-1">Jangan pernah membagikan Secret Key Anda atau mengeksposnya pada kode frontend. Simpan Secret Key dengan aman di server Anda. Public Key aman digunakan di frontend.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Live Environment */}
        {!isSandbox && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-semibold text-slate-800">Lingkungan Live</h3>
                <p className="text-sm text-slate-500 mt-0.5">Gunakan key ini untuk memproses transaksi uang sungguhan.</p>
              </div>
              <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">PRODUCTION</div>
            </div>
            <div className="p-6 space-y-6">
              {API_KEYS.filter(k => k.type === 'live').map(k => (
                <div key={k.id}>
                  <div className="text-sm font-medium text-slate-700 mb-1.5 flex justify-between items-center">
                    <span>{k.name}</span>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type={k.isSecret && !showLiveSecret ? "password" : "text"} 
                      value={k.key} 
                      readOnly 
                      placeholder={k.isSecret ? "Belum dibuat. Silakan generate key baru." : ""}
                      className="w-full bg-slate-50 border border-slate-200 border-r-0 rounded-l-xl px-4 py-3 text-sm font-mono text-slate-700 focus:outline-none"
                    />
                    {k.isSecret && k.key && (
                      <button 
                        onClick={() => setShowLiveSecret(!showLiveSecret)}
                        className="bg-slate-50 border border-y-slate-200 border-x-0 px-3 py-3 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showLiveSecret ? <EyeSlash weight="bold" className="w-4 h-4" /> : <Eye weight="bold" className="w-4 h-4" />}
                      </button>
                    )}
                    {k.canGenerate && (
                      <button 
                        onClick={() => generateKey('live')}
                        className="bg-slate-50 border border-y-slate-200 border-x-0 px-3 py-3 text-orange-500 hover:text-orange-600 transition-colors border-l"
                        title="Generate / Reset Key"
                      >
                        <ArrowsClockwise weight="bold" className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => k.key && copyToClipboard(k.key, k.id)}
                      disabled={!k.key}
                      className={cn(
                        "border border-slate-200 rounded-r-xl px-4 py-3 font-semibold text-sm transition-colors flex items-center space-x-2",
                        !k.key ? "bg-slate-100 text-slate-400 cursor-not-allowed" : 
                        copiedKey === k.id ? "bg-green-500 text-white border-green-500" : "bg-white text-slate-700 hover:bg-slate-50 hover:text-[#00DDFD]"
                      )}
                    >
                      {copiedKey === k.id ? <Check weight="bold" className="w-4 h-4" /> : <Copy weight="bold" className="w-4 h-4" />}
                      <span className="hidden sm:inline">{copiedKey === k.id ? 'Tersalin!' : 'Salin'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Test Environment */}
        {isSandbox && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-semibold text-slate-800">Lingkungan Uji Coba</h3>
              <p className="text-sm text-slate-500 mt-0.5">Gunakan key ini untuk mensimulasikan transaksi tanpa uang sungguhan.</p>
            </div>
            <div className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">SANDBOX</div>
          </div>
          <div className="p-6 space-y-6">
            {API_KEYS.filter(k => k.type === 'test').map(k => (
              <div key={k.id}>
                <div className="text-sm font-medium text-slate-700 mb-1.5 flex justify-between items-center">
                  <span>{k.name}</span>
                </div>
                <div className="flex items-center">
                  <input 
                    type={k.isSecret && !showTestSecret ? "password" : "text"} 
                    value={k.key} 
                    readOnly 
                    placeholder={k.isSecret ? "Belum dibuat. Silakan generate key baru." : ""}
                    className="w-full bg-slate-50 border border-slate-200 border-r-0 rounded-l-xl px-4 py-3 text-sm font-mono text-slate-700 focus:outline-none"
                  />
                  {k.isSecret && k.key && (
                    <button 
                      onClick={() => setShowTestSecret(!showTestSecret)}
                      className="bg-slate-50 border border-y-slate-200 border-x-0 px-3 py-3 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showTestSecret ? <EyeSlash weight="bold" className="w-4 h-4" /> : <Eye weight="bold" className="w-4 h-4" />}
                    </button>
                  )}
                  {k.canGenerate && (
                    <button 
                      onClick={() => generateKey('sandbox')}
                      className="bg-slate-50 border border-y-slate-200 border-x-0 px-3 py-3 text-orange-500 hover:text-orange-600 transition-colors border-l"
                      title="Generate / Reset Key"
                    >
                      <ArrowsClockwise weight="bold" className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    onClick={() => k.key && copyToClipboard(k.key, k.id)}
                    disabled={!k.key}
                    className={cn(
                      "border border-slate-200 rounded-r-xl px-4 py-3 font-semibold text-sm transition-colors flex items-center space-x-2",
                      !k.key ? "bg-slate-100 text-slate-400 cursor-not-allowed" : 
                      copiedKey === k.id ? "bg-green-500 text-white border-green-500" : "bg-white text-slate-700 hover:bg-slate-50 hover:text-[#00DDFD]"
                    )}
                  >
                    {copiedKey === k.id ? <Check weight="bold" className="w-4 h-4" /> : <Copy weight="bold" className="w-4 h-4" />}
                    <span className="hidden sm:inline">{copiedKey === k.id ? 'Tersalin!' : 'Salin'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
