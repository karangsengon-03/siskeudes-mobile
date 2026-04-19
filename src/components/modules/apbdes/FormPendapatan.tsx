"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Pencil, Trash2, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { useSavePendapatan, useDeletePendapatan } from "@/hooks/useAPBDes";
import type { PendapatanItem, SumberDana } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";

// Daftar kode rekening pendapatan (level 3)
const REKENING_PENDAPATAN = [
  { kode: "4.1.01", nama: "Pendapatan Asli Desa - Hasil Usaha" },
  { kode: "4.1.02", nama: "Pendapatan Asli Desa - Hasil Aset" },
  { kode: "4.1.03", nama: "Pendapatan Asli Desa - Swadaya, Partisipasi, dan Gotong Royong" },
  { kode: "4.1.90", nama: "Pendapatan Asli Desa - Lain-lain PAD yang Sah" },
  { kode: "4.2.01", nama: "Transfer - Dana Desa" },
  { kode: "4.2.02", nama: "Transfer - Bagian dari Hasil Pajak & Retribusi Daerah" },
  { kode: "4.2.03", nama: "Transfer - Alokasi Dana Desa" },
  { kode: "4.2.04", nama: "Transfer - Bantuan Keuangan Provinsi" },
  { kode: "4.2.05", nama: "Transfer - Bantuan Keuangan APBD Kabupaten/Kota" },
  { kode: "4.3.90", nama: "Pendapatan Lain-lain yang Sah" },
];

const SUMBER_DANA: SumberDana[] = ["DD", "ADD", "PAD", "BHPR", "BKP", "BKK", "LAIN"];

interface FormValues {
  kodeRekening: string;
  namaRekening: string;
  anggaran: string;
  sumberDana: SumberDana;
}

interface Props {
  items: PendapatanItem[];
}

export function FormPendapatan({ items }: Props) {
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<PendapatanItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const saveMutation = useSavePendapatan();
  const deleteMutation = useDeletePendapatan();

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } =
    useForm<FormValues>();

  const watchedKode = watch("kodeRekening");

  function openAdd() {
    setEditItem(null);
    reset({ kodeRekening: "", namaRekening: "", anggaran: "", sumberDana: "DD" });
    setOpen(true);
  }

  function openEdit(item: PendapatanItem) {
    setEditItem(item);
    reset({
      kodeRekening: item.kodeRekening,
      namaRekening: item.namaRekening,
      anggaran: String(item.anggaran),
      sumberDana: item.sumberDana,
    });
    setOpen(true);
  }

  function onSelectRekening(kode: string) {
    setValue("kodeRekening", kode);
    const found = REKENING_PENDAPATAN.find((r) => r.kode === kode);
    if (found) setValue("namaRekening", found.nama);
  }

  async function onSubmit(data: FormValues) {
    try {
      await saveMutation.mutateAsync({
        id: editItem?.id,
        kodeRekening: data.kodeRekening,
        namaRekening: data.namaRekening,
        anggaran: Number(data.anggaran),
        sumberDana: data.sumberDana,
      });
      toast.success(editItem ? "Pendapatan diperbarui" : "Pendapatan ditambahkan");
      setOpen(false);
    } catch {
      toast.error("Gagal menyimpan");
    }
  }

  async function onDelete() {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Pendapatan dihapus");
      setDeleteId(null);
    } catch {
      toast.error("Gagal menghapus");
    }
  }

  const total = items.reduce((acc, i) => acc + i.anggaran, 0);

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-muted/40 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span className="font-semibold text-sm">4. PENDAPATAN</span>
          <Badge variant="secondary">{items.length} pos</Badge>
        </div>
        <span className="text-sm font-semibold text-teal-600">
          {formatRupiah(total)}
        </span>
      </div>

      {expanded && (
        <div className="divide-y">
          {items.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-6">
              Belum ada data pendapatan
            </p>
          )}
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-4 py-3 gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{item.kodeRekening}</p>
                <p className="text-sm font-medium truncate">{item.namaRekening}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-xs">{item.sumberDana}</Badge>
                  <span className="text-sm text-teal-600 font-medium">
                    {formatRupiah(item.anggaran)}
                  </span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(item)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(item.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          <div className="px-4 py-3">
            <Button size="sm" variant="outline" className="w-full gap-1" onClick={openAdd}>
              <Plus className="w-4 h-4" /> Tambah Pendapatan
            </Button>
          </div>
        </div>
      )}

      {/* Dialog Form */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Pendapatan" : "Tambah Pendapatan"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Kode Rekening</Label>
              <Select value={watchedKode} onValueChange={onSelectRekening}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih rekening..." />
                </SelectTrigger>
                <SelectContent>
                  {REKENING_PENDAPATAN.map((r) => (
                    <SelectItem key={r.kode} value={r.kode}>
                      {r.kode} — {r.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.kodeRekening && (
                <p className="text-xs text-destructive">Pilih kode rekening</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Nama Rekening</Label>
              <Input
                {...register("namaRekening", { required: true })}
                placeholder="Nama rekening..."
              />
            </div>

            <div className="space-y-1.5">
              <Label>Anggaran (Rp)</Label>
              <Input
                {...register("anggaran", { required: true, min: 1 })}
                type="number"
                min={0}
                placeholder="0"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Sumber Dana</Label>
              <Select
                value={watch("sumberDana")}
                onValueChange={(v) => setValue("sumberDana", v as SumberDana)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUMBER_DANA.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus pendapatan ini?</AlertDialogTitle>
            <AlertDialogDescription>Data tidak bisa dikembalikan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}