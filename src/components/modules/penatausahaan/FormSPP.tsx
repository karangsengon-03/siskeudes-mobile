// src/components/modules/penatausahaan/FormSPP.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAPBDes } from "@/hooks/useAPBDes";
import { useAddSPP, useRealisasiRekening } from "@/hooks/useSPP";
import { formatRupiah } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  JenisSPP,
  KegiatanAPBDes,
  RekeningKegiatan,
  RincianSPP,
  SPPItem,
} from "@/lib/types";
import { useEditSPP } from "@/hooks/useSPP";
import { toast } from "sonner";
import { AlertCircle, Banknote, Check, Plus, Trash2, Wallet } from "lucide-react";
import { nanoid } from "nanoid";

interface FormSPPProps {
  open: boolean;
  onClose: () => void;
  editItem?: SPPItem | null;
}

interface RincianDraft {
  id: string;
  kodeRekening: string;
  namaRekening: string;
  pagu: number;
  jumlah: string;
}

// ── Struktur navigasi ───────────────────────────────────────

interface BidangNode {
  kode: string;
  nama: string;
  subBidang: SubBidangNode[];
}

interface SubBidangNode {
  kode: string;
  nama: string;
  kegiatan: KegiatanAPBDes[];
}

function buildTree(list: KegiatanAPBDes[]): BidangNode[] {
  const map = new Map<string, BidangNode>();
  for (const k of list) {
    if (!map.has(k.bidangKode)) {
      map.set(k.bidangKode, {
        kode: k.bidangKode,
        nama: k.bidangNama,
        subBidang: [],
      });
    }
    const bidang = map.get(k.bidangKode)!;
    let sb = bidang.subBidang.find((s) => s.kode === k.subBidangKode);
    if (!sb) {
      sb = { kode: k.subBidangKode, nama: k.subBidangNama, kegiatan: [] };
      bidang.subBidang.push(sb);
    }
    sb.kegiatan.push(k);
  }
  return Array.from(map.values()).sort((a, b) => a.kode.localeCompare(b.kode));
}

// ── Sub-komponen: 1 baris rincian rekening ─────────────────

function RincianRowWithRealisasi({
  rincian,
  rekeningList,
  kegiatanId,
  usedKode,
  onChange,
  onRemove,
}: {
  rincian: RincianDraft;
  rekeningList: RekeningKegiatan[];
  kegiatanId: string;
  usedKode: string[];
  onChange: (updated: RincianDraft) => void;
  onRemove: () => void;
}) {
  const realisasi = useRealisasiRekening(kegiatanId, rincian.kodeRekening);
  const [showPicker, setShowPicker] = useState(rincian.kodeRekening === "");
  const jumlah = parseFloat(rincian.jumlah) || 0;
  const sisaPagu = rincian.pagu - realisasi;
  const melebihi = rincian.kodeRekening !== "" && jumlah > sisaPagu;

  return (
    <div className="rounded-md border bg-muted/20 overflow-hidden">

      {/* Header baris: rekening terpilih atau picker */}
      {!showPicker && rincian.kodeRekening ? (
        // Rekening sudah dipilih — tampilkan nama + tombol ganti & hapus
        <div className="flex items-start gap-2 px-3 py-2 bg-background border-b">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium overflow-wrap: break-word leading-snug">
              {rincian.kodeRekening} — {rincian.namaRekening}
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-xs px-2 text-muted-foreground"
              onClick={() => setShowPicker(true)}
            >
              Ganti
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={onRemove}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ) : (
        // Picker: daftar rekening yang bisa diklik, teks tidak terpotong
        <div className="border-b">
          <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 border-b">
            <span className="text-xs font-semibold text-muted-foreground">Pilih Rekening Belanja</span>
            {rincian.kodeRekening && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-5 text-xs px-2"
                onClick={() => setShowPicker(false)}
              >
                Batal
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-destructive hover:text-destructive"
              onClick={onRemove}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          <div className="max-h-36 overflow-y-auto divide-y">
            {rekeningList.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-3">Tidak ada rekening</p>
            )}
            {rekeningList.map((r) => {
              const dipakai = usedKode.includes(r.kodeRekening) && r.kodeRekening !== rincian.kodeRekening;
              const aktif = r.kodeRekening === rincian.kodeRekening;
              return (
                <button
                  key={r.kodeRekening}
                  type="button"
                  disabled={dipakai}
                  onClick={() => {
                    onChange({
                      ...rincian,
                      kodeRekening: r.kodeRekening,
                      namaRekening: r.namaRekening,
                      pagu: r.totalPagu,
                    });
                    setShowPicker(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-xs flex items-start gap-2 transition-colors",
                    dipakai
                      ? "opacity-40 cursor-not-allowed bg-muted/30"
                      : aktif
                      ? "bg-teal-50 dark:bg-teal-950/30"
                      : "hover:bg-muted/50"
                  )}
                >
                  <Check className={cn("h-3 w-3 mt-0.5 shrink-0", aktif ? "text-teal-600" : "invisible")} />
                  <span className=" overflow-wrap: break-word leading-snug">
                    <span className="font-mono">{r.kodeRekening}</span>
                    {" — "}
                    {r.namaRekening}
                    <span className="block text-muted-foreground mt-0.5">
                      Pagu: {formatRupiah(r.totalPagu)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Info pagu + input jumlah — hanya tampil kalau rekening sudah dipilih */}
      {rincian.kodeRekening && !showPicker && (
        <div className="px-3 py-2 space-y-2">
          <div
            className={cn(
              "text-xs px-2 py-1.5 rounded flex items-start gap-1.5",
              melebihi
                ? "bg-destructive/10 text-destructive"
                : "bg-muted text-muted-foreground"
            )}
          >
            {melebihi && <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />}
            <span>
              Pagu: <strong>{formatRupiah(rincian.pagu)}</strong>
              {" · "}Terpakai: <strong>{formatRupiah(realisasi)}</strong>
              {" · "}Sisa:{" "}
              <strong className={melebihi ? "text-destructive" : ""}>
                {formatRupiah(sisaPagu)}
              </strong>
              {melebihi && " ← melebihi sisa!"}
            </span>
          </div>
          <Input
            type="number"
            min={0}
            placeholder="Jumlah (Rp)"
            className="h-8 text-sm"
            value={rincian.jumlah}
            onChange={(e) => onChange({ ...rincian, jumlah: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}

// ── Komponen utama ─────────────────────────────────────────

export function FormSPP({ open, onClose, editItem }: FormSPPProps) {
  const { data: apbdes } = useAPBDes();
  const addSPP = useAddSPP();
  const editSPP = useEditSPP();

  const [jenis, setJenis] = useState<JenisSPP>("Definitif");
  const [mediaPembayaran, setMediaPembayaran] = useState<"tunai" | "bank">("bank");
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [uraian, setUraian] = useState("");
  const [rincianList, setRincianList] = useState<RincianDraft[]>([]);
  const [konfirmOpen, setKonfirmOpen] = useState(false);

  const [selBidang, setSelBidang] = useState<BidangNode | null>(null);
  const [selSubBidang, setSelSubBidang] = useState<SubBidangNode | null>(null);
  const [selKegiatan, setSelKegiatan] = useState<KegiatanAPBDes | null>(null);

  // Populate form saat edit
  const kegiatanListForEdit: KegiatanAPBDes[] = useMemo(
    () =>
      apbdes?.belanja
        ? Array.isArray(apbdes.belanja)
          ? apbdes.belanja
          : Object.values(apbdes.belanja)
        : [],
    [apbdes]
  );

  useEffect(() => {
    if (open && editItem && kegiatanListForEdit.length > 0) {
      setJenis(editItem.jenis);
      setMediaPembayaran(editItem.mediaPembayaran ?? "bank");
      setTanggal(editItem.tanggal);
      setUraian(editItem.uraian ?? "");
      const kg = kegiatanListForEdit.find((k) => k.id === editItem.kegiatanId) ?? null;
      setSelKegiatan(kg);
      if (kg) {
        // Cari bidang & sub-bidang dari tree
        const tree = buildTree(kegiatanListForEdit);
        for (const b of tree) {
          for (const sb of b.subBidang) {
            if (sb.kegiatan.some((k) => k.id === editItem.kegiatanId)) {
              setSelBidang(b);
              setSelSubBidang(sb);
              break;
            }
          }
        }
      }
      const rincianDraft: RincianDraft[] = Object.values(editItem.rincianSPP ?? {}).map((r) => ({
        id: r.id,
        kodeRekening: r.kodeRekening,
        namaRekening: r.namaRekening,
        pagu: 0,
        jumlah: String(r.jumlah),
      }));
      setRincianList(rincianDraft);
    } else if (open && !editItem) {
      resetForm();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editItem]);

  const kegiatanList = kegiatanListForEdit;

  const tree = useMemo(() => buildTree(kegiatanList), [kegiatanList]);
  const rekeningList: RekeningKegiatan[] = selKegiatan?.rekeningList ?? [];
  const usedKode = rincianList.map((r) => r.kodeRekening);

  const totalJumlah = rincianList.reduce(
    (sum, r) => sum + (parseFloat(r.jumlah) || 0),
    0
  );

  const adaMelebihi = rincianList.some((r) => parseFloat(r.jumlah) > r.pagu);

  function pilihBidang(b: BidangNode) {
    setSelBidang(b);
    setSelSubBidang(null);
    setSelKegiatan(null);
    setRincianList([]);
  }

  function pilihSubBidang(sb: SubBidangNode) {
    setSelSubBidang(sb);
    setSelKegiatan(null);
    setRincianList([]);
  }

  function pilihKegiatan(k: KegiatanAPBDes) {
    setSelKegiatan(k);
    setRincianList([]);
  }

  function tambahRincian() {
    setRincianList((prev) => [
      ...prev,
      { id: nanoid(8), kodeRekening: "", namaRekening: "", pagu: 0, jumlah: "" },
    ]);
  }

  function ubahRincian(id: string, updated: RincianDraft) {
    setRincianList((prev) => prev.map((r) => (r.id === id ? updated : r)));
  }

  function hapusRincian(id: string) {
    setRincianList((prev) => prev.filter((r) => r.id !== id));
  }

  function resetForm() {
    setJenis("Definitif");
    setMediaPembayaran("bank");
    setTanggal(new Date().toISOString().split("T")[0]);
    setUraian("");
    setRincianList([]);
    setSelBidang(null);
    setSelSubBidang(null);
    setSelKegiatan(null);
  }

  const bisaSubmit =
    selKegiatan !== null &&
    uraian.trim() !== "" &&
    rincianList.length > 0 &&
    rincianList.every((r) => r.kodeRekening !== "" && parseFloat(r.jumlah) > 0);

  async function handleKonfirmasi() {
    if (!selKegiatan) return;
    setKonfirmOpen(false);

    const rincianSPP: Record<string, RincianSPP> = {};
    rincianList.forEach((r) => {
      rincianSPP[r.id] = {
        id: r.id,
        kodeRekening: r.kodeRekening,
        namaRekening: r.namaRekening,
        jumlah: parseFloat(r.jumlah),
      };
    });

    if (editItem) {
      await editSPP.mutateAsync({
        id: editItem.id,
        tanggal,
        jenis,
        mediaPembayaran,
        uraian,
        kegiatanId: selKegiatan.id,
        kegiatanNama: selKegiatan.namaKegiatan,
        rincianSPP,
        totalJumlah,
      });
      toast.success("SPP berhasil diperbarui");
    } else {
      await addSPP.mutateAsync({
        tanggal,
        jenis,
        mediaPembayaran,
        uraian,
        kegiatanId: selKegiatan.id,
        kegiatanNama: selKegiatan.namaKegiatan,
        rincianSPP,
        totalJumlah,
      });
      toast.success("SPP berhasil disimpan");
    }
    resetForm();
    onClose();
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) { resetForm(); onClose(); }
        }}
      >
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 py-3 border-b shrink-0">
            <DialogTitle>{editItem ? "Edit SPP" : "Buat SPP Baru"}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="p-4 space-y-4">

              {/* Media Pembayaran */}
              <div className="space-y-1">
                <Label className="text-xs">Media Pembayaran</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["bank", "tunai"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMediaPembayaran(m)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 transition-colors",
                        mediaPembayaran === m
                          ? "border-teal-600 bg-teal-50 dark:bg-teal-950/30"
                          : "border-border hover:bg-muted/50"
                      )}
                    >
                      {m === "bank"
                        ? <Banknote className={cn("h-4 w-4 shrink-0", mediaPembayaran === m ? "text-teal-600" : "text-muted-foreground")} />
                        : <Wallet className={cn("h-4 w-4 shrink-0", mediaPembayaran === m ? "text-teal-600" : "text-muted-foreground")} />
                      }
                      <span className={cn("text-xs font-semibold", mediaPembayaran === m ? "text-teal-700 dark:text-teal-400" : "text-muted-foreground")}>
                        {m === "bank" ? "Transfer Bank" : "Kas Tunai"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Jenis + Tanggal */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Jenis SPP</Label>
                  <Select value={jenis} onValueChange={(v) => setJenis(v as JenisSPP)}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Definitif">Definitif</SelectItem>
                      <SelectItem value="Panjar">Panjar</SelectItem>
                      <SelectItem value="Pembiayaan">Pembiayaan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tanggal</Label>
                  <Input
                    type="date"
                    className="h-9"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                  />
                </div>
              </div>

              {/* Pilih Kegiatan — dropdown bertahap */}
              <div className="space-y-2">
                <Label className="text-xs">Pilih Kegiatan</Label>

                {/* Langkah 1: Bidang */}
                <Select
                  value={selBidang?.kode ?? ""}
                  onValueChange={(kode) => {
                    const b = tree.find((x) => x.kode === kode);
                    if (b) pilihBidang(b);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="1. Pilih Bidang..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tree.map((b) => (
                      <SelectItem key={b.kode} value={b.kode} className="text-xs">
                        {b.kode}. {b.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Langkah 2: Sub-Bidang */}
                {selBidang && (
                  <Select
                    value={selSubBidang?.kode ?? ""}
                    onValueChange={(kode) => {
                      const sb = selBidang.subBidang.find((x) => x.kode === kode);
                      if (sb) pilihSubBidang(sb);
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="2. Pilih Sub-Bidang..." />
                    </SelectTrigger>
                    <SelectContent>
                      {selBidang.subBidang.map((sb) => (
                        <SelectItem key={sb.kode} value={sb.kode} className="text-xs">
                          {sb.kode} {sb.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Langkah 3: Kegiatan */}
                {selSubBidang && (
                  <Select
                    value={selKegiatan?.id ?? ""}
                    onValueChange={(id) => {
                      const k = selSubBidang.kegiatan.find((x) => x.id === id);
                      if (k) pilihKegiatan(k);
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="3. Pilih Kegiatan..." />
                    </SelectTrigger>
                    <SelectContent>
                      {selSubBidang.kegiatan.map((k) => (
                        <SelectItem key={k.id} value={k.id} className="text-xs">
                          {k.namaKegiatan} — {formatRupiah(k.totalPagu)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Info kegiatan terpilih */}
                {selKegiatan && (
                  <div className="rounded-md border border-teal-200 bg-teal-50 dark:bg-teal-950/30 px-3 py-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-teal-700 dark:text-teal-400 overflow-wrap: break-word">
                        ✓ {selKegiatan.namaKegiatan}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selKegiatan.kodeKegiatan} · Pagu: {formatRupiah(selKegiatan.totalPagu)}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {selKegiatan.status}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Uraian */}
              <div className="space-y-1">
                <Label className="text-xs">Uraian</Label>
                <Input
                  placeholder="Uraian kegiatan / belanja..."
                  value={uraian}
                  onChange={(e) => setUraian(e.target.value)}
                />
              </div>

              <Separator />

              {/* Rincian Rekening */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Rincian Rekening Belanja</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={!selKegiatan || rincianList.length >= rekeningList.length}
                    onClick={tambahRincian}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Tambah Rekening
                  </Button>
                </div>

                {rincianList.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-3 border rounded-md">
                    {selKegiatan
                      ? "Klik \"Tambah Rekening\" untuk menambah rincian belanja"
                      : "Pilih kegiatan terlebih dahulu"}
                  </p>
                )}

                {rincianList.map((r) => (
                  <RincianRowWithRealisasi
                    key={r.id}
                    rincian={r}
                    rekeningList={rekeningList}
                    kegiatanId={selKegiatan?.id ?? ""}
                    usedKode={usedKode}
                    onChange={(updated) => ubahRincian(r.id, updated)}
                    onRemove={() => hapusRincian(r.id)}
                  />
                ))}

                {rincianList.length > 0 && (
                  <div className="flex justify-between items-center pt-1 px-1 font-semibold text-sm border-t">
                    <span>Total SPP</span>
                    <span className="text-teal-600">{formatRupiah(totalJumlah)}</span>
                  </div>
                )}
              </div>

              {/* Tombol aksi */}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => { resetForm(); onClose(); }}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  disabled={!bisaSubmit || addSPP.isPending}
                  onClick={() => setKonfirmOpen(true)}
                >
                  Simpan SPP
                </Button>
              </div>

            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog konfirmasi */}
      <AlertDialog open={konfirmOpen} onOpenChange={setKonfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi SPP</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>{jenis}</strong> — {selKegiatan?.namaKegiatan}
                </p>
                <p className="text-muted-foreground">{uraian}</p>
                <div className="space-y-1 pt-1 border-t">
                  {rincianList.map((r) => (
                    <div key={r.id} className="flex justify-between text-xs gap-2">
                      <span className="text-muted-foreground overflow-wrap: break-word">
                        {r.kodeRekening} {r.namaRekening}
                      </span>
                      <span className="shrink-0">{formatRupiah(parseFloat(r.jumlah) || 0)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>Total</span>
                  <span>{formatRupiah(totalJumlah)}</span>
                </div>
                {adaMelebihi && (
                  <p className="text-destructive text-xs flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Ada rekening yang melebihi sisa pagu!
                  </p>
                )}
              </div>
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
