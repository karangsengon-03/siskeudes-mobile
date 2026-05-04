// src/components/modules/penatausahaan/FormSPJ.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useSPP } from "@/hooks/useSPP";
import { useAddSPJ, useEditSPJ } from "@/hooks/useSPJ";
import { formatRupiah } from "@/lib/utils";
import { PajakSPJ, SPPItem, SPJItem } from "@/lib/types";
import { JENIS_PAJAK, getPajakByKode } from "@/lib/constants/pajak";
import { toast } from "sonner";
import { AlertCircle, Banknote, Calculator, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { nanoid } from "nanoid";

interface FormSPJProps {
  open: boolean;
  onClose: () => void;
  editItem?: SPJItem | null;
}

type DPPMode = "inklusif" | "eksklusif" | "manual";

interface PajakDraft {
  id: string;
  kode: string;
  nama: string;
  tarif: number;
  dppMode: DPPMode;
  dasarPengenaan: string;
  jumlahPajak: number;
}

function hitungDPP(nilai: number, tarif: number, mode: DPPMode): number {
  if (mode === "inklusif") return Math.round(nilai / (1 + tarif));
  return nilai;
}

function hitungPajak(dpp: number, tarif: number): number {
  return Math.round(dpp * tarif);
}

function defaultMode(kode: string): DPPMode {
  if (kode === "PajakDaerah") return "eksklusif";
  return "inklusif";
}

export function FormSPJ({ open, onClose, editItem }: FormSPJProps) {
  const { data: sppList = [] } = useSPP();
  const addSPJ = useAddSPJ();
  const useEditSPJInstance = useEditSPJ();

  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [sppId, setSppId] = useState("");
  const [nilaiRealisasi, setNilaiRealisasi] = useState("");
  const [pajakList, setPajakList] = useState<PajakDraft[]>([]);
  const [konfirmOpen, setKonfirmOpen] = useState(false);

  useEffect(() => {
    if (open && editItem) {
      setTanggal(editItem.tanggal);
      setSppId(editItem.sppId);
      setNilaiRealisasi(String(editItem.nilaiRealisasi));
      const draft: PajakDraft[] = Object.values(editItem.pajakList ?? {}).map((p) => ({
        id: p.id, kode: p.kode, nama: p.nama, tarif: p.tarif,
        dppMode: "manual" as DPPMode,
        dasarPengenaan: String(p.dasarPengenaan),
        jumlahPajak: p.jumlahPajak,
      }));
      setPajakList(draft);
    } else if (open && !editItem) {
      reset();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editItem]);

  const sppOptions = editItem
    ? sppList.filter((s) => s.id === editItem.sppId || (s.status === "dicairkan" && !(s as any).sudahSPJ))
    : sppList.filter((s) => s.status === "dicairkan" && !(s as any).sudahSPJ);

  const sppAktif: SPPItem | undefined = sppList.find((s) => s.id === sppId);
  const realisasi = parseFloat(nilaiRealisasi) || 0;
  const nilaiSPP = sppAktif?.totalJumlah ?? 0;
  const sisaPanjar = Math.max(0, nilaiSPP - realisasi);
  const realisasiMelebihi = realisasi > nilaiSPP;
  const totalPajak = pajakList.reduce((s, p) => s + p.jumlahPajak, 0);
  const usedKodePajak = pajakList.map((p) => p.kode);

  function tambahPajak() {
    setPajakList((prev) => [
      ...prev,
      { id: nanoid(8), kode: "", nama: "", tarif: 0, dppMode: "inklusif", dasarPengenaan: String(realisasi), jumlahPajak: 0 },
    ]);
  }

  function ubahKodePajak(id: string, kode: string) {
    const def = getPajakByKode(kode);
    const tarif = def?.tarif ?? 0;
    const mode = defaultMode(kode);
    const dpp = hitungDPP(realisasi, tarif, mode);
    setPajakList((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, kode, nama: def?.nama ?? "", tarif, dppMode: mode, dasarPengenaan: String(dpp), jumlahPajak: hitungPajak(dpp, tarif) } : p
      )
    );
  }

  function ubahDPPMode(id: string, mode: DPPMode) {
    setPajakList((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (mode === "manual") return { ...p, dppMode: mode };
        const dpp = hitungDPP(realisasi, p.tarif, mode);
        return { ...p, dppMode: mode, dasarPengenaan: String(dpp), jumlahPajak: hitungPajak(dpp, p.tarif) };
      })
    );
  }

  function ubahDPPManual(id: string, nilai: string) {
    const dpp = parseFloat(nilai) || 0;
    setPajakList((prev) =>
      prev.map((p) => p.id === id ? { ...p, dasarPengenaan: nilai, jumlahPajak: hitungPajak(dpp, p.tarif) } : p)
    );
  }

  function updateSemuaPajakDPP(nilaiRealisasiBaru: number) {
    setPajakList((prev) =>
      prev.map((p) => {
        if (!p.kode || p.dppMode === "manual") return p;
        const dpp = hitungDPP(nilaiRealisasiBaru, p.tarif, p.dppMode);
        return { ...p, dasarPengenaan: String(dpp), jumlahPajak: hitungPajak(dpp, p.tarif) };
      })
    );
  }

  function hapusPajak(id: string) {
    setPajakList((prev) => prev.filter((p) => p.id !== id));
  }

  function reset() {
    setTanggal(new Date().toISOString().split("T")[0]);
    setSppId(""); setNilaiRealisasi(""); setPajakList([]);
  }

  const bisaSubmit = sppId !== "" && realisasi > 0 && !realisasiMelebihi &&
    pajakList.every((p) => p.kode !== "" && parseFloat(p.dasarPengenaan) > 0);

  async function handleKonfirmasi() {
    if (!sppAktif) return;
    setKonfirmOpen(false);
    const pajakRecord: Record<string, PajakSPJ> = {};
    pajakList.forEach((p) => {
      pajakRecord[p.id] = { id: p.id, kode: p.kode, nama: p.nama, tarif: p.tarif, dasarPengenaan: parseFloat(p.dasarPengenaan), jumlahPajak: p.jumlahPajak };
    });
    try {
      if (editItem) {
        await useEditSPJInstance.mutateAsync({
          spjId: editItem.id, tanggal, sppId, nomorSPP: sppAktif.nomorSPP, kegiatanNama: sppAktif.kegiatanNama,
          nilaiSPP, nilaiRealisasi: realisasi, sisaPanjar, mediaPembayaran: sppAktif.mediaPembayaran ?? "bank",
          pajakList: pajakRecord, totalPajak,
        });
        toast.success("SPJ berhasil diperbarui");
      } else {
        await addSPJ.mutateAsync({
          tanggal, sppId, nomorSPP: sppAktif.nomorSPP, kegiatanNama: sppAktif.kegiatanNama,
          nilaiSPP, nilaiRealisasi: realisasi, sisaPanjar, mediaPembayaran: sppAktif.mediaPembayaran ?? "bank",
          pajakList: pajakRecord, totalPajak,
        });
        toast.success("SPJ berhasil disahkan");
      }
      reset(); onClose();
    } catch {
      toast.error("Gagal menyimpan SPJ, coba lagi");
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
        <DialogContent className="w-full max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 py-3 border-b shrink-0">
            <DialogTitle>{editItem ? "Edit SPJ" : "Buat SPJ"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0 overflow-y-auto">
            <div className="p-4 space-y-4">

              <div className="space-y-1">
                <Label className="text-xs">Tanggal SPJ</Label>
                <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">SPP yang Di-SPJ-kan</Label>
                {sppOptions.length === 0 ? (
                  <div className="rounded-md border px-3 py-3 text-xs text-muted-foreground text-center">
                    Belum ada SPP yang dicairkan atau semua sudah di-SPJ
                  </div>
                ) : (
                  <Select value={sppId} onValueChange={(v) => { setSppId(v); setNilaiRealisasi(""); setPajakList([]); }}>
                    <SelectTrigger><SelectValue placeholder="Pilih nomor SPP..." /></SelectTrigger>
                    <SelectContent>
                      {sppOptions.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.nomorSPP} — {s.kegiatanNama}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {sppAktif && (
                <div className="rounded-md border bg-muted/30 p-3 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nomor SPP</span>
                    <span className="font-mono font-semibold">{sppAktif.nomorSPP}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kegiatan</span>
                    <span className="font-medium text-right max-w-[60%]">{sppAktif.kegiatanNama}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1 mt-1">
                    <span className="text-muted-foreground">Media Bayar</span>
                    <span className="font-semibold flex items-center gap-1">
                      {sppAktif.mediaPembayaran === "tunai"
                        ? <><Wallet className="h-3 w-3" /> Kas Tunai</>
                        : <><Banknote className="h-3 w-3" /> Transfer Bank</>}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Nilai SPP</span>
                    <span className="text-teal-600">{formatRupiah(nilaiSPP)}</span>
                  </div>
                </div>
              )}

              {sppAktif && (
                <div className="space-y-1">
                  <Label className="text-xs">
                    Nilai Realisasi (Rp)
                    <span className="text-muted-foreground ml-1">— nilai sudah termasuk pajak</span>
                  </Label>
                  <Input
                    type="number" min={0} max={nilaiSPP} placeholder="0"
                    value={nilaiRealisasi}
                    onChange={(e) => { setNilaiRealisasi(e.target.value); updateSemuaPajakDPP(parseFloat(e.target.value) || 0); }}
                  />
                  {realisasiMelebihi && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Realisasi tidak boleh melebihi nilai SPP!
                    </p>
                  )}
                  {realisasi > 0 && !realisasiMelebihi && (
                    <div className="rounded-md border bg-muted/20 p-2.5 space-y-1 text-xs mt-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nilai SPP</span>
                        <span>{formatRupiah(nilaiSPP)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Realisasi</span>
                        <span>{formatRupiah(realisasi)}</span>
                      </div>
                      <div className={`flex justify-between font-semibold border-t pt-1 ${sisaPanjar > 0 ? "text-amber-600" : "text-teal-600"}`}>
                        <span>Sisa Panjar</span>
                        <span>{formatRupiah(sisaPanjar)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {sppAktif && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Potongan Pajak</Label>
                    <Button
                      type="button" variant="outline" size="sm" className="h-7 text-xs"
                      onClick={tambahPajak} disabled={pajakList.length >= JENIS_PAJAK.length}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Tambah Pajak
                    </Button>
                  </div>

                  {pajakList.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2 border rounded-md">
                      Tidak ada pajak — klik "Tambah Pajak" jika ada potongan
                    </p>
                  )}

                  {pajakList.map((p) => (
                    <div key={p.id} className="rounded-md border p-3 space-y-2 bg-muted/20">
                      <div className="flex gap-2 items-center">
                        <div className="flex-1">
                          <Select value={p.kode} onValueChange={(kode) => ubahKodePajak(p.id, kode)}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Pilih jenis pajak..." />
                            </SelectTrigger>
                            <SelectContent>
                              {JENIS_PAJAK.map((j) => (
                                <SelectItem key={j.kode} value={j.kode}
                                  disabled={usedKodePajak.includes(j.kode) && j.kode !== p.kode}
                                >
                                  {j.nama} ({(j.tarif * 100).toFixed(1)}%)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="button" variant="ghost" size="icon"
                          className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                          onClick={() => hapusPajak(p.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {p.kode && (
                        <div className="space-y-1.5">
                          {/* Mode selector */}
                          <div className="flex gap-1 flex-wrap">
                            {(["inklusif", "eksklusif", "manual"] as DPPMode[]).map((mode) => {
                              if (mode === "eksklusif" && p.kode !== "PajakDaerah") return null;
                              if (mode === "inklusif" && p.kode === "PajakDaerah") return null;
                              const labels: Record<DPPMode, string> = {
                                inklusif: `Rekomendasi (÷${(1 + p.tarif).toFixed(2)})`,
                                eksklusif: `Rekomendasi (×${(p.tarif * 100).toFixed(0)}%)`,
                                manual: "Manual",
                              };
                              return (
                                <button key={mode} type="button"
                                  onClick={() => ubahDPPMode(p.id, mode)}
                                  className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded border transition-colors ${
                                    p.dppMode === mode
                                      ? "bg-teal-600 text-white border-teal-600"
                                      : "border-border text-muted-foreground hover:bg-muted"
                                  }`}
                                >
                                  {mode === "manual" ? <Pencil className="h-2.5 w-2.5" /> : <Calculator className="h-2.5 w-2.5" />}
                                  {labels[mode]}
                                </button>
                              );
                            })}
                          </div>

                          {p.dppMode === "manual" ? (
                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground">DPP (input manual)</Label>
                              <Input
                                type="number" min={0} className="h-7 text-xs"
                                value={p.dasarPengenaan}
                                onChange={(e) => ubahDPPManual(p.id, e.target.value)}
                                placeholder="Masukkan DPP..."
                              />
                            </div>
                          ) : (
                            <div className="rounded bg-muted/30 px-2 py-1.5 text-xs text-muted-foreground">
                              DPP ={" "}
                              {p.dppMode === "inklusif"
                                ? `${formatRupiah(realisasi)} ÷ ${(1 + p.tarif).toFixed(2)}`
                                : `${formatRupiah(realisasi)} × ${(p.tarif * 100).toFixed(0)}%`
                              }
                              {" "}= <strong className="text-foreground">{formatRupiah(parseFloat(p.dasarPengenaan) || 0)}</strong>
                            </div>
                          )}

                          {p.jumlahPajak > 0 && (
                            <div className="flex justify-between text-xs bg-muted rounded px-2 py-1.5">
                              <span className="text-muted-foreground">
                                {(p.tarif * 100).toFixed(1)}% × {formatRupiah(parseFloat(p.dasarPengenaan) || 0)}
                              </span>
                              <span className="font-semibold text-rose-600">= {formatRupiah(p.jumlahPajak)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {pajakList.length > 0 && (
                    <div className="flex justify-between text-sm font-semibold border-t pt-1 px-1">
                      <span>Total Potongan Pajak</span>
                      <span className="text-rose-600">{formatRupiah(totalPajak)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => { reset(); onClose(); }}>
                  Batal
                </Button>
                <Button type="button" className="flex-1"
                  disabled={!bisaSubmit || addSPJ.isPending || useEditSPJInstance.isPending}
                  onClick={() => setKonfirmOpen(true)}
                >
                  {editItem ? "Simpan Perubahan" : "Sahkan SPJ"}
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={konfirmOpen} onOpenChange={setKonfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{editItem ? "Simpan perubahan SPJ?" : "Sahkan SPJ?"}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SPP</span>
                  <span className="font-mono">{sppAktif?.nomorSPP}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Realisasi</span>
                  <span>{formatRupiah(realisasi)}</span>
                </div>
                {sisaPanjar > 0 && (
                  <div className="flex justify-between text-amber-600 font-medium">
                    <span>Sisa Panjar</span><span>{formatRupiah(sisaPanjar)}</span>
                  </div>
                )}
                {totalPajak > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Total Pajak</span><span>{formatRupiah(totalPajak)}</span>
                  </div>
                )}
                {pajakList.map((p) => (
                  <div key={p.id} className="flex justify-between text-xs text-muted-foreground pl-2">
                    <span>{p.nama}</span><span>{formatRupiah(p.jumlahPajak)}</span>
                  </div>
                ))}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleKonfirmasi}>Ya, Sahkan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
