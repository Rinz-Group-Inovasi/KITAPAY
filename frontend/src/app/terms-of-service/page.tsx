import React from 'react';
import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-800 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 border-r border-slate-200 pr-4">
            <img src="/KitaPay Blue Typograph.png" alt="KitaPay Logo" className="h-6 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-6 text-sm font-semibold">
            <Link href="/pricing" className="text-slate-500 hover:text-slate-800 transition-colors">Biaya</Link>
            <Link href="/docs" className="text-slate-500 hover:text-slate-800 transition-colors">Panduan</Link>
            <Link href="/login" className="text-slate-500 hover:text-slate-800 transition-colors">Daftar/Login</Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <h1 className="text-4xl font-normal text-slate-900 mb-2">Term of Service</h1>
        <p className="text-sm text-slate-500 mb-8">Terakhir diperbarui: 24 Agustus 2026</p>

        <div className="prose prose-slate max-w-none text-[15px] leading-relaxed">
          <p>
            Dengan mendaftar dan menggunakan layanan KitaPay, Anda setuju untuk terikat oleh Syarat dan Ketentuan berikut. Silakan baca dengan saksama sebelum menggunakan platform kami.
          </p>

          <h3 className="text-lg font-bold text-slate-900 mt-8 mb-4">1. Layanan Kami</h3>
          <p>
            KitaPay menyediakan platform agregasi pembayaran yang memungkinkan Anda sebagai Merchant untuk menerima pembayaran digital secara instan melalui kode QRIS dan metode pembayaran lain yang terintegrasi.
          </p>

          <h3 className="text-lg font-bold text-slate-900 mt-8 mb-4">2. Kewajiban Pengguna</h3>
          <p>
            Sebagai pengguna, Anda setuju untuk:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Memberikan informasi bisnis yang sah dan akurat saat proses pendaftaran (KYC).</li>
            <li>Tidak menggunakan layanan KitaPay untuk aktivitas ilegal, penipuan, atau pencucian uang.</li>
            <li>Bertanggung jawab penuh atas setiap transaksi yang terjadi melalui akun Anda.</li>
          </ul>

          <h3 className="text-lg font-bold text-slate-900 mt-8 mb-4">3. Biaya dan Penarikan (Withdrawal)</h3>
          <p>
            KitaPay berhak memotong biaya layanan (MDR) sesuai dengan kesepakatan atau harga publik yang tertera pada halaman Biaya. Dana yang masuk ke saldo Merchant dapat ditarik (*withdraw*) ke rekening bank yang telah diverifikasi sesuai dengan jadwal penyelesaian (*settlement*) yang berlaku.
          </p>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-400">
        KitaPay © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
