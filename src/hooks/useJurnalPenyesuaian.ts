// src/hooks/useJurnalPenyesuaian.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ref, get, push, remove } from "firebase/database";
import { db as database } from "@/lib/firebase";
import { useAppStore } from "@/store/appStore";
import { toast } from "sonner";

export type SumberDanaJurnal = "PAD" | "ADD" | "DDS" | "PBH" | "PBK" | "DLL";
export type OpsiJurnalBPJS = "per-bulan" | "per-tahun";

export interface JurnalSiLPA {
  id: string;
  jenis: "silpa";
  sumberDana: SumberDanaJurnal;
  nominal: number;
  keterangan: string;
  tanggal: string;
  createdAt: number;
}

export interface JurnalBPJS {
  id: string;
  jenis: "bpjs";
  opsi: OpsiJurnalBPJS;
  bulan?: number;            // 1–12, hanya jika opsi = "per-bulan"
  posAPBDes: string;         // kode kegiatan
  nominal: number;
  keterangan: string;
  tanggal: string;
  createdAt: number;
}

export type JurnalPenyesuaian = JurnalSiLPA | JurnalBPJS;

function basePath(tahun: string) {
  return `siskeudesOnline/tahun/${tahun}/pembukuan/jurnalPenyesuaian`;
}

export function useJurnalPenyesuaian() {
  const tahun = useAppStore((s) => s.tahunAnggaran);

  return useQuery<JurnalPenyesuaian[]>({
    queryKey: ["jurnalPenyesuaian", tahun],
    queryFn: async () => {
      const snap = await get(ref(database, basePath(tahun)));
      if (!snap.exists()) return [];
      const raw = snap.val() as Record<string, Omit<JurnalPenyesuaian, "id">>;
      const list = Object.entries(raw).map(([id, v]) => ({ id, ...v } as JurnalPenyesuaian));
      list.sort((a, b) => a.createdAt - b.createdAt);
      return list;
    },
  });
}

type AddSiLPAPayload = Omit<JurnalSiLPA, "id" | "jenis" | "createdAt">;
type AddBPJSPayload = Omit<JurnalBPJS, "id" | "jenis" | "createdAt">;

export function useAddJurnalSiLPA() {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AddSiLPAPayload) => {
      const newRef = push(ref(database, basePath(tahun)));
      const entry: Omit<JurnalSiLPA, "id"> = {
        jenis: "silpa",
        ...payload,
        createdAt: Date.now(),
      };
      const { set } = await import("firebase/database");
      await set(newRef, entry);
      return newRef.key!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jurnalPenyesuaian", tahun] });
      toast.success("Jurnal SiLPA berhasil ditambahkan");
    },
    onError: () => toast.error("Gagal menyimpan jurnal"),
  });
}

export function useAddJurnalBPJS() {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AddBPJSPayload) => {
      const newRef = push(ref(database, basePath(tahun)));
      const entry: Omit<JurnalBPJS, "id"> = {
        jenis: "bpjs",
        ...payload,
        createdAt: Date.now(),
      };
      const { set } = await import("firebase/database");
      await set(newRef, entry);
      return newRef.key!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jurnalPenyesuaian", tahun] });
      toast.success("Jurnal BPJS berhasil ditambahkan");
    },
    onError: () => toast.error("Gagal menyimpan jurnal"),
  });
}

export function useDeleteJurnal() {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const qc = useQueryClient();

  return useMutation({
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["jurnalPenyesuaian", tahun] });
      const prev = qc.getQueryData<JurnalPenyesuaian[]>(["jurnalPenyesuaian", tahun]);
      if (prev) {
        qc.setQueryData<JurnalPenyesuaian[]>(
          ["jurnalPenyesuaian", tahun],
          prev.filter((j) => j.id !== id)
        );
      }
      return { prev };
    },
    mutationFn: async (id: string) => {
      await remove(ref(database, `${basePath(tahun)}/${id}`));
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["jurnalPenyesuaian", tahun], ctx.prev);
      toast.error("Gagal menghapus jurnal");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jurnalPenyesuaian", tahun] });
      toast.success("Jurnal berhasil dihapus");
    },
  });
}

/** Total realisasi SiLPA per sumber dana — dipakai di laporan LRA */
export function useTotalSiLPAPerSumber(tahun: string): Record<SumberDanaJurnal, number> {
  const { data = [] } = useJurnalPenyesuaian();
  const result = { PAD: 0, ADD: 0, DDS: 0, PBH: 0, PBK: 0, DLL: 0 } as Record<SumberDanaJurnal, number>;
  data
    .filter((j): j is JurnalSiLPA => j.jenis === "silpa")
    .forEach((j) => { result[j.sumberDana] += j.nominal; });
  return result;
}

/** Total realisasi BPJS — dipakai di laporan LRA sebagai tambahan pendapatan */
export function useTotalBPJSRealisasi(): number {
  const { data = [] } = useJurnalPenyesuaian();
  return data
    .filter((j): j is JurnalBPJS => j.jenis === "bpjs")
    .reduce((sum, j) => sum + j.nominal, 0);
}
