import React from 'react';
import Link from 'next/link';

export default function PricingPage() {
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
      badge: 'Mikro',
      badgeColor: 'bg-emerald-500',
      range: 'Rp 1 – Rp 20.000',
      fee: 'Rp 750',
      type: 'flat'
    },
    {
      tier: 'Tier 2',
      badge: 'Kecil',
      badgeColor: 'bg-blue-500',
      range: 'Rp 20.001 – Rp 50.000',
      fee: 'Rp 1.000',
      type: 'flat'
    },
    {
      tier: 'Tier 3',
      badge: 'Menengah',
      badgeColor: 'bg-indigo-500',
      range: 'Rp 50.001 – Rp 100.000',
      fee: 'Rp 1.500',
      type: 'flat'
    },
    {
      tier: 'Tier 4',
      badge: 'Reguler',
      badgeColor: 'bg-violet-500',
      range: 'Di atas Rp 100.000',
      fee: '1,5%',
      type: 'flat'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-800 flex flex-col">
      
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 pr-3 sm:pr-4 sm:border-r border-slate-200">
            <img src="/KitaPay Blue Typograph.png" alt="KitaPay Logo" className="h-5 sm:h-6 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm font-semibold">
            <Link href="/pricing" className="text-slate-800 hover:text-[#00DDFD] transition-colors">Biaya</Link>
            <Link href="/docs" className="text-slate-500 hover:text-slate-800 transition-colors">Panduan</Link>
            <Link href="/login" className="text-slate-500 hover:text-slate-800 transition-colors">
              Daftar/Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-4xl font-bold sm:font-normal text-slate-900 mb-1.5 sm:mb-2">Biaya Layanan</h1>
        <p className="text-xs sm:text-sm text-slate-500 mb-6 sm:mb-8">
          Diperbarui {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>

        <div className="max-w-none space-y-8 sm:space-y-12">
          <p className="text-sm sm:text-[15px] leading-relaxed text-slate-600">
            KitaPay menawarkan skema biaya yang transparan, bersahabat untuk produk mikro/digital, dan tanpa biaya tersembunyi. Tidak ada biaya registrasi maupun biaya bulanan.
          </p>

          {/* Section: Penerimaan Pembayaran (QRIS) */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="p-1 sm:p-1.5 bg-white border border-slate-200 rounded-lg shadow-2xs inline-flex items-center">
                    <img src="/logos/qris-logo.svg" alt="QRIS" className="h-4 sm:h-4.5 w-auto object-contain" />
                  </span>
                  <span>Penerimaan Pembayaran QRIS</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Biaya pemrosesan transaksi otomatis disesuaikan berdasarkan jenjang nominal transaksi:
                </p>
              </div>
            </div>

            {/* Supported Apps Badges */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 mb-4">
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Dapat dipindai dari semua Mobile Banking & E-Wallet:
              </p>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                {supportedApps.map((item) => (
                  <div 
                    key={item.name} 
                    className="h-6 sm:h-7 px-2 sm:px-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-2xs hover:border-slate-300 transition-colors" 
                    title={item.name}
                  >
                    <img src={item.src} alt={item.name} className="h-3 sm:h-3.5 max-w-10.5 sm:max-w-12.5 w-auto object-contain" />
                  </div>
                ))}
                <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 ml-1">+ 140+ Bank Lainnya</span>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block border border-slate-200 bg-white rounded-2xl shadow-xs overflow-hidden">
              <table className="w-full text-left border-collapse text-[14px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs tracking-wider uppercase">
                    <th className="py-3.5 px-5">Jenjang Transaksi</th>
                    <th className="py-3.5 px-5">Rentang Nominal</th>
                    <th className="py-3.5 px-5 text-right">Biaya Pemrosesan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {qrisTiers.map((t) => (
                    <tr key={t.tier} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${t.badgeColor}`}></span>
                          <span className="font-semibold text-slate-900">{t.tier}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">{t.badge}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-slate-600">{t.range}</td>
                      <td className="py-4 px-5 text-right font-bold text-slate-900">
                        {t.fee} <span className="text-xs font-normal text-slate-500">{t.type}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card-List View */}
            <div className="md:hidden space-y-2.5">
              {qrisTiers.map((t) => (
                <div key={t.tier} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${t.badgeColor}`}></span>
                      <span className="font-bold text-slate-900 text-sm">{t.tier}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">{t.badge}</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Nominal: <span className="font-semibold text-slate-700">{t.range}</span>
                    </p>
                  </div>
                  <div className="text-right pl-3 shrink-0">
                    <span className="text-base font-extrabold text-slate-900">{t.fee}</span>
                    <span className="block text-[10px] text-slate-400">{t.type} / transaksi</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Penarikan Dana (Payout) */}
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">
              Penarikan Dana (Pencairan ke Rekening)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mb-3 sm:mb-4">
              Cairkan saldo penjualan ke rekening bank atau dompet digital Anda secara fleksibel:
            </p>

            {/* Desktop Table View */}
            <div className="hidden md:block border border-slate-200 bg-white rounded-2xl shadow-xs overflow-hidden">
              <table className="w-full text-left border-collapse text-[14px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs tracking-wider uppercase">
                    <th className="py-3.5 px-5">Tipe Penarikan</th>
                    <th className="py-3.5 px-5">Tujuan Rekening</th>
                    <th className="py-3.5 px-5 text-right">Biaya Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-5">
                      <span className="font-semibold text-slate-900 block">Pencairan Instan</span>
                      <span className="text-xs text-slate-400">Proses 1-15 menit</span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 px-2.5 bg-amber-50 border border-amber-200/60 rounded-lg flex items-center justify-center shadow-2xs">
                          <img src="/logos/jago-logo.svg" alt="Bank Jago" className="h-3.5 w-auto object-contain" />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 text-sm">Bank Jago / Jago Syariah</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <span className="font-bold text-emerald-600 text-base">Gratis 3x</span>
                      <span className="block text-xs text-slate-400">per bulan (lalu Rp 2.000)</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-5">
                      <span className="font-semibold text-slate-900 block">Pencairan Instan</span>
                      <span className="text-xs text-slate-400">Proses 1-15 menit</span>
                    </td>
                    <td className="py-4 px-5">
                      <div>
                        <span className="font-semibold text-slate-900 text-sm block mb-1.5">Bank Lain & E-Wallet</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[
                            { name: 'BCA', src: '/logos/bca-logo.svg' },
                            { name: 'Mandiri', src: '/logos/mandiri-logo.svg' },
                            { name: 'BRI', src: '/logos/bri-logo.svg' },
                            { name: 'BNI', src: '/logos/bni-logo.svg' },
                            { name: 'BSI', src: '/logos/bsi-logo.svg' },
                            { name: 'SeaBank', src: '/logos/seabank-logo.svg' },
                            { name: 'DANA', src: '/logos/dana-logo.svg' },
                            { name: 'GoPay', src: '/logos/gopay-logo.svg' },
                            { name: 'OVO', src: '/logos/ovo-logo.svg' },
                            { name: 'ShopeePay', src: '/logos/shopeepay-logo.svg' },
                          ].map(b => (
                            <div key={b.name} className="h-6 px-1.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-center">
                              <img src={b.src} alt={b.name} className="h-3 max-w-9 w-auto object-contain" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-right font-bold text-slate-900 text-base">
                      Rp 2.000 <span className="block text-xs font-normal text-slate-400">per transaksi</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/60 transition-colors bg-slate-50/30">
                    <td className="py-4 px-5">
                      <span className="font-semibold text-slate-900 block">Penarikan Terjadwal</span>
                      <span className="text-xs text-slate-400">Otomatis hari Jumat/Sabtu</span>
                    </td>
                    <td className="py-4 px-5">
                      <span className="font-semibold text-slate-900 text-sm">Semua Rekening Bank di Indonesia</span>
                      <p className="text-xs text-slate-500 mt-0.5">Mendukung 140+ bank umum dan bank syariah nasional</p>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <span className="font-bold text-emerald-600 text-base">Gratis</span>
                      <span className="block text-xs text-slate-400">Bebas Biaya Admin</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mobile Card-List View */}
            <div className="md:hidden space-y-3">
              {/* Card 1: Bank Jago */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pencairan Instan</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">Gratis 3x / bulan</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="h-7 px-2 bg-amber-50 border border-amber-200/60 rounded-lg flex items-center justify-center shrink-0">
                    <img src="/logos/jago-logo.svg" alt="Bank Jago" className="h-3.5 w-auto object-contain" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">Bank Jago / Jago Syariah</span>
                    <span className="text-[11px] text-slate-400">Proses 1-15 menit (lalu Rp 2.000/trx)</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Bank Lain & E-Wallet */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pencairan Instan</span>
                  <span className="text-xs font-extrabold text-slate-900">Rp 2.000 <span className="text-[10px] text-slate-400 font-normal">/ transaksi</span></span>
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-sm block mb-1.5">Bank Lain & E-Wallet</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { name: 'BCA', src: '/logos/bca-logo.svg' },
                      { name: 'Mandiri', src: '/logos/mandiri-logo.svg' },
                      { name: 'BRI', src: '/logos/bri-logo.svg' },
                      { name: 'BNI', src: '/logos/bni-logo.svg' },
                      { name: 'BSI', src: '/logos/bsi-logo.svg' },
                      { name: 'SeaBank', src: '/logos/seabank-logo.svg' },
                      { name: 'DANA', src: '/logos/dana-logo.svg' },
                      { name: 'GoPay', src: '/logos/gopay-logo.svg' },
                      { name: 'OVO', src: '/logos/ovo-logo.svg' },
                      { name: 'ShopeePay', src: '/logos/shopeepay-logo.svg' },
                    ].map(b => (
                      <div key={b.name} className="h-5 px-1.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-center">
                        <img src={b.src} alt={b.name} className="h-2.5 max-w-8 w-auto object-contain" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 3: Penarikan Terjadwal */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Penarikan Terjadwal</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">Gratis (Rp 0)</span>
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-sm block">Semua Rekening Bank di Indonesia</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Otomatis diproses setiap Jumat/Sabtu (140+ bank)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-10 sm:py-12 mt-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 text-sm">
          <div>
            <img src="/KitaPay Blue Typograph.png" alt="KitaPay" className="h-5 sm:h-6 w-auto object-contain mb-3 sm:mb-4" />
            <p className="text-slate-500 leading-relaxed pr-4 text-[13px]">
              KitaPay adalah layanan link pembayaran yang membantu merchant menerima pembayaran lewat QRIS secara instan. Dana diproses aman oleh Payment Gateway resmi berizin Bank Indonesia.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-700 mb-3 sm:mb-4 text-[14px] sm:text-[15px]">Referensi</h4>
            <ul className="space-y-2 text-[13px]">
              <li><Link href="/docs" className="text-slate-500 hover:text-[#00DDFD] underline decoration-slate-300 underline-offset-2">Dokumentasi API</Link></li>
              <li><Link href="/docs" className="text-slate-500 hover:text-[#00DDFD] underline decoration-slate-300 underline-offset-2">Panduan Integrasi</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-700 mb-3 sm:mb-4 text-[14px] sm:text-[15px]">Informasi</h4>
            <ul className="space-y-2 text-[13px]">
              <li><Link href="/privacy-policy" className="text-slate-500 hover:text-[#00DDFD] underline decoration-slate-300 underline-offset-2">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="text-slate-500 hover:text-[#00DDFD] underline decoration-slate-300 underline-offset-2">Term of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8 sm:mt-12 pt-6 border-t border-slate-200 text-xs text-slate-400">
          KitaPay © {new Date().getFullYear()}
        </div>
      </footer>

    </div>
  );
}
