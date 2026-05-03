// src/app/dashboard/pembukuan/jurnal-penyesuaian/page.tsx
"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  Plus, Trash2, Loader2, Info, TrendingUp, Heart,
} from "lucide-react";
import {
  useJurnalPenyesuaian,
  useAddJurnalSiLPA,
  useAddJurnalBPJS,
  useDeleteJurnal,
  type JurnalSiLPA,
  type JurnalBPJS,
  type SumberDanaJurnal,
  type OpsiJurnalBPJS,
} from "@/hooks/useJurnalPenyesuaian";
import { useAPBDes } from "@/hooks/useAPBDes";
import type { KegiatanAPBDes } from "@/lib/types";

const SUMBER_DANA_LIST: { value: SumberDanaJurnal; label: string }[] = [
  { value: "PAD",  label: "PAD — Pendapatan Asli Desa" },
  { value: "ADD",  label: "ADD — Alokasi Dana Desa" },
  { value: "DDS",  label: "DDS — Dana Desa" },
  { value: "PBH",  label: "PBH — Bagi Hasil Pajak" },
  { value: "PBK",  label: "PBK — Bantuan Keuangan" },
  { value: "DLL",  label: "DLL — Pendapatan Lain-lain" },
];

const BULAN_LIST = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

function formatRp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function parseCurrency(val: string): number {
  return Number(val.replace(/\./g, "").replace(/[^0-9]/g, "")) || 0;
}

function formatCurrency(val: number): string {
  return val ? val.toLocaleString("id-ID") : "";
}

function CurrencyInput({ value, onChange, id }: {
  value: string; onChange: (v: string) => void; id: string;
}) {
  return (
    <Input
      id={id}
      inputMode="numeric"
      placeholder="0"
      value={value}
      onChange={(e) => {
        const raw = e.target.value.replace(/\./g, "").replace(/[^0-9]/g, "");
        onChange(raw ? formatCurrency(Number(raw)) : "");
      }}
      className="text-right font-mono"
    />
  );
}

// ── Form SiLPA ────────────────────────────────────────────────
type SiLPAForm = {
  sumberDana: SumberDanaJurnal;
  nominal: string;
  keterangan: string;
  tanggal: string;
};

function DialogSiLPA({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mutate, isPending } = useAddJurnalSiLPA();
  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<SiLPAForm>({
    defaultValues: { sumberDana: "DDS", nominal: "", keterangan: "", tanggal: "" },
  });

  const onSubmit = (v: SiLPAForm) => {
    mutate({
      sumberDana: v.sumberDana,
      nominal: parseCurrency(v.nominal),
      keterangan: v.keterangan,
      tanggal: v.tanggal,
    }, {
      onSuccess: () => { reset(); onClose(); },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-teal-600" />
            Tambah Jurnal SiLPA
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Sumber Dana *</Label>
            <Controller
              control={control}
              name="sumberDana"
              rules={{ required: true }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUMBER_DANA_LIST.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nominal-silpa">Nominal (Rp) *</Label>
            <Controller
              control={control}
              name="nominal"
              rules={{ validate: (v) => parseCurrency(v) > 0 || "Nominal harus > 0" }}
              render={({ field }) => (
                <CurrencyInput id="nominal-silpa" value={field.value} onChange={field.onChange} />
              )}
            />
            {errors.nominal && <p className="text-xs text-red-500">{errors.nominal.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tanggal-silpa">Tanggal *</Label>
            <Input id="tanggal-silpa" type="date"
              {...register("tanggal", { required: "Tanggal wajib diisi" })} />
            {errors.tanggal && <p className="text-xs text-red-500">{errors.tanggal.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ket-silpa">Keterangan</Label>
            <Input id="ket-silpa" placeholder="SiLPA tahun sebelumnya" {...register("keterangan")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>Batal</Button>
            <Button type="submit" disabled={isPending} className="bg-teal-600 hover:bg-teal-700 text-white">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Form BPJS ─────────────────────────────────────────────────
type BPJSForm = {
  opsi: OpsiJurnalBPJS;
  bulan: string;
  posAPBDes: string;
  nominal: string;
  keterangan: string;
  tanggal: string;
};

function DialogBPJS({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mutate, isPending } = useAddJurnalBPJS();
  const { data: apbdesData } = useAPBDes();
  const kegiatanList: KegiatanAPBDes[] = apbdesData
    ? Object.values(apbdesData.belanja as Record<string, KegiatanAPBDes>)
    : [];
  const { control, register, handleSubmit, watch, reset, formState: { errors } } = useForm<BPJSForm>({
    defaultValues: { opsi: "per-bulan", bulan: "1", posAPBDes: "", nominal: "", keterangan: "", tanggal: "" },
  });

  const opsi = watch("opsi");

  const onSubmit = (v: BPJSForm) => {
    mutate({
      opsi: v.opsi,
      bulan: v.opsi === "per-bulan" ? Number(v.bulan) : undefined,
      posAPBDes: v.posAPBDes,
      nominal: parseCurrency(v.nominal),
      keterangan: v.keterangan,
      tanggal: v.tanggal,
    }, {
      onSuccess: () => { reset(); onClose(); },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-teal-600" />
            Tambah Jurnal BPJS
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Mode Pencatatan</Label>
            <Controller
              control={control}
              name="opsi"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per-bulan">Per Bulan</SelectItem>
                    <SelectItem value="per-tahun">Seluruh Tahun (Akumulasi)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {opsi === "per-bulan" && (
            <div className="space-y-1.5">
              <Label>Bulan</Label>
              <Controller
                control={control}
                name="bulan"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BULAN_LIST.map((b, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Pos APBDes (Kegiatan) *</Label>
            <Controller
              control={control}
              name="posAPBDes"
              rules={{ required: "Pilih kegiatan APBDes" }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kegiatan..." />
                  </SelectTrigger>
                  <SelectContent>
                    {kegiatanList.map((k: KegiatanAPBDes) => (
                      <SelectItem key={k.id} value={k.kodeKegiatan ?? k.id}>
                        <span className="font-mono text-xs mr-2">{k.kodeKegiatan}</span>
                        {k.namaKegiatan}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.posAPBDes && <p className="text-xs text-red-500">{errors.posAPBDes.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nominal-bpjs">Nominal BPJS 1% (Rp) *</Label>
            <Controller
              control={control}
              name="nominal"
              rules={{ validate: (v) => parseCurrency(v) > 0 || "Nominal harus > 0" }}
              render={({ field }) => (
                <CurrencyInput id="nominal-bpjs" value={field.value} onChange={field.onChange} />
              )}
            />
            {errors.nominal && <p className="text-xs text-red-500">{errors.nominal.message}</p>}
            <p className="text-xs text-muted-foreground">
              Contoh: Siltap Rp 3.000.000 → BPJS 1% = Rp 30.000
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tanggal-bpjs">Tanggal *</Label>
            <Input id="tanggal-bpjs" type="date"
              {...register("tanggal", { required: "Tanggal wajib diisi" })} />
            {errors.tanggal && <p className="text-xs text-red-500">{errors.tanggal.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ket-bpjs">Keterangan</Label>
            <Input id="ket-bpjs" placeholder="BPJS Kesehatan 1% Siltap" {...register("keterangan")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>Batal</Button>
            <Button type="submit" disabled={isPending} className="bg-teal-600 hover:bg-teal-700 text-white">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Halaman Utama ─────────────────────────────────────────────
export default function JurnalPenyesuaianPage() {
  const { data: list = [], isLoading } = useJurnalPenyesuaian();
  const { mutate: deleteJurnal } = useDeleteJurnal();
  const [dialogSiLPA, setDialogSiLPA] = useState(false);
  const [dialogBPJS, setDialogBPJS] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const jurnalSiLPA = list.filter((j): j is JurnalSiLPA => j.jenis === "silpa");
  const jurnalBPJS  = list.filter((j): j is JurnalBPJS  => j.jenis === "bpjs");

  const totalSiLPA  = jurnalSiLPA.reduce((s, j) => s + j.nominal, 0);
  const totalBPJS   = jurnalBPJS.reduce((s, j) => s + j.nominal, 0);

  return (
    <div className="space-y-5 pb-24">
      {/* Info */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <p>
          Jurnal penyesuaian mencatat transaksi yang tidak bisa masuk melalui alur SPP/SPJ
          biasa — seperti pengakuan SiLPA tahun lalu dan setoran BPJS 1% dari Siltap.
        </p>
      </div>

      <Tabs defaultValue="silpa">
        <TabsList className="w-full">
          <TabsTrigger value="silpa" className="flex-1">
            SiLPA Tahun Lalu
            {jurnalSiLPA.length > 0 && (
              <Badge variant="secondary" className="ml-2">{jurnalSiLPA.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="bpjs" className="flex-1">
            BPJS Kesehatan
            {jurnalBPJS.length > 0 && (
              <Badge variant="secondary" className="ml-2">{jurnalBPJS.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Tab SiLPA ── */}
        <TabsContent value="silpa" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Total SiLPA Diakui</p>
              <p className="text-lg font-bold font-mono text-teal-700">{formatRp(totalSiLPA)}</p>
            </div>
            <Button
              onClick={() => setDialogSiLPA(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
            >
              <Plus className="h-4 w-4" /> Tambah
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : jurnalSiLPA.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              Belum ada jurnal SiLPA. Tambahkan jika ada SiLPA dari tahun sebelumnya.
            </div>
          ) : (
            <div className="space-y-2">
              {jurnalSiLPA.map((j) => (
                <Card key={j.id}>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="font-mono text-xs">{j.sumberDana}</Badge>
                          <span className="text-xs text-muted-foreground">{j.tanggal}</span>
                        </div>
                        <p className="font-semibold font-mono mt-1">{formatRp(j.nominal)}</p>
                        {j.keterangan && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{j.keterangan}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                        onClick={() => setDeleteId(j.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Tab BPJS ── */}
        <TabsContent value="bpjs" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Total BPJS Diakui</p>
              <p className="text-lg font-bold font-mono text-teal-700">{formatRp(totalBPJS)}</p>
            </div>
            <Button
              onClick={() => setDialogBPJS(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
            >
              <Plus className="h-4 w-4" /> Tambah
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : jurnalBPJS.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              Belum ada jurnal BPJS. Tambahkan jika ada setoran BPJS 1% dari Siltap.
            </div>
          ) : (
            <div className="space-y-2">
              {jurnalBPJS.map((j) => (
                <Card key={j.id}>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {j.opsi === "per-bulan" && j.bulan
                              ? BULAN_LIST[j.bulan - 1]
                              : "Akumulasi Tahunan"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{j.tanggal}</span>
                        </div>
                        <p className="font-semibold font-mono mt-1">{formatRp(j.nominal)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Pos: <span className="font-mono">{j.posAPBDes}</span>
                          {j.keterangan && ` — ${j.keterangan}`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                        onClick={() => setDeleteId(j.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <DialogSiLPA open={dialogSiLPA} onClose={() => setDialogSiLPA(false)} />
      <DialogBPJS open={dialogBPJS} onClose={() => setDialogBPJS(false)} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus jurnal ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Data yang sudah dihapus tidak bisa dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => { if (deleteId) { deleteJurnal(deleteId); setDeleteId(null); } }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
