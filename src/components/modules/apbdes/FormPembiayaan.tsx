"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { useSavePembiayaan, useDeletePembiayaan } from "@/hooks/useAPBDes";
import type { PembiayaanItem, SumberDana, APBDesVariant } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";

const REKENING_PEMBIAYAAN = [
  { kode: "6.1.01", nama: "SiLPA Tahun Sebelumnya", jenis: "penerimaan" as const },
  { kode: "6.1.02", nama: "Pencairan Dana Cadangan", jenis: "penerimaan" as const },
  { kode: "6.1.03", nama: "Hasil Penjualan Kekayaan Desa yang Dipisahkan", jenis: "penerimaan" as const },
  { kode: "6.2.01", nama: "Pembentukan Dana Cadangan", jenis: "pengeluaran" as const },
  { kode: "6.2.02", nama: "Penyertaan Modal Desa", jenis: "pengeluaran" as const },
];

interface FormValues {
  jenis: "penerimaan" | "pengeluaran";
  kodeRekening: string;
  namaRekening: string;
  anggaran: string;
  sumberDana: SumberDana | "";
}

interface Props {
  items: PembiayaanItem[];
  variant?: APBDesVariant;
  readOnly?: boolean;
}

export function FormPembiayaan({ items, variant = "awal", readOnly = false }: Props) {
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<PembiayaanItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedPenerimaan, setExpandedPenerimaan] = useState(true);
  const [expandedPengeluaran, setExpandedPengeluaran] = useState(true);

  const saveMutation = useSavePembiayaan(variant);
  const deleteMutation = useDeletePembiayaan(variant);

  const { register, handleSubmit, control, setValue, watch, reset } =
    useForm<FormValues>();

  const watchedJenis = watch("jenis");
  const watchedKode = watch("kodeRekening");

  const penerimaan = items.filter((i) => i.jenis === "penerimaan");
  const pengeluaran = items.filter((i) => i.jenis === "pengeluaran");
  const totalPenerimaan = penerimaan.reduce((acc, i) => acc + i.anggaran, 0);
  const totalPengeluaran = pengeluaran.reduce((acc, i) => acc + i.anggaran, 0);

  function openAdd() {
    setEditItem(null);
    reset({ jenis: "penerimaan", kodeRekening: "", namaRekening: "", anggaran: "", sumberDana: "" });
    setOpen(true);
  }

  function openEdit(item: PembiayaanItem) {
    setEditItem(item);
    reset({
      jenis: item.jenis,
      kodeRekening: item.kodeRekening,
      namaRekening: item.namaRekening,
      anggaran: String(item.anggaran),
      sumberDana: item.sumberDana ?? "",
    });
    setOpen(true);
  }

  async function onSubmit(data: FormValues) {
    try {
      await saveMutation.mutateAsync({
        id: editItem?.id,
        jenis: data.jenis,
        kodeRekening: data.kodeRekening,
        namaRekening: data.namaRekening,
        anggaran: Number(data.anggaran),
        ...(data.kodeRekening === "6.1.01" && data.sumberDana ? { sumberDana: data.sumberDana as SumberDana } : {}),
      });
      toast.success(editItem ? "Pembiayaan diperbarui" : "Pembiayaan ditambahkan");
      setOpen(false);
    } catch {
      toast.error("Gagal menyimpan");
    }
  }

  async function onDelete() {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Pembiayaan dihapus");
      setDeleteId(null);
    } catch {
      toast.error("Gagal menghapus");
    }
  }

  const rekeningOptions = REKENING_PEMBIAYAAN.filter((r) => r.jenis === watchedJenis);

  function renderGroup(
    label: string,
    groupItems: PembiayaanItem[],
    total: number,
    expanded: boolean,
    setExpanded: (v: boolean) => void
  ) {
    return (
      <div className="border-t">
        <div
          className="flex items-center justify-between px-4 py-2.5 bg-muted/20 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span className="text-sm font-medium capitalize">{label}</span>
            <Badge variant="secondary">{groupItems.length}</Badge>
          </div>
          <span className="text-sm font-semibold text-teal-600">{formatRupiah(total)}</span>
        </div>
        {expanded && (
          <div className="divide-y">
            {groupItems.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-4">Belum ada data</p>
            )}
            {groupItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between pl-8 pr-4 py-2.5 gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{item.kodeRekening}</p>
                  <p className="text-sm font-medium truncate">{item.namaRekening}</p>
                  {item.sumberDana && (
                    <Badge variant="outline" className="text-xs">{item.sumberDana}</Badge>
                  )}
                  <span className="text-sm text-teal-600 font-medium">{formatRupiah(item.anggaran)}</span>
                </div>
                {!readOnly && (
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(item)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/40">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">6. PEMBIAYAAN</span>
          <Badge variant="secondary">{items.length} pos</Badge>
        </div>
        <span className="text-sm font-semibold text-teal-600">
          {formatRupiah(totalPenerimaan - totalPengeluaran)}
        </span>
      </div>

      {renderGroup("Penerimaan Pembiayaan", penerimaan, totalPenerimaan, expandedPenerimaan, setExpandedPenerimaan)}
      {renderGroup("Pengeluaran Pembiayaan", pengeluaran, totalPengeluaran, expandedPengeluaran, setExpandedPengeluaran)}

      {!readOnly && (
        <div className="border-t px-4 py-3">
          <Button size="sm" variant="outline" className="w-full gap-1" onClick={openAdd}>
            <Plus className="w-4 h-4" /> Tambah Pembiayaan
          </Button>
        </div>
      )}

      {/* Dialog Form */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Pembiayaan" : "Tambah Pembiayaan"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Jenis</Label>
              <Controller
                control={control}
                name="jenis"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v: "penerimaan" | "pengeluaran") => {
                      field.onChange(v);
                      setValue("kodeRekening", "");
                      setValue("namaRekening", "");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="penerimaan">Penerimaan Pembiayaan</SelectItem>
                      <SelectItem value="pengeluaran">Pengeluaran Pembiayaan</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Kode Rekening</Label>
              <Select
                value={watchedKode}
                onValueChange={(v) => {
                  setValue("kodeRekening", v);
                  const found = REKENING_PEMBIAYAAN.find((r) => r.kode === v);
                  if (found) setValue("namaRekening", found.nama);
                }}
                disabled={!watchedJenis}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih rekening..." />
                </SelectTrigger>
                <SelectContent>
                  {rekeningOptions.map((r) => (
                    <SelectItem key={r.kode} value={r.kode}>
                      {r.kode} — {r.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Nama Rekening</Label>
              <Input {...register("namaRekening", { required: true })} placeholder="Nama rekening..." />
            </div>

            {watchedKode === "6.1.01" && (
              <div className="space-y-1.5">
                <Label>Sumber Dana SiLPA</Label>
                <Controller
                  control={control}
                  name="sumberDana"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih sumber dana..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD">Dana Desa (DD)</SelectItem>
                        <SelectItem value="ADD">Alokasi Dana Desa (ADD)</SelectItem>
                        <SelectItem value="PAD">PAD</SelectItem>
                        <SelectItem value="BHPR">BHPR</SelectItem>
                        <SelectItem value="BKP">BKP</SelectItem>
                        <SelectItem value="BKK">BKK</SelectItem>
                        <SelectItem value="LAIN">Lain-lain</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <p className="text-xs text-muted-foreground">Pilih sesuai sumber dana asal SiLPA</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Anggaran (Rp)</Label>
              <Input {...register("anggaran", { required: true, min: 1 })} type="number" min={0} placeholder="0" />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus pembiayaan ini?</AlertDialogTitle>
            <AlertDialogDescription>Data tidak bisa dikembalikan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}