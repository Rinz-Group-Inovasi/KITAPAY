'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SquaresFour, FileText, Receipt, ChartLineUp, DownloadSimple, Bank, ShieldCheck, BookOpen, Key, User, Star, Headset } from '@phosphor-icons/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

export const DASHBOARD_LINKS = [
  { name: 'Dashboard', href: '/dashboard', icon: SquaresFour },
  { name: 'Transaksi', href: '/dashboard/transactions', icon: ChartLineUp },
  { name: 'Invoice', href: '/dashboard/invoice', icon: Receipt },
  { name: 'Level Merchant', href: '/dashboard/tier', icon: Star },
  { name: 'Webhook Log', href: '/dashboard/webhooks', icon: FileText },
  { name: 'Penarikan', href: '/dashboard/withdraw', icon: DownloadSimple },
  { name: 'Rekening Bank', href: '/dashboard/bank-accounts', icon: Bank },
  { name: 'KYC', href: '/dashboard/kyc', icon: ShieldCheck },
  { name: 'Pengaturan Profil', href: '/dashboard/profile', icon: User },
  { name: 'API Keys', href: '/dashboard/api-keys', icon: Key },
  { name: 'Panduan', href: '/docs', icon: BookOpen },
  { name: 'Support', href: '/dashboard/support', icon: Headset },
];

export function Sidebar({ isSandbox = false }: { isSandbox?: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex md:flex-col shrink-0 sticky top-0 h-screen">
      <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2">
          <img src="/KitaPay Emblem.png" alt="KitaPay Emblem" className="h-9 w-auto object-contain" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 py-4 overflow-y-auto pb-10" data-lenis-prevent="true">
        {DASHBOARD_LINKS.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                'flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? (isSandbox ? 'bg-orange-500/10 text-orange-500' : 'bg-[#00DDFD]/10 text-[#00DDFD]')
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon weight="duotone" className="w-5 h-5" />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
