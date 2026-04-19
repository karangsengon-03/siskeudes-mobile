// src/components/modules/buku-pembantu/BukuKasTunai.tsx
"use client";

import { useState } from "react";
import { useBukuKasTunai } from "@/hooks/useBukuPembantu";
import { formatRupiah } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Wallet } from "lucide-react";

const BULAN_LABELS = [
  "Semua Bulan",
  "Januari", "Februari", "Maret", "April",
  "Mei", "Juni", "Juli", "Agustus",
  "September", "Oktober", "November", "Desember",
];

export function BukuKasTunai() {
  const [bulan, setBulan] = useState<number | undefined>(undefined);
  const { data: rows = [], isLoading } = useBukuKasTunai(bulan);

  const totalPenerimaan = rows.reduce((s, r) => s + r.penerimaan, 0);
  const totalPengeluaran = rows.reduce((s, r) => s + r.pengeluaran, 0);
  const saldoAkhir = rows.length > 0 ? rows[rows.length - 1].saldoBerjalan : 0;

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-teal-600" />
            <h2 className="font-semibold text-base">Buku Kas Tunai</h2>
          </div>
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

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Belum ada transaksi kas tunai{bulan !== undefined ? ` di ${BULAN_LABELS[bulan]}` : ""}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-width: 600px">
              <thead>
                <tr className="bg-muted text-muted-foreground">
                  <th className="border px-2 py-1 text-left w-8">No</th>
                  <th className="border px-2 py-1 text-left w-24">Tanggal</th>
                  <th className="border px-2 py-1 text-left w-28">Nomor Bukti</th>
                  <th className="border px-2 py-1 text-left">Uraian</th>
                  <th className="border px-2 py-1 text-right w-32">Penerimaan</th>
                  <th className="border px-2 py-1 text-right w-32">Pengeluaran</th>
                  <th className="border px-2 py-1 text-right w-32">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} className={`hover:bg-muted/30 ${r.pengeluaran > 0 ? "bg-red-50/30 dark:bg-red-950/10" : ""}`}>
                    <td className="border px-2 py-1 text-center text-xs text-muted-foreground">{i + 1}</td>
                    <td className="border px-2 py-1 whitespace-nowrap text-xs">{format(new Date(r.tanggal), "dd/MM/yyyy", { locale: id })}</td>
                    <td className="border px-2 py-1 whitespace-nowrap text-xs font-mono">{r.nomorRef}</td>
                    <td className="border px-2 py-1 text-xs">{r.uraian}</td>
                    <td className="border px-2 py-1 text-right text-xs text-green-700 font-medium">
                      {r.penerimaan > 0 ? formatRupiah(r.penerimaan) : "—"}
                    </td>
                    <td className="border px-2 py-1 text-right text-xs text-red-600 font-medium">
                      {r.pengeluaran > 0 ? formatRupiah(r.pengeluaran) : "—"}
                    </td>
                    <td className="border px-2 py-1 text-right text-xs font-semibold">{formatRupiah(r.saldoBerjalan)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted font-semibold text-xs">
                  <td colSpan={4} className="border px-2 py-1.5 text-right">TOTAL</td>
                  <td className="border px-2 py-1.5 text-right text-green-700">{formatRupiah(totalPenerimaan)}</td>
                  <td className="border px-2 py-1.5 text-right text-red-600">{formatRupiah(totalPengeluaran)}</td>
                  <td className="border px-2 py-1.5 text-right">{formatRupiah(saldoAkhir)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
