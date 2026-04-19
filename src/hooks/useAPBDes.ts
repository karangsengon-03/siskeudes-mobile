import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ref,
  get,
  set,
  push,
  update,
  remove,
  serverTimestamp,
} from "firebase/database";
import { db as database } from "@/lib/firebase";
import { useAppStore } from "@/store/appStore";
import type {
  APBDesData,
  KegiatanAPBDes,
  PendapatanItem,
  PembiayaanItem,
  RekeningKegiatan,
  SubItemRAB,
} from "@/lib/types";

// ── helpers ──────────────────────────────────────────────────
function basePath(tahun: string | number) {
  return `siskeudesOnline/apbdes/${tahun}`;
}

function recalcKegiatan(k: KegiatanAPBDes): KegiatanAPBDes {
  const rekeningList = (k.rekeningList ?? []).map((r) => ({
    ...r,
    subItems: (r.subItems ?? []).map((s) => ({
      ...s,
      jumlah: s.volume * s.hargaSatuan,
    })),
    totalPagu: (r.subItems ?? []).reduce(
      (acc, s) => acc + s.volume * s.hargaSatuan,
      0
    ),
  }));
  return {
    ...k,
    rekeningList,
    totalPagu: rekeningList.reduce((acc, r) => acc + r.totalPagu, 0),
  };
}

// ── useAPBDes (read full) ─────────────────────────────────────
export function useAPBDes() {
  const tahunStr = useAppStore((s) => s.tahunAnggaran);
  const tahun = Number(tahunStr);

  return useQuery<APBDesData>({
    queryKey: ["apbdes", tahun],
    queryFn: async (): Promise<APBDesData> => {
      const snap = await get(ref(database, basePath(tahun)));
      if (!snap.exists()) {
        return {
          tahun: Number(tahun),
          pendapatan: [],
          belanja: {},
          pembiayaan: [],
          totalPendapatan: 0,
          totalBelanja: 0,
          totalPembiayaan: 0,
          surplusDefisit: 0,
          status: "draft",
          updatedAt: Date.now(),
        };
      }
      const raw = snap.val();
      const pendapatan: PendapatanItem[] = raw.pendapatan
        ? Object.entries(raw.pendapatan).map(([id, v]: [string, any]) => ({ id, ...v }))
        : [];
      const belanja: { [id: string]: KegiatanAPBDes } = raw.belanja
        ? Object.fromEntries(
            Object.entries(raw.belanja).map(([id, v]: [string, any]) => [
              id,
              {
                id,
                ...v,
                rekeningList: v.rekeningList
                  ? Object.entries(v.rekeningList).map(([rid, rv]: [string, any]) => ({
                      id: rid,
                      ...rv,
                      subItems: rv.subItems
                        ? Object.entries(rv.subItems).map(([sid, sv]: [string, any]) => ({ id: sid, ...sv }))
                        : [],
                    }))
                  : [],
              },
            ])
          )
        : {};
      const pembiayaan: PembiayaanItem[] = raw.pembiayaan
        ? Object.entries(raw.pembiayaan).map(([id, v]: [string, any]) => ({ id, ...v }))
        : [];
      const totalPendapatan = pendapatan.reduce((acc, p) => acc + (p.anggaran ?? 0), 0);
      const totalBelanja = Object.values(belanja).reduce((acc, k) => acc + (k.totalPagu ?? 0), 0);
      const totalPembiayaan =
        pembiayaan.filter((p) => p.jenis === "penerimaan").reduce((acc, p) => acc + (p.anggaran ?? 0), 0) -
        pembiayaan.filter((p) => p.jenis === "pengeluaran").reduce((acc, p) => acc + (p.anggaran ?? 0), 0);
      return {
        tahun: Number(tahun),
        pendapatan,
        belanja,
        pembiayaan,
        totalPendapatan,
        totalBelanja,
        totalPembiayaan,
        surplusDefisit: totalPendapatan - totalBelanja,
        status: raw.status ?? "draft",
        updatedAt: raw.updatedAt ?? Date.now(),
      };
    },
  });
}

// ── useSaveKegiatan ───────────────────────────────────────────
export function useSaveKegiatan() {
  const qc = useQueryClient();
  const tahun = useAppStore((s) => s.tahunAnggaran);

  return useMutation({
    mutationFn: async (
      kegiatan: Omit<KegiatanAPBDes, "id" | "createdAt" | "updatedAt"> & {
        id?: string;
      }
    ) => {
      const recalced = recalcKegiatan(kegiatan as KegiatanAPBDes);
      const now = Date.now();

      // Convert arrays → objects for RTDB
      const rekeningObj: Record<string, any> = {};
      recalced.rekeningList.forEach((r) => {
        const subObj: Record<string, any> = {};
        r.subItems.forEach((s) => {
          subObj[s.id] = { ...s };
        });
        rekeningObj[r.id] = { ...r, subItems: subObj };
      });

      const payload = {
        ...recalced,
        rekeningList: rekeningObj,
        updatedAt: now,
        createdAt: kegiatan.id ? undefined : now,
      };
      if (!kegiatan.id) delete payload.createdAt; // will be set by push

      if (kegiatan.id) {
        const updatePayload = { ...payload };
        delete updatePayload.createdAt;
        await update(
          ref(database, `${basePath(tahun)}/belanja/${kegiatan.id}`),
          updatePayload
        );
        return kegiatan.id;
      } else {
        const newRef = push(ref(database, `${basePath(tahun)}/belanja`));
        const newPayload = { ...payload, createdAt: now, id: newRef.key };
        await set(newRef, newPayload);
        return newRef.key!;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apbdes", tahun] }),
  });
}

// ── useDeleteKegiatan ─────────────────────────────────────────
export function useDeleteKegiatan() {
  const qc = useQueryClient();
  const tahun = useAppStore((s) => s.tahunAnggaran);

  return useMutation({
    mutationFn: async (id: string) => {
      await remove(ref(database, `${basePath(tahun)}/belanja/${id}`));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apbdes", tahun] }),
  });
}

// ── useSavePendapatan ─────────────────────────────────────────
export function useSavePendapatan() {
  const qc = useQueryClient();
  const tahun = useAppStore((s) => s.tahunAnggaran);

  return useMutation({
    mutationFn: async (
      item: Omit<PendapatanItem, "id"> & { id?: string }
    ) => {
      const now = Date.now();
      if (item.id) {
        await update(
          ref(database, `${basePath(tahun)}/pendapatan/${item.id}`),
          { ...item, updatedAt: now }
        );
      } else {
        const newRef = push(ref(database, `${basePath(tahun)}/pendapatan`));
        await set(newRef, { ...item, id: newRef.key, createdAt: now });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apbdes", tahun] }),
  });
}

// ── useDeletePendapatan ───────────────────────────────────────
export function useDeletePendapatan() {
  const qc = useQueryClient();
  const tahun = useAppStore((s) => s.tahunAnggaran);

  return useMutation({
    mutationFn: async (id: string) => {
      await remove(ref(database, `${basePath(tahun)}/pendapatan/${id}`));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apbdes", tahun] }),
  });
}

// ── useSavePembiayaan ─────────────────────────────────────────
export function useSavePembiayaan() {
  const qc = useQueryClient();
  const tahun = useAppStore((s) => s.tahunAnggaran);

  return useMutation({
    mutationFn: async (
      item: Omit<PembiayaanItem, "id"> & { id?: string }
    ) => {
      const now = Date.now();
      if (item.id) {
        await update(
          ref(database, `${basePath(tahun)}/pembiayaan/${item.id}`),
          { ...item, updatedAt: now }
        );
      } else {
        const newRef = push(ref(database, `${basePath(tahun)}/pembiayaan`));
        await set(newRef, { ...item, id: newRef.key, createdAt: now });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apbdes", tahun] }),
  });
}

// ── useDeletePembiayaan ───────────────────────────────────────
export function useDeletePembiayaan() {
  const qc = useQueryClient();
  const tahun = useAppStore((s) => s.tahunAnggaran);

  return useMutation({
    mutationFn: async (id: string) => {
      await remove(ref(database, `${basePath(tahun)}/pembiayaan/${id}`));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apbdes", tahun] }),
  });
}