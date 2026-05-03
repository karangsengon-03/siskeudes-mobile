// src/hooks/usePenerimaan.ts
"use client";

import { db as database } from "@/lib/firebase";
import { PenerimaanItem, JenisPenerimaan, SumberDana } from "@/lib/types";
import { ref, onValue, push, remove, get } from "firebase/database";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/appStore";
import { useAuthStore } from "@/store/authStore";

async function generateNomorPenerimaan(
  tahun: string,
  jenis: JenisPenerimaan
): Promise<string> {
  const r = ref(database, `siskeudesOnline/tahun/${tahun}/penerimaan`);
  const snap = await get(r);
  const semua = snap.exists()
    ? Object.values(snap.val() as Record<string, PenerimaanItem>).filter(
        (p) => p.jenisPenerimaan === jenis
      )
    : [];
  const urutan = String(semua.length + 1).padStart(3, "0");
  const prefix = jenis === "tunai" ? "TND" : "BNK";
  return `${prefix}/${urutan}/${tahun}`;
}

export function usePenerimaan() {
  const tahun = useAppStore((s) => s.tahunAnggaran);

  return useQuery<PenerimaanItem[]>({
    queryKey: ["penerimaan", tahun],
    queryFn: () =>
      new Promise((resolve) => {
        const r = ref(database, `siskeudesOnline/tahun/${tahun}/penerimaan`);
        onValue(
          r,
          (snap) => {
            if (!snap.exists()) return resolve([]);
            const raw = snap.val() as Record<string, Omit<PenerimaanItem, "id">>;
            const list = Object.entries(raw).map(([id, v]) => ({ id, ...v }));
            list.sort((a, b) => b.createdAt - a.createdAt);
            resolve(list);
          },
          { onlyOnce: true }
        );
      }),
    staleTime: 0,
  });
}

type AddPenerimaanPayload = Omit<PenerimaanItem, "id" | "nomorBukti" | "inputOleh" | "createdAt">;

export function useAddPenerimaan() {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const uid = useAuthStore((s) => s.user?.uid ?? "");
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AddPenerimaanPayload) => {
      const nomorBukti = await generateNomorPenerimaan(
        tahun,
        payload.jenisPenerimaan
      );
      // Simpan ke penerimaan
      const penRef = ref(database, `siskeudesOnline/tahun/${tahun}/penerimaan`);
      const newRef = await push(penRef, {
        ...payload,
        nomorBukti,
        inputOleh: uid,
        createdAt: Date.now(),
      });

      // Otomatis masuk BKU sebagai penerimaan
      await push(ref(database, `siskeudesOnline/tahun/${tahun}/bku`), {
        tanggal: payload.tanggal,
        uraian: payload.uraian,
        penerimaan: payload.jumlah,
        pengeluaran: 0,
        jenisRef: payload.jenisPenerimaan === "tunai"
          ? "penerimaan_tunai"
          : "penerimaan_bank",
        nomorRef: nomorBukti,
        penerimaanId: newRef.key,
        inputOleh: uid,
        createdAt: Date.now(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["penerimaan", tahun] });
      qc.invalidateQueries({ queryKey: ["bku", tahun], exact: false });
    },
  });
}

export function useDeletePenerimaan() {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const qc = useQueryClient();

  return useMutation({
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["penerimaan", tahun] });
      const prev = qc.getQueryData<PenerimaanItem[]>(["penerimaan", tahun]);
      if (prev) {
        qc.setQueryData<PenerimaanItem[]>(["penerimaan", tahun], prev.filter((p) => p.id !== id));
      }
      return { prev };
    },
    mutationFn: async (id: string) => {
      // Hapus entri BKU yang mereferensikan penerimaan ini
      const bkuRef = ref(database, `siskeudesOnline/tahun/${tahun}/bku`);
      const snap = await get(bkuRef);
      if (snap.exists()) {
        const raw = snap.val() as Record<string, { penerimaanId?: string }>;
        for (const [bkuId, bkuItem] of Object.entries(raw)) {
          if (bkuItem.penerimaanId === id) {
            await remove(ref(database, `siskeudesOnline/tahun/${tahun}/bku/${bkuId}`));
          }
        }
      }
      await remove(ref(database, `siskeudesOnline/tahun/${tahun}/penerimaan/${id}`));
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["penerimaan", tahun], ctx.prev);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["penerimaan", tahun] });
      qc.invalidateQueries({ queryKey: ["bku", tahun], exact: false });
    },
  });
}