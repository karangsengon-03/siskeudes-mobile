// Bidang, Sub-Bidang, dan Kegiatan Desa — Permendagri 20/2018
// 5 bidang, 27 sub-bidang, 175+ kegiatan

export interface Kegiatan {
  kode: string;       // misal "1.1.01"
  uraian: string;
}

export interface SubBidang {
  kode: string;       // misal "1.1"
  uraian: string;
  kegiatan: Kegiatan[];
}

export interface Bidang {
  kode: string;       // misal "1"
  uraian: string;
  subBidang: SubBidang[];
}

export const BIDANG_KEGIATAN: Bidang[] = [
  {
    kode: "1",
    uraian: "Penyelenggaraan Pemerintahan Desa",
    subBidang: [
      {
        kode: "1.1",
        uraian: "Penyelenggaraan Belanja Penghasilan Tetap, Tunjangan dan Operasional Pemerintahan Desa",
        kegiatan: [
          { kode: "1.1.01", uraian: "Penyediaan Penghasilan Tetap dan Tunjangan Kepala Desa" },
          { kode: "1.1.02", uraian: "Penyediaan Penghasilan Tetap dan Tunjangan Perangkat Desa" },
          { kode: "1.1.03", uraian: "Penyediaan Jaminan Sosial bagi Kepala Desa dan Perangkat Desa" },
          { kode: "1.1.04", uraian: "Penyediaan Operasional Pemerintah Desa" },
          { kode: "1.1.05", uraian: "Penyediaan Tunjangan BPD" },
          { kode: "1.1.06", uraian: "Penyediaan Operasional BPD" },
          { kode: "1.1.07", uraian: "Penyediaan Insentif/Operasional RT/RW" },
          { kode: "1.1.08", uraian: "Penyediaan Operasional Pemerintah Desa (dari Dana Desa)" },
          { kode: "1.1.90", uraian: "Lain-lain Sub-Bidang ini" },
        ],
      },
      {
        kode: "1.2",
        uraian: "Sarana dan Prasarana Pemerintahan Desa",
        kegiatan: [
          { kode: "1.2.01", uraian: "Penyediaan Sarana (Aset Tetap) Perkantoran/Pemerintahan" },
          { kode: "1.2.02", uraian: "Pemeliharaan Gedung/Prasarana Kantor Desa" },
          { kode: "1.2.03", uraian: "Pembangunan/Rehabilitasi/Peningkatan Gedung/Prasarana Kantor Desa" },
          { kode: "1.2.90", uraian: "Lain-lain Sub-Bidang ini" },
        ],
      },
      {
        kode: "1.3",
        uraian: "Administrasi Kependudukan, Pencatatan Sipil, Statistik dan Kearsipan",
        kegiatan: [
          { kode: "1.3.01", uraian: "Pelayanan Administrasi Umum dan Kependudukan (Surat Pengantar/Pelayanan KTP, Kartu Keluarga, dll)" },
          { kode: "1.3.02", uraian: "Penyusunan, Pendataan, dan Pemutakhiran Profil Desa" },
          { kode: "1.3.03", uraian: "Pengelolaan Administrasi dan Kearsipan Pemerintahan Desa" },
          { kode: "1.3.04", uraian: "Penyuluhan dan Penyadaran Masyarakat tentang Kependudukan dan Pencatatan Sipil" },
          { kode: "1.3.05", uraian: "Pemetaan dan Analisis Kemiskinan Desa secara Partisipatif" },
          { kode: "1.3.90", uraian: "Lain-lain Sub-Bidang ini" },
        ],
      },
      {
        kode: "1.4",
        uraian: "Tata Praja Pemerintahan, Perencanaan, Keuangan dan Pelaporan",
        kegiatan: [
          { kode: "1.4.01", uraian: "Penyelenggaraan Musyawarah Perencanaan Desa/Pembahasan APBDes (Musdes, Musrenbangdes/Pra-Musrenbangdes, dll)" },
          { kode: "1.4.02", uraian: "Penyelenggaraan Musyawarah Desa Lainnya (musdus, rembug warga, dll)" },
          { kode: "1.4.03", uraian: "Penyusunan Dokumen Perencanaan Desa (RPJMDes/RKPDes, dll)" },
          { kode: "1.4.04", uraian: "Penyusunan Dokumen Keuangan Desa (APBDes/APBDes Perubahan/LPJ APBDes, dll)" },
          { kode: "1.4.05", uraian: "Pengelolaan/Administrasi/Inventarisasi/Penilaian Aset Desa" },
          { kode: "1.4.06", uraian: "Penyusunan Kebijakan Desa (Perdes/Perkades, dll diluar dokumen Perencanaan/Keuangan)" },
          { kode: "1.4.07", uraian: "Pengembangan Sistem Informasi Desa" },
          { kode: "1.4.08", uraian: "Koordinasi/Kerjasama Penyelenggaraan Pemerintahan dan Pembangunan Desa (dengan Pemerintah Pusat, Pemda, dll)" },
          { kode: "1.4.09", uraian: "Dukungan dan Sosialisasi Pelaksanaan Pilkades, Pemilihan Kepala Kewilayahan dan BPD" },
          { kode: "1.4.10", uraian: "Penyelenggaraan Lomba antar Kewilayahan dan Pengiriman Kontingen dalam Lomba Desa" },
          { kode: "1.4.90", uraian: "Lain-lain Sub-Bidang ini" },
        ],
      },
      {
        kode: "1.5",
        uraian: "Pertanahan",
        kegiatan: [
          { kode: "1.5.01", uraian: "Sertifikasi Tanah Kas Desa" },
          { kode: "1.5.02", uraian: "Administrasi Pajak Bumi dan Bangunan (PBB)" },
          { kode: "1.5.03", uraian: "Penentuan/Penegasan/Pembangunan Batas/Peta Wilayah Desa" },
          { kode: "1.5.04", uraian: "Pendataan/Inventarisasi Tanah Milik Desa/Ulayat, dll" },
          { kode: "1.5.05", uraian: "Fasilitasi Sertifikasi Tanah untuk Masyarakat Miskin" },
          { kode: "1.5.06", uraian: "Mediasi Konflik Pertanahan" },
          { kode: "1.5.07", uraian: "Penyuluhan tentang Pertanahan" },
          { kode: "1.5.90", uraian: "Lain-lain Sub-Bidang ini" },
        ],
      },
    ],
  },

  {
    kode: "2",
    uraian: "Pelaksanaan Pembangunan Desa",
    subBidang: [
      {
        kode: "2.1",
        uraian: "Pendidikan",
        kegiatan: [
          { kode: "2.1.01", uraian: "Penyelenggaraan PAUD/TK/TPA/TKA/TPQ/Madrasah Non-Formal Milik Desa (Biaya Operasional, Honor Pengajar)" },
          { kode: "2.1.02", uraian: "Dukungan Penyelenggaraan PAUD (APE, Sarana PAUD, dll)" },
          { kode: "2.1.03", uraian: "Penyuluhan dan Pelatihan Pendidikan bagi Masyarakat" },
          { kode: "2.1.04", uraian: "Pemeliharaan Sarana dan Prasarana Perpustakaan/Taman Bacaan Desa/Sanggar Belajar Milik Desa" },
          { kode: "2.1.05", uraian: "Pemeliharaan Sarana dan Prasarana PAUD" },
          { kode: "2.1.06", uraian: "Pembangunan/Rehabilitasi/Peningkatan Sarana Prasarana Perpustakaan/Taman Bacaan Desa/Sanggar Belajar Milik Desa" },
          { kode: "2.1.07", uraian: "Pembangunan/Rehabilitasi/Peningkatan Sarana Prasarana PAUD" },
          { kode: "2.1.08", uraian: "Pengembangan dan Pembinaan Sanggar Seni dan Belajar" },
          { kode: "2.1.09", uraian: "Dukungan Pendidikan bagi Siswa Miskin/Berprestasi" },
          { kode: "2.1.90", uraian: "Lain-lain Sub-Bidang ini" },
        ],
      },
      {
        kode: "2.2",
        uraian: "Kesehatan",
        kegiatan: [
          { kode: "2.2.01", uraian: "Penyelenggaraan Pos Kesehatan Desa/Polindes Milik Desa (Obat-obatan, Operasional, Honor)" },
          { kode: "2.2.02", uraian: "Penyelenggaraan Posyandu (PMT, Honor, dll)" },
          { kode: "2.2.03", uraian: "Penyuluhan dan Pelatihan Bidang Kesehatan (Bidang Gizi, Sanitasi, dll)" },
          { kode: "2.2.04", uraian: "Penyelenggaraan Desa Siaga Kesehatan" },
          { kode: "2.2.05", uraian: "Pembinaan Palang Merah Remaja (PMR) tingkat Desa" },
          { kode: "2.2.06", uraian: "Pengasuhan Bersama atau Bina Keluarga Balita (BKB)" },
          { kode: "2.2.07", uraian: "Pembinaan dan Pengawasan Upaya Kesehatan Tradisional" },
          { kode: "2.2.08", uraian: "Pemeliharaan Sarana/Prasarana Posyandu/Polindes/PKD" },
          { kode: "2.2.09", uraian: "Pembangunan/Rehabilitasi/Peningkatan/Pengadaan Sarana/Prasarana Posyandu/Polindes/PKD" },
          { kode: "2.2.90", uraian: "Lain-lain Sub-Bidang ini" },
        ],
      },
      {
        kode: "2.3",
        uraian: "Pekerjaan Umum dan Penataan Ruang",
        kegiatan: [
          { kode: "2.3.01", uraian: "Pemeliharaan Jalan Desa" },
          { kode: "2.3.02", uraian: "Pemeliharaan Jalan Lingkungan Permukiman/Gang" },
          { kode: "2.3.03", uraian: "Pemeliharaan Jalan Usaha Tani" },
          { kode: "2.3.04", uraian: "Pemeliharaan Jembatan Milik Desa" },
          { kode: "2.3.05", uraian: "Pemeliharaan Prasarana Jalan Desa (Gorong-gorong, Selokan, Box/Slab Culvert, dll)" },
          { kode: "2.3.06", uraian: "Pemeliharaan Gedung/Prasarana Balai Desa/Balai Kemasyarakatan" },
          { kode: "2.3.07", uraian: "Pemeliharaan Pemakaman Milik Desa/Situs Bersejarah Milik Desa/Petilasan" },
          { kode: "2.3.08", uraian: "Pemeliharaan Embung Milik Desa" },
          { kode: "2.3.09", uraian: "Pemeliharaan Monumen/Gapura/Batas Desa" },
          { kode: "2.3.10", uraian: "Pembangunan/Rehabilitasi/Peningkatan/Pengerasan Jalan Desa" },
          { kode: "2.3.11", uraian: "Pembangunan/Rehabilitasi/Peningkatan/Pengerasan Jalan Lingkungan Permukiman/Gang" },
          { kode: "2.3.12", uraian: "Pembangunan/Rehabilitasi/Peningkatan/Pengerasan Jalan Usaha Tani" },
          { kode: "2.3.13", uraian: "Pembangunan/Rehabilitasi/Peningkatan Jembatan Milik Desa" },
          { kode: "2.3.14", uraian: "Pembangunan/Rehabilitasi/Peningkatan Prasarana Jalan Desa (Gorong-gorong, Selokan, Box/Slab Culvert, dll)" },
          { kode: "2.3.15", uraian: "Pembangunan/Rehabilitasi/Peningkatan Balai Desa/Balai Kemasyarakatan" },
          { kode: "2.3.16", uraian: "Pembangunan/Rehabilitasi/Peningkatan Pemakaman Milik Desa/Situs Bersejarah Milik Desa/Petilasan" },
          { kode: "2.3.17", uraian: "Pembuatan/Pemutakhiran Peta Wilayah dan Sosial Desa" },
          { kode: "2.3.18", uraian: "Pengembangan dan Pembangunan Sistem Informasi Desa" },
          { kode: "2.3.19", uraian: "Pembangunan Embung dan Penampung Air Kecil Lainnya" },
          { kode: "2.3.20", uraian: "Pembangunan/Rehabilitasi/Peningkatan Monumen/Gapura/Batas Desa" },
          { kode: "2.3.90", uraian: "Lain-lain Sub-Bidang ini" },
        ],
      },
      {
        kode: "2.4",
        uraian: "Kawasan Permukiman",
        kegiatan: [
          { kode: "2.4.01", uraian: "Dukungan Pelaksanaan Program Pembangunan/Rehab Rumah Tidak Layak Huni (RTLH) GAKIN" },
          { kode: "2.4.02", uraian: "Pemeliharaan Sumur Resapan Milik Desa" },
          { kode: "2.4.03", uraian: "Pemeliharaan Sumber Air Bersih Milik Desa (Mata Air/Tandon/Sumur Bor, dll)" },
          { kode: "2.4.04", uraian: "Pemeliharaan Sambungan Air Bersih ke Rumah Tangga (pipanisasi, dll)" },
          { kode: "2.4.05", uraian: "Pemeliharaan Sanitasi Permukiman (Gorong-gorong, Selokan, Parit, dll)" },
          { kode: "2.4.06", uraian: "Pemeliharaan Fasilitas Jamban Umum/MCK umum, dll" },
          { kode: "2.4.07", uraian: "Pemeliharaan Fasilitas Pengelolaan Sampah Desa/Permukiman (Penampungan, Bank Sampah, dll)" },
          { kode: "2.4.08", uraian: "Pemeliharaan Sistem Pembuangan Air Limbah (Drainase, Air limbah Rumah Tangga)" },
          { kode: "2.4.09", uraian: "Pemeliharaan Taman/Taman Bermain Anak Milik Desa" },
          { kode: "2.4.10", uraian: "Pembangunan/Rehabilitasi/Peningkatan Sumur Resapan" },
          { kode: "2.4.11", uraian: "Pembangunan/Rehabilitasi/Peningkatan Sumber Air Bersih Milik Desa (Mata Air/Tandon/Sumur Bor, dll)" },
          { kode: "2.4.12", uraian: "Pembangunan/Rehabilitasi/Peningkatan Sambungan Air Bersih ke Rumah Tangga (pipanisasi, dll)" },
          { kode: "2.4.13", uraian: "Pembangunan/Rehabilitasi/Peningkatan Sanitasi Permukiman (Gorong-gorong, Selokan, Parit, dll)" },
          { kode: "2.4.14", uraian: "Pembangunan/Rehabilitasi/Peningkatan Fasilitas Jamban Umum/MCK umum, dll" },
          { kode: "2.4.15", uraian: "Pembangunan/Rehabilitasi/Peningkatan Fasilitas Pengelolaan Sampah Desa/Permukiman" },
          { kode: "2.4.16", uraian: "Pembangunan/Rehabilitasi/Peningkatan Sistem Pembuangan Air Limbah (Drainase, Air Limbah Rumah Tangga)" },
          { kode: "2.4.17", uraian: "Pembangunan/Rehabilitasi/Peningkatan Taman/Taman Bermain Anak Milik Desa" },
          { kode: "2.4.90", uraian: "Lain-lain Sub-Bidang ini" },
        ],
      },
      {
        kode: "2.5",
        uraian: "Kehutanan dan Lingkungan Hidup",
        kegiatan: [
          { kode: "2.5.01", uraian: "Pengelolaan Hutan Milik Desa" },
          { kode: "2.5.02", uraian: "Pengelolaan Lingkungan Hidup Desa" },
          { kode: "2.5.03", uraian: "Pelatihan/Sosialisasi/Penyuluhan/Penyadaran tentang Lingkungan Hidup dan Kehutanan" },
          { kode: "2.5.90", uraian: "Lain-lain Sub-Bidang ini" },
        ],
      },
      {
        kode: "2.6",
        uraian: "Perhubungan, Komunikasi dan Informatika",
        kegiatan: [
          { kode: "2.6.01", uraian: "Pembuatan Rambu-Rambu di Jalan Desa" },
          { kode: "2.6.02", uraian: "Penyelenggaraan Informasi Publik Desa (Poster, Baliho Pembangunan, dll)" },
          { kode: "2.6.03", uraian: "Pengelolaan dan Pengembangan Sistem Informasi Desa" },
          { kode: "2.6.90", uraian: "Lain-lain Sub-Bidang ini" },
        ],
      },
      {
        kode: "2.7",
        uraian: "Energi dan Sumber Daya Mineral",
        kegiatan: [
          { kode: "2.7.01", uraian: "Pemeliharaan Sarana dan Prasarana Energi Alternatif tingkat Desa" },
          { kode: "2.7.02", uraian: "Pembangunan/Rehabilitasi/Peningkatan Sarana dan Prasarana Energi Alternatif tingkat Desa" },
          { kode: "2.7.03", uraian: "Pembangunan/Pemasangan Penerangan Lingkungan Desa" },
          { kode: "2.7.04", uraian: "Pemeliharaan Penerangan Lingkungan Desa" },
          { kode: "2.7.90", uraian: "Lain-lain Sub-Bidang ini" },
        ],
      },
      {
        kode: "2.8",
        uraian: "Pariwisata",
        kegiatan: [
          { kode: "2.8.01", uraian: "Pemeliharaan Sarana dan Prasarana Pariwisata Milik Desa" },
          { kode: "2.8.02", uraian: "Pembangunan/Rehabilitasi/Peningkatan Sarana dan Prasarana Pariwisata Milik Desa" },
          { kode: "2.8.03", uraian: "Pengembangan Pariwisata tingkat Desa" },
          { kode: "2.8.90", uraian: "Lain-lain Sub-Bidang ini" },
        ],
      },
    ],
  },

  {
    kode: "3",
    uraian: "Pembinaan Kemasyarakatan Desa",
    subBidang: [
      {
        kode: "3.1",
        uraian: "Ketentraman, Ketertiban Umum dan Pelindungan Masyarakat",
        kegiatan: [
          { kode: "3.1.01", uraian: "Pengadaan/Penyelenggaraan Pos Keamanan Desa" },
          { kode: "3.1.02", uraian: "Penguatan dan Peningkatan Kapasitas Tenaga Keamanan/Ketertiban oleh Pemerintah Desa (Satlinmas desa)" },
          { kode: "3.1.03", uraian: "Koordinasi Pembinaan Ketentraman, Ketertiban, dan Pelindungan Masyarakat Skala Lokal Desa" },
          { kode: "3.1.04", uraian: "Pelatihan Kesiapsiagaan/Tanggap Bencana Skala Lokal Desa" },
          { kode: "3.1.05", uraian: "Penyediaan Pos Kesiapsiagaan Bencana Skala Lokal Desa" },
          { kode: "3.1.06", uraian: "Bantuan Hukum untuk Aparatur Desa dan Masyarakat Miskin" },
          { kode: "3.1.07", uraian: "Pelatihan/Penyuluhan/Sosialisasi kepada Masyarakat di Bidang Hukum dan Pelindungan Masyarakat" },
          { kode: "3.1.90", uraian: "Lain-lain Sub-Bidang ini" },
        ],
      },
      {
        kode: "3.2",
        uraian: "Kebudayaan dan Keagamaan",
        kegiatan: [
          { kode: "3.2.01", uraian: "Penyelenggaraan Festival Kesenian, Adat/Kebudayaan, dan Keagamaan tingkat Desa" },
          { kode: "3.2.02", uraian: "Pemeliharaan Sarana dan Prasarana Kebudayaan/Rumah Adat/Keagamaan Milik Desa" },
          { kode: "3.2.03", uraian: "Pembangunan/Rehabilitasi/Peningkatan Sarana dan Prasarana Kebudayaan/Rumah Adat/Keagamaan Milik Desa" },
          { kode: "3.2.90", uraian: "Lain-lain Sub-Bidang ini" },
        ],
      },
      {
        kode: "3.3",
        uraian: "Kepemudaan dan Olahraga",
        kegiatan: [
          { kode: "3.3.01", uraian: "Pengiriman Kontingen Kepemudaan dan Olahraga sebagai Wakil Desa di tingkat Kecamatan dan Kabupaten/Kota" },
          { kode: "3.3.02", uraian: "Penyelenggaraan Pelatihan Kepemudaan (Kepanduan, dll) tingkat Desa" },
          { kode: "3.3.03", uraian: "Penyelenggaraan Festival/Lomba Kepemudaan dan Olahraga tingkat Desa" },
          { kode: "3.3.04", uraian: "Pemeliharaan Sarana dan Prasarana Kepemudaan dan Olahraga Milik Desa" },
          { kode: "3.3.05", uraian: "Pembangunan/Rehabilitasi/Peningkatan Sarana dan Prasarana Kepemudaan dan Olahraga Milik Desa" },
          { kode: "3.3.06", uraian: "Pembinaan Karangtaruna/Klub Kepemudaan/Klub Olahraga" },
          { kode: "3.3.90", uraian: "Lain-lain Sub-Bidang ini" },
        ],
      },
      {
        kode: "3.4",
        uraian: "Kelembagaan Masyarakat",
        kegiatan: [
          { kode: "3.4.01", uraian: "Pembinaan Lembaga Adat" },
          { kode: "3.4.02", uraian: "Pembinaan LKMD/LPM/LPMD" },
          { kode: "3.4.03", uraian: "Pembinaan PKK" },
          { kode: "3.4.04", uraian: "Pelatihan Pembinaan Lembaga Kemasyarakatan" },
          { kode: "3.4.90", uraian: "Lain-lain Sub-Bidang ini" },
        ],
      },
    ],
  },

  {
    kode: "4",
    uraian: "Pemberdayaan Masyarakat Desa",
    subBidang: [
      {
        kode: "4.1",
        uraian: "Kelautan dan Perikanan",
        kegiatan: [
          { kode: "4.1.01", uraian: "Pemeliharaan Karamba/Kolam Perikanan Darat Milik Desa" },
          { kode: "4.1.02", uraian: "Pemeliharaan Pelabuhan Perikanan Sungai/Kecil Milik Desa" },
          { kode: "4.1.03", uraian: "Pembangunan/Rehabilitasi/Peningkatan Karamba/Kolam Perikanan Darat Milik Desa" },
          { kode: "4.1.04", uraian: "Pembangunan/Rehabilitasi/Peningkatan Pelabuhan Perikanan Sungai/Kecil Milik Desa" },
          { kode: "4.1.05", uraian: "Bantuan Perikanan (Bibit/Pakan/dst)" },
          { kode: "4.1.06", uraian: "Pelatihan/Bimtek/Pengenalan Teknologi Tepat Guna untuk Perikanan Darat/Nelayan" },
          { kode: "4.1.90", uraian: "Lain-lain Sub-Bidang ini" },
        ],
      },
      {
        kode: "4.2",
        uraian: "Pertanian dan Peternakan",
        kegiatan: [
          { kode: "4.2.01", uraian: "Peningkatan Produksi Tanaman Pangan (Alat Produksi dan Pengolahan Pertanian, dll)" },
          { kode: "4.2.02", uraian: "Peningkatan Produksi Peternakan (Alat Produksi dan Pengolahan Peternakan, Kandang, dll)" },
          { kode: "4.2.03", uraian: "Penguatan Ketahanan Pangan tingkat Desa (Lumbung Desa, dll)" },
          { kode: "4.2.04", uraian: "Pemeliharaan Saluran Irigasi Tersier/Sederhana Milik Desa" },
          { kode: "4.2.05", uraian: "Pelatihan/Bimtek/Pengenalan Teknologi Tepat Guna untuk Pertanian/Peternakan" },
          { kode: "4.2.90", uraian: "Lain-lain Sub-Bidang ini" },
        ],
      },
      {
        kode: "4.3",
        uraian: "Peningkatan Kapasitas Aparatur Desa",
        kegiatan: [
          { kode: "4.3.01", uraian: "Peningkatan Kapasitas Kepala Desa" },
          { kode: "4.3.02", uraian: "Peningkatan Kapasitas Perangkat Desa" },
          { kode: "4.3.03", uraian: "Peningkatan Kapasitas BPD" },
          { kode: "4.3.04", uraian: "Peningkatan Kapasitas LPMD/LKMD/LPM" },
          { kode: "4.3.90", uraian: "Lain-lain Sub-Bidang ini" },
        ],
      },
      {
        kode: "4.4",
        uraian: "Pemberdayaan Perempuan, Perlindungan Anak dan Keluarga",
        kegiatan: [
          { kode: "4.4.01", uraian: "Pelatihan/Penyuluhan Pemberdayaan Perempuan" },
          { kode: "4.4.02", uraian: "Pelatihan dan Penguatan Penyandang Difabel (Penyandang Disabilitas)" },
          { kode: "4.4.03", uraian: "Pelatihan/Penyuluhan Perlindungan Anak" },
          { kode: "4.4.04", uraian: "Pelatihan dan Penguatan Kelompok Usaha Ekonomi Produktif Perempuan" },
          { kode: "4.4.90", uraian: "Lain-lain Sub-Bidang ini" },
        ],
      },
      {
        kode: "4.5",
        uraian: "Koperasi, Usaha Mikro Kecil dan Menengah (UMKM)",
        kegiatan: [
          { kode: "4.5.01", uraian: "Pelatihan Manajemen Pengelolaan Koperasi/KUD/UMKM" },
          { kode: "4.5.02", uraian: "Pengembangan Sarana Prasarana Usaha Mikro, Kecil dan Menengah serta Koperasi" },
          { kode: "4.5.03", uraian: "Pengadaan Teknologi Tepat Guna untuk Pengembangan Ekonomi Pedesaan Non-Pertanian" },
          { kode: "4.5.90", uraian: "Lain-lain Sub-Bidang ini" },
        ],
      },
      {
        kode: "4.6",
        uraian: "Dukungan Penanaman Modal",
        kegiatan: [
          { kode: "4.6.01", uraian: "Pembentukan BUMDes (Persiapan dan Pembentukan Awal BUMDes)" },
          { kode: "4.6.02", uraian: "Pelatihan Pengelolaan BUMDes (Pelatihan yang Dilaksanakan oleh Desa)" },
          { kode: "4.6.90", uraian: "Lain-lain Sub-Bidang ini" },
        ],
      },
      {
        kode: "4.7",
        uraian: "Perdagangan dan Perindustrian",
        kegiatan: [
          { kode: "4.7.01", uraian: "Pemeliharaan Pasar Desa/Kios Milik Desa" },
          { kode: "4.7.02", uraian: "Pembangunan/Rehabilitasi/Peningkatan Pasar Desa/Kios Milik Desa" },
          { kode: "4.7.03", uraian: "Pengembangan Industri kecil Level Desa" },
          { kode: "4.7.04", uraian: "Pembentukan/Fasilitasi/Pelatihan/Pendampingan Kelompok Usaha Ekonomi Produktif" },
          { kode: "4.7.90", uraian: "Lain-lain Sub-Bidang ini" },
        ],
      },
    ],
  },

  {
    kode: "5",
    uraian: "Penanggulangan Bencana, Keadaan Darurat dan Mendesak Desa",
    subBidang: [
      {
        kode: "5.1",
        uraian: "Penanggulangan Bencana",
        kegiatan: [
          { kode: "5.1.01", uraian: "Penanggulangan Bencana" },
        ],
      },
      {
        kode: "5.2",
        uraian: "Keadaan Darurat",
        kegiatan: [
          { kode: "5.2.01", uraian: "Keadaan Darurat" },
        ],
      },
      {
        kode: "5.3",
        uraian: "Keadaan Mendesak",
        kegiatan: [
          { kode: "5.3.01", uraian: "Keadaan Mendesak" },
        ],
      },
    ],
  },
];

// Helper: flatten semua kegiatan
export const getAllKegiatan = () =>
  BIDANG_KEGIATAN.flatMap((b) =>
    b.subBidang.flatMap((sb) =>
      sb.kegiatan.map((k) => ({
        ...k,
        bidangKode: b.kode,
        bidangUraian: b.uraian,
        subBidangKode: sb.kode,
        subBidangUraian: sb.uraian,
        label: `${sb.kode}.${k.kode.split(".").pop()} - ${k.uraian}`,
      }))
    )
  );

// Helper: cari kegiatan berdasar kode sub-bidang
export const getKegiatanBySubBidang = (subBidangKode: string) => {
  for (const b of BIDANG_KEGIATAN) {
    const sb = b.subBidang.find((s) => s.kode === subBidangKode);
    if (sb) return sb.kegiatan;
  }
  return [];
};

// Helper: cari sub-bidang berdasar kode bidang
export const getSubBidangByBidang = (bidangKode: string) =>
  BIDANG_KEGIATAN.find((b) => b.kode === bidangKode)?.subBidang ?? [];
