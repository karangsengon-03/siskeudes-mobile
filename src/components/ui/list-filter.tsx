// src/components/ui/list-filter.tsx
"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

const BULAN_OPTIONS = [
  { value: "0", label: "Semua Bulan" },
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Maret" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Juni" },
  { value: "7", label: "Juli" },
  { value: "8", label: "Agustus" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

interface ListFilterProps {
  bulan: string;
  onBulanChange: (val: string) => void;
  search: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;
}

export function ListFilter({
  bulan,
  onBulanChange,
  search,
  onSearchChange,
  searchPlaceholder = "Cari...",
}: ListFilterProps) {
  return (
    <div className="flex gap-2 px-4 py-2 border-b shrink-0">
      <Select value={bulan} onValueChange={onBulanChange}>
        <SelectTrigger className="w-36 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {BULAN_OPTIONS.map((b) => (
            <SelectItem key={b.value} value={b.value} className="text-xs">
              {b.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="relative flex-1">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-8 pl-7 text-xs"
        />
      </div>
    </div>
  );
}

/**
 * Filter list berdasarkan bulan dari field tanggal ("YYYY-MM-DD").
 * bulan "0" = semua bulan.
 */
export function filterByBulan<T extends { tanggal: string }>(
  list: T[],
  bulan: string
): T[] {
  if (bulan === "0") return list;
  const bln = Number(bulan);
  return list.filter((item) => {
    const m = new Date(item.tanggal).getMonth() + 1;
    return m === bln;
  });
}
