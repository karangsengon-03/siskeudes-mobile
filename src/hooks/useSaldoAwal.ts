// src/hooks/useSaldoAwal.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ref, get, set } from "firebase/database";
import { db as database } from "@/lib/firebase";
import { useAppStore } from "@/store/appStore";
import { toast } from "sonner";

export interface HutangPajak {
  ppn: number;
  pph22: number;
  pph23: number;
  pajakDaerah: number;
}

export interface SaldoAwal {
  kasTunai: number;
  bank: number;
  hutangPajak: HutangPajak;
  ekuitas: number;
  updatedAt: number;
}

const EMPTY_SALDO: SaldoAwal = {
  kasTunai: 0,
  bank: 0,
  hutangPajak: { ppn: 0, pph22: 0, pph23: 0, pajakDaerah: 0 },
  ekuitas: 0,
  updatedAt: 0,
};

function basePath(tahun: string) {
  return `siskeudesOnline/tahun/${tahun}/pembukuan/saldoAwal`;
}

export function useSaldoAwal() {
  const tahun = useAppStore((s) => s.tahunAnggaran);

  return useQuery<SaldoAwal>({
    queryKey: ["saldoAwal", tahun],
    queryFn: async () => {
      const snap = await get(ref(database, basePath(tahun)));
      if (!snap.exists()) return EMPTY_SALDO;
      return snap.val() as SaldoAwal;
    },
  });
}

export function useSaveSaldoAwal() {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<SaldoAwal, "updatedAt">) => {
      const payload: SaldoAwal = { ...data, updatedAt: Date.now() };
      await set(ref(database, basePath(tahun)), payload);
      return payload;
    },
    onSuccess: (saved) => {
      qc.setQueryData<SaldoAwal>(["saldoAwal", tahun], saved);
      toast.success("Saldo Awal berhasil disimpan");
    },
    onError: () => {
      toast.error("Gagal menyimpan Saldo Awal");
    },
  });
}

/** Total hutang pajak tahun lalu (untuk tampilan ringkas) */
export function useTotalHutangPajak(): number {
  const { data } = useSaldoAwal();
  if (!data) return 0;
  const { ppn, pph22, pph23, pajakDaerah } = data.hutangPajak;
  return ppn + pph22 + pph23 + pajakDaerah;
}
