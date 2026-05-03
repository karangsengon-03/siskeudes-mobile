// src/components/modules/penatausahaan/SPPList.tsx
"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSPP, useCairkanSPP, useDeleteSPP, useUncairkanSPP } from "@/hooks/useSPP";
import { useSPJ } from "@/hooks/useSPJ";
import { useSaldoBank, useSaldoTunai } from "@/hooks/useBKU";
import { useDataDesa } from "@/hooks/useMaster";
import { FormSPP } from "./FormSPP";
import { formatRupiah } from "@/lib/utils";
import { SPPItem } from "@/lib/types";
import { useAppStore } from "@/store/appStore";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Banknote, ChevronDown, ChevronUp, Loader2, Pencil, Trash2, Wallet,
  Printer, FileText, Receipt, ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import {
  downloadPDF_SPP1,
  downloadPDF_SPP2Panjar,
  downloadPDF_SPP2Definitif,
  downloadPDF_CAIR,
  downloadPDF_KWTSemua,
  downloadPDF_SPTB,
} from "@/lib/generatePDF";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  draft: "outline",
  dikonfirmasi: "secondary",
  dicairkan: "default",
};

export function SPPList() {
  const { data: sppList = [], isLoading } = useSPP();
  const { data: spjList = [] } = useSPJ();
  const cairkan = useCairkanSPP();
  const hapus = useDeleteSPP();
  const uncairkan = useUncairkanSPP();
  const saldoBank = useSaldoBank();
  const saldoTunai = useSaldoTunai();
  const { data: dataDesa } = useDataDesa();
  const tahun = useAppStore((s) => s.tahunAnggaran);

  const [targetCairkan, setTargetCairkan] = useState<SPPItem | null>(null);
  const [targetHapus, setTargetHapus] = useState<SPPItem | null>(null);
  const [targetEdit, setTargetEdit] = useState<SPPItem | null>(null);
  const [revertFor, setRevertFor] = useState<{ spp: SPPItem; aksi: "edit" | "hapus" } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cetakMenuId, setCetakMenuId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  const adaSPJ = spjList.length > 0;

  function handleClickCairkan(spp: SPPItem) {
    const media = spp.mediaPembayaran ?? "bank";
    if (media === "bank" && saldoBank < spp.totalJumlah) {
      setErrorMsg(
        `Saldo Bank tidak cukup.\nSaldo Bank saat ini: ${formatRupiah(saldoBank)}\nDibutuhkan: ${formatRupiah(spp.totalJumlah)}\n\nUbah Media Pembayaran ke "Kas Tunai" jika pembayaran dilakukan secara tunai.`
      );
      return;
    }
    if (media === "tunai" && saldoTunai < spp.totalJumlah) {
      setErrorMsg(
        `Saldo Tunai tidak cukup.\nSaldo Tunai saat ini: ${formatRupiah(saldoTunai)}\nDibutuhkan: ${formatRupiah(spp.totalJumlah)}\n\nUbah Media Pembayaran ke "Transfer Bank" atau lakukan Mutasi Kas terlebih dahulu.`
      );
      return;
    }
    setTargetCairkan(spp);
  }

  function handleClickEdit(spp: SPPItem) {
    if (spp.status === "dicairkan") {
      if (adaSPJ) {
        setErrorMsg("Tidak bisa edit SPP yang sudah dicairkan karena masih ada SPJ. Hapus SPJ terkait terlebih dahulu.");
        return;
      }
      setRevertFor({ spp, aksi: "edit" });
      return;
    }
    if (adaSPJ) {
      setErrorMsg("Tidak bisa edit SPP karena masih ada SPJ. Hapus SPJ terbawah dulu.");
      return;
    }
    setTargetEdit(spp);
  }

  function handleClickHapus(spp: SPPItem) {
    if (spp.status === "dicairkan") {
      if (adaSPJ) {
        setErrorMsg("Tidak bisa hapus SPP yang sudah dicairkan karena masih ada SPJ. Hapus SPJ terkait terlebih dahulu.");
        return;
      }
      setRevertFor({ spp, aksi: "hapus" });
      return;
    }
    if (adaSPJ) {
      setErrorMsg("Tidak bisa hapus SPP karena masih ada SPJ. Hapus SPJ terbawah dulu.");
      return;
    }
    setTargetHapus(spp);
  }

  async function handleCairkan() {
    if (!targetCairkan) return;
    await cairkan.mutateAsync(targetCairkan);
    toast.success(`${targetCairkan.nomorSPP} dicairkan & masuk BKU`);
    setTargetCairkan(null);
  }

  async function handleHapus() {
    if (!targetHapus) return;
    await hapus.mutateAsync(targetHapus.id);
    toast.success(`${targetHapus.nomorSPP} dihapus`);
    setTargetHapus(null);
  }

  async function handleKonfirmasiRevert() {
    if (!revertFor) return;
    const { spp, aksi } = revertFor;
    setRevertFor(null);
    await uncairkan.mutateAsync(spp.id);
    toast.success(`${spp.nomorSPP} dikembalikan ke status Dikonfirmasi. Baris BKU terkait dihapus.`);
    if (aksi === "edit") setTargetEdit(spp);
    else setTargetHapus(spp);
  }

  async function handleCetak(spp: SPPItem, jenis: string) {
    setCetakMenuId(null);
    setPrinting(true);
    try {
      const base = { dataDesa, tahun, spp };
      if (jenis === "spp1") await downloadPDF_SPP1(base);
      else if (jenis === "spp2panjar") await downloadPDF_SPP2Panjar(base);
      else if (jenis === "spp2definitif") await downloadPDF_SPP2Definitif(base);
      else if (jenis === "cair") await downloadPDF_CAIR(base);
      else if (jenis === "kwt") await downloadPDF_KWTSemua(base);
      else if (jenis === "sptb") await downloadPDF_SPTB(base);
    } catch {
      toast.error("Gagal mencetak dokumen");
    } finally {
      setPrinting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        <Loader2 className="animate-spin mr-2 h-4 w-4" /> Memuat SPP...
      </div>
    );
  }

  if (sppList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm gap-2">
        <Banknote className="h-8 w-8 opacity-30" />
        <span>Belum ada SPP</span>
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="h-full">
        <div className="divide-y">
          {sppList.map((spp) => {
            const isExpanded = expandedId === spp.id;
            const isCetakOpen = cetakMenuId === spp.id;
            const rincianArr = Object.values(spp.rincianSPP);
            const media = spp.mediaPembayaran ?? "bank";
            const isPanjar = spp.jenis === "Panjar";
            const isDefinitifOrPembiayaan = spp.jenis === "Definitif" || spp.jenis === "Pembiayaan";
            const sudahCair = spp.status === "dicairkan";

            return (
              <div key={spp.id} className="px-4 py-3 space-y-1">
                {/* Baris 1: nomor SPP + badge status */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-medium">{spp.nomorSPP}</span>
                  <div className="flex gap-1 items-center">
                    <Badge variant="outline" className="text-xs gap-1">
                      {media === "bank"
                        ? <Banknote className="h-3 w-3" />
                        : <Wallet className="h-3 w-3" />
                      }
                      {media === "bank" ? "Bank" : "Tunai"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">{spp.jenis}</Badge>
                    <Badge variant={STATUS_VARIANT[spp.status] ?? "outline"} className="text-xs">
                      {spp.status}
                    </Badge>
                  </div>
                </div>

                {/* Baris 2: tanggal + kegiatan */}
                <p className="text-xs text-muted-foreground">
                  {format(new Date(spp.tanggal), "d MMM yyyy", { locale: localeId })} · {spp.kegiatanNama}
                </p>

                {/* Baris 3: uraian */}
                <p className="text-sm font-medium leading-tight">{spp.uraian}</p>

                {/* Baris 4: total + aksi */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{formatRupiah(spp.totalJumlah)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setExpandedId(isExpanded ? null : spp.id)}
                    >
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </Button>
                  </div>

                  <div className="flex gap-1 items-center">
                    {/* Tombol cetak */}
                    <div className="relative">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0"
                        onClick={() => setCetakMenuId(isCetakOpen ? null : spp.id)}
                        disabled={printing}
                        title="Cetak dokumen"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </Button>

                      {isCetakOpen && (
                        <div className="absolute right-0 top-8 z-50 w-52 rounded-md border bg-popover shadow-md text-xs">
                          <div className="px-3 py-2 text-muted-foreground font-medium border-b">
                            Cetak Dokumen SPP
                          </div>
                          <button
                            className="flex w-full items-center gap-2 px-3 py-2 hover:bg-muted transition-colors"
                            onClick={() => handleCetak(spp, "spp1")}
                          >
                            <FileText className="h-3.5 w-3.5 text-blue-600" />
                            SPP Lembar 1 (Permohonan)
                          </button>
                          {isPanjar && (
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2 hover:bg-muted transition-colors"
                              onClick={() => handleCetak(spp, "spp2panjar")}
                            >
                              <FileText className="h-3.5 w-3.5 text-amber-600" />
                              SPP Lembar 2 (Panjar)
                            </button>
                          )}
                          {isDefinitifOrPembiayaan && (
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2 hover:bg-muted transition-colors"
                              onClick={() => handleCetak(spp, "spp2definitif")}
                            >
                              <FileText className="h-3.5 w-3.5 text-green-600" />
                              SPP Lembar 2 (Definitif)
                            </button>
                          )}
                          {sudahCair && (
                            <>
                              <div className="border-t" />
                              <button
                                className="flex w-full items-center gap-2 px-3 py-2 hover:bg-muted transition-colors"
                                onClick={() => handleCetak(spp, "cair")}
                              >
                                <Receipt className="h-3.5 w-3.5 text-teal-600" />
                                Bukti Pencairan (CAIR)
                              </button>
                              <button
                                className="flex w-full items-center gap-2 px-3 py-2 hover:bg-muted transition-colors"
                                onClick={() => handleCetak(spp, "kwt")}
                              >
                                <Receipt className="h-3.5 w-3.5 text-purple-600" />
                                Kuitansi (KWT) — Semua
                              </button>
                              <button
                                className="flex w-full items-center gap-2 px-3 py-2 hover:bg-muted transition-colors"
                                onClick={() => handleCetak(spp, "sptb")}
                              >
                                <ClipboardList className="h-3.5 w-3.5 text-rose-600" />
                                SPTB
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Edit & Hapus */}
                    {(spp.status === "dikonfirmasi" || spp.status === "dicairkan") && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => handleClickEdit(spp)}
                          disabled={uncairkan.isPending}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleClickHapus(spp)}
                          disabled={hapus.isPending || uncairkan.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                    {/* Cairkan */}
                    {spp.status === "dikonfirmasi" && (
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleClickCairkan(spp)}
                        disabled={cairkan.isPending}
                      >
                        Cairkan
                      </Button>
                    )}
                  </div>
                </div>

                {/* Expandable rincian */}
                {isExpanded && (
                  <div className="mt-1 rounded-md border bg-muted/30 divide-y text-xs">
                    {rincianArr.map((r) => (
                      <div key={r.id} className="flex justify-between px-3 py-1.5">
                        <span className="text-muted-foreground">{r.kodeRekening} {r.namaRekening}</span>
                        <span className="font-medium">{formatRupiah(r.jumlah)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Overlay penutup cetak menu */}
      {cetakMenuId && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setCetakMenuId(null)}
        />
      )}

      {/* Sheet Edit SPP */}
      <FormSPP
        open={!!targetEdit}
        onClose={() => setTargetEdit(null)}
        editItem={targetEdit}
      />

      {/* Dialog error */}
      <AlertDialog open={!!errorMsg} onOpenChange={(v) => !v && setErrorMsg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tidak bisa dilakukan</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line">{errorMsg}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorMsg(null)}>Mengerti</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog konfirmasi revert BKU */}
      <AlertDialog open={!!revertFor} onOpenChange={(v) => !v && setRevertFor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {revertFor?.aksi === "edit" ? "Edit" : "Hapus"} SPP yang sudah dicairkan?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>
                  <strong>{revertFor?.spp.nomorSPP}</strong> sudah berstatus <strong>dicairkan</strong> dan ada baris pengeluaran di BKU.
                </div>
                <div>
                  Untuk {revertFor?.aksi === "edit" ? "mengedit" : "menghapus"} SPP ini, baris BKU terkait akan <strong>dihapus otomatis</strong> dan status SPP dikembalikan ke <strong>Dikonfirmasi</strong> terlebih dahulu.
                </div>
                <div className="text-destructive text-xs">
                  Pastikan tidak ada SPJ yang terkait dengan SPP ini. Jika ada SPJ, hapus SPJ terlebih dahulu.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleKonfirmasiRevert}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Ya, Lanjutkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog cairkan */}
      <AlertDialog open={!!targetCairkan} onOpenChange={(v) => { if (!v) setTargetCairkan(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cairkan SPP?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{targetCairkan?.nomorSPP}</strong> — {targetCairkan?.uraian} senilai{" "}
              <strong>{formatRupiah(targetCairkan?.totalJumlah ?? 0)}</strong> akan dicairkan via{" "}
              <strong>{(targetCairkan?.mediaPembayaran ?? "bank") === "bank" ? "Transfer Bank" : "Kas Tunai"}</strong> dan otomatis masuk ke BKU.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleCairkan}>Cairkan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog hapus */}
      <AlertDialog open={!!targetHapus} onOpenChange={(v) => { if (!v) setTargetHapus(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus SPP ini?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{targetHapus?.nomorSPP}</strong> — {targetHapus?.uraian} senilai{" "}
              <strong>{formatRupiah(targetHapus?.totalJumlah ?? 0)}</strong> akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleHapus}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
