// src/hooks/useBukuPembantu.ts
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ref, onValue, update } from "firebase/database";
import { db as database } from "@/lib/firebase";
import { useAppStore } from "@/store/appStore";
import { useBKU } from "@/hooks/useBKU";
import type { BKUItem, SPPItem, SPJItem } from "@/lib/types";

// ─── Filter helpers ───────────────────────────────────────────
function matchBulan(tanggal: string, bulan?: number) {
  if (bulan === undefined) return true;
  return new Date(tanggal).getMonth() + 1 === bulan;
}

// ─── Buku Bank ────────────────────────────────────────────────
// Masuk bank  : penerimaan_bank
// Keluar bank : mutasi_kas (tarik ke tunai), spp mediaPembayaran=bank, penyetoran_pajak via bank
export interface BukuBankRow {
  id: string;
  tanggal: string;
  nomorRef: string;
  uraian: string;
  penerimaan: number;
  pengeluaran: number;
  saldoBerjalan: number;
}

// ─── Buku Kas Tunai ───────────────────────────────────────────
// Masuk tunai  : penerimaan_tunai, mutasi_kas (masuk tunai), spj_sisa_panjar
// Keluar tunai : spp mediaPembayaran=tunai, penyetoran_pajak via tunai
export interface BukuKasTunaiRow {
  id: string;
  tanggal: string;
  nomorRef: string;
  uraian: string;
  penerimaan: number;
  pengeluaran: number;
  saldoBerjalan: number;
}

// ─── Helper: tentukan apakah BKU item relevan untuk mode bank/tunai ─
type BukuMode = "bank" | "tunai";

function isRelevant(item: BKUItem, mode: BukuMode): boolean {
  if (mode === "bank") {
    if (item.jenisRef === "mutasi_kas" && item.penerimaan > 0) return false;
    if (item.jenisRef === "spp" && (item as any).mediaPembayaran === "tunai") return false;
    if (item.jenisRef === "penyetoran_pajak" && (item as any).jenisPembayaran === "tunai") return false;
    if (item.jenisRef === "spj_titipan_pajak" && (item as any).mediaPembayaran !== "bank") return false;
    return (
      item.jenisRef === "penerimaan_bank" ||
      item.jenisRef === "mutasi_kas" ||
      item.jenisRef === "spp" ||
      item.jenisRef === "spj_titipan_pajak" ||
      item.jenisRef === "penyetoran_pajak"
    );
  } else {
    if (item.jenisRef === "mutasi_kas" && item.pengeluaran > 0) return false;
    if (item.jenisRef === "spp" && (item as any).mediaPembayaran !== "tunai") return false;
    if (item.jenisRef === "penyetoran_pajak" && (item as any).jenisPembayaran !== "tunai") return false;
    if (item.jenisRef === "spj_titipan_pajak" && (item as any).mediaPembayaran !== "tunai") return false;
    return (
      item.jenisRef === "penerimaan_tunai" ||
      item.jenisRef === "mutasi_kas" ||
      item.jenisRef === "spj_sisa_panjar" ||
      item.jenisRef === "spj_titipan_pajak" ||
      item.jenisRef === "spp" ||
      item.jenisRef === "penyetoran_pajak"
    );
  }
}

function buildFilteredRows(bkuAll: BKUItem[], bulan: number | undefined, mode: BukuMode) {
  const relevant = bkuAll.filter((item) => isRelevant(item, mode));
  let saldo = 0;
  const withSaldo = relevant.map((item) => {
    saldo += item.penerimaan - item.pengeluaran;
    return { ...item, saldoBerjalan: saldo };
  });
  if (bulan === undefined) return withSaldo;
  return withSaldo.filter((item) => matchBulan(item.tanggal, bulan));
}

export function useBukuBank(bulan?: number) {
  const { data: bkuAll = [], isLoading } = useBKU();
  return { data: buildFilteredRows(bkuAll, bulan, "bank") as BukuBankRow[], isLoading };
}

export function useBukuKasTunai(bulan?: number) {
  const { data: bkuAll = [], isLoading } = useBKU();
  return { data: buildFilteredRows(bkuAll, bulan, "tunai") as BukuKasTunaiRow[], isLoading };
}

// ─── Buku Pajak ───────────────────────────────────────────────
export interface BukuPajakItem {
  id: string;
  tanggal: string;
  nomorSPJ: string;
  nomorSPP: string;
  uraian: string;       // mapped from kegiatanNama
  kegiatanNama: string;
  kodePajak: string;
  namaPajak: string;
  tarif: number;
  dasarPengenaan: number;
  jumlah: number;
  sudahDisetor: boolean;
  nomorSetor?: string;
}

export function useBukuPajak(bulan?: number) {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const [data, setData] = useState<BukuPajakItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const r = ref(database, `siskeudesOnline/bukuPembantuPajak/${tahun}`);
    const unsub = onValue(r, (snap) => {
      const raw = snap.val() ?? {};
      const list: BukuPajakItem[] = Object.entries(raw).map(([id, v]) => {
        const val = v as Record<string, unknown>;
        const kegiatanNama = (val.kegiatanNama as string) ?? (val.uraian as string) ?? "";
        return {
          id,
          tanggal: (val.tanggal as string) ?? "",
          nomorSPJ: (val.nomorSPJ as string) ?? "",
          nomorSPP: (val.nomorSPP as string) ?? "",
          uraian: kegiatanNama,
          kegiatanNama,
          kodePajak: (val.kodePajak as string) ?? "",
          namaPajak: (val.namaPajak as string) ?? "",
          tarif: (val.tarif as number) ?? 0,
          dasarPengenaan: (val.dasarPengenaan as number) ?? 0,
          jumlah: (val.jumlah as number) ?? (val.jumlahPajak as number) ?? 0,
          sudahDisetor: (val.sudahDisetor as boolean) ?? false,
          nomorSetor: (val.nomorSetor as string) ?? undefined,
        };
      });
      setData(list.sort((a, b) => a.tanggal.localeCompare(b.tanggal)));
      setIsLoading(false);
    });
    return () => unsub();
  }, [tahun]);

  const filtered = bulan !== undefined
    ? data.filter((r) => new Date(r.tanggal).getMonth() + 1 === bulan)
    : data;
  return { data: filtered, isLoading };
}

export function useToggleDisetor() {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, sudahDisetor }: { id: string; sudahDisetor: boolean }) => {
      await update(ref(database, `siskeudesOnline/bukuPembantuPajak/${tahun}/${id}`), { sudahDisetor });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["buku-pajak", tahun], exact: false, refetchType: "all" }),
  });
}

// ─── Buku Pajak Rekap ─────────────────────────────────────────
export interface BukuPajakRekapRow {
  kodePajak: string;
  namaPajak: string;
  totalDipungut: number;
  totalDisetor: number;
  sisaBelumDisetor: number;
}

export function useBukuPajakRekap(bulan?: number) {
  const { data: items = [], ...rest } = useBukuPajak(bulan);
  const rekap: Record<string, BukuPajakRekapRow> = {};
  for (const item of items) {
    if (!rekap[item.kodePajak]) {
      rekap[item.kodePajak] = {
        kodePajak: item.kodePajak,
        namaPajak: item.namaPajak,
        totalDipungut: 0,
        totalDisetor: 0,
        sisaBelumDisetor: 0,
      };
    }
    rekap[item.kodePajak].totalDipungut += item.jumlah;
    if (item.sudahDisetor) rekap[item.kodePajak].totalDisetor += item.jumlah;
    else rekap[item.kodePajak].sisaBelumDisetor += item.jumlah;
  }
  return { data: Object.values(rekap), ...rest };
}

// ─── Buku Panjar ──────────────────────────────────────────────
export interface BukuPanjarRow {
  id: string;
  tanggal: string;
  nomorSPP: string;
  uraian: string;
  nilaiPanjar: number;
  sisaPanjar: number;
  statusLunas: boolean;
}

export function useBukuPanjar(bulan?: number) {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  return useQuery({
    queryKey: ["buku-panjar", tahun, bulan],
    queryFn: () =>
      new Promise<BukuPanjarRow[]>((resolve, reject) => {
        const sppRef = ref(database, `siskeudesOnline/spp/${tahun}`);
        const spjRef = ref(database, `siskeudesOnline/spj/${tahun}`);
        let sppData: Record<string, SPPItem> = {};
        let spjData: Record<string, SPJItem> = {};
        let loaded = 0;
        const tryResolve = () => {
          if (loaded < 2) return;
          const panjarList = Object.entries(sppData)
            .filter(([, s]) => s.jenis === "Panjar" && s.status === "dicairkan")
            .map(([firebaseKey, s]) => ({ firebaseKey, ...s }));
          const rows: BukuPanjarRow[] = panjarList.map((spp) => {
            const spjTerkait = Object.values(spjData).filter(
              (spj) => spj.nomorSPP === spp.nomorSPP
            );
            const totalSisaPanjar = spjTerkait.reduce(
              (sum, spj) => sum + (spj.sisaPanjar ?? 0),
              0
            );
            const lunas = spjTerkait.some((spj) => spj.sisaPanjar === 0);
            return {
              id: spp.firebaseKey,
              tanggal: spp.tanggal,
              nomorSPP: spp.nomorSPP,
              uraian: spp.uraian,
              nilaiPanjar: spp.totalJumlah,
              sisaPanjar: totalSisaPanjar,
              statusLunas: lunas,
            };
          });
          const sorted = rows.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
          resolve(bulan !== undefined ? sorted.filter((r) => new Date(r.tanggal).getMonth() + 1 === bulan) : sorted);
        };
        onValue(sppRef, (snap) => { sppData = snap.val() ?? {}; loaded++; tryResolve(); }, reject, { onlyOnce: true });
        onValue(spjRef, (snap) => { spjData = snap.val() ?? {}; loaded++; tryResolve(); }, reject, { onlyOnce: true });
      }),
    staleTime: 0,
  });
}
