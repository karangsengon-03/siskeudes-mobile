"use client";

// src/app/dashboard/perencanaan/page.tsx
// Modul Perencanaan — Daftar kegiatan + Kunci/Buka Kunci

import { useState } from "react";
import { formatRupiah } from "@/lib/utils";
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
import {
  Lock,
  LockOpen,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Info,
  Map,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

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

// ── Form State ────────────────────────────────────────────────

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

  // Dialog state
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<ItemPerencanaan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ItemPerencanaan | null>(null);
  const [showLockConfirm, setShowLockConfirm] = useState(false);

  // Form state
  const [form, setForm] = useState<FormState>(emptyForm);

  const isTerkunci = meta?.statusGlobal === "terkunci";
  const loading = loadingItems || loadingMeta;

  // Total pagu
  const totalPagu = items.reduce((sum: number, i: ItemPerencanaan) => sum + i.nilaiPagu, 0);

  // Kegiatan yang sudah ada (untuk duplicate check)
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

  function openEdit(item: ItemPerencanaan) {    setEditTarget(item);
    setForm({
      kegiatan: item.kegiatan,
      waktuPelaksanaan: String(item.waktuPelaksanaan),
      outputKeluaran: item.outputKeluaran,
      nilaiPagu: item.nilaiPagu.toLocaleString("id-ID"),
    });
    setShowForm(true);
  }

  function handleKegiatanChange(kode: string) {
    setForm((f) => ({ ...f, kegiatan: kode }));
  }

  async function handleSubmit() {
    if (!form.kegiatan) {
      toast.error("Pilih kegiatan terlebih dahulu");
      return;
    }
    if (!form.nilaiPagu || parseCurrency(form.nilaiPagu) <= 0) {
      toast.error("Nilai pagu harus lebih dari 0");
      return;
    }
    if (kegiatanExisting.has(form.kegiatan)) {
      toast.error("Kegiatan sudah ada dalam daftar perencanaan");
      return;
    }

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
      // Langsung buka kunci tanpa konfirmasi
      try {
        await setStatus.mutateAsync("draft");
        toast.success("Perencanaan dibuka — APBDes dapat diubah bebas");
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
      toast.success("Perencanaan dikunci — APBDes hanya bisa input kegiatan yang ada di sini");
      setShowLockConfirm(false);
    } catch {
      toast.error("Gagal mengunci perencanaan");
    }
  }

  // Group by bidang for display
  const grouped = items.reduce<Record<string, ItemPerencanaan[]>>((acc: Record<string, ItemPerencanaan[]>, item: ItemPerencanaan) => {
    const key = `${item.bidang}|${item.bidangNama}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="p-4 space-y-4 pb-20 md:pb-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Perencanaan</h1>
          <p className="text-xs text-muted-foreground">TA {tahun}</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={isTerkunci ? "destructive" : "outline"}
            onClick={handleToggleLock}
            disabled={setStatus.isPending || loading}
          >
            {isTerkunci ? (
              <>
                <LockOpen className="h-3.5 w-3.5 mr-1.5" />
                Buka Kunci
              </>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5 mr-1.5" />
                Kunci
              </>
            )}
          </Button>
          {!isTerkunci && (
            <Button size="sm" onClick={openTambah} disabled={loading}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Tambah
            </Button>
          )}
        </div>
      </div>

      {/* Status Banner */}
      {isTerkunci && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <Lock className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
          <div>
            <p className="font-medium">Perencanaan Terkunci</p>
            <p className="mt-0.5 text-amber-700">
              APBDes hanya dapat menginput kegiatan yang terdaftar di sini.
              Nilai APBDes per kegiatan tidak boleh melebihi pagu perencanaan.
            </p>
          </div>
        </div>
      )}

      {!isTerkunci && items.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
          <p>
            Kunci perencanaan setelah selesai agar APBDes hanya bisa input kegiatan yang sudah direncanakan.
          </p>
        </div>
      )}

      {/* Summary */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Total Kegiatan</p>
            <p className="text-xl font-bold mt-1">{items.length}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Total Pagu</p>
            <p className="text-base font-bold mt-1 text-primary">
              {formatRupiah(totalPagu)}
            </p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
          <Map className="h-10 w-10 opacity-30" />
          <div>
            <p className="font-medium">Belum ada rencana kegiatan</p>
            <p className="text-xs mt-1">Tambahkan kegiatan untuk TA {tahun}</p>
          </div>
          {!isTerkunci && (
            <Button size="sm" onClick={openTambah}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Tambah Kegiatan
            </Button>
          )}
        </div>
      )}

      {/* Grouped list */}
      {!loading &&
        Object.entries(grouped).map(([groupKey, groupItems]) => {
          const [, bidangNama] = groupKey.split("|");
          const groupTotal = groupItems.reduce((s: number, i: ItemPerencanaan) => s + i.nilaiPagu, 0);
          return (
            <div key={groupKey} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {bidangNama}
                </p>
                <p className="text-xs font-medium text-muted-foreground">
                  {formatRupiah(groupTotal)}
                </p>
              </div>

              {groupItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border bg-card p-3 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                          {item.kegiatan}
                        </Badge>
                        {item.status === "terkunci" && (
                          <Badge variant="secondary" className="text-[10px]">
                            <Lock className="h-2.5 w-2.5 mr-1" />
                            Terkunci
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium mt-1 leading-snug">
                        {item.kegiatanNama}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.subBidangNama}
                      </p>
                    </div>
                    {!isTerkunci && (
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => openEdit(item)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive"
                          onClick={() => setDeleteTarget(item)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t">
                    <div className="text-xs text-muted-foreground">
                      {item.outputKeluaran || <span className="italic">—</span>}
                    </div>
                    <p className="text-sm font-semibold text-primary shrink-0 ml-2">
                      {formatRupiah(item.nilaiPagu)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          );
        })}

      {/* ── Dialog Form Tambah/Edit ── */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Edit Rencana Kegiatan" : "Tambah Rencana Kegiatan"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Kegiatan */}
            <div className="space-y-1.5">
              <Label>Kegiatan *</Label>
              <Select
                value={form.kegiatan}
                onValueChange={handleKegiatanChange}
              >
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
                          const sudahAda =
                            kegiatanExisting.has(keg.kode) &&
                            keg.kode !== editTarget?.kegiatan;
                          return (
                            <SelectItem
                              key={keg.kode}
                              value={keg.kode}
                              disabled={sudahAda}
                              className="text-xs"
                            >
                              <span className="font-mono text-muted-foreground mr-2">
                                {keg.kode}
                              </span>
                              {keg.uraian}
                              {sudahAda && (
                                <span className="ml-1 text-muted-foreground">(sudah ada)</span>
                              )}
                            </SelectItem>
                          );
                        })
                      )}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Output / Keluaran */}
            <div className="space-y-1.5">
              <Label>Output / Keluaran</Label>
              <Textarea
                placeholder="Contoh: 12 bulan, 1 paket, 100 KK..."
                value={form.outputKeluaran}
                onChange={(e) =>
                  setForm((f) => ({ ...f, outputKeluaran: e.target.value }))
                }
                rows={2}
              />
            </div>

            {/* Waktu Pelaksanaan */}
            <div className="space-y-1.5">
              <Label>Waktu Pelaksanaan (Tahun)</Label>
              <Input
                type="number"
                placeholder={tahun}
                value={form.waktuPelaksanaan}
                onChange={(e) =>
                  setForm((f) => ({ ...f, waktuPelaksanaan: e.target.value }))
                }
              />
            </div>

            {/* Nilai Pagu */}
            <div className="space-y-1.5">
              <Label>Nilai Pagu (Rp) *</Label>
              <Input
                inputMode="numeric"
                placeholder="0"
                value={form.nilaiPagu}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    nilaiPagu: formatCurrencyInput(e.target.value),
                  }))
                }
              />
              {form.nilaiPagu && (
                <p className="text-xs text-muted-foreground">
                  {formatRupiah(parseCurrency(form.nilaiPagu))}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={tambah.isPending || update.isPending}
            >
              {tambah.isPending || update.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── AlertDialog Hapus ── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Rencana Kegiatan?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.kegiatanNama}</strong> akan dihapus dari
              daftar perencanaan TA {tahun}. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── AlertDialog Kunci ── */}
      <AlertDialog
        open={showLockConfirm}
        onOpenChange={(o) => !o && setShowLockConfirm(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Kunci Perencanaan?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Setelah dikunci, APBDes hanya dapat menginput kegiatan yang ada
              dalam daftar perencanaan ini, dan nilai APBDes tidak boleh
              melebihi pagu yang ditetapkan. Anda masih bisa membuka kunci
              kembali jika diperlukan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLock}>
              <Lock className="h-3.5 w-3.5 mr-1.5" />
              Kunci Sekarang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
