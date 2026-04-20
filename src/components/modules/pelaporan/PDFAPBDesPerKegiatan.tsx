// src/components/modules/pelaporan/PDFAPBDesPerKegiatan.tsx
// Laporan 2: APBDes Per Kegiatan — Portrait A4
// Menampilkan rekapitulasi per kegiatan: anggaran total + per rekening

import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { sharedStyles as S, COLOR } from "./pdfStyles";
import { formatRupiah } from "./pdfStyles";
import type { KegiatanAPBDes } from "@/lib/types";
import type { DataDesa } from "@/hooks/useMaster";

interface Props {
  tahun: string;
  dataDesa: DataDesa | null;
  belanjaList: KegiatanAPBDes[];
  realisasiPerRekening: Record<string, number>;
}

const COL = {
  no: "5%",
  kode: "13%",
  uraian: "44%",
  sumber: "8%",
  anggaran: "15%",
  realisasi: "15%",
};

export function PDFAPBDesPerKegiatan({ tahun, dataDesa, belanjaList, realisasiPerRekening }: Props) {
  const totalAnggaran = belanjaList.reduce((s, k) => s + (k.totalPagu ?? 0), 0);
  const totalRealisasi = belanjaList.reduce((s, k) => {
    const real = (k.rekeningList ?? []).reduce((rs, rek) => rs + (realisasiPerRekening[rek.kodeRekening] ?? 0), 0);
    return s + real;
  }, 0);

  let no = 1;

  return (
    <Document>
      <Page size="A4" orientation="portrait" style={S.page}>
        {/* Header */}
        <View style={S.docHeader}>
          <Text style={S.docTitle}>APBDes PER KEGIATAN — ANGGARAN & REALISASI</Text>
          <Text style={S.docSubtitle}>
            Desa {dataDesa?.namaDesa ?? "—"}, Kecamatan {dataDesa?.kecamatan ?? "—"},
            Kabupaten {dataDesa?.kabupaten ?? "—"}
          </Text>
          <Text style={S.docInfo}>Tahun Anggaran {tahun}</Text>
        </View>

        {/* Tabel */}
        <View style={S.table}>
          <View style={S.tableHeader}>
            <Text style={[S.tableHeaderCell, { width: COL.no }]}>No</Text>
            <Text style={[S.tableHeaderCell, { width: COL.kode }]}>Kode Rek.</Text>
            <Text style={[S.tableHeaderCell, { width: COL.uraian }]}>Uraian</Text>
            <Text style={[S.tableHeaderCell, { width: COL.sumber }]}>Sumber</Text>
            <Text style={[S.tableHeaderCell, { width: COL.anggaran, textAlign: "right" }]}>Anggaran (Rp)</Text>
            <Text style={[{ ...S.tableHeaderCell, borderRightWidth: 0 }, { width: COL.realisasi, textAlign: "right" }]}>
              Realisasi (Rp)
            </Text>
          </View>

          {belanjaList.length === 0 ? (
            <View style={S.tableRow}>
              <Text style={[S.tableCell, { flex: 1, color: COLOR.textMuted }]}>Belum ada data belanja</Text>
            </View>
          ) : (
            belanjaList.map((kegiatan) => {
              const kegiatanReal = (kegiatan.rekeningList ?? []).reduce(
                (rs, rek) => rs + (realisasiPerRekening[rek.kodeRekening] ?? 0),
                0
              );
              return (
                <View key={kegiatan.id}>
                  {/* Heading kegiatan */}
                  <View style={S.sectionRow}>
                    <Text style={[S.sectionCell, { width: COL.no, textAlign: "center" }]}>{no++}</Text>
                    <Text style={[S.sectionCell, { width: COL.kode }]}>{kegiatan.kodeKegiatan}</Text>
                    <Text style={[{ ...S.sectionCell, flex: 1 }]}>{kegiatan.namaKegiatan}</Text>
                    <Text style={[S.sectionCell, { width: COL.sumber }]}></Text>
                    <Text style={[S.sectionCell, { width: COL.anggaran, textAlign: "right" }]}>
                      {formatRupiah(kegiatan.totalPagu)}
                    </Text>
                    <Text style={[{ ...S.sectionCell, borderRightWidth: 0 }, { width: COL.realisasi, textAlign: "right" }]}>
                      {formatRupiah(kegiatanReal)}
                    </Text>
                  </View>

                  {/* Per rekening */}
                  {(kegiatan.rekeningList ?? []).map((rek, ri) => {
                    const rekReal = realisasiPerRekening[rek.kodeRekening] ?? 0;
                    return (
                      <View key={rek.id} style={ri % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                        <Text style={[S.tableCell, { width: COL.no }]}></Text>
                        <Text style={[S.tableCell, { width: COL.kode, paddingLeft: 6 }]}>{rek.kodeRekening}</Text>
                        <Text style={[S.tableCell, { width: COL.uraian, paddingLeft: 10 }]}>{rek.namaRekening}</Text>
                        <Text style={[S.tableCell, { width: COL.sumber, textAlign: "center" }]}>{rek.sumberDana}</Text>
                        <Text style={[S.tableCell, { width: COL.anggaran, textAlign: "right" }]}>
                          {formatRupiah(rek.totalPagu)}
                        </Text>
                        <Text style={[S.tableCellLast, { width: COL.realisasi, textAlign: "right" }]}>
                          {rekReal > 0 ? formatRupiah(rekReal) : "—"}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              );
            })
          )}

          {/* Grand total */}
          <View style={S.grandTotalRow}>
            <Text style={[S.grandTotalCell, { width: COL.no }]}></Text>
            <Text style={[S.grandTotalCell, { width: COL.kode }]}></Text>
            <Text style={[S.grandTotalCell, { width: COL.uraian }]}>TOTAL BELANJA</Text>
            <Text style={[S.grandTotalCell, { width: COL.sumber }]}></Text>
            <Text style={[S.grandTotalCell, { width: COL.anggaran, textAlign: "right" }]}>
              {formatRupiah(totalAnggaran)}
            </Text>
            <Text style={[{ ...S.grandTotalCell, borderRightWidth: 0 }, { width: COL.realisasi, textAlign: "right" }]}>
              {formatRupiah(totalRealisasi)}
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
