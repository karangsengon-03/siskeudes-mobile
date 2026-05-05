// src/components/modules/penatausahaan/BKUView.tsx
"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBKU, useSaldoBKU, useSaldoBank, useSaldoTunai } from "@/hooks/useBKU";
import { formatRupiah } from "@/lib/utils";
import { JenisRefBKU } from "@/lib/types";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Banknote, Loader2, TrendingDown, TrendingUp, Wallet } from "lucide-react";

const BULAN_LABELS = [
  "Semua Bulan",
  "Januari", "Februari", "Maret", "April",
  "Mei", "Juni", "Juli", "Agustus",
  "September", "Oktober", "November", "Desember",
];

// Label + warna badge per jenis referensi
type BadgeVariant = "default" | "secondary" | "outline" | "destructive";
type RefConfig = { label: string; variant: BadgeVariant };

const JENIS_REF_CONFIG: { [key in JenisRefBKU]: RefConfig } = {
  penerimaan_tunai:  { label: "Kas Tunai",     variant: "default" },
  penerimaan_bank:   { label: "Bank",           variant: "default" },
  mutasi_kas:        { label: "Mutasi Kas",     variant: "secondary" },
  spp:               { label: "SPP",            variant: "secondary" },
  spj:               { label: "SPJ",            variant: "secondary" },
  spj_pajak:         { label: "Pajak",          variant: "destructive" },
  spj_sisa_panjar:   { label: "Sisa Panjar",    variant: "outline" },
  spj_titipan_pajak: { label: "Titipan Pajak",  variant: "outline" },
  penyetoran_pajak:        { label: "Setor Pajak",         variant: "destructive" },
  penyetoran_hutang_pajak: { label: "Setor Hutang Pajak",  variant: "destructive" },
  saldo_awal:              { label: "Saldo Awal",           variant: "outline" },
};

type MediaFilter = "semua" | "tunai" | "bank";

export function BKUView() {
  const [bulanFilter, setBulanFilter] = useState<number | undefined>(undefined);
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("semua");
  const { data: bkuRaw = [], isLoading } = useBKU(bulanFilter);

  // Filter tunai/bank setelah data diambil (saldo berjalan tetap dihitung dari semua)
  const bkuList = bkuRaw.filter((item) => {
    if (mediaFilter === "semua") return true;
    if (mediaFilter === "tunai") {
      return (
        item.jenisRef === "penerimaan_tunai" ||
        item.jenisRef === "spj_sisa_panjar" ||
        (item.jenisRef === "mutasi_kas" && (item as any).jenisPembayaran === "tunai") ||
        (item.jenisRef === "spp" && (item as any).mediaPembayaran === "tunai") ||
        (item.jenisRef === "penyetoran_pajak" && (item as any).jenisPembayaran === "tunai") ||
        (item.jenisRef === "penyetoran_hutang_pajak" && (item as any).jenisPembayaran === "tunai")
      );
    }
    // bank
    return (
      item.jenisRef === "penerimaan_bank" ||
      (item.jenisRef === "mutasi_kas" && (item as any).jenisPembayaran === "bank") ||
      (item.jenisRef === "spp" && (item as any).mediaPembayaran !== "tunai") ||
      (item.jenisRef === "penyetoran_pajak" && (item as any).jenisPembayaran !== "tunai") ||
      (item.jenisRef === "penyetoran_hutang_pajak" && (item as any).jenisPembayaran !== "tunai") ||
      item.jenisRef === "spj" ||
      item.jenisRef === "spj_pajak"
    );
  });

  const { totalPenerimaan, totalPengeluaran, saldo } = useSaldoBKU();
  const saldoBank = useSaldoBank();
  const saldoTunai = useSaldoTunai();

  return (
    <div className="flex flex-col h-full">

      {/* Ringkasan */}
      <div className="grid grid-cols-2 gap-2 px-4 py-2 border-b shrink-0 sm:grid-cols-5">
        <div className="text-center col-span-1">
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-0.5">
            <TrendingUp className="h-3 w-3 text-green-500" /> Penerimaan
          </div>
          <p className="text-xs font-semibold text-green-600 truncate">{formatRupiah(totalPenerimaan)}</p>
        </div>
        <div className="text-center col-span-1">
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-0.5">
            <TrendingDown className="h-3 w-3 text-red-500" /> Pengeluaran
          </div>
          <p className="text-xs font-semibold text-red-600 truncate">{formatRupiah(totalPengeluaran)}</p>
        </div>
        <div className="text-center col-span-1">
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-0.5">
            <Wallet className="h-3 w-3" /> Saldo BKU
          </div>
          <p className={`text-xs font-semibold truncate ${saldo < 0 ? "text-destructive" : ""}`}>{formatRupiah(saldo)}</p>
        </div>
        <div className="text-center col-span-1">
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-0.5">
            <Banknote className="h-3 w-3 text-teal-600" /> Saldo Bank
          </div>
          <p className="text-xs font-semibold text-teal-600 truncate">{formatRupiah(saldoBank)}</p>
        </div>
        <div className="text-center col-span-1">
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-0.5">
            <Wallet className="h-3 w-3 text-amber-500" /> Saldo Tunai
          </div>
          <p className="text-xs font-semibold text-amber-600 truncate">{formatRupiah(saldoTunai)}</p>
        </div>
      </div>

      {/* Filter bulan + media */}
      <div className="px-4 py-2 border-b shrink-0 flex gap-2">
        <Select
          value={bulanFilter !== undefined ? String(bulanFilter) : "0"}
          onValueChange={(v) => setBulanFilter(v === "0" ? undefined : parseInt(v))}
        >
          <SelectTrigger className="h-8 text-xs flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BULAN_LABELS.map((label, i) => (
              <SelectItem key={i} value={String(i)}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={mediaFilter}
          onValueChange={(v) => setMediaFilter(v as MediaFilter)}
        >
          <SelectTrigger className="h-8 text-xs w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua</SelectItem>
            <SelectItem value="tunai"><span className="flex items-center gap-1"><Wallet className="h-3 w-3" /> Tunai</span></SelectItem>
            <SelectItem value="bank"><span className="flex items-center gap-1"><Banknote className="h-3 w-3" /> Bank</span></SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List BKU */}
      {isLoading ? (
        <div className="flex items-center justify-center flex-1 text-muted-foreground">
          <Loader2 className="animate-spin mr-2 h-4 w-4" /> Memuat BKU...
        </div>
      ) : bkuList.length === 0 ? (
        <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">
          Belum ada data BKU
        </div>
      ) : (
        <ScrollArea className="flex-1">
          {/* Header kolom */}
          <div className="flex gap-2 px-4 py-1.5 bg-muted/40 border-b text-xs font-semibold text-muted-foreground sticky top-0">
            <span className="w-6 shrink-0 text-right">No</span>
            <span className="w-20 shrink-0">Tanggal</span>
            <span className="flex-1">Uraian / Referensi</span>
            <span className="w-24 shrink-0 text-right">Penerimaan</span>
            <span className="w-24 shrink-0 text-right">Pengeluaran</span>
            <span className="w-24 shrink-0 text-right">Saldo</span>
          </div>

          <div className="divide-y">
            {bkuList.map((item, idx) => {
              const refCfg = JENIS_REF_CONFIG[item.jenisRef] ?? {
                label: item.jenisRef,
                variant: "outline" as const,
              };

              return (
                <div
                  key={item.id}
                  className={`flex gap-2 px-4 py-2.5 items-start hover:bg-muted/20 transition-colors ${
                    item.jenisRef === "spj"
                      ? "bg-teal-50/50 dark:bg-teal-950/20 border-l-2 border-l-teal-500"
                      : ""
                  }`}
                >
                  {/* No urut */}
                  <span className="w-6 shrink-0 text-right text-xs text-muted-foreground pt-0.5">
                    {idx + 1}
                  </span>

                  {/* Tanggal */}
                  <span className="w-20 shrink-0 text-xs text-muted-foreground pt-0.5">
                    {format(new Date(item.tanggal), "dd/MM/yyyy", {
                      locale: localeId,
                    })}
                  </span>

                  {/* Uraian + referensi */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-sm leading-tight">{item.uraian}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant={refCfg.variant} className="text-[10px] h-4 px-1.5">
                        {refCfg.label}
                      </Badge>
                      {/* Badge Bank/Tunai khusus untuk baris SPP */}
                      {item.jenisRef === "spp" && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 gap-0.5">
                          {(item as any).mediaPembayaran === "tunai"
                            ? <><Wallet className="h-2.5 w-2.5" /> Tunai</>
                            : <><Banknote className="h-2.5 w-2.5" /> Bank</>
                          }
                        </Badge>
                      )}
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {item.nomorRef}
                      </span>
                    </div>
                  </div>

                  {/* Penerimaan */}
                  <span className="w-24 shrink-0 text-right text-xs font-medium text-green-600 pt-0.5">
                    {item.jenisRef === "spj" ? "" : item.penerimaan > 0 ? formatRupiah(item.penerimaan) : "—"}
                  </span>

                  {/* Pengeluaran */}
                  <span className="w-24 shrink-0 text-right text-xs font-medium text-red-600 pt-0.5">
                    {item.jenisRef === "spj" ? "" : item.pengeluaran > 0 ? formatRupiah(item.pengeluaran) : "—"}
                  </span>

                  {/* Saldo */}
                  <span className={`w-24 shrink-0 text-right text-xs font-semibold pt-0.5 ${item.saldo < 0 ? "text-destructive" : ""}`}>
                    {item.jenisRef === "spj" ? "" : formatRupiah(item.saldo)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Footer total */}
          <div className="flex gap-2 px-4 py-2 border-t bg-muted/40 text-xs font-semibold sticky bottom-0">
            <span className="w-6 shrink-0" />
            <span className="w-20 shrink-0" />
            <span className="flex-1 text-right text-muted-foreground">TOTAL</span>
            <span className="w-24 shrink-0 text-right text-green-600">
              {formatRupiah(totalPenerimaan)}
            </span>
            <span className="w-24 shrink-0 text-right text-red-600">
              {formatRupiah(totalPengeluaran)}
            </span>
            <span className="w-24 shrink-0 text-right">
              {formatRupiah(saldo)}
            </span>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}