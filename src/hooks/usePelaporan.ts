// src/hooks/usePelaporan.ts
"use client";

import { useAPBDes, useAPBDesMeta } from "@/hooks/useAPBDes";
import { useDPA } from "@/hooks/useDPA";
import { useBKU } from "@/hooks/useBKU";
import { useBukuBank, useBukuKasTunai, useBukuPajak, useBukuPajakRekap, useBukuPanjar } from "@/hooks/useBukuPembantu";
import { useSPP } from "@/hooks/useSPP";
import { useSPJ } from "@/hooks/useSPJ";
import { usePenerimaan } from "@/hooks/usePenerimaan";
import { useDataDesa } from "@/hooks/useMaster";
import { useSaldoAwal } from "@/hooks/useSaldoAwal";
import { useAppStore } from "@/store/appStore";
import type { KegiatanAPBDes, PendapatanItem, PembiayaanItem, BKUItem, SPPItem, RincianSPP, PenerimaanItem } from "@/lib/types";

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
  const tahun = useAppStore((s: { tahunAnggaran: string }) => s.tahunAnggaran);
  const { data: apbdes, isLoading: loadingAPBDes } = useAPBDes("awal");
  const { data: apbdesPAK, isLoading: loadingAPBDesPAK } = useAPBDes("pak");
  const { data: apbdesMeta, isLoading: loadingMeta } = useAPBDesMeta();
  const { data: dpaMap = {}, isLoading: loadingDPA } = useDPA();
  const { data: bkuAll = [], isLoading: loadingBKU } = useBKU(bulan);
  const { data: bukuBank = [], isLoading: loadingBank } = useBukuBank(bulan);
  const { data: bukuKasTunai = [], isLoading: loadingTunai } = useBukuKasTunai(bulan);
  const { data: bukuPajak = [], isLoading: loadingPajak } = useBukuPajak(bulan);
  const { data: bukuPajakRekap = [], isLoading: loadingPajakRekap } = useBukuPajakRekap(bulan);
  const { data: bukuPanjar = [], isLoading: loadingPanjar } = useBukuPanjar(bulan);
  const { data: sppList = [], isLoading: loadingSPP } = useSPP();
  const { data: spjList = [], isLoading: loadingSPJ } = useSPJ();
  const { data: penerimaanList = [], isLoading: loadingPenerimaan } = usePenerimaan();
  const { data: dataDesa, loading: loadingDesa } = useDataDesa();
  const { data: saldoAwal, isLoading: loadingSaldoAwal } = useSaldoAwal();

  const isLoading =
    loadingAPBDes || loadingAPBDesPAK || loadingMeta ||
    loadingDPA || loadingBKU || loadingBank || loadingTunai ||
    loadingPajak || loadingPajakRekap || loadingPanjar || loadingSPP || loadingSPJ || loadingPenerimaan || loadingDesa || loadingSaldoAwal;

  const pendapatanList: PendapatanItem[] = apbdes?.pendapatan ?? [];
  const belanjaList: KegiatanAPBDes[] = normalisasiBelanja(apbdes?.belanja);
  const pembiayaanList: PembiayaanItem[] = apbdes?.pembiayaan ?? [];

  // PAK data
  const pakPendapatanList: PendapatanItem[] = apbdesPAK?.pendapatan ?? [];
  const pakBelanjaList: KegiatanAPBDes[] = normalisasiBelanja(apbdesPAK?.belanja);
  const pakPembiayaanList: PembiayaanItem[] = apbdesPAK?.pembiayaan ?? [];
  const hasPAK = apbdesMeta?.statusPAK !== "belum_ada" && pakBelanjaList.length > 0;

  // ─── Realisasi SPP per rekening ───────────────────────────────
  const dicairkanSPP = sppList.filter((s: SPPItem) => s.status === "dicairkan");
  const realisasiPerRekening: Record<string, number> = {};
  for (const spp of dicairkanSPP) {
    for (const rin of Object.values(spp.rincianSPP) as RincianSPP[]) {
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
  const bkuSemesterI: BKUItem[] = bkuAll.filter((b: BKUItem) => {
    const bln = new Date(b.tanggal).getMonth() + 1;
    return bln >= 1 && bln <= 6;
  });
  const totalPenerimaanSemI = bkuSemesterI
    .filter((b) => b.jenisRef === "penerimaan_tunai" || b.jenisRef === "penerimaan_bank")
    .reduce((s, b) => s + b.penerimaan, 0);
  const totalPengeluaranSemI = bkuSemesterI
    .filter((b) => b.jenisRef === "spp")
    .reduce((s, b) => s + b.pengeluaran, 0);

  // ─── Realisasi Pendapatan per kode rekening ───────────────────
  const realisasiPendapatan: Record<string, number> = {};
  for (const pen of penerimaanList as PenerimaanItem[]) {
    const matching = pendapatanList.filter((p: PendapatanItem) => p.sumberDana === pen.sumberDana);
    if (matching.length === 1) {
      realisasiPendapatan[matching[0].kodeRekening] =
        (realisasiPendapatan[matching[0].kodeRekening] ?? 0) + pen.jumlah;
    } else if (matching.length > 1) {
      const porsi = pen.jumlah / matching.length;
      for (const m of matching) {
        realisasiPendapatan[m.kodeRekening] = (realisasiPendapatan[m.kodeRekening] ?? 0) + porsi;
      }
    }
  }

  // ─── Realisasi Pembiayaan (default kosong — belum ada mekanisme khusus) ──
  const realisasiPembiayaan: Record<string, number> = {};

  // ─── Data Kekayaan Desa ───────────────────────────────────────
  const lastBKU = bkuAll.length > 0 ? bkuAll[bkuAll.length - 1] as BKUItem : null;
  const saldoKasAkhir = lastBKU?.saldo ?? 0;

  const hp = saldoAwal?.hutangPajak;
  const hutangPajakTotal = hp
    ? (hp.ppn ?? 0) + (hp.pph22 ?? 0) + (hp.pph23 ?? 0) + (hp.pajakDaerah ?? 0)
    : 0;
  const ekuitasAwal = saldoAwal?.ekuitas ?? 0;
  const saldoKasTunaiAwal = saldoAwal?.kasTunai ?? 0;
  const saldoBankAwal = saldoAwal?.bank ?? 0;

  const totalPenerimaanBKU = bkuAll
    .filter((b: BKUItem) => b.jenisRef === "penerimaan_tunai" || b.jenisRef === "penerimaan_bank")
    .reduce((s: number, b: BKUItem) => s + b.penerimaan, 0);
  const totalPengeluaranBKU = dicairkanSPP.reduce((s: number, spp: SPPItem) => s + spp.totalJumlah, 0);
  // Estimasi saldo kas tunai & bank akhir berdasarkan saldo awal + arus
  const tunaiRatio = (saldoKasTunaiAwal + saldoBankAwal) > 0
    ? saldoKasTunaiAwal / (saldoKasTunaiAwal + saldoBankAwal)
    : 0.5;
  const saldoKasTunaiAkhir = Math.max(0, saldoKasAkhir * tunaiRatio);
  const saldoBankAkhir = Math.max(0, saldoKasAkhir * (1 - tunaiRatio));

  return {
    tahun,
    dataDesa,
    isLoading,
    // APBDes AWAL
    pendapatanList,
    belanjaList,
    pembiayaanList,
    apbdes,
    // APBDes PAK
    pakPendapatanList,
    pakBelanjaList,
    pakPembiayaanList,
    hasPAK,
    apbdesMeta,
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
    penerimaanList,
    dicairkanSPP,
    realisasiPerRekening,
    realisasiPerKegiatan,
    // LRA
    realisasiPendapatan,
    realisasiPembiayaan,
    saldoKasAkhir,
    saldoKasTunaiAkhir,
    saldoBankAkhir,
    saldoKasTunaiAwal,
    saldoBankAwal,
    hutangPajakTotal,
    ekuitasAwal,
    totalPenerimaanBKU,
    totalPengeluaranBKU,
  };
}
