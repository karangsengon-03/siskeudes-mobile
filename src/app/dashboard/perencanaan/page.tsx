"use client";

// src/app/dashboard/perencanaan/page.tsx
// Modul Perencanaan — model UI mengikuti APBDes (sidebar kiri, konten kanan)

import { useState } from "react";
import { formatRupiah } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/appStore";
import {
  usePerencanaan,
  usePerencanaanMeta,
  useTambahPerencanaan,
  useUpdatePerencanaan,
  useDeletePerencanaan,
  useSetStatusPerencanaan,
} from "@/hooks/usePerencanaan";
import { BIDANG_KEGIATAN } from "@/lib/constants/bidangKegiatan";
import type { ItemPerencanaan } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Lock,
  LockOpen,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Map,
} from "lucide-react";
import { toast } from "sonner";

// ── helpers ──────────────────────────────────────────────────

function getAllKegiatan() {
  const list: {
    kodeKegiatan: string;
    namaKegiatan: string;
    kodeSubBidang: string;
    namaSubBidang: string;
    kodeBidang: string;
    namaBidang: string;
  }[] = [];
  for (const bidang of BIDANG_KEGIATAN) {
    for (const sub of bidang.subBidang) {
      for (const keg of sub.kegiatan) {
        list.push({
          kodeKegiatan: keg.kode,
          namaKegiatan: keg.uraian,
          kodeSubBidang: sub.kode,
          namaSubBidang: sub.uraian,
          kodeBidang: bidang.kode,
          namaBidang: bidang.uraian,
        });
      }
    }
  }
  return list;
}

const ALL_KEGIATAN = getAllKegiatan();

function parseCurrency(val: string): number {
  return Number(val.replace(/\./g, "").replace(/,/g, "")) || 0;
}

function formatCurrencyInput(val: string): string {
  const num = val.replace(/\D/g, "");
  return num ? Number(num).toLocaleString("id-ID") : "";
}

interface FormState {
  kegiatan: string;
  waktuPelaksanaan: string;
  outputKeluaran: string;
  nilaiPagu: string;
}

const emptyForm: FormState = {
  kegiatan: "",
  waktuPelaksanaan: "",
  outputKeluaran: "",
  nilaiPagu: "",
};

// ── Component ─────────────────────────────────────────────────

export default function PerencanaanPage() {
  const tahun = useAppStore((s: { tahunAnggaran: string }) => s.tahunAnggaran);

  const { data: items = [], isLoading: loadingItems } = usePerencanaan();
  const { data: meta, isLoading: loadingMeta } = usePerencanaanMeta();

  const tambah = useTambahPerencanaan();
  const update = useUpdatePerencanaan();
  const hapus = useDeletePerencanaan();
  const setStatus = useSetStatusPerencanaan();

  const [activeBidang, setActiveBidang] = useState<string>("semua");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<ItemPerencanaan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ItemPerencanaan | null>(null);
  const [showLockConfirm, setShowLockConfirm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const isTerkunci = meta?.statusGlobal === "terkunci";
  const loading = loadingItems || loadingMeta;

  const totalPagu = items.reduce((sum: number, i: ItemPerencanaan) => sum + i.nilaiPagu, 0);
  const totalKegiatan = items.length;

  const bidangList = BIDANG_KEGIATAN.map((b) => {
    const count = items.filter((i: ItemPerencanaan) => i.bidang === b.kode).length;
    const pagu = items
      .filter((i: ItemPerencanaan) => i.bidang === b.kode)
      .reduce((s: number, i: ItemPerencanaan) => s + i.nilaiPagu, 0);
    return { kode: b.kode, nama: b.uraian, count, pagu };
  });

  const filteredItems =
    activeBidang === "semua"
      ? items
      : items.filter((i: ItemPerencanaan) => i.bidang === activeBidang);

  const grouped = filteredItems.reduce<Record<string, ItemPerencanaan[]>>(
    (acc: Record<string, ItemPerencanaan[]>, item: ItemPerencanaan) => {
      const key = `${item.subBidang}|${item.subBidangNama}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {}
  );

  const kegiatanExisting = new Set(
    items
      .filter((i: ItemPerencanaan) => !editTarget || i.id !== editTarget.id)
      .map((i: ItemPerencanaan) => i.kegiatan)
  );

  function openTambah() {
    setEditTarget(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(item: ItemPerencanaan) {
    setEditTarget(item);
    setForm({
      kegiatan: item.kegiatan,
      waktuPelaksanaan: String(item.waktuPelaksanaan),
      outputKeluaran: item.outputKeluaran,
      nilaiPagu: item.nilaiPagu.toLocaleString("id-ID"),
    });
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!form.kegiatan) { toast.error("Pilih kegiatan terlebih dahulu"); return; }
    if (!form.nilaiPagu || parseCurrency(form.nilaiPagu) <= 0) { toast.error("Nilai pagu harus lebih dari 0"); return; }
    if (kegiatanExisting.has(form.kegiatan)) { toast.error("Kegiatan sudah ada dalam daftar perencanaan"); return; }

    const keg = ALL_KEGIATAN.find((k) => k.kodeKegiatan === form.kegiatan)!;
    const payload = {
      bidang: keg.kodeBidang,
      bidangNama: keg.namaBidang,
      subBidang: keg.kodeSubBidang,
      subBidangNama: keg.namaSubBidang,
      kegiatan: keg.kodeKegiatan,
      kegiatanNama: keg.namaKegiatan,
      waktuPelaksanaan: Number(form.waktuPelaksanaan) || Number(tahun),
      outputKeluaran: form.outputKeluaran.trim(),
      nilaiPagu: parseCurrency(form.nilaiPagu),
    };

    try {
      if (editTarget) {
        await update.mutateAsync({ id: editTarget.id, data: payload });
        toast.success("Kegiatan berhasil diperbarui");
      } else {
        await tambah.mutateAsync(payload);
        toast.success("Kegiatan berhasil ditambahkan");
      }
      setShowForm(false);
    } catch {
      toast.error("Gagal menyimpan, coba lagi");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await hapus.mutateAsync(deleteTarget.id);
      toast.success("Kegiatan dihapus");
    } catch {
      toast.error("Gagal menghapus");
    } finally {
      setDeleteTarget(null);
    }
  }

  async function handleToggleLock() {
    if (isTerkunci) {
      try {
        await setStatus.mutateAsync("draft");
        toast.success("Perencanaan dibuka");
      } catch {
        toast.error("Gagal membuka kunci");
      }
    } else {
      setShowLockConfirm(true);
    }
  }

  async function confirmLock() {
    try {
      await setStatus.mutateAsync("terkunci");
      toast.success("Perencanaan dikunci");
      setShowLockConfirm(false);
    } catch {
      toast.error("Gagal mengunci perencanaan");
    }
  }

  return (
    <div
      className="flex flex-col -m-4"
      style={{ height: "calc(100svh - 56px)", maxHeight: "calc(100svh - 56px)" }}
    >
      {/* ── Top bar ── */}
      <div className="shrink-0 px-4 py-2.5 border-b space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold leading-tight">Perencanaan {tahun}</h1>
            <p className="text-xs text-muted-foreground">Rencana Kegiatan & Pagu Anggaran</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{totalKegiatan} kegiatan</p>
            <p className="text-sm font-bold tabular-nums text-primary">
              {formatRupiah(totalPagu)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold",
            isTerkunci ? "border-amber-300 bg-amber-50 dark:bg-amber-950/20" : "border-muted"
          )}>
            {isTerkunci
              ? <><Lock className="h-3 w-3 text-amber-500" /><span className="text-amber-600">Terkunci</span></>
              : <><LockOpen className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">Draft</span></>
            }
          </div>
          <div className="ml-auto flex gap-2">
            <Button
              size="sm"
              variant={isTerkunci ? "destructive" : "outline"}
              className="text-xs h-7"
              onClick={handleToggleLock}
              disabled={setStatus.isPending || loading}
            >
              {isTerkunci
                ? <><LockOpen className="h-3 w-3 mr-1" />Buka Kunci</>
                : <><Lock className="h-3 w-3 mr-1" />Kunci</>
              }
            </Button>
            {!isTerkunci && (
              <Button size="sm" className="text-xs h-7" onClick={openTambah} disabled={loading}>
                <Plus className="h-3 w-3 mr-1" />Tambah
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Split panel ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar kiri — navigasi bidang */}
        <div className="w-44 shrink-0 border-r flex flex-col overflow-y-auto">
          {/* Semua */}
          <button
            onClick={() => setActiveBidang("semua")}
            className={cn(
              "w-full text-left px-3 py-3.5 border-b transition-colors border-l-2",
              activeBidang === "semua"
                ? "bg-primary/10 border-l-primary"
                : "hover:bg-muted/50 border-l-transparent"
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                "text-xs font-bold w-5 h-5 rounded flex items-center justify-center shrink-0",
                activeBidang === "semua" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>∑</span>
              <span className={cn("text-xs font-semibold", activeBidang === "semua" ? "text-primary" : "")}>
                Semua
              </span>
            </div>
            <p className="text-xs text-muted-foreground pl-7">{totalKegiatan} kegiatan</p>
            <p className="text-xs font-medium tabular-nums pl-7 text-primary">{formatRupiah(totalPagu)}</p>
          </button>

          {/* Per bidang */}
          {bidangList.map((b) => (
            <button
              key={b.kode}
              onClick={() => setActiveBidang(b.kode)}
              className={cn(
                "w-full text-left px-3 py-3.5 border-b transition-colors border-l-2",
                activeBidang === b.kode
                  ? "bg-primary/10 border-l-primary"
                  : "hover:bg-muted/50 border-l-transparent"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                  "text-xs font-bold w-5 h-5 rounded flex items-center justify-center shrink-0",
                  activeBidang === b.kode ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>{b.kode}</span>
                <span className={cn(
                  "text-[11px] font-semibold line-clamp-2 text-left leading-tight",
                  activeBidang === b.kode ? "text-primary" : "text-foreground"
                )}>
                  {b.nama.split(",")[0]}
                </span>
              </div>
              <p className="text-xs text-muted-foreground pl-7">{b.count} kegiatan</p>
              {b.pagu > 0 && (
                <p className="text-xs font-medium tabular-nums pl-7 text-primary">{formatRupiah(b.pagu)}</p>
              )}
            </button>
          ))}
        </div>

        {/* Konten kanan */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
            </div>
          )}

          {!loading && filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
              <Map className="h-10 w-10 opacity-30" />
              <div>
                <p className="font-medium">
                  {activeBidang === "semua" ? "Belum ada rencana kegiatan" : "Belum ada kegiatan di bidang ini"}
                </p>
                <p className="text-xs mt-1">TA {tahun}</p>
              </div>
              {!isTerkunci && (
                <Button size="sm" onClick={openTambah}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />Tambah Kegiatan
                </Button>
              )}
            </div>
          )}

          {!loading && Object.entries(grouped).map(([groupKey, groupItems]) => {
            const [, subNama] = groupKey.split("|");
            const groupTotal = groupItems.reduce((s: number, i: ItemPerencanaan) => s + i.nilaiPagu, 0);
            return (
              <div key={groupKey} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{subNama}</p>
                  <p className="text-xs font-medium text-muted-foreground tabular-nums">{formatRupiah(groupTotal)}</p>
                </div>
                {groupItems.map((item) => (
                  <div key={item.id} className="rounded-lg border bg-card p-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px] font-mono shrink-0">{item.kegiatan}</Badge>
                          {item.status === "terkunci" && (
                            <Badge variant="secondary" className="text-[10px]">
                              <Lock className="h-2.5 w-2.5 mr-1" />Terkunci
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium mt-1 leading-snug">{item.kegiatanNama}</p>
                      </div>
                      {!isTerkunci && (
                        <div className="flex gap-1 shrink-0">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(item)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(item)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t">
                      <div className="text-xs text-muted-foreground truncate pr-2">
                        {item.outputKeluaran || <span className="italic">—</span>}
                      </div>
                      <p className="text-sm font-semibold text-primary shrink-0">{formatRupiah(item.nilaiPagu)}</p>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Dialog Form Tambah/Edit ── */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Rencana Kegiatan" : "Tambah Rencana Kegiatan"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Kegiatan *</Label>
              <Select value={form.kegiatan} onValueChange={(v) => setForm((f) => ({ ...f, kegiatan: v }))}>
                <SelectTrigger className="w-full text-left h-auto min-h-10">
                  <SelectValue placeholder="Pilih kegiatan..." />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {BIDANG_KEGIATAN.map((bidang) => (
                    <div key={bidang.kode}>
                      <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                        {bidang.kode}. {bidang.uraian}
                      </div>
                      {bidang.subBidang.map((sub) =>
                        sub.kegiatan.map((keg) => {
                          const sudahAda = kegiatanExisting.has(keg.kode) && keg.kode !== editTarget?.kegiatan;
                          return (
                            <SelectItem key={keg.kode} value={keg.kode} disabled={sudahAda} className="text-xs">
                              <span className="font-mono text-muted-foreground mr-2">{keg.kode}</span>
                              {keg.uraian}
                              {sudahAda && <span className="ml-1 text-muted-foreground">(sudah ada)</span>}
                            </SelectItem>
                          );
                        })
                      )}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Output / Keluaran</Label>
              <Textarea
                placeholder="Contoh: 12 bulan, 1 paket, 100 KK..."
                value={form.outputKeluaran}
                onChange={(e) => setForm((f) => ({ ...f, outputKeluaran: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Waktu Pelaksanaan (Tahun)</Label>
              <Input
                type="number"
                placeholder={tahun}
                value={form.waktuPelaksanaan}
                onChange={(e) => setForm((f) => ({ ...f, waktuPelaksanaan: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nilai Pagu (Rp) *</Label>
              <Input
                inputMode="numeric"
                placeholder="0"
                value={form.nilaiPagu}
                onChange={(e) => setForm((f) => ({ ...f, nilaiPagu: formatCurrencyInput(e.target.value) }))}
              />
              {form.nilaiPagu && (
                <p className="text-xs text-muted-foreground">{formatRupiah(parseCurrency(form.nilaiPagu))}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
            <Button onClick={handleSubmit} disabled={tambah.isPending || update.isPending}>
              {tambah.isPending || update.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── AlertDialog Hapus ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Rencana Kegiatan?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.kegiatanNama}</strong> akan dihapus dari daftar perencanaan TA {tahun}.
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── AlertDialog Kunci ── */}
      <AlertDialog open={showLockConfirm} onOpenChange={(o) => !o && setShowLockConfirm(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Kunci Perencanaan?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Setelah dikunci, APBDes hanya dapat menginput kegiatan yang ada dalam daftar perencanaan ini.
              Anda masih bisa membuka kunci kembali jika diperlukan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLock}>
              <Lock className="h-3.5 w-3.5 mr-1.5" />Kunci Sekarang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
