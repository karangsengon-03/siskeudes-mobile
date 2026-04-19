// src/hooks/useDPA.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ref, onValue, set, update, get, remove } from "firebase/database";
import { db as database } from "@/lib/firebase";
import { useAppStore } from "@/store/appStore";
import { DPAKegiatan } from "@/lib/types";

const BASE = "siskeudesOnline";

// ─── useDPA ───────────────────────────────────────────────────────────────────
export function useDPA() {
  const tahun = useAppStore((s) => s.tahunAnggaran);

  return useQuery<{ [kegiatanId: string]: DPAKegiatan }>({
    queryKey: ["dpa", tahun],
    queryFn: () =>
      new Promise((resolve) => {
        const r = ref(database, `${BASE}/dpa/${tahun}`);
        onValue(
          r,
          (snap) => {
            if (!snap.exists()) {
              resolve({});
              return;
            }
            const raw = snap.val() as Record<string, any>;
            const result: { [kegiatanId: string]: DPAKegiatan } = {};
            Object.entries(raw).forEach(([kegiatanId, val]) => {
              result[kegiatanId] = {
                kegiatanId,
                isDPAL: val.isDPAL ?? false,
                sumberDPAL: val.sumberDPAL ?? "",
                status: val.status ?? "draft",
                totalDPA: val.totalDPA ?? 0,
                updatedAt: val.updatedAt ?? 0,
                bulan: val.bulan ?? {},
              };
            });
            resolve(result);
          },
          { onlyOnce: true }
        );
      }),
    staleTime: 0,
  });
}

// ─── useSaveDPABulan ──────────────────────────────────────────────────────────
// Simpan jumlah untuk satu bulan tertentu pada sebuah kegiatan
export function useSaveDPABulan() {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      kegiatanId,
      bulanKe,
      jumlah,
    }: {
      kegiatanId: string;
      bulanKe: number; // 1–12
      jumlah: number;
    }) => {
      const nodeRef = ref(database, `${BASE}/dpa/${tahun}/${kegiatanId}`);

      // Pastikan node sudah ada, init jika belum
      const snap = await get(nodeRef);
      if (!snap.exists()) {
        await set(nodeRef, {
          isDPAL: false,
          sumberDPAL: "",
          status: "draft",
          totalDPA: 0,
          updatedAt: Date.now(),
          bulan: {},
        });
      }

      // Simpan jumlah bulan
      await set(
        ref(database, `${BASE}/dpa/${tahun}/${kegiatanId}/bulan/${bulanKe}`),
        { jumlah }
      );

      // Recalc totalDPA dari semua bulan
      const bulanSnap = await get(
        ref(database, `${BASE}/dpa/${tahun}/${kegiatanId}/bulan`)
      );
      let total = 0;
      if (bulanSnap.exists()) {
        Object.values(bulanSnap.val() as Record<string, any>).forEach(
          (b: any) => {
            total += b.jumlah ?? 0;
          }
        );
      }

      await update(nodeRef, {
        totalDPA: total,
        updatedAt: Date.now(),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dpa", tahun] }),
  });
}

// ─── useUpdateDPAMeta ─────────────────────────────────────────────────────────
// Update isDPAL, sumberDPAL, status
export function useUpdateDPAMeta() {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      kegiatanId,
      isDPAL,
      sumberDPAL,
      status,
    }: {
      kegiatanId: string;
      isDPAL?: boolean;
      sumberDPAL?: string;
      status?: "draft" | "dikonfirmasi";
    }) => {
      const payload: Record<string, any> = { updatedAt: Date.now() };
      if (isDPAL !== undefined) payload.isDPAL = isDPAL;
      if (sumberDPAL !== undefined) payload.sumberDPAL = sumberDPAL;
      if (status !== undefined) payload.status = status;

      const nodeRef = ref(database, `${BASE}/dpa/${tahun}/${kegiatanId}`);
      const snap = await get(nodeRef);
      if (!snap.exists()) {
        await set(nodeRef, {
          isDPAL: false,
          sumberDPAL: "",
          status: "draft",
          totalDPA: 0,
          updatedAt: Date.now(),
          bulan: {},
          ...payload,
        });
      } else {
        await update(nodeRef, payload);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dpa", tahun] }),
  });
}

// ─── useResetDPAKegiatan ──────────────────────────────────────────────────────
// Hapus semua data bulan DPA untuk satu kegiatan (reset ke nol).
// Hanya bisa dijalankan jika status masih "draft".
// Node kegiatan tetap ada, tapi bulan dihapus dan totalDPA di-reset ke 0.
export function useResetDPAKegiatan() {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ kegiatanId }: { kegiatanId: string }) => {
      const nodeRef = ref(database, `${BASE}/dpa/${tahun}/${kegiatanId}`);
      const bulanRef = ref(database, `${BASE}/dpa/${tahun}/${kegiatanId}/bulan`);

      // Hapus seluruh node bulan
      await remove(bulanRef);

      // Reset totalDPA dan updatedAt
      await update(nodeRef, {
        totalDPA: 0,
        updatedAt: Date.now(),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dpa", tahun] }),
  });
}
