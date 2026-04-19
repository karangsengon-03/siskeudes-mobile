// src/hooks/useSPJ.ts
"use client";

import { db as database } from "@/lib/firebase";
import { SPJItem, PajakSPJ } from "@/lib/types";
import { ref, onValue, push, update, get, remove } from "firebase/database";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/appStore";
import { useAuthStore } from "@/store/authStore";

async function generateNomorSPJ(tahun: string): Promise<string> {
  const r = ref(database, `siskeudesOnline/spj/${tahun}`);
  const snap = await get(r);
  const count = snap.exists() ? Object.keys(snap.val()).length : 0;
  return `SPJ/${String(count + 1).padStart(3, "0")}/${tahun}`;
}

export function useJumlahSPJ() {
  const { data: list = [] } = useSPJ();
  return list.length;
}
export function useSPJ() {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  return useQuery<SPJItem[]>({
    queryKey: ["spj", tahun],
    queryFn: () =>
      new Promise((resolve) => {
        const r = ref(database, `siskeudesOnline/spj/${tahun}`);
        onValue(r, (snap) => {
          if (!snap.exists()) return resolve([]);
          const raw = snap.val() as Record<string, Omit<SPJItem, "id">>;
          const list = Object.entries(raw).map(([id, v]) => ({ id, ...v }));
          list.sort((a, b) => b.createdAt - a.createdAt);
          resolve(list);
        }, { onlyOnce: true });
      }),
    staleTime: 0,
  });
}

type AddSPJPayload = Omit<SPJItem, "id" | "nomorSPJ" | "status" | "createdAt" | "inputOleh">;

async function writeSPJToBKUAndPajak(
  tahun: string,
  uid: string,
  payload: AddSPJPayload,
  nomorSPJ: string
) {
  // Baris penanda SPJ di BKU (nilai 0)
  await push(ref(database, `siskeudesOnline/bku/${tahun}`), {
    tanggal: payload.tanggal,
    uraian: `SPJ - ${payload.kegiatanNama}`,
    penerimaan: 0,
    pengeluaran: 0,
    jenisRef: "spj",
    nomorRef: nomorSPJ,
    sppId: payload.sppId,
    inputOleh: uid,
    createdAt: Date.now() + 1,
  });

  // Sisa panjar → penerimaan balik ke BKU
  if (payload.sisaPanjar > 0) {
    await push(ref(database, `siskeudesOnline/bku/${tahun}`), {
      tanggal: payload.tanggal,
      uraian: `Sisa Panjar — ${payload.nomorSPP}`,
      penerimaan: payload.sisaPanjar,
      pengeluaran: 0,
      jenisRef: "spj_sisa_panjar",
      nomorRef: nomorSPJ,
      sppId: payload.sppId,
      inputOleh: uid,
      createdAt: Date.now() + 2,
    });
  }

  // Pajak sudah TERMASUK dalam nilai SPP yang dicairkan.
  // Kembalikan totalPajak ke saldo BKU sebagai titipan pajak
  // sehingga saldo tidak minus saat nanti Setor Pajak.
  if (payload.totalPajak > 0) {
    await push(ref(database, `siskeudesOnline/bku/${tahun}`), {
      tanggal: payload.tanggal,
      uraian: `Titipan Pajak — ${nomorSPJ}`,
      penerimaan: payload.totalPajak,
      pengeluaran: 0,
      jenisRef: "spj_titipan_pajak",
      nomorRef: nomorSPJ,
      sppId: payload.sppId,
      mediaPembayaran: payload.mediaPembayaran,
      inputOleh: uid,
      createdAt: Date.now() + 3,
    });
  }

  // Tiap pajak → HANYA BukuPembantuPajak (belum masuk BKU sampai Setor Pajak)
  const pajakArr = Object.values(payload.pajakList);
  for (let i = 0; i < pajakArr.length; i++) {
    const pajak = pajakArr[i];
    if (pajak.jumlahPajak > 0) {
      await push(ref(database, `siskeudesOnline/bukuPembantuPajak/${tahun}`), {
        tanggal: payload.tanggal,
        nomorSPJ,
        nomorSPP: payload.nomorSPP,
        kegiatanNama: payload.kegiatanNama,
        kodePajak: pajak.kode,
        namaPajak: pajak.nama,
        tarif: pajak.tarif,
        dasarPengenaan: pajak.dasarPengenaan,
        jumlah: pajak.jumlahPajak,
        sudahDisetor: false,
        createdAt: Date.now() + 2 + i,
      });
    }
  }
}

export function useAddSPJ() {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const uid = useAuthStore((s) => s.user?.uid ?? "");
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddSPJPayload) => {
      const nomorSPJ = await generateNomorSPJ(tahun);
      await push(ref(database, `siskeudesOnline/spj/${tahun}`), {
        ...payload,
        nomorSPJ,
        status: "disahkan",
        inputOleh: uid,
        createdAt: Date.now(),
      });
      await update(ref(database, `siskeudesOnline/spp/${tahun}/${payload.sppId}`), {
        sudahSPJ: true,
        nomorSPJ,
      });
      await writeSPJToBKUAndPajak(tahun, uid, payload, nomorSPJ);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["spj", tahun] });
      qc.invalidateQueries({ queryKey: ["spp", tahun] });
      qc.invalidateQueries({ queryKey: ["bku", tahun], exact: false });
      qc.invalidateQueries({ queryKey: ["bukuPembantuPajak", tahun] });
      qc.invalidateQueries({ queryKey: ["buku-pajak", tahun], exact: false, refetchType: "all" });
    },
  });
}

async function deleteSPJData(tahun: string, spjId: string) {
  const spjSnap = await get(ref(database, `siskeudesOnline/spj/${tahun}/${spjId}`));
  if (!spjSnap.exists()) return null;
  const spjData = spjSnap.val() as Omit<SPJItem, "id">;

  // Hapus entri BKU yang mereferensikan SPJ ini
  const bkuSnap = await get(ref(database, `siskeudesOnline/bku/${tahun}`));
  if (bkuSnap.exists()) {
    const raw = bkuSnap.val() as Record<string, { nomorRef?: string }>;
    for (const [bkuId, bkuItem] of Object.entries(raw)) {
      if (bkuItem.nomorRef === spjData.nomorSPJ) {
        await remove(ref(database, `siskeudesOnline/bku/${tahun}/${bkuId}`));
      }
    }
  }

  // Hapus entri BukuPembantuPajak yang merujuk SPJ ini
  const pajakSnap = await get(ref(database, `siskeudesOnline/bukuPembantuPajak/${tahun}`));
  if (pajakSnap.exists()) {
    const raw = pajakSnap.val() as Record<string, { nomorSPJ?: string }>;
    for (const [pid, pItem] of Object.entries(raw)) {
      if (pItem.nomorSPJ === spjData.nomorSPJ) {
        await remove(ref(database, `siskeudesOnline/bukuPembantuPajak/${tahun}/${pid}`));
      }
    }
  }

  // Kembalikan status SPP
  await update(ref(database, `siskeudesOnline/spp/${tahun}/${spjData.sppId}`), {
    sudahSPJ: false,
    nomorSPJ: null,
  });

  // Hapus SPJ
  await remove(ref(database, `siskeudesOnline/spj/${tahun}/${spjId}`));

  return spjData;
}

export function useDeleteSPJ() {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (spjId: string) => deleteSPJData(tahun, spjId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["spj", tahun] });
      qc.invalidateQueries({ queryKey: ["spp", tahun] });
      qc.invalidateQueries({ queryKey: ["bku", tahun], exact: false });
      qc.invalidateQueries({ queryKey: ["bukuPembantuPajak", tahun] });
      qc.invalidateQueries({ queryKey: ["buku-pajak", tahun], exact: false, refetchType: "all" });
    },
  });
}

type EditSPJPayload = { spjId: string } & AddSPJPayload;

export function useEditSPJ() {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const uid = useAuthStore((s) => s.user?.uid ?? "");
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: EditSPJPayload) => {
      const { spjId, ...rest } = payload;

      // Ambil nomorSPJ lama agar nomor tidak berubah
      const spjSnap = await get(ref(database, `siskeudesOnline/spj/${tahun}/${spjId}`));
      if (!spjSnap.exists()) throw new Error("SPJ tidak ditemukan");
      const nomorSPJ: string = spjSnap.val().nomorSPJ;

      // Hapus semua entri BKU + pajak lama yang terkait SPJ ini
      await deleteSPJData(tahun, spjId);

      // Tulis ulang SPJ dengan data baru, nomor tetap sama
      await push(ref(database, `siskeudesOnline/spj/${tahun}`), {
        ...rest,
        nomorSPJ,
        status: "disahkan",
        inputOleh: uid,
        createdAt: Date.now(),
      });

      // Tandai SPP sudah di-SPJ lagi
      await update(ref(database, `siskeudesOnline/spp/${tahun}/${rest.sppId}`), {
        sudahSPJ: true,
        nomorSPJ,
      });

      // Tulis ulang BKU + pajak
      await writeSPJToBKUAndPajak(tahun, uid, rest, nomorSPJ);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["spj", tahun] });
      qc.invalidateQueries({ queryKey: ["spp", tahun] });
      qc.invalidateQueries({ queryKey: ["bku", tahun], exact: false });
      qc.invalidateQueries({ queryKey: ["bukuPembantuPajak", tahun] });
      qc.invalidateQueries({ queryKey: ["buku-pajak", tahun], exact: false, refetchType: "all" });
    },
  });
}