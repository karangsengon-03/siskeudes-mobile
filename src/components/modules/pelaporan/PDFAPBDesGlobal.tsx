// src/components/modules/pelaporan/PDFAPBDesGlobal.tsx
// Laporan 1: APBDes Global — Portrait A4
// @react-pdf/renderer — TIDAK pakai Tailwind

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
} from "@react-pdf/renderer";
import { sharedStyles as S, COLOR } from "./pdfStyles";
import { formatRupiah } from "./pdfStyles";
import type { PendapatanItem, KegiatanAPBDes, PembiayaanItem } from "@/lib/types";
import type { DataDesa } from "@/hooks/useMaster";

interface Props {
  tahun: string;
  dataDesa: DataDesa | null;
  pendapatanList: PendapatanItem[];
  belanjaList: KegiatanAPBDes[];
  pembiayaanList: PembiayaanItem[];
}

const COL = {
  no: "5%",
  kode: "14%",
  uraian: "51%",
  sumber: "10%",
  anggaran: "20%",
};

function HeaderRow() {
  return (
    <View style={S.tableHeader}>
      <Text style={[S.tableHeaderCell, { width: COL.no }]}>No</Text>
      <Text style={[S.tableHeaderCell, { width: COL.kode }]}>Kode Rek.</Text>
      <Text style={[S.tableHeaderCell, { width: COL.uraian }]}>Uraian</Text>
      <Text style={[S.tableHeaderCell, { width: COL.sumber }]}>Sumber Dana</Text>
      <Text style={[S.tableHeaderCell, { borderRightWidth: 0, width: COL.anggaran, textAlign: "right" }]}>
        Anggaran (Rp)
      </Text>
    </View>
  );
}

function SectionHeading({ label }: { label: string }) {
  return (
    <View style={S.sectionRow}>
      <Text style={[S.sectionCell, { flex: 1 }]}>{label}</Text>
    </View>
  );
}

export function PDFAPBDesGlobal({ tahun, dataDesa, pendapatanList, belanjaList, pembiayaanList }: Props) {
  const totalPendapatan = pendapatanList.reduce((s, p) => s + (p.anggaran ?? 0), 0);
  const totalBelanja = belanjaList.reduce((s, k) => s + (k.totalPagu ?? 0), 0);
  const pembiayaanMasuk = pembiayaanList.filter((p) => p.jenis === "penerimaan").reduce((s, p) => s + (p.anggaran ?? 0), 0);
  const pembiayaanKeluar = pembiayaanList.filter((p) => p.jenis === "pengeluaran").reduce((s, p) => s + (p.anggaran ?? 0), 0);
  const surplusDefisit = totalPendapatan - totalBelanja;

  let rowNo = 1;

  return (
    <Document>
      <Page size="A4" orientation="portrait" style={S.page}>
        {/* Header */}
        <View style={S.docHeader}>
          <Text style={S.docTitle}>ANGGARAN PENDAPATAN DAN BELANJA DESA (APBDes)</Text>
          <Text style={S.docSubtitle}>
            Desa {dataDesa?.namaDesa ?? "—"}, Kecamatan {dataDesa?.kecamatan ?? "—"},
            Kabupaten {dataDesa?.kabupaten ?? "—"}
          </Text>
          <Text style={S.docInfo}>Tahun Anggaran {tahun}</Text>
        </View>

        {/* Tabel */}
        <View style={S.table}>
          <HeaderRow />

          {/* ── PENDAPATAN ── */}
          <SectionHeading label="I. PENDAPATAN" />
          {pendapatanList.length === 0 ? (
            <View style={S.tableRow}><Text style={[S.tableCell, { flex: 1, color: COLOR.textMuted }]}>Belum ada data pendapatan</Text></View>
          ) : (
            pendapatanList.map((item, i) => (
              <View key={item.id} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                <Text style={[S.tableCell, { width: COL.no, textAlign: "center" }]}>{rowNo++}</Text>
                <Text style={[S.tableCell, { width: COL.kode }]}>{item.kodeRekening}</Text>
                <Text style={[S.tableCell, { width: COL.uraian }]}>{item.namaRekening}</Text>
                <Text style={[S.tableCell, { width: COL.sumber, textAlign: "center" }]}>{item.sumberDana}</Text>
                <Text style={[S.tableCellLast, { width: COL.anggaran, textAlign: "right" }]}>
                  {formatRupiah(item.anggaran)}
                </Text>
              </View>
            ))
          )}
          {/* Subtotal Pendapatan */}
          <View style={S.totalRow}>
            <Text style={[S.totalCell, { width: COL.no }]}></Text>
            <Text style={[S.totalCell, { width: COL.kode }]}></Text>
            <Text style={[S.totalCell, { width: COL.uraian }]}>JUMLAH PENDAPATAN</Text>
            <Text style={[S.totalCell, { width: COL.sumber }]}></Text>
            <Text style={[S.totalCell, { borderRightWidth: 0, width: COL.anggaran, textAlign: "right" }]}>
              {formatRupiah(totalPendapatan)}
            </Text>
          </View>

          {/* ── BELANJA ── */}
          <SectionHeading label="II. BELANJA" />
          {belanjaList.length === 0 ? (
            <View style={S.tableRow}><Text style={[S.tableCell, { flex: 1, color: COLOR.textMuted }]}>Belum ada data belanja</Text></View>
          ) : (
            belanjaList.map((k, i) => (
              <View key={k.id} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                <Text style={[S.tableCell, { width: COL.no, textAlign: "center" }]}>{rowNo++}</Text>
                <Text style={[S.tableCell, { width: COL.kode }]}>{k.kodeKegiatan}</Text>
                <Text style={[S.tableCell, { width: COL.uraian }]}>{k.namaKegiatan}</Text>
                <Text style={[S.tableCell, { width: COL.sumber, textAlign: "center" }]}>—</Text>
                <Text style={[S.tableCellLast, { width: COL.anggaran, textAlign: "right" }]}>
                  {formatRupiah(k.totalPagu)}
                </Text>
              </View>
            ))
          )}
          <View style={S.totalRow}>
            <Text style={[S.totalCell, { width: COL.no }]}></Text>
            <Text style={[S.totalCell, { width: COL.kode }]}></Text>
            <Text style={[S.totalCell, { width: COL.uraian }]}>JUMLAH BELANJA</Text>
            <Text style={[S.totalCell, { width: COL.sumber }]}></Text>
            <Text style={[S.totalCell, { borderRightWidth: 0, width: COL.anggaran, textAlign: "right" }]}>
              {formatRupiah(totalBelanja)}
            </Text>
          </View>

          {/* ── SURPLUS / DEFISIT ── */}
          <View style={S.grandTotalRow}>
            <Text style={[S.grandTotalCell, { width: COL.no }]}></Text>
            <Text style={[S.grandTotalCell, { width: COL.kode }]}></Text>
            <Text style={[S.grandTotalCell, { width: COL.uraian }]}>SURPLUS / (DEFISIT)</Text>
            <Text style={[S.grandTotalCell, { width: COL.sumber }]}></Text>
            <Text style={[S.grandTotalCell, { borderRightWidth: 0, width: COL.anggaran, textAlign: "right" }]}>
              {formatRupiah(surplusDefisit)}
            </Text>
          </View>

          {/* ── PEMBIAYAAN ── */}
          <SectionHeading label="III. PEMBIAYAAN" />
          <SectionHeading label="   a. Penerimaan Pembiayaan" />
          {pembiayaanList.filter((p) => p.jenis === "penerimaan").map((item, i) => (
            <View key={item.id} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
              <Text style={[S.tableCell, { width: COL.no, textAlign: "center" }]}>{rowNo++}</Text>
              <Text style={[S.tableCell, { width: COL.kode }]}>{item.kodeRekening}</Text>
              <Text style={[S.tableCell, { width: COL.uraian }]}>{item.namaRekening}</Text>
              <Text style={[S.tableCell, { width: COL.sumber }]}></Text>
              <Text style={[S.tableCellLast, { width: COL.anggaran, textAlign: "right" }]}>
                {formatRupiah(item.anggaran)}
              </Text>
            </View>
          ))}
          <View style={S.totalRow}>
            <Text style={[S.totalCell, { width: COL.no }]}></Text>
            <Text style={[S.totalCell, { width: COL.kode }]}></Text>
            <Text style={[S.totalCell, { width: COL.uraian }]}>Jumlah Penerimaan Pembiayaan</Text>
            <Text style={[S.totalCell, { width: COL.sumber }]}></Text>
            <Text style={[S.totalCell, { borderRightWidth: 0, width: COL.anggaran, textAlign: "right" }]}>
              {formatRupiah(pembiayaanMasuk)}
            </Text>
          </View>

          <SectionHeading label="   b. Pengeluaran Pembiayaan" />
          {pembiayaanList.filter((p) => p.jenis === "pengeluaran").map((item, i) => (
            <View key={item.id} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
              <Text style={[S.tableCell, { width: COL.no, textAlign: "center" }]}>{rowNo++}</Text>
              <Text style={[S.tableCell, { width: COL.kode }]}>{item.kodeRekening}</Text>
              <Text style={[S.tableCell, { width: COL.uraian }]}>{item.namaRekening}</Text>
              <Text style={[S.tableCell, { width: COL.sumber }]}></Text>
              <Text style={[S.tableCellLast, { width: COL.anggaran, textAlign: "right" }]}>
                {formatRupiah(item.anggaran)}
              </Text>
            </View>
          ))}
          <View style={S.grandTotalRow}>
            <Text style={[S.grandTotalCell, { width: COL.no }]}></Text>
            <Text style={[S.grandTotalCell, { width: COL.kode }]}></Text>
            <Text style={[S.grandTotalCell, { width: COL.uraian }]}>PEMBIAYAAN NETTO (a - b)</Text>
            <Text style={[S.grandTotalCell, { width: COL.sumber }]}></Text>
            <Text style={[S.grandTotalCell, { borderRightWidth: 0, width: COL.anggaran, textAlign: "right" }]}>
              {formatRupiah(pembiayaanMasuk - pembiayaanKeluar)}
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
