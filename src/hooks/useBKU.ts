// src/hooks/useBKU.ts
"use client";

import { db as database } from "@/lib/firebase";
import { BKUItem } from "@/lib/types";
import { ref, onValue } from "firebase/database";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "@/store/appStore";

export function useBKU(bulanFilter?: number) {
  const tahun = useAppStore((s) => s.tahunAnggaran);

  return useQuery<BKUItem[]>({
    queryKey: ["bku", tahun, bulanFilter ?? "all"],
    queryFn: () =>
      new Promise((resolve) => {
        const r = ref(database, `siskeudesOnline/tahun/${tahun}/bku`);
        onValue(r, (snap) => {
          if (!snap.exists()) return resolve([]);
          const raw = snap.val() as Record<string, Omit<BKUItem, "id">>;
          let list: BKUItem[] = Object.entries(raw).map(([id, v]) => ({
            id,
            ...v,
            saldo: 0,
          }));
          if (bulanFilter !== undefined) {
            list = list.filter((item) => {
              const bln = new Date(item.tanggal).getMonth() + 1;
              return bln === bulanFilter;
            });
          }
          list.sort(
            (a, b) =>
              new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime() ||
              a.createdAt - b.createdAt
          );
          let saldo = 0;
          list = list.map((item) => {
            saldo += item.penerimaan - item.pengeluaran;
            return { ...item, saldo };
          });
          resolve(list);
        }, { onlyOnce: true });
      }),
    staleTime: 0,
  });
}

export function useSaldoBKU() {
  const { data: bkuAll = [] } = useBKU();
  const totalPenerimaan = bkuAll.reduce((s, b) => s + b.penerimaan, 0);
  const totalPengeluaran = bkuAll.reduce((s, b) => s + b.pengeluaran, 0);
  const saldo = totalPenerimaan - totalPengeluaran;
  return { totalPenerimaan, totalPengeluaran, saldo };
}

export function useSaldoBank() {
  const { data: bkuAll = [] } = useBKU();
  let saldo = 0;
  for (const b of bkuAll) {
    // Masuk bank: penerimaan via rekening bank
    if (b.jenisRef === "penerimaan_bank") {
      saldo += b.penerimaan;
    }
    // Mutasi kas: cek jenisPembayaran untuk arah yang benar
    if (b.jenisRef === "mutasi_kas") {
      const jp = (b as any).jenisPembayaran ?? "bank";
      if (jp === "bank") {
        // bank_ke_tunai: keluar dari bank (pengeluaran), atau tunai_ke_bank: masuk ke bank (penerimaan)
        saldo -= b.pengeluaran;
        saldo += b.penerimaan;
      }
    }
    // Keluar bank: SPP yang mediaPembayaran-nya "bank"
    if (b.jenisRef === "spp") {
      const media = (b as any).mediaPembayaran ?? "bank";
      if (media === "bank") {
        saldo -= b.pengeluaran;
      }
    }
    // Titipan pajak dari SPJ via bank
    if (b.jenisRef === "spj_titipan_pajak") {
      const media = (b as any).mediaPembayaran ?? "bank";
      if (media === "bank") {
        saldo += b.penerimaan;
      }
    }
    // Keluar bank: penyetoran pajak via bank
    if (b.jenisRef === "penyetoran_pajak") {
      const media = (b as any).jenisPembayaran ?? "bank";
      if (media === "bank") {
        saldo -= b.pengeluaran;
      }
    }
    // Keluar bank: penyetoran hutang pajak saldo awal via bank
    if (b.jenisRef === "penyetoran_hutang_pajak") {
      const media = (b as any).jenisPembayaran ?? "tunai";
      if (media === "bank") {
        saldo -= b.pengeluaran;
      }
    }
  }
  return saldo;
}

export function useSaldoTunai() {
  const { data: bkuAll = [] } = useBKU();
  let saldo = 0;
  for (const b of bkuAll) {
    // Masuk tunai: penerimaan tunai langsung
    if (b.jenisRef === "penerimaan_tunai") {
      saldo += b.penerimaan;
    }
    // Mutasi kas: cek jenisPembayaran untuk arah yang benar
    if (b.jenisRef === "mutasi_kas") {
      const jp = (b as any).jenisPembayaran ?? "bank";
      if (jp === "tunai") {
        // bank_ke_tunai: masuk ke tunai (penerimaan), atau tunai_ke_bank: keluar dari tunai (pengeluaran)
        saldo += b.penerimaan;
        saldo -= b.pengeluaran;
      }
    }
    // Masuk tunai: sisa panjar dikembalikan ke kas tunai
    if (b.jenisRef === "spj_sisa_panjar") {
      saldo += b.penerimaan;
    }
    // Keluar tunai: SPP yang mediaPembayaran-nya "tunai"
    if (b.jenisRef === "spp") {
      const media = (b as any).mediaPembayaran ?? "bank";
      if (media === "tunai") {
        saldo -= b.pengeluaran;
      }
    }
    // Titipan pajak dari SPJ via tunai
    if (b.jenisRef === "spj_titipan_pajak") {
      const media = (b as any).mediaPembayaran ?? "bank";
      if (media === "tunai") {
        saldo += b.penerimaan;
      }
    }
    // Keluar tunai: penyetoran pajak via tunai
    if (b.jenisRef === "penyetoran_pajak") {
      const media = (b as any).jenisPembayaran ?? "bank";
      if (media === "tunai") {
        saldo -= b.pengeluaran;
      }
    }
    // Keluar tunai: penyetoran hutang pajak saldo awal via tunai
    if (b.jenisRef === "penyetoran_hutang_pajak") {
      const media = (b as any).jenisPembayaran ?? "tunai";
      if (media === "tunai") {
        saldo -= b.pengeluaran;
      }
    }
  }
  return saldo;
}
