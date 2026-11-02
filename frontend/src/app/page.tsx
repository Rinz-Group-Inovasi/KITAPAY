'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Lightning, 
  ShieldCheck, 
  Wallet, 
  ArrowUpRight, 
  Code, 
  TerminalWindow, 
  Key, 
  CheckCircle,
  Devices,
  ClockCountdown,
  QrCode,
  List,
  X
} from '@phosphor-icons/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import AnimatedHeroGraphic from '@/components/AnimatedHeroGraphic';
import AES256Seal from '@/components/AES256Seal';
const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

function ScrambleCountText({
  value,
  trigger,
  duration = 1400,
}: {
  value: string;
  trigger: boolean;
  duration?: number;
}) {
  const getRandomScramble = (target: string) => {
    return target
      .split('')
      .map((c) => (/[0-9]/.test(c) ? Math.floor(Math.random() * 10).toString() : c))
      .join('');
  };

  const [display, setDisplay] = React.useState(value);

  React.useEffect(() => {
    if (!trigger) {
      setDisplay(value);
      return;
    }

    // Immediately scramble digits as soon as trigger is active
    setDisplay(getRandomScramble(value));

    let startTime: number | null = null;
    let lastUpdate = 0;
    let animationFrameId: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress >= 1) {
        setDisplay(value);
        return;
      }

      // Throttle digit updates to ~35ms so numbers visibly flicker/scramble
      if (currentTime - lastUpdate > 35) {
        lastUpdate = currentTime;

        const chars = value.split('');
        const digitIndices: number[] = [];
        chars.forEach((c, idx) => {
          if (/[0-9]/.test(c)) digitIndices.push(idx);
        });

        const totalDigits = digitIndices.length;
        // Lock digits progressively from left to right as progress passes 30%
        const lockProgress = Math.max(0, (progress - 0.3) / 0.7);
        const lockedCount = Math.floor(lockProgress * (totalDigits + 1));

        digitIndices.forEach((charIdx, i) => {
          if (i >= lockedCount) {
            chars[charIdx] = Math.floor(Math.random() * 10).toString();
          }
        });

        setDisplay(chars.join(''));
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, trigger, duration]);

  return <>{display}</>;
}

export default function LandingPage() {
  const [scrolled, setScrolled] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const statsRef = React.useRef<HTMLDivElement>(null);
  const [statsInView, setStatsInView] = React.useState(false);

  React.useEffect(() => {
    const el = statsRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsInView(true);
        } else {
          setStatsInView(false);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const initialStats = [
    { value: '6+', exact: '6 Merchant Terdaftar', label: 'Merchant' },
    { value: '199+', exact: '199 Transaksi Terproses', label: 'Transaksi' },
    { value: 'Rp 1,15 Jt+', exact: 'Rp 1.150.131 Total Volume', label: 'Volume Transaksi' },
    { value: '178+', exact: '178 Pengguna Terlayani', label: 'Pengguna' }
  ];

  const [stats, setStats] = React.useState(initialStats);

  React.useEffect(() => {
    let isMounted = true;
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data?.stats) {
          setStats(data.stats);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const benefits = [
    {
      title: 'Satu Sistem, Multi Platform',
      desc: 'Terima dan kelola pembayaran lewat website, aplikasi, invoice link, atau SDK terintegrasi.',
      icon: <Devices weight="duotone" className="w-7 h-7 sm:w-8 sm:h-8" />,
      badgeColor: 'bg-cyan-50 border border-cyan-100 text-[#00A8EC]',
    },
    {
      title: 'Registrasi Cepat',
      desc: 'Aktifkan akun dan mulai terima pembayaran QRIS instan dalam hitungan menit tanpa ribet.',
      icon: <ClockCountdown weight="duotone" className="w-7 h-7 sm:w-8 sm:h-8" />,
      badgeColor: 'bg-rose-50 border border-rose-100 text-rose-500',
    },
    {
      title: 'Pencairan Cepat dan Fleksibel',
      desc: 'Pencairan instan 1-15 menit ke Bank Jago gratis 3x/bulan dan ke 140+ bank umum di Indonesia.',
      icon: <Wallet weight="duotone" className="w-7 h-7 sm:w-8 sm:h-8" />,
      badgeColor: 'bg-emerald-50 border border-emerald-100 text-emerald-600',
    },
    {
      title: 'Cara Bayar Variatif',
      desc: 'Dapat dipindai dari semua Mobile Banking dan seluruh dompet digital (GoPay, OVO, DANA, ShopeePay).',
      icon: <QrCode weight="duotone" className="w-7 h-7 sm:w-8 sm:h-8" />,
      badgeColor: 'bg-amber-50 border border-amber-100 text-amber-500',
    },
    {
      title: 'Proteksi Keamanan Teruji',
      desc: 'Didukung infrastruktur payment gateway berizin resmi Bank Indonesia dengan enkripsi standar industri.',
      icon: <ShieldCheck weight="duotone" className="w-7 h-7 sm:w-8 sm:h-8" />,
      badgeColor: 'bg-teal-50 border border-teal-100 text-teal-600',
    },
  ];

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-[#00DDFD] selection:text-slate-900 font-sans overflow-hidden">
      {/* Navbar */}
      <nav 
        className={cn(
          'fixed top-0 inset-x-0 z-50 transition-all duration-300',
          scrolled 
            ? 'bg-white/90 backdrop-blur-lg border-b border-slate-100 shadow-xs' 
            : 'bg-white/70 backdrop-blur-md border-b border-slate-100/40 sm:border-transparent'
        )}
      >
        <div 
          className={cn(
            'max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between transition-all duration-300',
            scrolled ? 'h-16' : 'h-16 sm:h-20 lg:h-24'
          )}
        >
          <Link href="/" className="flex items-center gap-2 group">
            <img 
              src="/KitaPay Emblem.png" 
              alt="KitaPay Emblem" 
              className={cn(
                'w-auto object-contain transition-all duration-300 drop-shadow-xs group-hover:scale-105',
                scrolled ? 'h-9 sm:h-10' : 'h-9 sm:h-11 lg:h-13'
              )} 
            />
          </Link>
          
          <div className="hidden md:flex items-center gap-8 font-medium text-sm text-slate-600">
            <Link href="#fitur" className="hover:text-slate-900 transition-colors">Fitur</Link>
            <Link href="/pricing" className="hover:text-slate-900 transition-colors">Harga</Link>
            <Link href="/docs" className="hover:text-slate-900 transition-colors">Dokumentasi API</Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link 
              href="/login" 
              className="hidden sm:block text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors px-3 py-2"
            >
              Masuk
            </Link>
            <Link 
              href="/login" 
              className="bg-slate-900 text-white text-xs sm:text-sm font-bold px-3.5 py-2 sm:px-6 sm:py-2.5 rounded-full hover:bg-slate-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 whitespace-nowrap"
            >
              Daftar Gratis
            </Link>
            
            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shrink-0"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-b border-slate-200 px-6 py-5 animate-in slide-in-from-top-3 duration-200 shadow-xl space-y-4">
            <div className="flex flex-col space-y-2 font-semibold text-slate-700 text-base">
              <Link 
                href="#fitur" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-slate-900 py-2 border-b border-slate-50 transition-colors"
              >
                Fitur Unggulan
              </Link>
              <Link 
                href="/pricing" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-slate-900 py-2 border-b border-slate-50 transition-colors"
              >
                Skema Biaya & Harga
              </Link>
              <Link 
                href="/docs" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-slate-900 py-2 border-b border-slate-50 transition-colors"
              >
                Dokumentasi API
              </Link>
              <Link 
                href="/terms-of-service" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-slate-900 py-2 text-slate-500 text-sm transition-colors"
              >
                Syarat & Ketentuan Layanan
              </Link>
            </div>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link 
                href="/login" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center py-2.5 font-bold text-sm text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Masuk ke Akun
              </Link>
              <Link 
                href="/login" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center py-2.5 font-bold text-sm text-slate-900 bg-[#00DDFD] rounded-xl hover:bg-[#00c5e3] transition-colors shadow-sm"
              >
                Daftar Gratis Sekarang
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-10 sm:pt-36 sm:pb-16 lg:pt-48 lg:pb-32">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-200 h-200 bg-linear-to-bl from-[#00DDFD]/10 via-[#00DDFD]/5 to-transparent blur-3xl -z-10 rounded-full translate-x-1/3 -translate-y-1/4" />
        <div className="absolute top-40 left-0 w-125 h-125 bg-linear-to-tr from-blue-500/5 to-transparent blur-3xl -z-10 rounded-full -translate-x-1/2" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            
            {/* Left Content */}
            <div>
              <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.15] mb-4 sm:mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
                Terima Pembayaran<br/>
                <span className="text-transparent bg-clip-text bg-linear-to-r from-[#00DDFD] to-blue-600">
                  Tanpa Ribet.
                </span>
              </h1>
              
              <p className="text-sm sm:text-lg lg:text-xl text-slate-600 mb-6 sm:mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 max-w-lg">
                Infrastruktur pembayaran modern untuk bisnis dari segala ukuran. Terima pembayaran, otomatisasi pencatatan, dan tarik dana secara instan.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                <Link 
                  href="/login" 
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#00DDFD] text-slate-900 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-black text-base sm:text-lg hover:bg-[#00c5e3] transition-all shadow-xl shadow-[#00DDFD]/20 hover:-translate-y-0.5 active:scale-95"
                >
                  Mulai Sekarang <ArrowRight weight="bold" />
                </Link>
                <Link 
                  href="/docs" 
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-slate-700 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold text-base sm:text-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-95"
                >
                  Baca API Docs <Code weight="bold" />
                </Link>
              </div>
            </div>

            {/* Right Abstract Graphic (Animated with GSAP) */}
            <AnimatedHeroGraphic />
            
          </div>
        </div>
      </section>

      {/* Live Performance Stats Banner */}
      <section ref={statsRef} className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 -mt-4 sm:-mt-12 mb-12 lg:mb-24">
        <div className="bg-linear-to-r from-[#00F2FF] via-[#00DDFD] to-[#01B0F0] rounded-2xl sm:rounded-3xl p-3 sm:p-5 text-white shadow-xl shadow-cyan-500/15">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:items-center sm:justify-between sm:divide-x sm:divide-white/25">
            {stats.map((s, idx) => (
              <div 
                key={idx} 
                className="bg-white/10 sm:bg-transparent rounded-xl sm:rounded-none p-2.5 sm:p-0 sm:px-2 lg:px-4 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 flex-1 group cursor-default transition-all duration-200 hover:bg-white/15 sm:hover:bg-transparent"
                title={s.exact || s.value}
              >
                <span className="text-lg sm:text-xl lg:text-2xl font-black tracking-tight text-white whitespace-nowrap drop-shadow-xs transition-transform duration-200 group-hover:scale-105 tabular-nums">
                  <ScrambleCountText value={s.value} trigger={statsInView} />
                </span>
                <span className="text-[11px] sm:text-sm font-semibold text-white/95 whitespace-nowrap text-center sm:text-left">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefit Section: Semakin Maju Pakai KitaPay */}
      <section className="py-12 sm:py-16 lg:py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              Semakin Maju Pakai KitaPay
            </h2>
            <p className="text-slate-600 text-xs sm:text-base lg:text-lg mt-2 sm:mt-3">
              Dapatkan semua manfaat agar bisnis melaju cepat!
            </p>
          </div>

          {/* On mobile: horizontal smooth swipe with peek | On desktop: 5-column grid */}
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-3 pt-1 px-4 -mx-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-5 sm:gap-4 lg:gap-5 scrollbar-none">
            {benefits.map((b, idx) => (
              <div 
                key={idx} 
                className="w-[240px] xs:w-[260px] sm:w-auto shrink-0 snap-center bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-center flex flex-col items-center shadow-xs hover:shadow-lg hover:border-slate-300 hover:-translate-y-1.5 transition-all duration-300 group"
              >
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 ${b.badgeColor} transition-transform duration-300 group-hover:scale-110 shadow-2xs`}>
                  {b.icon}
                </div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-[17px] mb-2 leading-snug group-hover:text-[#00A8EC] transition-colors">
                  {b.title}
                </h3>
                <p className="text-xs sm:text-[13px] text-slate-500 leading-relaxed">
                  {b.desc}
                </p>
              </div>
            ))}
          </div>
          {/* Mobile Swipe Indicator Hint */}
          <div className="flex sm:hidden items-center justify-center gap-1.5 mt-3 text-[11px] text-slate-400 font-medium">
            <span>← Geser untuk melihat keunggulan lainnya →</span>
          </div>
        </div>
      </section>


      {/* Ecosystem Section */}
      <section id="ekosistem" className="py-16 sm:py-24 lg:py-32 bg-slate-50/50 relative border-t border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            
            {/* Diagram */}
            <div className="relative order-2 lg:order-1 h-80 sm:h-100 lg:h-125 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-slate-100)_1px,transparent_1px)] bg-size-[24px_24px] mask-[radial-gradient(circle_at_center,black,transparent_80%)] opacity-50" />
              
              <div className="relative flex items-center justify-center scale-[0.58] xs:scale-[0.72] sm:scale-100 w-full h-full">
                {/* Central Hub (KitaPay) */}
                <div className="relative z-20 w-40 flex items-center justify-center animate-pulse">
                  <img src="/KitaPay Blue Typograph.png" alt="KitaPay" className="w-full h-auto object-contain drop-shadow-xl" />
                </div>

                {/* Connecting Nodes */}
                {/* OVO */}
                <div className="absolute z-10 w-20 h-20 bg-white rounded-2xl shadow-lg border border-slate-50 flex items-center justify-center animate-orbit" style={{ '--orbit-angle': '0deg', '--orbit-radius': '160px' } as React.CSSProperties}>
                   <img src="/logos/ovo-logo.svg" alt="OVO" className="w-12 h-12 object-contain" />
                </div>
                
                {/* Mandiri */}
                <div className="absolute z-10 w-20 h-20 bg-white rounded-2xl shadow-lg border border-slate-50 flex items-center justify-center animate-orbit" style={{ '--orbit-angle': '60deg', '--orbit-radius': '160px' } as React.CSSProperties}>
                   <img src="/logos/mandiri-logo.svg" alt="Mandiri" className="w-14 h-14 object-contain" />
                </div>

                {/* DANA */}
                <div className="absolute z-10 w-20 h-20 bg-white rounded-2xl shadow-lg border border-slate-50 flex items-center justify-center animate-orbit" style={{ '--orbit-angle': '120deg', '--orbit-radius': '160px' } as React.CSSProperties}>
                   <img src="/logos/dana-logo.svg" alt="DANA" className="w-12 h-12 object-contain" />
                </div>

                {/* QRIS */}
                <div className="absolute z-10 w-20 h-20 bg-white rounded-2xl shadow-lg border border-slate-50 flex items-center justify-center animate-orbit" style={{ '--orbit-angle': '180deg', '--orbit-radius': '160px' } as React.CSSProperties}>
                   <img src="/logos/qris-logo.svg" alt="QRIS" className="w-14 h-14 object-contain" />
                </div>

                {/* Bank Jago */}
                <div className="absolute z-10 w-20 h-20 bg-white rounded-2xl shadow-lg border border-slate-50 flex items-center justify-center animate-orbit" style={{ '--orbit-angle': '240deg', '--orbit-radius': '160px' } as React.CSSProperties}>
                   <img src="/logos/jago-logo.svg" alt="Bank Jago" className="w-14 h-14 object-contain" />
                </div>

                {/* Bank Transfer (BCA) */}
                <div className="absolute z-10 w-20 h-20 bg-white rounded-2xl shadow-lg border border-slate-50 flex items-center justify-center animate-orbit" style={{ '--orbit-angle': '300deg', '--orbit-radius': '160px' } as React.CSSProperties}>
                   <img src="/logos/bca-logo.svg" alt="BCA" className="w-12 h-12 object-contain" />
                </div>
              </div>
            </div>

            {/* Text Content */}
            <div className="order-1 lg:order-2">
              <div className="text-[#00DDFD] font-bold text-xs sm:text-sm mb-2 sm:mb-3 tracking-wide uppercase">Infrastruktur Pembayaran</div>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-4 sm:mb-6 leading-tight">
                Terhubung dengan seluruh E-Wallet & Bank di Indonesia
              </h2>
              <p className="text-sm sm:text-lg text-slate-600 leading-relaxed mb-6 sm:mb-8">
                Cukup satu integrasi dengan API KitaPay, bisnis Anda langsung siap menerima pembayaran melalui <strong>QRIS Dinamis</strong>. Pelanggan Anda dapat membayar menggunakan OVO, DANA, Bank Jago, Mandiri, BCA Mobile, dan aplikasi <em>mobile banking</em> apa pun yang mendukung pemindaian QRIS.
              </p>
              <ul className="space-y-3 sm:space-y-4 text-sm sm:text-base">
                <li className="flex items-center gap-3 text-slate-700 font-medium">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0"><CheckCircle weight="bold" className="w-3.5 h-3.5 sm:w-4 sm:h-4"/></div>
                  Mendukung Generasi QRIS Dinamis Instan
                </li>
                <li className="flex items-center gap-3 text-slate-700 font-medium">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0"><CheckCircle weight="bold" className="w-3.5 h-3.5 sm:w-4 sm:h-4"/></div>
                  Notifikasi Pembayaran Real-time (Webhook)
                </li>
                <li className="flex items-center gap-3 text-slate-700 font-medium">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0"><CheckCircle weight="bold" className="w-3.5 h-3.5 sm:w-4 sm:h-4"/></div>
                  Proses Settlement Transparan
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Box Features */}
      <section id="fitur" className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-20">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-3 sm:mb-6">Desain untuk kecepatan dan skala</h2>
            <p className="text-sm sm:text-lg text-slate-600">Kami membuang semua kerumitan penyedia link pembayaran tradisional sehingga Anda bisa fokus mengembangkan bisnis.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            
            {/* Bento Card 1 */}
            <div className="bg-white rounded-3xl sm:rounded-4xl p-6 sm:p-8 md:p-12 border border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group overflow-hidden relative">
              <div className="w-12 h-12 bg-[#00DDFD]/10 rounded-2xl flex items-center justify-center mb-6 sm:mb-8 text-[#00DDFD]">
                <Lightning weight="fill" className="w-6 h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-4">Transaksi Ga Ribet</h3>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-lg max-w-md">
                Pendaftaran super cepat tanpa tumpukan dokumen birokrasi. Dapatkan kode QRIS Anda dan mulai terima pembayaran di hari yang sama.
              </p>
            </div>

            {/* Bento Card 2 */}
            <div className="bg-slate-900 rounded-3xl sm:rounded-4xl p-6 sm:p-8 md:p-12 border border-slate-800 hover:shadow-2xl hover:shadow-slate-900/50 transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#00DDFD]/10 rounded-full blur-3xl -translate-y-20 translate-x-20 pointer-events-none" />
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 sm:mb-8 text-white">
                <Wallet weight="fill" className="w-6 h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Gratis Penarikan Dana</h3>
              <p className="text-slate-300 leading-relaxed text-sm sm:text-lg max-w-md">
                Tarik dana hasil penjualan ke bank apa saja secara instan. Nikmati fasilitas penarikan <strong>bebas biaya admin</strong> berkat sistem Merchant Level kami.
              </p>
            </div>

            {/* Bento Card 3 */}
            <div className="bg-white rounded-3xl sm:rounded-4xl p-6 sm:p-8 md:p-12 border border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group md:col-span-2 flex flex-col md:flex-row items-center gap-6 sm:gap-12 overflow-hidden">
              <div className="flex-1 w-full">
                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mb-6 sm:mb-8 text-orange-600">
                  <TerminalWindow weight="fill" className="w-6 h-6" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-4">Developer Friendly API</h3>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-lg mb-4 sm:mb-6">
                  Integrasikan pembayaran ke dalam website, aplikasi, atau sistem kasir (POS) Anda dalam hitungan jam. Dokumentasi kami ringkas dan komprehensif.
                </p>
                <Link href="/docs" className="text-[#00DDFD] font-bold flex items-center gap-2 hover:gap-3 transition-all text-sm sm:text-base">
                  Pelajari Dokumentasi API <ArrowRight weight="bold" />
                </Link>
              </div>
              <div className="w-full md:w-1/2 bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-2xl transform-none sm:rotate-2 group-hover:rotate-0 transition-all duration-500 text-xs font-mono text-slate-300 overflow-x-auto">
<pre><code>{`// Buat Invoice Baru
const response = await fetch('https://apikita.rinzgroup.web.id/v1/invoices', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk_live_YOUR_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 50000,
    description: 'Pembelian Produk'
  })
});`}</code></pre>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-24 bg-white border-y border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-8 sm:mb-12 text-center">F.A.Q</h2>
          <div className="space-y-3 sm:space-y-4">
            <div className="bg-slate-50 p-4 sm:p-6 md:p-8 rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 transition-colors">
              <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-2">Apa itu KitaPay?</h4>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">KitaPay adalah platform yang memungkinkan pengguna untuk menerima pembayaran melalui link.</p>
            </div>
            <div className="bg-slate-50 p-4 sm:p-6 md:p-8 rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 transition-colors">
              <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-2">Apakah KitaPay itu Payment Gateway?</h4>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">Bukan. Kami memanfaatkan layanan Payment Gateway untuk membuat link pembayaran. Dana disimpan dan diproses oleh Payment Gateway yang kami gunakan.</p>
            </div>
            <div className="bg-slate-50 p-4 sm:p-6 md:p-8 rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 transition-colors">
              <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-2">Apa yang dimaksud Instan dalam KitaPay?</h4>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">Jika Anda mengintegrasikan sistem Anda langsung ke Payment Gateway, maka setidaknya butuh sekitar 14 hari untuk mulai menerima pembayaran melalui QRIS. Di KitaPay, kamu bisa langsung terima pembayaran dalam 1-3 hari.</p>
            </div>
            <div className="bg-slate-50 p-4 sm:p-6 md:p-8 rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 transition-colors">
              <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-2">Apakah KitaPay aman?</h4>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">KitaPay dikelola oleh RINZ GROUP INOVASI. Kami menggunakan layanan Payment Gateway resmi yang sudah berizin BI dan terdaftar di PSE Komdigi.</p>
            </div>
            <div className="bg-slate-50 p-4 sm:p-6 md:p-8 rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 transition-colors">
              <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-2">Apakah ada biaya pendaftaran atau berlangganan?</h4>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">Tidak ada. Biaya hanya dipotong saat terjadi transaksi.</p>
            </div>
            <div className="bg-slate-50 p-4 sm:p-6 md:p-8 rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 transition-colors">
              <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-2">Apakah setelah transaksi berhasil bisa langsung dilakukan settlement / pemindahan dana?</h4>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">Tidak. Anda perlu menunggu hari berikutnya setelah pukul 12.00 WIB.</p>
            </div>
            <div className="bg-slate-50 p-4 sm:p-6 md:p-8 rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 transition-colors">
              <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-2">Bisa tarik dana ke Bank apa saja?</h4>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">Kami mendukung semua Bank dan E-Wallet di Indonesia. Namun kami sarankan untuk menggunakan rekening bank, karena eWallet memiliki limit topup per bulan.</p>
            </div>
            <div className="bg-slate-50 p-4 sm:p-6 md:p-8 rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 transition-colors">
              <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-2">Berapa lama proses penarikan dana?</h4>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">Berkisar 5-30 menit pada jam kerja. Penarikan pada malam hari akan diproses pada hari berikutnya.</p>
            </div>
            <div className="bg-slate-50 p-4 sm:p-6 md:p-8 rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 transition-colors">
              <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-2">Apakah bisa melakukan penarikan dana pada hari libur?</h4>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">Bisa. Kami tetap beroperasi pada Sabtu Minggu dan hari libur nasional.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 relative overflow-hidden bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="bg-slate-50 rounded-3xl sm:rounded-[3rem] p-6 sm:p-10 md:p-16 text-center border border-slate-100 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--color-slate-100),transparent)]" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00DDFD]/10 blur-3xl rounded-full z-0 pointer-events-none" />
            
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-4 sm:mb-6 tracking-tight">Mulai Terima Pembayaran Hari Ini</h2>
              <p className="text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto mb-8 sm:mb-10">
                Kami transparan soal biaya. Tidak ada biaya tersembunyi. Anda juga bisa membebankan biaya langsung ke pelanggan Anda secara otomatis.
              </p>
              
              <Link 
                href="/pricing" 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#00DDFD] text-slate-900 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-black text-base sm:text-lg hover:bg-[#00c5e3] transition-all shadow-xl shadow-[#00DDFD]/20 hover:-translate-y-1 active:scale-95"
              >
                Lihat Skema Harga Kami <ArrowUpRight weight="bold" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer (White Mode) */}
      <footer className="bg-white border-t border-slate-100 pt-12 sm:pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-12 mb-12 sm:mb-16">
            <div className="md:col-span-2">
              <div className="mb-4 sm:mb-6">
                <Link href="/" className="inline-block">
                  <img src="/KitaPay Emblem.png" alt="KitaPay Emblem" className="h-12 sm:h-16 lg:h-20 w-auto object-contain drop-shadow-xs" />
                </Link>
              </div>
              <p className="text-slate-500 max-w-sm mb-6">
                Penyedia link pembayaran terpercaya untuk memajukan bisnis UMKM dan Enterprise di seluruh Indonesia.
              </p>
              <div className="flex flex-col gap-3 text-sm">
                <div>
                  <span className="block font-semibold text-slate-700 mb-1">Hubungi Kami</span>
                  <a href="mailto:kitapay.sayangku@gmail.com" className="text-slate-500 hover:text-[#00DDFD] transition-colors">
                    kitapay.sayangku@gmail.com
                  </a>
                </div>
                <div>
                  <span className="block font-semibold text-slate-700 mb-1">Bagian dari</span>
                  <a href="https://rinzgroup.web.id" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-[#00DDFD] transition-colors font-medium">
                    Rinz Group Inovasi
                  </a>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Produk</h4>
              <ul className="space-y-3 text-sm text-slate-600 mb-6">
                <li><Link href="/pricing" className="hover:text-[#00DDFD] transition-colors">Harga</Link></li>
                <li><Link href="/docs" className="hover:text-[#00DDFD] transition-colors">Dokumentasi API</Link></li>
                <li><Link href="/dashboard" className="hover:text-[#00DDFD] transition-colors">Dashboard Merchant</Link></li>
              </ul>

              <div className="flex items-center gap-2.5 pt-1">
                <AES256Seal size={36} className="w-9 h-9 shrink-0" />
                <div className="text-left">
                  <span className="text-xs font-bold text-slate-800 block leading-tight">AES 256</span>
                  <span className="text-[11px] text-slate-400">Standar Enkripsi Keamanan</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Perusahaan</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><Link href="/terms-of-service" className="hover:text-[#00DDFD] transition-colors">Syarat & Ketentuan</Link></li>
                <li><Link href="/privacy-policy" className="hover:text-[#00DDFD] transition-colors">Kebijakan Privasi</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-100 text-sm text-slate-400">
            <p>© {new Date().getFullYear()} KitaPay. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
// Note: We need a CheckCircle icon which was missing in import, adding it implicitly via phosphor or keeping as is if imported. 
// Ah, let me make sure CheckCircle is imported.
