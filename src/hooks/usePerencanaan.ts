// src/hooks/usePerencanaan.ts
// Modul Perencanaan — CRUD + Lock Mechanism
// RTDB path: siskeudesOnline/tahun/{tahun}/perencanaan/{id}
//            siskeudesOnline/tahun/{tahun}/perencanaanMeta

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ref,
  get,
  set,
  push,
  update,
  remove,
} from "firebase/database";
import { db as database } from "@/lib/firebase";
import { useAppStore } from "@/store/appStore";
import type { ItemPerencanaan, PerencanaanMeta } from "@/lib/types";

// ── helpers ──────────────────────────────────────────────────
function basePath(tahun: string | number) {
  return `siskeudesOnline/tahun/${tahun}/perencanaan`;
}
function metaPath(tahun: string | number) {
  return `siskeudesOnline/tahun/${tahun}/perencanaanMeta`;
}

// ── usePerencanaan (read all) ─────────────────────────────────
export function usePerencanaan() {
  const tahun = useAppStore((s) => s.tahunAnggaran);

  return useQuery<ItemPerencanaan[]>({
    queryKey: ["perencanaan", tahun],
    queryFn: async () => {
      const snap = await get(ref(database, basePath(tahun)));
      if (!snap.exists()) return [];
      return Object.entries(snap.val()).map(([id, v]: [string, any]) => ({
        id,
        ...v,
      })) as ItemPerencanaan[];
    },
  });
}

// ── usePerencanaanMeta ────────────────────────────────────────
export function usePerencanaanMeta() {
  const tahun = useAppStore((s) => s.tahunAnggaran);

  return useQuery<PerencanaanMeta>({
    queryKey: ["perencanaanMeta", tahun],
    queryFn: async () => {
      const snap = await get(ref(database, metaPath(tahun)));
      if (!snap.exists()) return { statusGlobal: "draft", updatedAt: 0 };
      return snap.val() as PerencanaanMeta;
    },
  });
}

// ── useTambahPerencanaan ──────────────────────────────────────
export function useTambahPerencanaan() {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: Omit<ItemPerencanaan, "id" | "createdAt" | "updatedAt" | "status">
    ) => {
      const now = Date.now();
      const newRef = push(ref(database, basePath(tahun)));
      const item: Omit<ItemPerencanaan, "id"> = {
        ...payload,
        status: "draft",
        createdAt: now,
        updatedAt: now,
      };
      await set(newRef, item);
      return { id: newRef.key!, ...item };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["perencanaan", tahun] });
    },
  });
}

// ── useUpdatePerencanaan ──────────────────────────────────────
export function useUpdatePerencanaan() {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<ItemPerencanaan, "id" | "createdAt">>;
    }) => {
      const itemRef = ref(database, `${basePath(tahun)}/${id}`);
      await update(itemRef, { ...data, updatedAt: Date.now() });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["perencanaan", tahun] });
    },
  });
}

// ── useDeletePerencanaan (optimistic) ─────────────────────────
export function useDeletePerencanaan() {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const qc = useQueryClient();
  const queryKey = ["perencanaan", tahun];

  return useMutation({
    mutationFn: async (id: string) => {
      await remove(ref(database, `${basePath(tahun)}/${id}`));
    },
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData<ItemPerencanaan[]>(queryKey);
      qc.setQueryData<ItemPerencanaan[]>(queryKey, (old) =>
        (old ?? []).filter((x) => x.id !== id)
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey });
    },
  });
}

// ── useSetStatusGlobal (kunci / buka kunci) ───────────────────
export function useSetStatusPerencanaan() {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (statusGlobal: "draft" | "terkunci") => {
      await set(ref(database, metaPath(tahun)), {
        statusGlobal,
        updatedAt: Date.now(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["perencanaanMeta", tahun] });
    },
  });
}

// ── usePaguPerKegiatan (helper untuk APBDes validation) ───────
// Returns map: kodeKegiatan → nilaiPagu
export function usePaguPerKegiatan(): Record<string, number> {
  const { data: items = [] } = usePerencanaan();
  const { data: meta } = usePerencanaanMeta();

  // Hanya enforce limit jika status global = terkunci
  if (meta?.statusGlobal !== "terkunci") return {};

  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item.kegiatan] = (acc[item.kegiatan] ?? 0) + item.nilaiPagu;
    return acc;
  }, {});
}
