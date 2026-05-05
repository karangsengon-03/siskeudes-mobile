// src/components/modules/penatausahaan/FormMutasiKas.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAddMutasiKas } from "@/hooks/useMutasiKas";
import { useSaldoBank, useSaldoTunai } from "@/hooks/useBKU";
import { formatRupiah } from "@/lib/utils";
import { toast } from "sonner";
import { AlertCircle, ArrowRightLeft, Banknote, Wallet } from "lucide-react";
import type { JenisMutasi } from "@/lib/types";

interface FormMutasiKasProps {
  open: boolean;
  onClose: () => void;
}

function formatCurrencyInput(val: string): string {
  const num = val.replace(/\D/g, "");
  return num ? Number(num).toLocaleString("id-ID") : "";
}
function parseCurrency(val: string): number {
  return Number(val.replace(/\./g, "").replace(/,/g, "")) || 0;
}

export function FormMutasiKas({ open, onClose }: FormMutasiKasProps) {
  const addMutasi = useAddMutasiKas();
  const saldoBank = useSaldoBank();
  const saldoTunai = useSaldoTunai();

  const [jenis, setJenis] = useState<JenisMutasi>("bank_ke_tunai");
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [uraian, setUraian] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [konfirmOpen, setKonfirmOpen] = useState(false);

  const jumlahNum = parseCurrency(jumlah);
  const saldoSumber = jenis === "bank_ke_tunai" ? saldoBank : saldoTunai;
  const melebihi = jumlahNum > saldoSumber;
  const bisaSubmit = uraian.trim() !== "" && jumlahNum > 0 && !melebihi;

  function reset() {
    setJenis("bank_ke_tunai");
    setTanggal(new Date().toISOString().split("T")[0]);
    setUraian("");
    setJumlah("");
  }

  async function handleKonfirmasi() {
    setKonfirmOpen(false);
    try {
      await addMutasi.mutateAsync({ tanggal, jenis, uraian, jumlah: jumlahNum });
      toast.success(
        jenis === "bank_ke_tunai"
          ? "Mutasi berhasil — Bank → Tunai"
          : "Mutasi berhasil — Tunai → Bank"
      );
      reset();
      onClose();
    } catch {
      toast.error("Gagal menyimpan mutasi kas, coba lagi");
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
        <DialogContent className="max-w-md w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mutasi Kas</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">

            {/* Pilihan arah mutasi */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setJenis("bank_ke_tunai"); setJumlah(""); }}
                className={`flex flex-col items-center gap-1.5 rounded-lg border-2 px-3 py-3 text-xs font-medium transition-colors ${
                  jenis === "bank_ke_tunai"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-muted hover:bg-muted/50 text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Banknote className="h-4 w-4" />
                  <ArrowRightLeft className="h-3 w-3" />
                  <Wallet className="h-4 w-4" />
                </div>
                <span>Bank → Tunai</span>
                <span className="text-[10px] font-normal opacity-70">Penarikan rekening</span>
              </button>
              <button
                type="button"
                onClick={() => { setJenis("tunai_ke_bank"); setJumlah(""); }}
                className={`flex flex-col items-center gap-1.5 rounded-lg border-2 px-3 py-3 text-xs font-medium transition-colors ${
                  jenis === "tunai_ke_bank"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-muted hover:bg-muted/50 text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Wallet className="h-4 w-4" />
                  <ArrowRightLeft className="h-3 w-3" />
                  <Banknote className="h-4 w-4" />
                </div>
                <span>Tunai → Bank</span>
                <span className="text-[10px] font-normal opacity-70">Setor ke rekening</span>
              </button>
            </div>

            {/* Info saldo sumber */}
            <div className="rounded-md border bg-muted/30 px-3 py-2.5 flex items-center gap-2">
              {jenis === "bank_ke_tunai"
                ? <Banknote className="h-4 w-4 text-teal-600 shrink-0" />
                : <Wallet className="h-4 w-4 text-teal-600 shrink-0" />
              }
              <div className="text-xs">
                <p className="text-muted-foreground">
                  {jenis === "bank_ke_tunai" ? "Saldo Bank Tersedia" : "Saldo Kas Tunai Tersedia"}
                </p>
                <p className="font-semibold text-teal-600">{formatRupiah(saldoSumber)}</p>
              </div>
            </div>

            {/* Info konteks */}
            <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-3 py-2 text-xs text-blue-700 dark:text-blue-400">
              {jenis === "bank_ke_tunai"
                ? "Uang keluar dari rekening bank masuk ke kas tunai bendahara."
                : "Uang keluar dari kas tunai bendahara masuk ke rekening desa. Contoh: setor SiLPA tunai, PAD, hasil kerjasama pihak ketiga."
              }
            </div>

            {/* Tanggal */}
            <div className="space-y-1">
              <Label className="text-xs">Tanggal</Label>
              <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
            </div>

            {/* Keterangan */}
            <div className="space-y-1">
              <Label className="text-xs">Keterangan</Label>
              <Input
                placeholder={
                  jenis === "bank_ke_tunai"
                    ? "Contoh: Penarikan uang muka kegiatan..."
                    : "Contoh: Setor SiLPA tunai ke rekening desa..."
                }
                value={uraian}
                onChange={(e) => setUraian(e.target.value)}
              />
            </div>

            {/* Jumlah */}
            <div className="space-y-1">
              <Label className="text-xs">Jumlah (Rp)</Label>
              <Input
                inputMode="numeric"
                placeholder="0"
                value={jumlah}
                onChange={(e) => setJumlah(formatCurrencyInput(e.target.value))}
              />
              {jumlahNum > 0 && (
                <p className={`text-xs font-medium ${melebihi ? "text-destructive" : "text-teal-600"}`}>
                  {formatRupiah(jumlahNum)}
                </p>
              )}
              {melebihi && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Jumlah melebihi saldo {jenis === "bank_ke_tunai" ? "bank" : "kas tunai"} tersedia!
                </p>
              )}
            </div>

            {/* Tombol */}
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => { reset(); onClose(); }}>
                Batal
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={!bisaSubmit || addMutasi.isPending}
                onClick={() => setKonfirmOpen(true)}
              >
                {addMutasi.isPending ? "Memproses..." : "Proses Mutasi"}
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
              {jenis === "bank_ke_tunai"
                ? <>Tarik <strong>{formatRupiah(jumlahNum)}</strong> dari bank ke kas tunai?</>
                : <>Setor <strong>{formatRupiah(jumlahNum)}</strong> dari kas tunai ke rekening desa?</>
              }
              {uraian && <> Keterangan: <em>{uraian}</em>.</>}
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
