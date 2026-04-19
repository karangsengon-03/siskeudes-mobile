// src/components/modules/pelaporan/PDFBukuPajakRekap.tsx
// Laporan 8: Buku Pembantu Pajak Rekap — Portrait A4

import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { sharedStyles as S, COLOR } from "./pdfStyles";
import { formatRupiah } from "@/lib/utils";
import type { BukuPajakRekapRow } from "@/hooks/useBukuPembantu";
import type { DataDesa } from "@/hooks/useMaster";

const BULAN_LABEL = ["","Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

interface Props {
  tahun: string;
  dataDesa: DataDesa | null;
  rows: BukuPajakRekapRow[];
  bulan?: number;
}

const COL = { no: "6%", kode: "14%", nama: "35%", dipungut: "15%", disetor: "15%", sisa: "15%" };

export function PDFBukuPajakRekap({ tahun, dataDesa, rows, bulan }: Props) {
  const totalDipungut = rows.reduce((s, r) => s + r.totalDipungut, 0);
  const totalDisetor = rows.reduce((s, r) => s + r.totalDisetor, 0);
  const totalSisa = rows.reduce((s, r) => s + r.sisaBelumDisetor, 0);
  const periodeLabel = bulan ? `Bulan ${BULAN_LABEL[bulan]} ${tahun}` : `Tahun Anggaran ${tahun}`;

  return (
    <Document>
      <Page size="A4" orientation="portrait" style={S.page}>
        <View style={S.docHeader}>
          <Text style={S.docTitle}>REKAPITULASI BUKU PEMBANTU PAJAK</Text>
          <Text style={S.docSubtitle}>
            Desa {dataDesa?.namaDesa ?? "—"}, Kecamatan {dataDesa?.kecamatan ?? "—"},
            Kabupaten {dataDesa?.kabupaten ?? "—"}
          </Text>
          <Text style={S.docInfo}>{periodeLabel}</Text>
        </View>

        <View style={S.table}>
          <View style={S.tableHeader}>
            <Text style={[S.tableHeaderCell, { width: COL.no }]}>No</Text>
            <Text style={[S.tableHeaderCell, { width: COL.kode }]}>Kode Pajak</Text>
            <Text style={[S.tableHeaderCell, { width: COL.nama }]}>Nama Pajak</Text>
            <Text style={[S.tableHeaderCell, { width: COL.dipungut, textAlign: "right" }]}>Dipungut (Rp)</Text>
            <Text style={[S.tableHeaderCell, { width: COL.disetor, textAlign: "right" }]}>Disetor (Rp)</Text>
            <Text style={[{ ...S.tableHeaderCell, borderRightWidth: 0 }, { width: COL.sisa, textAlign: "right" }]}>
              Sisa (Rp)
            </Text>
          </View>

          {rows.length === 0 ? (
            <View style={S.tableRow}>
              <Text style={[S.tableCell, { flex: 1, color: COLOR.textMuted }]}>Belum ada data pajak</Text>
            </View>
          ) : (
            rows.map((row, i) => (
              <View key={row.kodePajak} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                <Text style={[S.tableCell, { width: COL.no, textAlign: "center" }]}>{i + 1}</Text>
                <Text style={[S.tableCell, { width: COL.kode }]}>{row.kodePajak}</Text>
                <Text style={[S.tableCell, { width: COL.nama }]}>{row.namaPajak}</Text>
                <Text style={[S.tableCell, { width: COL.dipungut, textAlign: "right" }]}>
                  {formatRupiah(row.totalDipungut)}
                </Text>
                <Text style={[S.tableCell, { width: COL.disetor, textAlign: "right" }]}>
                  {formatRupiah(row.totalDisetor)}
                </Text>
                <Text style={[S.tableCellLast, { width: COL.sisa, textAlign: "right", color: row.sisaBelumDisetor > 0 ? COLOR.warning : COLOR.success }]}>
                  {formatRupiah(row.sisaBelumDisetor)}
                </Text>
              </View>
            ))
          )}

          <View style={S.grandTotalRow}>
            <Text style={[S.grandTotalCell, { width: COL.no }]}></Text>
            <Text style={[S.grandTotalCell, { width: COL.kode }]}></Text>
            <Text style={[S.grandTotalCell, { width: COL.nama }]}>TOTAL</Text>
            <Text style={[S.grandTotalCell, { width: COL.dipungut, textAlign: "right" }]}>
              {formatRupiah(totalDipungut)}
            </Text>
            <Text style={[S.grandTotalCell, { width: COL.disetor, textAlign: "right" }]}>
              {formatRupiah(totalDisetor)}
            </Text>
            <Text style={[{ ...S.grandTotalCell, borderRightWidth: 0 }, { width: COL.sisa, textAlign: "right" }]}>
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
            <Text style={S.ttdLabel}>Bendahara Desa,</Text>
            <Text style={S.ttdNama}>{dataDesa?.namaBendahara ?? "— ─ —"}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
