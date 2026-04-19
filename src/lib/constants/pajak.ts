// src/lib/constants/pajak.ts

export interface JenisPajakDef {
  kode: string;
  nama: string;
  tarif: number;       // dalam desimal, e.g. 0.11 = 11%
  keterangan: string;
}

export const JENIS_PAJAK: JenisPajakDef[] = [
  {
    kode: "PPN",
    nama: "PPN (Pajak Pertambahan Nilai)",
    tarif: 0.11,
    keterangan: "11% dari DPP",
  },
  {
    kode: "PPh21_IV",
    nama: "PPh Pasal 21 — Gol. IV (PNS)",
    tarif: 0.15,
    keterangan: "15% dari honorarium",
  },
  {
    kode: "PPh21_non",
    nama: "PPh Pasal 21 — Non-PNS / Gol. I-III",
    tarif: 0.05,
    keterangan: "5% dari honorarium",
  },
  {
    kode: "PPh22",
    nama: "PPh Pasal 22 (Pengadaan Barang)",
    tarif: 0.015,
    keterangan: "1.5% dari DPP",
  },
  {
    kode: "PPh23_npwp",
    nama: "PPh Pasal 23 — Punya NPWP (Jasa)",
    tarif: 0.02,
    keterangan: "2% dari DPP",
  },
  {
    kode: "PPh23_non_npwp",
    nama: "PPh Pasal 23 — Tidak Punya NPWP (Jasa)",
    tarif: 0.04,
    keterangan: "4% dari DPP (2× tarif normal)",
  },
  {
    kode: "PPh23_konstruksi",
    nama: "PPh Pasal 23 — Jasa Konstruksi (NPWP)",
    tarif: 0.015,
    keterangan: "1.5% dari DPP",
  },
  {
    kode: "PajakDaerah",
    nama: "Pajak Daerah",
    tarif: 0.10,
    keterangan: "10% dari DPP",
  },
];

export function getPajakByKode(kode: string): JenisPajakDef | undefined {
  return JENIS_PAJAK.find((p) => p.kode === kode);
}