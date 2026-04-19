"use client";

import { useState } from "react";
import { useBukuPanjar } from "@/hooks/useBukuPembantu";
import { formatRupiah } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const BULAN_LABELS = [
  "Semua Bulan",
  "Januari","Februari","Maret","April",
  "Mei","Juni","Juli","Agustus",
  "September","Oktober","November","Desember",
];

export function BukuPanjar() {
  const [bulan, setBulan] = useState<number | undefined>(undefined);
  const { data = [], isLoading } = useBukuPanjar(bulan);

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold text-base">Buku Pembantu Panjar</h2>
          <Select
            value={bulan !== undefined ? String(bulan) : "0"}
            onValueChange={(v) => setBulan(v === "0" ? undefined : parseInt(v))}
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BULAN_LABELS.map((label, i) => (
                <SelectItem key={i} value={String(i)}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Belum ada SPP Panjar{bulan !== undefined ? ` di ${BULAN_LABELS[bulan]}` : ""}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted text-muted-foreground">
                  <th className="border px-2 py-1 text-left">No</th>
                  <th className="border px-2 py-1 text-left">Tanggal</th>
                  <th className="border px-2 py-1 text-left">No. SPP</th>
                  <th className="border px-2 py-1 text-left">Uraian</th>
                  <th className="border px-2 py-1 text-right">Nilai Panjar</th>
                  <th className="border px-2 py-1 text-right">Sisa Panjar</th>
                  <th className="border px-2 py-1 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r, i) => (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="border px-2 py-1">{i + 1}</td>
                    <td className="border px-2 py-1 whitespace-nowrap text-xs">{format(new Date(r.tanggal), "dd/MM/yyyy", { locale: id })}</td>
                    <td className="border px-2 py-1 whitespace-nowrap font-mono text-xs">{r.nomorSPP}</td>
                    <td className="border px-2 py-1 text-xs">{r.uraian}</td>
                    <td className="border px-2 py-1 text-right tabular-nums">{formatRupiah(r.nilaiPanjar)}</td>
                    <td className="border px-2 py-1 text-right tabular-nums">{formatRupiah(r.sisaPanjar)}</td>
                    <td className="border px-2 py-1 text-center">
                      {r.statusLunas
                        ? <Badge className="bg-green-600 text-white text-xs">Lunas</Badge>
                        : <Badge variant="destructive" className="text-xs">Belum Lunas</Badge>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
