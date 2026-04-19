"use client";

import { useState, useMemo } from "react";
import { useBukuPajak } from "@/hooks/useBukuPembantu";
import { formatRupiah } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CheckCircle2, Clock } from "lucide-react";

const BULAN_LABELS = [
  "Semua Bulan","Januari","Februari","Maret","April",
  "Mei","Juni","Juli","Agustus","September","Oktober","November","Desember",
];

export function BukuPajak() {
  const [bulan, setBulan] = useState<number | undefined>(undefined);
  const [filterKode, setFilterKode] = useState<string>("semua");
  const { data = [], isLoading } = useBukuPajak(bulan);

  const jenisPajakList = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of data) { if (!map.has(r.kodePajak)) map.set(r.kodePajak, r.namaPajak); }
    return Array.from(map.entries()).map(([kode, nama]) => ({ kode, nama }));
  }, [data]);

  const filtered = filterKode === "semua" ? data : data.filter((r) => r.kodePajak === filterKode);
  const totalDipungut = filtered.reduce((s, r) => s + r.jumlah, 0);
  const totalDisetor = filtered.filter((r) => r.sudahDisetor).reduce((s, r) => s + r.jumlah, 0);
  const totalBelumDisetor = totalDipungut - totalDisetor;

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="font-semibold text-base">Buku Pembantu Pajak</h2>
          <div className="flex gap-2 flex-wrap">
            {jenisPajakList.length > 1 && (
              <Select value={filterKode} onValueChange={setFilterKode}>
                <SelectTrigger className="h-8 text-xs w-48">
                  <SelectValue placeholder="Filter jenis pajak..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Jenis Pajak</SelectItem>
                  {jenisPajakList.map((j) => (
                    <SelectItem key={j.kode} value={j.kode}>{j.kode} — {j.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select
              value={bulan !== undefined ? String(bulan) : "0"}
              onValueChange={(v) => setBulan(v === "0" ? undefined : parseInt(v))}
            >
              <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {BULAN_LABELS.map((label, i) => (
                  <SelectItem key={i} value={String(i)}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {data.length > 0 && (
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-md border p-2 space-y-0.5">
              <p className="text-muted-foreground">Dipungut</p>
              <p className="font-semibold tabular-nums">{formatRupiah(totalDipungut)}</p>
            </div>
            <div className="rounded-md border p-2 space-y-0.5 border-teal-200 bg-teal-50/50 dark:bg-teal-950/20">
              <p className="text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-teal-600" /> Sudah Disetor</p>
              <p className="font-semibold tabular-nums text-teal-600">{formatRupiah(totalDisetor)}</p>
            </div>
            <div className={`rounded-md border p-2 space-y-0.5 ${totalBelumDisetor > 0 ? "border-rose-200 bg-rose-50/50 dark:bg-rose-950/20" : ""}`}>
              <p className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3 text-rose-500" /> Belum Disetor</p>
              <p className={`font-semibold tabular-nums ${totalBelumDisetor > 0 ? "text-rose-600" : ""}`}>{formatRupiah(totalBelumDisetor)}</p>
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Belum ada data pajak.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted text-muted-foreground">
                  <th className="border px-2 py-1 text-left">No</th>
                  <th className="border px-2 py-1 text-left">Tanggal</th>
                  <th className="border px-2 py-1 text-left">No. SPJ</th>
                  <th className="border px-2 py-1 text-left">Uraian</th>
                  <th className="border px-2 py-1 text-left">Jenis Pajak</th>
                  <th className="border px-2 py-1 text-right">DPP</th>
                  <th className="border px-2 py-1 text-right">Jumlah Pajak</th>
                  <th className="border px-2 py-1 text-center">Status Setor</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id} className={r.sudahDisetor ? "bg-muted/20" : "hover:bg-muted/30"}>
                    <td className="border px-2 py-1 text-xs text-muted-foreground">{i + 1}</td>
                    <td className="border px-2 py-1 whitespace-nowrap text-xs">{format(new Date(r.tanggal), "dd/MM/yyyy", { locale: id })}</td>
                    <td className="border px-2 py-1 whitespace-nowrap font-mono text-xs">{r.nomorSPJ}</td>
                    <td className="border px-2 py-1 text-xs">{r.uraian}</td>
                    <td className="border px-2 py-1"><Badge variant="outline" className="text-xs">{r.kodePajak}</Badge></td>
                    <td className="border px-2 py-1 text-right text-xs tabular-nums text-muted-foreground">{formatRupiah(r.dasarPengenaan)}</td>
                    <td className="border px-2 py-1 text-right text-xs tabular-nums font-medium">{formatRupiah(r.jumlah)}</td>
                    <td className="border px-2 py-1 text-center">
                      {r.sudahDisetor ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <Badge className="bg-teal-600 text-white text-[10px] px-1.5 py-0">
                            <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> Disetor
                          </Badge>
                          {r.nomorSetor && <span className="text-[9px] text-muted-foreground font-mono">{r.nomorSetor}</span>}
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-300">
                          <Clock className="h-2.5 w-2.5 mr-0.5" /> Belum
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted font-semibold">
                  <td colSpan={6} className="border px-2 py-1 text-right text-xs">Total Dipungut</td>
                  <td className="border px-2 py-1 text-right tabular-nums">{formatRupiah(totalDipungut)}</td>
                  <td className="border px-2 py-1" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Keterangan kolom Disetor */}
        <p className="text-[10px] text-muted-foreground">
          ⓘ Kolom <strong>Status Setor</strong> menandai apakah pajak tersebut sudah disetor ke kas negara via menu <em>Setor Pajak</em>. Status otomatis berubah saat penyetoran dilakukan.
        </p>
      </div>
    </ScrollArea>
  );
}
