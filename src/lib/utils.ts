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