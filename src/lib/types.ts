// src/lib/types.ts

// ===== AUTH & USER =====

export type UserRole =
  | "Bendahara Desa (Kaur Keuangan)"
  | "Koordinator PPKD (Sekdes)"
  | "PKPKD (Kades)"
  | "Operator";

export interface UserProfile {
  uid: string;
  nama: string;
  role: UserRole;
  email: string;
  lastLogin: number;
}

// ===== CONFIG =====

export interface DesaConfig {
  namaDesa: string;
  kodeWilayah: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  kepalaDesaNama: string;
  kepalaDesaNip: string;
  bendaharaNama: string;
  bendaharaNip: string;
  sekdesNama: string;
  sekdesNip: string;
}

export interface TahunAnggaranConfig {
  aktif: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

// ===== MASTER / SHARED =====

export type SumberDana = "DD" | "ADD" | "PAD" | "BHPR" | "BKP" | "BKK" | "LAIN";

// ===== APBDes =====

export interface SubItemRAB {
  id: string;
  uraian: string;
  volume: number;
  satuan: string;
  hargaSatuan: number;
  jumlah: number; // volume * hargaSatuan
}

export interface RekeningKegiatan {
  id: string;
  kodeRekening: string;  // e.g. "5.1.02.01"
  namaRekening: string;
  subItems: SubItemRAB[];
  totalPagu: number;     // sum(subItems.jumlah)
  sumberDana: SumberDana;
}

export interface KegiatanAPBDes {
  id: string;
  bidangKode: string;    // e.g. "1"
  bidangNama: string;
  subBidangKode: string; // e.g. "1.1"
  subBidangNama: string;
  kodeKegiatan: string;  // e.g. "1.1.01"
  namaKegiatan: string;
  rekeningList: RekeningKegiatan[];
  totalPagu: number;     // sum(rekeningList.totalPagu)
  status: "draft" | "dikonfirmasi";
  createdAt: number;
  updatedAt: number;
}

export interface PendapatanItem {
  id: string;
  kodeRekening: string;
  namaRekening: string;
  anggaran: number;
  sumberDana: SumberDana;
}

export interface PembiayaanItem {
  id: string;
  jenis: "penerimaan" | "pengeluaran";
  kodeRekening: string;
  namaRekening: string;
  anggaran: number;
  sumberDana?: SumberDana; // hanya untuk kode 6.1.01 SiLPA
}

export interface APBDesData {
  tahun: number;
  pendapatan: PendapatanItem[];
  belanja: KegiatanAPBDes[] | { [id: string]: KegiatanAPBDes };
  pembiayaan: PembiayaanItem[];
  totalPendapatan: number;
  totalBelanja: number;
  totalPembiayaan: number;
  surplusDefisit: number;
  status: "draft" | "dikonfirmasi";
  updatedAt: number;
}

// ===== DPA =====

export interface DPABulan {
  jumlah: number;
}

export interface DPAKegiatan {
  kegiatanId: string;
  isDPAL: boolean;
  sumberDPAL?: string; // e.g. "2025"
  status: "draft" | "dikonfirmasi";
  totalDPA: number;    // sum(bulan[1..12].jumlah)
  updatedAt: number;
  bulan: { [bulanKe: string]: DPABulan }; // key: "1".."12"
}

export interface DPAData {
  [kegiatanId: string]: Omit<DPAKegiatan, "kegiatanId">;
}

// ===== SPP =====

export type JenisSPP = "Panjar" | "Definitif" | "Pembiayaan";
export type StatusSPP = "draft" | "dikonfirmasi" | "dicairkan";

export interface RincianSPP {
  id: string;
  kodeRekening: string;  // FK ke RekeningKegiatan.kodeRekening
  namaRekening: string;
  jumlah: number;        // ≤ sisa pagu rekening tsb
}

export interface SPPItem {
  id: string;
  nomorSPP: string;       // e.g. "SPP/001/2026" — auto-generate
  tanggal: string;        // "YYYY-MM-DD"
  jenis: JenisSPP;
  uraian: string;         // deskripsi bebas
  kegiatanId: string;     // FK ke KegiatanAPBDes.id
  kegiatanNama: string;   // snapshot nama saat SPP dibuat
  rincianSPP: Record<string, RincianSPP>; // 1+ rekening dari kegiatan tsb
  totalJumlah: number;    // sum(rincianSPP.jumlah)
  status: StatusSPP;
  inputOleh: string;      // uid user
  createdAt: number;
  dicairkanTanggal?: string; // diisi saat status → dicairkan
  mediaPembayaran?: "tunai" | "bank"; // pilihan saat SPP dibuat
  nomorPencairan?: string;
  nomorSPJ?: string;
}

// ===== BKU =====

export type JenisRefBKU =
  | "penerimaan_tunai"   // TND/xxx/yyyy — penerimaan tunai dari pihak ketiga
  | "penerimaan_bank"    // BNK/xxx/yyyy — penerimaan masuk rekening bank
  | "mutasi_kas"         // MUT/xxx/yyyy — penarikan bank ke tunai
  | "spp"                // SPP/xxx/yyyy
  | "spj"                // SPJ/xxx/yyyy - baris penanda SPJ (nilai 0)
  | "spj_pajak"          // SPJ/xxx/yyyy - pajak
  | "spj_sisa_panjar"    // SPJ/xxx/yyyy - sisa panjar
  | "spj_titipan_pajak"  // SPJ/xxx/yyyy - titipan pajak (dikembalikan ke saldo, disetor nanti)
  | "penyetoran_pajak"   // PJKK/xxx/yyyy — setor pajak ke kas negara
  | "saldo_awal";

// ===== MUTASI KAS =====

export type JenisMutasi = "bank_ke_tunai";

export interface MutasiKasItem {
  id: string;
  nomorMutasi: string;   // "MUT/001/2026"
  tanggal: string;       // "YYYY-MM-DD"
  jenis: JenisMutasi;
  uraian: string;
  jumlah: number;
  inputOleh: string;
  createdAt: number;
}

// ===== PENYETORAN PAJAK =====

export type JenisPembayaranPajak = "tunai" | "bank";

export interface PenyetoranPajakItem {
  id: string;
  nomorSetor: string;    // "PJKK/001/2026"
  tanggal: string;       // "YYYY-MM-DD"
  kodePajak: string;
  namaPajak: string;
  jumlah: number;
  jenisPembayaran: JenisPembayaranPajak;
  uraian: string;
  bukuPembantuPajakIds: string[]; // id dari bukuPembantuPajak yang ditandai sudahDisetor
  inputOleh: string;
  createdAt: number;
}

export interface BKUItem {
  id: string;
  tanggal: string;        // "YYYY-MM-DD"
  uraian: string;
  penerimaan: number;
  pengeluaran: number;
  saldo: number;          // dihitung saat render, tidak disimpan ke RTDB
  jenisRef: JenisRefBKU;
  nomorRef: string;       // e.g. "TND/001/2026", "SPP/001/2026", "SPJ/001/2026"
  sppId?: string;
  spjId?: string;
  penerimaanId?: string;
  inputOleh: string;
  createdAt: number;
}

// ===== PENERIMAAN =====

export type JenisPenerimaan = "tunai" | "bank";

export interface PenerimaanItem {
  id: string;
  nomorBukti: string;    // e.g. "TND/001/2026" atau "BNK/001/2026"
  tanggal: string;       // "YYYY-MM-DD"
  jenisPenerimaan: JenisPenerimaan;
  sumberDana: SumberDana;
  uraian: string;
  jumlah: number;
  inputOleh: string;
  createdAt: number;
}

// ===== SPJ =====

export type StatusSPJ = "draft" | "disahkan";

export interface PajakSPJ {
  id: string;
  kode: string;          // kode dari JENIS_PAJAK
  nama: string;
  tarif: number;
  dasarPengenaan: number;
  jumlahPajak: number;   // otomatis: dasar × tarif
}

export interface SPJItem {
  id: string;
  nomorSPJ: string;      // auto: "SPJ/001/2026"
  tanggal: string;       // "YYYY-MM-DD"
  sppId: string;         // FK ke SPPItem.id
  nomorSPP: string;      // snapshot
  kegiatanNama: string;  // snapshot
  nilaiSPP: number;      // snapshot nilai SPP saat dicairkan
  nilaiRealisasi: number; // total belanja nyata (≤ nilaiSPP)
  sisaPanjar: number;    // nilaiSPP - nilaiRealisasi (≥ 0)
  mediaPembayaran?: "tunai" | "bank"; // inherit dari SPP
  pajakList: Record<string, PajakSPJ>;
  totalPajak: number;    // sum(pajakList.jumlahPajak)
  status: StatusSPJ;
  inputOleh: string;
  createdAt: number;
}