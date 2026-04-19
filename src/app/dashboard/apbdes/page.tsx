"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAPBDes } from "@/hooks/useAPBDes";
import { useAppStore } from "@/store/appStore";
import { FormPendapatan } from "@/components/modules/apbdes/FormPendapatan";
import { BelanjaBidangTree } from "@/components/modules/apbdes/BelanjaBidangTree";
import { FormPembiayaan } from "@/components/modules/apbdes/FormPembiayaan";
import { RekapAPBDes } from "@/components/modules/apbdes/RekapAPBDes";
import { formatRupiah } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Section = "pendapatan" | "belanja" | "pembiayaan" | "rekap";

const SECTIONS: { key: Section; kode: string; label: string }[] = [
  { key: "pendapatan", kode: "4", label: "Pendapatan" },
  { key: "belanja",    kode: "5", label: "Belanja" },
  { key: "pembiayaan", kode: "6", label: "Pembiayaan" },
  { key: "rekap",      kode: "∑", label: "Rekap" },
];

export default function APBDesPage() {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const { data, isLoading } = useAPBDes();
  const [active, setActive] = useState<Section>("pendapatan");

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const surplus = data?.surplusDefisit ?? 0;
  const isSurplus = surplus > 0;
  const isBalance = surplus === 0;

  const sectionTotal: Record<Section, number> = {
    pendapatan: data?.totalPendapatan ?? 0,
    belanja:    data?.totalBelanja ?? 0,
    pembiayaan: data?.totalPembiayaan ?? 0,
    rekap:      Math.abs(surplus),
  };

  const sectionCount: Record<Section, number> = {
    pendapatan: data?.pendapatan.length ?? 0,
    belanja:    data?.belanja
      ? Array.isArray(data.belanja)
        ? data.belanja.length
        : Object.keys(data.belanja).length
      : 0,
    pembiayaan: data?.pembiayaan.length ?? 0,
    rekap:      0,
  };

  return (
    <div className="flex flex-col -m-4" style={{ height: 'calc(100svh - 56px)', maxHeight: 'calc(100svh - 56px)' }}>

      {/* Top bar */}
      <div className="shrink-0 px-4 py-3 border-b flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold leading-tight">APBDes {tahun}</h1>
          <p className="text-xs text-muted-foreground">Anggaran Pendapatan dan Belanja Desa</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            {isBalance ? "Berimbang" : isSurplus ? "Surplus" : "Defisit"}
          </p>
          <p className={`text-sm font-bold tabular-nums ${
            isBalance ? "" : isSurplus ? "text-teal-600" : "text-destructive"
          }`}>
            {formatRupiah(Math.abs(surplus))}
          </p>
        </div>
      </div>

      {/* Split panel */}
      <div className="flex flex-1 overflow-hidden">

        {/* Kiri — navigasi section */}
        <div className="w-44 shrink-0 border-r flex flex-col overflow-y-auto">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setActive(s.key)}
              className={cn(
                "w-full text-left px-3 py-3.5 border-b transition-colors",
                active === s.key
                  ? "bg-teal-50 dark:bg-teal-950/30 border-l-2 border-l-teal-600"
                  : "hover:bg-muted/50 border-l-2 border-l-transparent"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                  "text-xs font-bold w-5 h-5 rounded flex items-center justify-center shrink-0",
                  active === s.key
                    ? "bg-teal-600 text-white"
                    : "bg-muted text-muted-foreground"
                )}>
                  {s.kode}
                </span>
                <span className={cn(
                  "text-xs font-semibold",
                  active === s.key ? "text-teal-700 dark:text-teal-400" : "text-foreground"
                )}>
                  {s.label}
                </span>
              </div>
              {s.key !== "rekap" && (
                <>
                  <p className="text-xs text-muted-foreground pl-7">
                    {sectionCount[s.key]} pos
                  </p>
                  <p className={cn(
                    "text-xs font-medium tabular-nums pl-7",
                    s.key === "belanja" ? "text-rose-500" : "text-teal-600"
                  )}>
                    {formatRupiah(sectionTotal[s.key])}
                  </p>
                </>
              )}
              {s.key === "rekap" && (
                <p className={cn(
                  "text-xs font-medium tabular-nums pl-7",
                  isBalance ? "text-muted-foreground" : isSurplus ? "text-teal-600" : "text-destructive"
                )}>
                  {formatRupiah(sectionTotal.rekap)}
                </p>
              )}
            </button>
          ))}
        </div>

        {/* Kanan — konten section */}
        <div className="flex-1 overflow-y-auto p-4">
          {active === "pendapatan" && (
            <FormPendapatan items={data?.pendapatan ?? []} />
          )}
          {active === "belanja" && (
            <BelanjaBidangTree kegiatanList={
              Array.isArray(data?.belanja)
                ? Object.fromEntries(data.belanja.map((k) => [k.id, k]))
                : (data?.belanja ?? {})
            } />
          )}
          {active === "pembiayaan" && (
            <FormPembiayaan items={data?.pembiayaan ?? []} />
          )}
          {active === "rekap" && data && (
            <RekapAPBDes data={data} />
          )}
        </div>

      </div>
    </div>
  );
}