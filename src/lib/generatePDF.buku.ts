// src/lib/generatePDF.buku.ts
// ─────────────────────────────────────────────────────────────────────────────
// PDF PEMBUKUAN & BUKU PEMBANTU
//   #4  downloadPDF_DPAPerKegiatan    — DPA Rencana Kas Per Kegiatan
//   #5  downloadPDF_BKUBulanan        — Buku Kas Umum Bulanan
//   #6  downloadPDF_BukuKasTunai      — Buku Pembantu Kas Tunai
//   #7  downloadPDF_BukuBank          — Buku Pembantu Bank
//   #8  downloadPDF_BukuPajak         — Buku Pembantu Pajak
//   #9  downloadPDF_BukuPajakRekap    — Rekap Buku Pembantu Pajak
//   #10 downloadPDF_BukuPanjar        — Buku Pembantu Uang Muka (Panjar)
//   #11 downloadPDF_RealisasiSemesterI — LRA Semester I (lama)
// ─────────────────────────────────────────────────────────────────────────────

import type { DataDesa } from "@/hooks/useMaster";
import type { KegiatanAPBDes, DPAKegiatan, BKUItem, SPPItem } from "@/lib/types";
import type {
  BukuBankRow,
  BukuKasTunaiRow,
  BukuPajakItem,
  BukuPajakRekapRow,
  BukuPanjarRow,
} from "@/hooks/useBukuPembantu";
import {
  newDoc, rp, tglTTD, formatTgl, periodeLabel, persenStr,
  C_ROW_ALT, C_MUTED, C_TEXT, C_BORDER, C_SUCCESS, C_WARNING,
  C_HEADER_BG, C_HEADER_TEXT, C_GRAND_BG, C_TOTAL_BG,
  drawKop, drawJudul, drawFooterAllPages, drawTableHeader,
  drawDataRow, drawTotalRow, drawGrandTotalRow, drawSectionRow, drawTTD,
  checkPageBreak, downloadPDF_Ledger, BULAN_SINGKAT,
} from "@/lib/generatePDF.shared";
import type { ColDef, CellVal } from "@/lib/generatePDF.shared";

// ─── 4. DPA Per Kegiatan ──────────────────────────────────────────────────────

export interface DPAPerKegiatanProps {
  tahun: string;
  dataDesa: DataDesa | null;
  belanjaList: KegiatanAPBDes[];
  dpaMap: { [kegiatanId: string]: DPAKegiatan };
  filename?: string;
}

export async function downloadPDF_DPAPerKegiatan(p: DPAPerKegiatanProps, returnBlob = false): Promise<void | Blob> {
  const doc = await newDoc("landscape");
  const W = 297, H = 210, ML = 10, MB = 45;
  const x = ML;
  const desa = p.dataDesa;

  let y = drawKop(doc, desa, W);
  y = drawJudul(doc, W, y, "DOKUMEN PELAKSANAAN ANGGARAN (DPA)", `Rencana Kas Per Kegiatan — Tahun Anggaran ${p.tahun}`);

  const uraianW = 50, paguW = 20, bW = 12, totalDpaW = 20;
  const cols: ColDef[] = [
    { label: "Uraian Kegiatan",  width: uraianW },
    { label: "Pagu (Rp)",        width: paguW,     align: "right" },
    ...BULAN_SINGKAT.map((b) => ({ label: b, width: bW, align: "right" as const })),
    { label: "Total DPA (Rp)",   width: totalDpaW, align: "right" },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);
  y = drawTableHeader(doc, cols, x, y, 5.5);

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
      { text: `${kegiatan.kodeKegiatan}. ${kegiatan.namaKegiatan}${isDPAL ? " ★" : ""}`, bold: isDPAL },
      { text: rp(kegiatan.totalPagu ?? 0), align: "right" },
      ...Array.from({ length: 12 }, (_, idx): CellVal => {
        const jumlah = dpa?.bulan?.[String(idx + 1)]?.jumlah ?? 0;
        return { text: jumlah > 0 ? rp(jumlah) : "", align: "right" };
      }),
      { text: totalDPA > 0 ? rp(totalDPA) : "—", align: "right", bold: true },
    ], x, y, 5.5, altIdx++ % 2 === 0 ? undefined : C_ROW_ALT, 6.5);
  }

  if (!p.belanjaList.length) {
    y = drawDataRow(doc, cols, [{ text: "Belum ada data kegiatan", color: C_MUTED }, ...Array(cols.length - 1).fill({ text: "" })], x, y, 5.5);
  }

  // Grand total manual (banyak kolom)
  doc.setFillColor(...C_GRAND_BG);
  doc.rect(x, y, tableW, 6, "F");
  doc.setDrawColor(...C_BORDER);
  doc.rect(x, y, tableW, 6, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...C_HEADER_TEXT);
  const gy = y + 3.9;
  doc.text("TOTAL", x + 1.5, gy);
  doc.text(rp(totalPagu), x + uraianW + paguW - 1.5, gy, { align: "right" });
  let bx = x + uraianW + paguW;
  for (let i = 0; i < 12; i++) {
    if (totalPerBulan[i] > 0) {
      doc.text(rp(totalPerBulan[i]), bx + bW - 1.5, gy, { align: "right" });
    }
    bx += bW;
  }
  doc.text(rp(grandTotalDPA), x + tableW - 1.5, gy, { align: "right" });
  y += 6;

  if (p.belanjaList.some((k) => p.dpaMap[k.id]?.isDPAL)) {
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C_MUTED);
    doc.text("★ DPAL = Dokumen Pelaksanaan Anggaran Lanjutan", x, y + 4);
    y += 8;
  }

  const namaDesa = desa?.namaDesa ?? "—";
  drawTTD(doc, W, H, [
    { title: tglTTD(namaDesa), jabatan: `Kepala Desa ${namaDesa},`, nama: desa?.namaKepala ?? "" },
    { title: "", jabatan: "Sekretaris Desa,", nama: desa?.namaSekdes ?? "" },
    { title: "", jabatan: "Bendahara Desa,", nama: desa?.namaBendahara ?? "" },
  ]);

  drawFooterAllPages(doc, W, H);
  if (returnBlob) return doc.output("blob") as Blob;
  doc.save(p.filename ?? `DPA_${namaDesa.replace(/ /g, "-")}_${p.tahun}.pdf`);
}

// ─── 5. BKU Bulanan ───────────────────────────────────────────────────────────

export interface BKUBulananProps {
  tahun: string;
  dataDesa: DataDesa | null;
  bkuList: BKUItem[];
  bulan?: number;
  filename?: string;
}

export async function downloadPDF_BKUBulanan(p: BKUBulananProps, returnBlob = false): Promise<void | Blob> {
  const doc = await newDoc("landscape");
  const W = 297, H = 210, ML = 10, MB = 45;
  const x = ML;
  const desa = p.dataDesa;

  let y = drawKop(doc, desa, W);
  y = drawJudul(doc, W, y, "BUKU KAS UMUM (BKU)", periodeLabel(p.bulan, p.tahun));

  const cols: ColDef[] = [
    { label: "No.",         width: 10, align: "center" },
    { label: "Tanggal",     width: 22             },
    { label: "No. Referensi", width: 36           },
    { label: "Uraian",      width: 93             },
    { label: "Penerimaan (Rp)", width: 38, align: "right" },
    { label: "Pengeluaran (Rp)", width: 38, align: "right" },
    { label: "Saldo (Rp)", width: 30, align: "right" },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);
  y = drawTableHeader(doc, cols, x, y);

  const totalPenerimaan = p.bkuList.reduce((s, b) => s + b.penerimaan, 0);
  const totalPengeluaran = p.bkuList.reduce((s, b) => s + b.pengeluaran, 0);
  const saldoAkhir = p.bkuList.length > 0 ? p.bkuList[p.bkuList.length - 1].saldo : 0;

  if (!p.bkuList.length) {
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
    { x: x + 70, text: "JUMLAH" },
    { x: x + tableW - 30 - 38 - 1.5, text: rp(totalPenerimaan), align: "right" },
    { x: x + tableW - 30 - 1.5,      text: rp(totalPengeluaran), align: "right" },
    { x: x + tableW - 1.5,           text: rp(saldoAkhir), align: "right" },
  ]);

  const namaDesa = desa?.namaDesa ?? "—";
  drawTTD(doc, W, H, [
    { title: tglTTD(namaDesa), jabatan: `Kepala Desa ${namaDesa},`, nama: desa?.namaKepala ?? "" },
    { title: "", jabatan: "Bendahara Desa,", nama: desa?.namaBendahara ?? "" },
  ]);

  drawFooterAllPages(doc, W, H);
  if (returnBlob) return doc.output("blob") as Blob;
  doc.save(p.filename ?? `BKU_${namaDesa.replace(/ /g, "-")}_${periodeLabel(p.bulan, p.tahun).replace(/ /g, "-")}.pdf`);
}

// ─── 6. Buku Kas Tunai ────────────────────────────────────────────────────────

export interface BukuKasTunaiProps {
  tahun: string;
  dataDesa: DataDesa | null;
  rows: BukuKasTunaiRow[];
  bulan?: number;
  filename?: string;
}

export async function downloadPDF_BukuKasTunai(p: BukuKasTunaiProps, returnBlob = false): Promise<void | Blob> {
  const namaDesa = (p.dataDesa?.namaDesa ?? "Desa").replace(/ /g, "-");
  return await downloadPDF_Ledger(
    "BUKU PEMBANTU KAS TUNAI",
    "Kas Masuk (Rp)", "Kas Keluar (Rp)", "SALDO KAS TUNAI",
    p.rows, p.dataDesa, p.tahun, p.bulan,
    p.filename ?? `BukuKasTunai_${namaDesa}_${periodeLabel(p.bulan, p.tahun).replace(/ /g, "-")}.pdf`,
    returnBlob
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

export async function downloadPDF_BukuBank(p: BukuBankProps, returnBlob = false): Promise<void | Blob> {
  const namaDesa = (p.dataDesa?.namaDesa ?? "Desa").replace(/ /g, "-");
  return await downloadPDF_Ledger(
    "BUKU PEMBANTU BANK",
    "Debit (Rp)", "Kredit (Rp)", "SALDO BANK",
    p.rows, p.dataDesa, p.tahun, p.bulan,
    p.filename ?? `BukuBank_${namaDesa}_${periodeLabel(p.bulan, p.tahun).replace(/ /g, "-")}.pdf`,
    returnBlob
  );
}

// ─── 8. Buku Pembantu Pajak ───────────────────────────────────────────────────

export interface BukuPajakProps {
  tahun: string;
  dataDesa: DataDesa | null;
  rows: BukuPajakItem[];
  bulan?: number;
  filename?: string;
}

export async function downloadPDF_BukuPajak(p: BukuPajakProps, returnBlob = false): Promise<void | Blob> {
  const doc = await newDoc("landscape");
  const W = 297, H = 210, ML = 10, MB = 45;
  const x = ML;
  const desa = p.dataDesa;

  let y = drawKop(doc, desa, W);
  y = drawJudul(doc, W, y, "BUKU KAS PEMBANTU PAJAK", periodeLabel(p.bulan, p.tahun));

  const cols: ColDef[] = [
    { label: "No.",         width: 9,  align: "center" },
    { label: "Tanggal",     width: 22             },
    { label: "No. SPJ/Ref", width: 28             },
    { label: "Uraian Kegiatan / Belanja", width: 54 },
    { label: "Jenis Pajak", width: 26             },
    { label: "No. NTPN",    width: 28             },
    { label: "Tarif",       width: 12, align: "right" },
    { label: "DPP (Rp)",    width: 28, align: "right" },
    { label: "Jumlah (Rp)", width: 30, align: "right" },
    { label: "Status",      width: 20, align: "center" },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);
  y = drawTableHeader(doc, cols, x, y);

  const totalDipungut = p.rows.reduce((s, r) => s + r.jumlah, 0);
  const totalDisetor  = p.rows.filter((r) => r.sudahDisetor).reduce((s, r) => s + r.jumlah, 0);

  if (!p.rows.length) {
    y = drawDataRow(doc, cols, Array(10).fill(0).map((_, i) => i === 3 ? { text: "Belum ada data pajak", color: C_MUTED } : { text: "" }), x, y, 5.5);
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
        { text: (r as any).nomorNTPN ?? "—" },
        { text: (r.tarif * 100).toFixed(1) + "%", align: "right" },
        { text: rp(r.dasarPengenaan), align: "right" },
        { text: rp(r.jumlah), align: "right" },
        {
          text: r.sudahDisetor ? "✓ Disetor" : "Belum",
          align: "center",
          color: r.sudahDisetor ? C_SUCCESS : C_WARNING,
          bold: r.sudahDisetor,
        },
      ], x, y, 5.5, i % 2 === 0 ? undefined : C_ROW_ALT);
    }
  }

  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 65, text: "TOTAL DIPUNGUT" },
    { x: x + tableW - 20 - 1.5, text: rp(totalDipungut), align: "right" },
  ]);
  y = drawTotalRow(doc, x, y, tableW, [
    { x: x + 1.5, text: "Sudah Disetor" },
    { x: x + tableW - 20 - 1.5, text: rp(totalDisetor), align: "right" },
  ]);
  y = drawTotalRow(doc, x, y, tableW, [
    { x: x + 1.5, text: "Belum Disetor" },
    { x: x + tableW - 20 - 1.5, text: rp(totalDipungut - totalDisetor), align: "right" },
  ]);

  const namaDesa = desa?.namaDesa ?? "—";
  drawTTD(doc, W, H, [
    { title: tglTTD(namaDesa), jabatan: "Bendahara Desa,", nama: desa?.namaBendahara ?? "" },
  ]);

  drawFooterAllPages(doc, W, H);
  if (returnBlob) return doc.output("blob") as Blob;
  doc.save(p.filename ?? `BukuPajak_${namaDesa.replace(/ /g, "-")}_${periodeLabel(p.bulan, p.tahun).replace(/ /g, "-")}.pdf`);
}

// ─── 9. Rekapitulasi Buku Pembantu Pajak ─────────────────────────────────────

export interface BukuPajakRekapProps {
  tahun: string;
  dataDesa: DataDesa | null;
  rows: BukuPajakRekapRow[];
  bulan?: number;
  filename?: string;
}

export async function downloadPDF_BukuPajakRekap(p: BukuPajakRekapProps, returnBlob = false): Promise<void | Blob> {
  const doc = await newDoc("portrait");
  const W = 210, H = 297, ML = 10, MB = 50;
  const x = ML;
  const desa = p.dataDesa;

  let y = drawKop(doc, desa, W);
  y = drawJudul(doc, W, y, "RINGKASAN BUKU KAS PEMBANTU PAJAK", periodeLabel(p.bulan, p.tahun));

  const cols: ColDef[] = [
    { label: "No.",        width: 11, align: "center" },
    { label: "Kode Pajak", width: 28             },
    { label: "Nama / Jenis Pajak", width: 65     },
    { label: "Dipungut (Rp)", width: 28, align: "right" },
    { label: "Disetor (Rp)",  width: 28, align: "right" },
    { label: "Sisa (Rp)",     width: 28, align: "right" },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);
  y = drawTableHeader(doc, cols, x, y);

  const totalDipungut = p.rows.reduce((s, r) => s + r.totalDipungut, 0);
  const totalDisetor  = p.rows.reduce((s, r) => s + r.totalDisetor, 0);
  const totalSisa     = p.rows.reduce((s, r) => s + r.sisaBelumDisetor, 0);

  if (!p.rows.length) {
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
        {
          text: rp(r.sisaBelumDisetor),
          align: "right",
          color: r.sisaBelumDisetor > 0 ? C_WARNING : C_SUCCESS,
        },
      ], x, y, 5.5, i % 2 === 0 ? undefined : C_ROW_ALT);
    }
  }

  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 40, text: "TOTAL" },
    { x: x + tableW - 28 - 28 - 1.5, text: rp(totalDipungut), align: "right" },
    { x: x + tableW - 28 - 1.5,       text: rp(totalDisetor),  align: "right" },
    { x: x + tableW - 1.5,            text: rp(totalSisa),     align: "right" },
  ]);

  const namaDesa = desa?.namaDesa ?? "—";
  drawTTD(doc, W, H, [
    { title: tglTTD(namaDesa), jabatan: "Bendahara Desa,", nama: desa?.namaBendahara ?? "" },
  ]);

  drawFooterAllPages(doc, W, H);
  if (returnBlob) return doc.output("blob") as Blob;
  doc.save(p.filename ?? `RekapPajak_${namaDesa.replace(/ /g, "-")}_${periodeLabel(p.bulan, p.tahun).replace(/ /g, "-")}.pdf`);
}

// ─── 10. Buku Pembantu Panjar ─────────────────────────────────────────────────

export interface BukuPanjarProps {
  tahun: string;
  dataDesa: DataDesa | null;
  rows: BukuPanjarRow[];
  bulan?: number;
  filename?: string;
}

export async function downloadPDF_BukuPanjar(p: BukuPanjarProps, returnBlob = false): Promise<void | Blob> {
  const doc = await newDoc("landscape");
  const W = 297, H = 210, ML = 10, MB = 45;
  const x = ML;
  const desa = p.dataDesa;

  let y = drawKop(doc, desa, W);
  y = drawJudul(doc, W, y, "BUKU KAS PEMBANTU UANG MUKA (PANJAR)", periodeLabel(p.bulan, p.tahun));

  const cols: ColDef[] = [
    { label: "No.",           width: 9,  align: "center" },
    { label: "Tanggal",       width: 22             },
    { label: "No. SPP",       width: 28             },
    { label: "Bidang / Sub / Kegiatan", width: 74   },
    { label: "Uraian",        width: 42             },
    { label: "Nilai Panjar (Rp)", width: 30, align: "right" },
    { label: "Sisa (Rp)",    width: 26, align: "right" },
    { label: "Status",        width: 20, align: "center" },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);
  y = drawTableHeader(doc, cols, x, y);

  const totalPanjar = p.rows.reduce((s, r) => s + r.nilaiPanjar, 0);
  const totalSisa   = p.rows.reduce((s, r) => s + r.sisaPanjar, 0);

  if (!p.rows.length) {
    y = drawDataRow(doc, cols, Array(8).fill(0).map((_, i) => i === 3 ? { text: "Belum ada data panjar", color: C_MUTED } : { text: "" }), x, y, 5.5);
  } else {
    for (let i = 0; i < p.rows.length; i++) {
      y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
      const r = p.rows[i];
      const bidangInfo = (r as any).bidangNama
        ? `${(r as any).bidangNama} / ${(r as any).subBidangNama ?? "-"} / ${(r as any).kegiatanNama ?? "-"}`
        : (r as any).uraian ?? r.nomorSPP;
      y = drawDataRow(doc, cols, [
        { text: String(i + 1), align: "center" },
        { text: formatTgl(r.tanggal) },
        { text: r.nomorSPP },
        { text: bidangInfo },
        { text: r.uraian },
        { text: rp(r.nilaiPanjar), align: "right" },
        { text: rp(r.sisaPanjar), align: "right" },
        {
          text: r.statusLunas ? "✓ Lunas" : "Belum",
          align: "center",
          color: r.statusLunas ? C_SUCCESS : C_WARNING,
          bold: r.statusLunas,
        },
      ], x, y, 5.5, i % 2 === 0 ? undefined : C_ROW_ALT);
    }
  }

  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 106, text: "JUMLAH" },
    { x: x + tableW - 20 - 26 - 1.5, text: rp(totalPanjar), align: "right" },
    { x: x + tableW - 20 - 1.5,      text: rp(totalSisa),   align: "right" },
  ]);

  const namaDesa = desa?.namaDesa ?? "—";
  drawTTD(doc, W, H, [
    { title: tglTTD(namaDesa), jabatan: "Bendahara Desa,", nama: desa?.namaBendahara ?? "" },
  ]);

  drawFooterAllPages(doc, W, H);
  if (returnBlob) return doc.output("blob") as Blob;
  doc.save(p.filename ?? `BukuPanjar_${namaDesa.replace(/ /g, "-")}_${periodeLabel(p.bulan, p.tahun).replace(/ /g, "-")}.pdf`);
}

// ─── 11. Laporan Realisasi APBDes Semester I ──────────────────────────────────

export interface RealisasiSemesterIProps {
  tahun: string;
  dataDesa: DataDesa | null;
  belanjaList: KegiatanAPBDes[];
  dicairkanSPP: SPPItem[];
  realisasiPerKegiatan: Record<string, number>;
  filename?: string;
}

export async function downloadPDF_RealisasiSemesterI(p: RealisasiSemesterIProps, returnBlob = false): Promise<void | Blob> {
  const doc = await newDoc("landscape");
  const W = 297, H = 210, ML = 10, MB = 45;
  const x = ML;
  const desa = p.dataDesa;

  let y = drawKop(doc, desa, W);
  y = drawJudul(doc, W, y,
    "LAPORAN REALISASI ANGGARAN PENDAPATAN DAN BELANJA DESA",
    `Semester I (Januari — Juni) Tahun Anggaran ${p.tahun}`
  );

  const cols: ColDef[] = [
    { label: "No.",          width: 9,  align: "center" },
    { label: "Kode Keg.",    width: 24             },
    { label: "Uraian Kegiatan", width: 58          },
    { label: "Anggaran (Rp)", width: 28, align: "right" },
    { label: "Realisasi Sem.I (Rp)", width: 30, align: "right" },
    { label: "%", width: 13, align: "right" },
    { label: "Realisasi s/d Saat Ini (Rp)", width: 30, align: "right" },
    { label: "%", width: 13, align: "right" },
    { label: "Sisa (Rp)", width: 28, align: "right" },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);
  y = drawTableHeader(doc, cols, x, y);

  // Hitung realisasi Semester I (Jan–Jun)
  const realisasiSemI: Record<string, number> = {};
  for (const spp of p.dicairkanSPP) {
    const tgl = (spp as any).dicairkanTanggal ?? spp.tanggal;
    const bln = new Date(tgl).getMonth() + 1;
    if (bln >= 1 && bln <= 6) {
      realisasiSemI[spp.kegiatanId] = (realisasiSemI[spp.kegiatanId] ?? 0) + spp.totalJumlah;
    }
  }

  const totalAnggaran  = p.belanjaList.reduce((s, k) => s + (k.totalPagu ?? 0), 0);
  const totalRealisasi = Object.values(p.realisasiPerKegiatan).reduce((s, v) => s + v, 0);
  const totalSemI      = Object.values(realisasiSemI).reduce((s, v) => s + v, 0);

  if (!p.belanjaList.length) {
    y = drawDataRow(doc, cols, Array(9).fill(0).map((_, i) => i === 2 ? { text: "Belum ada data belanja", color: C_MUTED } : { text: "" }), x, y, 5.5);
  } else {
    for (let i = 0; i < p.belanjaList.length; i++) {
      y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
      const k = p.belanjaList[i];
      const anggaran = k.totalPagu ?? 0;
      const real     = p.realisasiPerKegiatan[k.id] ?? 0;
      const realSemI = realisasiSemI[k.id] ?? 0;
      const sisa     = anggaran - real;
      y = drawDataRow(doc, cols, [
        { text: String(i + 1), align: "center" },
        { text: k.kodeKegiatan },
        { text: k.namaKegiatan },
        { text: rp(anggaran),  align: "right" },
        { text: rp(realSemI),  align: "right" },
        { text: persenStr(realSemI, anggaran), align: "right" },
        { text: rp(real),      align: "right" },
        { text: persenStr(real, anggaran), align: "right" },
        { text: rp(sisa),      align: "right", color: sisa < 0 ? [220, 38, 38] : undefined },
      ], x, y, 5.5, i % 2 === 0 ? undefined : C_ROW_ALT);
    }
  }

  // Grand total row manual
  doc.setFillColor(...C_GRAND_BG);
  doc.rect(x, y, tableW, 6, "F");
  doc.setDrawColor(...C_BORDER);
  doc.rect(x, y, tableW, 6, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...C_HEADER_TEXT);
  const gy = y + 3.9;
  doc.text("TOTAL BELANJA", x + 35, gy);
  const angX    = x + 9 + 24 + 58 + 28;
  const semIX   = angX + 30;
  const pct1X   = semIX + 13;
  const skrnX   = pct1X + 30;
  const pct2X   = skrnX + 13;
  const sisaX   = pct2X + 28;
  doc.text(rp(totalAnggaran),  angX  - 1.5, gy, { align: "right" });
  doc.text(rp(totalSemI),      semIX - 1.5, gy, { align: "right" });
  doc.text(persenStr(totalSemI, totalAnggaran),   pct1X - 1.5, gy, { align: "right" });
  doc.text(rp(totalRealisasi), skrnX - 1.5, gy, { align: "right" });
  doc.text(persenStr(totalRealisasi, totalAnggaran), pct2X - 1.5, gy, { align: "right" });
  doc.text(rp(totalAnggaran - totalRealisasi), sisaX - 1.5, gy, { align: "right" });
  y += 6;

  const namaDesa = desa?.namaDesa ?? "—";
  drawTTD(doc, W, H, [
    { title: tglTTD(namaDesa), jabatan: `Kepala Desa ${namaDesa},`, nama: desa?.namaKepala ?? "" },
    { title: "", jabatan: "Sekretaris Desa,", nama: desa?.namaSekdes ?? "" },
    { title: "", jabatan: "Bendahara Desa,", nama: desa?.namaBendahara ?? "" },
  ]);

  drawFooterAllPages(doc, W, H);
  if (returnBlob) return doc.output("blob") as Blob;
  doc.save(p.filename ?? `LRA-SemesterI_${namaDesa.replace(/ /g, "-")}_${p.tahun}.pdf`);
}
