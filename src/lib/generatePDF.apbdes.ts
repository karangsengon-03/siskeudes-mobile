// src/lib/generatePDF.apbdes.ts
// ─────────────────────────────────────────────────────────────────────────────
// PDF PENGANGGARAN INTI — APBDes
//   #1  downloadPDF_APBDesGlobal      — APBDes 1A (Ringkasan Global)
//   #2  downloadPDF_APBDesPerKegiatan — APBDes 1B (Per Kegiatan + Rekening)
//   #3  downloadPDF_APBDesRinci       — APBDes 1C / RAB Belanja (Sub Item)
// ─────────────────────────────────────────────────────────────────────────────

import type { DataDesa } from "@/hooks/useMaster";
import type { PendapatanItem, KegiatanAPBDes, PembiayaanItem } from "@/lib/types";
import {
  newDoc, rp, tglTTD,
  C_ROW_ALT, C_BORDER, C_TEXT, C_MUTED,
  drawKop, drawJudul, drawFooterAllPages, drawTableHeader,
  drawDataRow, drawTotalRow, drawGrandTotalRow, drawSectionRow, drawTTD,
  checkPageBreak,
} from "@/lib/generatePDF.shared";
import type { ColDef, CellVal } from "@/lib/generatePDF.shared";

// ─── 1. APBDes Global (APBDes 1A) ─────────────────────────────────────────────

export interface APBDesGlobalProps {
  tahun: string;
  dataDesa: DataDesa | null;
  pendapatanList: PendapatanItem[];
  belanjaList: KegiatanAPBDes[];
  pembiayaanList: PembiayaanItem[];
  jenisAPBDes?: "APBDes" | "PAK";
  nomorPerdes?: string;
  filename?: string;
}

export async function downloadPDF_APBDesGlobal(p: APBDesGlobalProps, returnBlob = false): Promise<void | Blob> {
  const doc = await newDoc("portrait");
  const W = 210, H = 297, ML = 10, MB = 50;
  const x = ML;
  const desa = p.dataDesa;
  const jenisLabel = p.jenisAPBDes === "PAK" ? "PERUBAHAN APBDes (PAK)" : "ANGGARAN PENDAPATAN DAN BELANJA DESA";

  let y = drawKop(doc, desa, W);
  y = drawJudul(doc, W, y,
    jenisLabel,
    `Tahun Anggaran ${p.tahun}${p.nomorPerdes ? ` — No. Perdes: ${p.nomorPerdes}` : ""}`
  );

  const cols: ColDef[] = [
    { label: "No.",        width: 9,  align: "center" },
    { label: "Kode Rek.", width: 28              },
    { label: "Uraian",    width: 103             },
    { label: "Sumber Dana", width: 19, align: "center" },
    { label: "Jumlah (Rp)", width: 31, align: "right"  },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);
  y = drawTableHeader(doc, cols, x, y);

  let rowNo = 1;

  // PENDAPATAN
  y = drawSectionRow(doc, x, y, tableW, "4.  PENDAPATAN");
  const totalPendapatan = p.pendapatanList.reduce((s, i) => s + (i.anggaran ?? 0), 0);
  for (const item of p.pendapatanList) {
    y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
    y = drawDataRow(doc, cols, [
      { text: String(rowNo++), align: "center" },
      { text: item.kodeRekening + "." },
      { text: item.namaRekening, indent: 4 },
      { text: item.sumberDana, align: "center" },
      { text: rp(item.anggaran ?? 0), align: "right" },
    ], x, y, 5.5, rowNo % 2 === 0 ? C_ROW_ALT : undefined);
  }
  if (!p.pendapatanList.length) {
    y = drawDataRow(doc, cols, [{ text: "" }, { text: "" }, { text: "Belum ada data", color: C_MUTED }, { text: "" }, { text: "" }], x, y, 5.5);
  }
  y = drawTotalRow(doc, x, y, tableW, [
    { x: x + 39, text: "JUMLAH PENDAPATAN" },
    { x: x + tableW - 1.5, text: rp(totalPendapatan), align: "right" },
  ]);

  // BELANJA
  y = drawSectionRow(doc, x, y, tableW, "5.  BELANJA");
  const totalBelanja = p.belanjaList.reduce((s, k) => s + (k.totalPagu ?? 0), 0);
  for (const k of p.belanjaList) {
    y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
    y = drawDataRow(doc, cols, [
      { text: String(rowNo++), align: "center" },
      { text: k.kodeKegiatan + "." },
      { text: k.namaKegiatan, indent: 4 },
      { text: "—", align: "center" },
      { text: rp(k.totalPagu ?? 0), align: "right" },
    ], x, y, 5.5, rowNo % 2 === 0 ? C_ROW_ALT : undefined);
  }
  if (!p.belanjaList.length) {
    y = drawDataRow(doc, cols, [{ text: "" }, { text: "" }, { text: "Belum ada data", color: C_MUTED }, { text: "" }, { text: "" }], x, y, 5.5);
  }
  y = drawTotalRow(doc, x, y, tableW, [
    { x: x + 39, text: "JUMLAH BELANJA" },
    { x: x + tableW - 1.5, text: rp(totalBelanja), align: "right" },
  ]);

  // SURPLUS/DEFISIT
  const selisih = totalPendapatan - totalBelanja;
  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 39, text: "SURPLUS / (DEFISIT)   [ 4 - 5 ]" },
    { x: x + tableW - 1.5, text: rp(selisih), align: "right" },
  ]);

  // PEMBIAYAAN
  y = drawSectionRow(doc, x, y, tableW, "6.  PEMBIAYAAN");
  const penerimaan = p.pembiayaanList.filter((pm) => pm.jenis === "penerimaan");
  const pengeluaran = p.pembiayaanList.filter((pm) => pm.jenis === "pengeluaran");
  const totPenMasuk = penerimaan.reduce((s, i) => s + (i.anggaran ?? 0), 0);
  const totPenKeluar = pengeluaran.reduce((s, i) => s + (i.anggaran ?? 0), 0);

  y = drawSectionRow(doc, x, y, tableW, "    6.1  Penerimaan Pembiayaan");
  for (const item of penerimaan) {
    y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
    y = drawDataRow(doc, cols, [
      { text: String(rowNo++), align: "center" },
      { text: item.kodeRekening + "." },
      { text: item.namaRekening, indent: 8 },
      { text: item.sumberDana ?? "", align: "center" },
      { text: rp(item.anggaran ?? 0), align: "right" },
    ], x, y, 5.5, rowNo % 2 === 0 ? C_ROW_ALT : undefined);
  }
  y = drawTotalRow(doc, x, y, tableW, [
    { x: x + 39, text: "Jumlah Penerimaan Pembiayaan" },
    { x: x + tableW - 1.5, text: rp(totPenMasuk), align: "right" },
  ]);

  y = drawSectionRow(doc, x, y, tableW, "    6.2  Pengeluaran Pembiayaan");
  for (const item of pengeluaran) {
    y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
    y = drawDataRow(doc, cols, [
      { text: String(rowNo++), align: "center" },
      { text: item.kodeRekening + "." },
      { text: item.namaRekening, indent: 8 },
      { text: "", align: "center" },
      { text: rp(item.anggaran ?? 0), align: "right" },
    ], x, y, 5.5, rowNo % 2 === 0 ? C_ROW_ALT : undefined);
  }
  y = drawTotalRow(doc, x, y, tableW, [
    { x: x + 39, text: "Jumlah Pengeluaran Pembiayaan" },
    { x: x + tableW - 1.5, text: rp(totPenKeluar), align: "right" },
  ]);

  const pembiayaanNetto = totPenMasuk - totPenKeluar;
  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 39, text: "PEMBIAYAAN NETTO   [ 6.1 - 6.2 ]" },
    { x: x + tableW - 1.5, text: rp(pembiayaanNetto), align: "right" },
  ]);
  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 39, text: "SISA LEBIH / KURANG  [ Surplus + Pembiayaan Netto ]" },
    { x: x + tableW - 1.5, text: rp(selisih + pembiayaanNetto), align: "right" },
  ]);

  const namaDesa = desa?.namaDesa ?? "—";
  drawTTD(doc, W, H, [
    {
      title: tglTTD(namaDesa),
      jabatan: `Kepala Desa ${namaDesa},`,
      nama: desa?.namaKepala ?? "",
    },
  ]);

  drawFooterAllPages(doc, W, H);
  if (returnBlob) return doc.output("blob") as Blob;
  doc.save(p.filename ?? `APBDes-1A_${namaDesa.replace(/ /g, "-")}_${p.tahun}.pdf`);
}

// ─── 2. APBDes Per Kegiatan (APBDes 1B) ──────────────────────────────────────

export interface APBDesPerKegiatanProps {
  tahun: string;
  dataDesa: DataDesa | null;
  belanjaList: KegiatanAPBDes[];
  realisasiPerRekening?: Record<string, number>;
  jenisAPBDes?: "APBDes" | "PAK";
  filename?: string;
}

export async function downloadPDF_APBDesPerKegiatan(p: APBDesPerKegiatanProps, returnBlob = false): Promise<void | Blob> {
  const doc = await newDoc("portrait");
  const W = 210, H = 297, ML = 10, MB = 50;
  const x = ML;
  const desa = p.dataDesa;
  const realisasiPerRekening = p.realisasiPerRekening ?? {};
  const jenisLabel = p.jenisAPBDes === "PAK" ? "RINCIAN PERUBAHAN APBDes PER KEGIATAN" : "RINCIAN APBDes PER KEGIATAN";

  let y = drawKop(doc, desa, W);
  y = drawJudul(doc, W, y, jenisLabel, `Tahun Anggaran ${p.tahun}`);

  const cols: ColDef[] = [
    { label: "No.",         width: 8,  align: "center" },
    { label: "Kode Bidang", width: 20             },
    { label: "Kode Sub",    width: 18             },
    { label: "Uraian",      width: 82             },
    { label: "Sumber",      width: 14, align: "center" },
    { label: "Anggaran (Rp)", width: 30, align: "right" },
    { label: "Realisasi (Rp)", width: 18, align: "right" },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);
  y = drawTableHeader(doc, cols, x, y);

  const totalAnggaran = p.belanjaList.reduce((s, k) => s + (k.totalPagu ?? 0), 0);
  const totalRealisasi = p.belanjaList.reduce((s, k) =>
    s + (k.rekeningList ?? []).reduce((rs, r) => rs + (realisasiPerRekening[r.kodeRekening] ?? 0), 0), 0);

  let no = 1;
  let altIdx = 0;
  let prevBidang = "";
  let prevSubBidang = "";

  for (const kegiatan of p.belanjaList) {
    const bidang = kegiatan.kodeKegiatan?.split(".")[0] ?? "";
    const subBidang = kegiatan.kodeKegiatan?.split(".").slice(0, 2).join(".") ?? "";

    if (bidang !== prevBidang) {
      y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
      y = drawSectionRow(doc, x, y, tableW, `Bidang ${bidang}. ${kegiatan.bidangNama ?? ""}`);
      prevBidang = bidang;
      prevSubBidang = "";
    }
    if (subBidang !== prevSubBidang) {
      y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
      y = drawSectionRow(doc, x, y, tableW, `    Sub Bidang ${subBidang}. ${kegiatan.subBidangNama ?? ""}`);
      prevSubBidang = subBidang;
    }

    y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
    const kegReal = (kegiatan.rekeningList ?? []).reduce(
      (rs, rek) => rs + (realisasiPerRekening[rek.kodeRekening] ?? 0), 0);

    const parts = kegiatan.kodeKegiatan?.split(".") ?? [];
    const kodeBidang = parts.slice(0, 2).join(".");
    const kodeSub = parts.join(".");

    y = drawDataRow(doc, cols, [
      { text: String(no++), align: "center" },
      { text: kodeBidang + "." },
      { text: kodeSub + "." },
      { text: kegiatan.namaKegiatan, indent: 4 },
      { text: "—", align: "center" },
      { text: rp(kegiatan.totalPagu ?? 0), align: "right" },
      { text: kegReal > 0 ? rp(kegReal) : "—", align: "right" },
    ], x, y, 5.5, altIdx++ % 2 === 0 ? undefined : C_ROW_ALT);

    for (const rek of kegiatan.rekeningList ?? []) {
      y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
      const rekReal = realisasiPerRekening[rek.kodeRekening] ?? 0;
      y = drawDataRow(doc, cols, [
        { text: "" },
        { text: "" },
        { text: rek.kodeRekening },
        { text: rek.namaRekening, indent: 8 },
        { text: rek.sumberDana ?? "", align: "center" },
        { text: rp(rek.totalPagu ?? 0), align: "right" },
        { text: rekReal > 0 ? rp(rekReal) : "—", align: "right" },
      ], x, y, 5, altIdx++ % 2 === 0 ? undefined : C_ROW_ALT, 6.5);
    }
  }

  if (!p.belanjaList.length) {
    y = drawDataRow(doc, cols, [{ text: "" }, { text: "" }, { text: "" }, { text: "Belum ada data", color: C_MUTED }, { text: "" }, { text: "" }, { text: "" }], x, y, 5.5);
  }

  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 48, text: "TOTAL BELANJA" },
    { x: x + tableW - 18 - 1.5, text: rp(totalAnggaran), align: "right" },
    { x: x + tableW - 1.5, text: rp(totalRealisasi), align: "right" },
  ]);

  const namaDesa = desa?.namaDesa ?? "—";
  drawTTD(doc, W, H, [
    { title: tglTTD(namaDesa), jabatan: `Kepala Desa ${namaDesa},`, nama: desa?.namaKepala ?? "" },
  ]);

  drawFooterAllPages(doc, W, H);
  if (returnBlob) return doc.output("blob") as Blob;
  doc.save(p.filename ?? `APBDes-1B_${namaDesa.replace(/ /g, "-")}_${p.tahun}.pdf`);
}

// ─── 3. APBDes Rinci / RAB Belanja (APBDes 1C) ───────────────────────────────

export interface APBDesRinciProps {
  tahun: string;
  dataDesa: DataDesa | null;
  belanjaList: KegiatanAPBDes[];
  jenisAPBDes?: "APBDes" | "PAK";
  filename?: string;
}

export async function downloadPDF_APBDesRinci(p: APBDesRinciProps, returnBlob = false): Promise<void | Blob> {
  const doc = await newDoc("portrait");
  const W = 210, H = 297, ML = 10, MB = 50;
  const x = ML;
  const desa = p.dataDesa;
  const jenisLabel = p.jenisAPBDes === "PAK" ? "RENCANA ANGGARAN BELANJA (RAB) — PAK" : "RENCANA ANGGARAN BELANJA (RAB)";

  let y = drawKop(doc, desa, W);
  y = drawJudul(doc, W, y, jenisLabel, `Tahun Anggaran ${p.tahun}`);

  const cols: ColDef[] = [
    { label: "No.", width: 9, align: "center" },
    { label: "Uraian / Rekening / Rincian", width: 88 },
    { label: "Vol.", width: 13, align: "right" },
    { label: "Sat.", width: 12 },
    { label: "Harga Satuan (Rp)", width: 36, align: "right" },
    { label: "Jumlah (Rp)", width: 32, align: "right" },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);
  y = drawTableHeader(doc, cols, x, y);

  const totalBelanja = p.belanjaList.reduce((s, k) => s + (k.totalPagu ?? 0), 0);
  let no = 1;
  let altIdx = 0;

  for (const kegiatan of p.belanjaList) {
    y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
    const kegLabel = `${kegiatan.kodeKegiatan}. ${kegiatan.namaKegiatan}`;
    y = drawSectionRow(doc, x, y, tableW, `${no++}. ${kegLabel.substring(0, 88)}`);
    if (kegiatan.bidangNama) {
      y = drawSectionRow(doc, x, y, tableW, `     Bidang: ${kegiatan.bidangNama} / Sub: ${kegiatan.subBidangNama ?? "-"}`);
    }

    for (const rek of kegiatan.rekeningList ?? []) {
      y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
      // Rekening heading
      doc.setFillColor(240, 246, 254);
      doc.rect(x, y, tableW, 5.5, "F");
      doc.setDrawColor(...C_BORDER);
      doc.rect(x, y, tableW, 5.5, "S");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(...C_TEXT);
      doc.text(`  ${rek.kodeRekening}. ${rek.namaRekening}`, x + 1.5 + 9, y + 3.6);
      doc.text(rp(rek.totalPagu ?? 0), x + tableW - 1.5, y + 3.6, { align: "right" });
      y += 5.5;

      for (const sub of rek.subItems ?? []) {
        y = checkPageBreak(doc, y, 4.5, H, MB, cols, x);
        y = drawDataRow(doc, cols, [
          { text: "" },
          { text: sub.uraian, indent: 12 },
          { text: rp(sub.volume), align: "right" },
          { text: sub.satuan },
          { text: rp(sub.hargaSatuan), align: "right" },
          { text: rp(sub.jumlah ?? (sub.volume * sub.hargaSatuan)), align: "right" },
        ], x, y, 4.5, altIdx++ % 2 === 0 ? undefined : C_ROW_ALT, 6.5);
      }
    }

    y = drawTotalRow(doc, x, y, tableW, [
      { x: x + 10, text: `Jumlah Kegiatan ${kegiatan.namaKegiatan.substring(0, 60)}` },
      { x: x + tableW - 1.5, text: rp(kegiatan.totalPagu ?? 0), align: "right" },
    ]);
  }

  if (!p.belanjaList.length) {
    y = drawDataRow(doc, cols, [{ text: "" }, { text: "Belum ada data", color: C_MUTED }, { text: "" }, { text: "" }, { text: "" }, { text: "" }], x, y, 5.5);
  }

  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 10, text: "TOTAL BELANJA" },
    { x: x + tableW - 1.5, text: rp(totalBelanja), align: "right" },
  ]);

  const namaDesa = desa?.namaDesa ?? "—";
  drawTTD(doc, W, H, [
    { title: tglTTD(namaDesa), jabatan: `Kepala Desa ${namaDesa},`, nama: desa?.namaKepala ?? "" },
    { title: "", jabatan: "Sekretaris Desa,", nama: desa?.namaSekdes ?? "" },
    { title: "", jabatan: "Pelaksana Kegiatan,", nama: "" },
  ]);

  drawFooterAllPages(doc, W, H);
  if (returnBlob) return doc.output("blob") as Blob;
  doc.save(p.filename ?? `APBDes-1C_${namaDesa.replace(/ /g, "-")}_${p.tahun}.pdf`);
}
