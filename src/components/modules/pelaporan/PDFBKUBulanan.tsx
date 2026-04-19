// src/components/modules/pelaporan/PDFBKUBulanan.tsx
// Laporan 4: BKU Bulanan — Landscape A4

import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { sharedStyles as S, COLOR } from "./pdfStyles";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import type { BKUItem } from "@/lib/types";
import type { DataDesa } from "@/hooks/useMaster";

const BULAN_LABEL = ["","Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

interface Props {
  tahun: string;
  dataDesa: DataDesa | null;
  bkuList: BKUItem[];
  bulan?: number;
}

const COL = {
  no: "4%",
  tanggal: "9%",
  uraian: "30%",
  nomorRef: "13%",
  penerimaan: "14%",
  pengeluaran: "14%",
  saldo: "16%",
};

export function PDFBKUBulanan({ tahun, dataDesa, bkuList, bulan }: Props) {
  const totalPenerimaan = bkuList.reduce((s, b) => s + b.penerimaan, 0);
  const totalPengeluaran = bkuList.reduce((s, b) => s + b.pengeluaran, 0);
  const saldoAkhir = bkuList.length > 0 ? bkuList[bkuList.length - 1].saldo : 0;
  const periodeLabel = bulan ? `Bulan ${BULAN_LABEL[bulan]} ${tahun}` : `Tahun Anggaran ${tahun}`;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={S.pageLandscape}>
        {/* Header */}
        <View style={S.docHeader}>
          <Text style={S.docTitle}>BUKU KAS UMUM (BKU)</Text>
          <Text style={S.docSubtitle}>
            Desa {dataDesa?.namaDesa ?? "—"}, Kecamatan {dataDesa?.kecamatan ?? "—"},
            Kabupaten {dataDesa?.kabupaten ?? "—"}
          </Text>
          <Text style={S.docInfo}>{periodeLabel}</Text>
        </View>

        {/* Tabel */}
        <View style={S.table}>
          <View style={S.tableHeader}>
            <Text style={[S.tableHeaderCell, { width: COL.no }]}>No</Text>
            <Text style={[S.tableHeaderCell, { width: COL.tanggal }]}>Tanggal</Text>
            <Text style={[S.tableHeaderCell, { width: COL.nomorRef }]}>No. Referensi</Text>
            <Text style={[S.tableHeaderCell, { width: COL.uraian }]}>Uraian</Text>
            <Text style={[S.tableHeaderCell, { width: COL.penerimaan, textAlign: "right" }]}>Penerimaan (Rp)</Text>
            <Text style={[S.tableHeaderCell, { width: COL.pengeluaran, textAlign: "right" }]}>Pengeluaran (Rp)</Text>
            <Text style={[{ ...S.tableHeaderCell, borderRightWidth: 0 }, { width: COL.saldo, textAlign: "right" }]}>
              Saldo (Rp)
            </Text>
          </View>

          {bkuList.length === 0 ? (
            <View style={S.tableRow}>
              <Text style={[S.tableCell, { flex: 1, color: COLOR.textMuted }]}>Belum ada data BKU</Text>
            </View>
          ) : (
            bkuList.map((item, i) => (
              <View key={item.id} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                <Text style={[S.tableCell, { width: COL.no, textAlign: "center" }]}>{i + 1}</Text>
                <Text style={[S.tableCell, { width: COL.tanggal }]}>{formatTanggal(item.tanggal)}</Text>
                <Text style={[S.tableCell, { width: COL.nomorRef }]}>{item.nomorRef}</Text>
                <Text style={[S.tableCell, { width: COL.uraian }]}>{item.uraian}</Text>
                <Text style={[S.tableCell, { width: COL.penerimaan, textAlign: "right" }]}>
                  {item.penerimaan > 0 ? formatRupiah(item.penerimaan) : "—"}
                </Text>
                <Text style={[S.tableCell, { width: COL.pengeluaran, textAlign: "right" }]}>
                  {item.pengeluaran > 0 ? formatRupiah(item.pengeluaran) : "—"}
                </Text>
                <Text style={[S.tableCellLast, { width: COL.saldo, textAlign: "right" }]}>
                  {formatRupiah(item.saldo)}
                </Text>
              </View>
            ))
          )}

          {/* Total */}
          <View style={S.grandTotalRow}>
            <Text style={[S.grandTotalCell, { width: COL.no }]}></Text>
            <Text style={[S.grandTotalCell, { width: COL.tanggal }]}></Text>
            <Text style={[S.grandTotalCell, { width: COL.nomorRef }]}></Text>
            <Text style={[S.grandTotalCell, { width: COL.uraian }]}>JUMLAH</Text>
            <Text style={[S.grandTotalCell, { width: COL.penerimaan, textAlign: "right" }]}>
              {formatRupiah(totalPenerimaan)}
            </Text>
            <Text style={[S.grandTotalCell, { width: COL.pengeluaran, textAlign: "right" }]}>
              {formatRupiah(totalPengeluaran)}
            </Text>
            <Text style={[{ ...S.grandTotalCell, borderRightWidth: 0 }, { width: COL.saldo, textAlign: "right" }]}>
              {formatRupiah(saldoAkhir)}
            </Text>
          </View>
        </View>

        {/* TTD */}
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
