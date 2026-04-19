// src/hooks/useSPP.ts
"use client";

import { db as database } from "@/lib/firebase";
import { SPPItem, RincianSPP } from "@/lib/types";
import { ref, onValue, push, update, get, remove, query, orderByChild, equalTo } from "firebase/database";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/appStore";
import { useAuthStore } from "@/store/authStore";

function rtdbToList<T extends { id: string }>(raw: Record<string, Omit<T, "id">>): T[] {
  return Object.entries(raw).map(([id, v]) => ({ id, ...v } as T));
}

async function generateNomorSPP(tahun: string): Promise<string> {
  const r = ref(database, `siskeudesOnline/spp/${tahun}`);
  const snap = await get(r);
  const count = snap.exists() ? Object.keys(snap.val()).length : 0;
  const urutan = String(count + 1).padStart(3, "0");
  return `SPP/${urutan}/${tahun}`;
}

// Cari semua baris BKU yang terkait dengan sppId tertentu
async function findBKUBySppId(tahun: string, sppId: string): Promise<string[]> {
  const snap = await get(ref(database, `siskeudesOnline/bku/${tahun}`));
  if (!snap.exists()) return [];
  const raw = snap.val() as Record<string, any>;
  return Object.entries(raw)
    .filter(([, v]) => v.sppId === sppId)
    .map(([id]) => id);
}

export function useSPP() {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  return useQuery<SPPItem[]>({
    queryKey: ["spp", tahun],
    queryFn: () =>
      new Promise((resolve) => {
        const r = ref(database, `siskeudesOnline/spp/${tahun}`);
        onValue(r, (snap) => {
          if (!snap.exists()) return resolve([]);
          const raw = snap.val() as Record<string, Omit<SPPItem, "id">>;
          const list = rtdbToList<SPPItem>(raw);
          list.sort((a, b) => b.createdAt - a.createdAt);
          resolve(list);
        }, { onlyOnce: true });
      }),
    staleTime: 0,
  });
}

type AddSPPPayload = Omit<SPPItem, "id" | "nomorSPP" | "status" | "createdAt" | "inputOleh">;

export function useAddSPP() {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const uid = useAuthStore((s) => s.user?.uid ?? "");
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddSPPPayload) => {
      const nomorSPP = await generateNomorSPP(tahun);
      await push(ref(database, `siskeudesOnline/spp/${tahun}`), {
        ...payload,
        nomorSPP,
        status: "dikonfirmasi",
        inputOleh: uid,
        createdAt: Date.now(),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["spp", tahun] }),
  });
}

type EditSPPPayload = { id: string } & Omit<SPPItem, "id" | "nomorSPP" | "status" | "createdAt" | "inputOleh">;

export function useEditSPP() {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: EditSPPPayload) => {
      const { id, ...rest } = payload;
      await update(ref(database, `siskeudesOnline/spp/${tahun}/${id}`), {
        ...rest,
        updatedAt: Date.now(),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["spp", tahun] }),
  });
}

export function useCairkanSPP() {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const uid = useAuthStore((s) => s.user?.uid ?? "");
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (spp: SPPItem) => {
      const today = new Date().toISOString().split("T")[0];
      // Simpan mediaPembayaran ke BKU agar saldo bank/tunai bisa dipisah
      const mediaPembayaran = spp.mediaPembayaran ?? "bank";
      await update(ref(database, `siskeudesOnline/spp/${tahun}/${spp.id}`), {
        status: "dicairkan",
        dicairkanTanggal: today,
      });
      await push(ref(database, `siskeudesOnline/bku/${tahun}`), {
        tanggal: spp.tanggal,
        uraian: spp.uraian,
        penerimaan: 0,
        pengeluaran: spp.totalJumlah,
        jenisRef: "spp",
        nomorRef: spp.nomorSPP,
        sppId: spp.id,
        mediaPembayaran,
        inputOleh: uid,
        createdAt: Date.now(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["spp", tahun] });
      qc.invalidateQueries({ queryKey: ["bku", tahun], exact: false });
    },
  });
}

// Kembalikan SPP dari "dicairkan" → "dikonfirmasi" dengan menghapus baris BKU terkait.
// Digunakan sebelum Edit atau Hapus pada SPP yang sudah dicairkan.
export function useUncairkanSPP() {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sppId: string) => {
      // Hapus semua baris BKU yang sppId-nya cocok
      const bkuIds = await findBKUBySppId(tahun, sppId);
      await Promise.all(
        bkuIds.map((bkuId) =>
          remove(ref(database, `siskeudesOnline/bku/${tahun}/${bkuId}`))
        )
      );
      // Kembalikan status SPP ke dikonfirmasi
      await update(ref(database, `siskeudesOnline/spp/${tahun}/${sppId}`), {
        status: "dikonfirmasi",
        dicairkanTanggal: null,
        updatedAt: Date.now(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["spp", tahun] });
      qc.invalidateQueries({ queryKey: ["bku", tahun], exact: false });
    },
  });
}

export function useDeleteSPP() {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Hapus baris BKU terkait terlebih dahulu (jika SPP sudah dicairkan)
      const bkuIds = await findBKUBySppId(tahun, id);
      await Promise.all(
        bkuIds.map((bkuId) =>
          remove(ref(database, `siskeudesOnline/bku/${tahun}/${bkuId}`))
        )
      );
      // Hapus SPP
      await remove(ref(database, `siskeudesOnline/spp/${tahun}/${id}`));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["spp", tahun] });
      qc.invalidateQueries({ queryKey: ["bku", tahun], exact: false });
    },
  });
}

export function useRealisasiRekening(kegiatanId: string, kodeRekening: string): number {
  const { data: sppList = [] } = useSPP();
  return sppList
    .filter((s) => s.kegiatanId === kegiatanId && s.status !== "draft")
    .flatMap((s) => Object.values(s.rincianSPP))
    .filter((r) => r.kodeRekening === kodeRekening)
    .reduce((sum, r) => sum + r.jumlah, 0);
}
