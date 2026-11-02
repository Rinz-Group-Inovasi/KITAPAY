'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShieldWarning, 
  Prohibit, 
  Receipt, 
  Wallet, 
  Bank, 
  WarningCircle, 
  CheckCircle,
  LockKey
} from '@phosphor-icons/react';
import AES256Seal from '@/components/AES256Seal';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-800 flex flex-col selection:bg-[#00DDFD]/20 selection:text-slate-900">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 pr-3 sm:pr-4 sm:border-r border-slate-200">
            <img src="/KitaPay Emblem.png" alt="KitaPay Emblem" className="h-8 sm:h-9 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-semibold">
            <Link href="/pricing" className="text-slate-500 hover:text-slate-900 transition-colors">Biaya</Link>
            <Link href="/docs" className="text-slate-500 hover:text-slate-900 transition-colors">Panduan</Link>
            <Link href="/login" className="text-slate-500 hover:text-slate-900 transition-colors">Daftar/Login</Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        <div className="border-b border-slate-200 pb-6 mb-8">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Syarat dan Ketentuan Layanan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Terakhir diperbarui: November 2026 • Sesuai Regulasi Bank Indonesia (BI) & Ketentuan Anti Pencucian Uang (APU-PPT)
          </p>
        </div>

        <div className="space-y-8 text-[14.5px] leading-relaxed text-slate-700">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs">
            <p className="font-medium text-slate-800">
              Selamat datang di <strong>KitaPay</strong>. Dengan mendaftar, mengakses, atau menggunakan layanan KitaPay, Anda (selanjutnya disebut sebagai <strong>&ldquo;Merchant&rdquo;</strong> atau <strong>&ldquo;Pengguna&rdquo;</strong>) menyatakan telah membaca, memahami, dan menyetujui seluruh Syarat dan Ketentuan ini. Apabila Anda tidak menyetujui sebagian atau seluruh ketentuan ini, Anda tidak diperkenankan untuk menggunakan platform kami.
            </p>
          </div>

          {/* 1. Definisi dan Layanan */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center text-xs font-black">1</span>
              <span>Layanan KitaPay</span>
            </h2>
            <p>
              KitaPay adalah platform penyedia solusi link pembayaran dan agregasi transaksi digital yang memfasilitasi Merchant untuk menerima pembayaran secara daring dari pelanggan melalui kode <strong>QRIS Dinamis</strong> dan saluran pembayaran digital resmi lainnya.
            </p>
            <p className="text-xs sm:text-sm text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-3.5">
              Pemrosesan dana, lisensi perantara pembayaran, serta penerbitan QRIS diselenggarakan dan diawasi melalui kemitraan dengan Penyelenggara Jasa Pembayaran (PJP) resmi yang telah berizin dan diawasi langsung oleh <strong>Bank Indonesia (BI)</strong>.
            </p>
          </section>

          {/* 2. Pendaftaran dan Verifikasi Identitas (KYC) */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center text-xs font-black">2</span>
              <span>Pendaftaran Akun dan Verifikasi (KYC)</span>
            </h2>
            <ul className="space-y-2.5 text-slate-600">
              <li className="flex items-start gap-2.5">
                <CheckCircle weight="fill" className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Merchant wajib memberikan data identitas, data usaha, dan rekening bank penampung yang sah, valid, akurat, dan dapat dipertanggungjawabkan secara hukum.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle weight="fill" className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span>KitaPay berhak meminta dokumen tambahan (KTP, NPWP, NIB, foto tempat usaha) dan melakukan verifikasi berkala dalam rangka prinsip <em>Know Your Customer</em> (KYC).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle weight="fill" className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Merchant bertanggung jawab penuh atas kerahasiaan akun, kata sandi, dan <em>API Key</em> miliknya. Segala aktivitas transaksi yang dilakukan melalui kredensial Merchant dianggap sah atas nama Merchant.</span>
              </li>
            </ul>
          </section>

          {/* 3. Ketentuan Merchant: Aktivitas Bisnis yang Dilarang Keras */}
          <section className="bg-white border-2 border-rose-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b border-rose-100 pb-3.5 text-rose-700">
              <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <Prohibit weight="bold" className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  3. Aktivitas Bisnis dan Transaksi yang Dilarang Keras
                </h2>
                <p className="text-xs text-rose-600 font-semibold mt-0.5">
                  Kebijakan Tanpa Toleransi (Zero Tolerance Policy)
                </p>
              </div>
            </div>

            <p className="text-slate-700 font-medium">
              Merchant dilarang keras menggunakan platform KitaPay untuk memproses, memfasilitasi, atau menerima dana dari aktivitas ilegal berikut:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3.5 space-y-1">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5 text-rose-700">
                  <ShieldWarning weight="fill" className="w-4 h-4 shrink-0" />
                  Judi Online (Judol) & Taruhan
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Segala bentuk perjudian daring, kasino virtual, taruhan olahraga, slot online, togel, maupun situs lotere yang dilarang undang-undang.
                </p>
              </div>

              <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3.5 space-y-1">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5 text-rose-700">
                  <ShieldWarning weight="fill" className="w-4 h-4 shrink-0" />
                  Skema Ponzi & Investasi Bodong
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Skema piramida, <em>money game</em>, arisan berantai, robot trading tanpa izin, atau penghimpunan dana publik tanpa izin resmi OJK/Bappebti.
                </p>
              </div>

              <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3.5 space-y-1">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5 text-rose-700">
                  <ShieldWarning weight="fill" className="w-4 h-4 shrink-0" />
                  Penipuan & Kejahatan Siber
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Aktivitas <em>phishing</em>, penipuan e-commerce, rekayasa sosial, pemalsuan identitas, transaksi fiktif (*gesek tunai/gestun*), atau manipulasi voucher.
                </p>
              </div>

              <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3.5 space-y-1">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5 text-rose-700">
                  <ShieldWarning weight="fill" className="w-4 h-4 shrink-0" />
                  Pencucian Uang & Pendanaan Terorisme
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Penghimpunan dana tanpa izin, penyamaran uang hasil tindak pidana, atau aktivitas apa pun yang bertentangan dengan UU TPPU dan TPPT.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 pt-1">
              Larangan juga mencakup perdagangan narkotika, senjata api/tajam ilegal, barang selundupan, produk bajakan yang melanggar Hak Cipta, serta materi pornografi/asusila.
            </p>
          </section>

          {/* 4. Sanksi, Pembekuan Akun, dan Pelaporan Hukum */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center text-xs font-black">4</span>
              <span>Pengawasan Transaksi, Pembekuan Akun, dan Penegakan Hukum</span>
            </h2>
            <p>
              Untuk menjaga integritas ekosistem pembayaran dan memenuhi kepatuhan regulasi Bank Indonesia:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>
                <strong>Hak Pembekuan (*Freeze*):</strong> KitaPay berhak secara sepihak dan seketika menangguhkan layanan, memblokir API, atau membekukan akun Merchant tanpa pemberitahuan sebelumnya apabila terdeteksi transaksi mencurigakan (*suspicious transactions*) atau pelanggaran terhadap larangan aktivitas bisnis.
              </li>
              <li>
                <strong>Penahanan Dana (*Hold Settlement*):</strong> Dana transaksi yang diduga berkaitan dengan penipuan, judol, atau pencucian uang akan ditahan (*hold*) selama proses investigasi internal maupun investigasi pihak perbankan/upstream gateway hingga batas waktu yang ditentukan.
              </li>
              <li>
                <strong>Pelaporan ke Otoritas:</strong> KitaPay berhak dan berkewajiban melaporkan data Merchant, riwayat transaksi, dan bukti digital terkait kepada <strong>Kepolisian Republik Indonesia</strong>, <strong>Pusat Pelaporan dan Analisis Transaksi Keuangan (PPATK)</strong>, <strong>Satgas Waspada Investasi / OJK</strong>, serta <strong>Bank Indonesia</strong>.
              </li>
            </ul>
          </section>

          {/* 5. Standar Enkripsi Keamanan AES-256 */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <AES256Seal size={40} className="w-10 h-10" />
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  5. Standar Enkripsi Keamanan Data AES-256
                </h2>
                <p className="text-xs text-slate-500">Standar enkripsi data AES-256</p>
              </div>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Seluruh data sensitif yang disimpan pada basis data KitaPay maupun yang dikomunikasikan melalui API dilindungi menggunakan standar enkripsi AES-256:
            </p>

            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600">
              <li>
                <strong>Enkripsi Data Sensitif (At-Rest):</strong> Nomor rekening pencairan merchant, kredensial kunci rahasia (*Secret Key*), dan kunci penandatanganan webhook dienkripsi menggunakan algoritma <strong>AES-256-GCM</strong> (Galois/Counter Mode) dengan kunci simetris 256-bit dan <em>authentication tag</em> untuk mencegah manipulasi data.
              </li>
              <li>
                <strong>Enkripsi Komunikasi Jalur (In-Transit):</strong> Seluruh pertukaran data antara klien, merchant, dan gateway KitaPay diwajibkan menggunakan protokol HTTPS dengan cipher suite 256-bit.
              </li>
            </ul>
          </section>

          {/* 6. Biaya Pemrosesan Transaksi (Aturan BI: Tanpa MDR) */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-200/60 flex items-center justify-center text-[#00A8EC]">
                <Receipt weight="bold" className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                6. Biaya Pemrosesan Transaksi (Penyesuaian Regulasi BI)
              </h2>
            </div>

            <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 space-y-2 text-xs sm:text-sm text-slate-600">
              <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                <WarningCircle weight="fill" className="w-4 h-4 text-cyan-600" />
                Ketentuan Penamaan Biaya:
              </p>
              <p>
                Sesuai dengan ketentuan dan pedoman terbaru dari <strong>Bank Indonesia (BI)</strong>, istilah <em>Merchant Discount Rate</em> (MDR) telah ditiadakan dan disesuaikan secara resmi menjadi <strong>Biaya Pemrosesan Transaksi (*Transaction Processing Fee*)</strong>.
              </p>
            </div>

            <p>
              Atas penyediaan sistem penerimaan pembayaran QRIS, KitaPay memotong Biaya Pemrosesan Transaksi transparan sesuai tiering nominal resmi yang berlaku:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-semibold">
                  <tr>
                    <th className="py-2.5 px-4 border-b border-slate-200">Kategori Transaksi</th>
                    <th className="py-2.5 px-4 border-b border-slate-200">Rentang Nominal</th>
                    <th className="py-2.5 px-4 border-b border-slate-200 text-right">Biaya Pemrosesan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">Tier 1 (Mikro & Standar)</td>
                    <td className="py-3 px-4 text-slate-600">Rp 1 – Rp 100.000</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">Rp 1.500 <span className="text-xs font-normal text-slate-500">flat</span></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">Tier 2 (Reguler)</td>
                    <td className="py-3 px-4 text-slate-600">Di atas Rp 100.000</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">1,5% <span className="text-xs font-normal text-slate-500">per transaksi</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-xs sm:text-sm text-slate-600">
              <strong>Fitur Pembebanan Biaya:</strong> Merchant memiliki pilihan konfigurasi untuk menanggung biaya pemrosesan transaksi atau membebankannya kepada pelanggan (*charge fee to customer*) secara transparan saat pembuatan link pembayaran atau tagihan.
            </p>
          </section>

          {/* 7. Penarikan Dana (Withdrawal & Settlement) */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600">
                <Wallet weight="bold" className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                7. Penarikan Dana (Withdrawal & Settlement)
              </h2>
            </div>

            <p>
              Saldo hasil transaksi yang telah berstatus sukses (*PAID*) dapat dicairkan oleh Merchant ke rekening bank atau dompet digital terdaftar dengan ketentuan:
            </p>

            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
              <li className="flex items-start gap-2.5">
                <span className="text-[#00A8EC] font-bold mt-0.5">•</span>
                <p>
                  <strong className="text-slate-900">Pencairan Instan:</strong> Diproses dalam waktu 1-15 menit. Penarikan ke <strong>Bank Jago</strong> gratis 3x setiap bulan (kemudian Rp 2.000/transaksi). Penarikan ke bank lain dan e-wallet dikenakan biaya administrasi jaringan sebesar Rp 2.000 per transaksi.
                </p>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#00A8EC] font-bold mt-0.5">•</span>
                <p>
                  <strong className="text-slate-900">Penarikan Terjadwal:</strong> Diproses secara otomatis setiap hari Jumat/Sabtu bebas biaya admin (Rp 0) ke rekening bank terdaftar di seluruh Indonesia.
                </p>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#00A8EC] font-bold mt-0.5">•</span>
                <p>
                  <strong className="text-slate-900">Verifikasi Rekening:</strong> Nama pemilik rekening bank tujuan pencairan harus sesuai dengan nama entitas atau identitas pemilik akun Merchant yang telah diverifikasi pada tahap KYC.
                </p>
              </li>
            </ul>
          </section>

          {/* 8. Batasan Tanggung Jawab & Force Majeure */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center text-xs font-black">8</span>
              <span>Batasan Tanggung Jawab & Force Majeure</span>
            </h2>
            <p>
              KitaPay tidak bertanggung jawab atas kerugian tidak langsung, kegagalan transaksi akibat gangguan jaringan perbankan nasional, pemeliharaan sistem upstream payment gateway, kesalahan input data oleh Merchant/pembeli, atau kondisi <em>Force Majeure</em> (bencana alam, huru-hara, kebijakan moneter pemerintah baru).
            </p>
          </section>

          {/* 9. Kontak Resmi */}
          <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-2">
            <h3 className="font-bold text-slate-900 text-base">Butuh Bantuan atau Pertanyaan Hukum?</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
              Jika Anda memiliki pertanyaan mengenai Syarat dan Ketentuan ini atau ingin melaporkan indikasi penyalahgunaan layanan, hubungi tim kepatuhan kami melalui email resmi:
            </p>
            <p className="font-bold text-slate-800 text-sm pt-1">
              <a href="mailto:kitapay.sayangku@gmail.com" className="text-[#00A8EC] hover:underline">
                kitapay.sayangku@gmail.com
              </a>
              <span className="text-slate-400 font-normal"> • Bagian dari RINZ GROUP INOVASI</span>
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-400">
        KitaPay © {new Date().getFullYear()} • Seluruh hak cipta dilindungi undang-undang.
      </footer>
    </div>
  );
}
