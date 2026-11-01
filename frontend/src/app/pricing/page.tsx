'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  CheckCircle, 
  ArrowRight, 
  Sparkle, 
  ShieldCheck, 
  Lightning, 
  Wallet, 
  ArrowsLeftRight, 
  Question,
  CaretDown,
  Info
} from '@phosphor-icons/react';

export default function PricingPage() {
  // Simulator state
  const [amount, setAmount] = useState<number>(50000);
  const [chargeToCustomer, setChargeToCustomer] = useState<boolean>(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
      tier: 'Tier 1',
      badge: 'Mikro & Standar',
      badgeColor: 'bg-emerald-500',
      range: 'Rp 1 – Rp 100.000',
      fee: 'Rp 1.500',
      type: 'flat per transaksi',
      highlight: true,
      desc: 'Ideal untuk transaksi produk digital, voucher game, pulsa, makanan/minuman, dan pembayaran ritel harian.'
    },
    {
      tier: 'Tier 2',
      badge: 'Reguler',
      badgeColor: 'bg-[#00DDFD]',
      range: 'Di atas Rp 100.000',
      fee: '1,5%',
      type: 'persentase transaksi',
      highlight: false,
      desc: 'Skema proporsional tanpa beban biaya tetap tambahan untuk transaksi bernilai menengah hingga besar.'
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

  const faqs = [
    {
      q: 'Mengapa tarif QRIS Rp 0 - Rp 100.000 menggunakan biaya flat Rp 1.500?',
      a: 'Sesuai dengan ketentuan pemrosesan transaksi dan regulasi upstream payment gateway resmi (DOKU/Bank Indonesia) per November 2026, transaksi QRIS nominal Rp 0 – Rp 100.000 dikenakan processing fee tetap. Skema flat Rp 1.500 memastikan transaksi Anda diproses secara stabil, instan, dan aman 24/7.'
    },
    {
      q: 'Bagaimana cara kerja fitur "Bebankan Biaya ke Pelanggan"?',
      a: 'Ketika fitur ini diaktifkan di Dashboard KitaPay, sistem akan secara otomatis menambahkan biaya layanan (Rp 1.500 atau 1,5%) ke total invoice QRIS yang dipindai pembeli. Dengan demikian, dana penjualan yang masuk ke saldo akun Anda adalah 100% utuh tanpa potongan biaya sepeser pun.'
    },
    {
      q: 'Apakah ada biaya registrasi, aktivasi, atau iuran bulanan?',
      a: 'Sama sekali tidak ada! KitaPay menganut prinsip Pay-As-You-Go. Anda hanya dikenakan biaya ketika transaksi QRIS berhasil dibayar oleh pembeli. Jika tidak ada transaksi, Anda tidak perlu membayar apapun.'
    },
    {
      q: 'Berapa lama waktu settlement / pemindahan dana (Withdrawal) ke rekening bank?',
      a: 'Untuk Settlement / Pemindahan Dana Instan, dana masuk ke rekening bank Anda dalam waktu 1 – 15 menit. Khusus rekening Bank Jago, Anda mendapatkan jatah penarikan gratis 3x setiap bulannya. Anda juga dapat menggunakan opsi Settlement Terjadwal mingguan yang 100% bebas biaya admin ke seluruh 140+ bank di Indonesia.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 flex flex-col selection:bg-[#00DDFD]/20 selection:text-slate-900">
      
      {/* Top Navigation */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 transition-all">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <img 
              src="/KitaPay Blue Typograph.png" 
              alt="KitaPay Logo" 
              className="h-6 sm:h-7 w-auto object-contain transition-transform group-hover:scale-102" 
            />
          </Link>
          <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-semibold">
            <Link href="/pricing" className="text-slate-900 font-bold text-[#00b5ce] transition-colors">
              Biaya
            </Link>
            <Link href="/docs" className="text-slate-500 hover:text-slate-900 transition-colors">
              Panduan
            </Link>
            <Link 
              href="/login" 
              className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm transition-all shadow-xs"
            >
              Masuk / Daftar
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-14 space-y-12 sm:space-y-16">
        
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200/70 text-cyan-800 text-xs font-semibold">
            <Sparkle weight="fill" className="text-[#00DDFD]" />
            <span>Tarif Transparan & Kompetitif</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Biaya Layanan yang Jujur & Tanpa Tersembunyi
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Tanpa biaya bulanan. Tanpa biaya pendaftaran. Dapatkan kode QRIS aktif seketika dan hanya bayar saat transaksi berhasil.
          </p>
          <div className="pt-1">
            <span className="inline-block text-[11px] sm:text-xs text-slate-400 bg-white border border-slate-200 rounded-full px-3 py-1 shadow-2xs">
              ⚡ Terakhir diperbarui: <strong>November 2026</strong> (Sesuai Regulasi Standar Upstream Terkini)
            </span>
          </div>
        </div>

        {/* Section 1: Tabel Tarif Utama QRIS */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-2xs inline-flex items-center">
                  <img src="/logos/qris-logo.svg" alt="QRIS" className="h-4 sm:h-5 w-auto object-contain" />
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Penerimaan Pembayaran QRIS
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Satu QRIS serbaguna, dapat dipindai dari seluruh m-Banking dan E-Wallet resmi Indonesia.
              </p>
            </div>
          </div>

          {/* Cards Display for Tiers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2">
            {qrisTiers.map((tier) => (
              <div 
                key={tier.tier} 
                className={`relative bg-white rounded-2xl p-5 sm:p-6 border transition-all ${
                  tier.highlight 
                    ? 'border-cyan-300 shadow-md ring-1 ring-cyan-200/50' 
                    : 'border-slate-200 shadow-xs hover:border-slate-300'
                }`}
              >
                {tier.highlight && (
                  <span className="absolute -top-3 right-6 bg-gradient-to-r from-[#00DDFD] to-cyan-600 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                    Paling Populer
                  </span>
                )}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${tier.badgeColor}`} />
                    <span className="font-bold text-slate-900 text-base">{tier.tier}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                      {tier.badge}
                    </span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Rentang Nominal</p>
                  <p className="text-lg font-bold text-slate-800">{tier.range}</p>
                </div>

                <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 mb-4 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-slate-500 block">Biaya Pemrosesan:</span>
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{tier.fee}</span>
                  </div>
                  <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-md">
                    {tier.type}
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  {tier.desc}
                </p>

                <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600">
                  <CheckCircle weight="fill" className="text-emerald-500 text-base shrink-0" />
                  <span>Dapat dibebankan ke pembeli (Merchant terima 100% utuh)</span>
                </div>
              </div>
            ))}
          </div>

          {/* Supported Apps List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs mt-4">
            <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              Mendukung Pembayaran Seluruh Bank & Dompet Digital:
            </p>
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              {supportedApps.map((item) => (
                <div 
                  key={item.name} 
                  className="h-7 sm:h-8 px-2.5 sm:px-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center shadow-2xs hover:border-slate-300 transition-colors" 
                  title={item.name}
                >
                  <img src={item.src} alt={item.name} className="h-3.5 sm:h-4 max-w-12 sm:max-w-14 w-auto object-contain" />
                </div>
              ))}
              <span className="text-xs font-medium text-slate-400 ml-1">+ 140+ Bank Lainnya</span>
            </div>
          </div>
        </section>

        {/* Section 2: Interactive Fee Simulator (WOW FACTOR) */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00DDFD]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-6 sm:space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00DDFD]/15 border border-[#00DDFD]/30 text-[#00DDFD] text-xs font-bold uppercase tracking-wider mb-2">
                  <Lightning weight="fill" />
                  Kalkulator Simulasi Transaksi
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Simulasikan Pendapatan Bersih Anda
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
                  Lihat secara transparan berapa nominal yang dibayar pembeli dan dana bersih yang akan Anda terima di setiap transaksi.
                </p>
              </div>

              {/* Fee Toggle */}
              <div className="bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/80 flex items-center gap-2 self-start md:self-auto">
                <span className="text-xs font-medium text-slate-300 pl-2">Bebankan ke Pelanggan:</span>
                <button
                  type="button"
                  onClick={() => setChargeToCustomer(!chargeToCustomer)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    chargeToCustomer ? 'bg-[#00DDFD]' : 'bg-slate-600'
                  }`}
                  aria-pressed={chargeToCustomer}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
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
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
                    <input
                      type="number"
                      min="1000"
                      step="1000"
                      value={amount || ''}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      placeholder="50000"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white font-bold text-lg focus:outline-none focus:ring-2 focus:ring-[#00DDFD] focus:border-transparent transition-all"
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
                        className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                          amount === q 
                            ? 'bg-[#00DDFD] text-slate-900 shadow-xs font-bold' 
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
                        }`}
                      >
                        {formatIDR(q)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Calculation Output Box */}
              <div className="lg:col-span-7 bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 sm:p-6 backdrop-blur-sm space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs sm:text-sm text-slate-300">
                    <span>Harga Produk / Nominal Asli:</span>
                    <span className="font-bold text-white">{formatIDR(calcAmount)}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs sm:text-sm text-slate-300">
                    <span className="flex items-center gap-1.5">
                      Biaya Pemrosesan KitaPay
                      <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                        {calcAmount <= 100000 ? 'Flat Rp 1.500' : '1,5%'}
                      </span>
                    </span>
                    <span className="font-semibold text-amber-300">
                      {chargeToCustomer ? `+ ${formatIDR(serviceFee)}` : `- ${formatIDR(serviceFee)}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs sm:text-sm text-slate-300">
                    <span>Total yang Ditagihkan ke Pelanggan:</span>
                    <span className="font-bold text-white text-base">{formatIDR(customerPay)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900/80 to-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Dana Bersih Masuk ke Merchant:</span>
                    <span className="text-2xl sm:text-3xl font-extrabold text-[#00DDFD]">
                      {formatIDR(merchantReceive)}
                    </span>
                  </div>
                  {chargeToCustomer ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-3 py-1.5 rounded-full font-bold">
                      <CheckCircle weight="fill" />
                      100% Utuh Tanpa Potongan
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">
                      Fee dipotong otomatis dari saldo penjualan
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Settlement / Pemindahan Dana (Payout / Settlement) */}
        <section className="space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Wallet weight="bold" className="text-slate-700" />
              Settlement / Pemindahan Dana (Payout ke Rekening)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pindahkan hasil saldo penjualan Anda dengan bebas ke rekening bank nasional maupun e-wallet mana saja:
            </p>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block border border-slate-200 bg-white rounded-2xl shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs tracking-wider uppercase">
                  <th className="py-3.5 px-5">Tipe Settlement / Pemindahan Dana</th>
                  <th className="py-3.5 px-5">Tujuan Rekening / E-Wallet</th>
                  <th className="py-3.5 px-5">Waktu Proses</th>
                  <th className="py-3.5 px-5 text-right">Biaya Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-5">
                    <span className="font-bold text-slate-900 block">Settlement Instan</span>
                    <span className="text-xs text-slate-500">Kapan saja 24/7</span>
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 px-2.5 bg-amber-50 border border-amber-200/60 rounded-lg flex items-center justify-center shadow-2xs">
                        <img src="/logos/jago-logo.svg" alt="Bank Jago" className="h-3.5 w-auto object-contain" />
                      </div>
                      <span className="font-semibold text-slate-900 text-sm">Bank Jago / Jago Syariah</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-slate-600 font-medium">1 – 15 Menit</td>
                  <td className="py-4 px-5 text-right">
                    <span className="font-extrabold text-emerald-600 text-base">Gratis 3x / bln</span>
                    <span className="block text-xs text-slate-400">berikutnya Rp 2.000</span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-5">
                    <span className="font-bold text-slate-900 block">Settlement Instan</span>
                    <span className="text-xs text-slate-500">Kapan saja 24/7</span>
                  </td>
                  <td className="py-4 px-5">
                    <div>
                      <span className="font-semibold text-slate-900 text-sm block mb-1.5">Bank Lain & Dompet Digital</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {['BCA', 'Mandiri', 'BRI', 'BNI', 'BSI', 'SeaBank', 'DANA', 'GoPay', 'OVO'].map((b) => (
                          <span key={b} className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-slate-600 font-medium">1 – 15 Menit</td>
                  <td className="py-4 px-5 text-right font-bold text-slate-900 text-base">
                    Rp 2.000 <span className="block text-xs font-normal text-slate-400">per transaksi</span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/70 transition-colors bg-emerald-50/30">
                  <td className="py-4 px-5">
                    <span className="font-bold text-slate-900 block">Penarikan Terjadwal</span>
                    <span className="text-xs text-slate-500">Otomatis Mingguan</span>
                  </td>
                  <td className="py-4 px-5">
                    <span className="font-semibold text-slate-900 text-sm">Seluruh 140+ Bank di Indonesia</span>
                    <p className="text-xs text-slate-500 mt-0.5">Semua bank umum dan bank syariah nasional</p>
                  </td>
                  <td className="py-4 px-5 text-slate-600 font-medium">Setiap Jumat/Sabtu</td>
                  <td className="py-4 px-5 text-right">
                    <span className="font-extrabold text-emerald-600 text-base">Gratis (Rp 0)</span>
                    <span className="block text-xs text-slate-400">Bebas biaya admin</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile Card List for Withdrawals */}
          <div className="md:hidden space-y-3">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Settlement Instan (1-15 mnt)</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Gratis 3x / bln</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 px-2 bg-amber-50 border border-amber-200 rounded flex items-center">
                  <img src="/logos/jago-logo.svg" alt="Bank Jago" className="h-3 w-auto object-contain" />
                </div>
                <span className="font-bold text-slate-800 text-sm">Bank Jago / Jago Syariah</span>
              </div>
              <p className="text-[11px] text-slate-400">Setelah 3x gratis, biaya berikutnya hanya Rp 2.000/transaksi.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Settlement Instan (1-15 mnt)</span>
                <span className="text-xs font-extrabold text-slate-900">Rp 2.000 / trx</span>
              </div>
              <span className="font-bold text-slate-800 text-sm block">Bank Lain & E-Wallet Nasional</span>
              <p className="text-[11px] text-slate-500">BCA, Mandiri, BRI, BNI, BSI, SeaBank, DANA, GoPay, OVO, ShopeePay.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2 bg-emerald-50/20">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Penarikan Terjadwal (Mingguan)</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">100% Gratis</span>
              </div>
              <span className="font-bold text-slate-800 text-sm block">140+ Bank Seluruh Indonesia</span>
              <p className="text-[11px] text-slate-500">Diproses otomatis setiap akhir pekan tanpa potongan biaya admin.</p>
            </div>
          </div>
        </section>

        {/* Section 4: Jaminan Tanpa Biaya Tersembunyi */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2">
            <ShieldCheck weight="fill" className="text-[#00DDFD] text-2xl" />
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              Jaminan Transparansi Tanpa Biaya Tersembunyi
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 pt-1">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-400 block font-medium">Biaya Registrasi Akun</span>
              <span className="text-lg font-extrabold text-slate-900">Rp 0 (Gratis)</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-400 block font-medium">Biaya Pemeliharaan Bulanan</span>
              <span className="text-lg font-extrabold text-slate-900">Rp 0 (Gratis)</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-400 block font-medium">Biaya Akses API & Webhook</span>
              <span className="text-lg font-extrabold text-slate-900">Rp 0 (Gratis)</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-400 block font-medium">Masa Berlaku Saldo</span>
              <span className="text-lg font-extrabold text-slate-900">Tanpa Batas</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-400 block font-medium">Fitur Sandbox Developer</span>
              <span className="text-lg font-extrabold text-slate-900">Termasuk</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-400 block font-medium">Fitur Bebankan ke Pembeli</span>
              <span className="text-lg font-extrabold text-slate-900">Bebas Aktifkan</span>
            </div>
          </div>
        </section>

        {/* Section 5: FAQ */}
        <section className="space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Question weight="bold" className="text-slate-700" />
              Pertanyaan Seputar Biaya
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Jawaban lengkap seputar sistem biaya pemrosesan dan settlement / pemindahan dana di KitaPay.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx} 
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-slate-900 hover:bg-slate-50/60 transition-colors"
                  >
                    <span className="text-sm sm:text-base">{faq.q}</span>
                    <CaretDown 
                      weight="bold" 
                      className={`text-slate-400 transition-transform shrink-0 ${isOpen ? 'rotate-180 text-cyan-600' : ''}`} 
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3 bg-slate-50/30">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 6: Bottom Call to Action */}
        <section className="bg-gradient-to-r from-[#00DDFD]/10 via-cyan-50 to-slate-50 border border-cyan-200/60 rounded-3xl p-6 sm:p-10 text-center space-y-4">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Mulai Terima Pembayaran QRIS Hari Ini
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
            Daftar gratis dalam 2 menit, integrasikan API dengan dokumentasi ringkas kami, dan nikmati settlement / pemindahan dana yang lancar.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link 
              href="/login" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition-all hover:shadow-lg"
            >
              <span>Daftar Akun Gratis</span>
              <ArrowRight weight="bold" />
            </Link>
            <Link 
              href="/docs" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-sm px-6 py-3 rounded-xl transition-all"
            >
              <span>Lihat Dokumentasi API</span>
            </Link>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-10 sm:py-12 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 text-sm">
          <div>
            <img src="/KitaPay Blue Typograph.png" alt="KitaPay" className="h-6 w-auto object-contain mb-3 sm:mb-4" />
            <p className="text-slate-500 leading-relaxed pr-4 text-[13px]">
              KitaPay adalah gateway pembayaran QRIS instan berlisensi Bank Indonesia melalui upstream resmi. Membantu bisnis dan kreator digital menerima pembayaran tanpa birokrasi.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 mb-3 sm:mb-4 text-sm">Panduan & Integrasi</h4>
            <ul className="space-y-2 text-[13px]">
              <li><Link href="/docs" className="text-slate-500 hover:text-cyan-600 underline decoration-slate-300 underline-offset-2">Dokumentasi API</Link></li>
              <li><Link href="/docs" className="text-slate-500 hover:text-cyan-600 underline decoration-slate-300 underline-offset-2">Panduan Webhook</Link></li>
              <li><Link href="/pricing" className="text-slate-500 hover:text-cyan-600 underline decoration-slate-300 underline-offset-2">Simulasi Biaya</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 mb-3 sm:mb-4 text-sm">Legal & Informasi</h4>
            <ul className="space-y-2 text-[13px]">
              <li><Link href="/privacy-policy" className="text-slate-500 hover:text-cyan-600 underline decoration-slate-300 underline-offset-2">Kebijakan Privasi</Link></li>
              <li><Link href="/terms-of-service" className="text-slate-500 hover:text-cyan-600 underline decoration-slate-300 underline-offset-2">Syarat & Ketentuan</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 sm:mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <span>KitaPay © {new Date().getFullYear()} PT Rinz Group Inovasi. All rights reserved.</span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <ShieldCheck weight="fill" className="text-emerald-500 text-sm" />
            Terhubung dengan Payment Gateway Resmi Bank Indonesia
          </span>
        </div>
      </footer>

    </div>
  );
}
