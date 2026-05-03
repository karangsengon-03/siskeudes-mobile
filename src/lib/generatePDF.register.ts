// src/lib/generatePDF.register.ts
// ─────────────────────────────────────────────────────────────────────────────
// PDF REGISTER & BUKU PEMBANTU PENATAUSAHAAN
//   #19 downloadPDF_BPKegiatan       — Buku Kas Pembantu Kegiatan
//   #20 downloadPDF_BPPendapatan     — Buku Kas Pembantu Pendapatan
//   #21 downloadPDF_BPPajakPerJenis  — Buku Pembantu Pajak per Jenis
//   #22 downloadPDF_RegisterSPP      — Register SPP
//   #23 downloadPDF_RegisterKWT      — Register Kuitansi
//   #24 downloadPDF_RegisterPencairan — Register Pencairan (CAIR)
//   #25 downloadPDF_RegisterSPJ      — Register SPJ
// ─────────────────────────────────────────────────────────────────────────────

import type { DataDesa } from "@/hooks/useMaster";
import type { SPPItem, SPJItem, PenerimaanItem } from "@/lib/types";
import type { BukuPajakItem } from "@/hooks/useBukuPembantu";
import {
  newDoc, rp, tglTTD, formatTgl, periodeLabel,
  C_ROW_ALT, C_MUTED, C_SUCCESS, C_WARNING, C_TEXT,
  drawKop, drawJudul, drawFooterAllPages, drawTableHeader,
  drawDataRow, drawTotalRow, drawGrandTotalRow, drawTTD,
  checkPageBreak,
} from "@/lib/generatePDF.shared";
import type { ColDef } from "@/lib/generatePDF.shared";

// ─── 19. Buku Kas Pembantu Kegiatan (BPKegiatan) ──────────────────────────────

export interface BPKegiatanRow {
  tanggal: string;
  nomorBukti: string;
  uraian: string;
  debit: number;
  kredit: number;
  saldoBerjalan: number;
}

export interface BPKegiatanProps {
  tahun: string;
  dataDesa: DataDesa | null;
  kegiatanId: string;
  kegiatanNama: string;
  sppList: SPPItem[];
  spjList: SPJItem[];
  bulan?: number;
  filename?: string;
}

export async function downloadPDF_BPKegiatan(p: BPKegiatanProps, returnBlob = false): Promise<void | Blob> {
  const doc = await newDoc("landscape");
  const W = 297, H = 210, ML = 10, MB = 45;
  const x = ML;
  const desa = p.dataDesa;

  const sppKegiatan = p.sppList
    .filter((s) => s.kegiatanId === p.kegiatanId && s.status === "dicairkan")
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  const rows: BPKegiatanRow[] = [];
  let saldo = 0;

  for (const spp of sppKegiatan) {
    saldo -= spp.totalJumlah;
    rows.push({
      tanggal: spp.tanggal,
      nomorBukti: spp.nomorSPP,
      uraian: spp.uraian,
      debit: 0,
      kredit: spp.totalJumlah,
      saldoBerjalan: saldo,
    });

    const spjTerkait = p.spjList.filter((spj) => spj.sppId === spp.id);
    for (const spj of spjTerkait) {
      if (spj.sisaPanjar > 0) {
        saldo += spj.sisaPanjar;
        rows.push({
          tanggal: spj.tanggal,
          nomorBukti: spj.nomorSPJ,
          uraian: `Sisa Panjar — ${spj.nomorSPP}`,
          debit: spj.sisaPanjar,
          kredit: 0,
          saldoBerjalan: saldo,
        });
      }
    }
  }

  const rowsTampil = p.bulan !== undefined
    ? rows.filter((r) => new Date(r.tanggal).getMonth() + 1 === p.bulan)
    : rows;

  let y = drawKop(doc, desa, W);
  y = drawJudul(doc, W, y,
    "BUKU KAS PEMBANTU KEGIATAN",
    `${p.kegiatanNama} — ${periodeLabel(p.bulan, p.tahun)}`
  );

  const cols: ColDef[] = [
    { label: "No.",          width: 9,  align: "center" },
    { label: "Tanggal",      width: 22, align: "center" },
    { label: "Nomor Bukti",  width: 32             },
    { label: "Uraian",       width: 100            },
    { label: "Debit (Rp)",   width: 40, align: "right" },
    { label: "Kredit (Rp)",  width: 40, align: "right" },
    { label: "Saldo (Rp)",   width: 44, align: "right" },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);
  y = drawTableHeader(doc, cols, x, y);

  let no = 1;
  let totalDebit = 0, totalKredit = 0;

  for (const row of rowsTampil) {
    y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
    const isAlt = no % 2 === 0;
    y = drawDataRow(doc, cols, [
      { text: String(no++), align: "center" },
      { text: formatTgl(row.tanggal), align: "center" },
      { text: row.nomorBukti },
      { text: row.uraian },
      { text: row.debit > 0 ? rp(row.debit) : "-", align: "right", color: row.debit > 0 ? C_SUCCESS : C_MUTED },
      { text: row.kredit > 0 ? rp(row.kredit) : "-", align: "right", color: row.kredit > 0 ? C_WARNING : C_MUTED },
      { text: rp(row.saldoBerjalan), align: "right", color: row.saldoBerjalan < 0 ? [220, 38, 38] : C_TEXT },
    ], x, y, 5.5, isAlt ? C_ROW_ALT : undefined);
    totalDebit += row.debit;
    totalKredit += row.kredit;
  }

  const netSaldo = totalDebit - totalKredit;
  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 1.5, text: "TOTAL" },
    { x: x + 9 + 22 + 32 + 100 + 40 - 1.5, text: rp(totalDebit), align: "right" },
    { x: x + 9 + 22 + 32 + 100 + 40 + 40 - 1.5, text: rp(totalKredit), align: "right" },
    { x: x + tableW - 1.5, text: rp(netSaldo), align: "right" },
  ]);

  const namaDesa = desa?.namaDesa ?? "—";
  drawTTD(doc, W, H, [
    { title: tglTTD(namaDesa), jabatan: "Bendahara Desa,", nama: desa?.namaBendahara ?? "" },
  ]);

  drawFooterAllPages(doc, W, H);
  if (returnBlob) return doc.output("blob") as Blob;
  doc.save(p.filename ?? `BPKegiatan_${p.kegiatanId.replace(/\./g, "")}_${p.tahun}.pdf`);
}

// ─── 20. Buku Kas Pembantu Pendapatan (BPPendapatan) ─────────────────────────

export interface BPPendapatanProps {
  tahun: string;
  dataDesa: DataDesa | null;
  penerimaanList: PenerimaanItem[];
  bulan?: number;
  filename?: string;
}

export async function downloadPDF_BPPendapatan(p: BPPendapatanProps, returnBlob = false): Promise<void | Blob> {
  const doc = await newDoc("landscape");
  const W = 297, H = 210, ML = 10, MB = 45;
  const x = ML;
  const desa = p.dataDesa;

  const SUMBER_LABEL: Record<string, string> = {
    DD:   "Dana Desa (DD)",
    ADD:  "Alokasi Dana Desa (ADD)",
    PAD:  "Pendapatan Asli Desa (PAD)",
    BHPR: "Bagi Hasil Pajak & Retribusi",
    BKP:  "Bantuan Keuangan Provinsi",
    BKK:  "Bantuan Keuangan Kabupaten",
    LAIN: "Lain-lain",
  };

  const filtered = p.bulan !== undefined
    ? p.penerimaanList.filter((r) => new Date(r.tanggal).getMonth() + 1 === p.bulan)
    : p.penerimaanList;
  const sorted = [...filtered].sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  let y = drawKop(doc, desa, W);
  y = drawJudul(doc, W, y, "BUKU KAS PEMBANTU PENDAPATAN", periodeLabel(p.bulan, p.tahun));

  const cols: ColDef[] = [
    { label: "No.",           width: 9,  align: "center" },
    { label: "Tanggal",       width: 22, align: "center" },
    { label: "Nomor Bukti",   width: 32             },
    { label: "Sumber Dana",   width: 40             },
    { label: "Jenis",         width: 22, align: "center" },
    { label: "Uraian",        width: 80             },
    { label: "Tunai (Rp)",    width: 38, align: "right" },
    { label: "Bank (Rp)",     width: 38, align: "right" },
    { label: "Jumlah (Rp)",   width: 16, align: "right" },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);
  y = drawTableHeader(doc, cols, x, y);

  let no = 1;
  let totalTunai = 0, totalBank = 0;

  for (const item of sorted) {
    y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
    const isTunai = item.jenisPenerimaan === "tunai";
    const isAlt = no % 2 === 0;
    y = drawDataRow(doc, cols, [
      { text: String(no++), align: "center" },
      { text: formatTgl(item.tanggal), align: "center" },
      { text: item.nomorBukti },
      { text: SUMBER_LABEL[item.sumberDana] ?? item.sumberDana },
      { text: isTunai ? "Tunai" : "Bank", align: "center",
        color: isTunai ? C_WARNING : C_SUCCESS },
      { text: item.uraian },
      { text: isTunai ? rp(item.jumlah) : "-", align: "right",
        color: isTunai ? C_TEXT : C_MUTED },
      { text: !isTunai ? rp(item.jumlah) : "-", align: "right",
        color: !isTunai ? C_TEXT : C_MUTED },
      { text: rp(item.jumlah), align: "right" },
    ], x, y, 5.5, isAlt ? C_ROW_ALT : undefined);
    if (isTunai) totalTunai += item.jumlah;
    else totalBank += item.jumlah;
  }

  const xTunai = x + 9 + 22 + 32 + 40 + 22 + 80 + 38 - 1.5;
  const xBank  = x + 9 + 22 + 32 + 40 + 22 + 80 + 38 + 38 - 1.5;
  const xTotal = x + tableW - 1.5;
  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 1.5, text: "TOTAL" },
    { x: xTunai, text: rp(totalTunai), align: "right" },
    { x: xBank,  text: rp(totalBank),  align: "right" },
    { x: xTotal, text: rp(totalTunai + totalBank), align: "right" },
  ]);

  const namaDesa = desa?.namaDesa ?? "—";
  drawTTD(doc, W, H, [
    { title: tglTTD(namaDesa), jabatan: "Bendahara Desa,", nama: desa?.namaBendahara ?? "" },
  ]);

  drawFooterAllPages(doc, W, H);
  if (returnBlob) return doc.output("blob") as Blob;
  doc.save(p.filename ?? `BPPendapatan_${p.tahun}.pdf`);
}

// ─── 21. Buku Pembantu Pajak per Jenis ────────────────────────────────────────

export interface BPPajakPerJenisProps {
  tahun: string;
  dataDesa: DataDesa | null;
  bukuPajakList: BukuPajakItem[];
  kodePajak: string;
  namaPajak: string;
  bulan?: number;
  filename?: string;
}

export async function downloadPDF_BPPajakPerJenis(p: BPPajakPerJenisProps, returnBlob = false): Promise<void | Blob> {
  const doc = await newDoc("portrait");
  const W = 210, H = 297, ML = 10, MB = 45;
  const x = ML;
  const desa = p.dataDesa;

  const filtered = p.bukuPajakList
    .filter((b) => b.kodePajak === p.kodePajak)
    .filter((b) => p.bulan === undefined || new Date(b.tanggal).getMonth() + 1 === p.bulan)
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  let y = drawKop(doc, desa, W);
  y = drawJudul(doc, W, y,
    `BUKU PEMBANTU PAJAK — ${p.namaPajak.toUpperCase()}`,
    periodeLabel(p.bulan, p.tahun)
  );

  const cols: ColDef[] = [
    { label: "No.",          width: 9,  align: "center" },
    { label: "Tanggal",      width: 22, align: "center" },
    { label: "No. SPJ",      width: 28             },
    { label: "No. SPP",      width: 28             },
    { label: "Uraian Kegiatan", width: 55          },
    { label: "Dasar (Rp)",   width: 27, align: "right" },
    { label: "Tarif",        width: 13, align: "center" },
    { label: "Jumlah (Rp)",  width: 28, align: "right" },
    { label: "Status",       width: 16, align: "center" },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);
  y = drawTableHeader(doc, cols, x, y);

  let no = 1;
  let totalDipungut = 0, totalDisetor = 0;

  for (const item of filtered) {
    y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
    const isAlt = no % 2 === 0;
    const sudahDisetor = item.sudahDisetor;
    y = drawDataRow(doc, cols, [
      { text: String(no++), align: "center" },
      { text: formatTgl(item.tanggal), align: "center" },
      { text: item.nomorSPJ },
      { text: item.nomorSPP },
      { text: item.kegiatanNama },
      { text: rp(item.dasarPengenaan), align: "right" },
      { text: (item.tarif * 100).toFixed(0) + "%", align: "center" },
      { text: rp(item.jumlah), align: "right" },
      { text: sudahDisetor ? "Setor ✓" : "Belum",
        align: "center",
        color: sudahDisetor ? C_SUCCESS : C_WARNING,
        bold: true },
    ], x, y, 5.5, isAlt ? C_ROW_ALT : undefined);
    totalDipungut += item.jumlah;
    if (sudahDisetor) totalDisetor += item.jumlah;
  }

  const sisaBelumDisetor = totalDipungut - totalDisetor;
  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 1.5, text: "TOTAL DIPUNGUT" },
    { x: x + tableW - 1.5, text: rp(totalDipungut), align: "right" },
  ]);

  y += 3;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C_TEXT);
  doc.text(`Total Disetor   : ${rp(totalDisetor)}`, x + 2, y);
  y += 4.5;
  doc.setTextColor(...(sisaBelumDisetor > 0 ? C_WARNING : C_SUCCESS));
  doc.text(`Sisa Belum Setor: ${rp(sisaBelumDisetor)}`, x + 2, y);

  const namaDesa = desa?.namaDesa ?? "—";
  drawTTD(doc, W, H, [
    { title: tglTTD(namaDesa), jabatan: "Bendahara Desa,", nama: desa?.namaBendahara ?? "" },
  ]);

  drawFooterAllPages(doc, W, H);
  if (returnBlob) return doc.output("blob") as Blob;
  doc.save(p.filename ?? `BPPajakPerJenis_${p.kodePajak}_${p.tahun}.pdf`);
}

// ─── 22. Register SPP ─────────────────────────────────────────────────────────

export interface RegisterSPPProps {
  tahun: string;
  dataDesa: DataDesa | null;
  sppList: SPPItem[];
  bulan?: number;
  filename?: string;
}

export async function downloadPDF_RegisterSPP(p: RegisterSPPProps, returnBlob = false): Promise<void | Blob> {
  const doc = await newDoc("landscape");
  const W = 297, H = 210, ML = 10, MB = 45;
  const x = ML;
  const desa = p.dataDesa;

  const filtered = p.bulan !== undefined
    ? p.sppList.filter((s) => new Date(s.tanggal).getMonth() + 1 === p.bulan)
    : p.sppList;
  const sorted = [...filtered].sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  let y = drawKop(doc, desa, W);
  y = drawJudul(doc, W, y, "REGISTER SPP", periodeLabel(p.bulan, p.tahun));

  const cols: ColDef[] = [
    { label: "No.",          width: 9,  align: "center" },
    { label: "No. SPP",      width: 32             },
    { label: "Tanggal",      width: 22, align: "center" },
    { label: "Jenis",        width: 22, align: "center" },
    { label: "Kegiatan",     width: 80             },
    { label: "Uraian",       width: 50             },
    { label: "Nilai (Rp)",   width: 38, align: "right" },
    { label: "Media",        width: 18, align: "center" },
    { label: "Status",       width: 22, align: "center" },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);
  y = drawTableHeader(doc, cols, x, y);

  let no = 1;
  let totalNilai = 0, totalDicairkan = 0;

  for (const spp of sorted) {
    y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
    const dicairkan = spp.status === "dicairkan";
    const isAlt = no % 2 === 0;
    const statusColor = dicairkan ? C_SUCCESS : spp.status === "dikonfirmasi" ? C_WARNING : C_MUTED;
    y = drawDataRow(doc, cols, [
      { text: String(no++), align: "center" },
      { text: spp.nomorSPP },
      { text: formatTgl(spp.tanggal), align: "center" },
      { text: spp.jenis, align: "center" },
      { text: spp.kegiatanNama },
      { text: spp.uraian },
      { text: rp(spp.totalJumlah), align: "right" },
      { text: spp.mediaPembayaran === "tunai" ? "Tunai" : "Bank", align: "center" },
      { text: spp.status === "dicairkan" ? "Cair" : spp.status === "dikonfirmasi" ? "Konfirmasi" : "Draft",
        align: "center", color: statusColor, bold: dicairkan },
    ], x, y, 5.5, isAlt ? C_ROW_ALT : undefined);
    totalNilai += spp.totalJumlah;
    if (dicairkan) totalDicairkan += spp.totalJumlah;
  }

  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 1.5, text: `TOTAL (${sorted.length} SPP)` },
    { x: x + tableW - 1.5, text: rp(totalNilai), align: "right" },
  ]);

  y += 3;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C_TEXT);
  doc.text(`Total Dicairkan : ${rp(totalDicairkan)}`, x + 2, y);
  y += 4.5;
  doc.text(`Sisa Belum Cair : ${rp(totalNilai - totalDicairkan)}`, x + 2, y);

  const namaDesa = desa?.namaDesa ?? "—";
  drawTTD(doc, W, H, [
    { title: tglTTD(namaDesa), jabatan: "Bendahara Desa,", nama: desa?.namaBendahara ?? "" },
  ]);

  drawFooterAllPages(doc, W, H);
  if (returnBlob) return doc.output("blob") as Blob;
  doc.save(p.filename ?? `RegisterSPP_${p.tahun}.pdf`);
}

// ─── 23. Register KWT (Kuitansi) ─────────────────────────────────────────────

export interface RegisterKWTRow {
  tanggal: string;
  nomorSPP: string;
  nomorSPJ: string;
  kegiatanNama: string;
  uraian: string;
  nilaiKotor: number;
  pajak: number;
  nilaiBersih: number;
}

export interface RegisterKWTProps {
  tahun: string;
  dataDesa: DataDesa | null;
  sppList: SPPItem[];
  spjList: SPJItem[];
  bulan?: number;
  filename?: string;
}

export async function downloadPDF_RegisterKWT(p: RegisterKWTProps, returnBlob = false): Promise<void | Blob> {
  const doc = await newDoc("landscape");
  const W = 297, H = 210, ML = 10, MB = 45;
  const x = ML;
  const desa = p.dataDesa;

  const rows: RegisterKWTRow[] = [];
  const sppDicairkan = p.sppList.filter((s) => s.status === "dicairkan");
  const spjMap: Record<string, SPJItem> = {};
  for (const spj of p.spjList) spjMap[spj.sppId] = spj;

  for (const spp of sppDicairkan) {
    const spj = spjMap[spp.id];
    const totalPajak = spj ? spj.totalPajak : 0;
    const rincianArr = Object.values(spp.rincianSPP);
    const totalRincian = spp.totalJumlah;
    for (const rin of rincianArr) {
      const pajakProporsional = totalRincian > 0 ? (rin.jumlah / totalRincian) * totalPajak : 0;
      rows.push({
        tanggal: spp.dicairkanTanggal ?? spp.tanggal,
        nomorSPP: spp.nomorSPP,
        nomorSPJ: spj?.nomorSPJ ?? "-",
        kegiatanNama: spp.kegiatanNama,
        uraian: rin.namaRekening,
        nilaiKotor: rin.jumlah,
        pajak: Math.round(pajakProporsional),
        nilaiBersih: rin.jumlah - Math.round(pajakProporsional),
      });
    }
  }

  const rowsTampil = p.bulan !== undefined
    ? rows.filter((r) => new Date(r.tanggal).getMonth() + 1 === p.bulan)
    : rows;
  rowsTampil.sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  let y = drawKop(doc, desa, W);
  y = drawJudul(doc, W, y, "REGISTER KUITANSI (KWT)", periodeLabel(p.bulan, p.tahun));

  const cols: ColDef[] = [
    { label: "No.",          width: 9,  align: "center" },
    { label: "Tanggal",      width: 22, align: "center" },
    { label: "No. SPP",      width: 28             },
    { label: "No. SPJ",      width: 28             },
    { label: "Kegiatan",     width: 60             },
    { label: "Uraian Rekening", width: 55          },
    { label: "Nilai Kotor (Rp)", width: 35, align: "right" },
    { label: "Pajak (Rp)",   width: 28, align: "right" },
    { label: "Nilai Bersih (Rp)", width: 32, align: "right" },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);
  y = drawTableHeader(doc, cols, x, y);

  let no = 1;
  let sumKotor = 0, sumPajak = 0, sumBersih = 0;

  for (const row of rowsTampil) {
    y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
    const isAlt = no % 2 === 0;
    y = drawDataRow(doc, cols, [
      { text: String(no++), align: "center" },
      { text: formatTgl(row.tanggal), align: "center" },
      { text: row.nomorSPP },
      { text: row.nomorSPJ },
      { text: row.kegiatanNama },
      { text: row.uraian },
      { text: rp(row.nilaiKotor), align: "right" },
      { text: row.pajak > 0 ? rp(row.pajak) : "-", align: "right",
        color: row.pajak > 0 ? C_WARNING : C_MUTED },
      { text: rp(row.nilaiBersih), align: "right" },
    ], x, y, 5.5, isAlt ? C_ROW_ALT : undefined);
    sumKotor += row.nilaiKotor;
    sumPajak += row.pajak;
    sumBersih += row.nilaiBersih;
  }

  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 1.5, text: `TOTAL (${rowsTampil.length} KWT)` },
    { x: x + 9 + 22 + 28 + 28 + 60 + 55 + 35 - 1.5, text: rp(sumKotor), align: "right" },
    { x: x + 9 + 22 + 28 + 28 + 60 + 55 + 35 + 28 - 1.5, text: rp(sumPajak), align: "right" },
    { x: x + tableW - 1.5, text: rp(sumBersih), align: "right" },
  ]);

  const namaDesa = desa?.namaDesa ?? "—";
  drawTTD(doc, W, H, [
    { title: tglTTD(namaDesa), jabatan: "Bendahara Desa,", nama: desa?.namaBendahara ?? "" },
  ]);

  drawFooterAllPages(doc, W, H);
  if (returnBlob) return doc.output("blob") as Blob;
  doc.save(p.filename ?? `RegisterKWT_${p.tahun}.pdf`);
}

// ─── 24. Register Pencairan (CAIR) ────────────────────────────────────────────

export interface RegisterPencairanProps {
  tahun: string;
  dataDesa: DataDesa | null;
  sppList: SPPItem[];
  bulan?: number;
  filename?: string;
}

export async function downloadPDF_RegisterPencairan(p: RegisterPencairanProps, returnBlob = false): Promise<void | Blob> {
  const doc = await newDoc("landscape");
  const W = 297, H = 210, ML = 10, MB = 50;
  const x = ML;
  const desa = p.dataDesa;

  const dicairkan = p.sppList.filter((s) => s.status === "dicairkan");
  const filtered = p.bulan !== undefined
    ? dicairkan.filter((s) => new Date(s.dicairkanTanggal ?? s.tanggal).getMonth() + 1 === p.bulan)
    : dicairkan;
  const sorted = [...filtered].sort((a, b) =>
    (a.dicairkanTanggal ?? a.tanggal).localeCompare(b.dicairkanTanggal ?? b.tanggal)
  );

  let y = drawKop(doc, desa, W);
  y = drawJudul(doc, W, y, "REGISTER PENCAIRAN (CAIR)", periodeLabel(p.bulan, p.tahun));

  const cols: ColDef[] = [
    { label: "No.",          width: 9,  align: "center" },
    { label: "Tgl Cair",     width: 22, align: "center" },
    { label: "No. SPP",      width: 32             },
    { label: "No. Pencairan", width: 32            },
    { label: "Kegiatan",     width: 76             },
    { label: "Jenis SPP",    width: 24, align: "center" },
    { label: "Media",        width: 18, align: "center" },
    { label: "Nilai (Rp)",   width: 42, align: "right" },
    { label: "Uraian",       width: 42             },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);
  y = drawTableHeader(doc, cols, x, y);

  let no = 1;
  let totalNilai = 0;

  for (const spp of sorted) {
    y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
    const isAlt = no % 2 === 0;
    const media = spp.mediaPembayaran === "tunai" ? "Tunai" : "Bank";
    y = drawDataRow(doc, cols, [
      { text: String(no++), align: "center" },
      { text: formatTgl(spp.dicairkanTanggal ?? spp.tanggal), align: "center" },
      { text: spp.nomorSPP },
      { text: spp.nomorPencairan ?? "-" },
      { text: spp.kegiatanNama },
      { text: spp.jenis, align: "center" },
      { text: media, align: "center",
        color: spp.mediaPembayaran === "tunai" ? C_WARNING : C_SUCCESS },
      { text: rp(spp.totalJumlah), align: "right" },
      { text: spp.uraian },
    ], x, y, 5.5, isAlt ? C_ROW_ALT : undefined);
    totalNilai += spp.totalJumlah;
  }

  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 1.5, text: `TOTAL DICAIRKAN (${sorted.length} SPP)` },
    { x: x + tableW - 42 - 1.5, text: rp(totalNilai), align: "right" },
  ]);

  const namaDesa = desa?.namaDesa ?? "—";
  drawTTD(doc, W, H, [
    { title: tglTTD(namaDesa), jabatan: "Pelaksana Kegiatan,", nama: "" },
    { title: tglTTD(namaDesa), jabatan: `Kepala Desa ${namaDesa},`, nama: desa?.namaKepala ?? "" },
    { title: tglTTD(namaDesa), jabatan: "Bendahara Desa,", nama: desa?.namaBendahara ?? "" },
  ]);

  drawFooterAllPages(doc, W, H);
  if (returnBlob) return doc.output("blob") as Blob;
  doc.save(p.filename ?? `RegisterPencairan_${p.tahun}.pdf`);
}

// ─── 25. Register SPJ ─────────────────────────────────────────────────────────

export interface RegisterSPJProps {
  tahun: string;
  dataDesa: DataDesa | null;
  spjList: SPJItem[];
  sppList: SPPItem[];
  bulan?: number;
  filename?: string;
}

export async function downloadPDF_RegisterSPJ(p: RegisterSPJProps, returnBlob = false): Promise<void | Blob> {
  const doc = await newDoc("landscape");
  const W = 297, H = 210, ML = 10, MB = 20;
  const x = ML;
  const desa = p.dataDesa;

  const filtered = p.bulan !== undefined
    ? p.spjList.filter((s) => new Date(s.tanggal).getMonth() + 1 === p.bulan)
    : p.spjList;
  const sorted = [...filtered].sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  let y = drawKop(doc, desa, W);
  y = drawJudul(doc, W, y, "REGISTER SPJ", periodeLabel(p.bulan, p.tahun));

  const cols: ColDef[] = [
    { label: "No.",             width: 9,  align: "center" },
    { label: "No. SPJ",         width: 28             },
    { label: "Tanggal",         width: 22, align: "center" },
    { label: "No. SPP",         width: 28             },
    { label: "Kegiatan",        width: 70             },
    { label: "Nilai SPP (Rp)",  width: 36, align: "right" },
    { label: "Realisasi (Rp)",  width: 36, align: "right" },
    { label: "Sisa Panjar (Rp)", width: 36, align: "right" },
    { label: "Pajak (Rp)",      width: 32, align: "right" },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);
  y = drawTableHeader(doc, cols, x, y);

  let no = 1;
  let sumNilaiSPP = 0, sumRealisasi = 0, sumSisaPanjar = 0, sumPajak = 0;

  for (const spj of sorted) {
    y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
    const isAlt = no % 2 === 0;
    const hasSisa = spj.sisaPanjar > 0;
    y = drawDataRow(doc, cols, [
      { text: String(no++), align: "center" },
      { text: spj.nomorSPJ },
      { text: formatTgl(spj.tanggal), align: "center" },
      { text: spj.nomorSPP },
      { text: spj.kegiatanNama },
      { text: rp(spj.nilaiSPP), align: "right" },
      { text: rp(spj.nilaiRealisasi), align: "right" },
      { text: hasSisa ? rp(spj.sisaPanjar) : "-",
        align: "right",
        color: hasSisa ? C_WARNING : C_MUTED },
      { text: spj.totalPajak > 0 ? rp(spj.totalPajak) : "-",
        align: "right",
        color: spj.totalPajak > 0 ? C_TEXT : C_MUTED },
    ], x, y, 5.5, isAlt ? C_ROW_ALT : undefined);
    sumNilaiSPP    += spj.nilaiSPP;
    sumRealisasi   += spj.nilaiRealisasi;
    sumSisaPanjar  += spj.sisaPanjar;
    sumPajak       += spj.totalPajak;
  }

  const xNilai     = x + 9 + 28 + 22 + 28 + 70 + 36 - 1.5;
  const xRealisasi = x + 9 + 28 + 22 + 28 + 70 + 36 + 36 - 1.5;
  const xSisa      = x + 9 + 28 + 22 + 28 + 70 + 36 + 36 + 36 - 1.5;
  const xPajak     = x + tableW - 1.5;

  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 1.5, text: `TOTAL (${sorted.length} SPJ)` },
    { x: xNilai,     text: rp(sumNilaiSPP),   align: "right" },
    { x: xRealisasi, text: rp(sumRealisasi),   align: "right" },
    { x: xSisa,      text: rp(sumSisaPanjar),  align: "right" },
    { x: xPajak,     text: rp(sumPajak),       align: "right" },
  ]);

  y += 6;
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...C_MUTED);
  doc.text("* Dokumen ini adalah register administratif — tidak memerlukan tanda tangan.", x, y);

  drawFooterAllPages(doc, W, H);
  if (returnBlob) return doc.output("blob") as Blob;
  doc.save(p.filename ?? `RegisterSPJ_${p.tahun}.pdf`);
}
