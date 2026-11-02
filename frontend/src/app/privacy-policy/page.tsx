import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-800 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 pr-3 sm:pr-4 sm:border-r border-slate-200">
            <img src="/KitaPay Emblem.png" alt="KitaPay Emblem" className="h-8 sm:h-9 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-semibold">
            <Link href="/pricing" className="text-slate-500 hover:text-slate-800 transition-colors">Biaya</Link>
            <Link href="/docs" className="text-slate-500 hover:text-slate-800 transition-colors">Panduan</Link>
            <Link href="/login" className="text-slate-500 hover:text-slate-800 transition-colors">Daftar/Login</Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <h1 className="text-4xl font-normal text-slate-900 mb-2">Kebijakan Privasi</h1>
        <p className="text-sm text-slate-500 mb-8">Diperbarui 24 Aug 2026</p>

        <div className="prose prose-slate max-w-none text-[15px] leading-relaxed">
          <p>Di KitaPay, yang dapat diakses dari kitapay.rinzgroup.web.id, salah satu prioritas utama kami adalah privasi pengunjung kami. Dokumen Kebijakan Privasi ini berisi jenis informasi yang dikumpulkan dan dicatat oleh KitaPay dan bagaimana kami menggunakannya.</p>
          <p>Jika Anda memiliki pertanyaan tambahan atau memerlukan informasi lebih lanjut tentang Kebijakan Privasi kami, jangan ragu untuk menghubungi kami.</p>
          <p>Kebijakan Privasi ini hanya berlaku untuk aktivitas online kami dan berlaku bagi pengunjung situs web kami sehubungan dengan informasi yang mereka bagikan dan/atau kumpulkan di KitaPay. Kebijakan ini tidak berlaku untuk informasi apa pun yang dikumpulkan secara offline atau melalui saluran selain situs web ini.</p>

          <h3 className="text-lg font-bold text-slate-900 mt-8 mb-4">Persetujuan</h3>
          <p>Dengan menggunakan situs web kami, Anda dengan ini menyetujui Kebijakan Privasi kami dan menyetujui syarat dan ketentuannya.</p>

          <h3 className="text-lg font-bold text-slate-900 mt-8 mb-4">Informasi yang kami kumpulkan</h3>
          <p>Informasi pribadi yang diminta untuk Anda berikan, dan alasan mengapa Anda diminta untuk memberikannya, akan dijelaskan kepada Anda pada saat kami meminta Anda untuk memberikan informasi pribadi Anda.</p>
          <p>Jika Anda menghubungi kami secara langsung, kami mungkin menerima informasi tambahan tentang Anda seperti nama Anda, alamat email, nomor telepon, isi pesan dan/atau lampiran yang mungkin Anda kirimkan kepada kami, dan informasi lain apa pun yang mungkin Anda pilih untuk diberikan.</p>
          <p>Saat Anda mendaftar untuk sebuah Akun, kami mungkin meminta informasi kontak Anda, termasuk nama, nama perusahaan, alamat, alamat email, dan nomor telepon.</p>

          <h3 className="text-lg font-bold text-slate-900 mt-8 mb-4">Bagaimana kami menggunakan informasi Anda</h3>
          <p>Kami menggunakan informasi yang kami kumpulkan dengan berbagai cara, termasuk untuk:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Menyediakan, mengoperasikan, dan memelihara situs web kami</li>
            <li>Meningkatkan, mempersonalisasi, dan memperluas situs web kami</li>
            <li>Memahami dan menganalisis bagaimana Anda menggunakan situs web kami</li>
            <li>Mengembangkan produk, layanan, fitur, dan fungsionalitas baru</li>
            <li>Berkomunikasi dengan Anda, baik secara langsung maupun melalui salah satu mitra kami, termasuk untuk layanan pelanggan, untuk memberi Anda pembaruan dan informasi lain yang berkaitan dengan situs web, dan untuk tujuan pemasaran dan promosi</li>
            <li>Mengirimkan email kepada Anda</li>
            <li>Menemukan dan mencegah penipuan</li>
          </ul>

          <h3 className="text-lg font-bold text-slate-900 mt-8 mb-4">File Log</h3>
          <p>KitaPay mengikuti prosedur standar menggunakan file log. File-file ini mencatat pengunjung saat mereka mengunjungi situs web. Semua perusahaan hosting melakukan ini dan ini adalah bagian dari analisis layanan hosting. Informasi yang dikumpulkan oleh file log meliputi alamat protokol internet (IP), jenis browser, Penyedia Layanan Internet (ISP), stempel tanggal dan waktu, halaman perujuk/keluar, dan mungkin jumlah klik. Informasi ini tidak terkait dengan informasi apa pun yang dapat diidentifikasi secara pribadi. Tujuan informasi ini adalah untuk menganalisis tren, mengelola situs, melacak pergerakan pengguna di situs web, dan mengumpulkan informasi demografis.</p>

          <h3 className="text-lg font-bold text-slate-900 mt-8 mb-4">Kebijakan Privasi Mitra Periklanan</h3>
          <p>Anda dapat berkonsultasi dengan daftar ini untuk menemukan Kebijakan Privasi dari masing-masing mitra periklanan KitaPay.</p>
          <p>Server iklan atau jaringan iklan pihak ketiga menggunakan teknologi seperti cookie, JavaScript, atau Web Beacon yang digunakan dalam iklan dan tautan masing-masing yang muncul di KitaPay, yang dikirim langsung ke browser pengguna. Mereka secara otomatis menerima alamat IP Anda ketika ini terjadi. Teknologi ini digunakan untuk mengukur keefektifan kampanye periklanan mereka dan/atau untuk mempersonalisasi konten periklanan yang Anda lihat di situs web yang Anda kunjungi.</p>
          <p>Perhatikan bahwa KitaPay tidak memiliki akses atau kontrol atas cookie ini yang digunakan oleh pengiklan pihak ketiga.</p>

          <h3 className="text-lg font-bold text-slate-900 mt-8 mb-4">Kebijakan Privasi Pihak Ketiga</h3>
          <p>Kebijakan Privasi KitaPay tidak berlaku untuk pengiklan atau situs web lain. Karena itu, kami menyarankan Anda untuk berkonsultasi dengan Kebijakan Privasi masing-masing dari server iklan pihak ketiga ini untuk informasi lebih rinci. Ini mungkin mencakup praktik dan instruksi mereka tentang cara menyisih dari opsi tertentu.</p>
          <p>Anda dapat memilih untuk menonaktifkan cookie melalui opsi browser individual Anda. Untuk mengetahui informasi lebih rinci tentang manajemen cookie dengan browser web tertentu, itu dapat ditemukan di situs web masing-masing browser.</p>

          <h3 className="text-lg font-bold text-slate-900 mt-8 mb-4">Hak Privasi CCPA (Jangan Jual Informasi Pribadi Saya)</h3>
          <p>Berdasarkan CCPA, antara lain hak-hak lain, konsumen California berhak untuk:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Meminta agar bisnis yang mengumpulkan data pribadi konsumen mengungkapkan kategori dan bagian spesifik dari data pribadi yang telah dikumpulkan bisnis tentang konsumen.</li>
            <li>Meminta agar bisnis menghapus data pribadi tentang konsumen yang telah dikumpulkan bisnis.</li>
            <li>Meminta agar bisnis yang menjual data pribadi konsumen, tidak menjual data pribadi konsumen.</li>
          </ul>
          <p>Jika Anda membuat permintaan, kami memiliki waktu satu bulan untuk menanggapi Anda. Jika Anda ingin menggunakan salah satu dari hak-hak ini, silakan hubungi kami.</p>

          <h3 className="text-lg font-bold text-slate-900 mt-8 mb-4">Hak Perlindungan Data GDPR</h3>
          <p>Kami ingin memastikan bahwa Anda menyadari sepenuhnya semua hak perlindungan data Anda. Setiap pengguna berhak atas hal-hal berikut:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Hak akses – Anda berhak meminta salinan data pribadi Anda. Kami mungkin mengenakan biaya kecil untuk layanan ini.</li>
            <li>Hak pembetulan – Anda berhak meminta agar kami memperbaiki informasi apa pun yang Anda yakini tidak akurat. Anda juga berhak meminta agar kami melengkapi informasi yang Anda yakini tidak lengkap.</li>
            <li>Hak penghapusan – Anda berhak meminta agar kami menghapus data pribadi Anda, di bawah kondisi tertentu.</li>
            <li>Hak untuk membatasi pemrosesan – Anda berhak meminta agar kami membatasi pemrosesan data pribadi Anda, di bawah kondisi tertentu.</li>
            <li>Hak untuk menolak pemrosesan – Anda berhak menolak pemrosesan data pribadi Anda oleh kami, di bawah kondisi tertentu.</li>
            <li>Hak atas portabilitas data – Anda berhak meminta agar kami mentransfer data yang telah kami kumpulkan ke organisasi lain, atau langsung kepada Anda, di bawah kondisi tertentu.</li>
          </ul>
          <p>Jika Anda membuat permintaan, kami memiliki waktu satu bulan untuk menanggapi Anda. Jika Anda ingin menggunakan salah satu dari hak-hak ini, silakan hubungi kami.</p>

          <h3 className="text-lg font-bold text-slate-900 mt-8 mb-4">Informasi Anak-anak</h3>
          <p>Bagian lain dari prioritas kami adalah menambahkan perlindungan untuk anak-anak saat menggunakan internet. Kami mendorong orang tua dan wali untuk mengamati, berpartisipasi dalam, dan/atau memantau dan memandu aktivitas online mereka.</p>
          <p>KitaPay tidak secara sadar mengumpulkan Informasi Identifikasi Pribadi apa pun dari anak-anak di bawah umur 13 tahun. Jika Anda berpikir bahwa anak Anda memberikan informasi semacam ini di situs web kami, kami sangat menganjurkan Anda untuk segera menghubungi kami dan kami akan melakukan upaya terbaik kami untuk segera menghapus informasi tersebut dari catatan kami.</p>

          <h3 className="text-lg font-bold text-slate-900 mt-8 mb-4">Perubahan pada Kebijakan Privasi Ini</h3>
          <p>Kami dapat memperbarui Kebijakan Privasi kami dari waktu ke waktu. Karena itu, kami menyarankan Anda untuk meninjau halaman ini secara berkala untuk setiap perubahan. Kami akan memberi tahu Anda tentang setiap perubahan dengan memposting Kebijakan Privasi baru di halaman ini. Perubahan ini segera berlaku, setelah diposting di halaman ini.</p>

          <h3 className="text-lg font-bold text-slate-900 mt-8 mb-4">Hubungi Kami</h3>
          <p>Jika Anda memiliki pertanyaan atau saran tentang Kebijakan Privasi kami, jangan ragu untuk menghubungi kami.</p>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-400">
        KitaPay © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
