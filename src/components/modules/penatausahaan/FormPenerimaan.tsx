// src/components/modules/penatausahaan/FormPenerimaan.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAddPenerimaan } from "@/hooks/usePenerimaan";
import { formatRupiah } from "@/lib/utils";
import { JenisPenerimaan, SumberDana } from "@/lib/types";
import { toast } from "sonner";
import { Banknote, Wallet } from "lucide-react";

const SUMBER_DANA_LIST: SumberDana[] = ["DD", "ADD", "PAD", "BHPR", "BKP", "BKK", "LAIN"];

interface FormPenerimaanProps {
  open: boolean;
  onClose: () => void;
}

export function FormPenerimaan({ open, onClose }: FormPenerimaanProps) {
  const addPenerimaan = useAddPenerimaan();

  const [jenis, setJenis] = useState<JenisPenerimaan>("tunai");
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [sumberDana, setSumberDana] = useState<SumberDana>("DD");
  const [uraian, setUraian] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [konfirmOpen, setKonfirmOpen] = useState(false);

  function reset() {
    setJenis("tunai");
    setTanggal(new Date().toISOString().split("T")[0]);
    setSumberDana("DD");
    setUraian("");
    setJumlah("");
  }

  const bisaSubmit = uraian.trim() !== "" && parseFloat(jumlah) > 0;

  async function handleKonfirmasi() {
    setKonfirmOpen(false);
    try {
      await addPenerimaan.mutateAsync({
        tanggal,
        jenisPenerimaan: jenis,
        sumberDana,
        uraian,
        jumlah: parseFloat(jumlah),
      });
      toast.success("Penerimaan berhasil disimpan & masuk BKU");
      reset();
      onClose();
    } catch {
      toast.error("Gagal menyimpan penerimaan, coba lagi");
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Tambah Penerimaan</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Jenis */}
            <div className="space-y-1">
              <Label className="text-xs">Jenis Penerimaan</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["tunai", "bank"] as JenisPenerimaan[]).map((j) => (
                  <button
                    key={j}
                    type="button"
                    onClick={() => setJenis(j)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-colors ${jenis === j ? "border-teal-600 bg-teal-50 dark:bg-teal-950/30" : "border-border hover:bg-muted/50"}`}
                  >
                    {j === "tunai"
                      ? <Wallet className={`h-6 w-6 ${jenis === j ? "text-teal-600" : "text-muted-foreground"}`} />
                      : <Banknote className={`h-6 w-6 ${jenis === j ? "text-teal-600" : "text-muted-foreground"}`} />
                    }
                    <span className={`text-xs font-semibold ${jenis === j ? "text-teal-700 dark:text-teal-400" : ""}`}>
                      {j === "tunai" ? "Kas Tunai" : "Bank"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tanggal */}
            <div className="space-y-1">
              <Label className="text-xs">Tanggal</Label>
              <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
            </div>

            {/* Sumber Dana */}
            <div className="space-y-1">
              <Label className="text-xs">Sumber Dana</Label>
              <Select value={sumberDana} onValueChange={(v) => setSumberDana(v as SumberDana)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUMBER_DANA_LIST.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Uraian */}
            <div className="space-y-1">
              <Label className="text-xs">Uraian</Label>
              <Input placeholder="Keterangan penerimaan..." value={uraian} onChange={(e) => setUraian(e.target.value)} />
            </div>

            {/* Jumlah */}
            <div className="space-y-1">
              <Label className="text-xs">Jumlah (Rp)</Label>
              <Input type="number" min={0} placeholder="0" value={jumlah} onChange={(e) => setJumlah(e.target.value)} />
              {parseFloat(jumlah) > 0 && <p className="text-xs text-teal-600 font-medium">{formatRupiah(parseFloat(jumlah))}</p>}
            </div>

            {/* Tombol */}
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => { reset(); onClose(); }}>Batal</Button>
              <Button type="button" className="flex-1" disabled={!bisaSubmit || addPenerimaan.isPending} onClick={() => setKonfirmOpen(true)}>
                Simpan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={konfirmOpen} onOpenChange={setKonfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Penerimaan</AlertDialogTitle>
            <AlertDialogDescription>
              Simpan penerimaan <strong>{jenis === "tunai" ? "Kas Tunai" : "Bank"}</strong> — {uraian} senilai <strong>{formatRupiah(parseFloat(jumlah) || 0)}</strong>? Data akan otomatis masuk ke BKU.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleKonfirmasi}>Ya, Simpan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}