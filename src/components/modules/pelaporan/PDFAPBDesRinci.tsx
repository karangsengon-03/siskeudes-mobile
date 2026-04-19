// src/components/modules/pelaporan/PDFAPBDesRinci.tsx
// Laporan 3: APBDes Rinci — Portrait A4
// Menampilkan setiap kegiatan + rekening + sub item RAB

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
} from "@react-pdf/renderer";
import { sharedStyles as S, COLOR, FONT_FAMILY_BOLD } from "./pdfStyles";
import { formatRupiah } from "@/lib/utils";
import type { KegiatanAPBDes } from "@/lib/types";
import type { DataDesa } from "@/hooks/useMaster";

interface Props {
  tahun: string;
  dataDesa: DataDesa | null;
  belanjaList: KegiatanAPBDes[];
}

const COL = {
  no: "5%",
  uraian: "45%",
  vol: "8%",
  sat: "8%",
  harga: "17%",
  jumlah: "17%",
};

export function PDFAPBDesRinci({ tahun, dataDesa, belanjaList }: Props) {
  let no = 1;
  const totalBelanja = belanjaList.reduce((s, k) => s + (k.totalPagu ?? 0), 0);

  return (
    <Document>
      <Page size="A4" orientation="portrait" style={S.page}>
        {/* Header */}
        <View style={S.docHeader}>
          <Text style={S.docTitle}>APBDes RINCI — RENCANA ANGGARAN BELANJA</Text>
          <Text style={S.docSubtitle}>
            Desa {dataDesa?.namaDesa ?? "—"}, Kecamatan {dataDesa?.kecamatan ?? "—"},
            Kabupaten {dataDesa?.kabupaten ?? "—"}
          </Text>
          <Text style={S.docInfo}>Tahun Anggaran {tahun}</Text>
        </View>

        {/* Tabel */}
        <View style={S.table}>
          {/* Header kolom */}
          <View style={S.tableHeader}>
            <Text style={[S.tableHeaderCell, { width: COL.no }]}>No</Text>
            <Text style={[S.tableHeaderCell, { width: COL.uraian }]}>Uraian</Text>
            <Text style={[S.tableHeaderCell, { width: COL.vol, textAlign: "right" }]}>Vol.</Text>
            <Text style={[S.tableHeaderCell, { width: COL.sat }]}>Sat.</Text>
            <Text style={[S.tableHeaderCell, { width: COL.harga, textAlign: "right" }]}>Harga Sat. (Rp)</Text>
            <Text style={[{ ...S.tableHeaderCell, borderRightWidth: 0 }, { width: COL.jumlah, textAlign: "right" }]}>
              Jumlah (Rp)
            </Text>
          </View>

          {belanjaList.length === 0 ? (
            <View style={S.tableRow}>
              <Text style={[S.tableCell, { flex: 1, color: COLOR.textMuted }]}>Belum ada data belanja</Text>
            </View>
          ) : (
            belanjaList.map((kegiatan) => (
              <View key={kegiatan.id}>
                {/* Baris kegiatan (section heading) */}
                <View style={S.sectionRow}>
                  <Text style={[S.sectionCell, { width: COL.no }]}>{no++}</Text>
                  <Text style={[{ ...S.sectionCell, flex: 1 }]}>
                    [{kegiatan.bidangNama} / {kegiatan.subBidangNama}] {kegiatan.namaKegiatan}
                  </Text>
                </View>

                {/* Per rekening */}
                {(kegiatan.rekeningList ?? []).map((rek) => (
                  <View key={rek.id}>
                    {/* Heading rekening */}
                    <View style={{ flexDirection: "row", backgroundColor: "#f1f5f9", borderBottomWidth: 0.5, borderBottomColor: COLOR.border }}>
                      <Text style={[S.tableCell, { width: COL.no }]}></Text>
                      <Text style={[S.tableCellBold, { width: COL.uraian }]}>
                        {rek.kodeRekening} — {rek.namaRekening}
                      </Text>
                      <Text style={[S.tableCell, { width: COL.vol }]}></Text>
                      <Text style={[S.tableCell, { width: COL.sat }]}></Text>
                      <Text style={[S.tableCell, { width: COL.harga }]}></Text>
                      <Text style={[S.tableCellLast, { width: COL.jumlah, textAlign: "right" }]}>
                        {formatRupiah(rek.totalPagu)}
                      </Text>
                    </View>

                    {/* Sub items */}
                    {(rek.subItems ?? []).map((sub, idx) => (
                      <View key={sub.id} style={idx % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                        <Text style={[S.tableCell, { width: COL.no }]}></Text>
                        <Text style={[S.tableCell, { width: COL.uraian, paddingLeft: 12 }]}>{sub.uraian}</Text>
                        <Text style={[S.tableCell, { width: COL.vol, textAlign: "right" }]}>{sub.volume}</Text>
                        <Text style={[S.tableCell, { width: COL.sat }]}>{sub.satuan}</Text>
                        <Text style={[S.tableCell, { width: COL.harga, textAlign: "right" }]}>
                          {formatRupiah(sub.hargaSatuan)}
                        </Text>
                        <Text style={[S.tableCellLast, { width: COL.jumlah, textAlign: "right" }]}>
                          {formatRupiah(sub.jumlah)}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}

                {/* Subtotal kegiatan */}
                <View style={S.totalRow}>
                  <Text style={[S.totalCell, { width: COL.no }]}></Text>
                  <Text style={[S.totalCell, { width: COL.uraian }]}>Total: {kegiatan.namaKegiatan}</Text>
                  <Text style={[S.totalCell, { width: COL.vol }]}></Text>
                  <Text style={[S.totalCell, { width: COL.sat }]}></Text>
                  <Text style={[S.totalCell, { width: COL.harga }]}></Text>
                  <Text style={[{ ...S.totalCell, borderRightWidth: 0 }, { width: COL.jumlah, textAlign: "right" }]}>
                    {formatRupiah(kegiatan.totalPagu)}
                  </Text>
                </View>
              </View>
            ))
          )}

          {/* Grand total */}
          <View style={S.grandTotalRow}>
            <Text style={[S.grandTotalCell, { width: COL.no }]}></Text>
            <Text style={[S.grandTotalCell, { flex: 1 }]}>TOTAL BELANJA</Text>
            <Text style={[{ ...S.grandTotalCell, borderRightWidth: 0 }, { width: COL.jumlah, textAlign: "right" }]}>
              {formatRupiah(totalBelanja)}
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
