// src/lib/generatePDF.penganggaran.ts
// ─────────────────────────────────────────────────────────────────────────────
// PDF PENGANGGARAN LANJUTAN
//   #12 downloadPDF_RABPendapatan             — RAB Pendapatan
//   #13 downloadPDF_RABPembiayaan             — RAB Pembiayaan
//   #14 downloadPDF_PAKGlobal                 — PAK 1A (delegate ke APBDesGlobal)
//   #15 downloadPDF_PAKPerKegiatan            — PAK 1B (delegate ke APBDesPerKegiatan)
//   #16 downloadPDF_PAKRinci                  — PAK 1C (delegate ke APBDesRinci)
//   #17 downloadPDF_LaporanSumberDana         — Rekap APBDes Per Sumber Dana
//   #18 downloadPDF_ProporsiBelanjaOperasional — Proporsi Operasional vs Pembangunan
// ─────────────────────────────────────────────────────────────────────────────

import type { DataDesa } from "@/hooks/useMaster";
import type { PendapatanItem, KegiatanAPBDes, PembiayaanItem } from "@/lib/types";
import {
  newDoc, rp, tglTTD,
  C_ROW_ALT, C_MUTED, C_SUCCESS, C_WARNING, C_BORDER, C_HEADER_BG, C_TEXT,
  drawKop, drawJudul, drawFooterAllPages, drawTableHeader,
  drawDataRow, drawTotalRow, drawGrandTotalRow, drawSectionRow, drawTTD,
  checkPageBreak,
} from "@/lib/generatePDF.shared";
import type { ColDef } from "@/lib/generatePDF.shared";
import {
  downloadPDF_APBDesGlobal,
  downloadPDF_APBDesPerKegiatan,
  downloadPDF_APBDesRinci,
} from "@/lib/generatePDF.apbdes";

// ─── 12. RAB Pendapatan ────────────────────────────────────────────────────────

export interface RABPendapatanProps {
  tahun: string;
  dataDesa: DataDesa | null;
  pendapatanList: PendapatanItem[];
  jenisAPBDes?: "APBDes" | "PAK";
  nomorPerdes?: string;
  filename?: string;
}

export async function downloadPDF_RABPendapatan(p: RABPendapatanProps, returnBlob = false): Promise<void | Blob> {
  const doc = await newDoc("portrait");
  const W = 210, H = 297, ML = 10, MB = 50;
  const x = ML;
  const desa = p.dataDesa;
  const jenisLabel = p.jenisAPBDes ?? "APBDes";

  let y = drawKop(doc, desa, W);
  y = drawJudul(doc, W, y,
    `RENCANA ANGGARAN BIAYA (RAB) PENDAPATAN`,
    `${jenisLabel} Tahun Anggaran ${p.tahun}${p.nomorPerdes ? ` — Perdes No. ${p.nomorPerdes}` : ""}`
  );

  const cols: ColDef[] = [
    { label: "No.",           width: 10,  align: "center" },
    { label: "Kode Rekening", width: 32              },
    { label: "Uraian Pendapatan", width: 84          },
    { label: "Sumber Dana",   width: 22, align: "center" },
    { label: "Jumlah (Rp)",   width: 42, align: "right"  },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);
  y = drawTableHeader(doc, cols, x, y);

  const grouped: Record<string, PendapatanItem[]> = {};
  for (const item of p.pendapatanList) {
    const prefix = item.kodeRekening.split(".")[0] ?? "4";
    if (!grouped[prefix]) grouped[prefix] = [];
    grouped[prefix].push(item);
  }

  const KELOMPOK_LABEL: Record<string, string> = {
    "4": "PENDAPATAN",
    "4.1": "Pendapatan Asli Desa",
    "4.2": "Transfer",
    "4.3": "Pendapatan Lain-lain",
  };

  let totalPendapatan = 0;
  let no = 1;

  for (const items of Object.values(grouped)) {
    const prefix = items[0].kodeRekening.split(".")[0];
    const sectionLabel = KELOMPOK_LABEL[prefix] ?? `Kelompok ${prefix}`;
    y = checkPageBreak(doc, y, 6, H, MB, cols, x);
    y = drawSectionRow(doc, x, y, tableW, sectionLabel, 6);

    let subtotal = 0;
    for (const item of items) {
      y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
      y = drawDataRow(doc, cols, [
        { text: String(no++), align: "center" },
        { text: item.kodeRekening },
        { text: item.namaRekening, indent: 2 },
        { text: item.sumberDana, align: "center" },
        { text: rp(item.anggaran), align: "right" },
      ], x, y, 5.5, no % 2 === 0 ? C_ROW_ALT : undefined);
      subtotal += item.anggaran;
      totalPendapatan += item.anggaran;
    }

    y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
    y = drawTotalRow(doc, x, y, tableW, [
      { x: x + 1.5, text: `Jumlah ${sectionLabel}` },
      { x: x + tableW - 1.5, text: rp(subtotal), align: "right" },
    ]);
  }

  y = checkPageBreak(doc, y, 6, H, MB, cols, x);
  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 1.5, text: "TOTAL PENDAPATAN" },
    { x: x + tableW - 1.5, text: rp(totalPendapatan), align: "right" },
  ]);

  const namaDesa = desa?.namaDesa ?? "—";
  drawTTD(doc, W, H, [
    { title: tglTTD(namaDesa), jabatan: `Kepala Desa ${namaDesa},`, nama: desa?.namaKepala ?? "" },
    { title: "", jabatan: "Sekretaris Desa,", nama: desa?.namaSekdes ?? "" },
  ]);

  drawFooterAllPages(doc, W, H);
  if (returnBlob) return doc.output("blob") as Blob;
  doc.save(p.filename ?? `RAB-Pendapatan_${namaDesa.replace(/ /g, "-")}_${p.tahun}.pdf`);
}

// ─── 13. RAB Pembiayaan ────────────────────────────────────────────────────────

export interface RABPembiayaanProps {
  tahun: string;
  dataDesa: DataDesa | null;
  pembiayaanList: PembiayaanItem[];
  jenisAPBDes?: "APBDes" | "PAK";
  nomorPerdes?: string;
  filename?: string;
}

export async function downloadPDF_RABPembiayaan(p: RABPembiayaanProps, returnBlob = false): Promise<void | Blob> {
  const doc = await newDoc("portrait");
  const W = 210, H = 297, ML = 10, MB = 50;
  const x = ML;
  const desa = p.dataDesa;
  const jenisLabel = p.jenisAPBDes ?? "APBDes";

  let y = drawKop(doc, desa, W);
  y = drawJudul(doc, W, y,
    "RENCANA ANGGARAN BIAYA (RAB) PEMBIAYAAN",
    `${jenisLabel} Tahun Anggaran ${p.tahun}${p.nomorPerdes ? ` — Perdes No. ${p.nomorPerdes}` : ""}`
  );

  const cols: ColDef[] = [
    { label: "No.",           width: 10,  align: "center" },
    { label: "Kode Rekening", width: 32              },
    { label: "Uraian Pembiayaan", width: 84          },
    { label: "Jenis",         width: 22, align: "center" },
    { label: "Jumlah (Rp)",   width: 42, align: "right"  },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);
  y = drawTableHeader(doc, cols, x, y);

  const penerimaan = p.pembiayaanList.filter((i) => i.jenis === "penerimaan");
  const pengeluaran = p.pembiayaanList.filter((i) => i.jenis === "pengeluaran");

  let no = 1;
  let totalPenerimaan = 0;
  let totalPengeluaran = 0;

  y = checkPageBreak(doc, y, 6, H, MB, cols, x);
  y = drawSectionRow(doc, x, y, tableW, "PENERIMAAN PEMBIAYAAN", 6);
  for (const item of penerimaan) {
    y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
    y = drawDataRow(doc, cols, [
      { text: String(no++), align: "center" },
      { text: item.kodeRekening },
      { text: item.namaRekening, indent: 2 },
      { text: "Penerimaan", align: "center" },
      { text: rp(item.anggaran), align: "right" },
    ], x, y, 5.5, no % 2 === 0 ? C_ROW_ALT : undefined);
    totalPenerimaan += item.anggaran;
  }
  y = drawTotalRow(doc, x, y, tableW, [
    { x: x + 1.5, text: "Jumlah Penerimaan Pembiayaan" },
    { x: x + tableW - 1.5, text: rp(totalPenerimaan), align: "right" },
  ]);

  y = checkPageBreak(doc, y, 6, H, MB, cols, x);
  y = drawSectionRow(doc, x, y, tableW, "PENGELUARAN PEMBIAYAAN", 6);
  for (const item of pengeluaran) {
    y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
    y = drawDataRow(doc, cols, [
      { text: String(no++), align: "center" },
      { text: item.kodeRekening },
      { text: item.namaRekening, indent: 2 },
      { text: "Pengeluaran", align: "center" },
      { text: rp(item.anggaran), align: "right" },
    ], x, y, 5.5, no % 2 === 0 ? C_ROW_ALT : undefined);
    totalPengeluaran += item.anggaran;
  }
  y = drawTotalRow(doc, x, y, tableW, [
    { x: x + 1.5, text: "Jumlah Pengeluaran Pembiayaan" },
    { x: x + tableW - 1.5, text: rp(totalPengeluaran), align: "right" },
  ]);

  const netPembiayaan = totalPenerimaan - totalPengeluaran;
  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 1.5, text: "PEMBIAYAAN NETTO (Penerimaan - Pengeluaran)" },
    { x: x + tableW - 1.5, text: rp(netPembiayaan), align: "right" },
  ]);

  const namaDesa = desa?.namaDesa ?? "—";
  drawTTD(doc, W, H, [
    { title: tglTTD(namaDesa), jabatan: `Kepala Desa ${namaDesa},`, nama: desa?.namaKepala ?? "" },
    { title: "", jabatan: "Sekretaris Desa,", nama: desa?.namaSekdes ?? "" },
  ]);

  drawFooterAllPages(doc, W, H);
  if (returnBlob) return doc.output("blob") as Blob;
  doc.save(p.filename ?? `RAB-Pembiayaan_${namaDesa.replace(/ /g, "-")}_${p.tahun}.pdf`);
}

// ─── 14. PAK Global (PAK 1A) ──────────────────────────────────────────────────

export interface PAKGlobalProps {
  tahun: string;
  dataDesa: DataDesa | null;
  pendapatanList: PendapatanItem[];
  belanjaList: KegiatanAPBDes[];
  pembiayaanList: PembiayaanItem[];
  nomorPerdes?: string;
  filename?: string;
}

export async function downloadPDF_PAKGlobal(p: PAKGlobalProps, returnBlob = false): Promise<void | Blob> {
  return downloadPDF_APBDesGlobal({
    ...p,
    jenisAPBDes: "PAK",
    filename: p.filename ?? `PAK-Global_${(p.dataDesa?.namaDesa ?? "Desa").replace(/ /g, "-")}_${p.tahun}.pdf`,
  }, returnBlob);
}

// ─── 15. PAK Per Kegiatan (PAK 1B) ────────────────────────────────────────────

export interface PAKPerKegiatanProps {
  tahun: string;
  dataDesa: DataDesa | null;
  belanjaList: KegiatanAPBDes[];
  realisasiPerRekening?: Record<string, number>;
  nomorPerdes?: string;
  filename?: string;
}

export async function downloadPDF_PAKPerKegiatan(p: PAKPerKegiatanProps, returnBlob = false): Promise<void | Blob> {
  return downloadPDF_APBDesPerKegiatan({
    ...p,
    jenisAPBDes: "PAK",
    filename: p.filename ?? `PAK-PerKegiatan_${(p.dataDesa?.namaDesa ?? "Desa").replace(/ /g, "-")}_${p.tahun}.pdf`,
  }, returnBlob);
}

// ─── 16. PAK Rinci (PAK 1C / RAB PAK) ────────────────────────────────────────

export interface PAKRinciProps {
  tahun: string;
  dataDesa: DataDesa | null;
  belanjaList: KegiatanAPBDes[];
  nomorPerdes?: string;
  filename?: string;
}

export async function downloadPDF_PAKRinci(p: PAKRinciProps, returnBlob = false): Promise<void | Blob> {
  return downloadPDF_APBDesRinci({
    ...p,
    jenisAPBDes: "PAK",
    filename: p.filename ?? `PAK-Rinci_${(p.dataDesa?.namaDesa ?? "Desa").replace(/ /g, "-")}_${p.tahun}.pdf`,
  }, returnBlob);
}

// ─── 17. Laporan per Sumber Dana ──────────────────────────────────────────────

export interface LaporanSumberDanaProps {
  tahun: string;
  dataDesa: DataDesa | null;
  pendapatanList: PendapatanItem[];
  belanjaList: KegiatanAPBDes[];
  pembiayaanList: PembiayaanItem[];
  filename?: string;
}

export async function downloadPDF_LaporanSumberDana(p: LaporanSumberDanaProps, returnBlob = false): Promise<void | Blob> {
  const doc = await newDoc("landscape");
  const W = 297, H = 210, ML = 10, MB = 45;
  const x = ML;
  const desa = p.dataDesa;

  const SUMBER_URUT = ["DD", "ADD", "PAD", "BHPR", "BKP", "BKK", "LAIN"] as const;
  const SUMBER_LABEL: Record<string, string> = {
    DD:   "Dana Desa (DD)",
    ADD:  "Alokasi Dana Desa (ADD)",
    PAD:  "Pendapatan Asli Desa (PAD)",
    BHPR: "Bagi Hasil Pajak & Retribusi",
    BKP:  "Bantuan Keuangan Provinsi",
    BKK:  "Bantuan Keuangan Kabupaten",
    LAIN: "Lain-lain Pendapatan",
  };

  const belanjaSumber: Record<string, number> = {};
  const pendapatanSumber: Record<string, number> = {};
  for (const item of p.pendapatanList) {
    const s = item.sumberDana as string;
    pendapatanSumber[s] = (pendapatanSumber[s] ?? 0) + item.anggaran;
  }
  for (const keg of p.belanjaList) {
    for (const rek of keg.rekeningList) {
      const s = rek.sumberDana as string;
      belanjaSumber[s] = (belanjaSumber[s] ?? 0) + rek.totalPagu;
    }
  }
  const pembiayaanSumber: Record<string, number> = {};
  for (const item of p.pembiayaanList) {
    if (item.sumberDana) {
      const s = item.sumberDana as string;
      pembiayaanSumber[s] = (pembiayaanSumber[s] ?? 0) + item.anggaran;
    }
  }

  let y = drawKop(doc, desa, W);
  y = drawJudul(doc, W, y, "REKAPITULASI APBDes PER SUMBER DANA", `Tahun Anggaran ${p.tahun}`);

  const cols: ColDef[] = [
    { label: "No.",              width: 9,  align: "center" },
    { label: "Sumber Dana",      width: 58             },
    { label: "Pendapatan (Rp)",  width: 42, align: "right" },
    { label: "Belanja (Rp)",     width: 42, align: "right" },
    { label: "Pembiayaan (Rp)",  width: 40, align: "right" },
    { label: "Surplus/Defisit (Rp)", width: 42, align: "right" },
    { label: "% Belanja",        width: 22, align: "right" },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);
  y = drawTableHeader(doc, cols, x, y);

  const totalBelanja = Object.values(belanjaSumber).reduce((s, v) => s + v, 0);

  let no = 1;
  let sumPend = 0, sumBel = 0, sumPem = 0;

  for (const kode of SUMBER_URUT) {
    const pend = pendapatanSumber[kode] ?? 0;
    const bel  = belanjaSumber[kode] ?? 0;
    const pem  = pembiayaanSumber[kode] ?? 0;
    if (pend === 0 && bel === 0 && pem === 0) continue;

    const surplusDefisit = pend - bel + pem;
    const pctBelanja = totalBelanja > 0 ? ((bel / totalBelanja) * 100).toFixed(1) + "%" : "-";

    y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
    y = drawDataRow(doc, cols, [
      { text: String(no++), align: "center" },
      { text: SUMBER_LABEL[kode] ?? kode },
      { text: rp(pend), align: "right" },
      { text: rp(bel),  align: "right" },
      { text: rp(pem),  align: "right" },
      { text: rp(surplusDefisit), align: "right",
        color: surplusDefisit < 0 ? [220, 38, 38] : C_SUCCESS },
      { text: pctBelanja, align: "right" },
    ], x, y, 5.5, no % 2 === 0 ? C_ROW_ALT : undefined);

    sumPend += pend; sumBel += bel; sumPem += pem;
  }

  const netTotal = sumPend - sumBel + sumPem;
  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 1.5, text: "TOTAL" },
    { x: x + 9 + 58 + 42 - 1.5, text: rp(sumPend), align: "right" },
    { x: x + 9 + 58 + 42 + 42 - 1.5, text: rp(sumBel), align: "right" },
    { x: x + 9 + 58 + 42 + 42 + 40 - 1.5, text: rp(sumPem), align: "right" },
    { x: x + 9 + 58 + 42 + 42 + 40 + 42 - 1.5, text: rp(netTotal), align: "right" },
    { x: x + tableW - 1.5, text: "100%", align: "right" },
  ]);

  y += 4;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C_MUTED);
  const totalPendapatan = Object.values(pendapatanSumber).reduce((s, v) => s + v, 0);
  doc.text(
    `Total Pendapatan: ${rp(totalPendapatan)}   |   Total Belanja: ${rp(totalBelanja)}   |   Surplus/Defisit: ${rp(totalPendapatan - totalBelanja)}`,
    W / 2, y, { align: "center" }
  );

  const namaDesa = desa?.namaDesa ?? "—";
  drawTTD(doc, W, H, [
    { title: tglTTD(namaDesa), jabatan: `Kepala Desa ${namaDesa},`, nama: desa?.namaKepala ?? "" },
  ]);

  drawFooterAllPages(doc, W, H);
  if (returnBlob) return doc.output("blob") as Blob;
  doc.save(p.filename ?? `LaporanSumberDana_${namaDesa.replace(/ /g, "-")}_${p.tahun}.pdf`);
}

// ─── 18. Proporsi Belanja Operasional vs Pembangunan ──────────────────────────

export interface ProporsiBelanjaProps {
  tahun: string;
  dataDesa: DataDesa | null;
  belanjaList: KegiatanAPBDes[];
  filename?: string;
}

export async function downloadPDF_ProporsiBelanjaOperasional(p: ProporsiBelanjaProps, returnBlob = false): Promise<void | Blob> {
  const doc = await newDoc("portrait");
  const W = 210, H = 297, ML = 10, MB = 50;
  const x = ML;
  const desa = p.dataDesa;

  const BIDANG_LABEL: Record<string, string> = {
    "1": "Bid. 1 - Penyelenggaraan Pemerintahan Desa",
    "2": "Bid. 2 - Pelaksanaan Pembangunan Desa",
    "3": "Bid. 3 - Pembinaan Kemasyarakatan Desa",
    "4": "Bid. 4 - Pemberdayaan Masyarakat Desa",
    "5": "Bid. 5 - Penanggulangan Bencana & Darurat",
  };
  const BIDANG_KATEGORI: Record<string, "operasional" | "pembangunan"> = {
    "1": "operasional",
    "2": "pembangunan",
    "3": "pembangunan",
    "4": "pembangunan",
    "5": "pembangunan",
  };

  const perBidang: Record<string, { label: string; total: number; kategori: string }> = {};
  for (const keg of p.belanjaList) {
    const bid = keg.bidangKode;
    if (!perBidang[bid]) {
      perBidang[bid] = {
        label: BIDANG_LABEL[bid] ?? `Bidang ${bid}`,
        total: 0,
        kategori: BIDANG_KATEGORI[bid] ?? "pembangunan",
      };
    }
    perBidang[bid].total += keg.totalPagu ?? 0;
  }

  const totalBelanja = Object.values(perBidang).reduce((s, v) => s + v.total, 0);
  const totalOperasional = Object.values(perBidang)
    .filter((v) => v.kategori === "operasional")
    .reduce((s, v) => s + v.total, 0);
  const totalPembangunan = totalBelanja - totalOperasional;
  const pctOperasional = totalBelanja > 0 ? (totalOperasional / totalBelanja) * 100 : 0;
  const pctPembangunan = totalBelanja > 0 ? (totalPembangunan / totalBelanja) * 100 : 0;

  let y = drawKop(doc, desa, W);
  y = drawJudul(doc, W, y,
    "PROPORSI BELANJA OPERASIONAL DAN PEMBANGUNAN",
    `Tahun Anggaran ${p.tahun}`
  );

  const cols: ColDef[] = [
    { label: "No.",          width: 10,  align: "center" },
    { label: "Uraian Bidang", width: 98             },
    { label: "Kategori",     width: 24, align: "center" },
    { label: "Total (Rp)",   width: 42, align: "right"  },
    { label: "%",            width: 16, align: "right"  },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);
  y = drawTableHeader(doc, cols, x, y);

  let no = 1;
  for (const [bid, data] of Object.entries(perBidang).sort((a, b) => a[0].localeCompare(b[0]))) {
    if (data.total === 0) continue;
    const pct = totalBelanja > 0 ? ((data.total / totalBelanja) * 100).toFixed(1) + "%" : "-";
    y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
    y = drawDataRow(doc, cols, [
      { text: String(no++), align: "center" },
      { text: data.label, indent: 1 },
      { text: data.kategori === "operasional" ? "Operasional" : "Pembangunan",
        align: "center",
        color: data.kategori === "operasional" ? C_WARNING : C_SUCCESS },
      { text: rp(data.total), align: "right" },
      { text: pct, align: "right" },
    ], x, y, 5.5, no % 2 === 0 ? C_ROW_ALT : undefined);
    void bid;
  }

  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 1.5, text: "TOTAL BELANJA" },
    { x: x + tableW - 16 - 1.5, text: rp(totalBelanja), align: "right" },
    { x: x + tableW - 1.5, text: "100%", align: "right" },
  ]);

  // Kotak ringkasan
  y += 6;
  const boxW = tableW;
  const boxH = 28;
  doc.setDrawColor(...C_BORDER);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, boxW, boxH, 2, 2, "S");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C_HEADER_BG);
  doc.text("RINGKASAN PROPORSI BELANJA", x + boxW / 2, y + 5, { align: "center" });

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C_WARNING);
  doc.text("Operasional (Bidang 1):", x + 4, y + 11);
  doc.setFont("helvetica", "bold");
  doc.text(rp(totalOperasional), x + boxW / 2 + 10, y + 11, { align: "right" });
  doc.text(pctOperasional.toFixed(2) + "%", x + boxW - 4, y + 11, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C_SUCCESS);
  doc.text("Pembangunan (Bidang 2–5):", x + 4, y + 17);
  doc.setFont("helvetica", "bold");
  doc.text(rp(totalPembangunan), x + boxW / 2 + 10, y + 17, { align: "right" });
  doc.text(pctPembangunan.toFixed(2) + "%", x + boxW - 4, y + 17, { align: "right" });

  doc.setLineWidth(0.2);
  doc.setDrawColor(...C_BORDER);
  doc.line(x + 4, y + 19.5, x + boxW - 4, y + 19.5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C_HEADER_BG);
  doc.text("Total Belanja:", x + 4, y + 24);
  doc.text(rp(totalBelanja), x + boxW / 2 + 10, y + 24, { align: "right" });
  doc.text("100%", x + boxW - 4, y + 24, { align: "right" });

  const namaDesa = desa?.namaDesa ?? "—";
  drawTTD(doc, W, H, [
    { title: tglTTD(namaDesa), jabatan: `Kepala Desa ${namaDesa},`, nama: desa?.namaKepala ?? "" },
  ]);

  drawFooterAllPages(doc, W, H);
  if (returnBlob) return doc.output("blob") as Blob;
  doc.save(p.filename ?? `ProporsiBelanjaOperasional_${namaDesa.replace(/ /g, "-")}_${p.tahun}.pdf`);
}
