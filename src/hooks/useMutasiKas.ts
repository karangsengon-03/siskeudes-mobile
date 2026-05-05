// src/hooks/useMutasiKas.ts
"use client";

import { db as database } from "@/lib/firebase";
import { MutasiKasItem } from "@/lib/types";
import { ref, onValue, push, remove, get } from "firebase/database";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/appStore";
import { useAuthStore } from "@/store/authStore";

async function generateNomorMutasi(tahun: string): Promise<string> {
  const r = ref(database, `siskeudesOnline/tahun/${tahun}/mutasiKas`);
  const snap = await get(r);
  const count = snap.exists() ? Object.keys(snap.val()).length : 0;
  return `MUT/${String(count + 1).padStart(3, "0")}/${tahun}`;
}

export function useMutasiKas() {
  const tahun = useAppStore((s) => s.tahunAnggaran);

  return useQuery<MutasiKasItem[]>({
    queryKey: ["mutasiKas", tahun],
    queryFn: () =>
      new Promise((resolve) => {
        const r = ref(database, `siskeudesOnline/tahun/${tahun}/mutasiKas`);
        onValue(r, (snap) => {
          if (!snap.exists()) return resolve([]);
          const raw = snap.val() as Record<string, Omit<MutasiKasItem, "id">>;
          const list = Object.entries(raw).map(([id, v]) => ({ id, ...v }));
          list.sort((a, b) => a.createdAt - b.createdAt);
          resolve(list);
        }, { onlyOnce: true });
      }),
    staleTime: 0,
  });
}

type AddMutasiPayload = Omit<MutasiKasItem, "id" | "nomorMutasi" | "inputOleh" | "createdAt">;

export function useAddMutasiKas() {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const uid = useAuthStore((s) => s.user?.uid ?? "");
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AddMutasiPayload) => {
      const nomorMutasi = await generateNomorMutasi(tahun);

      // Simpan ke mutasiKas
      const mutRef = ref(database, `siskeudesOnline/tahun/${tahun}/mutasiKas`);
      const newRef = await push(mutRef, {
        ...payload,
        nomorMutasi,
        inputOleh: uid,
        createdAt: Date.now(),
      });

      if (payload.jenis === "bank_ke_tunai") {
        // Keluar dari bank
        await push(ref(database, `siskeudesOnline/tahun/${tahun}/bku`), {
          tanggal: payload.tanggal,
          uraian: `Mutasi Kas Bank → Tunai — ${payload.uraian}`,
          penerimaan: 0,
          pengeluaran: payload.jumlah,
          jenisRef: "mutasi_kas",
          nomorRef: nomorMutasi,
          mutasiKasId: newRef.key,
          jenisPembayaran: "bank",
          inputOleh: uid,
          createdAt: Date.now() + 1,
        });
        // Masuk ke tunai
        await push(ref(database, `siskeudesOnline/tahun/${tahun}/bku`), {
          tanggal: payload.tanggal,
          uraian: `Terima Tunai dari Bank — ${payload.uraian}`,
          penerimaan: payload.jumlah,
          pengeluaran: 0,
          jenisRef: "mutasi_kas",
          nomorRef: nomorMutasi,
          mutasiKasId: newRef.key,
          jenisPembayaran: "tunai",
          inputOleh: uid,
          createdAt: Date.now() + 2,
        });
      } else {
        // tunai_ke_bank: keluar dari tunai
        await push(ref(database, `siskeudesOnline/tahun/${tahun}/bku`), {
          tanggal: payload.tanggal,
          uraian: `Setor Tunai ke Bank — ${payload.uraian}`,
          penerimaan: 0,
          pengeluaran: payload.jumlah,
          jenisRef: "mutasi_kas",
          nomorRef: nomorMutasi,
          mutasiKasId: newRef.key,
          jenisPembayaran: "tunai",
          inputOleh: uid,
          createdAt: Date.now() + 1,
        });
        // Masuk ke bank
        await push(ref(database, `siskeudesOnline/tahun/${tahun}/bku`), {
          tanggal: payload.tanggal,
          uraian: `Terima dari Kas Tunai — ${payload.uraian}`,
          penerimaan: payload.jumlah,
          pengeluaran: 0,
          jenisRef: "mutasi_kas",
          nomorRef: nomorMutasi,
          mutasiKasId: newRef.key,
          jenisPembayaran: "bank",
          inputOleh: uid,
          createdAt: Date.now() + 2,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mutasiKas", tahun] });
      qc.invalidateQueries({ queryKey: ["bku", tahun], exact: false });
    },
  });
}

export function useDeleteMutasiKas() {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const qc = useQueryClient();

  return useMutation({
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["mutasiKas", tahun] });
      const prev = qc.getQueryData<MutasiKasItem[]>(["mutasiKas", tahun]);
      if (prev) {
        qc.setQueryData<MutasiKasItem[]>(["mutasiKas", tahun], prev.filter((m) => m.id !== id));
      }
      return { prev };
    },
    mutationFn: async (id: string) => {
      // Hapus semua entri BKU terkait mutasi ini
      const bkuRef = ref(database, `siskeudesOnline/tahun/${tahun}/bku`);
      const snap = await get(bkuRef);
      if (snap.exists()) {
        const raw = snap.val() as Record<string, { mutasiKasId?: string }>;
        for (const [bkuId, bkuItem] of Object.entries(raw)) {
          if (bkuItem.mutasiKasId === id) {
            await remove(ref(database, `siskeudesOnline/tahun/${tahun}/bku/${bkuId}`));
          }
        }
      }
      await remove(ref(database, `siskeudesOnline/tahun/${tahun}/mutasiKas/${id}`));
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["mutasiKas", tahun], ctx.prev);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mutasiKas", tahun] });
      qc.invalidateQueries({ queryKey: ["bku", tahun], exact: false });
    },
  });
}