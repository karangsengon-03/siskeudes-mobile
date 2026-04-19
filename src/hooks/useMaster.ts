"use client";

import { useEffect, useState, useCallback } from "react";
import { ref, get, set, update } from "firebase/database";
import { db as database } from "@/lib/firebase";
import { useAppStore } from "@/store/appStore";
import { KODE_REKENING } from "@/lib/constants/kodeRekening";
import { BIDANG_KEGIATAN } from "@/lib/constants/bidangKegiatan";
import { toast } from "sonner";

// ─── Tipe Data Desa ───────────────────────────────────────────────
export interface DataDesa {
  namaDesa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  namaKepala: string;
  namaSekdes: string;
  namaBendahara: string;
  kodePos?: string;
}

// ─── Hook Data Desa ───────────────────────────────────────────────
export function useDataDesa() {
  const [data, setData] = useState<DataDesa | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await get(ref(database, "siskeudesOnline/config/desa"));
      setData(snap.exists() ? (snap.val() as DataDesa) : null);
    } catch {
      toast.error("Gagal memuat data desa");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (values: DataDesa) => {
    setSaving(true);
    try {
      await set(ref(database, "siskeudesOnline/config/desa"), values);
      setData(values);
      toast.success("Data desa berhasil disimpan");
    } catch {
      toast.error("Gagal menyimpan data desa");
    } finally {
      setSaving(false);
    }
  }, []);

  return { data, loading, saving, save, reload: load };
}

// ─── Hook Kode Rekening ───────────────────────────────────────────
// Kode rekening default dari konstanta, user bisa tambah custom (kode 90+)
export interface KodeRekeningCustom {
  kode: string;
  uraian: string;
  level: 1 | 2 | 3 | 4;
  parentKode?: string;
  isCustom?: boolean;
}

export function useKodeRekening() {
  const [custom, setCustom] = useState<KodeRekeningCustom[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await get(ref(database, "siskeudesOnline/kodeRekening/custom"));
      if (snap.exists()) {
        const val = snap.val() as Record<string, KodeRekeningCustom>;
        setCustom(Object.values(val));
      }
    } catch {
      // Jika belum ada, abaikan
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Seed default ke RTDB — panggil sekali dari tombol "Reset ke Default"
  const seedDefault = useCallback(async () => {
    setSaving(true);
    try {
      // Simpan flat list level 4 saja (rincian obyek) ke RTDB sebagai referensi
      const rincian = KODE_REKENING.filter((k) => k.level === 4);
      const payload: Record<string, object> = {};
      rincian.forEach((k) => {
        const key = k.kode.replaceAll(".", "_");
        payload[key] = k;
      });
      await set(ref(database, "siskeudesOnline/kodeRekening/default"), payload);
      toast.success("Data kode rekening default berhasil di-seed ke Firebase");
    } catch {
      toast.error("Gagal seed kode rekening");
    } finally {
      setSaving(false);
    }
  }, []);

  const addCustom = useCallback(async (item: Omit<KodeRekeningCustom, "isCustom">) => {
    setSaving(true);
    try {
      const key = item.kode.replaceAll(".", "_");
      await set(
        ref(database, `siskeudesOnline/kodeRekening/custom/${key}`),
        { ...item, isCustom: true }
      );
      await load();
      toast.success("Kode rekening custom berhasil ditambahkan");
    } catch {
      toast.error("Gagal menambahkan kode rekening");
    } finally {
      setSaving(false);
    }
  }, [load]);

  // Gabung default + custom untuk tampilan
  const all = [...KODE_REKENING, ...custom.map((c) => ({ ...c, isCustom: true }))];

  return { all, custom, loading, saving, seedDefault, addCustom, reload: load };
}

// ─── Hook Bidang Kegiatan ─────────────────────────────────────────
export interface BidangKegiatanCustom {
  bidangKode: string;
  subBidangKode: string;
  kode: string;
  uraian: string;
  isCustom?: boolean;
}

export function useBidangKegiatan() {
  const [custom, setCustom] = useState<BidangKegiatanCustom[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await get(ref(database, "siskeudesOnline/bidangKegiatan/custom"));
      if (snap.exists()) {
        const val = snap.val() as Record<string, BidangKegiatanCustom>;
        setCustom(Object.values(val));
      }
    } catch {
      // Belum ada custom, abaikan
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const seedDefault = useCallback(async () => {
    setSaving(true);
    try {
      const payload: Record<string, object> = {};
      BIDANG_KEGIATAN.forEach((b) => {
        b.subBidang.forEach((sb) => {
          sb.kegiatan.forEach((k) => {
            const key = `${b.kode}_${sb.kode}_${k.kode}`.replaceAll(".", "_");
            payload[key] = {
              bidangKode: b.kode,
              bidangUraian: b.uraian,
              subBidangKode: sb.kode,
              subBidangUraian: sb.uraian,
              kode: k.kode,
              uraian: k.uraian,
            };
          });
        });
      });
      await set(ref(database, "siskeudesOnline/bidangKegiatan/default"), payload);
      toast.success("Data bidang/kegiatan default berhasil di-seed ke Firebase");
    } catch {
      toast.error("Gagal seed bidang/kegiatan");
    } finally {
      setSaving(false);
    }
  }, []);

  const addCustomKegiatan = useCallback(async (item: BidangKegiatanCustom) => {
    setSaving(true);
    try {
      const key = `${item.bidangKode}_${item.subBidangKode}_${item.kode}`.replaceAll(".", "_");
      await set(
        ref(database, `siskeudesOnline/bidangKegiatan/custom/${key}`),
        { ...item, isCustom: true }
      );
      await load();
      toast.success("Kegiatan custom berhasil ditambahkan");
    } catch {
      toast.error("Gagal menambahkan kegiatan");
    } finally {
      setSaving(false);
    }
  }, [load]);

  // Bangun struktur bidang dari konstanta BIDANG_KEGIATAN
  const bidang = BIDANG_KEGIATAN.map((b) => ({
    kode: String(b.kode),
    nama: b.uraian,
    subBidang: b.subBidang.map((sb) => ({
      kode: String(sb.kode),
      nama: sb.uraian,
    })),
  }));

  return { bidang, custom, loading, saving, seedDefault, addCustomKegiatan, reload: load };
}
