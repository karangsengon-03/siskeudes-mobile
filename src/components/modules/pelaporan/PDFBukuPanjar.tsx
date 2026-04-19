// src/components/modules/pelaporan/PDFBukuPanjar.tsx
// Laporan 9: Buku Pembantu Panjar — Portrait A4

import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { sharedStyles as S, COLOR } from "./pdfStyles";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import type { BukuPanjarRow } from "@/hooks/useBukuPembantu";
import type { DataDesa } from "@/hooks/useMaster";

const BULAN_LABEL = ["","Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

interface Props {
  tahun: string;
  dataDesa: DataDesa | null;
  rows: BukuPanjarRow[];
  bulan?: number;
}

const COL = { no: "5%", tanggal: "12%", nomorSPP: "14%", uraian: "30%", panjar: "17%", sisa: "12%", status: "10%" };

export function PDFBukuPanjar({ tahun, dataDesa, rows, bulan }: Props) {
  const totalPanjar = rows.reduce((s, r) => s + r.nilaiPanjar, 0);
  const totalSisa = rows.reduce((s, r) => s + r.sisaPanjar, 0);
  const periodeLabel = bulan ? `Bulan ${BULAN_LABEL[bulan]} ${tahun}` : `Tahun Anggaran ${tahun}`;

  return (
    <Document>
      <Page size="A4" orientation="portrait" style={S.page}>
        <View style={S.docHeader}>
          <Text style={S.docTitle}>BUKU PEMBANTU PANJAR</Text>
          <Text style={S.docSubtitle}>
            Desa {dataDesa?.namaDesa ?? "—"}, Kecamatan {dataDesa?.kecamatan ?? "—"},
            Kabupaten {dataDesa?.kabupaten ?? "—"}
          </Text>
          <Text style={S.docInfo}>{periodeLabel}</Text>
        </View>

        <View style={S.table}>
          <View style={S.tableHeader}>
            <Text style={[S.tableHeaderCell, { width: COL.no }]}>No</Text>
            <Text style={[S.tableHeaderCell, { width: COL.tanggal }]}>Tanggal</Text>
            <Text style={[S.tableHeaderCell, { width: COL.nomorSPP }]}>No. SPP</Text>
            <Text style={[S.tableHeaderCell, { width: COL.uraian }]}>Uraian</Text>
            <Text style={[S.tableHeaderCell, { width: COL.panjar, textAlign: "right" }]}>Nilai Panjar (Rp)</Text>
            <Text style={[S.tableHeaderCell, { width: COL.sisa, textAlign: "right" }]}>Sisa (Rp)</Text>
            <Text style={[{ ...S.tableHeaderCell, borderRightWidth: 0 }, { width: COL.status, textAlign: "center" }]}>
              Status
            </Text>
          </View>

          {rows.length === 0 ? (
            <View style={S.tableRow}>
              <Text style={[S.tableCell, { flex: 1, color: COLOR.textMuted }]}>Belum ada data panjar</Text>
            </View>
          ) : (
            rows.map((row, i) => (
              <View key={row.id} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                <Text style={[S.tableCell, { width: COL.no, textAlign: "center" }]}>{i + 1}</Text>
                <Text style={[S.tableCell, { width: COL.tanggal }]}>{formatTanggal(row.tanggal)}</Text>
                <Text style={[S.tableCell, { width: COL.nomorSPP }]}>{row.nomorSPP}</Text>
                <Text style={[S.tableCell, { width: COL.uraian }]}>{row.uraian}</Text>
                <Text style={[S.tableCell, { width: COL.panjar, textAlign: "right" }]}>
                  {formatRupiah(row.nilaiPanjar)}
                </Text>
                <Text style={[S.tableCell, { width: COL.sisa, textAlign: "right" }]}>
                  {formatRupiah(row.sisaPanjar)}
                </Text>
                <Text style={[S.tableCellLast, { width: COL.status, textAlign: "center", color: row.statusLunas ? COLOR.success : COLOR.warning }]}>
                  {row.statusLunas ? "Lunas" : "Belum"}
                </Text>
              </View>
            ))
          )}

          <View style={S.grandTotalRow}>
            <Text style={[S.grandTotalCell, { width: COL.no }]}></Text>
            <Text style={[S.grandTotalCell, { width: COL.tanggal }]}></Text>
            <Text style={[S.grandTotalCell, { width: COL.nomorSPP }]}></Text>
            <Text style={[S.grandTotalCell, { width: COL.uraian }]}>JUMLAH</Text>
            <Text style={[S.grandTotalCell, { width: COL.panjar, textAlign: "right" }]}>
              {formatRupiah(totalPanjar)}
            </Text>
            <Text style={[S.grandTotalCell, { width: COL.sisa, textAlign: "right" }]}>
              {formatRupiah(totalSisa)}
            </Text>
            <Text style={[{ ...S.grandTotalCell, borderRightWidth: 0 }, { width: COL.status }]}></Text>
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
