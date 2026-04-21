// src/components/modules/pelaporan/PDFBukuKasTunai.tsx
// Laporan 5: Buku Pembantu Kas Tunai — Portrait A4

import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { sharedStyles as S, COLOR } from "./pdfStyles";
import { formatRupiah, formatTanggal } from "./pdfStyles";
import type { BukuKasTunaiRow } from "@/hooks/useBukuPembantu";
import type { DataDesa } from "@/hooks/useMaster";

const BULAN_LABEL = ["","Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

interface Props {
  tahun: string;
  dataDesa: DataDesa | null;
  rows: BukuKasTunaiRow[];
  bulan?: number;
}

const COL = { no: "5%", tanggal: "12%", nomorRef: "15%", uraian: "34%", penerimaan: "17%", pengeluaran: "17%" };

export function PDFBukuKasTunai({ tahun, dataDesa, rows, bulan }: Props) {
  const totalPenerimaan = rows.reduce((s, r) => s + r.penerimaan, 0);
  const totalPengeluaran = rows.reduce((s, r) => s + r.pengeluaran, 0);
  const saldoAkhir = rows.length > 0 ? rows[rows.length - 1].saldoBerjalan : 0;
  const periodeLabel = bulan ? `Bulan ${BULAN_LABEL[bulan]} ${tahun}` : `Tahun Anggaran ${tahun}`;

  return (
    <Document>
      <Page size="A4" orientation="portrait" style={S.page}>
        <View style={S.docHeader}>
          <Text style={S.docTitle}>BUKU PEMBANTU KAS TUNAI</Text>
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
            <Text style={[S.tableHeaderCell, { width: COL.nomorRef }]}>No. Referensi</Text>
            <Text style={[S.tableHeaderCell, { width: COL.uraian }]}>Uraian</Text>
            <Text style={[S.tableHeaderCell, { width: COL.penerimaan, textAlign: "right" }]}>Kas Masuk (Rp)</Text>
            <Text style={[S.tableHeaderCell, { borderRightWidth: 0, width: COL.pengeluaran, textAlign: "right" }]}>
              Kas Keluar (Rp)
            </Text>
          </View>

          {rows.length === 0 ? (
            <View style={S.tableRow}>
              <Text style={[S.tableCell, { flex: 1, color: COLOR.textMuted }]}>Belum ada transaksi kas tunai</Text>
            </View>
          ) : (
            rows.map((row, i) => (
              <View key={row.id} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                <Text style={[S.tableCell, { width: COL.no, textAlign: "center" }]}>{i + 1}</Text>
                <Text style={[S.tableCell, { width: COL.tanggal }]}>{formatTanggal(row.tanggal)}</Text>
                <Text style={[S.tableCell, { width: COL.nomorRef }]}>{row.nomorRef}</Text>
                <Text style={[S.tableCell, { width: COL.uraian }]}>{row.uraian}</Text>
                <Text style={[S.tableCell, { width: COL.penerimaan, textAlign: "right" }]}>
                  {row.penerimaan > 0 ? formatRupiah(row.penerimaan) : ""}
                </Text>
                <Text style={[S.tableCellLast, { width: COL.pengeluaran, textAlign: "right" }]}>
                  {row.pengeluaran > 0 ? formatRupiah(row.pengeluaran) : ""}
                </Text>
              </View>
            ))
          )}

          <View style={S.grandTotalRow}>
            <Text style={[S.grandTotalCell, { width: COL.no }]}></Text>
            <Text style={[S.grandTotalCell, { width: COL.tanggal }]}></Text>
            <Text style={[S.grandTotalCell, { width: COL.nomorRef }]}></Text>
            <Text style={[S.grandTotalCell, { width: COL.uraian }]}>JUMLAH</Text>
            <Text style={[S.grandTotalCell, { width: COL.penerimaan, textAlign: "right" }]}>
              {formatRupiah(totalPenerimaan)}
            </Text>
            <Text style={[S.grandTotalCell, { borderRightWidth: 0, width: COL.pengeluaran, textAlign: "right" }]}>
              {formatRupiah(totalPengeluaran)}
            </Text>
          </View>
          <View style={S.totalRow}>
            <Text style={[S.totalCell, { flex: 1 }]}>SALDO KAS TUNAI</Text>
            <Text style={[S.totalCell, { borderRightWidth: 0, width: COL.pengeluaran, textAlign: "right" }]}>
              {formatRupiah(saldoAkhir)}
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
