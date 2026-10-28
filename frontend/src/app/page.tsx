'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Lightning, ShieldCheck, Wallet, ArrowUpRight, Code, TerminalWindow, Key, CheckCircle } from '@phosphor-icons/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import AnimatedHeroGraphic from '@/components/AnimatedHeroGraphic';
const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

export default function LandingPage() {
  const [scrolled, setScrolled] = React.useState(false);

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
            : 'bg-white/50 backdrop-blur-sm border-b border-transparent'
        )}
      >
        <div 
          className={cn(
            'max-w-7xl mx-auto px-6 flex items-center justify-between transition-all duration-300',
            scrolled ? 'h-16' : 'h-24 sm:h-28'
          )}
        >
          <Link href="/" className="flex items-center gap-2 group">
            <img 
              src="/KitaPay Emblem.png" 
              alt="KitaPay Emblem" 
              className={cn(
                'w-auto object-contain transition-all duration-300 drop-shadow-xs group-hover:scale-105',
                scrolled ? 'h-9 sm:h-10' : 'h-14 sm:h-18'
              )} 
            />
          </Link>
          
          <div className="hidden md:flex items-center gap-8 font-medium text-sm text-slate-600">
            <Link href="#fitur" className="hover:text-slate-900 transition-colors">Fitur</Link>
            <Link href="/pricing" className="hover:text-slate-900 transition-colors">Harga</Link>
            <Link href="/docs" className="hover:text-slate-900 transition-colors">Dokumentasi API</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="hidden sm:block text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors px-4 py-2"
            >
              Masuk
            </Link>
            <Link 
              href="/login" 
              className="bg-slate-900 text-white text-sm font-bold px-6 py-2.5 rounded-full hover:bg-slate-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              Daftar Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 lg:pt-48 lg:pb-32">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-200 h-200 bg-linear-to-bl from-[#00DDFD]/10 via-[#00DDFD]/5 to-transparent blur-3xl -z-10 rounded-full translate-x-1/3 -translate-y-1/4" />
        <div className="absolute top-40 left-0 w-125 h-125 bg-linear-to-tr from-blue-500/5 to-transparent blur-3xl -z-10 rounded-full -translate-x-1/2" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Content */}
            <div>
              <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
                Terima Pembayaran<br/>
                <span className="text-transparent bg-clip-text bg-linear-to-r from-[#00DDFD] to-blue-600">
                  Tanpa Ribet.
                </span>
              </h1>
              
              <p className="text-lg lg:text-xl text-slate-600 mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 max-w-lg">
                Infrastruktur pembayaran modern untuk bisnis dari segala ukuran. Terima pembayaran, otomatisasi pencatatan, dan tarik dana secara instan.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                <Link 
                  href="/login" 
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#00DDFD] text-slate-900 px-8 py-4 rounded-full font-black text-lg hover:bg-[#00c5e3] transition-all shadow-xl shadow-[#00DDFD]/20 hover:-translate-y-1"
                >
                  Mulai Sekarang <ArrowRight weight="bold" />
                </Link>
                <Link 
                  href="/docs" 
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-slate-700 px-8 py-4 rounded-full font-bold text-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
                >
                  Baca API Docs <Code weight="bold" />
                </Link>
              </div>
            </div>

            {/* Right Abstract Graphic */}
            {/* Right Abstract Graphic (Animated with GSAP) */}
            <AnimatedHeroGraphic />
            
          </div>
        </div>
      </section>

      {/* Ecosystem Section */}
      <section id="ekosistem" className="py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Diagram */}
            <div className="relative order-2 lg:order-1 h-100 sm:h-125 flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-slate-100)_1px,transparent_1px)] bg-size-[24px_24px] mask-[radial-gradient(circle_at_center,black,transparent_80%)] opacity-50" />
              
              <div className="relative flex items-center justify-center scale-[0.7] sm:scale-100 w-full h-full">
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
              <div className="text-[#00DDFD] font-bold text-sm mb-3 tracking-wide uppercase">Infrastruktur Pembayaran</div>
              <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-6 leading-tight">
                Terhubung dengan seluruh E-Wallet & Bank di Indonesia
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed mb-8">
                Cukup satu integrasi dengan API KitaPay, bisnis Anda langsung siap menerima pembayaran melalui <strong>QRIS Dinamis</strong>. Pelanggan Anda dapat membayar menggunakan OVO, DANA, Bank Jago, Mandiri, BCA Mobile, dan aplikasi <em>mobile banking</em> apa pun yang mendukung pemindaian QRIS.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-slate-700 font-medium">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><CheckCircle weight="bold" className="w-4 h-4"/></div>
                  Mendukung Generasi QRIS Dinamis Instan
                </li>
                <li className="flex items-center gap-3 text-slate-700 font-medium">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><CheckCircle weight="bold" className="w-4 h-4"/></div>
                  Notifikasi Pembayaran Real-time (Webhook)
                </li>
                <li className="flex items-center gap-3 text-slate-700 font-medium">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><CheckCircle weight="bold" className="w-4 h-4"/></div>
                  Proses Settlement Transparan
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Box Features */}
      <section id="fitur" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl lg:text-5xl font-black text-slate-900 tracking-tight mb-6">Desain untuk kecepatan dan skala</h2>
            <p className="text-lg text-slate-600">Kami membuang semua kerumitan penyedia link pembayaran tradisional sehingga Anda bisa fokus mengembangkan bisnis.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Bento Card 1 */}
            <div className="bg-white rounded-4xl p-8 md:p-12 border border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group overflow-hidden relative">
              <div className="w-12 h-12 bg-[#00DDFD]/10 rounded-2xl flex items-center justify-center mb-8 text-[#00DDFD]">
                <Lightning weight="fill" className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Transaksi Ga Ribet</h3>
              <p className="text-slate-600 leading-relaxed text-lg max-w-md">
                Pendaftaran super cepat tanpa tumpukan dokumen birokrasi. Dapatkan kode QRIS Anda dan mulai terima pembayaran di hari yang sama.
              </p>
            </div>

            {/* Bento Card 2 */}
            <div className="bg-slate-900 rounded-4xl p-8 md:p-12 border border-slate-800 hover:shadow-2xl hover:shadow-slate-900/50 transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#00DDFD]/10 rounded-full blur-3xl -translate-y-20 translate-x-20 pointer-events-none" />
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-8 text-white">
                <Wallet weight="fill" className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Gratis Penarikan Dana</h3>
              <p className="text-slate-300 leading-relaxed text-lg max-w-md">
                Tarik dana hasil penjualan ke bank apa saja secara instan. Nikmati fasilitas penarikan <strong>bebas biaya admin</strong> berkat sistem Merchant Level kami.
              </p>
            </div>

            {/* Bento Card 3 */}
            <div className="bg-white rounded-4xl p-8 md:p-12 border border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group md:col-span-2 flex flex-col md:flex-row items-center gap-12 overflow-hidden">
              <div className="flex-1">
                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mb-8 text-orange-600">
                  <TerminalWindow weight="fill" className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Developer Friendly API</h3>
                <p className="text-slate-600 leading-relaxed text-lg mb-6">
                  Integrasikan pembayaran ke dalam website, aplikasi, atau sistem kasir (POS) Anda dalam hitungan jam. Dokumentasi kami ringkas dan komprehensif.
                </p>
                <Link href="/docs" className="text-[#00DDFD] font-bold flex items-center gap-2 hover:gap-3 transition-all">
                  Pelajari Dokumentasi API <ArrowRight weight="bold" />
                </Link>
              </div>
              <div className="w-full md:w-1/2 bg-slate-900 rounded-2xl p-6 shadow-2xl transform rotate-2 group-hover:rotate-0 transition-all duration-500 text-xs font-mono text-slate-300 overflow-x-auto">
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
      <section className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl lg:text-5xl font-black text-slate-900 tracking-tight mb-12 text-center">F.A.Q</h2>
          <div className="space-y-4">
            <div className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200 transition-colors">
              <h4 className="text-lg font-bold text-slate-900 mb-2">Apa itu KitaPay?</h4>
              <p className="text-slate-600 leading-relaxed">KitaPay adalah platform yang memungkinkan pengguna untuk menerima pembayaran melalui link.</p>
            </div>
            <div className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200 transition-colors">
              <h4 className="text-lg font-bold text-slate-900 mb-2">Apakah KitaPay itu Payment Gateway?</h4>
              <p className="text-slate-600 leading-relaxed">Bukan. Kami memanfaatkan layanan Payment Gateway untuk membuat link pembayaran. Dana disimpan dan diproses oleh Payment Gateway yang kami gunakan.</p>
            </div>
            <div className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200 transition-colors">
              <h4 className="text-lg font-bold text-slate-900 mb-2">Apa yang dimaksud Instan dalam KitaPay?</h4>
              <p className="text-slate-600 leading-relaxed">Jika Anda mengintegrasikan sistem Anda langsung ke Payment Gateway, maka setidaknya butuh sekitar 14 hari untuk mulai menerima pembayaran melalui QRIS. Di KitaPay, kamu bisa langsung terima pembayaran dalam 1-3 hari.</p>
            </div>
            <div className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200 transition-colors">
              <h4 className="text-lg font-bold text-slate-900 mb-2">Apakah KitaPay aman?</h4>
              <p className="text-slate-600 leading-relaxed">KitaPay dikelola oleh RINZ GROUP INOVASI. Kami menggunakan layanan Payment Gateway resmi yang sudah berizin BI dan terdaftar di PSE Komdigi.</p>
            </div>
            <div className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200 transition-colors">
              <h4 className="text-lg font-bold text-slate-900 mb-2">Apakah ada biaya pendaftaran atau berlangganan?</h4>
              <p className="text-slate-600 leading-relaxed">Tidak ada. Biaya hanya dipotong saat terjadi transaksi.</p>
            </div>
            <div className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200 transition-colors">
              <h4 className="text-lg font-bold text-slate-900 mb-2">Apakah setelah transaksi berhasil bisa langsung dicairkan?</h4>
              <p className="text-slate-600 leading-relaxed">Tidak. Anda perlu menunggu hari berikutnya setelah pukul 12.00 WIB.</p>
            </div>
            <div className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200 transition-colors">
              <h4 className="text-lg font-bold text-slate-900 mb-2">Bisa tarik dana ke Bank apa saja?</h4>
              <p className="text-slate-600 leading-relaxed">Kami mendukung semua Bank dan E-Wallet di Indonesia. Namun kami sarankan untuk menggunakan rekening bank, karena eWallet memiliki limit topup per bulan.</p>
            </div>
            <div className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200 transition-colors">
              <h4 className="text-lg font-bold text-slate-900 mb-2">Berapa lama proses penarikan dana?</h4>
              <p className="text-slate-600 leading-relaxed">Berkisar 5-30 menit pada jam kerja. Penarikan pada malam hari akan diproses pada hari berikutnya.</p>
            </div>
            <div className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200 transition-colors">
              <h4 className="text-lg font-bold text-slate-900 mb-2">Apakah bisa melakukan penarikan dana pada hari libur?</h4>
              <p className="text-slate-600 leading-relaxed">Bisa. Kami tetap beroperasi pada Sabtu Minggu dan hari libur nasional.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden bg-white">
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="bg-slate-50 rounded-[3rem] p-10 md:p-16 text-center border border-slate-100 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--color-slate-100),transparent)]" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00DDFD]/10 blur-3xl rounded-full z-0 pointer-events-none" />
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Mulai Terima Pembayaran Hari Ini</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10">
                Kami transparan soal biaya. Tidak ada biaya tersembunyi. Anda juga bisa membebankan biaya langsung ke pelanggan Anda secara otomatis.
              </p>
              
              <Link 
                href="/pricing" 
                className="inline-flex items-center gap-2 bg-[#00DDFD] text-slate-900 px-8 py-4 rounded-full font-black text-lg hover:bg-[#00c5e3] transition-all shadow-xl shadow-[#00DDFD]/20 hover:-translate-y-1"
              >
                Lihat Skema Harga Kami <ArrowUpRight weight="bold" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer (White Mode) */}
      <footer className="bg-white border-t border-slate-100 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <div className="mb-6">
                <Link href="/" className="inline-block">
                  <img src="/KitaPay Emblem.png" alt="KitaPay Emblem" className="h-16 sm:h-20 w-auto object-contain drop-shadow-xs" />
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
              <ul className="space-y-3 text-sm text-slate-600">
                <li><Link href="/pricing" className="hover:text-[#00DDFD] transition-colors">Harga</Link></li>
                <li><Link href="/docs" className="hover:text-[#00DDFD] transition-colors">Dokumentasi API</Link></li>
                <li><Link href="/dashboard" className="hover:text-[#00DDFD] transition-colors">Dashboard Merchant</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Perusahaan</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><Link href="/terms-of-service" className="hover:text-[#00DDFD] transition-colors">Syarat & Ketentuan</Link></li>
                <li><Link href="/privacy-policy" className="hover:text-[#00DDFD] transition-colors">Kebijakan Privasi</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400">
            <p>© {new Date().getFullYear()} KitaPay. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
// Note: We need a CheckCircle icon which was missing in import, adding it implicitly via phosphor or keeping as is if imported. 
// Ah, let me make sure CheckCircle is imported.
