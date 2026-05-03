// src/lib/generatePDF.shared.ts
// ─────────────────────────────────────────────────────────────────────────────
// SHARED: konstanta, helper format, primitif gambar (kop, judul, footer,
//         tabel header, data row, TTD, page break).
//
// Semua simbol di sini bersifat internal — hanya dipakai oleh modul
// generatePDF.*.ts. Consumer luar WAJIB import dari generatePDF.ts (barrel).
// ─────────────────────────────────────────────────────────────────────────────

import type { DataDesa } from "@/hooks/useMaster";

// ─── Konstanta label bulan ────────────────────────────────────────────────────

export const BULAN_LABEL = [
  "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
export const BULAN_SINGKAT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agt", "Sep", "Okt", "Nov", "Des",
];

// ─── Warna RGB ────────────────────────────────────────────────────────────────

export const C_HEADER_BG:   [number, number, number] = [30, 58, 95];
export const C_HEADER_TEXT: [number, number, number] = [255, 255, 255];
export const C_ROW_ALT:     [number, number, number] = [248, 250, 252];
export const C_TOTAL_BG:    [number, number, number] = [226, 232, 240];
export const C_GRAND_BG:    [number, number, number] = [15, 23, 42];
export const C_BORDER:      [number, number, number] = [180, 194, 212];
export const C_TEXT:        [number, number, number] = [30, 41, 59];
export const C_MUTED:       [number, number, number] = [100, 116, 139];
export const C_SUCCESS:     [number, number, number] = [22, 101, 52];
export const C_WARNING:     [number, number, number] = [180, 64, 14];
export const C_DIVIDER:     [number, number, number] = [30, 58, 95];

// ─── jsPDF lazy import ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JsPDFDoc = any;

export async function newDoc(orientation: "portrait" | "landscape"): Promise<JsPDFDoc> {
  const { jsPDF } = await import("jspdf");
  return new jsPDF({ orientation, unit: "mm", format: "a4" });
}

// ─── Format helpers ───────────────────────────────────────────────────────────

/** Format angka → 1.132.276.879,00 */
export function rp(n: number): string {
  if (isNaN(n) || n === null || n === undefined) return "0,00";
  const abs = Math.abs(n);
  const dec = abs.toFixed(2).split(".")[1];
  const int = Math.floor(abs).toLocaleString("id-ID");
  const prefix = n < 0 ? "-" : "";
  return `${prefix}${int},${dec}`;
}

export function formatTgl(s: string | undefined | null): string {
  if (!s) return "-";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function tglTTD(desaNama: string): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const bln = BULAN_LABEL[now.getMonth() + 1];
  return `${desaNama?.toUpperCase() ?? "—"}, ${dd} ${bln} ${now.getFullYear()}`;
}

export function nowStr(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

export function periodeLabel(bulan?: number, tahun?: string): string {
  if (bulan) return `Bulan ${BULAN_LABEL[bulan]} Tahun ${tahun ?? ""}`;
  return `Tahun Anggaran ${tahun ?? ""}`;
}

export function persenStr(r: number, a: number): string {
  if (!a) return "-";
  return ((r / a) * 100).toFixed(2) + "%";
}

// ─── ColDef ──────────────────────────────────────────────────────────────────

export interface ColDef {
  label: string;
  width: number;
  align?: "left" | "center" | "right";
}

// ─── CellVal ─────────────────────────────────────────────────────────────────

export interface CellVal {
  text: string;
  align?: "left" | "center" | "right";
  bold?: boolean;
  color?: [number, number, number];
  indent?: number;
}

// ─── KOP RESMI ────────────────────────────────────────────────────────────────

export function drawKop(
  doc: JsPDFDoc,
  desa: DataDesa | null,
  pageW: number
): number {
  let y = 11;
  doc.setDrawColor(...C_DIVIDER);
  doc.setLineWidth(0.8);
  doc.line(10, y, pageW - 10, y);

  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C_HEADER_BG);
  doc.text("PEMERINTAH DESA " + (desa?.namaDesa ?? "—").toUpperCase(), pageW / 2, y, { align: "center" });
  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C_TEXT);
  doc.text(
    `Kecamatan ${desa?.kecamatan ?? "—"}, Kabupaten ${desa?.kabupaten ?? "—"}, Provinsi ${desa?.provinsi ?? "Jawa Timur"}`,
    pageW / 2, y, { align: "center" }
  );
  y += 4;
  doc.setDrawColor(...C_DIVIDER);
  doc.setLineWidth(0.8);
  doc.line(10, y, pageW - 10, y);
  doc.setLineWidth(0.3);
  doc.line(10, y + 0.8, pageW - 10, y + 0.8);
  return y + 4;
}

// ─── JUDUL DOKUMEN ────────────────────────────────────────────────────────────

export function drawJudul(
  doc: JsPDFDoc,
  pageW: number,
  yStart: number,
  judul: string,
  subjudul?: string
): number {
  let y = yStart;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...C_HEADER_BG);
  doc.text(judul, pageW / 2, y, { align: "center" });
  y += 5;
  if (subjudul) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C_TEXT);
    doc.text(subjudul, pageW / 2, y, { align: "center" });
    y += 5;
  }
  return y;
}

// ─── FOOTER (nomor halaman + waktu cetak) ─────────────────────────────────────

export function drawFooterAllPages(doc: JsPDFDoc, pageW: number, pageH: number): void {
  const totalPages = doc.getNumberOfPages();
  const waktu = nowStr();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C_MUTED);
    doc.text(`Dicetak: ${waktu}`, 10, pageH - 6);
    doc.text(`Halaman ${i} dari ${totalPages}`, pageW - 10, pageH - 6, { align: "right" });
    doc.setDrawColor(...C_BORDER);
    doc.setLineWidth(0.2);
    doc.line(10, pageH - 9, pageW - 10, pageH - 9);
  }
}

// ─── TABLE HEADER (2 baris: label + nomor kolom) ──────────────────────────────

export function drawTableHeader(
  doc: JsPDFDoc,
  cols: ColDef[],
  x: number,
  y: number,
  rowH = 6
): number {
  const totalW = cols.reduce((s, c) => s + c.width, 0);

  // Baris 1: label
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
    const align = col.align ?? "center";
    const textX =
      align === "right" ? cx + col.width - 1.5 :
      align === "center" ? cx + col.width / 2 :
      cx + 1.5;
    doc.text(col.label, textX, y + rowH * 0.66, { align });
    cx += col.width;
  }
  y += rowH;

  // Baris 2: nomor kolom
  doc.setFillColor(20, 42, 72);
  doc.rect(x, y, totalW, 4.5, "F");
  doc.setDrawColor(...C_BORDER);
  doc.rect(x, y, totalW, 4.5, "S");
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 215, 235);
  cx = x;
  for (let i = 0; i < cols.length; i++) {
    doc.text(String(i + 1), cx + cols[i].width / 2, y + 3.1, { align: "center" });
    cx += cols[i].width;
  }
  return y + 4.5;
}

// ─── DATA ROW ─────────────────────────────────────────────────────────────────

export function drawDataRow(
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

export function drawTotalRow(
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
  doc.setLineWidth(0.2);
  doc.rect(x, y, totalW, rowH, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...C_TEXT);
  for (const kv of kvPairs) {
    doc.text(kv.text, kv.x, y + rowH * 0.65, { align: kv.align ?? "left" });
  }
  return y + rowH;
}

export function drawGrandTotalRow(
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

export function drawSectionRow(
  doc: JsPDFDoc,
  x: number,
  y: number,
  totalW: number,
  label: string,
  rowH = 5.5
): number {
  doc.setFillColor(230, 238, 248);
  doc.rect(x, y, totalW, rowH, "F");
  doc.setDrawColor(...C_BORDER);
  doc.setLineWidth(0.2);
  doc.rect(x, y, totalW, rowH, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...C_HEADER_BG);
  doc.text(label, x + 1.5, y + rowH * 0.65);
  return y + rowH;
}

// ─── TTD ─────────────────────────────────────────────────────────────────────

export interface TTDBlock {
  title: string;     // "Mengetahui,"
  jabatan: string;   // "Kepala Desa Karang Sengon"
  nama: string;      // nama pejabat
  nip?: string;      // NIP/NIK (opsional)
}

export function drawTTD(
  doc: JsPDFDoc,
  pageW: number,
  pageH: number,
  blocks: TTDBlock[]
): void {
  const n = blocks.length;
  const blockW = (pageW - 20) / n;
  const yBase = pageH - 42;

  for (let i = 0; i < n; i++) {
    const blk = blocks[i];
    const cx = 10 + i * blockW + blockW / 2;

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C_TEXT);

    doc.text(blk.title, cx, yBase, { align: "center" });
    doc.text(blk.jabatan, cx, yBase + 4.5, { align: "center" });

    doc.setLineWidth(0.3);
    doc.setDrawColor(...C_MUTED);
    doc.line(cx - blockW / 2 + 6, yBase + 22, cx + blockW / 2 - 6, yBase + 22);

    doc.setFont("helvetica", "bold");
    doc.text(blk.nama || "(                    )", cx, yBase + 26, { align: "center" });
    if (blk.nip) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.text(`NIP/NIK: ${blk.nip}`, cx, yBase + 30, { align: "center" });
    }
  }
}

// ─── PAGE BREAK CHECK ─────────────────────────────────────────────────────────

export function checkPageBreak(
  doc: JsPDFDoc,
  y: number,
  rowH: number,
  pageH: number,
  bottomMargin: number,
  cols: ColDef[],
  x: number
): number {
  if (y + rowH > pageH - bottomMargin) {
    doc.addPage();
    y = 14;
    y = drawTableHeader(doc, cols, x, y);
  }
  return y;
}

// ─── Helper: baris label-value untuk isian dokumen ───────────────────────────

export function drawIsianRow(
  doc: JsPDFDoc,
  x: number,
  y: number,
  label: string,
  nilai: string,
  pageW: number
): number {
  const valueX = x + 55;
  const maxW = pageW - valueX - 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C_TEXT);
  doc.text(label, x, y);
  doc.text(":", x + 52, y);
  const lines: string[] = doc.splitTextToSize(nilai || "-", maxW);
  doc.text(lines, valueX, y);
  return y + lines.length * 4.5;
}

// ─── Helper: Ledger (Kas Tunai + Bank share same layout) ─────────────────────

export interface LedgerRow {
  id: string;
  tanggal: string;
  nomorRef: string;
  uraian: string;
  penerimaan: number;
  pengeluaran: number;
  saldoBerjalan: number;
}

export async function downloadPDF_Ledger(
  judulDok: string,
  colDebit: string,
  colKredit: string,
  saldoLabel: string,
  rows: LedgerRow[],
  desa: DataDesa | null,
  tahun: string,
  bulan: number | undefined,
  filename: string,
  returnBlob = false
): Promise<void | Blob> {
  const doc = await newDoc("landscape");
  const W = 297, H = 210, ML = 10, MB = 45;
  const x = ML;

  let y = drawKop(doc, desa, W);
  y = drawJudul(doc, W, y, judulDok, periodeLabel(bulan, tahun));

  const cols: ColDef[] = [
    { label: "No.",          width: 9,  align: "center" },
    { label: "Tanggal",      width: 22             },
    { label: "No. Referensi", width: 34            },
    { label: "Uraian",       width: 90             },
    { label: colDebit,       width: 36, align: "right" },
    { label: colKredit,      width: 36, align: "right" },
    { label: "Saldo (Rp)",   width: 30, align: "right" },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);
  y = drawTableHeader(doc, cols, x, y);

  const totalD = rows.reduce((s, r) => s + r.penerimaan, 0);
  const totalK = rows.reduce((s, r) => s + r.pengeluaran, 0);
  const saldo  = rows.length > 0 ? rows[rows.length - 1].saldoBerjalan : 0;

  if (!rows.length) {
    y = drawDataRow(doc, cols, [{ text: "" }, { text: "" }, { text: "" }, { text: "Belum ada data", color: C_MUTED }, { text: "" }, { text: "" }, { text: "" }], x, y, 5.5);
  } else {
    for (let i = 0; i < rows.length; i++) {
      y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
      const r = rows[i];
      y = drawDataRow(doc, cols, [
        { text: String(i + 1), align: "center" },
        { text: formatTgl(r.tanggal) },
        { text: r.nomorRef },
        { text: r.uraian },
        { text: r.penerimaan  > 0 ? rp(r.penerimaan)  : "—", align: "right" },
        { text: r.pengeluaran > 0 ? rp(r.pengeluaran) : "—", align: "right" },
        { text: rp(r.saldoBerjalan), align: "right" },
      ], x, y, 5.5, i % 2 === 0 ? undefined : C_ROW_ALT);
    }
  }

  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 67, text: "JUMLAH" },
    { x: x + tableW - 30 - 36 - 1.5, text: rp(totalD), align: "right" },
    { x: x + tableW - 30 - 1.5,      text: rp(totalK), align: "right" },
  ]);
  y = drawTotalRow(doc, x, y, tableW, [
    { x: x + 1.5, text: saldoLabel },
    { x: x + tableW - 1.5, text: rp(saldo), align: "right" },
  ]);

  const namaDesa = desa?.namaDesa ?? "—";
  drawTTD(doc, W, H, [
    { title: tglTTD(namaDesa), jabatan: `Kepala Desa ${namaDesa},`, nama: desa?.namaKepala ?? "" },
    { title: "", jabatan: "Bendahara Desa,", nama: desa?.namaBendahara ?? "" },
  ]);

  drawFooterAllPages(doc, W, H);
  if (returnBlob) return doc.output("blob") as Blob;
  doc.save(filename);
}
