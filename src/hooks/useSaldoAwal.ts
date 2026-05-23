// src/hooks/useSaldoAwal.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ref, get, set, push, remove } from "firebase/database";
import { db as database } from "@/lib/firebase";
import { useAppStore } from "@/store/appStore";
import { useAuthStore } from "@/store/authStore";
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

/**
 * Hapus semua entri BKU dengan jenisRef "saldo_awal" untuk tahun tertentu.
 * Dipanggil sebelum menyimpan saldo awal baru agar tidak duplikat.
 */
async function hapusEntryBKUSaldoAwal(tahun: string) {
  const bkuSnap = await get(ref(database, `siskeudesOnline/tahun/${tahun}/bku`));
  if (!bkuSnap.exists()) return;
  const raw = bkuSnap.val() as Record<string, { jenisRef?: string }>;
  for (const [bkuId, item] of Object.entries(raw)) {
    if (item.jenisRef === "saldo_awal") {
      await remove(ref(database, `siskeudesOnline/tahun/${tahun}/bku/${bkuId}`));
    }
  }
}

export function useSaveSaldoAwal() {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const uid = useAuthStore((s) => s.user?.uid ?? "");
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<SaldoAwal, "updatedAt">) => {
      const payload: SaldoAwal = { ...data, updatedAt: Date.now() };

      // Simpan ke path saldoAwal
      await set(ref(database, basePath(tahun)), payload);

      // Hapus entry BKU saldo_awal lama sebelum tulis ulang
      await hapusEntryBKUSaldoAwal(tahun);

      // Tanggal saldo awal selalu 1 Januari tahun anggaran
      const tanggalSaldoAwal = `${tahun}-01-01`;
      const baseCreatedAt = Date.now();

      // Tulis entry BKU untuk kas bank (jika > 0)
      if (data.bank > 0) {
        await push(ref(database, `siskeudesOnline/tahun/${tahun}/bku`), {
          tanggal: tanggalSaldoAwal,
          uraian: `Saldo Awal Kas Bank — SiLPA ${Number(tahun) - 1}`,
          penerimaan: data.bank,
          pengeluaran: 0,
          jenisRef: "saldo_awal",
          nomorRef: `SA/${tahun}`,
          mediaPembayaran: "bank",
          inputOleh: uid,
          createdAt: baseCreatedAt,
        });
      }

      // Tulis entry BKU untuk kas tunai (jika > 0)
      if (data.kasTunai > 0) {
        await push(ref(database, `siskeudesOnline/tahun/${tahun}/bku`), {
          tanggal: tanggalSaldoAwal,
          uraian: `Saldo Awal Kas Tunai — SiLPA ${Number(tahun) - 1}`,
          penerimaan: data.kasTunai,
          pengeluaran: 0,
          jenisRef: "saldo_awal",
          nomorRef: `SA/${tahun}`,
          mediaPembayaran: "tunai",
          inputOleh: uid,
          createdAt: baseCreatedAt + 1,
        });
      }

      return payload;
    },
    onSuccess: (saved) => {
      qc.setQueryData<SaldoAwal>(["saldoAwal", tahun], saved);
      qc.invalidateQueries({ queryKey: ["bku", tahun], exact: false });
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
