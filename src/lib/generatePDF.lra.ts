// src/lib/generatePDF.lra.ts
// ─────────────────────────────────────────────────────────────────────────────
// PDF LAPORAN REALISASI ANGGARAN (LRA)
//   #35 downloadPDF_LRA1A             — LRA 1A Ringkasan Global
//   #36 downloadPDF_LRA1B             — LRA 1B Per Kegiatan
//   #37 downloadPDF_LRA1C             — LRA 1C Rinci Per Sub Item
//   #38 downloadPDF_LRASemester       — LRA Semester I atau II
//   #39 downloadPDF_LRAPerSumberDana  — LRA Per Sumber Dana
//   #40 downloadPDF_LRAKekayaan       — Laporan Kekayaan Milik Desa
// ─────────────────────────────────────────────────────────────────────────────

import type { DataDesa } from "@/hooks/useMaster";
import type { PendapatanItem, KegiatanAPBDes, PembiayaanItem, SPPItem } from "@/lib/types";
import {
  newDoc, rp, tglTTD, persenStr,
  C_ROW_ALT, C_MUTED, C_SUCCESS, C_DIVIDER, C_TOTAL_BG,
  drawKop, drawJudul, drawFooterAllPages, drawTableHeader,
  drawDataRow, drawTotalRow, drawGrandTotalRow, drawSectionRow, drawTTD,
  checkPageBreak,
} from "@/lib/generatePDF.shared";
import type { ColDef } from "@/lib/generatePDF.shared";

// ─── 35. LRA 1A — Ringkasan Global ───────────────────────────────────────────

export interface LRA1AProps {
  tahun: string;
  dataDesa: DataDesa | null;
  pendapatanList: PendapatanItem[];
  belanjaList: KegiatanAPBDes[];
  pembiayaanList: PembiayaanItem[];
  realisasiPendapatan: Record<string, number>;
  realisasiPerRekening: Record<string, number>;
  realisasiPembiayaan?: Record<string, number>;
  nomorPerdes?: string;
  jenisAPBDes?: string;
}

export async function downloadPDF_LRA1A(p: LRA1AProps, returnBlob = false): Promise<void | Blob> {
  const doc = await newDoc("landscape");
  const W = 297, H = 210, ML = 10, MB = 45;
  const x = ML;
  const desa = p.dataDesa;
  const jenisLabel = p.jenisAPBDes ?? "APBDes";

  let y = drawKop(doc, desa, W);
  y = drawJudul(doc, W, y,
    "LAPORAN REALISASI ANGGARAN PENDAPATAN DAN BELANJA DESA",
    `${jenisLabel} Tahun Anggaran ${p.tahun}${p.nomorPerdes ? " — " + p.nomorPerdes : ""}`
  );

  const cols: ColDef[] = [
    { label: "No.",                  width: 9,  align: "center" },
    { label: "Kode Rekening",        width: 30              },
    { label: "Uraian",               width: 76              },
    { label: "Anggaran (Rp)",        width: 38, align: "right" },
    { label: "Realisasi (Rp)",       width: 38, align: "right" },
    { label: "% Real.",              width: 16, align: "right" },
    { label: "Lebih/(Kurang) (Rp)",  width: 38, align: "right" },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);
  y = drawTableHeader(doc, cols, x, y);

  let no = 1;

  // ── PENDAPATAN ──
  const totalAnggaranPend  = p.pendapatanList.reduce((s, item) => s + (item.anggaran ?? 0), 0);
  const totalRealisasiPend = p.pendapatanList.reduce((s, item) =>
    s + (p.realisasiPendapatan[item.kodeRekening] ?? 0), 0);

  y = drawSectionRow(doc, x, y, tableW, "I.  PENDAPATAN");
  for (const item of p.pendapatanList) {
    y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
    const real  = p.realisasiPendapatan[item.kodeRekening] ?? 0;
    const lebih = real - item.anggaran;
    y = drawDataRow(doc, cols, [
      { text: String(no++), align: "center" },
      { text: item.kodeRekening },
      { text: item.namaRekening },
      { text: rp(item.anggaran),                  align: "right" },
      { text: rp(real), align: "right", color: real > item.anggaran ? C_SUCCESS : undefined },
      { text: persenStr(real, item.anggaran),      align: "right" },
      { text: rp(lebih), align: "right", color: lebih < 0 ? [220, 38, 38] : C_SUCCESS },
    ], x, y, 5.5, no % 2 === 0 ? C_ROW_ALT : undefined);
  }
  y = drawTotalRow(doc, x, y, tableW, [
    { x: x + 1.5, text: "JUMLAH PENDAPATAN" },
    { x: x + 9 + 30 + 76 + 38 - 1.5,                    text: rp(totalAnggaranPend),  align: "right" },
    { x: x + 9 + 30 + 76 + 38 + 38 - 1.5,               text: rp(totalRealisasiPend), align: "right" },
    { x: x + 9 + 30 + 76 + 38 + 38 + 16 - 1.5,          text: persenStr(totalRealisasiPend, totalAnggaranPend), align: "right" },
    { x: x + tableW - 1.5,                               text: rp(totalRealisasiPend - totalAnggaranPend), align: "right" },
  ]);

  // ── BELANJA ──
  const totalAnggaranBel  = p.belanjaList.reduce((s, k) => s + (k.totalPagu ?? 0), 0);
  const totalRealisasiBel = p.belanjaList.reduce((s, k) =>
    s + k.rekeningList.reduce((sr, rek) => sr + (p.realisasiPerRekening[rek.kodeRekening] ?? 0), 0), 0);

  y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
  y = drawSectionRow(doc, x, y, tableW, "II.  BELANJA");
  for (const keg of p.belanjaList) {
    y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
    const angKeg  = keg.totalPagu ?? 0;
    const realKeg = keg.rekeningList.reduce((s, rek) => s + (p.realisasiPerRekening[rek.kodeRekening] ?? 0), 0);
    const lebih   = angKeg - realKeg;
    y = drawDataRow(doc, cols, [
      { text: String(no++), align: "center" },
      { text: keg.kodeKegiatan },
      { text: keg.namaKegiatan },
      { text: rp(angKeg),  align: "right" },
      { text: rp(realKeg), align: "right" },
      { text: persenStr(realKeg, angKeg), align: "right" },
      { text: rp(lebih), align: "right", color: lebih < 0 ? [220, 38, 38] : undefined },
    ], x, y, 5.5, no % 2 === 0 ? C_ROW_ALT : undefined);
  }
  y = drawTotalRow(doc, x, y, tableW, [
    { x: x + 1.5, text: "JUMLAH BELANJA" },
    { x: x + 9 + 30 + 76 + 38 - 1.5,           text: rp(totalAnggaranBel),  align: "right" },
    { x: x + 9 + 30 + 76 + 38 + 38 - 1.5,      text: rp(totalRealisasiBel), align: "right" },
    { x: x + 9 + 30 + 76 + 38 + 38 + 16 - 1.5, text: persenStr(totalRealisasiBel, totalAnggaranBel), align: "right" },
    { x: x + tableW - 1.5,                      text: rp(totalAnggaranBel - totalRealisasiBel), align: "right" },
  ]);

  // Surplus / Defisit
  const surplusAngg = totalAnggaranPend  - totalAnggaranBel;
  const surplusReal = totalRealisasiPend - totalRealisasiBel;
  y = checkPageBreak(doc, y, 6, H, MB, cols, x);
  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 1.5, text: "SURPLUS / (DEFISIT)" },
    { x: x + 9 + 30 + 76 + 38 - 1.5,           text: rp(surplusAngg), align: "right" },
    { x: x + 9 + 30 + 76 + 38 + 38 - 1.5,      text: rp(surplusReal), align: "right" },
    { x: x + 9 + 30 + 76 + 38 + 38 + 16 - 1.5, text: persenStr(surplusReal, surplusAngg), align: "right" },
    { x: x + tableW - 1.5,                      text: rp(surplusReal - surplusAngg), align: "right" },
  ]);

  // ── PEMBIAYAAN ──
  const realisasiPemb = p.realisasiPembiayaan ?? {};
  const totalAnggaranPemb  = p.pembiayaanList.reduce((s, item) =>
    s + (item.anggaran ?? 0) * (item.jenis === "pengeluaran" ? -1 : 1), 0);
  const totalRealisasiPemb = p.pembiayaanList.reduce((s, item) => {
    const r = realisasiPemb[item.kodeRekening] ?? 0;
    return s + r * (item.jenis === "pengeluaran" ? -1 : 1);
  }, 0);

  if (p.pembiayaanList.length > 0) {
    y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
    y = drawSectionRow(doc, x, y, tableW, "III.  PEMBIAYAAN");
    for (const item of p.pembiayaanList) {
      y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
      const angg = (item.anggaran ?? 0) * (item.jenis === "pengeluaran" ? -1 : 1);
      const real = (realisasiPemb[item.kodeRekening] ?? 0) * (item.jenis === "pengeluaran" ? -1 : 1);
      y = drawDataRow(doc, cols, [
        { text: String(no++), align: "center" },
        { text: item.kodeRekening },
        { text: item.namaRekening },
        { text: rp(angg),                          align: "right" },
        { text: rp(real),                          align: "right" },
        { text: persenStr(Math.abs(real), Math.abs(angg)), align: "right" },
        { text: rp(real - angg),                   align: "right" },
      ], x, y, 5.5, no % 2 === 0 ? C_ROW_ALT : undefined);
    }
    y = drawTotalRow(doc, x, y, tableW, [
      { x: x + 1.5, text: "PEMBIAYAAN NETTO" },
      { x: x + 9 + 30 + 76 + 38 - 1.5,      text: rp(totalAnggaranPemb),  align: "right" },
      { x: x + 9 + 30 + 76 + 38 + 38 - 1.5, text: rp(totalRealisasiPemb), align: "right" },
      { x: x + tableW - 1.5,                 text: rp(totalRealisasiPemb - totalAnggaranPemb), align: "right" },
    ]);

    const silpaAngg = surplusAngg + totalAnggaranPemb;
    const silpaReal = surplusReal + totalRealisasiPemb;
    y = checkPageBreak(doc, y, 6, H, MB, cols, x);
    y = drawGrandTotalRow(doc, x, y, tableW, [
      { x: x + 1.5, text: "SISA LEBIH PEMBIAYAAN (SiLPA)" },
      { x: x + 9 + 30 + 76 + 38 - 1.5,           text: rp(silpaAngg), align: "right" },
      { x: x + 9 + 30 + 76 + 38 + 38 - 1.5,      text: rp(silpaReal), align: "right" },
      { x: x + 9 + 30 + 76 + 38 + 38 + 16 - 1.5, text: persenStr(silpaReal, silpaAngg), align: "right" },
      { x: x + tableW - 1.5,                      text: rp(silpaReal - silpaAngg), align: "right" },
    ]);
  }

  const namaDesa = desa?.namaDesa ?? "—";
  drawTTD(doc, W, H, [
    { title: tglTTD(namaDesa), jabatan: `Kepala Desa ${namaDesa},`, nama: desa?.namaKepala ?? "" },
    { title: "", jabatan: "Sekretaris Desa,", nama: desa?.namaSekdes ?? "" },
    { title: "", jabatan: "Bendahara Desa,",  nama: desa?.namaBendahara ?? "" },
  ]);

  drawFooterAllPages(doc, W, H);
  if (returnBlob) return doc.output("blob") as Blob;
  doc.save(`LRA-1A_${namaDesa.replace(/ /g, "-")}_${p.tahun}.pdf`);
}

// ─── 36. LRA 1B — Per Kegiatan ────────────────────────────────────────────────

export interface LRA1BProps {
  tahun: string;
  dataDesa: DataDesa | null;
  belanjaList: KegiatanAPBDes[];
  realisasiPerRekening: Record<string, number>;
  jenisAPBDes?: string;
}

export async function downloadPDF_LRA1B(p: LRA1BProps, returnBlob = false): Promise<void | Blob> {
  const doc = await newDoc("landscape");
  const W = 297, H = 210, ML = 10, MB = 45;
  const x = ML;
  const desa = p.dataDesa;
  const jenisLabel = p.jenisAPBDes ?? "APBDes";

  let y = drawKop(doc, desa, W);
  y = drawJudul(doc, W, y,
    "LAPORAN REALISASI ANGGARAN — PER KEGIATAN",
    `${jenisLabel} Tahun Anggaran ${p.tahun}`
  );

  const cols: ColDef[] = [
    { label: "No.",            width: 9,  align: "center" },
    { label: "Kode Keg.",      width: 22              },
    { label: "Nama Kegiatan",  width: 68              },
    { label: "Kode Rek.",      width: 22              },
    { label: "Nama Rekening",  width: 48              },
    { label: "Anggaran (Rp)",  width: 32, align: "right" },
    { label: "Realisasi (Rp)", width: 32, align: "right" },
    { label: "% Real.",        width: 14, align: "right" },
    { label: "Sisa (Rp)",      width: 30, align: "right" },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);
  y = drawTableHeader(doc, cols, x, y);

  let no = 1;
  let grandAngg = 0, grandReal = 0;

  for (const keg of p.belanjaList) {
    y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
    const angKeg  = keg.totalPagu ?? 0;
    const realKeg = keg.rekeningList.reduce((s, rek) => s + (p.realisasiPerRekening[rek.kodeRekening] ?? 0), 0);
    y = drawSectionRow(doc, x, y, tableW, `${keg.kodeKegiatan}  ${keg.namaKegiatan}`);

    for (const rek of keg.rekeningList) {
      y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
      const realRek = p.realisasiPerRekening[rek.kodeRekening] ?? 0;
      const sisa    = (rek.totalPagu ?? 0) - realRek;
      y = drawDataRow(doc, cols, [
        { text: String(no++), align: "center" },
        { text: "" },
        { text: "", indent: 2 },
        { text: rek.kodeRekening },
        { text: rek.namaRekening },
        { text: rp(rek.totalPagu ?? 0), align: "right" },
        { text: rp(realRek),            align: "right" },
        { text: persenStr(realRek, rek.totalPagu ?? 0), align: "right" },
        { text: rp(sisa), align: "right", color: sisa < 0 ? [220, 38, 38] : undefined },
      ], x, y, 5.5, no % 2 === 0 ? C_ROW_ALT : undefined);
    }

    y = drawTotalRow(doc, x, y, tableW, [
      { x: x + 1.5, text: `Sub-Total: ${keg.namaKegiatan}` },
      { x: x + 9 + 22 + 68 + 22 + 48 + 32 - 1.5,           text: rp(angKeg),  align: "right" },
      { x: x + 9 + 22 + 68 + 22 + 48 + 32 + 32 - 1.5,      text: rp(realKeg), align: "right" },
      { x: x + 9 + 22 + 68 + 22 + 48 + 32 + 32 + 14 - 1.5, text: persenStr(realKeg, angKeg), align: "right" },
      { x: x + tableW - 1.5,                                text: rp(angKeg - realKeg), align: "right" },
    ]);
    grandAngg += angKeg;
    grandReal += realKeg;
  }

  y = checkPageBreak(doc, y, 6, H, MB, cols, x);
  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 1.5, text: "TOTAL BELANJA" },
    { x: x + 9 + 22 + 68 + 22 + 48 + 32 - 1.5,           text: rp(grandAngg), align: "right" },
    { x: x + 9 + 22 + 68 + 22 + 48 + 32 + 32 - 1.5,      text: rp(grandReal), align: "right" },
    { x: x + 9 + 22 + 68 + 22 + 48 + 32 + 32 + 14 - 1.5, text: persenStr(grandReal, grandAngg), align: "right" },
    { x: x + tableW - 1.5,                                text: rp(grandAngg - grandReal), align: "right" },
  ]);

  const namaDesa = desa?.namaDesa ?? "—";
  drawTTD(doc, W, H, [
    { title: tglTTD(namaDesa), jabatan: `Kepala Desa ${namaDesa},`, nama: desa?.namaKepala ?? "" },
    { title: "", jabatan: "Sekretaris Desa,", nama: desa?.namaSekdes ?? "" },
    { title: "", jabatan: "Bendahara Desa,",  nama: desa?.namaBendahara ?? "" },
  ]);

  drawFooterAllPages(doc, W, H);
  if (returnBlob) return doc.output("blob") as Blob;
  doc.save(`LRA-1B_PerKegiatan_${(desa?.namaDesa ?? "Desa").replace(/ /g, "-")}_${p.tahun}.pdf`);
}

// ─── 37. LRA 1C — Rinci Per Sub Item ──────────────────────────────────────────

export interface LRA1CProps {
  tahun: string;
  dataDesa: DataDesa | null;
  belanjaList: KegiatanAPBDes[];
  realisasiPerRekening: Record<string, number>;
  jenisAPBDes?: string;
}

export async function downloadPDF_LRA1C(p: LRA1CProps, returnBlob = false): Promise<void | Blob> {
  const doc = await newDoc("landscape");
  const W = 297, H = 210, ML = 10, MB = 45;
  const x = ML;
  const desa = p.dataDesa;
  const jenisLabel = p.jenisAPBDes ?? "APBDes";

  let y = drawKop(doc, desa, W);
  y = drawJudul(doc, W, y,
    "LAPORAN REALISASI ANGGARAN — RINCIAN PER SUB ITEM",
    `${jenisLabel} Tahun Anggaran ${p.tahun}`
  );

  const cols: ColDef[] = [
    { label: "No.",           width: 9,  align: "center" },
    { label: "Kode Keg.",     width: 20              },
    { label: "Kode Rek.",     width: 20              },
    { label: "Uraian",        width: 64              },
    { label: "Vol",           width: 12, align: "center" },
    { label: "Sat.",          width: 14, align: "center" },
    { label: "H. Sat. (Rp)", width: 28, align: "right" },
    { label: "Anggaran (Rp)", width: 30, align: "right" },
    { label: "Realisasi (Rp)", width: 30, align: "right" },
    { label: "% Real.",       width: 14, align: "right" },
    { label: "Sisa (Rp)",     width: 26, align: "right" },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);
  y = drawTableHeader(doc, cols, x, y);

  let no = 1;
  let grandAngg = 0, grandReal = 0;

  for (const keg of p.belanjaList) {
    y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
    y = drawSectionRow(doc, x, y, tableW, `${keg.kodeKegiatan}  ${keg.namaKegiatan}`);

    const angKeg  = keg.totalPagu ?? 0;
    const realKeg = keg.rekeningList.reduce((s, rek) => s + (p.realisasiPerRekening[rek.kodeRekening] ?? 0), 0);

    for (const rek of keg.rekeningList) {
      y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
      const realRek = p.realisasiPerRekening[rek.kodeRekening] ?? 0;
      // Rekening header
      y = drawDataRow(doc, cols, [
        { text: String(no++), align: "center" },
        { text: keg.kodeKegiatan },
        { text: rek.kodeRekening },
        { text: rek.namaRekening, bold: true },
        { text: "" }, { text: "" }, { text: "" },
        { text: rp(rek.totalPagu ?? 0), align: "right", bold: true },
        { text: rp(realRek),            align: "right", bold: true },
        { text: persenStr(realRek, rek.totalPagu ?? 0), align: "right" },
        { text: rp((rek.totalPagu ?? 0) - realRek), align: "right", bold: true },
      ], x, y, 5.5, C_TOTAL_BG);

      // Sub items
      for (const sub of (rek.subItems ?? [])) {
        y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
        const ratioRek = (rek.totalPagu ?? 0) > 0 ? realRek / (rek.totalPagu ?? 1) : 0;
        const realSub  = Math.round((sub.jumlah ?? 0) * ratioRek);
        y = drawDataRow(doc, cols, [
          { text: "", align: "center" },
          { text: "" },
          { text: "" },
          { text: sub.uraian, indent: 4 },
          { text: String(sub.volume ?? 0), align: "center" },
          { text: sub.satuan ?? "",         align: "center" },
          { text: rp(sub.hargaSatuan ?? 0), align: "right" },
          { text: rp(sub.jumlah ?? 0),      align: "right" },
          { text: rp(realSub),              align: "right" },
          { text: persenStr(realSub, sub.jumlah ?? 0), align: "right" },
          { text: rp((sub.jumlah ?? 0) - realSub), align: "right" },
        ], x, y, 5.5, no % 2 === 0 ? C_ROW_ALT : undefined);
        no++;
      }
    }

    y = drawTotalRow(doc, x, y, tableW, [
      { x: x + 1.5, text: `Sub-Total: ${keg.namaKegiatan}` },
      { x: x + 9 + 20 + 20 + 64 + 12 + 14 + 28 + 30 - 1.5,           text: rp(angKeg),  align: "right" },
      { x: x + 9 + 20 + 20 + 64 + 12 + 14 + 28 + 30 + 30 - 1.5,      text: rp(realKeg), align: "right" },
      { x: x + 9 + 20 + 20 + 64 + 12 + 14 + 28 + 30 + 30 + 14 - 1.5, text: persenStr(realKeg, angKeg), align: "right" },
      { x: x + tableW - 1.5,                                           text: rp(angKeg - realKeg), align: "right" },
    ]);
    grandAngg += angKeg;
    grandReal += realKeg;
  }

  y = checkPageBreak(doc, y, 6, H, MB, cols, x);
  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 1.5, text: "TOTAL BELANJA" },
    { x: x + 9 + 20 + 20 + 64 + 12 + 14 + 28 + 30 - 1.5,           text: rp(grandAngg), align: "right" },
    { x: x + 9 + 20 + 20 + 64 + 12 + 14 + 28 + 30 + 30 - 1.5,      text: rp(grandReal), align: "right" },
    { x: x + 9 + 20 + 20 + 64 + 12 + 14 + 28 + 30 + 30 + 14 - 1.5, text: persenStr(grandReal, grandAngg), align: "right" },
    { x: x + tableW - 1.5,                                           text: rp(grandAngg - grandReal), align: "right" },
  ]);

  const namaDesa = desa?.namaDesa ?? "—";
  drawTTD(doc, W, H, [
    { title: tglTTD(namaDesa), jabatan: `Kepala Desa ${namaDesa},`, nama: desa?.namaKepala ?? "" },
    { title: "", jabatan: "Sekretaris Desa,", nama: desa?.namaSekdes ?? "" },
    { title: "", jabatan: "Bendahara Desa,",  nama: desa?.namaBendahara ?? "" },
  ]);

  drawFooterAllPages(doc, W, H);
  if (returnBlob) return doc.output("blob") as Blob;
  doc.save(`LRA-1C_Rinci_${(desa?.namaDesa ?? "Desa").replace(/ /g, "-")}_${p.tahun}.pdf`);
}

// ─── 38. LRA Semester I / II ──────────────────────────────────────────────────

export interface LRASemesterProps {
  tahun: string;
  dataDesa: DataDesa | null;
  semester: 1 | 2;
  belanjaList: KegiatanAPBDes[];
  realisasiPerRekening: Record<string, number>;
  dicairkanSPP: SPPItem[];
}

export async function downloadPDF_LRASemester(p: LRASemesterProps, returnBlob = false): Promise<void | Blob> {
  const doc = await newDoc("landscape");
  const W = 297, H = 210, ML = 10, MB = 45;
  const x = ML;
  const desa = p.dataDesa;
  const bulanAwal  = p.semester === 1 ? 1 : 7;
  const bulanAkhir = p.semester === 1 ? 6 : 12;
  const semLabel   = p.semester === 1 ? "Semester I (Januari — Juni)" : "Semester II (Juli — Desember)";

  // Realisasi khusus semester ini
  const realSem: Record<string, number> = {};
  for (const spp of p.dicairkanSPP) {
    const tgl = (spp as unknown as Record<string, string>).dicairkanTanggal ?? spp.tanggal;
    const bln = new Date(tgl).getMonth() + 1;
    if (bln >= bulanAwal && bln <= bulanAkhir) {
      for (const rin of Object.values(spp.rincianSPP)) {
        realSem[rin.kodeRekening] = (realSem[rin.kodeRekening] ?? 0) + rin.jumlah;
      }
    }
  }

  let y = drawKop(doc, desa, W);
  y = drawJudul(doc, W, y,
    `LAPORAN REALISASI ANGGARAN ${semLabel.toUpperCase()}`,
    `Tahun Anggaran ${p.tahun}`
  );

  const cols: ColDef[] = [
    { label: "No.",              width: 9,  align: "center" },
    { label: "Kode Keg.",        width: 22              },
    { label: "Nama Kegiatan",    width: 64              },
    { label: "Anggaran (Rp)",    width: 32, align: "right" },
    { label: `Real. ${semLabel.slice(0, 10)} (Rp)`, width: 34, align: "right" },
    { label: "% Sem.",           width: 14, align: "right" },
    { label: "Real. s/d Kini (Rp)", width: 34, align: "right" },
    { label: "% Total",          width: 14, align: "right" },
    { label: "Sisa (Rp)",        width: 30, align: "right" },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);
  y = drawTableHeader(doc, cols, x, y);

  let no = 1;
  let grandAngg = 0, grandRealSem = 0, grandRealTotal = 0;

  for (const keg of p.belanjaList) {
    y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
    const angKeg      = keg.totalPagu ?? 0;
    const realSemKeg  = keg.rekeningList.reduce((s, rek) => s + (realSem[rek.kodeRekening] ?? 0), 0);
    const realTotalKeg = keg.rekeningList.reduce((s, rek) => s + (p.realisasiPerRekening[rek.kodeRekening] ?? 0), 0);
    const sisa        = angKeg - realTotalKeg;

    y = drawDataRow(doc, cols, [
      { text: String(no++), align: "center" },
      { text: keg.kodeKegiatan },
      { text: keg.namaKegiatan },
      { text: rp(angKeg),       align: "right" },
      { text: rp(realSemKeg),   align: "right" },
      { text: persenStr(realSemKeg, angKeg), align: "right" },
      { text: rp(realTotalKeg), align: "right" },
      { text: persenStr(realTotalKeg, angKeg), align: "right" },
      { text: rp(sisa), align: "right", color: sisa < 0 ? [220, 38, 38] : undefined },
    ], x, y, 5.5, no % 2 === 0 ? C_ROW_ALT : undefined);

    grandAngg      += angKeg;
    grandRealSem   += realSemKeg;
    grandRealTotal += realTotalKeg;
  }

  y = checkPageBreak(doc, y, 6, H, MB, cols, x);
  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 1.5, text: "TOTAL BELANJA" },
    { x: x + 9 + 22 + 64 + 32 - 1.5,                           text: rp(grandAngg),      align: "right" },
    { x: x + 9 + 22 + 64 + 32 + 34 - 1.5,                      text: rp(grandRealSem),   align: "right" },
    { x: x + 9 + 22 + 64 + 32 + 34 + 14 - 1.5,                 text: persenStr(grandRealSem, grandAngg), align: "right" },
    { x: x + 9 + 22 + 64 + 32 + 34 + 14 + 34 - 1.5,            text: rp(grandRealTotal), align: "right" },
    { x: x + 9 + 22 + 64 + 32 + 34 + 14 + 34 + 14 - 1.5,       text: persenStr(grandRealTotal, grandAngg), align: "right" },
    { x: x + tableW - 1.5,                                      text: rp(grandAngg - grandRealTotal), align: "right" },
  ]);

  const namaDesa = desa?.namaDesa ?? "—";
  drawTTD(doc, W, H, [
    { title: tglTTD(namaDesa), jabatan: `Kepala Desa ${namaDesa},`, nama: desa?.namaKepala ?? "" },
    { title: "", jabatan: "Sekretaris Desa,", nama: desa?.namaSekdes ?? "" },
    { title: "", jabatan: "Bendahara Desa,",  nama: desa?.namaBendahara ?? "" },
  ]);

  drawFooterAllPages(doc, W, H);
  if (returnBlob) return doc.output("blob") as Blob;
  doc.save(`LRA-Sem${p.semester}_${(desa?.namaDesa ?? "Desa").replace(/ /g, "-")}_${p.tahun}.pdf`);
}

// ─── 39. LRA Per Sumber Dana ──────────────────────────────────────────────────

export type SumberDanaLRA = "DD" | "ADD" | "PAD" | "BHPR" | "BKP" | "BKK" | "LAIN";

const SUMBER_DANA_LABEL: Record<SumberDanaLRA, string> = {
  DD:   "Dana Desa (DD)",
  ADD:  "Alokasi Dana Desa (ADD)",
  PAD:  "Pendapatan Asli Desa (PAD)",
  BHPR: "Bagi Hasil Pajak/Retribusi (BHPR)",
  BKP:  "Bantuan Keuangan Provinsi (BKP)",
  BKK:  "Bantuan Keuangan Kabupaten (BKK)",
  LAIN: "Pendapatan Lain-lain",
};

export interface LRAPerSumberDanaProps {
  tahun: string;
  dataDesa: DataDesa | null;
  sumberDana: SumberDanaLRA;
  belanjaList: KegiatanAPBDes[];
  realisasiPerRekening: Record<string, number>;
}

export async function downloadPDF_LRAPerSumberDana(p: LRAPerSumberDanaProps, returnBlob = false): Promise<void | Blob> {
  const doc = await newDoc("landscape");
  const W = 297, H = 210, ML = 10, MB = 45;
  const x = ML;
  const desa = p.dataDesa;
  const sdLabel = SUMBER_DANA_LABEL[p.sumberDana] ?? p.sumberDana;

  let y = drawKop(doc, desa, W);
  y = drawJudul(doc, W, y,
    "LAPORAN REALISASI ANGGARAN PER SUMBER DANA",
    `${sdLabel} — Tahun Anggaran ${p.tahun}`
  );

  const cols: ColDef[] = [
    { label: "No.",            width: 9,  align: "center" },
    { label: "Kode Keg.",      width: 22              },
    { label: "Nama Kegiatan",  width: 68              },
    { label: "Kode Rek.",      width: 22              },
    { label: "Nama Rekening",  width: 50              },
    { label: "Anggaran (Rp)",  width: 33, align: "right" },
    { label: "Realisasi (Rp)", width: 33, align: "right" },
    { label: "% Real.",        width: 14, align: "right" },
    { label: "Sisa (Rp)",      width: 30, align: "right" },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);
  y = drawTableHeader(doc, cols, x, y);

  let no = 1;
  let grandAngg = 0, grandReal = 0;

  for (const keg of p.belanjaList) {
    const filteredRek = keg.rekeningList.filter((rek) => rek.sumberDana === p.sumberDana);
    if (!filteredRek.length) continue;

    y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
    y = drawSectionRow(doc, x, y, tableW, `${keg.kodeKegiatan}  ${keg.namaKegiatan}`);

    let subAngg = 0, subReal = 0;
    for (const rek of filteredRek) {
      y = checkPageBreak(doc, y, 5.5, H, MB, cols, x);
      const real = p.realisasiPerRekening[rek.kodeRekening] ?? 0;
      const sisa = (rek.totalPagu ?? 0) - real;
      y = drawDataRow(doc, cols, [
        { text: String(no++), align: "center" },
        { text: keg.kodeKegiatan },
        { text: keg.namaKegiatan },
        { text: rek.kodeRekening },
        { text: rek.namaRekening },
        { text: rp(rek.totalPagu ?? 0), align: "right" },
        { text: rp(real),               align: "right" },
        { text: persenStr(real, rek.totalPagu ?? 0), align: "right" },
        { text: rp(sisa), align: "right", color: sisa < 0 ? [220, 38, 38] : undefined },
      ], x, y, 5.5, no % 2 === 0 ? C_ROW_ALT : undefined);
      subAngg += rek.totalPagu ?? 0;
      subReal += real;
    }

    y = drawTotalRow(doc, x, y, tableW, [
      { x: x + 1.5, text: `Sub-Total: ${keg.namaKegiatan}` },
      { x: x + 9 + 22 + 68 + 22 + 50 + 33 - 1.5,           text: rp(subAngg), align: "right" },
      { x: x + 9 + 22 + 68 + 22 + 50 + 33 + 33 - 1.5,      text: rp(subReal), align: "right" },
      { x: x + 9 + 22 + 68 + 22 + 50 + 33 + 33 + 14 - 1.5, text: persenStr(subReal, subAngg), align: "right" },
      { x: x + tableW - 1.5,                                text: rp(subAngg - subReal), align: "right" },
    ]);
    grandAngg += subAngg;
    grandReal += subReal;
  }

  if (grandAngg === 0) {
    y = drawDataRow(doc, cols, [
      { text: "" }, { text: "" },
      { text: `Tidak ada data untuk sumber dana: ${sdLabel}`, color: C_MUTED },
      ...Array(6).fill({ text: "" }),
    ], x, y);
  }

  y = checkPageBreak(doc, y, 6, H, MB, cols, x);
  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 1.5, text: `TOTAL ${p.sumberDana}` },
    { x: x + 9 + 22 + 68 + 22 + 50 + 33 - 1.5,           text: rp(grandAngg), align: "right" },
    { x: x + 9 + 22 + 68 + 22 + 50 + 33 + 33 - 1.5,      text: rp(grandReal), align: "right" },
    { x: x + 9 + 22 + 68 + 22 + 50 + 33 + 33 + 14 - 1.5, text: persenStr(grandReal, grandAngg), align: "right" },
    { x: x + tableW - 1.5,                                text: rp(grandAngg - grandReal), align: "right" },
  ]);

  const namaDesa = desa?.namaDesa ?? "—";
  drawTTD(doc, W, H, [
    { title: tglTTD(namaDesa), jabatan: `Kepala Desa ${namaDesa},`, nama: desa?.namaKepala ?? "" },
    { title: "", jabatan: "Bendahara Desa,", nama: desa?.namaBendahara ?? "" },
  ]);

  drawFooterAllPages(doc, W, H);
  if (returnBlob) return doc.output("blob") as Blob;
  doc.save(`LRA-SumberDana_${p.sumberDana}_${(desa?.namaDesa ?? "Desa").replace(/ /g, "-")}_${p.tahun}.pdf`);
}

// ─── 40. Laporan Kekayaan Milik Desa ─────────────────────────────────────────

export interface LRAKekayaanProps {
  tahun: string;
  dataDesa: DataDesa | null;
  totalPenerimaan: number;
  totalPengeluaran: number;
  saldoKasAkhir: number;
  saldoKasTunaiAwal: number;
  saldoBankAwal: number;
  saldoKasTunaiAkhir: number;
  saldoBankAkhir: number;
  hutangPajakTotal: number;
  ekuitasAwal: number;
}

export async function downloadPDF_LRAKekayaan(p: LRAKekayaanProps, returnBlob = false): Promise<void | Blob> {
  const doc = await newDoc("portrait");
  const W = 210, H = 297, x = 15;
  const desa = p.dataDesa;

  let y = drawKop(doc, desa, W);
  y = drawJudul(doc, W, y, "LAPORAN KEKAYAAN MILIK DESA", `Tahun Anggaran ${p.tahun}`);

  doc.setDrawColor(...C_DIVIDER);
  doc.setLineWidth(0.4);
  doc.line(x, y, W - x, y);
  y += 6;

  const cols: ColDef[] = [
    { label: "Uraian",      width: 110, align: "left"  },
    { label: "Jumlah (Rp)", width: 65,  align: "right" },
  ];
  const tableW = cols.reduce((s, c) => s + c.width, 0);

  // ─ ASET
  y = drawTableHeader(doc, cols, x, y);
  y = drawSectionRow(doc, x, y, tableW, "A.  ASET");

  y = drawDataRow(doc, cols, [
    { text: "1. Kas dan Setara Kas", bold: true },
    { text: "" },
  ], x, y, 5.5, C_TOTAL_BG);

  y = drawDataRow(doc, cols, [
    { text: "    a. Kas Tunai", indent: 4 },
    { text: rp(p.saldoKasTunaiAkhir), align: "right" },
  ], x, y);
  y = drawDataRow(doc, cols, [
    { text: "    b. Rekening Bank", indent: 4 },
    { text: rp(p.saldoBankAkhir), align: "right" },
  ], x, y, 5.5, C_ROW_ALT);

  const totalKas = p.saldoKasTunaiAkhir + p.saldoBankAkhir;
  y = drawTotalRow(doc, x, y, tableW, [
    { x: x + 1.5, text: "Sub-Total Kas" },
    { x: x + tableW - 1.5, text: rp(totalKas), align: "right" },
  ]);

  y = drawDataRow(doc, cols, [{ text: "2. Piutang", bold: true }, { text: rp(0), align: "right" }], x, y);
  y = drawDataRow(doc, cols, [{ text: "3. Aset Tetap (Inventaris Desa)", bold: true }, { text: rp(0), align: "right" }], x, y, 5.5, C_ROW_ALT);
  y = drawDataRow(doc, cols, [{ text: "4. Aset Lain-lain", bold: true }, { text: rp(0), align: "right" }], x, y);

  const totalAset = totalKas;
  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 1.5, text: "TOTAL ASET" },
    { x: x + tableW - 1.5, text: rp(totalAset), align: "right" },
  ]);
  y += 4;

  // ─ KEWAJIBAN
  y = drawSectionRow(doc, x, y, tableW, "B.  KEWAJIBAN");
  y = drawDataRow(doc, cols, [
    { text: "1. Hutang Pajak yang Belum Disetor" },
    { text: rp(p.hutangPajakTotal), align: "right" },
  ], x, y);
  y = drawDataRow(doc, cols, [
    { text: "2. Kewajiban Lain-lain" },
    { text: rp(0), align: "right" },
  ], x, y, 5.5, C_ROW_ALT);

  const totalKewajiban = p.hutangPajakTotal;
  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 1.5, text: "TOTAL KEWAJIBAN" },
    { x: x + tableW - 1.5, text: rp(totalKewajiban), align: "right" },
  ]);
  y += 4;

  // ─ EKUITAS
  y = drawSectionRow(doc, x, y, tableW, "C.  EKUITAS");
  y = drawDataRow(doc, cols, [
    { text: "1. Ekuitas Awal Tahun" },
    { text: rp(p.ekuitasAwal), align: "right" },
  ], x, y);

  const surplusReal = p.totalPenerimaan - p.totalPengeluaran;
  y = drawDataRow(doc, cols, [
    { text: "2. Surplus/(Defisit) Tahun Berjalan" },
    { text: rp(surplusReal), align: "right", color: surplusReal < 0 ? [220, 38, 38] : C_SUCCESS },
  ], x, y, 5.5, C_ROW_ALT);

  const totalEkuitas = p.ekuitasAwal + surplusReal;
  y = drawGrandTotalRow(doc, x, y, tableW, [
    { x: x + 1.5, text: "TOTAL EKUITAS" },
    { x: x + tableW - 1.5, text: rp(totalEkuitas), align: "right" },
  ]);

  y += 3;
  const selisih = totalAset - (totalKewajiban + totalEkuitas);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...C_MUTED);
  doc.text(
    `Persamaan Akuntansi: Aset (${rp(totalAset)}) = Kewajiban (${rp(totalKewajiban)}) + Ekuitas (${rp(totalEkuitas)}) | Selisih: ${rp(selisih)}`,
    W / 2, y, { align: "center" }
  );

  const namaDesa = desa?.namaDesa ?? "—";
  drawTTD(doc, W, H, [
    { title: tglTTD(namaDesa), jabatan: `Kepala Desa ${namaDesa},`, nama: desa?.namaKepala ?? "" },
    { title: "", jabatan: "Sekretaris Desa,", nama: desa?.namaSekdes ?? "" },
    { title: "", jabatan: "Bendahara Desa,",  nama: desa?.namaBendahara ?? "" },
  ]);

  drawFooterAllPages(doc, W, H);
  if (returnBlob) return doc.output("blob") as Blob;
  doc.save(`LRA-Kekayaan_${namaDesa.replace(/ /g, "-")}_${p.tahun}.pdf`);
}
