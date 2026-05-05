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
import { Separator } from "@/components/ui/separator";
import { useAddPenyetoranPajak, useAddPenyetoranHutangPajak } from "@/hooks/usePenyetoranPajak";
import { useBukuPajak } from "@/hooks/useBukuPembantu";
import { useSaldoAwal } from "@/hooks/useSaldoAwal";
import { useSaldoTunai, useSaldoBank } from "@/hooks/useBKU";
import { formatRupiah } from "@/lib/utils";
import { JenisPembayaranPajak } from "@/lib/types";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { AlertCircle, Banknote, Wallet, History } from "lucide-react";

interface FormPenyetoranPajakProps {
  open: boolean;
  onClose: () => void;
}

// Hutang pajak saldo awal — label dan kode
const JENIS_HUTANG = [
  { key: "ppn" as const, label: "PPN", kode: "PPN" },
  { key: "pph22" as const, label: "PPh Pasal 22", kode: "PPH22" },
  { key: "pph23" as const, label: "PPh Pasal 23", kode: "PPH23" },
  { key: "pajakDaerah" as const, label: "Pajak Daerah", kode: "PJKD" },
];

export function FormPenyetoranPajak({ open, onClose }: FormPenyetoranPajakProps) {
  const addSetor = useAddPenyetoranPajak();
  const addSetorHutang = useAddPenyetoranHutangPajak();
  const { data: pajakItems = [] } = useBukuPajak();
  const { data: saldoAwal } = useSaldoAwal();
  const saldoTunai = useSaldoTunai();
  const saldoBank = useSaldoBank();

  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [jenisPembayaran, setJenisPembayaran] = useState<JenisPembayaranPajak>("tunai");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // Hutang pajak saldo awal yang dipilih untuk disetor
  const [selectedHutang, setSelectedHutang] = useState<Set<"ppn" | "pph22" | "pph23" | "pajakDaerah">>(new Set());
  const [konfirmOpen, setKonfirmOpen] = useState(false);

  // Pajak dari SPJ yang belum disetor
  const belumDisetor = pajakItems.filter((p) => !p.sudahDisetor);
  const grouped = useMemo(() => {
    const map: Record<string, typeof belumDisetor> = {};
    for (const item of belumDisetor) {
      if (!map[item.kodePajak]) map[item.kodePajak] = [];
      map[item.kodePajak].push(item);
    }
    return map;
  }, [belumDisetor]);

  // Hutang pajak saldo awal yang masih ada (> 0)
  const hutangAwal = JENIS_HUTANG.filter(
    (h) => (saldoAwal?.hutangPajak?.[h.key] ?? 0) > 0
  );

  const selectedItems = belumDisetor.filter((p) => selectedIds.includes(p.id));
  const totalSPJ = selectedItems.reduce((s, p) => s + p.jumlah, 0);

  const totalHutangDipilih = [...selectedHutang].reduce(
    (s, key) => s + (saldoAwal?.hutangPajak?.[key] ?? 0), 0
  );

  const totalSetor = totalSPJ + totalHutangDipilih;
  const saldoTersedia = jenisPembayaran === "tunai" ? saldoTunai : saldoBank;
  const melebihiSaldo = totalSetor > saldoTersedia;
  const bisaSubmit =
    (selectedIds.length > 0 || selectedHutang.size > 0) &&
    totalSetor > 0 &&
    !melebihiSaldo;

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

  function toggleHutang(key: "ppn" | "pph22" | "pph23" | "pajakDaerah") {
    setSelectedHutang((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function reset() {
    setTanggal(new Date().toISOString().split("T")[0]);
    setJenisPembayaran("tunai");
    setSelectedIds([]);
    setSelectedHutang(new Set());
  }

  async function handleKonfirmasi() {
    setKonfirmOpen(false);
    try {
      // 1. Setor pajak SPJ (jika ada yang dipilih)
      if (selectedItems.length > 0) {
        const kodePajakList = [...new Set(selectedItems.map((p) => p.kodePajak))];
        const namaGabung = kodePajakList.join(", ");
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
          jumlah: totalSPJ,
          jenisPembayaran,
          uraian: `Penyetoran pajak ${namaGabung}`,
          bukuPembantuPajakIds: selectedIds,
          perKodePajak,
        } as any);
      }

      // 2. Setor hutang pajak saldo awal (jika ada yang dipilih)
      if (selectedHutang.size > 0) {
        const hutangList = [...selectedHutang].map((key) => {
          const info = JENIS_HUTANG.find((h) => h.key === key)!;
          return {
            key,
            kode: info.kode,
            label: info.label,
            jumlah: saldoAwal?.hutangPajak?.[key] ?? 0,
          };
        });
        await addSetorHutang.mutateAsync({
          tanggal,
          jenisPembayaran,
          hutangList,
          totalJumlah: totalHutangDipilih,
        });
      }

      toast.success("Penyetoran pajak berhasil dicatat");
      reset();
      onClose();
    } catch {
      toast.error("Gagal menyimpan penyetoran pajak, coba lagi");
    }
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
                      className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-colors ${
                        jenisPembayaran === j
                          ? "border-teal-600 bg-teal-50 dark:bg-teal-950/30"
                          : "border-border hover:bg-muted/50"
                      }`}
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

              {/* ── SECTION: Hutang Pajak Saldo Awal ── */}
              {hutangAwal.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <History className="h-3.5 w-3.5 text-amber-500" />
                    <Label className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
                      Hutang Pajak Tahun Lalu (Saldo Awal)
                    </Label>
                  </div>
                  <div className="rounded-md border border-amber-200 dark:border-amber-800 overflow-hidden">
                    <div className="bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-[10px] text-amber-700 dark:text-amber-400">
                      Hutang pajak yang dibawa dari tahun sebelumnya dan belum disetor. Sumber pembayaran dari kas tunai saldo awal.
                    </div>
                    <div className="divide-y">
                      {hutangAwal.map((h) => {
                        const jumlah = saldoAwal?.hutangPajak?.[h.key] ?? 0;
                        const isSelected = selectedHutang.has(h.key);
                        return (
                          <button
                            key={h.key}
                            type="button"
                            onClick={() => toggleHutang(h.key)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 text-xs transition-colors ${
                              isSelected ? "bg-amber-50/50 dark:bg-amber-950/20" : "hover:bg-muted/30"
                            }`}
                          >
                            <span className="font-medium">{h.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-amber-700 dark:text-amber-400">
                                {formatRupiah(jumlah)}
                              </span>
                              <div className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? "bg-amber-500 border-amber-500"
                                  : "border-muted-foreground"
                              }`}>
                                {isSelected && <span className="text-white text-[10px]">✓</span>}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── SECTION: Pajak dari SPJ ── */}
              <div className="space-y-2">
                <Label className="text-xs">Pajak dari SPJ (Belum Disetor)</Label>
                {belumDisetor.length === 0 ? (
                  <div className="rounded-md border px-3 py-4 text-xs text-muted-foreground text-center">
                    Semua pajak SPJ sudah disetor
                  </div>
                ) : (
                  Object.entries(grouped).map(([kodePajak, items]) => {
                    const groupIds = items.map((i) => i.id);
                    const allSelected = groupIds.every((id) => selectedIds.includes(id));
                    const totalGrup = items.reduce((s, i) => s + i.jumlah, 0);
                    return (
                      <div key={kodePajak} className="rounded-md border overflow-hidden">
                        <button
                          type="button"
                          onClick={() => toggleGroup(groupIds)}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors ${
                            allSelected
                              ? "bg-teal-50 dark:bg-teal-950/30 text-teal-700"
                              : "bg-muted/40 hover:bg-muted/70"
                          }`}
                        >
                          <span>{kodePajak} — {items[0].namaPajak}</span>
                          <div className="flex items-center gap-2">
                            <span>{formatRupiah(totalGrup)}</span>
                            <Badge variant={allSelected ? "default" : "outline"} className="text-[10px]">
                              {groupIds.filter((id) => selectedIds.includes(id)).length}/{items.length}
                            </Badge>
                          </div>
                        </button>
                        <div className="divide-y">
                          {items.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => toggleItem(item.id)}
                              className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                                selectedIds.includes(item.id)
                                  ? "bg-teal-50/50 dark:bg-teal-950/20"
                                  : "hover:bg-muted/30"
                              }`}
                            >
                              <div className="text-left">
                                <p className="font-mono text-muted-foreground">{item.nomorSPJ}</p>
                                <p className="text-muted-foreground">
                                  {format(new Date(item.tanggal), "d MMM yyyy", { locale: localeId })}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{formatRupiah(item.jumlah)}</span>
                                <div className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 ${
                                  selectedIds.includes(item.id)
                                    ? "bg-teal-600 border-teal-600"
                                    : "border-muted-foreground"
                                }`}>
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

              {/* Total ringkasan */}
              {totalSetor > 0 && (
                <div className="rounded-md border px-3 py-2.5 space-y-1.5">
                  {totalHutangDipilih > 0 && (
                    <div className="flex justify-between text-xs text-amber-700 dark:text-amber-400">
                      <span>Hutang Pajak Saldo Awal</span>
                      <span>{formatRupiah(totalHutangDipilih)}</span>
                    </div>
                  )}
                  {totalSPJ > 0 && (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Pajak SPJ</span>
                      <span>{formatRupiah(totalSPJ)}</span>
                    </div>
                  )}
                  {totalHutangDipilih > 0 && totalSPJ > 0 && <Separator />}
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
                <Button
                  type="button"
                  className="flex-1"
                  disabled={!bisaSubmit || addSetor.isPending || addSetorHutang.isPending}
                  onClick={() => setKonfirmOpen(true)}
                >
                  {(addSetor.isPending || addSetorHutang.isPending) ? "Memproses..." : "Setor Pajak"}
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
            <AlertDialogDescription asChild>
              <div className="space-y-1 text-sm">
                {totalHutangDipilih > 0 && (
                  <p>Hutang pajak saldo awal: <strong>{formatRupiah(totalHutangDipilih)}</strong></p>
                )}
                {totalSPJ > 0 && (
                  <p>Pajak SPJ: <strong>{formatRupiah(totalSPJ)}</strong></p>
                )}
                <p>Total disetor: <strong>{formatRupiah(totalSetor)}</strong> via <strong>{jenisPembayaran === "tunai" ? "kas tunai" : "bank"}</strong>.</p>
              </div>
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
