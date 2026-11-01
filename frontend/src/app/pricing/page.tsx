'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  CheckCircle, 
  ArrowRight, 
  ShieldCheck, 
  Wallet
} from '@phosphor-icons/react';

export default function PricingPage() {
  // Simulator state
  const [amount, setAmount] = useState<number>(50000);
  const [chargeToCustomer, setChargeToCustomer] = useState<boolean>(false);

  const supportedApps = [
    { name: 'BCA', src: '/logos/bca-logo.svg' },
    { name: 'Mandiri', src: '/logos/mandiri-logo.svg' },
    { name: 'BRI', src: '/logos/bri-logo.svg' },
    { name: 'BNI', src: '/logos/bni-logo.svg' },
    { name: 'BSI', src: '/logos/bsi-logo.svg' },
    { name: 'Bank Jago', src: '/logos/jago-logo.svg' },
    { name: 'SeaBank', src: '/logos/seabank-logo.svg' },
    { name: 'GoPay', src: '/logos/gopay-logo.svg' },
    { name: 'OVO', src: '/logos/ovo-logo.svg' },
    { name: 'DANA', src: '/logos/dana-logo.svg' },
    { name: 'ShopeePay', src: '/logos/shopeepay-logo.svg' },
    { name: 'LinkAja', src: '/logos/linkaja-logo.svg' },
  ];

  const qrisTiers = [
    {
      tierNumber: 'Tier 1',
      title: 'Mikro & Standar',
      badge: 'Paling Populer',
      range: 'Rp 1 – Rp 100.000',
      fee: 'Rp 1.500',
      type: 'flat per transaksi',
      isPopular: true,
      desc: 'Ideal untuk transaksi produk digital, voucher game, pulsa, makanan & minuman, serta pembayaran ritel harian.'
    },
    {
      tierNumber: 'Tier 2',
      title: 'Reguler',
      badge: 'Standar',
      range: 'Di atas Rp 100.000',
      fee: '1,5%',
      type: 'persentase transaksi',
      isPopular: false,
      desc: 'Skema proporsional tanpa beban biaya tetap tambahan untuk transaksi bernilai menengah hingga skala besar.'
    }
  ];

  const quickAmounts = [10000, 25000, 50000, 100000, 250000, 500000];

  // Simulator Calculation Logic
  const calcAmount = Math.max(0, Number(amount) || 0);
  let customerPay = calcAmount;
  let serviceFee = 0;
  let merchantReceive = calcAmount;

  if (calcAmount > 0) {
    if (chargeToCustomer) {
      if (calcAmount <= 100000) {
        customerPay = calcAmount + 1500;
        serviceFee = 1500;
        merchantReceive = calcAmount;
      } else {
        customerPay = Math.ceil(calcAmount / 0.985);
        serviceFee = customerPay - calcAmount;
        merchantReceive = calcAmount;
      }
    } else {
      if (calcAmount <= 100000) {
        serviceFee = 1500;
        merchantReceive = Math.max(0, calcAmount - 1500);
      } else {
        serviceFee = Math.round(calcAmount * 0.015);
        merchantReceive = Math.max(0, calcAmount - serviceFee);
      }
    }
  }

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const transparencyPoints = [
    {
      title: 'Biaya Registrasi Akun',
      value: 'Rp 0',
      subtext: 'Gratis selamanya tanpa biaya registrasi awal'
    },
    {
      title: 'Biaya Pemeliharaan Bulanan',
      value: 'Rp 0',
      subtext: 'Bebas iuran berkala atau target minimum transaksi'
    },
    {
      title: 'Akses API & Integrasi Webhook',
      value: 'Rp 0',
      subtext: 'Akses penuh seluruh endpoint developer tanpa batas'
    },
    {
      title: 'Masa Berlaku Saldo',
      value: 'Tanpa Batas',
      subtext: 'Saldo penghasilan tersimpan aman dan tidak pernah hangus'
    },
    {
      title: 'Lingkungan Sandbox Uji Coba',
      value: 'Termasuk',
      subtext: 'Fitur simulasi lengkap untuk pengujian sebelum live'
    },
    {
      title: 'Fitur Bebankan ke Pembeli',
      value: 'Bebas Aktifkan',
      subtext: 'Fleksibilitas penuh untuk memilih siapa yang menanggung fee'
    }
  ];


  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col selection:bg-[#00DDFD]/20 selection:text-slate-900">
      
      {/* Top Navigation - Aligned with KitaPay Brand Navbar */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <img 
              src="/KitaPay Emblem.png" 
              alt="KitaPay" 
              className="h-9 sm:h-10 w-auto object-contain transition-transform group-hover:scale-105" 
            />
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 font-medium text-sm text-slate-600">
            <Link href="/#fitur" className="hover:text-slate-900 transition-colors">
              Fitur
            </Link>
            <Link href="/pricing" className="text-slate-900 font-bold transition-colors">
              Harga
            </Link>
            <Link href="/docs" className="hover:text-slate-900 transition-colors">
              Dokumentasi API
            </Link>
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link 
              href="/login" 
              className="text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors px-3 py-1.5"
            >
              Masuk
            </Link>
            <Link 
              href="/login" 
              className="bg-slate-900 text-white text-sm font-bold px-5 sm:px-6 py-2.5 rounded-full hover:bg-slate-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              Daftar Gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-16 space-y-16 sm:space-y-20">
        
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100/90 border border-slate-200 text-slate-700 text-xs font-semibold tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00DDFD]"></span>
            <span>Tarif Transparan & Kompetitif</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
            Biaya Layanan Transparan,<br/>
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#00DDFD] to-blue-600">
              Tanpa Biaya Tersembunyi.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto">
            Tanpa biaya bulanan dan tanpa biaya pendaftaran. Dapatkan kode QRIS aktif seketika dan hanya bayar saat transaksi berhasil.
          </p>

          <div className="pt-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/90 text-xs text-slate-500 shadow-2xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00DDFD] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00DDFD]"></span>
              </span>
              <span>Sesuai Regulasi Bank Indonesia & Standar Upstream Terkini</span>
            </div>
          </div>
        </div>

        {/* Section 1: Tabel Tarif Utama QRIS */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200/80 pb-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="p-2 bg-white border border-slate-200/90 rounded-xl shadow-2xs inline-flex items-center">
                  <img src="/logos/qris-logo.svg" alt="QRIS" className="h-5 sm:h-6 w-auto object-contain" />
                </span>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Penerimaan Pembayaran QRIS
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Satu QRIS serbaguna, dapat dipindai dari seluruh m-Banking dan E-Wallet resmi Indonesia.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cards Display for Tiers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
            {qrisTiers.map((tier) => (
              <div 
                key={tier.tierNumber} 
                className={`relative bg-white rounded-3xl p-6 sm:p-8 border transition-all ${
                  tier.isPopular 
                    ? 'border-[#00DDFD]/40 shadow-xl shadow-[#00DDFD]/5 ring-1 ring-[#00DDFD]/20' 
                    : 'border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Paket Transaksi
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                      {tier.tierNumber} · {tier.title}
                    </h3>
                  </div>
                  {tier.isPopular ? (
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-900 text-[#00DDFD] border border-slate-800 shadow-xs">
                      {tier.badge}
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                      {tier.badge}
                    </span>
                  )}
                </div>
                
                <div className="mb-5">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Rentang Nominal</span>
                  <p className="text-lg font-bold text-slate-800 mt-0.5">{tier.range}</p>
                </div>

                <div className="p-4 sm:p-5 bg-slate-50/90 rounded-2xl border border-slate-100 mb-5 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-slate-500 block font-medium">Biaya Pemrosesan:</span>
                    <span className="text-3xl sm:text-4xl font-black text-slate-900">{tier.fee}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200/90 px-2.5 py-1 rounded-lg shadow-2xs">
                    {tier.type}
                  </span>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  {tier.desc}
                </p>

                <div className="pt-4 border-t border-slate-100 flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                  <div className="w-5 h-5 rounded-full bg-[#00DDFD]/15 flex items-center justify-center shrink-0">
                    <CheckCircle weight="fill" className="text-cyan-700 text-sm" />
                  </div>
                  <span>Dapat dibebankan ke pembeli (Merchant terima 100% utuh)</span>
                </div>
              </div>
            ))}
          </div>

          {/* Supported Apps List */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs mt-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Mendukung Seluruh Bank & Dompet Digital Terkemuka:
            </p>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {supportedApps.map((item) => (
                <div 
                  key={item.name} 
                  className="h-8 sm:h-9 px-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-center shadow-2xs hover:border-slate-300 hover:bg-white transition-all" 
                  title={item.name}
                >
                  <img src={item.src} alt={item.name} className="h-4 sm:h-4.5 max-w-14 sm:max-w-16 w-auto object-contain" />
                </div>
              ))}
              <span className="text-xs font-semibold text-slate-400 ml-1">+ 140+ Bank Nasional Lainnya</span>
            </div>
          </div>
        </section>

        {/* Section 2: Interactive Fee Simulator (KitaPay Signature Experience) */}
        <section className="bg-slate-900 text-white rounded-3xl sm:rounded-4xl p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#00DDFD]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-6 sm:space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00DDFD]/10 border border-[#00DDFD]/20 text-[#00DDFD] text-xs font-bold uppercase tracking-wider mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00DDFD]"></span>
                  <span>Simulasi Transaksi</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Simulasikan Pendapatan Bersih Anda
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
                  Transparan tanpa tebak-tebakan. Hitung nominal yang dibayar pelanggan dan dana bersih yang Anda terima di setiap transaksi.
                </p>
              </div>

              {/* Fee Toggle */}
              <div className="bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700/80 flex items-center gap-3 self-start md:self-auto">
                <span className="text-xs font-semibold text-slate-300 pl-2">Bebankan ke Pelanggan:</span>
                <button
                  type="button"
                  onClick={() => setChargeToCustomer(!chargeToCustomer)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    chargeToCustomer ? 'bg-[#00DDFD]' : 'bg-slate-700'
                  }`}
                  aria-pressed={chargeToCustomer}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-slate-950 transition-transform ${
                      chargeToCustomer ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Input & Quick Buttons */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Masukkan Nominal Transaksi
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-base">Rp</span>
                    <input
                      type="number"
                      min="1000"
                      step="1000"
                      value={amount || ''}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      placeholder="50000"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-800/90 border border-slate-700 rounded-2xl text-white font-bold text-xl focus:outline-none focus:ring-2 focus:ring-[#00DDFD] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-2">Preset Nominal Cepat:</span>
                  <div className="flex flex-wrap gap-2">
                    {quickAmounts.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setAmount(q)}
                        className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all ${
                          amount === q 
                            ? 'bg-[#00DDFD] text-slate-950 font-bold shadow-md shadow-[#00DDFD]/20' 
                            : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700/70'
                        }`}
                      >
                        {formatIDR(q)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Calculation Output Box */}
              <div className="lg:col-span-7 bg-slate-800/60 border border-slate-700/80 rounded-2xl sm:rounded-3xl p-5 sm:p-6 backdrop-blur-sm space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs sm:text-sm text-slate-300">
                    <span>Harga Produk / Nominal Asli:</span>
                    <span className="font-bold text-white text-sm sm:text-base">{formatIDR(calcAmount)}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs sm:text-sm text-slate-300">
                    <span className="flex items-center gap-2">
                      Biaya Pemrosesan KitaPay
                      <span className="text-[10px] bg-slate-700/90 text-slate-300 px-2 py-0.5 rounded font-mono">
                        {calcAmount <= 100000 ? 'Flat Rp 1.500' : '1,5%'}
                      </span>
                    </span>
                    <span className="font-semibold text-slate-300">
                      {chargeToCustomer ? `+ ${formatIDR(serviceFee)}` : `- ${formatIDR(serviceFee)}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs sm:text-sm text-slate-300 pt-1 border-t border-slate-700/60">
                    <span>Total yang Ditagihkan ke Pelanggan:</span>
                    <span className="font-extrabold text-white text-base">{formatIDR(customerPay)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-700/60">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Dana Bersih Masuk ke Merchant:</span>
                    <span className="text-2xl sm:text-3xl font-black text-[#00DDFD]">
                      {formatIDR(merchantReceive)}
                    </span>
                  </div>
                  {chargeToCustomer ? (
                    <span className="inline-flex items-center gap-1.5 bg-[#00DDFD]/10 text-[#00DDFD] border border-[#00DDFD]/30 text-xs px-3.5 py-1.5 rounded-full font-bold">
                      <CheckCircle weight="fill" className="text-sm" />
                      100% Utuh Masuk Saldo
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">
                      Fee dipotong otomatis dari saldo invoice
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Settlement / Pemindahan Dana (Payout ke Rekening) */}
        <section className="space-y-6">
          <div className="border-b border-slate-200/80 pb-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
              <span className="p-2 bg-white border border-slate-200/90 rounded-xl shadow-2xs inline-flex items-center">
                <Wallet weight="bold" className="text-slate-900 w-5 h-5" />
              </span>
              Settlement & Pemindahan Dana ke Rekening
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pindahkan saldo hasil penjualan Anda dengan bebas ke rekening bank nasional maupun e-wallet mana saja.
            </p>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block border border-slate-200/90 bg-white rounded-3xl shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200/80 text-slate-600 font-bold text-xs tracking-wider uppercase">
                  <th className="py-4 px-6">Tipe Settlement</th>
                  <th className="py-4 px-6">Tujuan Rekening / E-Wallet</th>
                  <th className="py-4 px-6">Waktu Proses</th>
                  <th className="py-4 px-6 text-right">Biaya Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-5 px-6">
                    <span className="font-bold text-slate-900 block text-base">Settlement Instan</span>
                    <span className="text-xs text-slate-400 font-medium">Kapan saja 24/7</span>
                  </td>
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-3">
                      <div className="h-8 px-2.5 bg-white border border-slate-200/90 rounded-xl flex items-center justify-center shadow-2xs">
                        <img src="/logos/jago-logo.svg" alt="Bank Jago" className="h-4 w-auto object-contain" />
                      </div>
                      <span className="font-semibold text-slate-900">Bank Jago / Jago Syariah</span>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-slate-600 font-medium">1 – 15 Menit</td>
                  <td className="py-5 px-6 text-right">
                    <span className="font-extrabold text-slate-900 text-base">Gratis 3x / bln</span>
                    <span className="block text-xs text-slate-400 font-medium">berikutnya Rp 2.000 / trx</span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-5 px-6">
                    <span className="font-bold text-slate-900 block text-base">Settlement Instan</span>
                    <span className="text-xs text-slate-400 font-medium">Kapan saja 24/7</span>
                  </td>
                  <td className="py-5 px-6">
                    <div>
                      <span className="font-semibold text-slate-900 block mb-2">Bank Lain & Dompet Digital</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {['BCA', 'Mandiri', 'BRI', 'BNI', 'BSI', 'SeaBank', 'DANA', 'GoPay', 'OVO'].map((b) => (
                          <span key={b} className="text-xs font-semibold bg-slate-50 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200">
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-slate-600 font-medium">1 – 15 Menit</td>
                  <td className="py-5 px-6 text-right">
                    <span className="font-extrabold text-slate-900 text-base">Rp 2.000</span>
                    <span className="block text-xs text-slate-400 font-medium">per transaksi</span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/60 transition-colors bg-slate-50/40">
                  <td className="py-5 px-6">
                    <span className="font-bold text-slate-900 block text-base">Penarikan Terjadwal</span>
                    <span className="text-xs text-slate-400 font-medium">Otomatis Mingguan</span>
                  </td>
                  <td className="py-5 px-6">
                    <span className="font-semibold text-slate-900">Seluruh 140+ Bank di Indonesia</span>
                    <p className="text-xs text-slate-500 mt-0.5">Semua bank umum dan bank syariah nasional</p>
                  </td>
                  <td className="py-5 px-6 text-slate-600 font-medium">Setiap Jumat / Sabtu</td>
                  <td className="py-5 px-6 text-right">
                    <span className="font-extrabold text-slate-900 text-base">Gratis (Rp 0)</span>
                    <span className="block text-xs text-slate-400 font-medium">Bebas biaya admin</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile Card List for Withdrawals */}
          <div className="md:hidden space-y-3">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Settlement Instan (1-15 mnt)</span>
                <span className="text-xs font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">Gratis 3x / bln</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-7 px-2 bg-white border border-slate-200 rounded-lg flex items-center">
                  <img src="/logos/jago-logo.svg" alt="Bank Jago" className="h-3.5 w-auto object-contain" />
                </div>
                <span className="font-bold text-slate-800 text-sm">Bank Jago / Jago Syariah</span>
              </div>
              <p className="text-xs text-slate-500">Setelah 3x gratis, biaya berikutnya hanya Rp 2.000/transaksi.</p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Settlement Instan (1-15 mnt)</span>
                <span className="text-xs font-extrabold text-slate-900">Rp 2.000 / trx</span>
              </div>
              <span className="font-bold text-slate-800 text-sm block">Bank Lain & E-Wallet Nasional</span>
              <p className="text-xs text-slate-500">BCA, Mandiri, BRI, BNI, BSI, SeaBank, DANA, GoPay, OVO, ShopeePay.</p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Penarikan Terjadwal (Mingguan)</span>
                <span className="text-xs font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">100% Gratis</span>
              </div>
              <span className="font-bold text-slate-800 text-sm block">140+ Bank Seluruh Indonesia</span>
              <p className="text-xs text-slate-500">Diproses otomatis setiap akhir pekan tanpa potongan biaya admin.</p>
            </div>
          </div>
        </section>

        {/* Section 4: Jaminan Tanpa Biaya Tersembunyi */}
        <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 md:p-10 shadow-xs space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
              <ShieldCheck weight="bold" className="text-slate-900 text-xl" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Jaminan Transparansi Tanpa Biaya Tersembunyi
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Semua fitur standar dan infrastruktur dapat Anda nikmati tanpa komitmen finansial di awal.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pt-1">
            {transparencyPoints.map((item, idx) => (
              <div 
                key={idx}
                className="p-5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 hover:bg-white transition-all shadow-2xs group"
              >
                <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider mb-1">
                  {item.title}
                </span>
                <span className="text-xl font-black text-slate-900 block mb-1">
                  {item.value}
                </span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {item.subtext}
                </p>
              </div>
            ))}
          </div>
        </section>


        {/* Section 6: Bottom Call to Action */}
        <section className="bg-slate-50 rounded-3xl sm:rounded-4xl p-8 sm:p-12 md:p-14 text-center border border-slate-100 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--color-slate-100),transparent)]" />
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#00DDFD]/10 blur-3xl rounded-full pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Mulai Terima Pembayaran Hari Ini
            </h3>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Daftar gratis dalam hitungan menit, integrasikan API dengan dokumentasi praktis kami, dan nikmati settlement transaksi tanpa birokrasi.
            </p>
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/login" 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#00DDFD] text-slate-900 px-8 py-3.5 rounded-full font-black text-base hover:bg-[#00c5e3] transition-all shadow-xl shadow-[#00DDFD]/20 hover:-translate-y-0.5"
              >
                <span>Daftar Akun Gratis</span>
                <ArrowRight weight="bold" />
              </Link>
              <Link 
                href="/docs" 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 px-8 py-3.5 rounded-full font-bold text-base transition-all hover:border-slate-300"
              >
                <span>Lihat Dokumentasi API</span>
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* Footer - Consistent with Landing Page */}
      <footer className="bg-white border-t border-slate-100 pt-14 pb-8 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="mb-5">
                <Link href="/" className="inline-block">
                  <img 
                    src="/KitaPay Emblem.png" 
                    alt="KitaPay" 
                    className="h-14 sm:h-16 w-auto object-contain drop-shadow-xs" 
                  />
                </Link>
              </div>
              <p className="text-slate-500 max-w-sm mb-5 text-sm leading-relaxed">
                Penyedia infrastruktur pembayaran digital terpercaya untuk memajukan bisnis UMKM dan enterprise di seluruh Indonesia.
              </p>
              <div className="flex flex-col gap-2 text-xs sm:text-sm text-slate-500">
                <div>
                  <span className="font-semibold text-slate-700">Hubungi: </span>
                  <a href="mailto:kitapay.sayangku@gmail.com" className="hover:text-slate-900 transition-colors">
                    kitapay.sayangku@gmail.com
                  </a>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Entitas: </span>
                  <span>Bagian dari Rinz Group Inovasi</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-slate-900 mb-3 text-sm">Produk</h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
                <li><Link href="/pricing" className="hover:text-[#00DDFD] transition-colors font-medium">Harga & Simulasi</Link></li>
                <li><Link href="/docs" className="hover:text-[#00DDFD] transition-colors">Dokumentasi API</Link></li>
                <li><Link href="/dashboard" className="hover:text-[#00DDFD] transition-colors">Dashboard Merchant</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-slate-900 mb-3 text-sm">Legal & Kebijakan</h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
                <li><Link href="/terms-of-service" className="hover:text-[#00DDFD] transition-colors">Syarat & Ketentuan</Link></li>
                <li><Link href="/privacy-policy" className="hover:text-[#00DDFD] transition-colors">Kebijakan Privasi</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} KitaPay. All rights reserved.</p>
            <div className="flex items-center gap-1.5 text-slate-500">
              <ShieldCheck weight="fill" className="text-slate-700 text-sm" />
              <span>Terhubung dengan Payment Gateway Resmi Berlisensi Bank Indonesia</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
