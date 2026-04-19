// src/components/modules/penatausahaan/FormPenyetoranPajak.tsx
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAddPenyetoranPajak } from "@/hooks/usePenyetoranPajak";
import { useBukuPajak } from "@/hooks/useBukuPembantu";
import { useSaldoTunai, useSaldoBank } from "@/hooks/useBKU";
import { formatRupiah } from "@/lib/utils";
import { JenisPembayaranPajak } from "@/lib/types";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { AlertCircle, Banknote, Wallet } from "lucide-react";

interface FormPenyetoranPajakProps {
  open: boolean;
  onClose: () => void;
}

export function FormPenyetoranPajak({ open, onClose }: FormPenyetoranPajakProps) {
  const addSetor = useAddPenyetoranPajak();
  const { data: pajakItems = [] } = useBukuPajak();
  const saldoTunai = useSaldoTunai();
  const saldoBank = useSaldoBank();

  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [jenisPembayaran, setJenisPembayaran] = useState<JenisPembayaranPajak>("tunai");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [konfirmOpen, setKonfirmOpen] = useState(false);

  // Hanya pajak yang belum disetor
  const belumDisetor = pajakItems.filter((p) => !p.sudahDisetor);

  // Group belum disetor by kodePajak untuk memudahkan pemilihan
  const grouped = useMemo(() => {
    const map: Record<string, typeof belumDisetor> = {};
    for (const item of belumDisetor) {
      if (!map[item.kodePajak]) map[item.kodePajak] = [];
      map[item.kodePajak].push(item);
    }
    return map;
  }, [belumDisetor]);

  const selectedItems = belumDisetor.filter((p) => selectedIds.includes(p.id));
  const totalSetor = selectedItems.reduce((s, p) => s + p.jumlah, 0);

  const saldoTersedia = jenisPembayaran === "tunai" ? saldoTunai : saldoBank;
  const melebihiSaldo = totalSetor > saldoTersedia;
  const bisaSubmit = selectedIds.length > 0 && totalSetor > 0 && !melebihiSaldo;

  function toggleItem(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleGroup(ids: string[]) {
    const allSelected = ids.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...ids])]);
    }
  }

  function reset() {
    setTanggal(new Date().toISOString().split("T")[0]);
    setJenisPembayaran("tunai");
    setSelectedIds([]);
  }

  async function handleKonfirmasi() {
    if (selectedItems.length === 0) return;
    setKonfirmOpen(false);

    // Buat satu transaksi per jenis pajak yang dipilih, atau gabung semua
    // Kita gabung semua yang dipilih dalam satu nomor setor
    const kodePajakList = [...new Set(selectedItems.map((p) => p.kodePajak))];
    const namaGabung = kodePajakList.join(", ");

    // Hitung total per jenis pajak untuk BKU terpisah
    const perKodePajak = kodePajakList.map((kode) => {
      const items = selectedItems.filter((p) => p.kodePajak === kode);
      return {
        kodePajak: kode,
        namaPajak: items[0]?.namaPajak ?? kode,
        jumlah: items.reduce((s, p) => s + p.jumlah, 0),
      };
    });

    await addSetor.mutateAsync({
      tanggal,
      kodePajak: kodePajakList[0],
      namaPajak: namaGabung,
      jumlah: totalSetor,
      jenisPembayaran,
      uraian: `Penyetoran pajak ${namaGabung}`,
      bukuPembantuPajakIds: selectedIds,
      perKodePajak,
    } as any);

    toast.success("Penyetoran pajak berhasil dicatat");
    reset();
    onClose();
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
        <DialogContent className="w-full max-w-md max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 py-3 border-b shrink-0">
            <DialogTitle>Penyetoran Pajak</DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-0 overflow-y-auto">
            <div className="p-4 space-y-4">

              {/* Jenis Pembayaran */}
              <div className="space-y-1">
                <Label className="text-xs">Bayar Via</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["tunai", "bank"] as JenisPembayaranPajak[]).map((j) => (
                    <button
                      key={j}
                      type="button"
                      onClick={() => setJenisPembayaran(j)}
                      className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-colors ${jenisPembayaran === j ? "border-teal-600 bg-teal-50 dark:bg-teal-950/30" : "border-border hover:bg-muted/50"}`}
                    >
                      {j === "tunai"
                        ? <Wallet className={`h-5 w-5 ${jenisPembayaran === j ? "text-teal-600" : "text-muted-foreground"}`} />
                        : <Banknote className={`h-5 w-5 ${jenisPembayaran === j ? "text-teal-600" : "text-muted-foreground"}`} />
                      }
                      <span className={`text-xs font-semibold ${jenisPembayaran === j ? "text-teal-700 dark:text-teal-400" : ""}`}>
                        {j === "tunai" ? "Kas Tunai" : "Bank"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatRupiah(j === "tunai" ? saldoTunai : saldoBank)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tanggal */}
              <div className="space-y-1">
                <Label className="text-xs">Tanggal Setor</Label>
                <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
              </div>

              {/* Pilih pajak yang akan disetor */}
              <div className="space-y-2">
                <Label className="text-xs">Pilih Pajak yang Akan Disetor</Label>
                {belumDisetor.length === 0 ? (
                  <div className="rounded-md border px-3 py-4 text-xs text-muted-foreground text-center">
                    Semua pajak sudah disetor
                  </div>
                ) : (
                  Object.entries(grouped).map(([kodePajak, items]) => {
                    const groupIds = items.map((i) => i.id);
                    const allSelected = groupIds.every((id) => selectedIds.includes(id));
                    const totalGrup = items.reduce((s, i) => s + i.jumlah, 0);
                    return (
                      <div key={kodePajak} className="rounded-md border overflow-hidden">
                        {/* Header grup */}
                        <button
                          type="button"
                          onClick={() => toggleGroup(groupIds)}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors ${allSelected ? "bg-teal-50 dark:bg-teal-950/30 text-teal-700" : "bg-muted/40 hover:bg-muted/70"}`}
                        >
                          <span>{kodePajak} — {items[0].namaPajak}</span>
                          <div className="flex items-center gap-2">
                            <span>{formatRupiah(totalGrup)}</span>
                            <Badge variant={allSelected ? "default" : "outline"} className="text-[10px]">
                              {groupIds.filter((id) => selectedIds.includes(id)).length}/{items.length}
                            </Badge>
                          </div>
                        </button>
                        {/* Detail per transaksi */}
                        <div className="divide-y">
                          {items.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => toggleItem(item.id)}
                              className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${selectedIds.includes(item.id) ? "bg-teal-50/50 dark:bg-teal-950/20" : "hover:bg-muted/30"}`}
                            >
                              <div className="text-left">
                                <p className="font-mono text-muted-foreground">{item.nomorSPJ}</p>
                                <p className="text-muted-foreground">{format(new Date(item.tanggal), "d MMM yyyy", { locale: localeId })}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{formatRupiah(item.jumlah)}</span>
                                <div className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 ${selectedIds.includes(item.id) ? "bg-teal-600 border-teal-600" : "border-muted-foreground"}`}>
                                  {selectedIds.includes(item.id) && <span className="text-white text-[10px]">✓</span>}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Total */}
              {totalSetor > 0 && (
                <div className="rounded-md border px-3 py-2.5 space-y-1">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Total Setor</span>
                    <span className="text-teal-600">{formatRupiah(totalSetor)}</span>
                  </div>
                  {melebihiSaldo && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Melebihi saldo {jenisPembayaran === "tunai" ? "tunai" : "bank"} tersedia!
                    </p>
                  )}
                </div>
              )}

              {/* Tombol */}
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => { reset(); onClose(); }}>
                  Batal
                </Button>
                <Button type="button" className="flex-1" disabled={!bisaSubmit || addSetor.isPending} onClick={() => setKonfirmOpen(true)}>
                  Setor Pajak
                </Button>
              </div>

            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={konfirmOpen} onOpenChange={setKonfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Penyetoran Pajak</AlertDialogTitle>
            <AlertDialogDescription>
              Setor pajak senilai <strong>{formatRupiah(totalSetor)}</strong> via{" "}
              <strong>{jenisPembayaran === "tunai" ? "kas tunai" : "bank"}</strong>?
              {selectedIds.length} transaksi pajak akan ditandai sudah disetor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleKonfirmasi}>Ya, Setor</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}