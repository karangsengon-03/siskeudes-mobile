// src/components/modules/penatausahaan/FormMutasiKas.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAddMutasiKas } from "@/hooks/useMutasiKas";
import { useSaldoBank } from "@/hooks/useBKU";
import { formatRupiah } from "@/lib/utils";
import { toast } from "sonner";
import { AlertCircle, ArrowRightLeft } from "lucide-react";

interface FormMutasiKasProps {
  open: boolean;
  onClose: () => void;
}

export function FormMutasiKas({ open, onClose }: FormMutasiKasProps) {
  const addMutasi = useAddMutasiKas();
  const saldoBank = useSaldoBank();

  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [uraian, setUraian] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [konfirmOpen, setKonfirmOpen] = useState(false);

  const jumlahNum = parseFloat(jumlah) || 0;
  const melebihiBank = jumlahNum > saldoBank;
  const bisaSubmit = uraian.trim() !== "" && jumlahNum > 0 && !melebihiBank;

  function reset() {
    setTanggal(new Date().toISOString().split("T")[0]);
    setUraian("");
    setJumlah("");
  }

  async function handleKonfirmasi() {
    setKonfirmOpen(false);
    await addMutasi.mutateAsync({ tanggal, jenis: "bank_ke_tunai", uraian, jumlah: jumlahNum });
    toast.success("Mutasi kas berhasil — bank → tunai");
    reset();
    onClose();
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Mutasi Kas — Penarikan Bank ke Tunai</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Info saldo bank */}
            <div className="rounded-md border bg-muted/30 px-3 py-2.5 flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-teal-600 shrink-0" />
              <div className="text-xs">
                <p className="text-muted-foreground">Saldo Bank Tersedia</p>
                <p className="font-semibold text-teal-600">{formatRupiah(saldoBank)}</p>
              </div>
            </div>

            <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-3 py-2 text-xs text-blue-700 dark:text-blue-400">
              Penarikan ini mencatat uang keluar dari bank dan masuk ke kas tunai bendahara.
            </div>

            {/* Tanggal */}
            <div className="space-y-1">
              <Label className="text-xs">Tanggal</Label>
              <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
            </div>

            {/* Uraian */}
            <div className="space-y-1">
              <Label className="text-xs">Keterangan</Label>
              <Input placeholder="Contoh: Penarikan uang muka kegiatan..." value={uraian} onChange={(e) => setUraian(e.target.value)} />
            </div>

            {/* Jumlah */}
            <div className="space-y-1">
              <Label className="text-xs">Jumlah (Rp)</Label>
              <Input type="number" min={0} placeholder="0" value={jumlah} onChange={(e) => setJumlah(e.target.value)} />
              {jumlahNum > 0 && (
                <p className={`text-xs font-medium ${melebihiBank ? "text-destructive" : "text-teal-600"}`}>
                  {formatRupiah(jumlahNum)}
                </p>
              )}
              {melebihiBank && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Jumlah melebihi saldo bank tersedia!
                </p>
              )}
            </div>

            {/* Tombol */}
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => { reset(); onClose(); }}>Batal</Button>
              <Button type="button" className="flex-1" disabled={!bisaSubmit || addMutasi.isPending} onClick={() => setKonfirmOpen(true)}>
                Proses Mutasi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={konfirmOpen} onOpenChange={setKonfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Mutasi Kas</AlertDialogTitle>
            <AlertDialogDescription>
              Tarik <strong>{formatRupiah(jumlahNum)}</strong> dari rekening bank ke kas tunai? Keterangan: {uraian}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleKonfirmasi}>Ya, Proses</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}