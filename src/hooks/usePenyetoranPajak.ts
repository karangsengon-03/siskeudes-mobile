// src/hooks/usePenyetoranPajak.ts
"use client";

import { db as database } from "@/lib/firebase";
import { PenyetoranPajakItem } from "@/lib/types";
import { ref, onValue, push, remove, get, update } from "firebase/database";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/appStore";
import { useAuthStore } from "@/store/authStore";

async function generateNomorSetor(tahun: string): Promise<string> {
  const r = ref(database, `siskeudesOnline/penyetoranPajak/${tahun}`);
  const snap = await get(r);
  const count = snap.exists() ? Object.keys(snap.val()).length : 0;
  return `PJKK/${String(count + 1).padStart(3, "0")}/${tahun}`;
}

export function useJumlahPenyetoranPajak() {
  const { data: list = [] } = usePenyetoranPajak();
  return list.length;
}
export function usePenyetoranPajak() {
  const tahun = useAppStore((s) => s.tahunAnggaran);

  return useQuery<PenyetoranPajakItem[]>({
    queryKey: ["penyetoranPajak", tahun],
    queryFn: () =>
      new Promise((resolve) => {
        const r = ref(database, `siskeudesOnline/penyetoranPajak/${tahun}`);
        onValue(r, (snap) => {
          if (!snap.exists()) return resolve([]);
          const raw = snap.val() as Record<string, Omit<PenyetoranPajakItem, "id">>;
          const list = Object.entries(raw).map(([id, v]) => ({ id, ...v }));
          list.sort((a, b) => a.createdAt - b.createdAt);
          resolve(list);
        }, { onlyOnce: true });
      }),
    staleTime: 0,
  });
}

type AddPenyetoranPayload = Omit<PenyetoranPajakItem, "id" | "nomorSetor" | "inputOleh" | "createdAt">;

export function useAddPenyetoranPajak() {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const uid = useAuthStore((s) => s.user?.uid ?? "");
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AddPenyetoranPayload) => {
      const nomorSetor = await generateNomorSetor(tahun);

      // Simpan ke penyetoranPajak
      const setorRef = ref(database, `siskeudesOnline/penyetoranPajak/${tahun}`);
      const newRef = await push(setorRef, {
        ...payload,
        nomorSetor,
        inputOleh: uid,
        createdAt: Date.now(),
      });

      // Tandai sudahDisetor = true — gunakan multi-path update atomik
      const multiPathUpdate: Record<string, unknown> = {};
      for (const bppId of payload.bukuPembantuPajakIds) {
        if (!bppId) continue;
        multiPathUpdate[`siskeudesOnline/bukuPembantuPajak/${tahun}/${bppId}/sudahDisetor`] = true;
        multiPathUpdate[`siskeudesOnline/bukuPembantuPajak/${tahun}/${bppId}/nomorSetor`] = nomorSetor;
      }
      if (Object.keys(multiPathUpdate).length > 0) {
        await update(ref(database, "/"), multiPathUpdate);
      }

      // BKU: pengeluaran penyetoran pajak — TERPISAH per jenis pajak
      // Group selectedItems by kodePajak
      const groupByKode: Record<string, { nama: string; total: number }> = {};
      for (const bppId of payload.bukuPembantuPajakIds) {
        // Ambil info dari multiPathUpdate yang sudah ada — gunakan payload.namaPajak untuk simplifikasi
        // Karena FormPenyetoranPajak sudah kirim per-kode, kita buat 1 entry per kode
      }
      // Gunakan perKodePajak jika ada, fallback ke satu entry
      const perKode = (payload as any).perKodePajak as Array<{ kodePajak: string; namaPajak: string; jumlah: number }> | undefined;
      if (perKode && perKode.length > 0) {
        for (let i = 0; i < perKode.length; i++) {
          const item = perKode[i];
          await push(ref(database, `siskeudesOnline/bku/${tahun}`), {
            tanggal: payload.tanggal,
            uraian: `Setor ${item.namaPajak} — ${nomorSetor}`,
            penerimaan: 0,
            pengeluaran: item.jumlah,
            jenisRef: "penyetoran_pajak",
            nomorRef: nomorSetor,
            penyetoranPajakId: newRef.key,
            jenisPembayaran: payload.jenisPembayaran,
            inputOleh: uid,
            createdAt: Date.now() + 1 + i,
          });
        }
      } else {
        await push(ref(database, `siskeudesOnline/bku/${tahun}`), {
          tanggal: payload.tanggal,
          uraian: `Setor Pajak ${payload.namaPajak} — ${nomorSetor}`,
          penerimaan: 0,
          pengeluaran: payload.jumlah,
          jenisRef: "penyetoran_pajak",
          nomorRef: nomorSetor,
          penyetoranPajakId: newRef.key,
          jenisPembayaran: payload.jenisPembayaran,
          inputOleh: uid,
          createdAt: Date.now() + 1,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["penyetoranPajak", tahun] });
      qc.invalidateQueries({ queryKey: ["bku", tahun], exact: false });
      qc.invalidateQueries({ queryKey: ["buku-pajak", tahun], exact: false, refetchType: "all" });
    },
  });
}

export function useDeletePenyetoranPajak() {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, bukuPembantuPajakIds }: { id: string; bukuPembantuPajakIds: string[] }) => {
      // Kembalikan sudahDisetor = false di bukuPembantuPajak
      for (const bppId of bukuPembantuPajakIds) {
        await update(ref(database, `siskeudesOnline/bukuPembantuPajak/${tahun}/${bppId}`), {
          sudahDisetor: false,
          nomorSetor: null,
        });
      }
      // Hapus BKU terkait
      const bkuRef = ref(database, `siskeudesOnline/bku/${tahun}`);
      const snap = await get(bkuRef);
      if (snap.exists()) {
        const raw = snap.val() as Record<string, { penyetoranPajakId?: string }>;
        for (const [bkuId, bkuItem] of Object.entries(raw)) {
          if (bkuItem.penyetoranPajakId === id) {
            await remove(ref(database, `siskeudesOnline/bku/${tahun}/${bkuId}`));
          }
        }
      }
      await remove(ref(database, `siskeudesOnline/penyetoranPajak/${tahun}/${id}`));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["penyetoranPajak", tahun] });
      qc.invalidateQueries({ queryKey: ["bku", tahun], exact: false });
      qc.invalidateQueries({ queryKey: ["buku-pajak", tahun], exact: false, refetchType: "all" });
    },
  });
}