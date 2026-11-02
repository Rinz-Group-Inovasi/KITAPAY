'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Users, FileText, CheckCircle, WarningCircle, ShieldCheck, SignOut, Clock, Headset } from '@phosphor-icons/react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState('ADMIN');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname === '/admin/login') {
      setLoading(false);
      return;
    }

    const adminSessionStr = localStorage.getItem('kitapay_admin_session');
    if (!adminSessionStr) {
      router.push('/admin/login');
    } else {
      try {
        const session = JSON.parse(adminSessionStr);
        if (session.role) {
          setRole(session.role);
        }
      } catch (e) {}
      setIsAdmin(true);
      setLoading(false);
    }
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('kitapay_admin_session');
    router.push('/admin/login');
  };

  if (loading) return null;

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex md:flex-col shrink-0 sticky top-0 h-screen z-10">
        <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0">
          <Link href="/admin" className="flex items-center gap-2.5">
            <img src="/KitaPay Emblem.png" alt="KitaPay Emblem" className="h-8 w-auto object-contain" />
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-900 text-white">Admin</span>
          </Link>
        </div>
        
        <nav className="flex-1 py-6 px-4 flex flex-col gap-1 overflow-y-auto">
          <Link 
            href="/admin" 
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm",
              pathname === '/admin' ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <FileText weight={pathname === '/admin' ? "fill" : "regular"} className="w-5 h-5" />
            Antrean Pengajuan
          </Link>
          <Link 
            href="/admin/history" 
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm",
              pathname === '/admin/history' ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <Clock weight={pathname === '/admin/history' ? "fill" : "regular"} className="w-5 h-5" />
            Riwayat Pengajuan
          </Link>
          <Link 
            href="/admin/merchants" 
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm",
              pathname === '/admin/merchants' ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <Users weight={pathname === '/admin/merchants' ? "fill" : "regular"} className="w-5 h-5" />
            Data Merchant
          </Link>
          <Link 
            href="/admin/withdrawals" 
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm",
              pathname === '/admin/withdrawals' ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <FileText weight={pathname === '/admin/withdrawals' ? "fill" : "regular"} className="w-5 h-5" />
            Permintaan Penarikan
          </Link>
          {role === 'SUPER_ADMIN' && (
            <Link 
              href="/admin/audit" 
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm mt-4 border border-purple-200 bg-purple-50",
                pathname === '/admin/audit' ? "bg-purple-900 text-white shadow-sm border-transparent" : "text-purple-700 hover:bg-purple-100 hover:text-purple-900"
              )}
            >
              <ShieldCheck weight={pathname === '/admin/audit' ? "fill" : "regular"} className="w-5 h-5" />
              Audit Penarikan
            </Link>
          )}
          <Link 
            href="/admin/support" 
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm mt-4 border border-[#00DDFD]/20 bg-[#00DDFD]/5",
              pathname === '/admin/support' ? "bg-[#00DDFD] text-slate-900 shadow-sm border-transparent" : "text-[#00c5e3] hover:bg-[#00DDFD]/10"
            )}
          >
            <Headset weight={pathname === '/admin/support' ? "fill" : "regular"} className="w-5 h-5" />
            Support Tiket
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck weight="fill" className="w-6 h-6 text-green-500" />
            <span className="font-bold text-slate-700 text-sm">Mode Administrator</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-[#00DDFD]/20 text-[#00DDFD] font-bold flex items-center justify-center border border-[#00DDFD]/30">
              A
            </div>
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-2 text-slate-500 hover:text-red-500 transition-colors text-sm font-bold bg-slate-50 hover:bg-red-50 px-4 py-2 rounded-xl"
            >
              <SignOut weight="bold" className="w-4 h-4" />
              Keluar
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
