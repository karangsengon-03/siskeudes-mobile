"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { APBDesData } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";

interface Props {
  data: APBDesData;
}

export function RekapAPBDes({ data }: Props) {
  const surplus = data.surplusDefisit; // Pendapatan - Belanja

  // Pembiayaan netto = penerimaan pembiayaan - pengeluaran pembiayaan
  const penerimaanPembiayaan = data.pembiayaan
    .filter((p) => p.jenis === "penerimaan")
    .reduce((acc, p) => acc + p.anggaran, 0);
  const pengeluaranPembiayaan = data.pembiayaan
    .filter((p) => p.jenis === "pengeluaran")
    .reduce((acc, p) => acc + p.anggaran, 0);
  const pembiayaanNetto = penerimaanPembiayaan - pengeluaranPembiayaan;

  // SiLPA Akhir = Surplus/Defisit + Pembiayaan Netto
  const silpaAkhir = surplus + pembiayaanNetto;

  const isBalance = surplus === 0;
  const isSurplus = surplus > 0;
  const isSilpaPositif = silpaAkhir >= 0;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Pendapatan</p>
                <p className="text-lg font-bold text-teal-600">{formatRupiah(data.totalPendapatan)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-teal-600/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Belanja</p>
                <p className="text-lg font-bold text-rose-500">{formatRupiah(data.totalBelanja)}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-rose-500/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {isBalance ? "Berimbang" : isSurplus ? "Surplus" : "Defisit"}
                </p>
                <p className={`text-lg font-bold ${isBalance ? "text-foreground" : isSurplus ? "text-teal-600" : "text-destructive"}`}>
                  {formatRupiah(Math.abs(surplus))}
                </p>
              </div>
              {isBalance ? <Minus className="w-8 h-8 text-muted-foreground/20" /> : isSurplus ? <TrendingUp className="w-8 h-8 text-teal-600/20" /> : <TrendingDown className="w-8 h-8 text-destructive/20" />}
            </div>
          </CardContent>
        </Card>

        <Card className={`border-2 ${isSilpaPositif ? "border-teal-600/40" : "border-destructive/40"}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">SiLPA Akhir Tahun</p>
                <p className={`text-lg font-bold ${isSilpaPositif ? "text-teal-600" : "text-destructive"}`}>
                  {formatRupiah(Math.abs(silpaAkhir))}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Surplus ± Pembiayaan Netto</p>
              </div>
              <TrendingUp className={`w-8 h-8 ${isSilpaPositif ? "text-teal-600/20" : "text-destructive/20"}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Rekap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Rekap APBDes {data.tahun}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">

          {/* I. Pendapatan */}
          <div className="flex justify-between items-center py-1">
            <span className="text-sm font-semibold">I. PENDAPATAN</span>
            <span className="text-sm font-semibold text-teal-600">{formatRupiah(data.totalPendapatan)}</span>
          </div>
          {data.pendapatan.map((p) => (
            <div key={p.id} className="flex justify-between items-start pl-4 py-0.5">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{p.kodeRekening}</p>
                <p className="text-xs truncate">{p.namaRekening}</p>
              </div>
              <span className="text-xs ml-2 shrink-0">{formatRupiah(p.anggaran)}</span>
            </div>
          ))}

          <Separator />

          {/* II. Belanja */}
          <div className="flex justify-between items-center py-1">
            <span className="text-sm font-semibold">II. BELANJA</span>
            <span className="text-sm font-semibold text-rose-500">{formatRupiah(data.totalBelanja)}</span>
          </div>
          {Array.from(
            (Array.isArray(data.belanja) ? data.belanja : Object.values(data.belanja))
              .reduce((map, k) => {
                if (!map.has(k.bidangKode)) map.set(k.bidangKode, { nama: k.bidangNama, total: 0 });
                map.get(k.bidangKode)!.total += k.totalPagu;
                return map;
              }, new Map<string, { nama: string; total: number }>())
          ).map(([kode, { nama, total }]) => (
            <div key={kode} className="flex justify-between items-start pl-4 py-0.5">
              <p className="text-xs">{kode}. {nama}</p>
              <span className="text-xs ml-2 shrink-0">{formatRupiah(total)}</span>
            </div>
          ))}

          <Separator />

          {/* Surplus/Defisit */}
          <div className={`flex justify-between items-center py-1 font-semibold ${isBalance ? "" : isSurplus ? "text-teal-600" : "text-destructive"}`}>
            <span className="text-sm">{isBalance ? "BERIMBANG" : isSurplus ? "SURPLUS" : "DEFISIT"}</span>
            <span className="text-sm">{formatRupiah(Math.abs(surplus))}</span>
          </div>

          <Separator />

          {/* III. Pembiayaan */}
          <div className="flex justify-between items-center py-1">
            <span className="text-sm font-semibold">III. PEMBIAYAAN</span>
            <span className="text-sm font-semibold">{formatRupiah(Math.abs(pembiayaanNetto))}</span>
          </div>

          {/* Penerimaan Pembiayaan */}
          {penerimaanPembiayaan > 0 && (
            <div className="pl-4 space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Penerimaan Pembiayaan</p>
              {data.pembiayaan.filter((p) => p.jenis === "penerimaan").map((p) => (
                <div key={p.id} className="flex justify-between items-start pl-2 py-0.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{p.kodeRekening}</p>
                    <p className="text-xs truncate">{p.namaRekening}</p>
                    {p.sumberDana && <Badge variant="outline" className="text-xs mt-0.5">{p.sumberDana}</Badge>}
                  </div>
                  <span className="text-xs ml-2 shrink-0 text-teal-600">{formatRupiah(p.anggaran)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Pengeluaran Pembiayaan */}
          {pengeluaranPembiayaan > 0 && (
            <div className="pl-4 space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Pengeluaran Pembiayaan</p>
              {data.pembiayaan.filter((p) => p.jenis === "pengeluaran").map((p) => (
                <div key={p.id} className="flex justify-between items-start pl-2 py-0.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{p.kodeRekening}</p>
                    <p className="text-xs truncate">{p.namaRekening}</p>
                  </div>
                  <span className="text-xs ml-2 shrink-0 text-rose-500">{formatRupiah(p.anggaran)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center py-0.5 pl-4 text-xs text-muted-foreground">
            <span>Pembiayaan Netto</span>
            <span className={pembiayaanNetto >= 0 ? "text-teal-600" : "text-destructive"}>{formatRupiah(Math.abs(pembiayaanNetto))}</span>
          </div>

          <Separator />

          {/* SiLPA Akhir */}
          <div className={`flex justify-between items-center py-1.5 font-bold text-base ${isSilpaPositif ? "text-teal-600" : "text-destructive"}`}>
            <span>SiLPA AKHIR TAHUN</span>
            <span>{formatRupiah(Math.abs(silpaAkhir))}</span>
          </div>
          <p className="text-xs text-muted-foreground text-right">
            {isSurplus ? "Surplus" : "Defisit"} {formatRupiah(Math.abs(surplus))} {pembiayaanNetto >= 0 ? "+" : "−"} Pembiayaan Netto {formatRupiah(Math.abs(pembiayaanNetto))}
          </p>

        </CardContent>
      </Card>
    </div>
  );
}