"use client";

import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { FormKegiatan } from "./FormKegiatan";
import { useDeleteKegiatan } from "@/hooks/useAPBDes";
import type { KegiatanAPBDes, SumberDana, APBDesVariant } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  kegiatanList: KegiatanAPBDes[] | { [id: string]: KegiatanAPBDes };
  variant?: APBDesVariant;
  readOnly?: boolean;
}

interface BidangGroup {
  kode: string;
  nama: string;
  total: number;
  subBidang: SubBidangGroup[];
}

interface SubBidangGroup {
  kode: string;
  nama: string;
  total: number;
  kegiatan: KegiatanAPBDes[];
}

const SUMBER_DANA_OPTIONS: { value: SumberDana | "semua"; label: string }[] = [
  { value: "semua", label: "Semua Sumber Dana" },
  { value: "DD",   label: "DD — Dana Desa" },
  { value: "ADD",  label: "ADD — Alokasi Dana Desa" },
  { value: "PAD",  label: "PAD — Pendapatan Asli Daerah" },
  { value: "BHPR", label: "BHPR — Bagi Hasil Pajak/Retribusi" },
  { value: "BKP",  label: "BKP — Bantuan Keuangan Provinsi" },
  { value: "BKK",  label: "BKK — Bantuan Keuangan Kabupaten" },
  { value: "LAIN", label: "LAIN — Lainnya" },
];

function groupByBidang(list: KegiatanAPBDes[]): BidangGroup[] {
  const map = new Map<string, BidangGroup>();
  for (const k of list) {
    if (!map.has(k.bidangKode)) {
      map.set(k.bidangKode, { kode: k.bidangKode, nama: k.bidangNama, total: 0, subBidang: [] });
    }
    const bidang = map.get(k.bidangKode)!;
    let sb = bidang.subBidang.find((s) => s.kode === k.subBidangKode);
    if (!sb) {
      sb = { kode: k.subBidangKode, nama: k.subBidangNama, total: 0, kegiatan: [] };
      bidang.subBidang.push(sb);
    }
    sb.kegiatan.push(k);
    sb.total += k.totalPagu;
    bidang.total += k.totalPagu;
  }
  return Array.from(map.values()).sort((a, b) => a.kode.localeCompare(b.kode));
}

export function BelanjaBidangTree({ kegiatanList: kegiatanRaw, variant = "awal", readOnly = false }: Props) {
  const kegiatanAll: KegiatanAPBDes[] = Array.isArray(kegiatanRaw)
    ? kegiatanRaw
    : Object.values(kegiatanRaw ?? {});

  const [filterSumber, setFilterSumber] = useState<SumberDana | "semua">("semua");
  const [expandedBidang, setExpandedBidang] = useState<Set<string>>(new Set());
  const [expandedSubBidang, setExpandedSubBidang] = useState<Set<string>>(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<KegiatanAPBDes | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<KegiatanAPBDes | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const deleteKegiatan = useDeleteKegiatan(variant);

  const kegiatanList = useMemo(() => {
    if (filterSumber === "semua") return kegiatanAll;
    return kegiatanAll.filter((k) =>
      (k.rekeningList ?? []).some((r) => r.sumberDana === filterSumber)
    );
  }, [kegiatanAll, filterSumber]);

  const groups = groupByBidang(kegiatanList);
  const grandTotal = kegiatanList.reduce((acc, k) => acc + k.totalPagu, 0);
  const grandTotalAll = kegiatanAll.reduce((acc, k) => acc + k.totalPagu, 0);

  function toggleBidang(kode: string) {
    setExpandedBidang((prev) => {
      const next = new Set(prev);
      if (next.has(kode)) next.delete(kode); else next.add(kode);
      return next;
    });
  }

  function toggleSubBidang(kode: string) {
    setExpandedSubBidang((prev) => {
      const next = new Set(prev);
      if (next.has(kode)) next.delete(kode); else next.add(kode);
      return next;
    });
  }

  function handleHapusKegiatan(kg: KegiatanAPBDes) {
    if (kg.rekeningList && kg.rekeningList.length > 0) {
      setErrorMsg(
        `Kegiatan "${kg.namaKegiatan}" masih memiliki ${kg.rekeningList.length} rekening belanja. Hapus semua rincian rekening melalui tombol Edit terlebih dahulu.`
      );
      return;
    }
    setDeleteTarget(kg);
  }

  function handleEditKegiatan(kg: KegiatanAPBDes) {
    setEditData(kg);
    setFormOpen(true);
  }

  async function onConfirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteKegiatan.mutateAsync(deleteTarget.id);
      toast.success("Kegiatan dihapus");
      setDeleteTarget(null);
    } catch {
      toast.error("Gagal menghapus");
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">5. BELANJA</span>
          <Badge variant="secondary">{kegiatanAll.length} kegiatan</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-rose-500">{formatRupiah(grandTotalAll)}</span>
          {!readOnly && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={() => { setEditData(null); setFormOpen(true); }}
            >
              <Plus className="w-3.5 h-3.5" /> Tambah
            </Button>
          )}
        </div>
      </div>

      {/* Filter Sumber Dana */}
      <div className="px-4 py-2 border-b flex items-center gap-2">
        <span className="text-xs text-muted-foreground shrink-0">Filter:</span>
        <Select
          value={filterSumber}
          onValueChange={(v) => {
            setFilterSumber(v as SumberDana | "semua");
            setExpandedBidang(new Set());
            setExpandedSubBidang(new Set());
          }}
        >
          <SelectTrigger className="h-8 text-xs flex-1 min-w-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUMBER_DANA_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filterSumber !== "semua" && (
          <Badge variant="secondary" className="text-xs shrink-0">
            {kegiatanList.length} · {formatRupiah(grandTotal)}
          </Badge>
        )}
      </div>

      {/* Konten Accordion */}
      <div className="divide-y">
        {groups.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">
            {filterSumber !== "semua" ? "Tidak ada kegiatan dengan sumber dana ini" : "Belum ada data belanja"}
          </p>
        )}

        {groups.map((bidang) => {
          const bidangExpanded = expandedBidang.has(bidang.kode);
          return (
            <div key={bidang.kode}>
              {/* Baris Bidang */}
              <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors text-left"
                onClick={() => toggleBidang(bidang.kode)}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {bidangExpanded
                    ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  }
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-muted-foreground">{bidang.kode}. {bidang.nama}</p>
                    <p className="text-xs text-muted-foreground">{bidang.subBidang.length} sub-bidang · {bidang.subBidang.reduce((a, s) => a + s.kegiatan.length, 0)} kegiatan</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-rose-500 tabular-nums shrink-0 ml-2">
                  {formatRupiah(bidang.total)}
                </span>
              </button>

              {/* Sub-Bidang (hanya jika bidang expanded) */}
              {bidangExpanded && bidang.subBidang.map((sb) => {
                const sbKey = `${bidang.kode}|${sb.kode}`;
                const sbExpanded = expandedSubBidang.has(sbKey);
                return (
                  <div key={sb.kode} className="border-t bg-muted/10">
                    {/* Baris Sub-Bidang */}
                    <button
                      className="w-full flex items-center justify-between pl-8 pr-4 py-2.5 hover:bg-muted/30 transition-colors text-left"
                      onClick={() => toggleSubBidang(sbKey)}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {sbExpanded
                          ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        }
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{sb.kode} {sb.nama}</p>
                          <p className="text-xs text-muted-foreground">{sb.kegiatan.length} kegiatan</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-rose-500 tabular-nums shrink-0 ml-2">
                        {formatRupiah(sb.total)}
                      </span>
                    </button>

                    {/* Kegiatan (hanya jika sub-bidang expanded) */}
                    {sbExpanded && (
                      <div className="border-t divide-y bg-background">
                        {sb.kegiatan.map((kg) => {
                          const sumberSet = new Set((kg.rekeningList ?? []).map((r) => r.sumberDana).filter(Boolean));
                          return (
                            <div key={kg.id} className="pl-12 pr-4 py-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                    <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                                      {kg.kodeKegiatan}
                                    </Badge>
                                    <Badge
                                      variant={kg.status === "dikonfirmasi" ? "default" : "secondary"}
                                      className="text-[10px] h-4 px-1"
                                    >
                                      {kg.status}
                                    </Badge>
                                    {Array.from(sumberSet).map((sd) => (
                                      <Badge key={sd as string} variant="outline" className="text-[10px] h-4 px-1">
                                        {sd as string}
                                      </Badge>
                                    ))}
                                  </div>
                                  <p className="text-sm font-medium leading-snug">{kg.namaKegiatan}</p>
                                  <p className="text-sm font-semibold text-rose-500 tabular-nums mt-1">
                                    {formatRupiah(kg.totalPagu)}
                                  </p>
                                  {/* Rincian RAB compact */}
                                  {(kg.rekeningList ?? []).length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      {(kg.rekeningList ?? []).map((r) => (
                                        <div key={r.id} className="text-xs text-muted-foreground flex justify-between gap-2">
                                          <span className="truncate">{r.kodeRekening} {r.namaRekening}</span>
                                          <span className="shrink-0 tabular-nums">{formatRupiah(r.totalPagu)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                {!readOnly && (
                                  <div className="flex gap-1 shrink-0">
                                    <Button
                                      size="icon"
                                      aria-label="Ubah kegiatan"
                                      variant="ghost"
                                      className="h-9 w-9"
                                      onClick={() => handleEditKegiatan(kg)}
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      aria-label="Hapus kegiatan"
                                      variant="ghost"
                                      className="h-9 w-9 text-destructive"
                                      onClick={() => handleHapusKegiatan(kg)}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Form Sheet */}
      <FormKegiatan
        variant={variant}
        readOnly={readOnly}
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditData(null); }}
        editData={editData}
      />

      {/* Dialog error validasi */}
      <AlertDialog open={!!errorMsg} onOpenChange={(v) => !v && setErrorMsg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tidak bisa dihapus langsung</AlertDialogTitle>
            <AlertDialogDescription>{errorMsg}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorMsg(null)}>Mengerti</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Delete */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus kegiatan ini?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.namaKegiatan}</strong> akan dihapus permanen. Data tidak bisa dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={onConfirmDelete}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
