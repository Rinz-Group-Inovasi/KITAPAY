'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, CaretDown, User as UserIcon, SignOut, List, X } from '@phosphor-icons/react';
import { EnvToggle } from '@/components/EnvToggle';
import { useAuth } from '@/components/AuthProvider';
import { getClientMerchantId } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';
import { DASHBOARD_LINKS } from './Sidebar';
import Link from 'next/link';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

interface TopbarProps {
  initialIsSandbox: boolean;
  kycStatus: string;
  defaultName: string;
}

export function Topbar({ initialIsSandbox, kycStatus, defaultName }: TopbarProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [displayName, setDisplayName] = useState(defaultName);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // block scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  // close mobile menu when pathname changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadProfile = () => {
    if (user) {
      const merchantId = getClientMerchantId(user.id);
      const profileKey = `kitapay_profile_${merchantId}`;
      const savedData = localStorage.getItem(profileKey + '_data');
      if (savedData) {
        try {
          const profile = JSON.parse(savedData);
          if (profile.businessName) setDisplayName(profile.businessName);
        } catch(e) {}
      }
      
      // Fetch securely via API
      fetch('/api/merchant/profile')
        .then(res => res.json())
        .then(data => {
          if (data && !data.error && data.business_name && data.business_name !== 'My Business') {
            setDisplayName(data.business_name);
          }
        })
        .catch(console.error);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  // Update name if profile changes
  useEffect(() => {
    const handleProfileUpdate = () => {
      if (user) {
        const merchantId = getClientMerchantId(user.id);
        const profileKey = `kitapay_profile_${merchantId}`;
        const saved = localStorage.getItem(`kitapay_profile_${merchantId}_data`) || localStorage.getItem(profileKey);
        if (saved && saved !== 'synced') {
          try {
            const p = JSON.parse(saved);
            if (p.businessName) {
              setDisplayName(p.businessName);
            }
          } catch (e) {
            console.error('Failed to parse profile data from localStorage', e);
          }
        }
      }
    };
    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, [user]);

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    router.push('/dashboard/profile');
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    signOut();
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200 text-slate-800 px-4 md:px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-100">
        
        <div className="flex items-center gap-2 md:gap-4">
          {/* Hamburger Icon for Mobile */}
          <button 
            className="md:hidden p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-50 transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <List className="w-6 h-6" />
          </button>
          
          <EnvToggle initialIsSandbox={initialIsSandbox} kycStatus={kycStatus} />
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="relative p-2 text-slate-500 hover:text-[#00DDFD] transition-colors rounded-full hover:bg-slate-50">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>
          
          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-3 p-1.5 pr-3 rounded-full hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
            >
              <div className="w-9 h-9 rounded-full bg-[#00DDFD]/10 overflow-hidden flex items-center justify-center text-[#00b5d1] font-bold shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="font-bold text-sm text-slate-800 leading-none">{displayName}</span>
                <span className="text-xs text-slate-500 mt-1">Admin</span>
              </div>
              <CaretDown weight="bold" className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                <div className="px-4 py-3 border-b border-slate-50 mb-2">
                  <p className="text-sm font-bold text-slate-800 truncate">{displayName}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
                
                <div className="px-2 space-y-1">
                  <button 
                    onClick={handleProfileClick}
                    className="w-full text-left px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-3"
                  >
                    <UserIcon weight="duotone" className="w-5 h-5 text-slate-400" />
                    Pengaturan Profil
                  </button>
                  
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-3"
                  >
                    <SignOut weight="duotone" className="w-5 h-5 text-red-500" />
                    Keluar (Log Out)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Fullscreen Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-200 bg-white flex flex-col md:hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
            <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
              <img src="/KitaPay Emblem.png" alt="KitaPay Emblem" className="h-9 w-auto object-contain" />
            </Link>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 -mr-2 text-slate-500 hover:text-slate-800 rounded-lg bg-slate-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2 pb-24" data-lenis-prevent="true">
            {DASHBOARD_LINKS.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center space-x-4 px-4 py-3.5 rounded-xl text-base font-bold transition-colors',
                    isActive
                      ? (initialIsSandbox ? 'bg-orange-500/10 text-orange-500' : 'bg-[#00DDFD]/10 text-[#00DDFD]')
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <Icon weight={isActive ? "fill" : "duotone"} className="w-6 h-6" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
