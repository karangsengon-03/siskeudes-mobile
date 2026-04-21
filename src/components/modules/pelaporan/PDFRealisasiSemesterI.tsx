// src/components/modules/pelaporan/PDFRealisasiSemesterI.tsx
// Laporan 10: Realisasi APBDes Semester I — Landscape A4
// Membandingkan anggaran APBDes vs realisasi SPP yang dicairkan Jan–Jun

import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { sharedStyles as S, COLOR } from "./pdfStyles";
import { formatRupiah } from "./pdfStyles";
import type { KegiatanAPBDes, SPPItem } from "@/lib/types";
import type { DataDesa } from "@/hooks/useMaster";

interface Props {
  tahun: string;
  dataDesa: DataDesa | null;
  belanjaList: KegiatanAPBDes[];
  dicairkanSPP: SPPItem[];
  realisasiPerKegiatan: Record<string, number>;
}

const COL = {
  no: "4%",
  kode: "10%",
  uraian: "28%",
  anggaran: "14%",
  realisasi: "14%",
  persen: "8%",
  sisa: "14%",
  ket: "8%",
};

function persen(realisasi: number, anggaran: number): string {
  if (anggaran === 0) return "—";
  return ((realisasi / anggaran) * 100).toFixed(1) + "%";
}

export function PDFRealisasiSemesterI({ tahun, dataDesa, belanjaList, dicairkanSPP, realisasiPerKegiatan }: Props) {
  const totalAnggaran = belanjaList.reduce((s, k) => s + (k.totalPagu ?? 0), 0);
  const totalRealisasi = Object.values(realisasiPerKegiatan).reduce((s, v) => s + v, 0);
  const totalSisa = totalAnggaran - totalRealisasi;

  // Realisasi Semester I = SPP dicairkan Jan–Jun
  const semIIds = new Set(
    dicairkanSPP
      .filter((spp) => {
        const tgl = spp.dicairkanTanggal ?? spp.tanggal;
        const bln = new Date(tgl).getMonth() + 1;
        return bln >= 1 && bln <= 6;
      })
      .map((spp) => spp.kegiatanId)
  );

  const realisasiSemI: Record<string, number> = {};
  for (const spp of dicairkanSPP) {
    const tgl = spp.dicairkanTanggal ?? spp.tanggal;
    const bln = new Date(tgl).getMonth() + 1;
    if (bln >= 1 && bln <= 6) {
      realisasiSemI[spp.kegiatanId] = (realisasiSemI[spp.kegiatanId] ?? 0) + spp.totalJumlah;
    }
  }
  const totalSemI = Object.values(realisasiSemI).reduce((s, v) => s + v, 0);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={S.pageLandscape}>
        <View style={S.docHeader}>
          <Text style={S.docTitle}>LAPORAN REALISASI APBDes SEMESTER I</Text>
          <Text style={S.docSubtitle}>
            Desa {dataDesa?.namaDesa ?? "—"}, Kecamatan {dataDesa?.kecamatan ?? "—"},
            Kabupaten {dataDesa?.kabupaten ?? "—"}
          </Text>
          <Text style={S.docInfo}>Periode Januari — Juni {tahun}</Text>
        </View>

        <View style={S.table}>
          <View style={S.tableHeader}>
            <Text style={[S.tableHeaderCell, { width: COL.no }]}>No</Text>
            <Text style={[S.tableHeaderCell, { width: COL.kode }]}>Kode Keg.</Text>
            <Text style={[S.tableHeaderCell, { width: COL.uraian }]}>Uraian Kegiatan</Text>
            <Text style={[S.tableHeaderCell, { width: COL.anggaran, textAlign: "right" }]}>Anggaran (Rp)</Text>
            <Text style={[S.tableHeaderCell, { width: COL.realisasi, textAlign: "right" }]}>Realisasi Sem. I (Rp)</Text>
            <Text style={[S.tableHeaderCell, { width: COL.persen, textAlign: "right" }]}>%</Text>
            <Text style={[S.tableHeaderCell, { width: COL.realisasi, textAlign: "right" }]}>Realisasi s/d skrg (Rp)</Text>
            <Text style={[S.tableHeaderCell, { width: COL.persen, textAlign: "right" }]}>%</Text>
            <Text style={[S.tableHeaderCell, { borderRightWidth: 0, width: COL.sisa, textAlign: "right" }]}>
              Sisa (Rp)
            </Text>
          </View>

          {belanjaList.length === 0 ? (
            <View style={S.tableRow}>
              <Text style={[S.tableCell, { flex: 1, color: COLOR.textMuted }]}>Belum ada data belanja</Text>
            </View>
          ) : (
            belanjaList.map((k, i) => {
              const anggaran = k.totalPagu ?? 0;
              const real = realisasiPerKegiatan[k.id] ?? 0;
              const realSemI = realisasiSemI[k.id] ?? 0;
              const sisa = anggaran - real;
              return (
                <View key={k.id} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                  <Text style={[S.tableCell, { width: COL.no, textAlign: "center" }]}>{i + 1}</Text>
                  <Text style={[S.tableCell, { width: COL.kode }]}>{k.kodeKegiatan}</Text>
                  <Text style={[S.tableCell, { width: COL.uraian }]}>{k.namaKegiatan}</Text>
                  <Text style={[S.tableCell, { width: COL.anggaran, textAlign: "right" }]}>{formatRupiah(anggaran)}</Text>
                  <Text style={[S.tableCell, { width: COL.realisasi, textAlign: "right" }]}>{formatRupiah(realSemI)}</Text>
                  <Text style={[S.tableCell, { width: COL.persen, textAlign: "right" }]}>{persen(realSemI, anggaran)}</Text>
                  <Text style={[S.tableCell, { width: COL.realisasi, textAlign: "right" }]}>{formatRupiah(real)}</Text>
                  <Text style={[S.tableCell, { width: COL.persen, textAlign: "right" }]}>{persen(real, anggaran)}</Text>
                  <Text style={[S.tableCellLast, { width: COL.sisa, textAlign: "right", color: sisa < 0 ? "#dc2626" : COLOR.text }]}>
                    {formatRupiah(sisa)}
                  </Text>
                </View>
              );
            })
          )}

          <View style={S.grandTotalRow}>
            <Text style={[S.grandTotalCell, { width: COL.no }]}></Text>
            <Text style={[S.grandTotalCell, { width: COL.kode }]}></Text>
            <Text style={[S.grandTotalCell, { width: COL.uraian }]}>TOTAL BELANJA</Text>
            <Text style={[S.grandTotalCell, { width: COL.anggaran, textAlign: "right" }]}>{formatRupiah(totalAnggaran)}</Text>
            <Text style={[S.grandTotalCell, { width: COL.realisasi, textAlign: "right" }]}>{formatRupiah(totalSemI)}</Text>
            <Text style={[S.grandTotalCell, { width: COL.persen, textAlign: "right" }]}>{persen(totalSemI, totalAnggaran)}</Text>
            <Text style={[S.grandTotalCell, { width: COL.realisasi, textAlign: "right" }]}>{formatRupiah(totalRealisasi)}</Text>
            <Text style={[S.grandTotalCell, { width: COL.persen, textAlign: "right" }]}>{persen(totalRealisasi, totalAnggaran)}</Text>
            <Text style={[S.grandTotalCell, { borderRightWidth: 0, width: COL.sisa, textAlign: "right" }]}>
              {formatRupiah(totalSisa)}
            </Text>
          </View>
        </View>

        <View style={S.ttdSection}>
          <View style={S.ttdBox}>
            <Text style={S.ttdLabel}>Mengetahui,{"\n"}Kepala Desa {dataDesa?.namaDesa ?? "—"}</Text>
            <Text style={S.ttdNama}>{dataDesa?.namaKepala ?? "— ─ —"}</Text>
          </View>
          <View style={S.ttdBox}>
            <Text style={S.ttdLabel}>Sekretaris Desa,</Text>
            <Text style={S.ttdNama}>{dataDesa?.namaSekdes ?? "— ─ —"}</Text>
          </View>
          <View style={S.ttdBox}>
            <Text style={S.ttdLabel}>Bendahara Desa,</Text>
            <Text style={S.ttdNama}>{dataDesa?.namaBendahara ?? "— ─ —"}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
