"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAPBDes,
  useAPBDesMeta,
  useBuatPAK,
  useSaveAPBDesMeta,
} from "@/hooks/useAPBDes";
import { useAppStore } from "@/store/appStore";
import { FormPendapatan } from "@/components/modules/apbdes/FormPendapatan";
import { BelanjaBidangTree } from "@/components/modules/apbdes/BelanjaBidangTree";
import { FormPembiayaan } from "@/components/modules/apbdes/FormPembiayaan";
import { RekapAPBDes } from "@/components/modules/apbdes/RekapAPBDes";
import { formatRupiah } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { APBDesVariant } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Section = "pendapatan" | "belanja" | "pembiayaan" | "rekap";

const SECTIONS: { key: Section; kode: string; label: string }[] = [
  { key: "pendapatan", kode: "4", label: "Pendapatan" },
  { key: "belanja",    kode: "5", label: "Belanja" },
  { key: "pembiayaan", kode: "6", label: "Pembiayaan" },
  { key: "rekap",      kode: "∑", label: "Rekap" },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "disahkan")
    return <Badge className="bg-teal-600 text-white text-[10px] px-1.5 py-0">Disahkan</Badge>;
  if (status === "draft")
    return <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-yellow-600 border-yellow-400">Draft</Badge>;
  return <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">Belum Ada</Badge>;
}

// ── Dialog Sahkan ─────────────────────────────────────────────

function DialogSahkan({
  open,
  variantLabel,
  initialNomor,
  initialTanggal,
  onClose,
  onSave,
}: {
  open: boolean;
  variantLabel: string;
  initialNomor?: string;
  initialTanggal?: string;
  onClose: () => void;
  onSave: (nomor: string, tanggal: string) => void;
}) {
  const [nomor, setNomor] = useState(initialNomor ?? "");
  const [tanggal, setTanggal] = useState(initialTanggal ?? "");

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Sahkan {variantLabel}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs mb-1 block">Nomor Peraturan Desa</Label>
            <Input
              value={nomor}
              onChange={(e) => setNomor(e.target.value)}
              placeholder="Contoh: 01/PERDES/2026"
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Tanggal Disahkan</Label>
            <Input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Batal</Button>
          <Button
            size="sm"
            className="bg-teal-600 hover:bg-teal-700 text-white"
            onClick={() => {
              if (!nomor || !tanggal) {
                toast.error("Nomor dan tanggal wajib diisi");
                return;
              }
              onSave(nomor, tanggal);
            }}
          >
            Sahkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export default function APBDesPage() {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const { data: meta, isLoading: metaLoading } = useAPBDesMeta();
  const [activeVariant, setActiveVariant] = useState<APBDesVariant>("awal");
  const [active, setActive] = useState<Section>("pendapatan");
  const [showBuatPAK, setShowBuatPAK] = useState(false);
  const [showSahkan, setShowSahkan] = useState(false);

  const { data, isLoading } = useAPBDes(activeVariant);
  const buatPAK = useBuatPAK();
  const saveMeta = useSaveAPBDesMeta();

  const hasPAK = meta?.statusPAK !== "belum_ada";

  if (isLoading || metaLoading) {
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
    belanja: data?.belanja
      ? Array.isArray(data.belanja)
        ? data.belanja.length
        : Object.keys(data.belanja).length
      : 0,
    pembiayaan: data?.pembiayaan.length ?? 0,
    rekap: 0,
  };

  const currentStatus =
    activeVariant === "awal" ? meta?.statusAwal : meta?.statusPAK;
  const isDisahkan = currentStatus === "disahkan";

  function handleSahkan(nomor: string, tanggal: string) {
    const patch =
      activeVariant === "awal"
        ? { statusAwal: "disahkan" as const, nomorPerdesAwal: nomor, tanggalSahAwal: tanggal }
        : { statusPAK: "disahkan" as const, nomorPerdesPAK: nomor, tanggalSahPAK: tanggal };
    saveMeta.mutate(patch, {
      onSuccess: () => {
        toast.success(`APBDes ${activeVariant.toUpperCase()} berhasil disahkan`);
        setShowSahkan(false);
      },
    });
  }

  return (
    <div className="flex flex-col -m-4" style={{ height: "calc(100svh - 56px)", maxHeight: "calc(100svh - 56px)" }}>

      {/* Top bar */}
      <div className="shrink-0 px-4 py-2.5 border-b space-y-2">

        {/* Baris 1: Judul + surplus */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold leading-tight">APBDes {tahun}</h1>
            <p className="text-xs text-muted-foreground">Anggaran Pendapatan & Belanja Desa</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              {isBalance ? "Berimbang" : isSurplus ? "Surplus" : "Defisit"}
            </p>
            <p className={cn(
              "text-sm font-bold tabular-nums",
              isBalance ? "" : isSurplus ? "text-teal-600" : "text-destructive"
            )}>
              {formatRupiah(Math.abs(surplus))}
            </p>
          </div>
        </div>

        {/* Baris 2: Tab AWAL / PAK + tombol aksi */}
        <div className="flex items-center gap-2">

          {/* Tab AWAL */}
          <button
            onClick={() => setActiveVariant("awal")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors border",
              activeVariant === "awal"
                ? "bg-teal-600 text-white border-teal-600"
                : "bg-transparent text-muted-foreground border-muted hover:bg-muted/50"
            )}
          >
            APBDes AWAL
            <StatusBadge status={meta?.statusAwal ?? "draft"} />
          </button>

          {/* Tab PAK */}
          {hasPAK ? (
            <button
              onClick={() => setActiveVariant("pak")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors border",
                activeVariant === "pak"
                  ? "bg-amber-500 text-white border-amber-500"
                  : "bg-transparent text-muted-foreground border-muted hover:bg-muted/50"
              )}
            >
              PAK
              <StatusBadge status={meta?.statusPAK ?? "draft"} />
            </button>
          ) : (
            <button
              onClick={() => setShowBuatPAK(true)}
              className="px-3 py-1.5 rounded-md text-xs font-semibold border border-dashed border-amber-400 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
            >
              + Buat PAK
            </button>
          )}

          {/* Tombol Sahkan */}
          <div className="ml-auto">
            {!isDisahkan ? (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 border-teal-500 text-teal-700 hover:bg-teal-50"
                onClick={() => setShowSahkan(true)}
              >
                Sahkan
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-7 text-muted-foreground"
                onClick={() => setShowSahkan(true)}
              >
                Edit Nomor
              </Button>
            )}
          </div>
        </div>

        {/* Info nomor perdes jika disahkan */}
        {isDisahkan && (
          <p className="text-[11px] text-muted-foreground">
            {activeVariant === "awal"
              ? `Perdes: ${meta?.nomorPerdesAwal ?? "-"} — ${meta?.tanggalSahAwal ?? "-"}`
              : `Perdes PAK: ${meta?.nomorPerdesPAK ?? "-"} — ${meta?.tanggalSahPAK ?? "-"}`
            }
          </p>
        )}
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
          {/* Banner PAK readonly jika AWAL disahkan dan kita di tab PAK */}
          {activeVariant === "pak" && (
            <div className="mb-3 px-3 py-2 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 text-xs text-amber-700">
              <strong>PAK (Perubahan APBDes)</strong> — Nilai di sini adalah anggaran setelah perubahan.
              {meta?.statusPAK === "disahkan" && " Data ini sudah disahkan dan hanya bisa diedit nomor perdesnya."}
            </div>
          )}

          {active === "pendapatan" && (
            <FormPendapatan
              items={data?.pendapatan ?? []}
              variant={activeVariant}
              readOnly={isDisahkan}
            />
          )}
          {active === "belanja" && (
            <BelanjaBidangTree
              kegiatanList={
                Array.isArray(data?.belanja)
                  ? Object.fromEntries((data.belanja as any[]).map((k) => [k.id, k]))
                  : (data?.belanja ?? {})
              }
              variant={activeVariant}
              readOnly={isDisahkan}
            />
          )}
          {active === "pembiayaan" && (
            <FormPembiayaan
              items={data?.pembiayaan ?? []}
              variant={activeVariant}
              readOnly={isDisahkan}
            />
          )}
          {active === "rekap" && data && <RekapAPBDes data={data} />}
        </div>
      </div>

      {/* Dialog Buat PAK */}
      <AlertDialog open={showBuatPAK} onOpenChange={setShowBuatPAK}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Buat PAK?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua data APBDes AWAL akan disalin ke tab PAK sebagai titik awal perubahan.
              APBDes AWAL tidak akan berubah. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => {
                buatPAK.mutate(undefined, {
                  onSuccess: () => {
                    toast.success("PAK berhasil dibuat dari data AWAL");
                    setActiveVariant("pak");
                    setShowBuatPAK(false);
                  },
                  onError: (e: any) => {
                    toast.error(e.message ?? "Gagal membuat PAK");
                    setShowBuatPAK(false);
                  },
                });
              }}
            >
              {buatPAK.isPending ? "Membuat..." : "Buat PAK"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Sahkan */}
      <DialogSahkan
        open={showSahkan}
        variantLabel={activeVariant === "awal" ? "APBDes AWAL" : "PAK"}
        initialNomor={
          activeVariant === "awal" ? meta?.nomorPerdesAwal : meta?.nomorPerdesPAK
        }
        initialTanggal={
          activeVariant === "awal" ? meta?.tanggalSahAwal : meta?.tanggalSahPAK
        }
        onClose={() => setShowSahkan(false)}
        onSave={handleSahkan}
      />
    </div>
  );
}
