// src/components/modules/penatausahaan/FormPenerimaan.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAddPenerimaan } from "@/hooks/usePenerimaan";
import { formatRupiah, parseDecimalId } from "@/lib/utils";
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

  const bisaSubmit = uraian.trim() !== "" && parseDecimalId(jumlah) > 0;

  async function handleKonfirmasi() {
    setKonfirmOpen(false);
    try {
      await addPenerimaan.mutateAsync({
        tanggal,
        jenisPenerimaan: jenis,
        sumberDana,
        uraian,
        jumlah: parseDecimalId(jumlah),
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
      <Sheet open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
        <SheetContent side="bottom" className="h-[92dvh] flex flex-col p-0 overflow-hidden" style={{ maxHeight: "92dvh" }}>
          <SheetHeader className="px-4 pt-4 pb-3 shrink-0 border-b">
            <SheetTitle>Tambah Penerimaan</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* Jenis */}
            <div className="space-y-1">
              <Label className="text-xs">Jenis Penerimaan</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["tunai", "bank"] as JenisPenerimaan[]).map((j) => (
                  <button
                    key={j}
                    type="button"
                    onClick={() => setJenis(j)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-colors ${jenis === j ? "border-primary bg-primary/5 dark:bg-primary/10" : "border-border hover:bg-muted/50"}`}
                  >
                    {j === "tunai"
                      ? <Wallet className={`h-6 w-6 ${jenis === j ? "text-primary" : "text-muted-foreground"}`} />
                      : <Banknote className={`h-6 w-6 ${jenis === j ? "text-primary" : "text-muted-foreground"}`} />
                    }
                    <span className={`text-xs font-semibold ${jenis === j ? "text-primary dark:text-primary" : ""}`}>
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
              {parseDecimalId(jumlah) > 0 && <p className="text-xs text-primary font-medium">{formatRupiah(parseDecimalId(jumlah))}</p>}
            </div>

          </div>

          {/* Footer tombol */}
          <div className="shrink-0 border-t px-4 py-3 flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => { reset(); onClose(); }}>Batal</Button>
            <Button type="button" className="flex-1" disabled={!bisaSubmit || addPenerimaan.isPending} onClick={() => setKonfirmOpen(true)}>
              Simpan
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={konfirmOpen} onOpenChange={setKonfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Penerimaan</AlertDialogTitle>
            <AlertDialogDescription>
              Simpan penerimaan <strong>{jenis === "tunai" ? "Kas Tunai" : "Bank"}</strong> — {uraian} senilai <strong>{formatRupiah(parseDecimalId(jumlah))}</strong>? Data akan otomatis masuk ke BKU.
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