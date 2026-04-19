"use client";

import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import type { KegiatanAPBDes, SumberDana } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  kegiatanList: KegiatanAPBDes[] | { [id: string]: KegiatanAPBDes };
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

// Label sumber dana untuk dropdown filter
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

export function BelanjaBidangTree({ kegiatanList: kegiatanRaw }: Props) {
  const kegiatanAll: KegiatanAPBDes[] = Array.isArray(kegiatanRaw)
    ? kegiatanRaw
    : Object.values(kegiatanRaw ?? {});

  const [filterSumber, setFilterSumber] = useState<SumberDana | "semua">("semua");
  const [selectedBidang, setSelectedBidang] = useState<BidangGroup | null>(null);
  const [selectedSubBidang, setSelectedSubBidang] = useState<SubBidangGroup | null>(null);
  const [selectedKegiatan, setSelectedKegiatan] = useState<KegiatanAPBDes | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<KegiatanAPBDes | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<KegiatanAPBDes | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const deleteKegiatan = useDeleteKegiatan();

  // C — Filter kegiatan berdasarkan sumber dana (cek di rekeningList)
  const kegiatanList = useMemo(() => {
    if (filterSumber === "semua") return kegiatanAll;
    return kegiatanAll.filter((k) =>
      (k.rekeningList ?? []).some((r) => r.sumberDana === filterSumber)
    );
  }, [kegiatanAll, filterSumber]);

  const groups = groupByBidang(kegiatanList);
  const grandTotal = kegiatanList.reduce((acc, k) => acc + k.totalPagu, 0);
  const grandTotalAll = kegiatanAll.reduce((acc, k) => acc + k.totalPagu, 0);

  function handleFilterSumber(val: SumberDana | "semua") {
    setFilterSumber(val);
    // Reset pilihan Miller Column saat filter berubah
    setSelectedBidang(null);
    setSelectedSubBidang(null);
    setSelectedKegiatan(null);
  }

  function selectBidang(b: BidangGroup) {
    setSelectedBidang(b);
    setSelectedSubBidang(null);
    setSelectedKegiatan(null);
  }

  function selectSubBidang(sb: SubBidangGroup) {
    setSelectedSubBidang(sb);
    setSelectedKegiatan(null);
  }

  function handleHapusKegiatan(kg: KegiatanAPBDes) {
    if (kg.rekeningList && kg.rekeningList.length > 0) {
      setErrorMsg(
        `Kegiatan "${kg.namaKegiatan}" masih memiliki ${kg.rekeningList.length} rekening belanja. Hapus semua rincian rekening melalui tombol Edit terlebih dahulu sebelum menghapus kegiatan ini.`
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
      if (selectedKegiatan?.id === deleteTarget.id) setSelectedKegiatan(null);
      setDeleteTarget(null);
    } catch {
      toast.error("Gagal menghapus");
    }
  }

  const COL = "w-56 shrink-0 border-r flex flex-col h-full";
  const ITEM_BASE = "w-full text-left px-3 py-2.5 border-b flex items-center justify-between gap-2 transition-colors hover:bg-muted/50";
  const ITEM_ACTIVE = "bg-teal-50 dark:bg-teal-950/30 border-l-2 border-l-teal-600";
  const ITEM_INACTIVE = "border-l-2 border-l-transparent";

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden">

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">5. BELANJA</span>
          <Badge variant="secondary">{kegiatanAll.length} kegiatan</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-teal-600">{formatRupiah(grandTotalAll)}</span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => { setEditData(null); setFormOpen(true); }}
          >
            <Plus className="w-3.5 h-3.5" /> Tambah
          </Button>
        </div>
      </div>

      {/* C — Filter sumber dana */}
      <div className="shrink-0 px-4 py-2 border-b flex items-center gap-2">
        <span className="text-xs text-muted-foreground shrink-0">Filter:</span>
        <Select value={filterSumber} onValueChange={(v) => handleFilterSumber(v as SumberDana | "semua")}>
          <SelectTrigger className="h-8 text-xs w-64">
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
          <Badge variant="secondary" className="text-xs">
            {kegiatanList.length} kegiatan · {formatRupiah(grandTotal)}
          </Badge>
        )}
      </div>

      {/* Miller Columns */}
      <div className="flex flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full min-w-max">

          {/* Kolom 1 — Bidang */}
          <div className={COL}>
            <p className="text-xs font-semibold text-muted-foreground px-3 py-2 bg-muted/20 border-b shrink-0">
              BIDANG
            </p>
            <ScrollArea className="flex-1">
              {groups.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6 px-3">
                  {filterSumber !== "semua" ? "Tidak ada kegiatan dengan sumber dana ini" : "Belum ada data"}
                </p>
              )}
              {groups.map((b) => (
                <button
                  key={b.kode}
                  className={cn(ITEM_BASE, selectedBidang?.kode === b.kode ? ITEM_ACTIVE : ITEM_INACTIVE)}
                  onClick={() => selectBidang(b)}
                >
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs font-semibold truncate">{b.kode}. {b.nama}</p>
                    <p className="text-xs text-teal-600 tabular-nums">{formatRupiah(b.total)}</p>
                    <p className="text-xs text-muted-foreground">{b.subBidang.length} sub-bidang</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </button>
              ))}
            </ScrollArea>
          </div>

          {/* Kolom 2 — Sub-Bidang */}
          <div className={COL}>
            <p className="text-xs font-semibold text-muted-foreground px-3 py-2 bg-muted/20 border-b shrink-0">
              SUB-BIDANG
            </p>
            <ScrollArea className="flex-1">
              {!selectedBidang && (
                <p className="text-xs text-muted-foreground text-center py-6 px-3">Pilih bidang</p>
              )}
              {selectedBidang?.subBidang.map((sb) => (
                <button
                  key={sb.kode}
                  className={cn(ITEM_BASE, selectedSubBidang?.kode === sb.kode ? ITEM_ACTIVE : ITEM_INACTIVE)}
                  onClick={() => selectSubBidang(sb)}
                >
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs font-semibold truncate">{sb.kode} {sb.nama}</p>
                    <p className="text-xs text-teal-600 tabular-nums">{formatRupiah(sb.total)}</p>
                    <p className="text-xs text-muted-foreground">{sb.kegiatan.length} kegiatan</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </button>
              ))}
            </ScrollArea>
          </div>

          {/* Kolom 3 — Kegiatan */}
          <div className={COL}>
            <p className="text-xs font-semibold text-muted-foreground px-3 py-2 bg-muted/20 border-b shrink-0">
              KEGIATAN
            </p>
            <ScrollArea className="flex-1">
              {!selectedSubBidang && (
                <p className="text-xs text-muted-foreground text-center py-6 px-3">Pilih sub-bidang</p>
              )}
              {selectedSubBidang?.kegiatan.map((kg) => {
                // C — Sumber dana unik di kegiatan ini
                const sumberSet = new Set((kg.rekeningList ?? []).map((r) => r.sumberDana).filter(Boolean));
                return (
                  <button
                    key={kg.id}
                    className={cn(ITEM_BASE, selectedKegiatan?.id === kg.id ? ITEM_ACTIVE : ITEM_INACTIVE)}
                    onClick={() => setSelectedKegiatan(kg)}
                  >
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-xs font-semibold truncate">{kg.namaKegiatan}</p>
                      <p className="text-xs text-teal-600 tabular-nums">{formatRupiah(kg.totalPagu)}</p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        <Badge
                          variant={kg.status === "dikonfirmasi" ? "default" : "secondary"}
                          className="text-[10px] h-4 px-1"
                        >
                          {kg.status}
                        </Badge>
                        {Array.from(sumberSet).map((sd) => (
                          <Badge key={sd} variant="outline" className="text-[10px] h-4 px-1">
                            {sd}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  </button>
                );
              })}
            </ScrollArea>
          </div>

          {/* Kolom 4 — Detail Kegiatan */}
          <div className="w-80 shrink-0 flex flex-col h-full border-l">
            <p className="text-xs font-semibold text-muted-foreground px-3 py-2 bg-muted/20 border-b shrink-0">
              DETAIL KEGIATAN
            </p>
            <ScrollArea className="flex-1">
              {!selectedKegiatan && (
                <p className="text-xs text-muted-foreground text-center py-6 px-3">Pilih kegiatan</p>
              )}
              {selectedKegiatan && (
                <div className="p-3 space-y-3">
                  {/* Header detail */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">{selectedKegiatan.kodeKegiatan}</p>
                      <p className="text-sm font-semibold">{selectedKegiatan.namaKegiatan}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {selectedKegiatan.bidangNama} › {selectedKegiatan.subBidangNama}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        title="Edit kegiatan"
                        onClick={() => handleEditKegiatan(selectedKegiatan)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        title="Hapus kegiatan (hapus rincian dulu)"
                        onClick={() => handleHapusKegiatan(selectedKegiatan)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-3 py-2 text-xs text-blue-700 dark:text-blue-400">
                    Untuk menghapus: hapus rincian rekening melalui Edit → lalu hapus kegiatan.
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between py-2 px-3 bg-teal-50 dark:bg-teal-950/30 rounded-lg">
                    <span className="text-xs font-medium">Total Pagu</span>
                    <span className="text-sm font-bold text-teal-600 tabular-nums">
                      {formatRupiah(selectedKegiatan.totalPagu)}
                    </span>
                  </div>

                  {/* Rincian rekening */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Rincian RAB
                    </p>
                    {(selectedKegiatan.rekeningList ?? []).map((r) => (
                      <div key={r.id} className="border rounded-lg p-2.5 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">{r.kodeRekening}</p>
                            <p className="text-xs font-medium">{r.namaRekening}</p>
                            <Badge variant="outline" className="text-xs mt-0.5">{r.sumberDana}</Badge>
                          </div>
                          <span className="text-xs font-semibold text-teal-600 tabular-nums shrink-0">
                            {formatRupiah(r.totalPagu)}
                          </span>
                        </div>
                        <div className="border-t pt-1.5 space-y-1">
                          {(r.subItems ?? []).map((s) => (
                            <div key={s.id} className="flex items-center justify-between text-xs gap-2">
                              <span className="text-muted-foreground flex-1 truncate">{s.uraian}</span>
                              <span className="shrink-0 text-muted-foreground">
                                {s.volume} {s.satuan} × {formatRupiah(s.hargaSatuan)}
                              </span>
                              <span className="shrink-0 font-medium tabular-nums">
                                {formatRupiah(s.jumlah)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>

        </div>
      </div>

      {/* Form Sheet */}
      <FormKegiatan
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
              onClick={onConfirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
