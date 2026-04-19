// src/components/modules/penatausahaan/MutasiKasList.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutasiKas, useDeleteMutasiKas, useAddMutasiKas } from "@/hooks/useMutasiKas";
import { useSPP } from "@/hooks/useSPP";
import { useSaldoBank, useSaldoTunai } from "@/hooks/useBKU";
import { formatRupiah } from "@/lib/utils";
import { MutasiKasItem } from "@/lib/types";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ArrowRightLeft, Banknote, Loader2, Pencil, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";

export function MutasiKasList() {
  const { data: list = [], isLoading } = useMutasiKas();
  const { data: sppList = [] } = useSPP();
  const hapus = useDeleteMutasiKas();
  const tambah = useAddMutasiKas();
  const saldoBank = useSaldoBank();
  const saldoTunai = useSaldoTunai();

  const [targetHapus, setTargetHapus] = useState<MutasiKasItem | null>(null);
  const [targetEdit, setTargetEdit] = useState<MutasiKasItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [editTanggal, setEditTanggal] = useState("");
  const [editUraian, setEditUraian] = useState("");
  const [editJumlah, setEditJumlah] = useState("");

  // list sorted ascending by createdAt — terbawah = index terakhir
  const adaSPPDicairkan = sppList.some((s) => s.status === "dicairkan");

  function handleAksi(item: MutasiKasItem, aksi: "edit" | "hapus") {
    if (adaSPPDicairkan) {
      setErrorMsg("Tidak bisa edit/hapus Mutasi Kas karena masih ada SPP yang sudah dicairkan. Hapus SPJ → SPP terkait dulu.");
      return;
    }
    if (aksi === "hapus") {
      setTargetHapus(item);
    } else {
      setEditTanggal(item.tanggal);
      setEditUraian(item.uraian);
      setEditJumlah(String(item.jumlah));
      setTargetEdit(item);
    }
  }

  async function handleSimpanEdit() {
    if (!targetEdit) return;
    await hapus.mutateAsync(targetEdit.id);
    await tambah.mutateAsync({ tanggal: editTanggal, jenis: "bank_ke_tunai", uraian: editUraian, jumlah: parseFloat(editJumlah) });
    toast.success("Mutasi kas diperbarui");
    setTargetEdit(null);
  }

  if (isLoading) return <div className="flex items-center justify-center h-32 text-muted-foreground"><Loader2 className="animate-spin mr-2 h-4 w-4" /> Memuat...</div>;

  return (
    <>
      <div className="grid grid-cols-2 gap-2 px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2">
          <Banknote className="h-4 w-4 text-teal-600 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Saldo Bank</p>
            <p className="text-xs font-semibold text-teal-600 truncate">{formatRupiah(saldoBank)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2">
          <Wallet className="h-4 w-4 text-teal-600 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Saldo Tunai</p>
            <p className="text-xs font-semibold text-teal-600 truncate">{formatRupiah(saldoTunai)}</p>
          </div>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground text-sm gap-2">
          <ArrowRightLeft className="h-8 w-8 opacity-30" />
          <span>Belum ada mutasi kas</span>
          <p className="text-xs text-center px-6">Gunakan mutasi untuk menarik uang dari bank ke kas tunai.</p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="divide-y">
            {list.map((m) => (
              <div key={m.id} className="px-4 py-3 flex items-start gap-3">
                <div className="shrink-0 mt-0.5"><ArrowRightLeft className="h-4 w-4 text-teal-600" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{m.nomorMutasi}</span>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">Bank → Tunai</Badge>
                      <>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => handleAksi(m, "edit")}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => handleAksi(m, "hapus")}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{format(new Date(m.tanggal), "d MMM yyyy", { locale: localeId })}</p>
                  <p className="text-sm font-medium truncate">{m.uraian}</p>
                  <p className="text-sm font-semibold text-teal-600">{formatRupiah(m.jumlah)}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      <AlertDialog open={!!errorMsg} onOpenChange={(v) => !v && setErrorMsg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Tidak bisa dilakukan</AlertDialogTitle><AlertDialogDescription>{errorMsg}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogAction onClick={() => setErrorMsg(null)}>Mengerti</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!targetHapus} onOpenChange={(v) => { if (!v) setTargetHapus(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Hapus mutasi kas ini?</AlertDialogTitle><AlertDialogDescription><strong>{targetHapus?.nomorMutasi}</strong> — {targetHapus?.uraian} senilai <strong>{formatRupiah(targetHapus?.jumlah ?? 0)}</strong> akan dihapus beserta entri BKU terkait.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={async () => { await hapus.mutateAsync(targetHapus!.id); toast.success("Mutasi kas dihapus"); setTargetHapus(null); }}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!targetEdit} onOpenChange={(v) => { if (!v) setTargetEdit(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Mutasi Kas</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1"><Label className="text-xs">Tanggal</Label><Input type="date" value={editTanggal} onChange={(e) => setEditTanggal(e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Keterangan</Label><Input value={editUraian} onChange={(e) => setEditUraian(e.target.value)} /></div>
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