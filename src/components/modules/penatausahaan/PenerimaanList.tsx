// src/components/modules/penatausahaan/PenerimaanList.tsx
"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePenerimaan, useDeletePenerimaan, useAddPenerimaan } from "@/hooks/usePenerimaan";
import { useMutasiKas } from "@/hooks/useMutasiKas";
import { formatRupiah } from "@/lib/utils";
import { JenisPenerimaan, PenerimaanItem, SumberDana } from "@/lib/types";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Banknote, Loader2, Pencil, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";

const SUMBER_DANA_LIST: SumberDana[] = ["DD", "ADD", "PAD", "BHPR", "BKP", "BKK", "LAIN"];

export function PenerimaanList() {
  const { data: list = [], isLoading } = usePenerimaan();
  const { data: mutasiList = [] } = useMutasiKas();
  const hapus = useDeletePenerimaan();
  const tambah = useAddPenerimaan();

  const [targetHapus, setTargetHapus] = useState<PenerimaanItem | null>(null);
  const [targetEdit, setTargetEdit] = useState<PenerimaanItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit form state
  const [editJenis, setEditJenis] = useState<JenisPenerimaan>("tunai");
  const [editTanggal, setEditTanggal] = useState("");
  const [editSumber, setEditSumber] = useState<SumberDana>("DD");
  const [editUraian, setEditUraian] = useState("");
  const [editJumlah, setEditJumlah] = useState("");

  const adaMutasi = mutasiList.length > 0;

  const totalTunai = list.filter((p) => p.jenisPenerimaan === "tunai").reduce((s, p) => s + p.jumlah, 0);
  const totalBank = list.filter((p) => p.jenisPenerimaan === "bank").reduce((s, p) => s + p.jumlah, 0);

  function handleAksi(item: PenerimaanItem, aksi: "edit" | "hapus") {
    if (adaMutasi) {
      setErrorMsg("Tidak bisa edit/hapus Penerimaan karena masih ada data Mutasi Kas. Hapus semua Mutasi Kas dulu.");
      return;
    }
    if (aksi === "hapus") {
      setTargetHapus(item);
    } else {
      setEditJenis(item.jenisPenerimaan);
      setEditTanggal(item.tanggal);
      setEditSumber(item.sumberDana);
      setEditUraian(item.uraian);
      setEditJumlah(String(item.jumlah));
      setTargetEdit(item);
    }
  }

  async function handleSimpanEdit() {
    if (!targetEdit) return;
    // Hapus lama lalu tambah baru (edit = delete + add)
    await hapus.mutateAsync(targetEdit.id);
    await tambah.mutateAsync({
      tanggal: editTanggal,
      jenisPenerimaan: editJenis,
      sumberDana: editSumber,
      uraian: editUraian,
      jumlah: parseFloat(editJumlah),
    });
    toast.success("Penerimaan diperbarui");
    setTargetEdit(null);
  }

  if (isLoading) return <div className="flex items-center justify-center h-32 text-muted-foreground"><Loader2 className="animate-spin mr-2 h-4 w-4" /> Memuat...</div>;

  return (
    <>
      <div className="grid grid-cols-2 gap-2 px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2">
          <Wallet className="h-4 w-4 text-teal-600 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Kas Tunai</p>
            <p className="text-xs font-semibold text-teal-600 truncate">{formatRupiah(totalTunai)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2">
          <Banknote className="h-4 w-4 text-teal-600 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Bank</p>
            <p className="text-xs font-semibold text-teal-600 truncate">{formatRupiah(totalBank)}</p>
          </div>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground text-sm gap-2">
          <Banknote className="h-8 w-8 opacity-30" />
          <span>Belum ada penerimaan</span>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="divide-y">
            {list.map((p) => (
              <div key={p.id} className="px-4 py-3 flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  {p.jenisPenerimaan === "tunai" ? <Wallet className="h-4 w-4 text-teal-600" /> : <Banknote className="h-4 w-4 text-teal-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{p.nomorBukti}</span>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">{p.sumberDana}</Badge>
                      <>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => handleAksi(p, "edit")}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => handleAksi(p, "hapus")}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{format(new Date(p.tanggal), "d MMM yyyy", { locale: localeId })} · {p.jenisPenerimaan === "tunai" ? "Kas Tunai" : "Bank"}</p>
                  <p className="text-sm font-medium truncate">{p.uraian}</p>
                  <p className="text-sm font-semibold text-teal-600">{formatRupiah(p.jumlah)}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Dialog error urutan */}
      <AlertDialog open={!!errorMsg} onOpenChange={(v) => !v && setErrorMsg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tidak bisa dilakukan</AlertDialogTitle>
            <AlertDialogDescription>{errorMsg}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorMsg(null)}>Mengerti</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog hapus */}
      <AlertDialog open={!!targetHapus} onOpenChange={(v) => { if (!v) setTargetHapus(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus penerimaan ini?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{targetHapus?.nomorBukti}</strong> — {targetHapus?.uraian} senilai <strong>{formatRupiah(targetHapus?.jumlah ?? 0)}</strong> akan dihapus beserta entri BKU terkait.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={async () => { await hapus.mutateAsync(targetHapus!.id); toast.success("Penerimaan dihapus"); setTargetHapus(null); }}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog edit */}
      <Dialog open={!!targetEdit} onOpenChange={(v) => { if (!v) setTargetEdit(null); }}>
        <DialogContent className="max-w-md w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Penerimaan</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label className="text-xs">Jenis</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["tunai", "bank"] as JenisPenerimaan[]).map((j) => (
                  <button key={j} type="button" onClick={() => setEditJenis(j)} className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 transition-colors ${editJenis === j ? "border-teal-600 bg-teal-50 dark:bg-teal-950/30" : "border-border"}`}>
                    {j === "tunai" ? <Wallet className="h-4 w-4" /> : <Banknote className="h-4 w-4" />}
                    <span className="text-xs font-semibold">{j === "tunai" ? "Kas Tunai" : "Bank"}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Tanggal</Label><Input type="date" value={editTanggal} onChange={(e) => setEditTanggal(e.target.value)} /></div>
            <div className="space-y-1">
              <Label className="text-xs">Sumber Dana</Label>
              <Select value={editSumber} onValueChange={(v) => setEditSumber(v as SumberDana)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SUMBER_DANA_LIST.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">Uraian</Label><Input value={editUraian} onChange={(e) => setEditUraian(e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Jumlah (Rp)</Label><Input type="number" min={0} value={editJumlah} onChange={(e) => setEditJumlah(e.target.value)} /></div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setTargetEdit(null)}>Batal</Button>
              <Button className="flex-1" onClick={handleSimpanEdit} disabled={hapus.isPending || tambah.isPending}>Simpan</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}