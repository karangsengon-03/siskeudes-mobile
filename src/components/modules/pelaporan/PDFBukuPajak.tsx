// src/components/modules/pelaporan/PDFBukuPajak.tsx
// Laporan 7: Buku Pembantu Pajak — Portrait A4

import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { sharedStyles as S, COLOR } from "./pdfStyles";
import { formatRupiah, formatTanggal } from "./pdfStyles";
import type { BukuPajakItem } from "@/hooks/useBukuPembantu";
import type { DataDesa } from "@/hooks/useMaster";

const BULAN_LABEL = ["","Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

interface Props {
  tahun: string;
  dataDesa: DataDesa | null;
  rows: BukuPajakItem[];
  bulan?: number;
}

const COL = {
  no: "4%",
  tanggal: "10%",
  nomorSPJ: "10%",
  uraian: "22%",
  pajak: "12%",
  tarif: "6%",
  dpp: "12%",
  jumlah: "12%",
  status: "12%",
};

export function PDFBukuPajak({ tahun, dataDesa, rows, bulan }: Props) {
  const totalDipungut = rows.reduce((s, r) => s + r.jumlah, 0);
  const totalDisetor = rows.filter((r) => r.sudahDisetor).reduce((s, r) => s + r.jumlah, 0);
  const periodeLabel = bulan ? `Bulan ${BULAN_LABEL[bulan]} ${tahun}` : `Tahun Anggaran ${tahun}`;

  return (
    <Document>
      <Page size="A4" orientation="portrait" style={S.page}>
        <View style={S.docHeader}>
          <Text style={S.docTitle}>BUKU PEMBANTU PAJAK</Text>
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
            <Text style={[S.tableHeaderCell, { width: COL.nomorSPJ }]}>No. SPJ</Text>
            <Text style={[S.tableHeaderCell, { width: COL.uraian }]}>Uraian Kegiatan</Text>
            <Text style={[S.tableHeaderCell, { width: COL.pajak }]}>Jenis Pajak</Text>
            <Text style={[S.tableHeaderCell, { width: COL.tarif, textAlign: "right" }]}>Tarif</Text>
            <Text style={[S.tableHeaderCell, { width: COL.dpp, textAlign: "right" }]}>DPP (Rp)</Text>
            <Text style={[S.tableHeaderCell, { width: COL.jumlah, textAlign: "right" }]}>Jumlah (Rp)</Text>
            <Text style={[{ ...S.tableHeaderCell, borderRightWidth: 0 }, { width: COL.status, textAlign: "center" }]}>
              Status
            </Text>
          </View>

          {rows.length === 0 ? (
            <View style={S.tableRow}>
              <Text style={[S.tableCell, { flex: 1, color: COLOR.textMuted }]}>Belum ada data pajak</Text>
            </View>
          ) : (
            rows.map((row, i) => (
              <View key={row.id} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                <Text style={[S.tableCell, { width: COL.no, textAlign: "center" }]}>{i + 1}</Text>
                <Text style={[S.tableCell, { width: COL.tanggal }]}>{formatTanggal(row.tanggal)}</Text>
                <Text style={[S.tableCell, { width: COL.nomorSPJ }]}>{row.nomorSPJ}</Text>
                <Text style={[S.tableCell, { width: COL.uraian }]}>{row.kegiatanNama}</Text>
                <Text style={[S.tableCell, { width: COL.pajak }]}>{row.kodePajak}</Text>
                <Text style={[S.tableCell, { width: COL.tarif, textAlign: "right" }]}>
                  {(row.tarif * 100).toFixed(1)}%
                </Text>
                <Text style={[S.tableCell, { width: COL.dpp, textAlign: "right" }]}>
                  {formatRupiah(row.dasarPengenaan)}
                </Text>
                <Text style={[S.tableCell, { width: COL.jumlah, textAlign: "right" }]}>
                  {formatRupiah(row.jumlah)}
                </Text>
                <Text style={[S.tableCellLast, { width: COL.status, textAlign: "center", color: row.sudahDisetor ? COLOR.success : COLOR.warning }]}>
                  {row.sudahDisetor ? "✓ Disetor" : "Belum"}
                  {row.nomorSetor ? `\n${row.nomorSetor}` : ""}
                </Text>
              </View>
            ))
          )}

          <View style={S.grandTotalRow}>
            <Text style={[S.grandTotalCell, { width: COL.no }]}></Text>
            <Text style={[S.grandTotalCell, { width: COL.tanggal }]}></Text>
            <Text style={[S.grandTotalCell, { width: COL.nomorSPJ }]}></Text>
            <Text style={[S.grandTotalCell, { width: COL.uraian }]}>TOTAL DIPUNGUT</Text>
            <Text style={[S.grandTotalCell, { width: COL.pajak }]}></Text>
            <Text style={[S.grandTotalCell, { width: COL.tarif }]}></Text>
            <Text style={[S.grandTotalCell, { width: COL.dpp }]}></Text>
            <Text style={[S.grandTotalCell, { width: COL.jumlah, textAlign: "right" }]}>
              {formatRupiah(totalDipungut)}
            </Text>
            <Text style={[{ ...S.grandTotalCell, borderRightWidth: 0 }, { width: COL.status }]}></Text>
          </View>
          <View style={S.totalRow}>
            <Text style={[S.totalCell, { flex: 1 }]}>Sudah Disetor</Text>
            <Text style={[S.totalCell, { width: COL.jumlah, textAlign: "right" }]}>{formatRupiah(totalDisetor)}</Text>
            <Text style={[{ ...S.totalCell, borderRightWidth: 0 }, { width: COL.status }]}></Text>
          </View>
          <View style={S.totalRow}>
            <Text style={[S.totalCell, { flex: 1 }]}>Belum Disetor</Text>
            <Text style={[S.totalCell, { width: COL.jumlah, textAlign: "right" }]}>{formatRupiah(totalDipungut - totalDisetor)}</Text>
            <Text style={[{ ...S.totalCell, borderRightWidth: 0 }, { width: COL.status }]}></Text>
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
