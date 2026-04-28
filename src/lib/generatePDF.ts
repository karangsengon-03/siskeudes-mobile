// src/lib/generatePDF.ts
// Client-side PDF generation menggunakan jsPDF (BUKAN @react-pdf/renderer)
// Pola: lazy import jsPDF → build doc → doc.save(filename)
//
// Exported functions (dipanggil dari pelaporan/page.tsx):
//   downloadPDF_APBDesGlobal(props)
//   downloadPDF_APBDesPerKegiatan(props)
//   downloadPDF_APBDesRinci(props)
//   downloadPDF_DPAPerKegiatan(props)
//   downloadPDF_BKUBulanan(props)
//   downloadPDF_BukuKasTunai(props)
//   downloadPDF_BukuBank(props)
//   downloadPDF_BukuPajak(props)
//   downloadPDF_BukuPajakRekap(props)
//   downloadPDF_BukuPanjar(props)
//   downloadPDF_RealisasiSemesterI(props)

import type { DataDesa } from "@/hooks/useMaster";
import type {
  PendapatanItem,
  KegiatanAPBDes,
  PembiayaanItem,
  DPAKegiatan,
  BKUItem,
  SPPItem,
} from "@/lib/types";
import type {
  BukuBankRow,
  BukuKasTunaiRow,
  BukuPajakItem,
  BukuPajakRekapRow,
  BukuPanjarRow,
} from "@/hooks/useBukuPembantu";

// ─── Constants ────────────────────────────────────────────────────────────────

const BULAN_LABEL = [
  "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const BULAN_SINGKAT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agt", "Sep", "Okt", "Nov", "Des",
];

// Warna (RGB tuples)
const C_HEADER_BG: [number, number, number] = [30, 58, 95];
const C_HEADER_TEXT: [number, number, number] = [255, 255, 255];
const C_ROW_ALT: [number, number, number] = [248, 250, 252];
const C_TOTAL_BG: [number, number, number] = [226, 232, 240];
const C_GRAND_BG: [number, number, number] = [15, 23, 42];
const C_BORDER: [number, number, number] = [203, 213, 225];
const C_TEXT: [number, number, number] = [30, 41, 59];
const C_MUTED: [number, number, number] = [100, 116, 139];
const C_PRIMARY: [number, number, number] = [29, 78, 216];
const C_SUCCESS: [number, number, number] = [22, 101, 52];
const C_WARNING: [number, number, number] = [146, 64, 14];

// ─── Helper functions ─────────────────────────────────────────────────────────

function rp(n: number): string {
  return n.toLocaleString("id-ID");
}

function formatTgl(s: string): string {
  if (!s) return "-";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function periodeLabel(bulan?: number, tahun?: string): string {
  if (bulan) return `Bulan ${BULAN_LABEL[bulan]} ${tahun ?? ""}`;
  return `Tahun Anggaran ${tahun ?? ""}`;
}

function persenStr(realisasi: number, anggaran: number): string {
  if (anggaran === 0) return "-";
  return ((realisasi / anggaran) * 100).toFixed(1) + "%";
}

// ─── jsPDF lazy import ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsPDFDoc = any;

async function newDoc(orientation: "portrait" | "landscape"): Promise<JsPDFDoc> {
  const { jsPDF } = await import("jspdf");
  return new jsPDF({ orientation, unit: "mm", format: "a4" });
}

// ─── Column definition ────────────────────────────────────────────────────────

interface ColDef {
  label: string;
  width: number;
  align?: "left" | "center" | "right";
}

// ─── Shared drawing helpers ───────────────────────────────────────────────────

function drawDocHeader(
  doc: JsPDFDoc,
  pageW: number,
  title: string,
  subtitle: string,
  info: string
): number {
  let y = 14;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C_HEADER_BG);
  doc.text(title, pageW / 2, y, { align: "center" });
  y += 6;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C_MUTED);
  doc.text(subtitle, pageW / 2, y, { align: "center" });
  y += 5;
  doc.text(info, pageW / 2, y, { align: "center" });
  y += 3;
  doc.setDrawColor(...C_PRIMARY);
  doc.setLineWidth(0.6);
  doc.line(12, y, pageW - 12, y);
  return y + 5;
}

function drawTableHeader(
  doc: JsPDFDoc,
  cols: ColDef[],
  x: number,
  y: number,
  rowH = 6
): number {
  const totalW = cols.reduce((s, c) => s + c.width, 0);
  doc.setFillColor(...C_HEADER_BG);
  doc.rect(x, y, totalW, rowH, "F");
  doc.setDrawColor(...C_BORDER);
  doc.setLineWidth(0.2);
  doc.rect(x, y, totalW, rowH, "S");
  doc.setTextColor(...C_HEADER_TEXT);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  let cx = x;
  for (const col of cols) {
    const align = col.align ?? "left";
    const textX =
      align === "right" ? cx + col.width - 1.5 :
      align === "center" ? cx + col.width / 2 :
      cx + 1.5;
    doc.text(col.label, textX, y + rowH * 0.65, { align });
    cx += col.width;
  }
  return y + rowH;
}

interface CellVal {
  text: string;
  align?: "left" | "center" | "right";
  bold?: boolean;
  color?: [number, number, number];
  indent?: number;
}

function drawDataRow(
  doc: JsPDFDoc,
  cols: ColDef[],
  cells: CellVal[],
  x: number,
  y: number,
  rowH = 5.5,
  bg?: [number, number, number],
  fontSize = 7
): number {
  const totalW = cols.reduce((s, c) => s + c.width, 0);
  if (bg) {
    doc.setFillColor(...bg);
    doc.rect(x, y, totalW, rowH, "F");
  }
  doc.setDrawColor(...C_BORDER);
  doc.setLineWidth(0.15);
  doc.rect(x, y, totalW, rowH, "S");

  doc.setFontSize(fontSize);
  let cx = x;
  for (let i = 0; i < cols.length; i++) {
    const col = cols[i];
    const cell = cells[i] ?? { text: "" };
    doc.setFont("helvetica", cell.bold ? "bold" : "normal");
    doc.setTextColor(...(cell.color ?? C_TEXT));
    const align = cell.align ?? col.align ?? "left";
    const indent = cell.indent ?? 0;
    const textX =
      align === "right" ? cx + col.width - 1.5 :
      align === "center" ? cx + col.width / 2 :
      cx + 1.5 + indent;
    doc.text(cell.text, textX, y + rowH * 0.65, { align });
    cx += col.width;
  }
  return y + rowH;
}

function drawGrandTotalRow(
  doc: JsPDFDoc,
  x: number,
  y: number,
  totalW: number,
  kvPairs: { x: number; text: string; align?: "left" | "right" | "center" }[],
  rowH = 6
): number {
  doc.setFillColor(...C_GRAND_BG);
  doc.rect(x, y, totalW, rowH, "F");
  doc.setDrawColor(...C_BORDER);
  doc.setLineWidth(0.2);
  doc.rect(x, y, totalW, rowH, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...C_HEADER_TEXT);
  for (const kv of kvPairs) {
    doc.text(kv.text, kv.x, y + rowH * 0.65, { align: kv.align ?? "left" });
  }
  return y + rowH;
}

function drawTotalRow(
  doc: JsPDFDoc,
  x: number,
  y: number,
  totalW: number,
  kvPairs: { x: number; text: string; align?: "left" | "right" | "center" }[],
  rowH = 5.5
): number {
  doc.setFillColor(...C_TOTAL_BG);
  doc.rect(x, y, totalW, rowH, "F");
  doc.setDrawColor(...C_BORDER);
  doc.setLineWidth(0.15);
  doc.rect(x, y, totalW, rowH, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...C_TEXT);
  for (const kv of kvPairs) {
    doc.text(kv.text, kv.x, y + rowH * 0.65, { align: kv.align ?? "left" });
  }
  return y + rowH;
}

function drawSectionRow(
  doc: JsPDFDoc,
  x: number,
  y: number,
  totalW: number,
  label: string,
  rowH = 5.5
): number {
  doc.setFillColor(241, 245, 249);
  doc.rect(x, y, totalW, rowH, "F");
  doc.setDrawColor(...C_BORDER);
  doc.setLineWidth(0.15);
  doc.rect(x, y, totalW, rowH, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...C_HEADER_BG);
  doc.text(label, x + 1.5, y + rowH * 0.65);
  return y + rowH;
}

function drawTTD(
  doc: JsPDFDoc,
  pageW: number,
  pageH: number,
  signatories: { label: string; nama: string }[]
): void {
  const y = pageH - 36;
  const blockW = (pageW - 24) / signatories.length;
  signatories.forEach((sig, i) => {
    const cx = 12 + i * blockW + blockW / 2;
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C_TEXT);
    const lines = sig.label.split("\n");
    lines.forEach((line, li) => {
      doc.text(line, cx, y + li * 4, { align: "center" });
    });
    doc.setLineWidth(0.2);
    doc.setDrawColor(...C_MUTED);
    doc.line(cx - blockW / 2 + 4, y + 20, cx + blockW / 2 - 4, y + 20);
    doc.setFont("helvetica", "bold");
    doc.text(sig.nama || "— ─ —", cx, y + 23, { align: "center" });
  });
}

function checkPageBreak(
  doc: JsPDFDoc,
  y: number,
  rowH: number,
  pageH: number,
  bottomMargin: number,
  cols: ColDef[],
  x: number,
  headerRowH = 6
): number {
  if (y + rowH > pageH - bottomMargin) {
    doc.addPage();
    y = 14;
    y = drawTableHeader(doc, cols, x, y, headerRowH);
  }
  return y;
}

// ─── 1. APBDes Global ─────────────────────────────────────────────────────────

export interface APBDesGlobalProps {
  tahun: string;
  dataDesa: DataDesa | null;
  pendapatanList: PendapatanItem[];
  belanjaList: KegiatanAPBDes[];
  pembiayaanList: PembiayaanItem[];
  filename?: string;
}

export async function downloadPDF_APBDesGlobal(p: APBDesGlobalProps): Promise<void> {
  const doc = await newDoc("portrait");
  const W = 210, H = 297, ML = 12, MB = 40;
  const x = ML;
  const desa = p.dataDesa;
  const subtitle = `Desa ${desa?.namaDesa ?? "—"}, Kecamatan ${desa?.kecamatan ?? "—"}, Kabupaten ${desa?.kabupaten ?? "—"}`;
  let y = drawDocHeader(doc, W, "ANGGARAN PENDAPATAN DAN BELANJA DESA (APBDes)", subtitle, `Tahun Anggaran ${p.tahun}`);

  const cols: ColDef[] = [
    { label: "No", width: 9, align: "center" },
    { label: "Kode Rek.", width: 26 },
    { label: "Uraian", width: 87 },
    { label: "Sumber Dana", width: 19, align: "center" },
    { label: "Anggaran (Rp)", width: 33, align: "right" },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);

  y = drawTableHeader(doc, cols, x, y);

  let rowNo = 1;

  // ── PENDAPATAN ──
  y = drawSectionRow(doc, x, y, tableW, "I. PENDAPATAN");
  const totalPendapatan = p.pendapatanList.reduce((s, i) => s + (i.anggaran ?? 0), 0);
  for (const item of p.pendapatanList) {
    y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
    y = drawDataRow(doc, cols, [
      { text: String(rowNo++), align: "center" },
      { text: item.kodeRekening },
      { text: item.namaRekening },
      { text: item.sumberDana, align: "center" },
      { text: rp(item.anggaran ?? 0), align: "right" },
    ], x, y, 5.5, rowNo % 2 === 0 ? C_ROW_ALT : undefined);
  }
  if (p.pendapatanList.length === 0) {
    y = drawDataRow(doc, cols, [{ text: "" }, { text: "" }, { text: "Belum ada data", color: C_MUTED }, { text: "" }, { text: "" }], x, y, 5.5);
  }
  y = drawTotalRow(doc, x, y, tableW, [{ x: x + 38, text: "JUMLAH PENDAPATAN" }, { x: x + tableW - 1.5, text: rp(totalPendapatan), align: "right" }]);

  // ── BELANJA ──
  y = drawSectionRow(doc, x, y, tableW, "II. BELANJA");
  const totalBelanja = p.belanjaList.reduce((s, k) => s + (k.totalPagu ?? 0), 0);
  for (const k of p.belanjaList) {
    y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
    y = drawDataRow(doc, cols, [
      { text: String(rowNo++), align: "center" },
      { text: k.kodeKegiatan },
      { text: k.namaKegiatan },
      { text: "—", align: "center" },
      { text: rp(k.totalPagu ?? 0), align: "right" },
    ], x, y, 5.5, rowNo % 2 === 0 ? C_ROW_ALT : undefined);
  }
  if (p.belanjaList.length === 0) {
    y = drawDataRow(doc, cols, [{ text: "" }, { text: "" }, { text: "Belum ada data", color: C_MUTED }, { text: "" }, { text: "" }], x, y, 5.5);
  }
  y = drawTotalRow(doc, x, y, tableW, [{ x: x + 38, text: "JUMLAH BELANJA" }, { x: x + tableW - 1.5, text: rp(totalBelanja), align: "right" }]);

  // ── SURPLUS/DEFISIT ──
  y = drawGrandTotalRow(doc, x, y, tableW, [{ x: x + 38, text: "SURPLUS / (DEFISIT)" }, { x: x + tableW - 1.5, text: rp(totalPendapatan - totalBelanja), align: "right" }]);

  // ── PEMBIAYAAN ──
  y = drawSectionRow(doc, x, y, tableW, "III. PEMBIAYAAN");
  y = drawSectionRow(doc, x, y, tableW, "   a. Penerimaan Pembiayaan");
  const penerimaan = p.pembiayaanList.filter((pm) => pm.jenis === "penerimaan");
  const pengeluaran = p.pembiayaanList.filter((pm) => pm.jenis === "pengeluaran");
  const totPenMasuk = penerimaan.reduce((s, i) => s + (i.anggaran ?? 0), 0);
  const totPenKeluar = pengeluaran.reduce((s, i) => s + (i.anggaran ?? 0), 0);

  for (const item of penerimaan) {
    y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
    y = drawDataRow(doc, cols, [
      { text: String(rowNo++), align: "center" },
      { text: item.kodeRekening },
      { text: item.namaRekening },
      { text: "" },
      { text: rp(item.anggaran ?? 0), align: "right" },
    ], x, y, 5.5, rowNo % 2 === 0 ? C_ROW_ALT : undefined);
  }
  y = drawTotalRow(doc, x, y, tableW, [{ x: x + 38, text: "Jumlah Penerimaan Pembiayaan" }, { x: x + tableW - 1.5, text: rp(totPenMasuk), align: "right" }]);

  y = drawSectionRow(doc, x, y, tableW, "   b. Pengeluaran Pembiayaan");
  for (const item of pengeluaran) {
    y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
    y = drawDataRow(doc, cols, [
      { text: String(rowNo++), align: "center" },
      { text: item.kodeRekening },
      { text: item.namaRekening },
      { text: "" },
      { text: rp(item.anggaran ?? 0), align: "right" },
    ], x, y, 5.5, rowNo % 2 === 0 ? C_ROW_ALT : undefined);
  }
  y = drawGrandTotalRow(doc, x, y, tableW, [{ x: x + 38, text: "PEMBIAYAAN NETTO (a - b)" }, { x: x + tableW - 1.5, text: rp(totPenMasuk - totPenKeluar), align: "right" }]);

  drawTTD(doc, W, H, [
    { label: `Mengetahui,\nKepala Desa ${desa?.namaDesa ?? "—"}`, nama: desa?.namaKepala ?? "" },
    { label: "Bendahara Desa,", nama: desa?.namaBendahara ?? "" },
  ]);

  doc.save(p.filename ?? `APBDes-Global_${(desa?.namaDesa ?? "Desa").replace(/ /g, "-")}_${p.tahun}.pdf`);
}

// ─── 2. APBDes Per Kegiatan ───────────────────────────────────────────────────

export interface APBDesPerKegiatanProps {
  tahun: string;
  dataDesa: DataDesa | null;
  belanjaList: KegiatanAPBDes[];
  realisasiPerRekening: Record<string, number>;
  filename?: string;
}

export async function downloadPDF_APBDesPerKegiatan(p: APBDesPerKegiatanProps): Promise<void> {
  const doc = await newDoc("portrait");
  const W = 210, H = 297, ML = 12, MB = 40;
  const x = ML;
  const desa = p.dataDesa;
  const subtitle = `Desa ${desa?.namaDesa ?? "—"}, Kecamatan ${desa?.kecamatan ?? "—"}, Kabupaten ${desa?.kabupaten ?? "—"}`;
  let y = drawDocHeader(doc, W, "APBDes PER KEGIATAN — ANGGARAN & REALISASI", subtitle, `Tahun Anggaran ${p.tahun}`);

  const cols: ColDef[] = [
    { label: "No", width: 9, align: "center" },
    { label: "Kode Rek.", width: 24 },
    { label: "Uraian", width: 78 },
    { label: "Sumber", width: 14, align: "center" },
    { label: "Anggaran (Rp)", width: 28, align: "right" },
    { label: "Realisasi (Rp)", width: 27, align: "right" },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);

  y = drawTableHeader(doc, cols, x, y);

  const totalAnggaran = p.belanjaList.reduce((s, k) => s + (k.totalPagu ?? 0), 0);
  const totalRealisasi = p.belanjaList.reduce((s, k) =>
    s + (k.rekeningList ?? []).reduce((rs, rek) => rs + (p.realisasiPerRekening[rek.kodeRekening] ?? 0), 0), 0);

  let no = 1;
  let altIdx = 0;

  for (const kegiatan of p.belanjaList) {
    y = checkPageBreak(doc, y, 6, H, MB, cols, x);
    const kegReal = (kegiatan.rekeningList ?? []).reduce(
      (rs, rek) => rs + (p.realisasiPerRekening[rek.kodeRekening] ?? 0), 0);

    // Section row: kegiatan
    doc.setFillColor(241, 245, 249);
    doc.rect(x, y, tableW, 5.5, "F");
    doc.setDrawColor(...C_BORDER);
    doc.rect(x, y, tableW, 5.5, "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...C_HEADER_BG);
    doc.text(String(no++), x + 4.5, y + 3.6, { align: "center" });
    doc.text(kegiatan.kodeKegiatan, x + 9 + 1.5, y + 3.6);
    doc.text(kegiatan.namaKegiatan, x + 33 + 1.5, y + 3.6);
    doc.text(rp(kegiatan.totalPagu ?? 0), x + tableW - 27 - 1.5, y + 3.6, { align: "right" });
    doc.text(rp(kegReal), x + tableW - 1.5, y + 3.6, { align: "right" });
    y += 5.5;

    for (const rek of kegiatan.rekeningList ?? []) {
      y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
      const rekReal = p.realisasiPerRekening[rek.kodeRekening] ?? 0;
      y = drawDataRow(doc, cols, [
        { text: "" },
        { text: rek.kodeRekening, indent: 4 },
        { text: rek.namaRekening, indent: 8 },
        { text: rek.sumberDana, align: "center" },
        { text: rp(rek.totalPagu ?? 0), align: "right" },
        { text: rekReal > 0 ? rp(rekReal) : "—", align: "right" },
      ], x, y, 5.5, altIdx++ % 2 === 0 ? undefined : C_ROW_ALT);
    }
  }

  if (p.belanjaList.length === 0) {
    y = drawDataRow(doc, cols, [{ text: "" }, { text: "" }, { text: "Belum ada data", color: C_MUTED }, { text: "" }, { text: "" }, { text: "" }], x, y, 5.5);
  }

  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 35, text: "TOTAL BELANJA" },
    { x: x + tableW - 27 - 1.5, text: rp(totalAnggaran), align: "right" },
    { x: x + tableW - 1.5, text: rp(totalRealisasi), align: "right" },
  ]);

  drawTTD(doc, W, H, [
    { label: `Mengetahui,\nKepala Desa ${desa?.namaDesa ?? "—"}`, nama: desa?.namaKepala ?? "" },
    { label: "Bendahara Desa,", nama: desa?.namaBendahara ?? "" },
  ]);

  doc.save(p.filename ?? `APBDes-PerKegiatan_${(desa?.namaDesa ?? "Desa").replace(/ /g, "-")}_${p.tahun}.pdf`);
}

// ─── 3. APBDes Rinci ─────────────────────────────────────────────────────────

export interface APBDesRinciProps {
  tahun: string;
  dataDesa: DataDesa | null;
  belanjaList: KegiatanAPBDes[];
  filename?: string;
}

export async function downloadPDF_APBDesRinci(p: APBDesRinciProps): Promise<void> {
  const doc = await newDoc("portrait");
  const W = 210, H = 297, ML = 12, MB = 40;
  const x = ML;
  const desa = p.dataDesa;
  const subtitle = `Desa ${desa?.namaDesa ?? "—"}, Kecamatan ${desa?.kecamatan ?? "—"}, Kabupaten ${desa?.kabupaten ?? "—"}`;
  let y = drawDocHeader(doc, W, "APBDes RINCI — RENCANA ANGGARAN BELANJA", subtitle, `Tahun Anggaran ${p.tahun}`);

  const cols: ColDef[] = [
    { label: "No", width: 9, align: "center" },
    { label: "Uraian", width: 80 },
    { label: "Vol.", width: 14, align: "right" },
    { label: "Sat.", width: 14 },
    { label: "Harga Sat. (Rp)", width: 31, align: "right" },
    { label: "Jumlah (Rp)", width: 30, align: "right" },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);

  y = drawTableHeader(doc, cols, x, y);

  const totalBelanja = p.belanjaList.reduce((s, k) => s + (k.totalPagu ?? 0), 0);
  let no = 1;
  let altIdx = 0;

  for (const kegiatan of p.belanjaList) {
    y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
    // Kegiatan row
    doc.setFillColor(241, 245, 249);
    doc.rect(x, y, tableW, 5.5, "F");
    doc.setDrawColor(...C_BORDER);
    doc.rect(x, y, tableW, 5.5, "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...C_HEADER_BG);
    doc.text(String(no++), x + 4.5, y + 3.6, { align: "center" });
    const kegLabel = `[${kegiatan.bidangNama ?? ""} / ${kegiatan.subBidangNama ?? ""}] ${kegiatan.namaKegiatan}`;
    doc.text(kegLabel.substring(0, 72), x + 9 + 1.5, y + 3.6);
    y += 5.5;

    for (const rek of kegiatan.rekeningList ?? []) {
      y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
      // Rekening heading
      doc.setFillColor(248, 250, 252);
      doc.rect(x, y, tableW, 5.5, "F");
      doc.setDrawColor(...C_BORDER);
      doc.rect(x, y, tableW, 5.5, "S");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(...C_TEXT);
      doc.text(`${rek.kodeRekening} — ${rek.namaRekening}`, x + 9 + 1.5, y + 3.6);
      doc.text(rp(rek.totalPagu ?? 0), x + tableW - 1.5, y + 3.6, { align: "right" });
      y += 5.5;

      for (const sub of rek.subItems ?? []) {
        y = checkPageBreak(doc, y, 5, H, MB, cols, x);
        y = drawDataRow(doc, cols, [
          { text: "" },
          { text: sub.uraian, indent: 10 },
          { text: String(sub.volume), align: "right" },
          { text: sub.satuan },
          { text: rp(sub.hargaSatuan), align: "right" },
          { text: rp(sub.jumlah), align: "right" },
        ], x, y, 5, altIdx++ % 2 === 0 ? undefined : C_ROW_ALT, 6.5);
      }
    }

    // Subtotal kegiatan
    y = drawTotalRow(doc, x, y, tableW, [
      { x: x + 10, text: `Total: ${kegiatan.namaKegiatan}` },
      { x: x + tableW - 1.5, text: rp(kegiatan.totalPagu ?? 0), align: "right" },
    ]);
  }

  if (p.belanjaList.length === 0) {
    y = drawDataRow(doc, cols, [{ text: "" }, { text: "Belum ada data", color: C_MUTED }, { text: "" }, { text: "" }, { text: "" }, { text: "" }], x, y, 5.5);
  }

  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 12, text: "TOTAL BELANJA" },
    { x: x + tableW - 1.5, text: rp(totalBelanja), align: "right" },
  ]);

  drawTTD(doc, W, H, [
    { label: `Mengetahui,\nKepala Desa ${desa?.namaDesa ?? "—"}`, nama: desa?.namaKepala ?? "" },
    { label: "Bendahara Desa,", nama: desa?.namaBendahara ?? "" },
  ]);

  doc.save(p.filename ?? `APBDes-Rinci_${(desa?.namaDesa ?? "Desa").replace(/ /g, "-")}_${p.tahun}.pdf`);
}

// ─── 4. DPA Per Kegiatan ──────────────────────────────────────────────────────

export interface DPAPerKegiatanProps {
  tahun: string;
  dataDesa: DataDesa | null;
  belanjaList: KegiatanAPBDes[];
  dpaMap: { [kegiatanId: string]: DPAKegiatan };
  filename?: string;
}

export async function downloadPDF_DPAPerKegiatan(p: DPAPerKegiatanProps): Promise<void> {
  const doc = await newDoc("landscape");
  const W = 297, H = 210, ML = 10, MB = 36;
  const x = ML;
  const desa = p.dataDesa;
  const subtitle = `Desa ${desa?.namaDesa ?? "—"}, Kecamatan ${desa?.kecamatan ?? "—"}, Kabupaten ${desa?.kabupaten ?? "—"}`;
  let y = drawDocHeader(doc, W, "DOKUMEN PELAKSANAAN ANGGARAN (DPA) — RENCANA KAS PER KEGIATAN", subtitle, `Tahun Anggaran ${p.tahun}`);

  const uraianW = 52, paguW = 18, bW = 11, totalDpaW = 18;
  const cols: ColDef[] = [
    { label: "Uraian Kegiatan", width: uraianW },
    { label: "Pagu (Rp)", width: paguW, align: "right" },
    ...BULAN_SINGKAT.map((b) => ({ label: b, width: bW, align: "right" as const })),
    { label: "Total DPA", width: totalDpaW, align: "right" },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);

  y = drawTableHeader(doc, cols, x, y);

  const totalPagu = p.belanjaList.reduce((s, k) => s + (k.totalPagu ?? 0), 0);
  const totalPerBulan: number[] = Array(12).fill(0);
  for (const k of p.belanjaList) {
    const dpa = p.dpaMap[k.id];
    if (!dpa) continue;
    for (let b = 1; b <= 12; b++) {
      totalPerBulan[b - 1] += dpa.bulan?.[String(b)]?.jumlah ?? 0;
    }
  }
  const grandTotalDPA = totalPerBulan.reduce((s, v) => s + v, 0);

  let altIdx = 0;
  for (const kegiatan of p.belanjaList) {
    y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
    const dpa = p.dpaMap[kegiatan.id];
    const totalDPA = dpa?.totalDPA ?? 0;
    const isDPAL = dpa?.isDPAL ?? false;
    y = drawDataRow(doc, cols, [
      { text: `${kegiatan.kodeKegiatan} ${kegiatan.namaKegiatan}${isDPAL ? " ★" : ""}`, bold: isDPAL },
      { text: rp(kegiatan.totalPagu ?? 0), align: "right" },
      ...Array.from({ length: 12 }, (_, idx): CellVal => {
        const jumlah = dpa?.bulan?.[String(idx + 1)]?.jumlah ?? 0;
        return { text: jumlah > 0 ? rp(jumlah) : "", align: "right" };
      }),
      { text: totalDPA > 0 ? rp(totalDPA) : "—", align: "right", bold: true },
    ], x, y, 5.5, altIdx++ % 2 === 0 ? undefined : C_ROW_ALT, 6.5);
  }

  if (p.belanjaList.length === 0) {
    y = drawDataRow(doc, cols, [{ text: "Belum ada data kegiatan", color: C_MUTED }, ...Array(cols.length - 1).fill({ text: "" })], x, y, 5.5);
  }

  // Grand total row manual (banyak kolom)
  doc.setFillColor(...C_GRAND_BG);
  doc.rect(x, y, tableW, 6, "F");
  doc.setDrawColor(...C_BORDER);
  doc.rect(x, y, tableW, 6, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...C_HEADER_TEXT);
  doc.text("TOTAL", x + 1.5, y + 3.9);
  doc.text(rp(totalPagu), x + uraianW + paguW - 1.5, y + 3.9, { align: "right" });
  let bx = x + uraianW + paguW;
  for (let i = 0; i < 12; i++) {
    if (totalPerBulan[i] > 0) {
      doc.text(rp(totalPerBulan[i]), bx + bW - 1.5, y + 3.9, { align: "right" });
    }
    bx += bW;
  }
  doc.text(rp(grandTotalDPA), x + tableW - 1.5, y + 3.9, { align: "right" });
  y += 6;

  if (p.belanjaList.some((k) => p.dpaMap[k.id]?.isDPAL)) {
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C_MUTED);
    doc.text("★ DPAL = Dokumen Pelaksanaan Anggaran Lanjutan (anggaran diluncurkan dari tahun sebelumnya)", x, y + 4);
  }

  drawTTD(doc, W, H, [
    { label: `Mengetahui,\nKepala Desa ${desa?.namaDesa ?? "—"}`, nama: desa?.namaKepala ?? "" },
    { label: "Sekretaris Desa,", nama: desa?.namaSekdes ?? "" },
    { label: "Bendahara Desa,", nama: desa?.namaBendahara ?? "" },
  ]);

  doc.save(p.filename ?? `DPA-PerKegiatan_${(desa?.namaDesa ?? "Desa").replace(/ /g, "-")}_${p.tahun}.pdf`);
}

// ─── 5. BKU Bulanan ───────────────────────────────────────────────────────────

export interface BKUBulananProps {
  tahun: string;
  dataDesa: DataDesa | null;
  bkuList: BKUItem[];
  bulan?: number;
  filename?: string;
}

export async function downloadPDF_BKUBulanan(p: BKUBulananProps): Promise<void> {
  const doc = await newDoc("landscape");
  const W = 297, H = 210, ML = 10, MB = 36;
  const x = ML;
  const desa = p.dataDesa;
  const subtitle = `Desa ${desa?.namaDesa ?? "—"}, Kecamatan ${desa?.kecamatan ?? "—"}, Kabupaten ${desa?.kabupaten ?? "—"}`;
  let y = drawDocHeader(doc, W, "BUKU KAS UMUM (BKU)", subtitle, periodeLabel(p.bulan, p.tahun));

  const cols: ColDef[] = [
    { label: "No", width: 10, align: "center" },
    { label: "Tanggal", width: 22 },
    { label: "No. Referensi", width: 34 },
    { label: "Uraian", width: 93 },
    { label: "Penerimaan (Rp)", width: 36, align: "right" },
    { label: "Pengeluaran (Rp)", width: 36, align: "right" },
    { label: "Saldo (Rp)", width: 36, align: "right" },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);

  y = drawTableHeader(doc, cols, x, y);

  const totalPenerimaan = p.bkuList.reduce((s, b) => s + b.penerimaan, 0);
  const totalPengeluaran = p.bkuList.reduce((s, b) => s + b.pengeluaran, 0);
  const saldoAkhir = p.bkuList.length > 0 ? p.bkuList[p.bkuList.length - 1].saldo : 0;

  if (p.bkuList.length === 0) {
    y = drawDataRow(doc, cols, [{ text: "" }, { text: "" }, { text: "" }, { text: "Belum ada data BKU", color: C_MUTED }, { text: "" }, { text: "" }, { text: "" }], x, y, 5.5);
  } else {
    for (let i = 0; i < p.bkuList.length; i++) {
      y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
      const b = p.bkuList[i];
      y = drawDataRow(doc, cols, [
        { text: String(i + 1), align: "center" },
        { text: formatTgl(b.tanggal) },
        { text: b.nomorRef },
        { text: b.uraian },
        { text: b.penerimaan > 0 ? rp(b.penerimaan) : "—", align: "right" },
        { text: b.pengeluaran > 0 ? rp(b.pengeluaran) : "—", align: "right" },
        { text: rp(b.saldo), align: "right" },
      ], x, y, 5.5, i % 2 === 0 ? undefined : C_ROW_ALT);
    }
  }

  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 68, text: "JUMLAH" },
    { x: x + tableW - 36 - 36 - 1.5, text: rp(totalPenerimaan), align: "right" },
    { x: x + tableW - 36 - 1.5, text: rp(totalPengeluaran), align: "right" },
    { x: x + tableW - 1.5, text: rp(saldoAkhir), align: "right" },
  ]);

  drawTTD(doc, W, H, [
    { label: `Mengetahui,\nKepala Desa ${desa?.namaDesa ?? "—"}`, nama: desa?.namaKepala ?? "" },
    { label: "Bendahara Desa,", nama: desa?.namaBendahara ?? "" },
  ]);

  doc.save(p.filename ?? `BKU_${(desa?.namaDesa ?? "Desa").replace(/ /g, "-")}_${periodeLabel(p.bulan, p.tahun).replace(/ /g, "-")}.pdf`);
}

// ─── Helper: simple ledger (Bank + Kas Tunai share same structure) ─────────────

interface LedgerRow {
  id: string;
  tanggal: string;
  nomorRef: string;
  uraian: string;
  penerimaan: number;
  pengeluaran: number;
  saldoBerjalan: number;
}

async function downloadPDF_Ledger(
  title: string,
  colD: string,
  colK: string,
  saldoLabel: string,
  rows: LedgerRow[],
  desa: DataDesa | null,
  tahun: string,
  bulan: number | undefined,
  filename: string
): Promise<void> {
  const doc = await newDoc("portrait");
  const W = 210, H = 297, ML = 12, MB = 40;
  const x = ML;
  const subtitle = `Desa ${desa?.namaDesa ?? "—"}, Kecamatan ${desa?.kecamatan ?? "—"}, Kabupaten ${desa?.kabupaten ?? "—"}`;
  let y = drawDocHeader(doc, W, title, subtitle, periodeLabel(bulan, tahun));

  const cols: ColDef[] = [
    { label: "No", width: 9, align: "center" },
    { label: "Tanggal", width: 22 },
    { label: "No. Referensi", width: 30 },
    { label: "Uraian", width: 65 },
    { label: colD, width: 30, align: "right" },
    { label: colK, width: 30, align: "right" },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);
  y = drawTableHeader(doc, cols, x, y);

  const totalD = rows.reduce((s, r) => s + r.penerimaan, 0);
  const totalK = rows.reduce((s, r) => s + r.pengeluaran, 0);
  const saldo = rows.length > 0 ? rows[rows.length - 1].saldoBerjalan : 0;

  if (rows.length === 0) {
    y = drawDataRow(doc, cols, [{ text: "" }, { text: "" }, { text: "" }, { text: "Belum ada data", color: C_MUTED }, { text: "" }, { text: "" }], x, y, 5.5);
  } else {
    for (let i = 0; i < rows.length; i++) {
      y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
      const r = rows[i];
      y = drawDataRow(doc, cols, [
        { text: String(i + 1), align: "center" },
        { text: formatTgl(r.tanggal) },
        { text: r.nomorRef },
        { text: r.uraian },
        { text: r.penerimaan > 0 ? rp(r.penerimaan) : "", align: "right" },
        { text: r.pengeluaran > 0 ? rp(r.pengeluaran) : "", align: "right" },
      ], x, y, 5.5, i % 2 === 0 ? undefined : C_ROW_ALT);
    }
  }

  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 63, text: "JUMLAH" },
    { x: x + tableW - 30 - 1.5, text: rp(totalD), align: "right" },
    { x: x + tableW - 1.5, text: rp(totalK), align: "right" },
  ]);
  y = drawTotalRow(doc, x, y, tableW, [
    { x: x + 1.5, text: saldoLabel },
    { x: x + tableW - 1.5, text: rp(saldo), align: "right" },
  ]);

  drawTTD(doc, W, H, [
    { label: `Mengetahui,\nKepala Desa ${desa?.namaDesa ?? "—"}`, nama: desa?.namaKepala ?? "" },
    { label: "Bendahara Desa,", nama: desa?.namaBendahara ?? "" },
  ]);

  doc.save(filename);
}

// ─── 6. Buku Kas Tunai ────────────────────────────────────────────────────────

export interface BukuKasTunaiProps {
  tahun: string;
  dataDesa: DataDesa | null;
  rows: BukuKasTunaiRow[];
  bulan?: number;
  filename?: string;
}

export async function downloadPDF_BukuKasTunai(p: BukuKasTunaiProps): Promise<void> {
  await downloadPDF_Ledger(
    "BUKU PEMBANTU KAS TUNAI", "Kas Masuk (Rp)", "Kas Keluar (Rp)", "SALDO KAS TUNAI",
    p.rows, p.dataDesa, p.tahun, p.bulan,
    p.filename ?? `BukuKasTunai_${(p.dataDesa?.namaDesa ?? "Desa").replace(/ /g, "-")}_${periodeLabel(p.bulan, p.tahun).replace(/ /g, "-")}.pdf`
  );
}

// ─── 7. Buku Bank ─────────────────────────────────────────────────────────────

export interface BukuBankProps {
  tahun: string;
  dataDesa: DataDesa | null;
  rows: BukuBankRow[];
  bulan?: number;
  filename?: string;
}

export async function downloadPDF_BukuBank(p: BukuBankProps): Promise<void> {
  await downloadPDF_Ledger(
    "BUKU PEMBANTU BANK", "Debit (Rp)", "Kredit (Rp)", "SALDO BANK",
    p.rows, p.dataDesa, p.tahun, p.bulan,
    p.filename ?? `BukuBank_${(p.dataDesa?.namaDesa ?? "Desa").replace(/ /g, "-")}_${periodeLabel(p.bulan, p.tahun).replace(/ /g, "-")}.pdf`
  );
}

// ─── 8. Buku Pajak ───────────────────────────────────────────────────────────

export interface BukuPajakProps {
  tahun: string;
  dataDesa: DataDesa | null;
  rows: BukuPajakItem[];
  bulan?: number;
  filename?: string;
}

export async function downloadPDF_BukuPajak(p: BukuPajakProps): Promise<void> {
  const doc = await newDoc("landscape");
  const W = 297, H = 210, ML = 10, MB = 36;
  const x = ML;
  const desa = p.dataDesa;
  const subtitle = `Desa ${desa?.namaDesa ?? "—"}, Kecamatan ${desa?.kecamatan ?? "—"}, Kabupaten ${desa?.kabupaten ?? "—"}`;
  let y = drawDocHeader(doc, W, "BUKU PEMBANTU PAJAK", subtitle, periodeLabel(p.bulan, p.tahun));

  const cols: ColDef[] = [
    { label: "No", width: 9, align: "center" },
    { label: "Tanggal", width: 20 },
    { label: "No. SPJ", width: 22 },
    { label: "Uraian Kegiatan", width: 55 },
    { label: "Jenis Pajak", width: 26 },
    { label: "Tarif", width: 12, align: "right" },
    { label: "DPP (Rp)", width: 30, align: "right" },
    { label: "Jumlah (Rp)", width: 30, align: "right" },
    { label: "Status", width: 23, align: "center" },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);

  y = drawTableHeader(doc, cols, x, y);

  const totalDipungut = p.rows.reduce((s, r) => s + r.jumlah, 0);
  const totalDisetor = p.rows.filter((r) => r.sudahDisetor).reduce((s, r) => s + r.jumlah, 0);

  if (p.rows.length === 0) {
    y = drawDataRow(doc, cols, Array(9).fill(0).map((_, i) => i === 3 ? { text: "Belum ada data pajak", color: C_MUTED } : { text: "" }), x, y, 5.5);
  } else {
    for (let i = 0; i < p.rows.length; i++) {
      y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
      const r = p.rows[i];
      y = drawDataRow(doc, cols, [
        { text: String(i + 1), align: "center" },
        { text: formatTgl(r.tanggal) },
        { text: r.nomorSPJ },
        { text: r.kegiatanNama },
        { text: r.kodePajak },
        { text: (r.tarif * 100).toFixed(1) + "%", align: "right" },
        { text: rp(r.dasarPengenaan), align: "right" },
        { text: rp(r.jumlah), align: "right" },
        { text: r.sudahDisetor ? "Disetor" : "Belum", align: "center", color: r.sudahDisetor ? C_SUCCESS : C_WARNING },
      ], x, y, 5.5, i % 2 === 0 ? undefined : C_ROW_ALT);
    }
  }

  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 58, text: "TOTAL DIPUNGUT" },
    { x: x + tableW - 23 - 1.5, text: rp(totalDipungut), align: "right" },
  ]);

  y = drawTotalRow(doc, x, y, tableW, [{ x: x + 1.5, text: "Sudah Disetor" }, { x: x + tableW - 23 - 1.5, text: rp(totalDisetor), align: "right" }]);
  y = drawTotalRow(doc, x, y, tableW, [{ x: x + 1.5, text: "Belum Disetor" }, { x: x + tableW - 23 - 1.5, text: rp(totalDipungut - totalDisetor), align: "right" }]);

  drawTTD(doc, W, H, [
    { label: `Mengetahui,\nKepala Desa ${desa?.namaDesa ?? "—"}`, nama: desa?.namaKepala ?? "" },
    { label: "Bendahara Desa,", nama: desa?.namaBendahara ?? "" },
  ]);

  doc.save(p.filename ?? `BukuPajak_${(desa?.namaDesa ?? "Desa").replace(/ /g, "-")}_${periodeLabel(p.bulan, p.tahun).replace(/ /g, "-")}.pdf`);
}

// ─── 9. Buku Pajak Rekap ─────────────────────────────────────────────────────

export interface BukuPajakRekapProps {
  tahun: string;
  dataDesa: DataDesa | null;
  rows: BukuPajakRekapRow[];
  bulan?: number;
  filename?: string;
}

export async function downloadPDF_BukuPajakRekap(p: BukuPajakRekapProps): Promise<void> {
  const doc = await newDoc("portrait");
  const W = 210, H = 297, ML = 12, MB = 40;
  const x = ML;
  const desa = p.dataDesa;
  const subtitle = `Desa ${desa?.namaDesa ?? "—"}, Kecamatan ${desa?.kecamatan ?? "—"}, Kabupaten ${desa?.kabupaten ?? "—"}`;
  let y = drawDocHeader(doc, W, "REKAPITULASI BUKU PEMBANTU PAJAK", subtitle, periodeLabel(p.bulan, p.tahun));

  const cols: ColDef[] = [
    { label: "No", width: 11, align: "center" },
    { label: "Kode Pajak", width: 26 },
    { label: "Nama Pajak", width: 63 },
    { label: "Dipungut (Rp)", width: 28, align: "right" },
    { label: "Disetor (Rp)", width: 28, align: "right" },
    { label: "Sisa (Rp)", width: 28, align: "right" },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);

  y = drawTableHeader(doc, cols, x, y);

  const totalDipungut = p.rows.reduce((s, r) => s + r.totalDipungut, 0);
  const totalDisetor = p.rows.reduce((s, r) => s + r.totalDisetor, 0);
  const totalSisa = p.rows.reduce((s, r) => s + r.sisaBelumDisetor, 0);

  if (p.rows.length === 0) {
    y = drawDataRow(doc, cols, [{ text: "" }, { text: "" }, { text: "Belum ada data pajak", color: C_MUTED }, { text: "" }, { text: "" }, { text: "" }], x, y, 5.5);
  } else {
    for (let i = 0; i < p.rows.length; i++) {
      y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
      const r = p.rows[i];
      y = drawDataRow(doc, cols, [
        { text: String(i + 1), align: "center" },
        { text: r.kodePajak },
        { text: r.namaPajak },
        { text: rp(r.totalDipungut), align: "right" },
        { text: rp(r.totalDisetor), align: "right" },
        { text: rp(r.sisaBelumDisetor), align: "right", color: r.sisaBelumDisetor > 0 ? C_WARNING : C_SUCCESS },
      ], x, y, 5.5, i % 2 === 0 ? undefined : C_ROW_ALT);
    }
  }

  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 39, text: "TOTAL" },
    { x: x + tableW - 28 - 28 - 1.5, text: rp(totalDipungut), align: "right" },
    { x: x + tableW - 28 - 1.5, text: rp(totalDisetor), align: "right" },
    { x: x + tableW - 1.5, text: rp(totalSisa), align: "right" },
  ]);

  drawTTD(doc, W, H, [
    { label: `Mengetahui,\nKepala Desa ${desa?.namaDesa ?? "—"}`, nama: desa?.namaKepala ?? "" },
    { label: "Bendahara Desa,", nama: desa?.namaBendahara ?? "" },
  ]);

  doc.save(p.filename ?? `RekapPajak_${(desa?.namaDesa ?? "Desa").replace(/ /g, "-")}_${periodeLabel(p.bulan, p.tahun).replace(/ /g, "-")}.pdf`);
}

// ─── 10. Buku Panjar ─────────────────────────────────────────────────────────

export interface BukuPanjarProps {
  tahun: string;
  dataDesa: DataDesa | null;
  rows: BukuPanjarRow[];
  bulan?: number;
  filename?: string;
}

export async function downloadPDF_BukuPanjar(p: BukuPanjarProps): Promise<void> {
  const doc = await newDoc("portrait");
  const W = 210, H = 297, ML = 12, MB = 40;
  const x = ML;
  const desa = p.dataDesa;
  const subtitle = `Desa ${desa?.namaDesa ?? "—"}, Kecamatan ${desa?.kecamatan ?? "—"}, Kabupaten ${desa?.kabupaten ?? "—"}`;
  let y = drawDocHeader(doc, W, "BUKU PEMBANTU PANJAR", subtitle, periodeLabel(p.bulan, p.tahun));

  const cols: ColDef[] = [
    { label: "No", width: 9, align: "center" },
    { label: "Tanggal", width: 22 },
    { label: "No. SPP", width: 28 },
    { label: "Uraian", width: 55 },
    { label: "Nilai Panjar (Rp)", width: 32, align: "right" },
    { label: "Sisa (Rp)", width: 22, align: "right" },
    { label: "Status", width: 18, align: "center" },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);

  y = drawTableHeader(doc, cols, x, y);

  const totalPanjar = p.rows.reduce((s, r) => s + r.nilaiPanjar, 0);
  const totalSisa = p.rows.reduce((s, r) => s + r.sisaPanjar, 0);

  if (p.rows.length === 0) {
    y = drawDataRow(doc, cols, Array(7).fill(0).map((_, i) => i === 3 ? { text: "Belum ada data panjar", color: C_MUTED } : { text: "" }), x, y, 5.5);
  } else {
    for (let i = 0; i < p.rows.length; i++) {
      y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
      const r = p.rows[i];
      y = drawDataRow(doc, cols, [
        { text: String(i + 1), align: "center" },
        { text: formatTgl(r.tanggal) },
        { text: r.nomorSPP },
        { text: r.uraian },
        { text: rp(r.nilaiPanjar), align: "right" },
        { text: rp(r.sisaPanjar), align: "right" },
        { text: r.statusLunas ? "Lunas" : "Belum", align: "center", color: r.statusLunas ? C_SUCCESS : C_WARNING },
      ], x, y, 5.5, i % 2 === 0 ? undefined : C_ROW_ALT);
    }
  }

  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 61, text: "JUMLAH" },
    { x: x + tableW - 18 - 22 - 1.5, text: rp(totalPanjar), align: "right" },
    { x: x + tableW - 18 - 1.5, text: rp(totalSisa), align: "right" },
  ]);

  drawTTD(doc, W, H, [
    { label: `Mengetahui,\nKepala Desa ${desa?.namaDesa ?? "—"}`, nama: desa?.namaKepala ?? "" },
    { label: "Bendahara Desa,", nama: desa?.namaBendahara ?? "" },
  ]);

  doc.save(p.filename ?? `BukuPanjar_${(desa?.namaDesa ?? "Desa").replace(/ /g, "-")}_${periodeLabel(p.bulan, p.tahun).replace(/ /g, "-")}.pdf`);
}

// ─── 11. Realisasi Semester I ─────────────────────────────────────────────────

export interface RealisasiSemesterIProps {
  tahun: string;
  dataDesa: DataDesa | null;
  belanjaList: KegiatanAPBDes[];
  dicairkanSPP: SPPItem[];
  realisasiPerKegiatan: Record<string, number>;
  filename?: string;
}

export async function downloadPDF_RealisasiSemesterI(p: RealisasiSemesterIProps): Promise<void> {
  const doc = await newDoc("landscape");
  const W = 297, H = 210, ML = 10, MB = 36;
  const x = ML;
  const desa = p.dataDesa;
  const subtitle = `Desa ${desa?.namaDesa ?? "—"}, Kecamatan ${desa?.kecamatan ?? "—"}, Kabupaten ${desa?.kabupaten ?? "—"}`;
  let y = drawDocHeader(doc, W, "LAPORAN REALISASI APBDes SEMESTER I", subtitle, `Periode Januari — Juni ${p.tahun}`);

  const cols: ColDef[] = [
    { label: "No", width: 9, align: "center" },
    { label: "Kode Keg.", width: 22 },
    { label: "Uraian Kegiatan", width: 58 },
    { label: "Anggaran (Rp)", width: 30, align: "right" },
    { label: "Realisasi Sem.I (Rp)", width: 34, align: "right" },
    { label: "%", width: 13, align: "right" },
    { label: "Realisasi s/d skrg (Rp)", width: 34, align: "right" },
    { label: "%", width: 13, align: "right" },
    { label: "Sisa (Rp)", width: 30, align: "right" },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);

  y = drawTableHeader(doc, cols, x, y);

  // Hitung realisasi Semester I
  const realisasiSemI: Record<string, number> = {};
  for (const spp of p.dicairkanSPP) {
    const tgl = spp.dicairkanTanggal ?? spp.tanggal;
    const bln = new Date(tgl).getMonth() + 1;
    if (bln >= 1 && bln <= 6) {
      realisasiSemI[spp.kegiatanId] = (realisasiSemI[spp.kegiatanId] ?? 0) + spp.totalJumlah;
    }
  }

  const totalAnggaran = p.belanjaList.reduce((s, k) => s + (k.totalPagu ?? 0), 0);
  const totalRealisasi = Object.values(p.realisasiPerKegiatan).reduce((s, v) => s + v, 0);
  const totalSemI = Object.values(realisasiSemI).reduce((s, v) => s + v, 0);

  if (p.belanjaList.length === 0) {
    y = drawDataRow(doc, cols, Array(9).fill(0).map((_, i) => i === 2 ? { text: "Belum ada data belanja", color: C_MUTED } : { text: "" }), x, y, 5.5);
  } else {
    for (let i = 0; i < p.belanjaList.length; i++) {
      y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
      const k = p.belanjaList[i];
      const anggaran = k.totalPagu ?? 0;
      const real = p.realisasiPerKegiatan[k.id] ?? 0;
      const realSemI = realisasiSemI[k.id] ?? 0;
      const sisa = anggaran - real;
      y = drawDataRow(doc, cols, [
        { text: String(i + 1), align: "center" },
        { text: k.kodeKegiatan },
        { text: k.namaKegiatan },
        { text: rp(anggaran), align: "right" },
        { text: rp(realSemI), align: "right" },
        { text: persenStr(realSemI, anggaran), align: "right" },
        { text: rp(real), align: "right" },
        { text: persenStr(real, anggaran), align: "right" },
        { text: rp(sisa), align: "right", color: sisa < 0 ? [220, 38, 38] : undefined },
      ], x, y, 5.5, i % 2 === 0 ? undefined : C_ROW_ALT);
    }
  }

  // Grand total row manual (banyak kolom bernilai)
  doc.setFillColor(...C_GRAND_BG);
  doc.rect(x, y, tableW, 6, "F");
  doc.setDrawColor(...C_BORDER);
  doc.rect(x, y, tableW, 6, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...C_HEADER_TEXT);
  const gy = y + 3.9;
  doc.text("TOTAL BELANJA", x + 33, gy);
  const anggaranX = x + 9 + 22 + 58 + 30;
  const semIX = anggaranX + 34;
  const semIPctX = semIX + 13;
  const skriniX = semIPctX + 34;
  const skrniPctX = skriniX + 13;
  doc.text(rp(totalAnggaran), anggaranX - 1.5, gy, { align: "right" });
  doc.text(rp(totalSemI), semIX - 1.5, gy, { align: "right" });
  doc.text(persenStr(totalSemI, totalAnggaran), semIPctX - 1.5, gy, { align: "right" });
  doc.text(rp(totalRealisasi), skriniX - 1.5, gy, { align: "right" });
  doc.text(persenStr(totalRealisasi, totalAnggaran), skrniPctX - 1.5, gy, { align: "right" });
  doc.text(rp(totalAnggaran - totalRealisasi), x + tableW - 1.5, gy, { align: "right" });

  drawTTD(doc, W, H, [
    { label: `Mengetahui,\nKepala Desa ${desa?.namaDesa ?? "—"}`, nama: desa?.namaKepala ?? "" },
    { label: "Sekretaris Desa,", nama: desa?.namaSekdes ?? "" },
    { label: "Bendahara Desa,", nama: desa?.namaBendahara ?? "" },
  ]);

  doc.save(p.filename ?? `RealisasiSemesterI_${(desa?.namaDesa ?? "Desa").replace(/ /g, "-")}_${p.tahun}.pdf`);
}
