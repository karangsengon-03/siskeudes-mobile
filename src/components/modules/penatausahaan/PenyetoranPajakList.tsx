// src/components/modules/penatausahaan/PenyetoranPajakList.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { usePenyetoranPajak, useDeletePenyetoranPajak } from "@/hooks/usePenyetoranPajak";
import { formatRupiah } from "@/lib/utils";
import { PenyetoranPajakItem } from "@/lib/types";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Banknote, Loader2, Receipt, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";

export function PenyetoranPajakList() {
  const { data: list = [], isLoading } = usePenyetoranPajak();
  const hapus = useDeletePenyetoranPajak();
  const [targetHapus, setTargetHapus] = useState<PenyetoranPajakItem | null>(null);

  // Hapus hanya boleh dari item terbawah
  const idTerbawah = list.length > 0 ? list[list.length - 1].id : null;

  const totalSetor = list.reduce((s, p) => s + p.jumlah, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        <Loader2 className="animate-spin mr-2 h-4 w-4" /> Memuat...
      </div>
    );
  }

  return (
    <>
      {/* Total */}
      {list.length > 0 && (
        <div className="px-4 py-3 border-b shrink-0">
          <div className="rounded-md bg-muted/40 px-3 py-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Total Sudah Disetor</span>
            <span className="text-xs font-semibold text-teal-600">{formatRupiah(totalSetor)}</span>
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground text-sm gap-2">
          <Receipt className="h-8 w-8 opacity-30" />
          <span>Belum ada penyetoran pajak</span>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="divide-y">
            {list.map((p) => (
              <div key={p.id} className="px-4 py-3 flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  <Receipt className="h-4 w-4 text-rose-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{p.nomorSetor}</span>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        {p.jenisPembayaran === "tunai"
                          ? <Wallet className="h-3 w-3" />
                          : <Banknote className="h-3 w-3" />
                        }
                        {p.jenisPembayaran === "tunai" ? "Tunai" : "Bank"}
                      </Badge>
                      {p.id === idTerbawah && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => setTargetHapus(p)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(p.tanggal), "d MMM yyyy", { locale: localeId })}
                  </p>
                  <p className="text-sm font-medium truncate">{p.uraian}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.bukuPembantuPajakIds.length} transaksi pajak disetor
                  </p>
                  <p className="text-sm font-semibold text-rose-600">{formatRupiah(p.jumlah)}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      <AlertDialog open={!!targetHapus} onOpenChange={(v) => { if (!v) setTargetHapus(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus penyetoran pajak ini?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{targetHapus?.nomorSetor}</strong> senilai{" "}
              <strong>{formatRupiah(targetHapus?.jumlah ?? 0)}</strong> akan dihapus.
              Status pajak terkait akan dikembalikan menjadi belum disetor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                await hapus.mutateAsync({
                  id: targetHapus!.id,
                  bukuPembantuPajakIds: targetHapus!.bukuPembantuPajakIds,
                });
                toast.success("Penyetoran pajak dihapus, status pajak dikembalikan");
                setTargetHapus(null);
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}