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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { formatRupiah, parseDecimalId } from "@/lib/utils";

const REKENING_PEMBIAYAAN = [
  { kode: "6.1.01", nama: "SiLPA Tahun Sebelumnya",                         jenis: "penerimaan" as const },
  { kode: "6.1.02", nama: "Pencairan Dana Cadangan",                         jenis: "penerimaan" as const },
  { kode: "6.1.03", nama: "Hasil Penjualan Kekayaan Desa yang Dipisahkan",  jenis: "penerimaan" as const },
  { kode: "6.2.01", nama: "Pembentukan Dana Cadangan",                       jenis: "pengeluaran" as const },
  { kode: "6.2.02", nama: "Penyertaan Modal Desa",                           jenis: "pengeluaran" as const },
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

  const { register, handleSubmit, control, setValue, watch, reset, formState: { errors } } =
    useForm<FormValues>();

  const watchedJenis = watch("jenis");
  const watchedKode  = watch("kodeRekening");

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
        anggaran: parseDecimalId(data.anggaran),
        ...(data.kodeRekening === "6.1.01" && data.sumberDana
          ? { sumberDana: data.sumberDana as SumberDana }
          : {}),
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
    isExpanded: boolean,
    setIsExpanded: (v: boolean) => void,
    colorClass: string
  ) {
    return (
      <div className="border-t">
        <div
          className="flex items-center justify-between px-4 py-2.5 bg-muted/20 cursor-pointer select-none"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            {isExpanded
              ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
              : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            <span className="text-sm font-medium">{label}</span>
            <Badge variant="secondary">{groupItems.length}</Badge>
          </div>
          <span className={`text-sm font-semibold tabular-nums ${colorClass}`}>
            {formatRupiah(total)}
          </span>
        </div>

        {isExpanded && (
          <div className="divide-y">
            {groupItems.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-4">Belum ada data</p>
            )}
            {groupItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between pl-8 pr-4 py-2.5 gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-mono">{item.kodeRekening}</p>
                  <p className="text-sm font-medium leading-snug">{item.namaRekening}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {item.sumberDana && (
                      <Badge variant="outline" className="text-xs">{item.sumberDana}</Badge>
                    )}
                    <span className={`text-sm font-semibold tabular-nums ${colorClass}`}>
                      {formatRupiah(item.anggaran)}
                    </span>
                  </div>
                </div>
                {!readOnly && (
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" aria-label="Ubah pembiayaan" className="h-9 w-9" onClick={() => openEdit(item)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" aria-label="Hapus pembiayaan" className="h-9 w-9 text-destructive" onClick={() => setDeleteId(item.id)}>
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
        <span className="text-sm font-semibold text-primary tabular-nums">
          {formatRupiah(totalPenerimaan - totalPengeluaran)}
        </span>
      </div>

      {renderGroup("Penerimaan Pembiayaan", penerimaan, totalPenerimaan, expandedPenerimaan, setExpandedPenerimaan, "text-primary")}
      {renderGroup("Pengeluaran Pembiayaan", pengeluaran, totalPengeluaran, expandedPengeluaran, setExpandedPengeluaran, "text-rose-500")}

      {!readOnly && (
        <div className="border-t px-4 py-3">
          <Button size="sm" variant="outline" className="w-full gap-1" onClick={openAdd}>
            <Plus className="w-4 h-4" /> Tambah Pembiayaan
          </Button>
        </div>
      )}

      {/* Sheet Form — konsisten dengan semua form lain */}
      <Sheet open={open} onOpenChange={(v) => { if (!v) setOpen(false); }}>
        <SheetContent
          side="bottom"
          className="h-[92dvh] flex flex-col p-0 overflow-hidden"
          style={{ maxHeight: "92dvh" }}
        >
          <SheetHeader className="px-4 pt-4 pb-3 shrink-0 border-b">
            <SheetTitle>{editItem ? "Edit Pembiayaan" : "Tambah Pembiayaan"}</SheetTitle>
          </SheetHeader>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

              {/* Jenis */}
              <div className="space-y-1.5">
                <Label>Jenis Pembiayaan</Label>
                <Controller
                  control={control}
                  name="jenis"
                  defaultValue="penerimaan"
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
                      <SelectContent position="popper">
                        <SelectItem value="penerimaan">Penerimaan Pembiayaan</SelectItem>
                        <SelectItem value="pengeluaran">Pengeluaran Pembiayaan</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Kode Rekening */}
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
                  <SelectContent position="popper">
                    {rekeningOptions.map((r) => (
                      <SelectItem key={r.kode} value={r.kode} className="text-xs">
                        {r.kode} — {r.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Nama Rekening */}
              <div className="space-y-1.5">
                <Label>Nama Rekening</Label>
                <Input
                  {...register("namaRekening", { required: true })}
                  placeholder="Nama rekening..."
                />
                {errors.namaRekening && (
                  <p className="text-xs text-destructive">Nama rekening wajib diisi</p>
                )}
              </div>

              {/* Sumber Dana SiLPA (hanya untuk 6.1.01) */}
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
                        <SelectContent position="popper">
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

              {/* Anggaran */}
              <div className="space-y-1.5">
                <Label>Anggaran (Rp)</Label>
                <Input
                  {...register("anggaran", { required: true, min: 0 })}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="0"
                />
                {errors.anggaran && (
                  <p className="text-xs text-destructive">Anggaran wajib diisi</p>
                )}
              </div>
            </div>

            {/* Footer tombol */}
            <div className="shrink-0 border-t px-4 py-3 flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" className="flex-1" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Confirm Delete */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus pembiayaan ini?</AlertDialogTitle>
            <AlertDialogDescription>Data tidak bisa dikembalikan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
