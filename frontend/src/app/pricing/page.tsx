import React from 'react';
import Link from 'next/link';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-800 flex flex-col">
      
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 border-r border-slate-200 pr-4">
            <img src="/KitaPay Blue Typograph.png" alt="KitaPay Logo" className="h-6 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-6 text-sm font-semibold">
            <Link href="/pricing" className="text-slate-800 hover:text-[#00DDFD] transition-colors">Biaya</Link>
            <Link href="/docs" className="text-slate-500 hover:text-slate-800 transition-colors">Panduan</Link>
            <Link href="/login" className="text-slate-500 hover:text-slate-800 transition-colors">
              Daftar/Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <h1 className="text-4xl font-normal text-slate-900 mb-2">Biaya</h1>
        <p className="text-sm text-slate-500 mb-8">Diperbarui {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>

        <div className="prose prose-slate max-w-none">
          <p className="text-[15px] leading-relaxed mb-4">
            KitaPay menawarkan biaya layanan yang sangat kompetitif dan transparan. Tidak ada biaya lain-lain.
          </p>
          <p className="text-[15px] leading-relaxed mb-6">
            Berikut adalah biaya untuk metode pembayaran yang didukung:
          </p>

          {/* Table */}
          <div className="border border-slate-200 bg-white rounded-sm mb-8 overflow-hidden">
            <table className="w-full text-left border-collapse text-[15px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th colSpan={2} className="py-3 px-4">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg" alt="QRIS" className="h-5 w-auto object-contain" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 text-slate-700">QRIS (Nominal di bawah Rp 100.000)</td>
                  <td className="py-3 px-4 text-slate-700 text-right font-medium">1,5% + Rp 500</td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 text-slate-700">QRIS (Nominal Rp 100.000 ke atas)</td>
                  <td className="py-3 px-4 text-slate-700 text-right font-medium">1,4% Flat</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mb-12">
            <h4 className="font-bold text-slate-900 mb-2 text-[15px]">Catatan:</h4>
            <ul className="list-disc pl-5 space-y-1 text-[15px] text-slate-700 marker:text-slate-400">
              <li>Biaya di atas sudah merupakan total MDR akhir (termasuk biaya jaringan dasar dan sistem KitaPay).</li>
              <li>Merchant dapat memilih untuk menanggung biaya ini sendiri, atau membebankannya secara otomatis kepada pelanggan saat checkout.</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12 mt-auto">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          <div>
            <img src="/KitaPay Blue Typograph.png" alt="KitaPay" className="h-6 w-auto object-contain mb-4" />
            <p className="text-slate-500 leading-relaxed pr-4 text-[13px]">
              KitaPay adalah layanan link pembayaran yang membantu merchant menerima pembayaran lewat QRIS secara instan. Dana diproses aman oleh Payment Gateway resmi.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-700 mb-4 text-[15px]">Referensi</h4>
            <ul className="space-y-2.5 text-[13px]">
              <li><Link href="/docs" className="text-slate-500 hover:text-[#00DDFD] underline decoration-slate-300 underline-offset-2">Dokumentasi API</Link></li>
              <li><Link href="/docs" className="text-slate-500 hover:text-[#00DDFD] underline decoration-slate-300 underline-offset-2">Panduan Integrasi</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-700 mb-4 text-[15px]">Informasi</h4>
            <ul className="space-y-2.5 text-[13px]">
              <li><Link href="/privacy-policy" className="text-slate-500 hover:text-[#00DDFD] underline decoration-slate-300 underline-offset-2">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="text-slate-500 hover:text-[#00DDFD] underline decoration-slate-300 underline-offset-2">Term of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-6 mt-12 pt-6 border-t border-slate-200 text-xs text-slate-400">
          KitaPay © {new Date().getFullYear()}
        </div>
      </footer>

    </div>
  );
}
