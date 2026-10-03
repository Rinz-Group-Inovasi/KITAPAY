'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';
import { ShieldAlert, Loader2 } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isClaimed, setIsClaimed] = useState(true);
  const [error, setError] = useState('');
  
  React.useEffect(() => {
    fetch(`${API_BASE_URL}/admin/status?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        setIsClaimed(data.isClaimed);
        setChecking(false);
      })
      .catch(err => {
        console.error(err);
        setChecking(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isClaimed ? '/admin/login' : '/admin/claim';
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || (isClaimed ? 'Login gagal' : 'Gagal klaim admin'));
      }

      localStorage.setItem('kitapay_admin_session', JSON.stringify(data.admin));
      router.push('/admin');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><Loader2 className="w-10 h-10 animate-spin text-[#00DDFD]" /></div>;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8 text-center bg-slate-800 border-b border-slate-700">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-inner border border-slate-700">
             <ShieldAlert className="w-8 h-8 text-[#00DDFD]" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{isClaimed ? 'Login Admin' : 'Klaim Akun Admin'}</h1>
          <p className="text-slate-400 mt-2 text-sm">{isClaimed ? 'Portal manajemen sistem KitaPay' : 'Sistem belum memiliki Admin. Silakan buat akun Admin pertama Anda.'}</p>
        </div>
        <div className="p-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-semibold mb-6 border border-red-100 text-center">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Email Admin</label>
              <input 
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00DDFD] focus:border-[#00DDFD] text-black font-semibold"
                placeholder={isClaimed ? "admin@kitapay.com" : "Email Anda"}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Password</label>
              <input 
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00DDFD] focus:border-[#00DDFD] text-black font-semibold"
                placeholder="••••••••"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#00DDFD] text-slate-900 font-bold py-3.5 rounded-xl hover:bg-[#00c5e3] transition-colors disabled:opacity-70 flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isClaimed ? 'Masuk ke Dashboard' : 'Klaim Sekarang')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
