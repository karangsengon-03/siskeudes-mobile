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
  // BKU tanpa filter bulan — dibutuhkan untuk saldo akhir kumulatif yang akurat
  // (laporan per-bulan tetap perlu saldo kas/bank SEJAK AWAL TAHUN s.d. akhir
  // periode terpilih, bukan hanya transaksi dalam bulan itu saja)
  const { data: bkuKumulatif = [], isLoading: loadingBKUKumulatif } = useBKU(undefined);
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
    loadingDPA || loadingBKU || loadingBKUKumulatif || loadingBank || loadingTunai ||
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
  // PENTING: saldoKasAkhir, saldoKasTunaiAkhir, dan saldoBankAkhir HARUS
  // kumulatif sejak 1 Januari s.d. akhir periode terpilih — bukan running
  // balance dari bkuAll yang sudah difilter per-bulan (yang hanya menghitung
  // transaksi dalam bulan itu saja, mengabaikan saldo bulan-bulan sebelumnya).
  // Gunakan bkuKumulatif (BKU tanpa filter bulan) yang dipotong di akhir periode.
  const batasAkhirBulan = bulan
    ? new Date(Number(tahun), bulan, 0).getTime() // hari terakhir bulan terpilih
    : Infinity;
  const bkuSampaiAkhirPeriode = bkuKumulatif.filter(
    (b: BKUItem) => new Date(b.tanggal).getTime() <= batasAkhirBulan
  );
  const saldoKasAkhir = bkuSampaiAkhirPeriode.reduce(
    (s: number, b: BKUItem) => s + b.penerimaan - b.pengeluaran,
    0
  );

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

  // Saldo kas tunai & bank akhir — dihitung AKURAT per-transaksi dengan logika
  // field-based yang identik dengan useSaldoBank/useSaldoTunai (useBKU.ts)
  // dan isRelevant (useBukuPembantu.ts). WAJIB tetap sinkron jika salah satu diubah.

  function hitungSaldoMedia(items: BKUItem[], target: "bank" | "tunai"): number {
    let saldo = 0;
    for (const b of items) {
      switch (b.jenisRef) {
        case "saldo_awal":
          if ((b.mediaPembayaran ?? "bank") === target) saldo += b.penerimaan;
          break;
        case "penerimaan_bank":
          if (target === "bank") saldo += b.penerimaan;
          break;
        case "penerimaan_tunai":
          if (target === "tunai") saldo += b.penerimaan;
          break;
        case "mutasi_kas":
          if ((b.jenisPembayaran ?? "bank") === target) { saldo += b.penerimaan; saldo -= b.pengeluaran; }
          break;
        case "spp":
          if ((b.mediaPembayaran ?? "bank") === target) saldo -= b.pengeluaran;
          break;
        case "spj_sisa_panjar":
          if ((b.mediaPembayaran ?? "tunai") === target) saldo += b.penerimaan;
          break;
        case "spj_titipan_pajak":
          if ((b.mediaPembayaran ?? "bank") === target) saldo += b.penerimaan;
          break;
        case "penyetoran_pajak":
        case "penyetoran_hutang_pajak":
          if ((b.jenisPembayaran ?? "bank") === target) saldo -= b.pengeluaran;
          break;
        default:
          break;
      }
    }
    return saldo;
  }

  const saldoKasTunaiAkhir = hitungSaldoMedia(bkuSampaiAkhirPeriode, "tunai");
  const saldoBankAkhir = hitungSaldoMedia(bkuSampaiAkhirPeriode, "bank");

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
