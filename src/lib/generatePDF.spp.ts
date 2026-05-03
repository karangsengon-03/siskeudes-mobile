// src/lib/generatePDF.spp.ts
// ─────────────────────────────────────────────────────────────────────────────
// PDF DOKUMEN PENATAUSAHAAN (SPP / PENCAIRAN / KUITANSI / SPJ)
//   #26 downloadPDF_SPP1         — SPP Lembar 1 (Permohonan)
//   #27 downloadPDF_SPP2Panjar   — SPP Lembar 2 Panjar
//   #28 downloadPDF_SPP2Definitif — SPP Lembar 2 Definitif / Pembiayaan
//   #29 downloadPDF_CAIR         — Bukti Pencairan Kas
//   #30 downloadPDF_KWT          — Kuitansi per Rincian
//   #31 downloadPDF_KWTSemua     — Semua Kuitansi dalam Satu SPP
//   #32 downloadPDF_SPTB         — Surat Pernyataan Tanggung Jawab Belanja
//   #33 downloadPDF_LP           — Laporan Pertanggungjawaban Panjar
//   #34 downloadPDF_SPJDokumen   — Dokumen SPJ
// ─────────────────────────────────────────────────────────────────────────────

import type { DataDesa } from "@/hooks/useMaster";
import type { SPPItem } from "@/lib/types";
import {
  newDoc, rp, tglTTD, formatTgl, nowStr,
  C_DIVIDER, C_TEXT, C_MUTED, C_HEADER_BG, C_HEADER_TEXT,
  C_GRAND_BG, C_TOTAL_BG, C_WARNING, C_BORDER,
  drawKop, drawJudul, drawFooterAllPages, drawTableHeader,
  drawDataRow, drawGrandTotalRow, drawTTD, drawIsianRow,
} from "@/lib/generatePDF.shared";
import type { ColDef, TTDBlock } from "@/lib/generatePDF.shared";

// ─── Tipe Props ───────────────────────────────────────────────────────────────

export interface SPP8Props {
  dataDesa: DataDesa | null;
  tahun: string;
  spp: SPPItem;
}

export interface CAIR8Props {
  dataDesa: DataDesa | null;
  tahun: string;
  spp: SPPItem;
}

export interface KWT8Props {
  dataDesa: DataDesa | null;
  tahun: string;
  spp: SPPItem;
  rincianId: string;
}

export interface KWTAllProps {
  dataDesa: DataDesa | null;
  tahun: string;
  spp: SPPItem;
}

export interface SPTBProps {
  dataDesa: DataDesa | null;
  tahun: string;
  spp: SPPItem;
}

export interface LPProps {
  dataDesa: DataDesa | null;
  tahun: string;
  spp: SPPItem;
  spj: {
    nomorSPJ: string;
    tanggal: string;
    nilaiSPP: number;
    nilaiRealisasi: number;
    sisaPanjar: number;
    totalPajak: number;
  };
}

export interface SPJ8Props {
  dataDesa: DataDesa | null;
  tahun: string;
  spj: {
    id: string;
    nomorSPJ: string;
    tanggal: string;
    nomorSPP: string;
    kegiatanNama: string;
    nilaiSPP: number;
    nilaiRealisasi: number;
    sisaPanjar: number;
    totalPajak: number;
    pajakList: Record<string, {
      kode: string;
      nama: string;
      tarif: number;
      dasarPengenaan: number;
      jumlahPajak: number;
    }>;
  };
  spp: SPPItem;
}

// ─── Helper: separator garis dalam dokumen ────────────────────────────────────

function drawSeparator(doc: ReturnType<typeof Object.create>, x: number, y: number, pageW: number): void {
  doc.setDrawColor(...C_DIVIDER);
  doc.setLineWidth(0.4);
  doc.line(x, y, pageW - x, y);
}

// ─── 26. SPP Lembar 1 ─────────────────────────────────────────────────────────

export async function downloadPDF_SPP1(p: SPP8Props, returnBlob = false): Promise<void | Blob> {
  const doc = await newDoc("portrait");
  const W = 210, H = 297, x = 15;

  let y = drawKop(doc, p.dataDesa, W);
  y = drawJudul(doc, W, y,
    "SURAT PERMINTAAN PEMBAYARAN (SPP)",
    `Nomor: ${p.spp.nomorSPP}  |  Jenis: ${p.spp.jenis.toUpperCase()}`
  );
  drawSeparator(doc, x, y, W);
  y += 6;

  // Bagian I — identitas
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...C_HEADER_BG);
  doc.text("I.  PERMOHONAN PEMBAYARAN", x, y);
  y += 5;

  const isianRows: [string, string][] = [
    ["Desa",             p.dataDesa?.namaDesa      ?? "-"],
    ["Kecamatan",        p.dataDesa?.kecamatan     ?? "-"],
    ["Kabupaten",        p.dataDesa?.kabupaten     ?? "-"],
    ["Tahun Anggaran",   p.tahun],
    ["Nomor SPP",        p.spp.nomorSPP],
    ["Tanggal",          formatTgl(p.spp.tanggal)],
    ["Jenis SPP",        p.spp.jenis.toUpperCase()],
    ["Kegiatan",         p.spp.kegiatanNama],
    ["Uraian",           p.spp.uraian],
    ["Media Pembayaran", p.spp.mediaPembayaran === "tunai" ? "Kas Tunai" : "Transfer Bank"],
  ];
  for (const [lbl, val] of isianRows) {
    y = drawIsianRow(doc, x, y, lbl, val, W);
    y += 1;
  }
  y += 4;

  // Bagian II — rincian anggaran
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...C_HEADER_BG);
  doc.text("II.  RINCIAN ANGGARAN BELANJA", x, y);
  y += 5;

  const cols: ColDef[] = [
    { label: "No",             width: 10, align: "center" },
    { label: "Kode Rekening",  width: 35              },
    { label: "Uraian Rekening", width: 90             },
    { label: "Jumlah (Rp)",    width: 40, align: "right"  },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);
  y = drawTableHeader(doc, cols, x, y);

  Object.values(p.spp.rincianSPP).forEach((r, i) => {
    y = drawDataRow(doc, cols, [
      { text: String(i + 1), align: "center" },
      { text: r.kodeRekening },
      { text: r.namaRekening },
      { text: rp(r.jumlah), align: "right" },
    ], x, y);
  });

  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 1.5, text: "JUMLAH" },
    { x: x + tableW - 1.5, text: rp(p.spp.totalJumlah), align: "right" },
  ]);
  y += 6;

  const isPembiayaan = p.spp.jenis === "Pembiayaan";
  const ttdBlocks: TTDBlock[] = isPembiayaan
    ? [{ title: "Hormat Kami,", jabatan: "Kepala Urusan Keuangan", nama: p.dataDesa?.namaKaur ?? "" }]
    : [{ title: "Hormat Kami,", jabatan: "Pelaksana Kegiatan",     nama: p.dataDesa?.namaPelaksana ?? "" }];

  drawTTD(doc, W, H, ttdBlocks);
  drawFooterAllPages(doc, W, H);

  if (returnBlob) return doc.output("blob") as Blob;
  doc.save(`SPP1_${p.spp.nomorSPP.replace(/\//g, "-")}.pdf`);
}

// ─── 27. SPP Lembar 2 Panjar ─────────────────────────────────────────────────

export async function downloadPDF_SPP2Panjar(p: SPP8Props, returnBlob = false): Promise<void | Blob> {
  const doc = await newDoc("portrait");
  const W = 210, H = 297, x = 15;

  let y = drawKop(doc, p.dataDesa, W);
  y = drawJudul(doc, W, y,
    "SURAT PERMINTAAN PEMBAYARAN PANJAR (SPP-UM)",
    `Lembar 2 — Persetujuan  |  Nomor: ${p.spp.nomorSPP}`
  );
  drawSeparator(doc, x, y, W);
  y += 6;

  const isianRows: [string, string][] = [
    ["Yang Bertanda Tangan", `Pelaksana Kegiatan: ${p.dataDesa?.namaPelaksana ?? "-"}`],
    ["Kegiatan",  p.spp.kegiatanNama],
    ["Nomor SPP", p.spp.nomorSPP],
    ["Tanggal SPP", formatTgl(p.spp.tanggal)],
    ["Uraian",    p.spp.uraian],
  ];
  for (const [lbl, val] of isianRows) {
    y = drawIsianRow(doc, x, y, lbl, val, W);
    y += 1;
  }
  y += 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C_HEADER_BG);
  doc.text("Memohon uang muka (panjar) sejumlah:", W / 2, y, { align: "center" });
  y += 6;

  doc.setFillColor(...C_GRAND_BG);
  doc.roundedRect(W / 2 - 40, y, 80, 10, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...C_HEADER_TEXT);
  doc.text(`Rp ${rp(p.spp.totalJumlah)}`, W / 2, y + 6.8, { align: "center" });
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C_TEXT);
  const pernyataan = [
    "Dengan ini menyatakan bahwa uang muka tersebut akan digunakan untuk keperluan",
    "pelaksanaan kegiatan sebagaimana dimaksud dan akan dipertanggungjawabkan dalam",
    "bentuk Surat Pertanggungjawaban (SPJ) setelah kegiatan selesai dilaksanakan.",
  ];
  for (const ln of pernyataan) {
    doc.text(ln, W / 2, y, { align: "center" });
    y += 4.5;
  }

  drawTTD(doc, W, H, [
    { title: "Mengetahui,",  jabatan: `Sekretaris Desa ${p.dataDesa?.namaDesa ?? ""}`, nama: p.dataDesa?.namaSekdes ?? "" },
    { title: "Menyetujui,",  jabatan: `Kepala Desa ${p.dataDesa?.namaDesa ?? ""}`,    nama: p.dataDesa?.namaKepala ?? "" },
    { title: "Hormat Kami,", jabatan: "Pelaksana Kegiatan",                            nama: p.dataDesa?.namaPelaksana ?? "" },
  ]);

  drawFooterAllPages(doc, W, H);
  if (returnBlob) return doc.output("blob") as Blob;
  doc.save(`SPP2_Panjar_${p.spp.nomorSPP.replace(/\//g, "-")}.pdf`);
}

// ─── 28. SPP Lembar 2 Definitif / Pembiayaan ─────────────────────────────────

export async function downloadPDF_SPP2Definitif(p: SPP8Props, returnBlob = false): Promise<void | Blob> {
  const doc = await newDoc("portrait");
  const W = 210, H = 297, x = 15;
  const labelJenis = p.spp.jenis === "Pembiayaan" ? "PEMBIAYAAN (SPP-PBY)" : "DEFINITIF (SPP-LS)";

  let y = drawKop(doc, p.dataDesa, W);
  y = drawJudul(doc, W, y,
    `SURAT PERMINTAAN PEMBAYARAN ${labelJenis}`,
    `Lembar 2 — Persetujuan  |  Nomor: ${p.spp.nomorSPP}`
  );
  drawSeparator(doc, x, y, W);
  y += 6;

  const isianRows: [string, string][] = [
    ["Kegiatan",         p.spp.kegiatanNama],
    ["Nomor SPP",        p.spp.nomorSPP],
    ["Tanggal SPP",      formatTgl(p.spp.tanggal)],
    ["Uraian",           p.spp.uraian],
    ["Media Pembayaran", p.spp.mediaPembayaran === "tunai" ? "Kas Tunai" : "Transfer Bank"],
  ];
  for (const [lbl, val] of isianRows) {
    y = drawIsianRow(doc, x, y, lbl, val, W);
    y += 1;
  }
  y += 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C_HEADER_BG);
  doc.text("Jumlah yang dimohonkan:", W / 2, y, { align: "center" });
  y += 6;

  doc.setFillColor(...C_GRAND_BG);
  doc.roundedRect(W / 2 - 40, y, 80, 10, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...C_HEADER_TEXT);
  doc.text(`Rp ${rp(p.spp.totalJumlah)}`, W / 2, y + 6.8, { align: "center" });
  y += 16;

  const cols: ColDef[] = [
    { label: "No",             width: 10, align: "center" },
    { label: "Kode Rekening",  width: 35              },
    { label: "Uraian",         width: 85              },
    { label: "Jumlah (Rp)",    width: 45, align: "right"  },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);
  y = drawTableHeader(doc, cols, x, y);
  Object.values(p.spp.rincianSPP).forEach((r, i) => {
    y = drawDataRow(doc, cols, [
      { text: String(i + 1), align: "center" },
      { text: r.kodeRekening },
      { text: r.namaRekening },
      { text: rp(r.jumlah), align: "right" },
    ], x, y);
  });
  drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 1.5, text: "JUMLAH" },
    { x: x + tableW - 1.5, text: rp(p.spp.totalJumlah), align: "right" },
  ]);

  const isPembiayaan = p.spp.jenis === "Pembiayaan";
  drawTTD(doc, W, H, [
    { title: "Menyetujui,",  jabatan: `Kepala Desa ${p.dataDesa?.namaDesa ?? ""}`, nama: p.dataDesa?.namaKepala ?? "" },
    { title: "Mengetahui,",  jabatan: "Bendahara Desa",                            nama: p.dataDesa?.namaBendahara ?? "" },
    { title: "Mengetahui,",  jabatan: "Sekretaris Desa",                           nama: p.dataDesa?.namaSekdes ?? "" },
    { title: "Hormat Kami,", jabatan: isPembiayaan ? "Kepala Urusan Keuangan" : "Pelaksana Kegiatan",
      nama: isPembiayaan ? (p.dataDesa?.namaKaur ?? "") : (p.dataDesa?.namaPelaksana ?? "") },
  ]);

  drawFooterAllPages(doc, W, H);
  if (returnBlob) return doc.output("blob") as Blob;
  doc.save(`SPP2_Definitif_${p.spp.nomorSPP.replace(/\//g, "-")}.pdf`);
}

// ─── 29. Bukti Pencairan Kas (CAIR) ──────────────────────────────────────────

export async function downloadPDF_CAIR(p: CAIR8Props, returnBlob = false): Promise<void | Blob> {
  const doc = await newDoc("portrait");
  const W = 210, H = 297, x = 15;

  let y = drawKop(doc, p.dataDesa, W);
  y = drawJudul(doc, W, y,
    "BUKTI PENCAIRAN KAS",
    `Nomor: ${p.spp.nomorPencairan ?? p.spp.nomorSPP}  |  Tanggal: ${formatTgl(p.spp.dicairkanTanggal ?? p.spp.tanggal)}`
  );
  drawSeparator(doc, x, y, W);
  y += 6;

  const isianRows: [string, string][] = [
    ["Nomor SPP",        p.spp.nomorSPP],
    ["Tanggal SPP",      formatTgl(p.spp.tanggal)],
    ["Jenis SPP",        p.spp.jenis.toUpperCase()],
    ["Kegiatan",         p.spp.kegiatanNama],
    ["Uraian",           p.spp.uraian],
    ["Media Pembayaran", p.spp.mediaPembayaran === "tunai" ? "Kas Tunai" : "Transfer Bank"],
  ];
  for (const [lbl, val] of isianRows) {
    y = drawIsianRow(doc, x, y, lbl, val, W);
    y += 1;
  }
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C_HEADER_BG);
  doc.text("Jumlah yang dicairkan:", W / 2, y, { align: "center" });
  y += 6;

  doc.setFillColor(...C_GRAND_BG);
  doc.roundedRect(W / 2 - 45, y, 90, 12, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...C_HEADER_TEXT);
  doc.text(`Rp ${rp(p.spp.totalJumlah)}`, W / 2, y + 8.2, { align: "center" });
  y += 18;

  const cols: ColDef[] = [
    { label: "No",            width: 10, align: "center" },
    { label: "Kode Rekening", width: 35              },
    { label: "Uraian",        width: 85              },
    { label: "Jumlah (Rp)",   width: 45, align: "right"  },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);
  y = drawTableHeader(doc, cols, x, y);
  Object.values(p.spp.rincianSPP).forEach((r, i) => {
    y = drawDataRow(doc, cols, [
      { text: String(i + 1), align: "center" },
      { text: r.kodeRekening },
      { text: r.namaRekening },
      { text: rp(r.jumlah), align: "right" },
    ], x, y);
  });
  drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 1.5, text: "JUMLAH" },
    { x: x + tableW - 1.5, text: rp(p.spp.totalJumlah), align: "right" },
  ]);

  // Dua TTD atas + Kades di tengah bawah
  drawTTD(doc, W, H, [
    { title: "Menerima,",     jabatan: "Pelaksana Kegiatan", nama: p.dataDesa?.namaPelaksana ?? "" },
    { title: "Membayarkan,",  jabatan: "Bendahara Desa",     nama: p.dataDesa?.namaBendahara ?? "" },
  ]);

  const yKades = H - 42;
  const cx = W / 2;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C_TEXT);
  doc.text("Mengetahui,", cx, yKades, { align: "center" });
  doc.text(`Kepala Desa ${p.dataDesa?.namaDesa ?? ""}`, cx, yKades + 4.5, { align: "center" });
  doc.setLineWidth(0.3);
  doc.setDrawColor(...C_MUTED);
  doc.line(cx - 25, yKades + 22, cx + 25, yKades + 22);
  doc.setFont("helvetica", "bold");
  doc.text(p.dataDesa?.namaKepala ?? "(                    )", cx, yKades + 26, { align: "center" });

  drawFooterAllPages(doc, W, H);
  if (returnBlob) return doc.output("blob") as Blob;
  doc.save(`CAIR_${p.spp.nomorSPP.replace(/\//g, "-")}.pdf`);
}

// ─── 30. Kuitansi per Rincian (KWT) ──────────────────────────────────────────

export async function downloadPDF_KWT(p: KWT8Props, returnBlob = false): Promise<void | Blob> {
  const doc = await newDoc("portrait");
  const W = 210, H = 297, x = 15;

  const rincian = p.spp.rincianSPP[p.rincianId];
  if (!rincian) {
    if (returnBlob) return doc.output("blob") as Blob;
    doc.save("KWT_error.pdf");
    return;
  }

  let y = drawKop(doc, p.dataDesa, W);
  y = drawJudul(doc, W, y,
    "KUITANSI PEMBAYARAN (KWT)",
    `Ref SPP: ${p.spp.nomorSPP}  |  Tanggal: ${formatTgl(p.spp.dicairkanTanggal ?? p.spp.tanggal)}`
  );
  drawSeparator(doc, x, y, W);
  y += 6;

  const isianRows: [string, string][] = [
    ["Telah diterima dari", p.dataDesa?.namaDesa ?? "-"],
    ["Selaku",              "Bendahara Desa"],
    ["Kegiatan",            p.spp.kegiatanNama],
    ["Rekening",            `${rincian.kodeRekening} — ${rincian.namaRekening}`],
    ["Uraian",              p.spp.uraian],
    ["Nomor SPP",           p.spp.nomorSPP],
    ["Tanggal SPP",         formatTgl(p.spp.tanggal)],
  ];
  for (const [lbl, val] of isianRows) {
    y = drawIsianRow(doc, x, y, lbl, val, W);
    y += 1;
  }
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C_HEADER_BG);
  doc.text("Jumlah uang:", W / 2, y, { align: "center" });
  y += 6;

  doc.setFillColor(...C_GRAND_BG);
  doc.roundedRect(W / 2 - 45, y, 90, 12, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...C_HEADER_TEXT);
  doc.text(`Rp ${rp(rincian.jumlah)}`, W / 2, y + 8.2, { align: "center" });
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...C_MUTED);
  doc.text(
    `Dicetak: ${nowStr()}  |  Tahun Anggaran ${p.tahun}  |  Desa ${p.dataDesa?.namaDesa ?? "-"}`,
    W / 2, y, { align: "center" }
  );

  drawTTD(doc, W, H, [
    { title: "Membayarkan,", jabatan: "Bendahara Desa",    nama: p.dataDesa?.namaBendahara ?? "" },
    { title: "Menerima,",    jabatan: "Pelaksana Kegiatan", nama: p.dataDesa?.namaPelaksana ?? "" },
  ]);

  drawFooterAllPages(doc, W, H);
  if (returnBlob) return doc.output("blob") as Blob;
  const safeRef = `${p.spp.nomorSPP.replace(/\//g, "-")}_${rincian.kodeRekening.replace(/\./g, "")}`;
  doc.save(`KWT_${safeRef}.pdf`);
}

// ─── 31. Semua KWT dalam Satu SPP ────────────────────────────────────────────

export async function downloadPDF_KWTSemua(p: KWTAllProps, returnBlob = false): Promise<void | Blob> {
  const rincianArr = Object.values(p.spp.rincianSPP);
  if (!rincianArr.length) return;

  const W = 210, H = 297;
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  for (let idx = 0; idx < rincianArr.length; idx++) {
    if (idx > 0) doc.addPage();
    const rincian = rincianArr[idx];
    const x = 15;

    let y = drawKop(doc, p.dataDesa, W);
    y = drawJudul(doc, W, y,
      "KUITANSI PEMBAYARAN (KWT)",
      `Ref SPP: ${p.spp.nomorSPP}  |  KWT ${idx + 1} dari ${rincianArr.length}`
    );
    doc.setDrawColor(...C_DIVIDER);
    doc.setLineWidth(0.4);
    doc.line(x, y, W - x, y);
    y += 6;

    const isianRows: [string, string][] = [
      ["Telah diterima dari", p.dataDesa?.namaDesa ?? "-"],
      ["Selaku",              "Bendahara Desa"],
      ["Kegiatan",            p.spp.kegiatanNama],
      ["Rekening",            `${rincian.kodeRekening} — ${rincian.namaRekening}`],
      ["Uraian",              p.spp.uraian],
      ["Nomor SPP",           p.spp.nomorSPP],
      ["Tanggal SPP",         formatTgl(p.spp.tanggal)],
    ];
    for (const [lbl, val] of isianRows) {
      y = drawIsianRow(doc, x, y, lbl, val, W);
      y += 1;
    }
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...C_HEADER_BG);
    doc.text("Jumlah uang:", W / 2, y, { align: "center" });
    y += 6;

    doc.setFillColor(...C_GRAND_BG);
    doc.roundedRect(W / 2 - 45, y, 90, 12, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...C_HEADER_TEXT);
    doc.text(`Rp ${rp(rincian.jumlah)}`, W / 2, y + 8.2, { align: "center" });
    y += 16;

    drawTTD(doc, W, H, [
      { title: "Membayarkan,", jabatan: "Bendahara Desa",     nama: p.dataDesa?.namaBendahara ?? "" },
      { title: "Menerima,",    jabatan: "Pelaksana Kegiatan", nama: p.dataDesa?.namaPelaksana ?? "" },
    ]);
  }

  drawFooterAllPages(doc, W, H);
  if (returnBlob) return doc.output("blob") as Blob;
  doc.save(`KWT_Semua_${p.spp.nomorSPP.replace(/\//g, "-")}.pdf`);
}

// ─── 32. SPTB ─────────────────────────────────────────────────────────────────

export async function downloadPDF_SPTB(p: SPTBProps, returnBlob = false): Promise<void | Blob> {
  const doc = await newDoc("portrait");
  const W = 210, H = 297, x = 15;

  let y = drawKop(doc, p.dataDesa, W);
  y = drawJudul(doc, W, y,
    "SURAT PERNYATAAN TANGGUNG JAWAB BELANJA",
    `Nomor SPP: ${p.spp.nomorSPP}  |  Tanggal: ${formatTgl(p.spp.tanggal)}`
  );
  drawSeparator(doc, x, y, W);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C_TEXT);

  const pembukaan = `Yang bertanda tangan di bawah ini, selaku Pelaksana Kegiatan "${p.spp.kegiatanNama}", Desa ${p.dataDesa?.namaDesa ?? "-"}, Kecamatan ${p.dataDesa?.kecamatan ?? "-"}, Kabupaten ${p.dataDesa?.kabupaten ?? "-"}, Tahun Anggaran ${p.tahun}, menyatakan bahwa:`;
  const lns: string[] = doc.splitTextToSize(pembukaan, W - 2 * x);
  doc.text(lns, x, y);
  y += lns.length * 4.5 + 4;

  const poin = [
    "1.  Kuitansi/bukti pembayaran terlampir adalah sah dan dapat dipertanggungjawabkan.",
    "2.  Apabila di kemudian hari terdapat kerugian negara atas realisasi belanja tersebut, kami bersedia",
    "     mengganti sesuai ketentuan peraturan perundang-undangan.",
  ];
  for (const pt of poin) {
    doc.text(pt, x, y);
    y += 4.5;
  }
  y += 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...C_HEADER_BG);
  doc.text("Daftar Kuitansi Pembayaran:", x, y);
  y += 5;

  const cols: ColDef[] = [
    { label: "No",             width: 10, align: "center" },
    { label: "Kode Rekening",  width: 35              },
    { label: "Uraian Rekening", width: 85             },
    { label: "Jumlah (Rp)",    width: 45, align: "right"  },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);
  y = drawTableHeader(doc, cols, x, y);
  Object.values(p.spp.rincianSPP).forEach((r, i) => {
    y = drawDataRow(doc, cols, [
      { text: String(i + 1), align: "center" },
      { text: r.kodeRekening },
      { text: r.namaRekening },
      { text: rp(r.jumlah), align: "right" },
    ], x, y);
  });
  drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 1.5, text: "TOTAL" },
    { x: x + tableW - 1.5, text: rp(p.spp.totalJumlah), align: "right" },
  ]);

  drawTTD(doc, W, H, [
    { title: "Hormat Kami,", jabatan: "Pelaksana Kegiatan", nama: p.dataDesa?.namaPelaksana ?? "" },
  ]);

  drawFooterAllPages(doc, W, H);
  if (returnBlob) return doc.output("blob") as Blob;
  doc.save(`SPTB_${p.spp.nomorSPP.replace(/\//g, "-")}.pdf`);
}

// ─── 33. LP — Laporan Pertanggungjawaban Panjar ───────────────────────────────

export async function downloadPDF_LP(p: LPProps, returnBlob = false): Promise<void | Blob> {
  const doc = await newDoc("portrait");
  const W = 210, H = 297, x = 15;

  let y = drawKop(doc, p.dataDesa, W);
  y = drawJudul(doc, W, y,
    "LAPORAN PERTANGGUNGJAWABAN PANJAR",
    `Nomor SPJ: ${p.spj.nomorSPJ}  |  Ref SPP: ${p.spp.nomorSPP}`
  );
  drawSeparator(doc, x, y, W);
  y += 6;

  const isianRows: [string, string][] = [
    ["Kegiatan",    p.spp.kegiatanNama],
    ["Nomor SPP",   p.spp.nomorSPP],
    ["Tanggal SPP", formatTgl(p.spp.tanggal)],
    ["Nomor SPJ",   p.spj.nomorSPJ],
    ["Tanggal SPJ", formatTgl(p.spj.tanggal)],
    ["Uraian",      p.spp.uraian],
  ];
  for (const [lbl, val] of isianRows) {
    y = drawIsianRow(doc, x, y, lbl, val, W);
    y += 1;
  }
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...C_HEADER_BG);
  doc.text("Realisasi Penggunaan Panjar:", x, y);
  y += 5;

  const cols: ColDef[] = [
    { label: "Keterangan",  width: 110              },
    { label: "Jumlah (Rp)", width: 65, align: "right" },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);
  y = drawTableHeader(doc, cols, x, y);

  const realisasiRows: [string, number, boolean][] = [
    ["Nilai Panjar yang Dicairkan (SPP)",           p.spj.nilaiSPP,       false],
    ["Realisasi Belanja (berdasarkan kuitansi)",     p.spj.nilaiRealisasi, false],
    ["Potongan Pajak",                               p.spj.totalPajak,     false],
    ["Sisa Panjar Dikembalikan",                     p.spj.sisaPanjar,     true ],
  ];

  for (const [label, val, isSisa] of realisasiRows) {
    y = drawDataRow(doc, cols, [
      { text: label, bold: isSisa },
      { text: rp(val), align: "right", bold: isSisa,
        color: isSisa && val > 0 ? C_WARNING : undefined },
    ], x, y, 5.5, isSisa ? C_TOTAL_BG : undefined);
  }

  const check = p.spj.nilaiRealisasi + p.spj.totalPajak + p.spj.sisaPanjar;
  const selisih = p.spj.nilaiSPP - check;
  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 1.5, text: "Selisih (harus 0)" },
    { x: x + tableW - 1.5, text: rp(selisih), align: "right" },
  ]);

  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...C_MUTED);
  doc.text(
    `* Sisa panjar sebesar Rp ${rp(p.spj.sisaPanjar)} telah dikembalikan ke kas desa pada tanggal ${formatTgl(p.spj.tanggal)}.`,
    x, y
  );

  drawTTD(doc, W, H, [
    { title: "Mengetahui,",  jabatan: `Sekretaris Desa ${p.dataDesa?.namaDesa ?? ""}`, nama: p.dataDesa?.namaSekdes ?? "" },
    { title: "Hormat Kami,", jabatan: "Pelaksana Kegiatan",                            nama: p.dataDesa?.namaPelaksana ?? "" },
  ]);

  drawFooterAllPages(doc, W, H);
  if (returnBlob) return doc.output("blob") as Blob;
  doc.save(`LP_${p.spj.nomorSPJ.replace(/\//g, "-")}.pdf`);
}

// ─── 34. Dokumen SPJ ─────────────────────────────────────────────────────────

export async function downloadPDF_SPJDokumen(p: SPJ8Props, returnBlob = false): Promise<void | Blob> {
  const doc = await newDoc("portrait");
  const W = 210, H = 297, x = 15;

  let y = drawKop(doc, p.dataDesa, W);
  y = drawJudul(doc, W, y,
    "SURAT PERTANGGUNGJAWABAN (SPJ)",
    `Nomor: ${p.spj.nomorSPJ}  |  Tanggal: ${formatTgl(p.spj.tanggal)}`
  );
  drawSeparator(doc, x, y, W);
  y += 6;

  const isianRows: [string, string][] = [
    ["Nomor SPJ",            p.spj.nomorSPJ],
    ["Tanggal SPJ",          formatTgl(p.spj.tanggal)],
    ["Nomor SPP Referensi",  p.spj.nomorSPP],
    ["Kegiatan",             p.spj.kegiatanNama],
    ["Desa / Tahun",         `${p.dataDesa?.namaDesa ?? "-"} / ${p.tahun}`],
  ];
  for (const [lbl, val] of isianRows) {
    y = drawIsianRow(doc, x, y, lbl, val, W);
    y += 1;
  }
  y += 6;

  // Ringkasan nilai
  const cols: ColDef[] = [
    { label: "Keterangan",  width: 120              },
    { label: "Jumlah (Rp)", width: 55, align: "right" },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);
  y = drawTableHeader(doc, cols, x, y);

  const nilaiRows: [string, number][] = [
    ["Nilai SPP yang Dicairkan",      p.spj.nilaiSPP],
    ["Nilai Realisasi Belanja",        p.spj.nilaiRealisasi],
    ["Total Pajak Dipotong",           p.spj.totalPajak],
    ["Sisa Panjar Dikembalikan",       p.spj.sisaPanjar],
  ];
  for (const [label, val] of nilaiRows) {
    y = drawDataRow(doc, cols, [
      { text: label },
      { text: rp(val), align: "right" },
    ], x, y);
  }

  const efisiensi = p.spj.nilaiSPP - p.spj.nilaiRealisasi - p.spj.totalPajak - p.spj.sisaPanjar;
  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 1.5, text: "Efisiensi (Nilai SPP - Realisasi - Pajak - Sisa)" },
    { x: x + tableW - 1.5, text: rp(efisiensi), align: "right" },
  ]);

  // Detail pajak
  const pajakArr = Object.values(p.spj.pajakList ?? {});
  if (pajakArr.length > 0) {
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...C_HEADER_BG);
    doc.text("Detail Potongan Pajak:", x, y);
    y += 5;

    const colsPajak: ColDef[] = [
      { label: "Kode Pajak",           width: 25, align: "center" },
      { label: "Nama Pajak",           width: 70              },
      { label: "Tarif",                width: 20, align: "center" },
      { label: "Dasar Pengenaan (Rp)", width: 45, align: "right"  },
      { label: "Jumlah Pajak (Rp)",    width: 40, align: "right"  },
    ];
    const totalWP = colsPajak.reduce((s, c) => s + c.width, 0);
    y = drawTableHeader(doc, colsPajak, x, y);
    let totalPajakSum = 0;
    for (const pjk of pajakArr) {
      y = drawDataRow(doc, colsPajak, [
        { text: pjk.kode, align: "center" },
        { text: pjk.nama },
        { text: `${(pjk.tarif * 100).toFixed(1)}%`, align: "center" },
        { text: rp(pjk.dasarPengenaan), align: "right" },
        { text: rp(pjk.jumlahPajak),    align: "right", color: C_WARNING },
      ], x, y);
      totalPajakSum += pjk.jumlahPajak;
    }
    drawGrandTotalRow(doc, x, y, totalWP, [
      { x: x + 1.5, text: "TOTAL PAJAK" },
      { x: x + totalWP - 1.5, text: rp(totalPajakSum), align: "right" },
    ]);
  }

  y = H - 55;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...C_MUTED);
  doc.text(
    "Dokumen ini merupakan pertanggungjawaban resmi atas penggunaan dana desa sesuai Permendagri 20/2018.",
    W / 2, y, { align: "center" }
  );

  drawFooterAllPages(doc, W, H);
  if (returnBlob) return doc.output("blob") as Blob;
  doc.save(`SPJ_${p.spj.nomorSPJ.replace(/\//g, "-")}.pdf`);
}
