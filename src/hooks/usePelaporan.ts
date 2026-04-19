// src/hooks/usePelaporan.ts
"use client";

import { useAPBDes } from "@/hooks/useAPBDes";
import { useDPA } from "@/hooks/useDPA";
import { useBKU } from "@/hooks/useBKU";
import { useBukuBank, useBukuKasTunai, useBukuPajak, useBukuPajakRekap, useBukuPanjar } from "@/hooks/useBukuPembantu";
import { useSPP } from "@/hooks/useSPP";
import { useSPJ } from "@/hooks/useSPJ";
import { useDataDesa } from "@/hooks/useMaster";
import { useAppStore } from "@/store/appStore";
import type { KegiatanAPBDes, PendapatanItem, PembiayaanItem, BKUItem } from "@/lib/types";

// ─── Helper: normalisasi belanja ke array ─────────────────────────
export function normalisasiBelanja(
  belanja: KegiatanAPBDes[] | { [id: string]: KegiatanAPBDes } | undefined
): KegiatanAPBDes[] {
  if (!belanja) return [];
  if (Array.isArray(belanja)) return belanja;
  return Object.values(belanja);
}

// ─── useDataLaporan — satu hook untuk semua laporan ──────────────
export function useDataLaporan(bulan?: number) {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const { data: apbdes, isLoading: loadingAPBDes } = useAPBDes();
  const { data: dpaMap = {}, isLoading: loadingDPA } = useDPA();
  const { data: bkuAll = [], isLoading: loadingBKU } = useBKU(bulan);
  const { data: bukuBank = [], isLoading: loadingBank } = useBukuBank(bulan);
  const { data: bukuKasTunai = [], isLoading: loadingTunai } = useBukuKasTunai(bulan);
  const { data: bukuPajak = [], isLoading: loadingPajak } = useBukuPajak(bulan);
  const { data: bukuPajakRekap = [], isLoading: loadingPajakRekap } = useBukuPajakRekap(bulan);
  const { data: bukuPanjar = [], isLoading: loadingPanjar } = useBukuPanjar(bulan);
  const { data: sppList = [], isLoading: loadingSPP } = useSPP();
  const { data: spjList = [], isLoading: loadingSPJ } = useSPJ();
  const { data: dataDesa, loading: loadingDesa } = useDataDesa();

  const isLoading =
    loadingAPBDes || loadingDPA || loadingBKU || loadingBank || loadingTunai ||
    loadingPajak || loadingPajakRekap || loadingPanjar || loadingSPP || loadingSPJ || loadingDesa;

  const pendapatanList: PendapatanItem[] = apbdes?.pendapatan ?? [];
  const belanjaList: KegiatanAPBDes[] = normalisasiBelanja(apbdes?.belanja);
  const pembiayaanList: PembiayaanItem[] = apbdes?.pembiayaan ?? [];

  // ─── Realisasi SPP per rekening ───────────────────────────────
  const dicairkanSPP = sppList.filter((s) => s.status === "dicairkan");
  const realisasiPerRekening: Record<string, number> = {};
  for (const spp of dicairkanSPP) {
    for (const rin of Object.values(spp.rincianSPP)) {
      realisasiPerRekening[rin.kodeRekening] =
        (realisasiPerRekening[rin.kodeRekening] ?? 0) + rin.jumlah;
    }
  }

  // ─── Realisasi SPP per kegiatan ───────────────────────────────
  const realisasiPerKegiatan: Record<string, number> = {};
  for (const spp of dicairkanSPP) {
    realisasiPerKegiatan[spp.kegiatanId] =
      (realisasiPerKegiatan[spp.kegiatanId] ?? 0) + spp.totalJumlah;
  }

  // ─── Realisasi Penerimaan Semester I (Jan–Jun) ────────────────
  const bkuSemesterI: BKUItem[] = bkuAll.filter((b) => {
    const bln = new Date(b.tanggal).getMonth() + 1;
    return bln >= 1 && bln <= 6;
  });
  const totalPenerimaanSemI = bkuSemesterI
    .filter((b) => b.jenisRef === "penerimaan_tunai" || b.jenisRef === "penerimaan_bank")
    .reduce((s, b) => s + b.penerimaan, 0);
  const totalPengeluaranSemI = bkuSemesterI
    .filter((b) => b.jenisRef === "spp")
    .reduce((s, b) => s + b.pengeluaran, 0);

  return {
    tahun,
    dataDesa,
    isLoading,
    // APBDes
    pendapatanList,
    belanjaList,
    pembiayaanList,
    apbdes,
    // DPA
    dpaMap,
    // BKU
    bkuAll,
    bkuSemesterI,
    totalPenerimaanSemI,
    totalPengeluaranSemI,
    // Buku Pembantu
    bukuBank,
    bukuKasTunai,
    bukuPajak,
    bukuPajakRekap,
    bukuPanjar,
    // SPP & SPJ
    sppList,
    spjList,
    dicairkanSPP,
    realisasiPerRekening,
    realisasiPerKegiatan,
  };
}
