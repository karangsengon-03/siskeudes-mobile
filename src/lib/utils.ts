import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTanggal(dateStr: string): string {
  try {
    return format(new Date(dateStr), "dd MMMM yyyy", { locale: id });
  } catch {
    return dateStr;
  }
}

export function formatTanggalPendek(dateStr: string): string {
  try {
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: id });
  } catch {
    return dateStr;
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function getTanggalHariIni(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/**
 * Parse angka dari string input, mendukung format Indonesia (koma sebagai desimal)
 * maupun format internasional (titik sebagai desimal).
 * Contoh: "48232,91" → 48232.91 | "48232.91" → 48232.91 | "48.232,91" → 48232.91
 * Mengembalikan 0 jika string tidak valid.
 */
export function parseDecimalId(val: string | number | undefined | null): number {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  const s = String(val).trim();
  // Format "48.232,91" → hapus titik ribuan, ganti koma desimal ke titik
  if (s.includes(",")) {
    const normalized = s.replace(/\./g, "").replace(",", ".");
    const n = parseFloat(normalized);
    return isNaN(n) ? 0 : n;
  }
  // Format "48232.91" → langsung parseFloat
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}