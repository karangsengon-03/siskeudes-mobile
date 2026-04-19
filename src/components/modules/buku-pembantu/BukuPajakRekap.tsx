"use client";

import { useState } from "react";
import { useBukuPajakRekap } from "@/hooks/useBukuPembantu";
import { formatRupiah } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const BULAN_LABELS = [
  "Semua Bulan",
  "Januari","Februari","Maret","April",
  "Mei","Juni","Juli","Agustus",
  "September","Oktober","November","Desember",
];

export function BukuPajakRekap() {
  const [bulan, setBulan] = useState<number | undefined>(undefined);
  const { data = [], isLoading } = useBukuPajakRekap(bulan);

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  const totalDipungut = data.reduce((s, r) => s + r.totalDipungut, 0);
  const totalDisetor = data.reduce((s, r) => s + r.totalDisetor, 0);
  const totalSisa = data.reduce((s, r) => s + r.sisaBelumDisetor, 0);

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold text-base">Rekap Buku Pembantu Pajak</h2>
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
          <p className="text-sm text-muted-foreground text-center py-8">Belum ada data pajak.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted text-muted-foreground">
                  <th className="border px-2 py-1 text-left">No</th>
                  <th className="border px-2 py-1 text-left">Kode</th>
                  <th className="border px-2 py-1 text-left">Jenis Pajak</th>
                  <th className="border px-2 py-1 text-right">Total Dipungut</th>
                  <th className="border px-2 py-1 text-right">Sudah Disetor</th>
                  <th className="border px-2 py-1 text-right">Sisa Belum Disetor</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r, i) => (
                  <tr key={r.kodePajak} className="hover:bg-muted/30">
                    <td className="border px-2 py-1">{i + 1}</td>
                    <td className="border px-2 py-1 font-mono text-xs">{r.kodePajak}</td>
                    <td className="border px-2 py-1">{r.namaPajak}</td>
                    <td className="border px-2 py-1 text-right tabular-nums">{formatRupiah(r.totalDipungut)}</td>
                    <td className="border px-2 py-1 text-right text-green-600 tabular-nums">{formatRupiah(r.totalDisetor)}</td>
                    <td className="border px-2 py-1 text-right text-red-600 tabular-nums">{formatRupiah(r.sisaBelumDisetor)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted font-semibold">
                  <td colSpan={3} className="border px-2 py-1 text-right">Total</td>
                  <td className="border px-2 py-1 text-right tabular-nums">{formatRupiah(totalDipungut)}</td>
                  <td className="border px-2 py-1 text-right text-green-600 tabular-nums">{formatRupiah(totalDisetor)}</td>
                  <td className="border px-2 py-1 text-right text-red-600 tabular-nums">{formatRupiah(totalSisa)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
