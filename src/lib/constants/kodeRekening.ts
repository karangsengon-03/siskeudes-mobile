// Kode Rekening Permendagri 20/2018 — 4 Level
// Kelompok → Jenis → Obyek → Rincian Obyek
// Level 4 (Rincian Obyek) yang digunakan saat input RAB/DPA

export interface KodeRekening {
  kode: string;
  uraian: string;
  level: 1 | 2 | 3 | 4;
  parentKode?: string;
}

export const KODE_REKENING: KodeRekening[] = [
  // ============================================================
  // 4. PENDAPATAN
  // ============================================================
  { kode: "4", uraian: "PENDAPATAN", level: 1 },

  // 4.1 Pendapatan Asli Desa
  { kode: "4.1", uraian: "Pendapatan Asli Desa", level: 2, parentKode: "4" },
  { kode: "4.1.1", uraian: "Hasil Usaha Desa", level: 3, parentKode: "4.1" },
  { kode: "4.1.1.01", uraian: "Hasil BUMDes", level: 4, parentKode: "4.1.1" },
  { kode: "4.1.1.02", uraian: "Tanah Kas Desa", level: 4, parentKode: "4.1.1" },
  { kode: "4.1.2", uraian: "Hasil Aset Desa", level: 3, parentKode: "4.1" },
  { kode: "4.1.2.01", uraian: "Tambatan Perahu", level: 4, parentKode: "4.1.2" },
  { kode: "4.1.2.02", uraian: "Pasar Desa", level: 4, parentKode: "4.1.2" },
  { kode: "4.1.2.03", uraian: "Tempat Pemandian Umum", level: 4, parentKode: "4.1.2" },
  { kode: "4.1.2.04", uraian: "Jaringan Irigasi Desa", level: 4, parentKode: "4.1.2" },
  { kode: "4.1.3", uraian: "Swadaya, Partisipasi dan Gotong Royong", level: 3, parentKode: "4.1" },
  { kode: "4.1.3.01", uraian: "Swadaya Masyarakat", level: 4, parentKode: "4.1.3" },
  { kode: "4.1.4", uraian: "Lain-lain Pendapatan Asli Desa yang Sah", level: 3, parentKode: "4.1" },
  { kode: "4.1.4.01", uraian: "Pungutan Desa", level: 4, parentKode: "4.1.4" },
  { kode: "4.1.4.02", uraian: "Hasil Penjualan Desa yang Tidak Dipisahkan", level: 4, parentKode: "4.1.4" },
  { kode: "4.1.4.90", uraian: "Lain-lain PAD yang Sah Lainnya", level: 4, parentKode: "4.1.4" },

  // 4.2 Transfer
  { kode: "4.2", uraian: "Transfer", level: 2, parentKode: "4" },
  { kode: "4.2.1", uraian: "Dana Desa", level: 3, parentKode: "4.2" },
  { kode: "4.2.1.01", uraian: "Dana Desa", level: 4, parentKode: "4.2.1" },
  { kode: "4.2.2", uraian: "Bagian dari Hasil Pajak dan Retribusi Daerah Kabupaten/Kota", level: 3, parentKode: "4.2" },
  { kode: "4.2.2.01", uraian: "Bagian dari Hasil Pajak Daerah Kabupaten/Kota", level: 4, parentKode: "4.2.2" },
  { kode: "4.2.2.02", uraian: "Bagian dari Hasil Retribusi Daerah Kabupaten/Kota", level: 4, parentKode: "4.2.2" },
  { kode: "4.2.3", uraian: "Alokasi Dana Desa", level: 3, parentKode: "4.2" },
  { kode: "4.2.3.01", uraian: "Alokasi Dana Desa", level: 4, parentKode: "4.2.3" },
  { kode: "4.2.4", uraian: "Bantuan Keuangan dari APBD Provinsi", level: 3, parentKode: "4.2" },
  { kode: "4.2.4.01", uraian: "Bantuan Keuangan dari APBD Provinsi", level: 4, parentKode: "4.2.4" },
  { kode: "4.2.5", uraian: "Bantuan Keuangan APBD Kabupaten/Kota", level: 3, parentKode: "4.2" },
  { kode: "4.2.5.01", uraian: "Bantuan Keuangan dari APBD Kabupaten/Kota", level: 4, parentKode: "4.2.5" },

  // 4.3 Pendapatan Lain-lain
  { kode: "4.3", uraian: "Pendapatan Lain-lain", level: 2, parentKode: "4" },
  { kode: "4.3.1", uraian: "Penerimaan dari Hasil Kerjasama Desa", level: 3, parentKode: "4.3" },
  { kode: "4.3.1.01", uraian: "Penerimaan dari Hasil Kerjasama antar Desa", level: 4, parentKode: "4.3.1" },
  { kode: "4.3.1.02", uraian: "Penerimaan dari Hasil Kerjasama dengan Pihak Ketiga", level: 4, parentKode: "4.3.1" },
  { kode: "4.3.2", uraian: "Penerimaan dari Bantuan Perusahaan yang berlokasi di Desa", level: 3, parentKode: "4.3" },
  { kode: "4.3.2.01", uraian: "Penerimaan dari Bantuan Perusahaan", level: 4, parentKode: "4.3.2" },
  { kode: "4.3.3", uraian: "Hibah dan Sumbangan dari Pihak Ketiga yang Tidak Mengikat", level: 3, parentKode: "4.3" },
  { kode: "4.3.3.01", uraian: "Hibah dan Sumbangan dari Pihak Ketiga", level: 4, parentKode: "4.3.3" },
  { kode: "4.3.4", uraian: "Koreksi Kesalahan Belanja Tahun Anggaran Sebelumnya", level: 3, parentKode: "4.3" },
  { kode: "4.3.4.01", uraian: "Koreksi Kesalahan Belanja Tahun Anggaran Sebelumnya", level: 4, parentKode: "4.3.4" },
  { kode: "4.3.5", uraian: "Bunga Bank", level: 3, parentKode: "4.3" },
  { kode: "4.3.5.01", uraian: "Bunga Bank", level: 4, parentKode: "4.3.5" },
  { kode: "4.3.9", uraian: "Lain-lain Pendapatan Desa yang Sah", level: 3, parentKode: "4.3" },
  { kode: "4.3.9.01", uraian: "Lain-lain Pendapatan Desa yang Sah", level: 4, parentKode: "4.3.9" },

  // ============================================================
  // 5. BELANJA
  // ============================================================
  { kode: "5", uraian: "BELANJA", level: 1 },

  // 5.1 Bidang Penyelenggaraan Pemerintahan Desa
  { kode: "5.1", uraian: "Bidang Penyelenggaraan Pemerintahan Desa", level: 2, parentKode: "5" },

  // 5.1.1 Sub-Bidang Penyelenggaraan Belanja Penghasilan Tetap, Tunjangan dan Operasional Pemerintahan Desa
  { kode: "5.1.1", uraian: "Sub-Bidang Penyelenggaraan Belanja Penghasilan Tetap, Tunjangan dan Operasional Pemerintahan Desa", level: 3, parentKode: "5.1" },
  { kode: "5.1.1.01", uraian: "Penghasilan Tetap Kepala Desa dan Perangkat Desa", level: 4, parentKode: "5.1.1" },
  { kode: "5.1.1.02", uraian: "Tunjangan Kepala Desa dan Perangkat Desa", level: 4, parentKode: "5.1.1" },
  { kode: "5.1.1.03", uraian: "Tunjangan BPD", level: 4, parentKode: "5.1.1" },
  { kode: "5.1.1.04", uraian: "Operasional Pemerintah Desa", level: 4, parentKode: "5.1.1" },
  { kode: "5.1.1.05", uraian: "Tunjangan PKPKD dan PPKD", level: 4, parentKode: "5.1.1" },
  { kode: "5.1.1.06", uraian: "Tunjangan dan Operasional BPD", level: 4, parentKode: "5.1.1" },
  { kode: "5.1.1.90", uraian: "Lain-lain Sub-Bidang ini", level: 4, parentKode: "5.1.1" },

  // 5.1.2 Sarana dan Prasarana Pemerintahan Desa
  { kode: "5.1.2", uraian: "Sub-Bidang Sarana dan Prasarana Pemerintahan Desa", level: 3, parentKode: "5.1" },
  { kode: "5.1.2.01", uraian: "Penyertaan Modal Desa / Penyertaan Modal BUMDes", level: 4, parentKode: "5.1.2" },
  { kode: "5.1.2.02", uraian: "Pembangunan/Rehabilitasi/Peningkatan Gedung/Prasarana Kantor Desa", level: 4, parentKode: "5.1.2" },
  { kode: "5.1.2.90", uraian: "Lain-lain Sub-Bidang ini", level: 4, parentKode: "5.1.2" },

  // 5.1.3 Administrasi Kependudukan, Pencatatan Sipil, Statistik dan Kearsipan
  { kode: "5.1.3", uraian: "Sub-Bidang Administrasi Kependudukan, Pencatatan Sipil, Statistik dan Kearsipan", level: 3, parentKode: "5.1" },
  { kode: "5.1.3.01", uraian: "Pelayanan Administrasi Umum dan Kependudukan", level: 4, parentKode: "5.1.3" },
  { kode: "5.1.3.02", uraian: "Penyusunan, Pendataan, dan Pemutakhiran Profil Desa", level: 4, parentKode: "5.1.3" },
  { kode: "5.1.3.03", uraian: "Pengelolaan Administrasi dan Kearsipan Pemerintahan Desa", level: 4, parentKode: "5.1.3" },
  { kode: "5.1.3.04", uraian: "Penyuluhan dan Penyadaran Masyarakat tentang Kependudukan dan Capil", level: 4, parentKode: "5.1.3" },
  { kode: "5.1.3.05", uraian: "Pemetaan dan Analisis Kemiskinan Desa secara Partisipatif", level: 4, parentKode: "5.1.3" },
  { kode: "5.1.3.90", uraian: "Lain-lain Sub-Bidang ini", level: 4, parentKode: "5.1.3" },

  // 5.1.4 Tata Praja Pemerintahan, Perencanaan, Keuangan dan Pelaporan
  { kode: "5.1.4", uraian: "Sub-Bidang Tata Praja Pemerintahan, Perencanaan, Keuangan dan Pelaporan", level: 3, parentKode: "5.1" },
  { kode: "5.1.4.01", uraian: "Penyelenggaraan Musyawarah Perencanaan Desa/Pembahasan APBDes (Musdes, Musrenbangdes/Pra-Musrenbangdes, dll)", level: 4, parentKode: "5.1.4" },
  { kode: "5.1.4.02", uraian: "Penyelenggaraan Musyawarah Desa Lainnya (musdus, rembug warga, dll)", level: 4, parentKode: "5.1.4" },
  { kode: "5.1.4.03", uraian: "Penyusunan Dokumen Perencanaan Desa (RPJMDes/RKPDes, dll)", level: 4, parentKode: "5.1.4" },
  { kode: "5.1.4.04", uraian: "Penyusunan Dokumen Keuangan Desa (APBDes/APBDes Perubahan/LPJ APBDes, dll)", level: 4, parentKode: "5.1.4" },
  { kode: "5.1.4.05", uraian: "Pengelolaan/Administrasi/Inventarisasi/Penilaian Aset Desa", level: 4, parentKode: "5.1.4" },
  { kode: "5.1.4.06", uraian: "Penyusunan Kebijakan Desa (Perdes/Perkades, dll di luar dokumen Perencanaan/Keuangan)", level: 4, parentKode: "5.1.4" },
  { kode: "5.1.4.07", uraian: "Pengembangan Sistem Informasi Desa", level: 4, parentKode: "5.1.4" },
  { kode: "5.1.4.08", uraian: "Koordinasi/Kerjasama Penyelenggaraan Pemerintahan dan Pembangunan Desa", level: 4, parentKode: "5.1.4" },
  { kode: "5.1.4.09", uraian: "Dukungan dan Sosialisasi Pelaksanaan Pilkades, Pemilihan Kepala Kewilayahan dan BPD", level: 4, parentKode: "5.1.4" },
  { kode: "5.1.4.10", uraian: "Penyelenggaraan Lomba antar Kewilayahan dan Pengiriman Kontingen dalam Lomba Desa", level: 4, parentKode: "5.1.4" },
  { kode: "5.1.4.90", uraian: "Lain-lain Sub-Bidang ini", level: 4, parentKode: "5.1.4" },

  // 5.1.5 Pertanahan
  { kode: "5.1.5", uraian: "Sub-Bidang Pertanahan", level: 3, parentKode: "5.1" },
  { kode: "5.1.5.01", uraian: "Sertifikasi Tanah Kas Desa", level: 4, parentKode: "5.1.5" },
  { kode: "5.1.5.02", uraian: "Administrasi Pajak Bumi dan Bangunan (PBB)", level: 4, parentKode: "5.1.5" },
  { kode: "5.1.5.03", uraian: "Penentuan/Penegasan/Pembangunan Batas/Peta Wilayah Desa", level: 4, parentKode: "5.1.5" },
  { kode: "5.1.5.04", uraian: "Pendataan/Inventarisasi Tanah Milik Desa/Ulayat, dll", level: 4, parentKode: "5.1.5" },
  { kode: "5.1.5.05", uraian: "Fasilitasi Sertifikasi Tanah untuk Masyarakat Miskin", level: 4, parentKode: "5.1.5" },
  { kode: "5.1.5.06", uraian: "Mediasi Konflik Pertanahan", level: 4, parentKode: "5.1.5" },
  { kode: "5.1.5.07", uraian: "Penyuluhan tentang Pertanahan", level: 4, parentKode: "5.1.5" },
  { kode: "5.1.5.90", uraian: "Lain-lain Sub-Bidang ini", level: 4, parentKode: "5.1.5" },

  // 5.2 Bidang Pelaksanaan Pembangunan Desa
  { kode: "5.2", uraian: "Bidang Pelaksanaan Pembangunan Desa", level: 2, parentKode: "5" },

  // 5.2.1 Sub-Bidang Pendidikan
  { kode: "5.2.1", uraian: "Sub-Bidang Pendidikan", level: 3, parentKode: "5.2" },
  { kode: "5.2.1.01", uraian: "Penyelenggaraan PAUD/TK/TPA/TKA/TPQ/Madrasah Non-Formal Milik Desa", level: 4, parentKode: "5.2.1" },
  { kode: "5.2.1.02", uraian: "Dukungan Penyelenggaraan PAUD (APE, Sarana PAUD, dll)", level: 4, parentKode: "5.2.1" },
  { kode: "5.2.1.03", uraian: "Penyuluhan dan Pelatihan Pendidikan bagi Masyarakat", level: 4, parentKode: "5.2.1" },
  { kode: "5.2.1.04", uraian: "Pemeliharaan Sarana dan Prasarana Perpustakaan/Taman Bacaan Desa/Sanggar Belajar Milik Desa", level: 4, parentKode: "5.2.1" },
  { kode: "5.2.1.05", uraian: "Pemeliharaan Sarana dan Prasarana PAUD", level: 4, parentKode: "5.2.1" },
  { kode: "5.2.1.06", uraian: "Pembangunan/Rehabilitasi/Peningkatan Sarana Prasarana Perpustakaan/Taman Bacaan Desa/Sanggar Belajar Milik Desa", level: 4, parentKode: "5.2.1" },
  { kode: "5.2.1.07", uraian: "Pembangunan/Rehabilitasi/Peningkatan Sarana Prasarana PAUD", level: 4, parentKode: "5.2.1" },
  { kode: "5.2.1.08", uraian: "Pengembangan dan Pembinaan Sanggar Seni dan Belajar", level: 4, parentKode: "5.2.1" },
  { kode: "5.2.1.09", uraian: "Dukungan Pendidikan bagi Siswa Miskin/Berprestasi", level: 4, parentKode: "5.2.1" },
  { kode: "5.2.1.90", uraian: "Lain-lain Sub-Bidang ini", level: 4, parentKode: "5.2.1" },

  // 5.2.2 Sub-Bidang Kesehatan
  { kode: "5.2.2", uraian: "Sub-Bidang Kesehatan", level: 3, parentKode: "5.2" },
  { kode: "5.2.2.01", uraian: "Penyelenggaraan Pos Kesehatan Desa/Polindes Milik Desa", level: 4, parentKode: "5.2.2" },
  { kode: "5.2.2.02", uraian: "Penyelenggaraan Posyandu (PMT, Honor, dll)", level: 4, parentKode: "5.2.2" },
  { kode: "5.2.2.03", uraian: "Penyuluhan dan Pelatihan Bidang Kesehatan", level: 4, parentKode: "5.2.2" },
  { kode: "5.2.2.04", uraian: "Penyelenggaraan Desa Siaga Kesehatan", level: 4, parentKode: "5.2.2" },
  { kode: "5.2.2.05", uraian: "Pembinaan Palang Merah Remaja (PMR) tingkat Desa", level: 4, parentKode: "5.2.2" },
  { kode: "5.2.2.06", uraian: "Pengasuhan Bersama atau Bina Keluarga Balita (BKB)", level: 4, parentKode: "5.2.2" },
  { kode: "5.2.2.07", uraian: "Pembinaan dan Pengawasan Upaya Kesehatan Tradisional", level: 4, parentKode: "5.2.2" },
  { kode: "5.2.2.08", uraian: "Pemeliharaan Sarana/Prasarana Posyandu/Polindes/PKD", level: 4, parentKode: "5.2.2" },
  { kode: "5.2.2.09", uraian: "Pembangunan/Rehabilitasi/Peningkatan/Pengadaan Sarana/Prasarana Posyandu/Polindes/PKD", level: 4, parentKode: "5.2.2" },
  { kode: "5.2.2.90", uraian: "Lain-lain Sub-Bidang ini", level: 4, parentKode: "5.2.2" },

  // 5.2.3 Sub-Bidang Pekerjaan Umum dan Penataan Ruang
  { kode: "5.2.3", uraian: "Sub-Bidang Pekerjaan Umum dan Penataan Ruang", level: 3, parentKode: "5.2" },
  { kode: "5.2.3.01", uraian: "Pemeliharaan Jalan Desa", level: 4, parentKode: "5.2.3" },
  { kode: "5.2.3.02", uraian: "Pemeliharaan Jalan Lingkungan Permukiman/Gang", level: 4, parentKode: "5.2.3" },
  { kode: "5.2.3.03", uraian: "Pemeliharaan Jalan Usaha Tani", level: 4, parentKode: "5.2.3" },
  { kode: "5.2.3.04", uraian: "Pemeliharaan Jembatan Milik Desa", level: 4, parentKode: "5.2.3" },
  { kode: "5.2.3.05", uraian: "Pemeliharaan Prasarana Jalan Desa (Gorong-gorong, Selokan, Box/Slab Culvert, dll)", level: 4, parentKode: "5.2.3" },
  { kode: "5.2.3.06", uraian: "Pemeliharaan Gedung/Prasarana Balai Desa/Balai Kemasyarakatan", level: 4, parentKode: "5.2.3" },
  { kode: "5.2.3.07", uraian: "Pemeliharaan Pemakaman Milik Desa/Situs Bersejarah Milik Desa/Petilasan", level: 4, parentKode: "5.2.3" },
  { kode: "5.2.3.08", uraian: "Pemeliharaan Embung Milik Desa", level: 4, parentKode: "5.2.3" },
  { kode: "5.2.3.09", uraian: "Pemeliharaan Monumen/Gapura/Batas Desa", level: 4, parentKode: "5.2.3" },
  { kode: "5.2.3.10", uraian: "Pembangunan/Rehabilitasi/Peningkatan/Pengerasan Jalan Desa", level: 4, parentKode: "5.2.3" },
  { kode: "5.2.3.11", uraian: "Pembangunan/Rehabilitasi/Peningkatan/Pengerasan Jalan Lingkungan Permukiman/Gang", level: 4, parentKode: "5.2.3" },
  { kode: "5.2.3.12", uraian: "Pembangunan/Rehabilitasi/Peningkatan/Pengerasan Jalan Usaha Tani", level: 4, parentKode: "5.2.3" },
  { kode: "5.2.3.13", uraian: "Pembangunan/Rehabilitasi/Peningkatan Jembatan Milik Desa", level: 4, parentKode: "5.2.3" },
  { kode: "5.2.3.14", uraian: "Pembangunan/Rehabilitasi/Peningkatan Prasarana Jalan Desa (Gorong-gorong, Selokan, Box/Slab Culvert, dll)", level: 4, parentKode: "5.2.3" },
  { kode: "5.2.3.15", uraian: "Pembangunan/Rehabilitasi/Peningkatan Balai Desa/Balai Kemasyarakatan", level: 4, parentKode: "5.2.3" },
  { kode: "5.2.3.16", uraian: "Pembangunan/Rehabilitasi/Peningkatan Pemakaman Milik Desa/Situs Bersejarah Milik Desa/Petilasan", level: 4, parentKode: "5.2.3" },
  { kode: "5.2.3.17", uraian: "Pembuatan/Pemutakhiran Peta Wilayah dan Sosial Desa", level: 4, parentKode: "5.2.3" },
  { kode: "5.2.3.18", uraian: "Pengembangan dan Pembangunan Sistem Informasi Desa", level: 4, parentKode: "5.2.3" },
  { kode: "5.2.3.19", uraian: "Pembangunan Embung dan Penampung Air Kecil Lainnya", level: 4, parentKode: "5.2.3" },
  { kode: "5.2.3.20", uraian: "Pembangunan/Rehabilitasi/Peningkatan Monumen/Gapura/Batas Desa", level: 4, parentKode: "5.2.3" },
  { kode: "5.2.3.90", uraian: "Lain-lain Sub-Bidang ini", level: 4, parentKode: "5.2.3" },

  // 5.2.4 Sub-Bidang Kawasan Permukiman
  { kode: "5.2.4", uraian: "Sub-Bidang Kawasan Permukiman", level: 3, parentKode: "5.2" },
  { kode: "5.2.4.01", uraian: "Dukungan Pelaksanaan Program Pembangunan/Rehab Rumah Tidak Layak Huni (RTLH) GAKIN", level: 4, parentKode: "5.2.4" },
  { kode: "5.2.4.02", uraian: "Pemeliharaan Sumur Resapan Milik Desa", level: 4, parentKode: "5.2.4" },
  { kode: "5.2.4.03", uraian: "Pemeliharaan Sumber Air Bersih Milik Desa (Mata Air/Tandon Penampungan Air Hujan/Sumur Bor, dll)", level: 4, parentKode: "5.2.4" },
  { kode: "5.2.4.04", uraian: "Pemeliharaan Sambungan Air Bersih ke Rumah Tangga (pipanisasi, dll)", level: 4, parentKode: "5.2.4" },
  { kode: "5.2.4.05", uraian: "Pemeliharaan Sanitasi Permukiman (Gorong-gorong, Selokan, Parit, dll, di luar prasarana jalan)", level: 4, parentKode: "5.2.4" },
  { kode: "5.2.4.06", uraian: "Pemeliharaan Fasilitas Jamban Umum/MCK umum, dll", level: 4, parentKode: "5.2.4" },
  { kode: "5.2.4.07", uraian: "Pemeliharaan Fasilitas Pengelolaan Sampah Desa/Permukiman (Penampungan, Bank Sampah, dll)", level: 4, parentKode: "5.2.4" },
  { kode: "5.2.4.08", uraian: "Pemeliharaan Sistem Pembuangan Air Limbah (Drainase, Air limbah Rumah Tangga)", level: 4, parentKode: "5.2.4" },
  { kode: "5.2.4.09", uraian: "Pemeliharaan Taman/Taman Bermain Anak Milik Desa", level: 4, parentKode: "5.2.4" },
  { kode: "5.2.4.10", uraian: "Pembangunan/Rehabilitasi/Peningkatan Sumur Resapan", level: 4, parentKode: "5.2.4" },
  { kode: "5.2.4.11", uraian: "Pembangunan/Rehabilitasi/Peningkatan Sumber Air Bersih Milik Desa (Mata Air/Tandon Penampungan Air Hujan/Sumur Bor, dll)", level: 4, parentKode: "5.2.4" },
  { kode: "5.2.4.12", uraian: "Pembangunan/Rehabilitasi/Peningkatan Sambungan Air Bersih ke Rumah Tangga (pipanisasi, dll)", level: 4, parentKode: "5.2.4" },
  { kode: "5.2.4.13", uraian: "Pembangunan/Rehabilitasi/Peningkatan Sanitasi Permukiman (Gorong-gorong, Selokan, Parit, dll di luar prasarana jalan)", level: 4, parentKode: "5.2.4" },
  { kode: "5.2.4.14", uraian: "Pembangunan/Rehabilitasi/Peningkatan Fasilitas Jamban Umum/MCK umum, dll", level: 4, parentKode: "5.2.4" },
  { kode: "5.2.4.15", uraian: "Pembangunan/Rehabilitasi/Peningkatan Fasilitas Pengelolaan Sampah Desa/Permukiman", level: 4, parentKode: "5.2.4" },
  { kode: "5.2.4.16", uraian: "Pembangunan/Rehabilitasi/Peningkatan Sistem Pembuangan Air Limbah (Drainase, Air Limbah Rumah Tangga)", level: 4, parentKode: "5.2.4" },
  { kode: "5.2.4.17", uraian: "Pembangunan/Rehabilitasi/Peningkatan Taman/Taman Bermain Anak Milik Desa", level: 4, parentKode: "5.2.4" },
  { kode: "5.2.4.90", uraian: "Lain-lain Sub-Bidang ini", level: 4, parentKode: "5.2.4" },

  // 5.2.5 Sub-Bidang Kehutanan dan Lingkungan Hidup
  { kode: "5.2.5", uraian: "Sub-Bidang Kehutanan dan Lingkungan Hidup", level: 3, parentKode: "5.2" },
  { kode: "5.2.5.01", uraian: "Pengelolaan Hutan Milik Desa", level: 4, parentKode: "5.2.5" },
  { kode: "5.2.5.02", uraian: "Pengelolaan Lingkungan Hidup Desa", level: 4, parentKode: "5.2.5" },
  { kode: "5.2.5.03", uraian: "Pelatihan/Sosialisasi/Penyuluhan/Penyadaran tentang LH dan Kehutanan", level: 4, parentKode: "5.2.5" },
  { kode: "5.2.5.90", uraian: "Lain-lain Sub-Bidang ini", level: 4, parentKode: "5.2.5" },

  // 5.2.6 Sub-Bidang Perhubungan, Komunikasi dan Informatika
  { kode: "5.2.6", uraian: "Sub-Bidang Perhubungan, Komunikasi dan Informatika", level: 3, parentKode: "5.2" },
  { kode: "5.2.6.01", uraian: "Pembuatan Rambu-Rambu di Jalan Desa", level: 4, parentKode: "5.2.6" },
  { kode: "5.2.6.02", uraian: "Penyelenggaraan Informasi Publik Desa (Poster, Baliho Pembangunan, dll)", level: 4, parentKode: "5.2.6" },
  { kode: "5.2.6.03", uraian: "Pengelolaan dan Pengembangan Sistem Informasi Desa", level: 4, parentKode: "5.2.6" },
  { kode: "5.2.6.90", uraian: "Lain-lain Sub-Bidang ini", level: 4, parentKode: "5.2.6" },

  // 5.2.7 Sub-Bidang Energi dan Sumber Daya Mineral
  { kode: "5.2.7", uraian: "Sub-Bidang Energi dan Sumber Daya Mineral", level: 3, parentKode: "5.2" },
  { kode: "5.2.7.01", uraian: "Pemeliharaan Sarana dan Prasarana Energi Alternatif tingkat Desa", level: 4, parentKode: "5.2.7" },
  { kode: "5.2.7.02", uraian: "Pembangunan/Rehabilitasi/Peningkatan Sarana dan Prasarana Energi Alternatif tingkat Desa", level: 4, parentKode: "5.2.7" },
  { kode: "5.2.7.03", uraian: "Pembangunan/Pemasangan Penerangan Lingkungan Desa", level: 4, parentKode: "5.2.7" },
  { kode: "5.2.7.04", uraian: "Pemeliharaan Penerangan Lingkungan Desa", level: 4, parentKode: "5.2.7" },
  { kode: "5.2.7.90", uraian: "Lain-lain Sub-Bidang ini", level: 4, parentKode: "5.2.7" },

  // 5.2.8 Sub-Bidang Pariwisata
  { kode: "5.2.8", uraian: "Sub-Bidang Pariwisata", level: 3, parentKode: "5.2" },
  { kode: "5.2.8.01", uraian: "Pemeliharaan Sarana dan Prasarana Pariwisata Milik Desa", level: 4, parentKode: "5.2.8" },
  { kode: "5.2.8.02", uraian: "Pembangunan/Rehabilitasi/Peningkatan Sarana dan Prasarana Pariwisata Milik Desa", level: 4, parentKode: "5.2.8" },
  { kode: "5.2.8.03", uraian: "Pengembangan Pariwisata tingkat Desa", level: 4, parentKode: "5.2.8" },
  { kode: "5.2.8.90", uraian: "Lain-lain Sub-Bidang ini", level: 4, parentKode: "5.2.8" },

  // 5.3 Bidang Pembinaan Kemasyarakatan Desa
  { kode: "5.3", uraian: "Bidang Pembinaan Kemasyarakatan Desa", level: 2, parentKode: "5" },

  // 5.3.1 Sub-Bidang Ketentraman, Ketertiban Umum dan Pelindungan Masyarakat
  { kode: "5.3.1", uraian: "Sub-Bidang Ketentraman, Ketertiban Umum dan Pelindungan Masyarakat", level: 3, parentKode: "5.3" },
  { kode: "5.3.1.01", uraian: "Pengadaan/Penyelenggaraan Pos Keamanan Desa (pembangunan pos, pengawasan pelaksanaan jadwal ronda/patroli dll)", level: 4, parentKode: "5.3.1" },
  { kode: "5.3.1.02", uraian: "Penguatan dan Peningkatan Kapasitas Tenaga Keamanan/Ketertiban oleh Pemerintah Desa (Satlinmas desa)", level: 4, parentKode: "5.3.1" },
  { kode: "5.3.1.03", uraian: "Koordinasi Pembinaan Ketentraman, Ketertiban, dan Pelindungan Masyarakat (dengan masyarakat/instansi pemerintah daerah, dll) Skala Lokal Desa", level: 4, parentKode: "5.3.1" },
  { kode: "5.3.1.04", uraian: "Pelatihan Kesiapsiagaan/Tanggap Bencana Skala Lokal Desa", level: 4, parentKode: "5.3.1" },
  { kode: "5.3.1.05", uraian: "Penyediaan Pos Kesiapsiagaan Bencana Skala Lokal Desa", level: 4, parentKode: "5.3.1" },
  { kode: "5.3.1.06", uraian: "Bantuan Hukum untuk Aparatur Desa dan Masyarakat Miskin", level: 4, parentKode: "5.3.1" },
  { kode: "5.3.1.07", uraian: "Pelatihan/Penyuluhan/Sosialisasi kepada Masyarakat di Bidang Hukum dan Pelindungan Masyarakat", level: 4, parentKode: "5.3.1" },
  { kode: "5.3.1.90", uraian: "Lain-lain Sub-Bidang ini", level: 4, parentKode: "5.3.1" },

  // 5.3.2 Sub-Bidang Kebudayaan dan Keagamaan
  { kode: "5.3.2", uraian: "Sub-Bidang Kebudayaan dan Keagamaan", level: 3, parentKode: "5.3" },
  { kode: "5.3.2.01", uraian: "Penyelenggaraan Festival Kesenian, Adat/Kebudayaan, dan Keagamaan (perayaan hari kemerdekaan, hari besar keagamaan, dll) tingkat Desa", level: 4, parentKode: "5.3.2" },
  { kode: "5.3.2.02", uraian: "Pemeliharaan Sarana dan Prasarana Kebudayaan/Rumah Adat/Keagamaan Milik Desa", level: 4, parentKode: "5.3.2" },
  { kode: "5.3.2.03", uraian: "Pembangunan/Rehabilitasi/Peningkatan Sarana dan Prasarana Kebudayaan/Rumah Adat/Keagamaan Milik Desa", level: 4, parentKode: "5.3.2" },
  { kode: "5.3.2.90", uraian: "Lain-lain Sub-Bidang ini", level: 4, parentKode: "5.3.2" },

  // 5.3.3 Sub-Bidang Kepemudaan dan Olahraga
  { kode: "5.3.3", uraian: "Sub-Bidang Kepemudaan dan Olahraga", level: 3, parentKode: "5.3" },
  { kode: "5.3.3.01", uraian: "Pengiriman Kontingen Kepemudaan dan Olahraga sebagai Wakil Desa di tingkat Kecamatan dan Kabupaten/Kota", level: 4, parentKode: "5.3.3" },
  { kode: "5.3.3.02", uraian: "Penyelenggaraan Pelatihan Kepemudaan (Kepanduan, dll) tingkat Desa", level: 4, parentKode: "5.3.3" },
  { kode: "5.3.3.03", uraian: "Penyelenggaraan Festival/Lomba Kepemudaan dan Olahraga tingkat Desa", level: 4, parentKode: "5.3.3" },
  { kode: "5.3.3.04", uraian: "Pemeliharaan Sarana dan Prasarana Kepemudaan dan Olahraga Milik Desa", level: 4, parentKode: "5.3.3" },
  { kode: "5.3.3.05", uraian: "Pembangunan/Rehabilitasi/Peningkatan Sarana dan Prasarana Kepemudaan dan Olahraga Milik Desa", level: 4, parentKode: "5.3.3" },
  { kode: "5.3.3.06", uraian: "Pembinaan Karangtaruna/Klub Kepemudaan/Klub Olahraga", level: 4, parentKode: "5.3.3" },
  { kode: "5.3.3.90", uraian: "Lain-lain Sub-Bidang ini", level: 4, parentKode: "5.3.3" },

  // 5.3.4 Sub-Bidang Kelembagaan Masyarakat
  { kode: "5.3.4", uraian: "Sub-Bidang Kelembagaan Masyarakat", level: 3, parentKode: "5.3" },
  { kode: "5.3.4.01", uraian: "Pembinaan Lembaga Adat", level: 4, parentKode: "5.3.4" },
  { kode: "5.3.4.02", uraian: "Pembinaan LKMD/LPM/LPMD", level: 4, parentKode: "5.3.4" },
  { kode: "5.3.4.03", uraian: "Pembinaan PKK", level: 4, parentKode: "5.3.4" },
  { kode: "5.3.4.04", uraian: "Pelatihan Pembinaan Lembaga Kemasyarakatan", level: 4, parentKode: "5.3.4" },
  { kode: "5.3.4.90", uraian: "Lain-lain Sub-Bidang ini", level: 4, parentKode: "5.3.4" },

  // 5.4 Bidang Pemberdayaan Masyarakat Desa
  { kode: "5.4", uraian: "Bidang Pemberdayaan Masyarakat Desa", level: 2, parentKode: "5" },

  // 5.4.1 Sub-Bidang Kelautan dan Perikanan
  { kode: "5.4.1", uraian: "Sub-Bidang Kelautan dan Perikanan", level: 3, parentKode: "5.4" },
  { kode: "5.4.1.01", uraian: "Pemeliharaan Karamba/Kolam Perikanan Darat Milik Desa", level: 4, parentKode: "5.4.1" },
  { kode: "5.4.1.02", uraian: "Pemeliharaan Pelabuhan Perikanan Sungai/Kecil Milik Desa", level: 4, parentKode: "5.4.1" },
  { kode: "5.4.1.03", uraian: "Pembangunan/Rehabilitasi/Peningkatan Karamba/Kolam Perikanan Darat Milik Desa", level: 4, parentKode: "5.4.1" },
  { kode: "5.4.1.04", uraian: "Pembangunan/Rehabilitasi/Peningkatan Pelabuhan Perikanan Sungai/Kecil Milik Desa", level: 4, parentKode: "5.4.1" },
  { kode: "5.4.1.05", uraian: "Bantuan Perikanan (Bibit/Pakan/dst)", level: 4, parentKode: "5.4.1" },
  { kode: "5.4.1.06", uraian: "Pelatihan/Bimtek/Pengenalan Teknologi Tepat Guna untuk Perikanan Darat/Nelayan", level: 4, parentKode: "5.4.1" },
  { kode: "5.4.1.90", uraian: "Lain-lain Sub-Bidang ini", level: 4, parentKode: "5.4.1" },

  // 5.4.2 Sub-Bidang Pertanian dan Peternakan
  { kode: "5.4.2", uraian: "Sub-Bidang Pertanian dan Peternakan", level: 3, parentKode: "5.4" },
  { kode: "5.4.2.01", uraian: "Peningkatan Produksi Tanaman Pangan (Alat Produksi dan Pengolahan Pertanian, dll)", level: 4, parentKode: "5.4.2" },
  { kode: "5.4.2.02", uraian: "Peningkatan Produksi Peternakan (Alat Produksi dan Pengolahan Peternakan, Kandang, dll)", level: 4, parentKode: "5.4.2" },
  { kode: "5.4.2.03", uraian: "Penguatan Ketahanan Pangan tingkat Desa (Lumbung Desa, dll)", level: 4, parentKode: "5.4.2" },
  { kode: "5.4.2.04", uraian: "Pemeliharaan Saluran Irigasi Tersier/Sederhana Milik Desa", level: 4, parentKode: "5.4.2" },
  { kode: "5.4.2.05", uraian: "Pelatihan/Bimtek/Pengenalan TTG untuk Pertanian/Peternakan", level: 4, parentKode: "5.4.2" },
  { kode: "5.4.2.90", uraian: "Lain-lain Sub-Bidang ini", level: 4, parentKode: "5.4.2" },

  // 5.4.3 Sub-Bidang Peningkatan Kapasitas Aparatur Desa
  { kode: "5.4.3", uraian: "Sub-Bidang Peningkatan Kapasitas Aparatur Desa", level: 3, parentKode: "5.4" },
  { kode: "5.4.3.01", uraian: "Peningkatan Kapasitas Kepala Desa", level: 4, parentKode: "5.4.3" },
  { kode: "5.4.3.02", uraian: "Peningkatan Kapasitas Perangkat Desa", level: 4, parentKode: "5.4.3" },
  { kode: "5.4.3.03", uraian: "Peningkatan Kapasitas BPD", level: 4, parentKode: "5.4.3" },
  { kode: "5.4.3.04", uraian: "Peningkatan Kapasitas LPMD/LKMD/LPM", level: 4, parentKode: "5.4.3" },
  { kode: "5.4.3.90", uraian: "Lain-lain Sub-Bidang ini", level: 4, parentKode: "5.4.3" },

  // 5.4.4 Sub-Bidang Pemberdayaan Perempuan, Perlindungan Anak dan Keluarga
  { kode: "5.4.4", uraian: "Sub-Bidang Pemberdayaan Perempuan, Perlindungan Anak dan Keluarga", level: 3, parentKode: "5.4" },
  { kode: "5.4.4.01", uraian: "Pelatihan/Penyuluhan Pemberdayaan Perempuan", level: 4, parentKode: "5.4.4" },
  { kode: "5.4.4.02", uraian: "Pelatihan dan Penguatan Penyandang Difabel (Penyandang Disabilitas)", level: 4, parentKode: "5.4.4" },
  { kode: "5.4.4.03", uraian: "Pelatihan/Penyuluhan Perlindungan Anak", level: 4, parentKode: "5.4.4" },
  { kode: "5.4.4.04", uraian: "Pelatihan dan Penguatan Kelompok Usaha Ekonomi Produktif Perempuan", level: 4, parentKode: "5.4.4" },
  { kode: "5.4.4.90", uraian: "Lain-lain Sub-Bidang ini", level: 4, parentKode: "5.4.4" },

  // 5.4.5 Sub-Bidang Koperasi, Usaha Mikro Kecil dan Menengah (UMKM)
  { kode: "5.4.5", uraian: "Sub-Bidang Koperasi, Usaha Mikro Kecil dan Menengah (UMKM)", level: 3, parentKode: "5.4" },
  { kode: "5.4.5.01", uraian: "Pelatihan Manajemen Pengelolaan Koperasi/KUD/UMKM", level: 4, parentKode: "5.4.5" },
  { kode: "5.4.5.02", uraian: "Pengembangan Sarana Prasarana Usaha Mikro, Kecil dan Menengah serta Koperasi", level: 4, parentKode: "5.4.5" },
  { kode: "5.4.5.03", uraian: "Pengadaan Teknologi Tepat Guna untuk Pengembangan Ekonomi Pedesaan Non-Pertanian", level: 4, parentKode: "5.4.5" },
  { kode: "5.4.5.90", uraian: "Lain-lain Sub-Bidang ini", level: 4, parentKode: "5.4.5" },

  // 5.4.6 Sub-Bidang Dukungan Penanaman Modal
  { kode: "5.4.6", uraian: "Sub-Bidang Dukungan Penanaman Modal", level: 3, parentKode: "5.4" },
  { kode: "5.4.6.01", uraian: "Pembentukan BUMDes (Persiapan dan Pembentukan Awal BUMDes)", level: 4, parentKode: "5.4.6" },
  { kode: "5.4.6.02", uraian: "Pelatihan Pengelolaan BUMDes (Pelatihan yang Dilaksanakan oleh Desa)", level: 4, parentKode: "5.4.6" },
  { kode: "5.4.6.90", uraian: "Lain-lain Sub-Bidang ini", level: 4, parentKode: "5.4.6" },

  // 5.4.7 Sub-Bidang Perdagangan dan Perindustrian
  { kode: "5.4.7", uraian: "Sub-Bidang Perdagangan dan Perindustrian", level: 3, parentKode: "5.4" },
  { kode: "5.4.7.01", uraian: "Pemeliharaan Pasar Desa/Kios Milik Desa", level: 4, parentKode: "5.4.7" },
  { kode: "5.4.7.02", uraian: "Pembangunan/Rehabilitasi/Peningkatan Pasar Desa/Kios Milik Desa", level: 4, parentKode: "5.4.7" },
  { kode: "5.4.7.03", uraian: "Pengembangan Industri kecil Level Desa", level: 4, parentKode: "5.4.7" },
  { kode: "5.4.7.04", uraian: "Pembentukan/Fasilitasi/Pelatihan/Pendampingan Kelompok Usaha Ekonomi Produktif (Pengolahan/Pemasaran/Ekspor dst)", level: 4, parentKode: "5.4.7" },
  { kode: "5.4.7.90", uraian: "Lain-lain Sub-Bidang ini", level: 4, parentKode: "5.4.7" },

  // 5.5 Bidang Penanggulangan Bencana, Keadaan Darurat dan Mendesak Desa
  { kode: "5.5", uraian: "Bidang Penanggulangan Bencana, Keadaan Darurat dan Mendesak Desa", level: 2, parentKode: "5" },

  // 5.5.1 Sub-Bidang Penanggulangan Bencana
  { kode: "5.5.1", uraian: "Sub-Bidang Penanggulangan Bencana", level: 3, parentKode: "5.5" },
  { kode: "5.5.1.01", uraian: "Penanggulangan Bencana", level: 4, parentKode: "5.5.1" },

  // 5.5.2 Sub-Bidang Keadaan Darurat
  { kode: "5.5.2", uraian: "Sub-Bidang Keadaan Darurat", level: 3, parentKode: "5.5" },
  { kode: "5.5.2.01", uraian: "Keadaan Darurat", level: 4, parentKode: "5.5.2" },

  // 5.5.3 Sub-Bidang Keadaan Mendesak
  { kode: "5.5.3", uraian: "Sub-Bidang Keadaan Mendesak", level: 3, parentKode: "5.5" },
  { kode: "5.5.3.01", uraian: "Keadaan Mendesak", level: 4, parentKode: "5.5.3" },

  // ============================================================
  // 6. PEMBIAYAAN
  // ============================================================
  { kode: "6", uraian: "PEMBIAYAAN", level: 1 },

  // 6.1 Penerimaan Pembiayaan
  { kode: "6.1", uraian: "Penerimaan Pembiayaan", level: 2, parentKode: "6" },
  { kode: "6.1.1", uraian: "SILPA", level: 3, parentKode: "6.1" },
  { kode: "6.1.1.01", uraian: "SILPA Tahun Sebelumnya", level: 4, parentKode: "6.1.1" },
  { kode: "6.1.2", uraian: "Pencairan Dana Cadangan", level: 3, parentKode: "6.1" },
  { kode: "6.1.2.01", uraian: "Pencairan Dana Cadangan", level: 4, parentKode: "6.1.2" },
  { kode: "6.1.3", uraian: "Hasil Penjualan Kekayaan Desa yang Dipisahkan", level: 3, parentKode: "6.1" },
  { kode: "6.1.3.01", uraian: "Hasil Penjualan Kekayaan Desa yang Dipisahkan", level: 4, parentKode: "6.1.3" },

  // 6.2 Pengeluaran Pembiayaan
  { kode: "6.2", uraian: "Pengeluaran Pembiayaan", level: 2, parentKode: "6" },
  { kode: "6.2.1", uraian: "Pembentukan Dana Cadangan", level: 3, parentKode: "6.2" },
  { kode: "6.2.1.01", uraian: "Pembentukan Dana Cadangan", level: 4, parentKode: "6.2.1" },
  { kode: "6.2.2", uraian: "Penyertaan Modal Desa", level: 3, parentKode: "6.2" },
  { kode: "6.2.2.01", uraian: "Penyertaan Modal", level: 4, parentKode: "6.2.2" },
];

// Helper: ambil hanya level tertentu
export const getByLevel = (level: 1 | 2 | 3 | 4) =>
  KODE_REKENING.filter((k) => k.level === level);

// Helper: ambil children dari parent
export const getChildren = (parentKode: string) =>
  KODE_REKENING.filter((k) => k.parentKode === parentKode);

// Helper: cari satu kode
export const findKode = (kode: string) =>
  KODE_REKENING.find((k) => k.kode === kode);

// Helper: ambil semua rincian obyek (level 4) saja — untuk dropdown input RAB/DPA
export const getRincianObyek = () => getByLevel(4);

// Helper: tree untuk tampilan berjenjang
export interface KodeRekeningTree extends KodeRekening {
  children?: KodeRekeningTree[];
}
export const buildTree = (parentKode?: string): KodeRekeningTree[] =>
  KODE_REKENING.filter((k) =>
    parentKode ? k.parentKode === parentKode : !k.parentKode
  ).map((k) => ({ ...k, children: buildTree(k.kode) }));
