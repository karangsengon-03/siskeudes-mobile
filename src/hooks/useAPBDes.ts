// src/hooks/useAPBDes.ts
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
import type {
  APBDesData,
  APBDesMeta,
  APBDesVariant,
  KegiatanAPBDes,
  PendapatanItem,
  PembiayaanItem,
} from "@/lib/types";

// ── helpers ──────────────────────────────────────────────────

function variantPath(tahun: string | number, variant: APBDesVariant) {
  return `siskeudesOnline/tahun/${tahun}/apbdes/${variant}`;
}

function metaPath(tahun: string | number) {
  return `siskeudesOnline/tahun/${tahun}/apbdes/meta`;
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

function parseAPBDesSnapshot(raw: any, tahun: number): APBDesData {
  const pendapatan: PendapatanItem[] = raw?.pendapatan
    ? Object.entries(raw.pendapatan).map(([id, v]: [string, any]) => ({ id, ...v }))
    : [];
  const belanja: { [id: string]: KegiatanAPBDes } = raw?.belanja
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
  const pembiayaan: PembiayaanItem[] = raw?.pembiayaan
    ? Object.entries(raw.pembiayaan).map(([id, v]: [string, any]) => ({ id, ...v }))
    : [];
  const totalPendapatan = pendapatan.reduce((acc, p) => acc + (p.anggaran ?? 0), 0);
  const totalBelanja = Object.values(belanja).reduce((acc, k) => acc + (k.totalPagu ?? 0), 0);
  const totalPembiayaan =
    pembiayaan.filter((p) => p.jenis === "penerimaan").reduce((acc, p) => acc + (p.anggaran ?? 0), 0) -
    pembiayaan.filter((p) => p.jenis === "pengeluaran").reduce((acc, p) => acc + (p.anggaran ?? 0), 0);
  return {
    tahun,
    pendapatan,
    belanja,
    pembiayaan,
    totalPendapatan,
    totalBelanja,
    totalPembiayaan,
    surplusDefisit: totalPendapatan - totalBelanja,
    status: raw?.status ?? "draft",
    updatedAt: raw?.updatedAt ?? Date.now(),
  };
}

// ── useAPBDesMeta ─────────────────────────────────────────────

export function useAPBDesMeta() {
  const tahun = useAppStore((s) => s.tahunAnggaran);

  return useQuery<APBDesMeta>({
    queryKey: ["apbdes-meta", tahun],
    queryFn: async (): Promise<APBDesMeta> => {
      const snap = await get(ref(database, metaPath(tahun)));
      if (!snap.exists()) {
        return {
          statusAwal: "draft",
          statusPAK: "belum_ada",
          updatedAt: Date.now(),
        };
      }
      return snap.val() as APBDesMeta;
    },
  });
}

export function useSaveAPBDesMeta() {
  const qc = useQueryClient();
  const tahun = useAppStore((s) => s.tahunAnggaran);

  return useMutation({
    mutationFn: async (patch: Partial<APBDesMeta>) => {
      await update(ref(database, metaPath(tahun)), {
        ...patch,
        updatedAt: Date.now(),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apbdes-meta", tahun] }),
  });
}

// ── useAPBDes ─────────────────────────────────────────────────

export function useAPBDes(variant: APBDesVariant = "awal") {
  const tahunStr = useAppStore((s) => s.tahunAnggaran);
  const tahun = Number(tahunStr);

  return useQuery<APBDesData>({
    queryKey: ["apbdes", variant, tahun],
    queryFn: async (): Promise<APBDesData> => {
      const snap = await get(ref(database, variantPath(tahun, variant)));
      if (!snap.exists()) {
        return {
          tahun,
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
      return parseAPBDesSnapshot(snap.val(), tahun);
    },
  });
}

// ── useAPBDesAktif — untuk Penatausahaan ──────────────────────

export function useAPBDesAktif() {
  const tahunStr = useAppStore((s) => s.tahunAnggaran);
  const tahun = Number(tahunStr);
  const { data: meta } = useAPBDesMeta();
  const variant: APBDesVariant =
    meta?.statusPAK && meta.statusPAK !== "belum_ada" ? "pak" : "awal";

  const query = useQuery<APBDesData>({
    queryKey: ["apbdes-aktif", tahun, variant],
    queryFn: async (): Promise<APBDesData> => {
      const snap = await get(ref(database, variantPath(tahun, variant)));
      if (!snap.exists()) {
        return {
          tahun,
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
      return parseAPBDesSnapshot(snap.val(), tahun);
    },
  });

  return { ...query, variant };
}

// ── useBuatPAK ────────────────────────────────────────────────

export function useBuatPAK() {
  const qc = useQueryClient();
  const tahun = useAppStore((s) => s.tahunAnggaran);

  return useMutation({
    mutationFn: async () => {
      const snapAwal = await get(ref(database, variantPath(tahun, "awal")));
      if (!snapAwal.exists()) throw new Error("Data APBDes AWAL belum ada");

      await set(ref(database, variantPath(tahun, "pak")), {
        ...snapAwal.val(),
        updatedAt: Date.now(),
      });

      await update(ref(database, metaPath(tahun)), {
        statusPAK: "draft",
        updatedAt: Date.now(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["apbdes", "pak"] });
      qc.invalidateQueries({ queryKey: ["apbdes-meta", tahun] });
      qc.invalidateQueries({ queryKey: ["apbdes-aktif"] });
    },
  });
}

// ── useSaveKegiatan ───────────────────────────────────────────

export function useSaveKegiatan(variant: APBDesVariant = "awal") {
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

      const rekeningObj: Record<string, any> = {};
      recalced.rekeningList.forEach((r) => {
        const subObj: Record<string, any> = {};
        r.subItems.forEach((s) => {
          subObj[s.id] = { ...s };
        });
        rekeningObj[r.id] = { ...r, subItems: subObj };
      });

      const payload: any = {
        ...recalced,
        rekeningList: rekeningObj,
        updatedAt: now,
      };

      if (kegiatan.id) {
        delete payload.createdAt;
        await update(
          ref(database, `${variantPath(tahun, variant)}/belanja/${kegiatan.id}`),
          payload
        );
        return kegiatan.id;
      } else {
        const newRef = push(ref(database, `${variantPath(tahun, variant)}/belanja`));
        await set(newRef, { ...payload, createdAt: now, id: newRef.key });
        return newRef.key!;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["apbdes", variant, Number(tahun)] });
      qc.invalidateQueries({ queryKey: ["apbdes-aktif"] });
    },
  });
}

// ── useDeleteKegiatan ─────────────────────────────────────────

export function useDeleteKegiatan(variant: APBDesVariant = "awal") {
  const qc = useQueryClient();
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const tahunNum = Number(tahun);

  return useMutation({
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["apbdes", variant, tahunNum] });
      const prev = qc.getQueryData<APBDesData>(["apbdes", variant, tahunNum]);
      if (prev) {
        const belanja = { ...(prev.belanja as Record<string, KegiatanAPBDes>) };
        delete belanja[id];
        const totalBelanja = Object.values(belanja).reduce(
          (a: number, k: KegiatanAPBDes) => a + (k.totalPagu ?? 0),
          0
        );
        qc.setQueryData<APBDesData>(["apbdes", variant, tahunNum], {
          ...prev,
          belanja,
          totalBelanja,
        });
      }
      return { prev };
    },
    mutationFn: async (id: string) => {
      await remove(ref(database, `${variantPath(tahun, variant)}/belanja/${id}`));
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["apbdes", variant, tahunNum], ctx.prev);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["apbdes", variant, tahunNum] });
      qc.invalidateQueries({ queryKey: ["apbdes-aktif"] });
    },
  });
}

// ── useSavePendapatan ─────────────────────────────────────────

export function useSavePendapatan(variant: APBDesVariant = "awal") {
  const qc = useQueryClient();
  const tahun = useAppStore((s) => s.tahunAnggaran);

  return useMutation({
    mutationFn: async (
      item: Omit<PendapatanItem, "id"> & { id?: string }
    ) => {
      const now = Date.now();
      if (item.id) {
        await update(
          ref(database, `${variantPath(tahun, variant)}/pendapatan/${item.id}`),
          { ...item, updatedAt: now }
        );
      } else {
        const newRef = push(ref(database, `${variantPath(tahun, variant)}/pendapatan`));
        await set(newRef, { ...item, id: newRef.key, createdAt: now });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["apbdes", variant, Number(tahun)] });
      qc.invalidateQueries({ queryKey: ["apbdes-aktif"] });
    },
  });
}

// ── useDeletePendapatan ───────────────────────────────────────

export function useDeletePendapatan(variant: APBDesVariant = "awal") {
  const qc = useQueryClient();
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const tahunNum = Number(tahun);

  return useMutation({
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["apbdes", variant, tahunNum] });
      const prev = qc.getQueryData<APBDesData>(["apbdes", variant, tahunNum]);
      if (prev) {
        const pendapatan = prev.pendapatan.filter((p) => p.id !== id);
        const totalPendapatan = pendapatan.reduce((a, p) => a + (p.anggaran ?? 0), 0);
        qc.setQueryData<APBDesData>(["apbdes", variant, tahunNum], {
          ...prev,
          pendapatan,
          totalPendapatan,
        });
      }
      return { prev };
    },
    mutationFn: async (id: string) => {
      await remove(
        ref(database, `${variantPath(tahun, variant)}/pendapatan/${id}`)
      );
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["apbdes", variant, tahunNum], ctx.prev);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["apbdes", variant, tahunNum] });
      qc.invalidateQueries({ queryKey: ["apbdes-aktif"] });
    },
  });
}

// ── useSavePembiayaan ─────────────────────────────────────────

export function useSavePembiayaan(variant: APBDesVariant = "awal") {
  const qc = useQueryClient();
  const tahun = useAppStore((s) => s.tahunAnggaran);

  return useMutation({
    mutationFn: async (
      item: Omit<PembiayaanItem, "id"> & { id?: string }
    ) => {
      const now = Date.now();
      if (item.id) {
        await update(
          ref(database, `${variantPath(tahun, variant)}/pembiayaan/${item.id}`),
          { ...item, updatedAt: now }
        );
      } else {
        const newRef = push(
          ref(database, `${variantPath(tahun, variant)}/pembiayaan`)
        );
        await set(newRef, { ...item, id: newRef.key, createdAt: now });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["apbdes", variant, Number(tahun)] });
      qc.invalidateQueries({ queryKey: ["apbdes-aktif"] });
    },
  });
}

// ── useDeletePembiayaan ───────────────────────────────────────

export function useDeletePembiayaan(variant: APBDesVariant = "awal") {
  const qc = useQueryClient();
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const tahunNum = Number(tahun);

  return useMutation({
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["apbdes", variant, tahunNum] });
      const prev = qc.getQueryData<APBDesData>(["apbdes", variant, tahunNum]);
      if (prev) {
        const pembiayaan = prev.pembiayaan.filter((p) => p.id !== id);
        const totalPembiayaan =
          pembiayaan
            .filter((p) => p.jenis === "penerimaan")
            .reduce((a, p) => a + (p.anggaran ?? 0), 0) -
          pembiayaan
            .filter((p) => p.jenis === "pengeluaran")
            .reduce((a, p) => a + (p.anggaran ?? 0), 0);
        qc.setQueryData<APBDesData>(["apbdes", variant, tahunNum], {
          ...prev,
          pembiayaan,
          totalPembiayaan,
        });
      }
      return { prev };
    },
    mutationFn: async (id: string) => {
      await remove(
        ref(database, `${variantPath(tahun, variant)}/pembiayaan/${id}`)
      );
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["apbdes", variant, tahunNum], ctx.prev);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["apbdes", variant, tahunNum] });
      qc.invalidateQueries({ queryKey: ["apbdes-aktif"] });
    },
  });
}
