// src/lib/nomorDokumen.ts
// Format nomor dokumen otomatis — counter disimpan di RTDB
// Path counter: siskeudesOnline/tahun/{tahun}/counter/{jenisDokumen}

import { ref, get, set, runTransaction } from "firebase/database";
import { db as database } from "@/lib/firebase";

export type JenisDokumen = "SPP" | "KWT" | "BANK" | "CASH" | "SAL" | "SSP" | "SPJ" | "TBP";

// Padding & format per jenis dokumen (sesuai blueprint)
const FORMAT: Record<JenisDokumen, { pad: number }> = {
  SPP:  { pad: 4 },
  KWT:  { pad: 5 },
  BANK: { pad: 4 },
  CASH: { pad: 4 },
  SAL:  { pad: 5 },
  SSP:  { pad: 4 },
  SPJ:  { pad: 4 },
  TBP:  { pad: 4 },
};

/**
 * Generate nomor dokumen berikutnya secara atomic menggunakan RTDB transaction.
 * Format: {urutan padded}/{jenis}/{kodeDesa}/{tahun}
 * Contoh SPP:  0106/SPP/14.2007/2025
 * Contoh KWT:  00203/KWT/14.2007/2025
 */
export async function generateNomorDokumen(
  jenis: JenisDokumen,
  kodeDesa: string,
  tahun: string
): Promise<string> {
  const counterRef = ref(database, `siskeudesOnline/tahun/${tahun}/counter/${jenis}`);

  let newCount = 1;
  await runTransaction(counterRef, (current) => {
    newCount = (current ?? 0) + 1;
    return newCount;
  });

  const pad = FORMAT[jenis].pad;
  const urutan = String(newCount).padStart(pad, "0");
  return `${urutan}/${jenis}/${kodeDesa}/${tahun}`;
}

/**
 * Baca counter saat ini (tanpa increment) — untuk preview/info
 */
export async function peekCounter(
  jenis: JenisDokumen,
  tahun: string
): Promise<number> {
  const snap = await get(ref(database, `siskeudesOnline/tahun/${tahun}/counter/${jenis}`));
  return snap.exists() ? (snap.val() as number) : 0;
}

/**
 * Reset counter ke 0 — gunakan hati-hati, hanya untuk testing/dev
 */
export async function resetCounter(
  jenis: JenisDokumen,
  tahun: string
): Promise<void> {
  await set(ref(database, `siskeudesOnline/tahun/${tahun}/counter/${jenis}`), 0);
}
