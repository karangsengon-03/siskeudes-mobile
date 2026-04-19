// src/components/modules/penatausahaan/SPJList.tsx
"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useSPJ, useDeleteSPJ, useEditSPJ } from "@/hooks/useSPJ";
import { FormSPJ } from "./FormSPJ";
import { usePenyetoranPajak } from "@/hooks/usePenyetoranPajak";
import { formatRupiah } from "@/lib/utils";
import { SPJItem } from "@/lib/types";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ChevronDown, ChevronUp, FileCheck, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function SPJList() {
  const { data: spjList = [], isLoading } = useSPJ();
  const hapus = useDeleteSPJ();
  const edit = useEditSPJ();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [targetHapus, setTargetHapus] = useState<SPJItem | null>(null);
  const [targetEdit, setTargetEdit] = useState<SPJItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: penyetoranList = [] } = usePenyetoranPajak();
  const idTerbaru = spjList.length > 0 ? spjList[0].id : null;
  const adaPenyetoranPajak = penyetoranList.length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        <Loader2 className="animate-spin mr-2 h-4 w-4" /> Memuat SPJ...
      </div>
    );
  }

  if (spjList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground text-sm gap-2">
        <FileCheck className="h-8 w-8 opacity-30" />
        <span>Belum ada SPJ</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="divide-y">
          {spjList.map((spj) => {
            const isExpanded = expandedId === spj.id;
            const pajakArr = Object.values(spj.pajakList ?? {});

            return (
              <div key={spj.id} className="px-4 py-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-medium">{spj.nomorSPJ}</span>
                  <div className="flex items-center gap-1">
                    <Badge variant="default" className="text-xs">disahkan</Badge>
                    {spj.id === idTerbaru && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          if (adaPenyetoranPajak) { setErrorMsg("Tidak bisa edit SPJ karena masih ada Penyetoran Pajak. Hapus Penyetoran Pajak terbawah dulu."); return; }
                          setTargetEdit(spj);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (adaPenyetoranPajak) { setErrorMsg("Tidak bisa hapus SPJ karena masih ada Penyetoran Pajak. Hapus Penyetoran Pajak terbawah dulu."); return; }
                          setTargetHapus(spj);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  {format(new Date(spj.tanggal), "d MMM yyyy", { locale: localeId })}
                  {" · "}{spj.kegiatanNama}
                </p>

                <p className="text-xs text-muted-foreground">
                  Ref: <span className="font-mono">{spj.nomorSPP}</span>
                </p>

                <div className="grid grid-cols-3 gap-1 pt-1 text-xs">
                  <div className="rounded bg-muted/40 px-2 py-1.5 text-center">
                    <p className="text-muted-foreground">Nilai SPP</p>
                    <p className="font-semibold tabular-nums">{formatRupiah(spj.nilaiSPP)}</p>
                  </div>
                  <div className="rounded bg-muted/40 px-2 py-1.5 text-center">
                    <p className="text-muted-foreground">Realisasi</p>
                    <p className="font-semibold tabular-nums text-teal-600">{formatRupiah(spj.nilaiRealisasi)}</p>
                  </div>
                  <div className={`rounded px-2 py-1.5 text-center ${spj.sisaPanjar > 0 ? "bg-amber-50 dark:bg-amber-950/30" : "bg-muted/40"}`}>
                    <p className="text-muted-foreground">Sisa Panjar</p>
                    <p className={`font-semibold tabular-nums ${spj.sisaPanjar > 0 ? "text-amber-600" : ""}`}>
                      {formatRupiah(spj.sisaPanjar)}
                    </p>
                  </div>
                </div>

                {pajakArr.length > 0 && (
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs px-1 text-muted-foreground"
                      onClick={() => setExpandedId(isExpanded ? null : spj.id)}
                    >
                      {isExpanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                      {pajakArr.length} pajak · {formatRupiah(spj.totalPajak)}
                    </Button>

                    {isExpanded && (
                      <div className="rounded-md border bg-muted/20 divide-y text-xs mt-1">
                        {pajakArr.map((p) => (
                          <div key={p.id} className="flex justify-between px-3 py-1.5">
                            <span className="text-muted-foreground">{p.nama}</span>
                            <span className="font-medium text-rose-600">{formatRupiah(p.jumlahPajak)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Dialog error urutan */}
      <AlertDialog open={!!errorMsg} onOpenChange={(v) => !v && setErrorMsg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Tidak bisa dilakukan</AlertDialogTitle><AlertDialogDescription>{errorMsg}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogAction onClick={() => setErrorMsg(null)}>Mengerti</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog edit SPJ — buka FormSPJ dengan data prefill */}
      {targetEdit && (
        <FormSPJ
          open={!!targetEdit}
          onClose={() => setTargetEdit(null)}
          editItem={targetEdit}
        />
      )}

      <AlertDialog open={!!targetHapus} onOpenChange={(v) => { if (!v) setTargetHapus(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus SPJ ini?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{targetHapus?.nomorSPJ}</strong> akan dihapus beserta seluruh entri BKU dan data pajak terkait. Status SPP akan dikembalikan ke dicairkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                await hapus.mutateAsync(targetHapus!.id);
                toast.success("SPJ dihapus");
                setTargetHapus(null);
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}