export type UserRole = "Bendahara Desa (Kaur Keuangan)" | "Koordinator PPKD (Sekdes)" | "PKPKD (Kades)" | "Operator";

export interface UserProfile {
  uid: string;
  nama: string;
  role: UserRole;
  email: string;
  lastLogin: number;
}

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

export interface SubItemRAB {
  id: string;
  uraian: string;
  volume: number;
  satuan: string;
  hargaSatuan: number;
  jumlah: number;
}

export interface RincianBelanja {
  id: string;
  kodeRekening: string;
  uraian: string;
  subItems: Record<string, SubItemRAB>;
  totalPagu: number;
  sumberDana: SumberDana;
}

export type SumberDana = "DD" | "ADD" | "PAD" | "BHPR" | "BKP" | "BKK" | "LAIN";

export interface KegiatanAPBDes {
  id: string;
  bidang: string;
  subBidang: string;
  kodeKegiatan: string;
  namaKegiatan: string;
  totalPagu: number;
  rincianBelanja: Record<string, RincianBelanja>;
  status: "draft" | "dikonfirmasi";
}

export interface RincianDPA {
  id: string;
  uraian: string;
  volume: number;
  satuan: string;
  hargaSatuan: number;
  jumlah: number;
}

export interface DPA {
  id: string;
  kegiatanId: string;
  namaKegiatan: string;
  totalPagu: number;
  rincian: Record<string, RincianDPA>;
  status: "draft" | "dikonfirmasi";
}

export type JenisSPP = "Panjar" | "Definitif" | "Pembiayaan";
export type StatusSPP = "draft" | "dikonfirmasi" | "dicairkan";

export interface RincianSPP {
  kodeRekening: string;
  jumlah: number;
}

export interface SPP {
  id: string;
  nomorSPP: string;
  tanggal: string;
  jenis: JenisSPP;
  uraian: string;
  kegiatanId: string;
  rincianSPP: Record<string, RincianSPP>;
  totalJumlah: number;
  status: StatusSPP;
  inputOleh: string;
  createdAt: number;
  dicairkanTanggal?: string;
}

export interface BKUEntry {
  id: string;
  noUrut: number;
  tanggal: string;
  uraian: string;
  penerimaan: number;
  pengeluaran: number;
  saldo: number;
  jenis: string;
  sppRef?: string;
  inputOleh: string;
  createdAt: number;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}