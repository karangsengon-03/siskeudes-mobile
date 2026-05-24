// src/components/modules/penatausahaan/SPJList.tsx
"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ListFilter, filterByBulan } from "@/components/ui/list-filter";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSPJ, useDeleteSPJ, useEditSPJ } from "@/hooks/useSPJ";
import { useSPP } from "@/hooks/useSPP";
import { FormSPJ } from "./FormSPJ";
import { usePenyetoranPajak } from "@/hooks/usePenyetoranPajak";
import { useBukuPajak } from "@/hooks/useBukuPembantu";
import { useDataDesa } from "@/hooks/useMaster";
import { formatRupiah } from "@/lib/utils";
import { SPJItem } from "@/lib/types";
import { useAppStore } from "@/store/appStore";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  ChevronDown, ChevronUp, FileCheck, Loader2, Pencil, Trash2,
  Printer, FileText, ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import {
  downloadPDF_SPJDokumen,
  downloadPDF_LP,
} from "@/lib/generatePDF";

export function SPJList() {
  const { data: spjList = [], isLoading } = useSPJ();
  const { data: sppList = [] } = useSPP();
  const hapus = useDeleteSPJ();
  const edit = useEditSPJ();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [targetHapus, setTargetHapus] = useState<SPJItem | null>(null);
  const [targetEdit, setTargetEdit] = useState<SPJItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cetakMenuId, setCetakMenuId] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  const [filterBulan, setFilterBulan] = useState("0");
  const [filterSearch, setFilterSearch] = useState("");

  const filteredSPJ = useMemo(() => {
    let list = filterByBulan(spjList, filterBulan);
    if (filterSearch.trim()) {
      const q = filterSearch.toLowerCase();
      list = list.filter(
        (s) =>
          s.nomorSPJ.toLowerCase().includes(q) ||
          s.kegiatanNama.toLowerCase().includes(q) ||
          s.nomorSPP.toLowerCase().includes(q)
      );
    }
    return list;
  }, [spjList, filterBulan, filterSearch]);

  const { data: penyetoranList = [] } = usePenyetoranPajak();
  // BukuPembantuPajak dibutuhkan untuk mencari apakah suatu SPJ masih
  // punya pajak yang sudah disetor (terhubung lewat nomorSPJ)
  const { data: bukuPajakList = [] } = useBukuPajak();
  const { data: dataDesa } = useDataDesa();
  const tahun = useAppStore((s) => s.tahunAnggaran);

  /**
   * Cek apakah SPJ tertentu masih punya penyetoran pajak yang terkait.
   * Caranya:
   * 1. Cari semua bukuPembantuPajak yang nomorSPJ-nya cocok dengan SPJ ini.
   * 2. Dari id-id tersebut, cek apakah ada PenyetoranPajakItem yang
   *    bukuPembantuPajakIds-nya mengandung salah satu id tersebut.
   */
  function spjMasihAdaPenyetoranPajak(spj: SPJItem): boolean {
    // Id-id bukuPembantuPajak yang terkait dengan SPJ ini
    const bppIds = bukuPajakList
      .filter((bp) => bp.nomorSPJ === spj.nomorSPJ)
      .map((bp) => bp.id);

    if (bppIds.length === 0) return false;

    // Cek apakah ada penyetoran pajak yang referensikan salah satu bppId tersebut
    return penyetoranList.some((p) =>
      p.bukuPembantuPajakIds.some((id) => bppIds.includes(id))
    );
  }

  async function handleCetak(spj: SPJItem, jenis: string) {
    setCetakMenuId(null);
    setPrinting(true);
    try {
      const sppTerkait = sppList.find((s) => s.id === spj.sppId);

      if (jenis === "spj") {
        await downloadPDF_SPJDokumen({
          dataDesa,
          tahun,
          spj: {
            id: spj.id,
            nomorSPJ: spj.nomorSPJ,
            tanggal: spj.tanggal,
            nomorSPP: spj.nomorSPP,
            kegiatanNama: spj.kegiatanNama,
            nilaiSPP: spj.nilaiSPP,
            nilaiRealisasi: spj.nilaiRealisasi,
            sisaPanjar: spj.sisaPanjar,
            totalPajak: spj.totalPajak,
            pajakList: spj.pajakList ?? {},
          },
          spp: sppTerkait ?? ({
            id: spj.sppId,
            nomorSPP: spj.nomorSPP,
            tanggal: spj.tanggal,
            jenis: "Panjar" as const,
            uraian: spj.kegiatanNama,
            kegiatanId: "",
            kegiatanNama: spj.kegiatanNama,
            rincianSPP: {},
            totalJumlah: spj.nilaiSPP,
            status: "dicairkan" as const,
            inputOleh: "",
            createdAt: 0,
          }),
        });
      } else if (jenis === "lp" && sppTerkait) {
        await downloadPDF_LP({
          dataDesa,
          tahun,
          spp: sppTerkait,
          spj: {
            nomorSPJ: spj.nomorSPJ,
            tanggal: spj.tanggal,
            nilaiSPP: spj.nilaiSPP,
            nilaiRealisasi: spj.nilaiRealisasi,
            sisaPanjar: spj.sisaPanjar,
            totalPajak: spj.totalPajak,
          },
        });
      } else if (jenis === "lp" && !sppTerkait) {
        toast.error("Data SPP terkait tidak ditemukan untuk mencetak LP");
      }
    } catch {
      toast.error("Gagal mencetak dokumen");
    } finally {
      setPrinting(false);
    }
  }

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
      <ListFilter
        bulan={filterBulan}
        onBulanChange={setFilterBulan}
        search={filterSearch}
        onSearchChange={setFilterSearch}
        searchPlaceholder="Cari nomor SPJ, kegiatan, SPP..."
      />
      <ScrollArea className="flex-1">
        <div className="divide-y">
          {filteredSPJ.length === 0 && spjList.length > 0 && (
            <div className="flex items-center justify-center h-24 text-muted-foreground text-xs">
              Tidak ada SPJ sesuai filter
            </div>
          )}
          {filteredSPJ.map((spj) => {
            const isExpanded = expandedId === spj.id;
            const isCetakOpen = cetakMenuId === spj.id;
            const pajakArr = Object.values(spj.pajakList ?? {});
            const sppTerkait = sppList.find((s) => s.id === spj.sppId);
            const isPanjar = sppTerkait?.jenis === "Panjar";
            // Cek per-SPJ apakah masih ada penyetoran pajak terkait
            const adaPenyetoranTerkait = spjMasihAdaPenyetoranPajak(spj);

            return (
              <div key={spj.id} className="px-4 py-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-medium">{spj.nomorSPJ}</span>
                  <div className="flex items-center gap-1">
                    <Badge variant="default" className="text-xs">disahkan</Badge>

                    {/* Tombol cetak — tersedia untuk semua SPJ */}
                    <div className="relative">
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Cetak dokumen SPJ"
                        className="h-9 w-9"
                        onClick={() => setCetakMenuId(isCetakOpen ? null : spj.id)}
                        disabled={printing}
                        title="Cetak dokumen"
                      >
                        <Printer className="h-3 w-3" />
                      </Button>

                      {isCetakOpen && (
                        <div className="absolute right-0 top-7 z-50 w-52 rounded-md border bg-popover shadow-md text-xs">
                          <div className="px-3 py-2 text-muted-foreground font-medium border-b">
                            Cetak Dokumen SPJ
                          </div>
                          <button
                            className="flex w-full items-center gap-2 px-3 py-2 hover:bg-muted transition-colors"
                            onClick={() => handleCetak(spj, "spj")}
                          >
                            <FileText className="h-3.5 w-3.5 text-blue-600" />
                            Dokumen SPJ
                          </button>
                          {isPanjar && (
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2 hover:bg-muted transition-colors"
                              onClick={() => handleCetak(spj, "lp")}
                            >
                              <ClipboardList className="h-3.5 w-3.5 text-amber-600" />
                              LP (Laporan Pertanggungjawaban Panjar)
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Edit & Hapus — tersedia untuk SEMUA SPJ,
                        tapi dicegah jika SPJ ini masih punya penyetoran pajak terkait */}
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Ubah SPJ"
                      className="h-9 w-9 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        if (adaPenyetoranTerkait) {
                          setErrorMsg(
                            "Tidak bisa edit SPJ ini karena masih ada Penyetoran Pajak yang terkait. Hapus penyetoran pajaknya terlebih dahulu."
                          );
                          return;
                        }
                        setTargetEdit(spj);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Hapus SPJ"
                      className="h-9 w-9 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (adaPenyetoranTerkait) {
                          setErrorMsg(
                            "Tidak bisa hapus SPJ ini karena masih ada Penyetoran Pajak yang terkait. Hapus penyetoran pajaknya terlebih dahulu."
                          );
                          return;
                        }
                        setTargetHapus(spj);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
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
                    <p className="font-semibold tabular-nums text-primary">{formatRupiah(spj.nilaiRealisasi)}</p>
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
                      className="h-9 text-xs px-2 text-muted-foreground"
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

      {/* Overlay penutup cetak menu */}
      {cetakMenuId && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setCetakMenuId(null)}
        />
      )}

      {/* Dialog error */}
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

      {/* Dialog edit SPJ */}
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
                try {
                  if (!targetHapus) return;
                  await hapus.mutateAsync(targetHapus.id);
                  toast.success("SPJ dihapus");
                  setTargetHapus(null);
                } catch {
                  toast.error("Gagal menghapus SPJ, coba lagi");
                }
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
