// src/lib/generatePDF.ts
// ─────────────────────────────────────────────────────────────────────────────
// BARREL — re-export semua fungsi & tipe PDF dari modul-modul yang terpecah.
//
// Consumer cukup import dari sini:
//   import { downloadPDF_LRA1A, downloadPDF_SPP1 } from "@/lib/generatePDF";
//
// Struktur modul:
//   generatePDF.shared.ts       — konstanta, helper, primitif gambar (internal)
//   generatePDF.apbdes.ts       — #1–3   APBDes Global / Per Kegiatan / Rinci
//   generatePDF.buku.ts         — #4–11  DPA, BKU, Buku Pembantu, Realisasi Sem.I
//   generatePDF.penganggaran.ts — #12–18 RAB Pendapatan/Pembiayaan, PAK, Analisis
//   generatePDF.register.ts     — #19–25 BP Kegiatan/Pendapatan/Pajak, Register
//   generatePDF.spp.ts          — #26–34 Dokumen SPP, CAIR, KWT, SPTB, LP, SPJ
//   generatePDF.lra.ts          — #35–40 LRA 1A/1B/1C, Semester, Sumber Dana, Kekayaan
// ─────────────────────────────────────────────────────────────────────────────

// ── Shared helpers (backward compat) ─────────────────────────────────────────
export { rp, formatTgl, tglTTD, nowStr, periodeLabel, persenStr, BULAN_LABEL, BULAN_SINGKAT } from "@/lib/generatePDF.shared";
export type { ColDef, CellVal, TTDBlock, JsPDFDoc, LedgerRow } from "@/lib/generatePDF.shared";

// ── #1–3 APBDes ──────────────────────────────────────────────────────────────
export { downloadPDF_APBDesGlobal, downloadPDF_APBDesPerKegiatan, downloadPDF_APBDesRinci } from "@/lib/generatePDF.apbdes";
export type { APBDesGlobalProps, APBDesPerKegiatanProps, APBDesRinciProps } from "@/lib/generatePDF.apbdes";

// ── #4–11 Buku Pembantu & DPA ─────────────────────────────────────────────────
export { downloadPDF_DPAPerKegiatan, downloadPDF_BKUBulanan, downloadPDF_BukuKasTunai, downloadPDF_BukuBank, downloadPDF_BukuPajak, downloadPDF_BukuPajakRekap, downloadPDF_BukuPanjar, downloadPDF_RealisasiSemesterI } from "@/lib/generatePDF.buku";
export type { DPAPerKegiatanProps, BKUBulananProps, BukuKasTunaiProps, BukuBankProps, BukuPajakProps, BukuPajakRekapProps, BukuPanjarProps, RealisasiSemesterIProps } from "@/lib/generatePDF.buku";

// ── #12–18 Penganggaran Lanjutan ──────────────────────────────────────────────
export { downloadPDF_RABPendapatan, downloadPDF_RABPembiayaan, downloadPDF_PAKGlobal, downloadPDF_PAKPerKegiatan, downloadPDF_PAKRinci, downloadPDF_LaporanSumberDana, downloadPDF_ProporsiBelanjaOperasional } from "@/lib/generatePDF.penganggaran";
export type { RABPendapatanProps, RABPembiayaanProps, PAKGlobalProps, PAKPerKegiatanProps, PAKRinciProps, LaporanSumberDanaProps, ProporsiBelanjaProps } from "@/lib/generatePDF.penganggaran";

// ── #19–25 Register & BP Penatausahaan ────────────────────────────────────────
export { downloadPDF_BPKegiatan, downloadPDF_BPPendapatan, downloadPDF_BPPajakPerJenis, downloadPDF_RegisterSPP, downloadPDF_RegisterKWT, downloadPDF_RegisterPencairan, downloadPDF_RegisterSPJ } from "@/lib/generatePDF.register";
export type { BPKegiatanProps, BPKegiatanRow, BPPendapatanProps, BPPajakPerJenisProps, RegisterSPPProps, RegisterKWTProps, RegisterKWTRow, RegisterPencairanProps, RegisterSPJProps } from "@/lib/generatePDF.register";

// ── #26–34 Dokumen SPP / Pencairan / Kuitansi / SPJ ──────────────────────────
export { downloadPDF_SPP1, downloadPDF_SPP2Panjar, downloadPDF_SPP2Definitif, downloadPDF_CAIR, downloadPDF_KWT, downloadPDF_KWTSemua, downloadPDF_SPTB, downloadPDF_LP, downloadPDF_SPJDokumen } from "@/lib/generatePDF.spp";
export type { SPP8Props, CAIR8Props, KWT8Props, KWTAllProps, SPTBProps, LPProps, SPJ8Props } from "@/lib/generatePDF.spp";

// ── #35–40 LRA ────────────────────────────────────────────────────────────────
export { downloadPDF_LRA1A, downloadPDF_LRA1B, downloadPDF_LRA1C, downloadPDF_LRASemester, downloadPDF_LRAPerSumberDana, downloadPDF_LRAKekayaan } from "@/lib/generatePDF.lra";
export type { LRA1AProps, LRA1BProps, LRA1CProps, LRASemesterProps, LRAPerSumberDanaProps, SumberDanaLRA, LRAKekayaanProps } from "@/lib/generatePDF.lra";
