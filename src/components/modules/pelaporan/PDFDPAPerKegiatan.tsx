// src/components/modules/pelaporan/PDFDPAPerKegiatan.tsx
// Laporan 11: DPA Per Kegiatan — Portrait A4
// Menampilkan rencana anggaran kas 12 bulan per kegiatan

import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { sharedStyles as S, COLOR, FONT_FAMILY_BOLD } from "./pdfStyles";
import { formatRupiah } from "./pdfStyles";
import type { KegiatanAPBDes } from "@/lib/types";
import type { DPAKegiatan } from "@/lib/types";
import type { DataDesa } from "@/hooks/useMaster";

const BULAN_SINGKAT = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agt","Sep","Okt","Nov","Des"];

interface Props {
  tahun: string;
  dataDesa: DataDesa | null;
  belanjaList: KegiatanAPBDes[];
  dpaMap: { [kegiatanId: string]: DPAKegiatan };
}

// Landscape — kolom sempit, perlu ukuran kecil
const COL_URAIAN = "22%";
const COL_PAGU = "8%";
const COL_BULAN = "5.4%"; // 12 bulan × 5.4% ≈ 64.8%
const COL_TOTAL_DPA = "5.2%";

export function PDFDPAPerKegiatan({ tahun, dataDesa, belanjaList, dpaMap }: Props) {
  const totalPagu = belanjaList.reduce((s, k) => s + (k.totalPagu ?? 0), 0);

  // Total DPA per bulan (sum semua kegiatan)
  const totalPerBulan: number[] = Array(12).fill(0);
  for (const kegiatan of belanjaList) {
    const dpa = dpaMap[kegiatan.id];
    if (!dpa) continue;
    for (let b = 1; b <= 12; b++) {
      totalPerBulan[b - 1] += dpa.bulan?.[String(b)]?.jumlah ?? 0;
    }
  }
  const grandTotalDPA = totalPerBulan.reduce((s, v) => s + v, 0);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={S.pageLandscape}>
        {/* Header */}
        <View style={S.docHeader}>
          <Text style={S.docTitle}>DOKUMEN PELAKSANAAN ANGGARAN (DPA) — RENCANA KAS PER KEGIATAN</Text>
          <Text style={S.docSubtitle}>
            Desa {dataDesa?.namaDesa ?? "—"}, Kecamatan {dataDesa?.kecamatan ?? "—"},
            Kabupaten {dataDesa?.kabupaten ?? "—"}
          </Text>
          <Text style={S.docInfo}>Tahun Anggaran {tahun}</Text>
        </View>

        {/* Tabel */}
        <View style={S.table}>
          {/* Header baris 1 */}
          <View style={S.tableHeader}>
            <Text style={[S.tableHeaderCell, { width: COL_URAIAN }]}>Uraian Kegiatan</Text>
            <Text style={[S.tableHeaderCell, { width: COL_PAGU, textAlign: "right" }]}>Pagu (Rp)</Text>
            {BULAN_SINGKAT.map((b) => (
              <Text key={b} style={[S.tableHeaderCell, { width: COL_BULAN, textAlign: "right", paddingHorizontal: 2 }]}>
                {b}
              </Text>
            ))}
            <Text style={[S.tableHeaderCell, { borderRightWidth: 0, width: COL_TOTAL_DPA, textAlign: "right" }]}>
              Total DPA
            </Text>
          </View>

          {belanjaList.length === 0 ? (
            <View style={S.tableRow}>
              <Text style={[S.tableCell, { flex: 1, color: COLOR.textMuted }]}>Belum ada data kegiatan</Text>
            </View>
          ) : (
            belanjaList.map((kegiatan, i) => {
              const dpa = dpaMap[kegiatan.id];
              const totalDPA = dpa?.totalDPA ?? 0;
              const isDPAL = dpa?.isDPAL ?? false;

              return (
                <View key={kegiatan.id} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                  {/* Uraian */}
                  <View style={[S.tableCell, { width: COL_URAIAN, flexDirection: "column" }]}>
                    <Text style={{ fontSize: 7, fontFamily: FONT_FAMILY_BOLD }}>
                      {kegiatan.kodeKegiatan}
                    </Text>
                    <Text style={{ fontSize: 6.5 }}>{kegiatan.namaKegiatan}</Text>
                    {isDPAL && (
                      <Text style={{ fontSize: 6, color: COLOR.primary, marginTop: 1 }}>★ DPAL</Text>
                    )}
                  </View>

                  {/* Pagu */}
                  <Text style={[S.tableCell, { width: COL_PAGU, textAlign: "right", fontSize: 6.5 }]}>
                    {formatRupiah(kegiatan.totalPagu)}
                  </Text>

                  {/* 12 bulan */}
                  {Array.from({ length: 12 }, (_, idx) => {
                    const jumlah = dpa?.bulan?.[String(idx + 1)]?.jumlah ?? 0;
                    return (
                      <Text key={idx} style={[S.tableCell, { width: COL_BULAN, textAlign: "right", fontSize: 6, paddingHorizontal: 2 }]}>
                        {jumlah > 0 ? formatRupiah(jumlah) : ""}
                      </Text>
                    );
                  })}

                  {/* Total DPA */}
                  <Text style={[S.tableCellLast, { width: COL_TOTAL_DPA, textAlign: "right", fontSize: 6.5, fontFamily: FONT_FAMILY_BOLD }]}>
                    {totalDPA > 0 ? formatRupiah(totalDPA) : "—"}
                  </Text>
                </View>
              );
            })
          )}

          {/* Baris total */}
          <View style={S.grandTotalRow}>
            <Text style={[S.grandTotalCell, { width: COL_URAIAN }]}>TOTAL</Text>
            <Text style={[S.grandTotalCell, { width: COL_PAGU, textAlign: "right", fontSize: 6.5 }]}>
              {formatRupiah(totalPagu)}
            </Text>
            {totalPerBulan.map((v, idx) => (
              <Text key={idx} style={[S.grandTotalCell, { width: COL_BULAN, textAlign: "right", fontSize: 6, paddingHorizontal: 2 }]}>
                {v > 0 ? formatRupiah(v) : ""}
              </Text>
            ))}
            <Text style={[S.grandTotalCell, { borderRightWidth: 0, width: COL_TOTAL_DPA, textAlign: "right", fontSize: 6.5 }]}>
              {formatRupiah(grandTotalDPA)}
            </Text>
          </View>
        </View>

        {/* Catatan DPAL */}
        {belanjaList.some((k) => dpaMap[k.id]?.isDPAL) && (
          <View style={{ marginTop: 6 }}>
            <Text style={{ fontSize: 7, color: COLOR.textMuted, fontStyle: "italic" }}>
              ★ DPAL = Dokumen Pelaksanaan Anggaran Lanjutan (anggaran diluncurkan dari tahun sebelumnya)
            </Text>
          </View>
        )}

        {/* TTD */}
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
