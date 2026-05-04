// src/components/modules/dpa/DPAView.tsx
"use client";

import { useState, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  FileText,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { useAPBDes } from "@/hooks/useAPBDes";
import { useDPA, useSaveDPABulan, useUpdateDPAMeta, useResetDPAKegiatan } from "@/hooks/useDPA";
import { useAppStore } from "@/store/appStore";
import { KegiatanAPBDes, SumberDana } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";

const NAMA_BULAN = [
  "", // index 0 kosong agar index 1=Januari
  "Januari", "Februari", "Maret", "April",
  "Mei", "Juni", "Juli", "Agustus",
  "September", "Oktober", "November", "Desember",
];

// Label sumber dana untuk dropdown filter
const SUMBER_DANA_OPTIONS: { value: SumberDana | "semua"; label: string }[] = [
  { value: "semua", label: "Semua Sumber Dana" },
  { value: "DD",   label: "DD — Dana Desa" },
  { value: "ADD",  label: "ADD — Alokasi Dana Desa" },
  { value: "PAD",  label: "PAD — Pendapatan Asli Daerah" },
  { value: "BHPR", label: "BHPR — Bagi Hasil Pajak/Retribusi" },
  { value: "BKP",  label: "BKP — Bantuan Keuangan Provinsi" },
  { value: "BKK",  label: "BKK — Bantuan Keuangan Kabupaten" },
  { value: "LAIN", label: "LAIN — Lainnya" },
];

interface KegiatanItem extends KegiatanAPBDes {
  id: string;
}

// ─── DetailPanel ──────────────────────────────────────────────────────────────
function DetailPanel({ kegiatan }: { kegiatan: KegiatanItem }) {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const { data: dpaMap } = useDPA();
  const saveBulan = useSaveDPABulan();
  const updateMeta = useUpdateDPAMeta();
  const resetDPA = useResetDPAKegiatan();

  const [konfirmasiReset, setKonfirmasiReset] = useState(false);

  const dpa = dpaMap?.[kegiatan.id];
  const bulanData = dpa?.bulan ?? {};
  const totalDPA = dpa?.totalDPA ?? 0;
  const paguAPBDes = kegiatan.totalPagu ?? 0;
  const sisaPagu = paguAPBDes - totalDPA;
  const melebihi = totalDPA > paguAPBDes;
  const status = dpa?.status ?? "draft";
  const isDPAL = dpa?.isDPAL ?? false;
  const sumberDPAL = dpa?.sumberDPAL ?? "";

  // Sumber dana unik dari rekeningList kegiatan ini
  const sumberDanaKegiatan = useMemo(() => {
    const set = new Set<string>();
    (kegiatan.rekeningList ?? []).forEach((r) => { if (r.sumberDana) set.add(r.sumberDana); });
    return Array.from(set).join(", ") || "—";
  }, [kegiatan.rekeningList]);

  const [inputBulan, setInputBulan] = useState<{ [k: number]: string }>(() => {
    const init: { [k: number]: string } = {};
    for (let i = 1; i <= 12; i++) {
      init[i] = bulanData[i]?.jumlah ? String(bulanData[i].jumlah) : "";
    }
    return init;
  });

  useMemo(() => {
    setInputBulan(() => {
      const init: { [k: number]: string } = {};
      for (let i = 1; i <= 12; i++) {
        init[i] = bulanData[i]?.jumlah ? String(bulanData[i].jumlah) : "";
      }
      return init;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dpaMap, kegiatan.id]);

  const tahunOptions = useMemo(() => {
    const now = parseInt(String(tahun));
    return Array.from({ length: 5 }, (_, i) => String(now - 1 - i));
  }, [tahun]);

  const handleBlurBulan = async (bulanKe: number) => {
    if (status === "dikonfirmasi") return;
    const raw = inputBulan[bulanKe];
    const jumlah = parseFloat(raw) || 0;
    const existing = bulanData[bulanKe]?.jumlah ?? 0;
    if (jumlah === existing) return;
    try {
      await saveBulan.mutateAsync({ kegiatanId: kegiatan.id, bulanKe, jumlah });
    } catch {
      toast.error("Gagal menyimpan isian bulan, coba lagi");
    }
  };

  const handleKonfirmasi = async () => {
    if (totalDPA === 0) { toast.error("Isi minimal 1 bulan sebelum dikonfirmasi"); return; }
    if (melebihi) { toast.error("Total DPA melebihi pagu APBDes"); return; }
    try {
      await updateMeta.mutateAsync({ kegiatanId: kegiatan.id, status: "dikonfirmasi" });
      toast.success("DPA dikonfirmasi");
    } catch {
      toast.error("Gagal mengkonfirmasi DPA, coba lagi");
    }
  };

  const handleBukaKembali = async () => {
    try {
      await updateMeta.mutateAsync({ kegiatanId: kegiatan.id, status: "draft" });
      toast.success("DPA dibuka kembali ke draft");
    } catch {
      toast.error("Gagal membuka DPA, coba lagi");
    }
  };

  const handleToggleDPAL = async (val: boolean) => {
    try {
      await updateMeta.mutateAsync({
        kegiatanId: kegiatan.id,
        isDPAL: val,
        sumberDPAL: val ? sumberDPAL || String(parseInt(String(tahun)) - 1) : "",
      });
    } catch {
      toast.error("Gagal mengubah status DPA-L, coba lagi");
    }
  };

  const handleSumberDPAL = async (val: string) => {
    try {
      await updateMeta.mutateAsync({ kegiatanId: kegiatan.id, sumberDPAL: val });
    } catch {
      toast.error("Gagal menyimpan sumber DPA-L");
    }
  };

  const handleResetDPA = async () => {
    setKonfirmasiReset(false);
    try {
      await resetDPA.mutateAsync({ kegiatanId: kegiatan.id });
      toast.success("Data DPA direset. Semua isian bulan dihapus.");
    } catch {
      toast.error("Gagal mereset DPA, coba lagi");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header kegiatan */}
      <div className="px-4 py-3 border-b bg-muted/10 space-y-2 shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground">
              {kegiatan.bidangKode} — {kegiatan.subBidangNama}
            </p>
            <p className="font-semibold text-sm leading-snug mt-0.5">
              {kegiatan.namaKegiatan}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {kegiatan.kodeKegiatan} · Sumber: {sumberDanaKegiatan}
            </p>
          </div>
          <Badge
            variant={status === "dikonfirmasi" ? "default" : "secondary"}
            className={status === "dikonfirmasi" ? "bg-teal-600 hover:bg-teal-700 shrink-0" : "shrink-0"}
          >
            {status === "dikonfirmasi" ? "Dikonfirmasi" : "Draft"}
          </Badge>
        </div>

        {/* Pagu vs DPA vs Sisa */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="rounded bg-blue-50 px-2 py-1.5">
            <p className="text-muted-foreground">Pagu APBDes</p>
            <p className="font-semibold text-blue-700">{formatRupiah(paguAPBDes)}</p>
          </div>
          <div className="rounded bg-teal-50 px-2 py-1.5">
            <p className="text-muted-foreground">Total DPA</p>
            <p className={`font-semibold ${melebihi ? "text-red-600" : "text-teal-700"}`}>
              {formatRupiah(totalDPA)}
            </p>
          </div>
          <div className={`rounded px-2 py-1.5 ${melebihi ? "bg-red-50" : "bg-green-50"}`}>
            <p className="text-muted-foreground">Sisa Pagu</p>
            <p className={`font-semibold ${melebihi ? "text-red-600" : "text-green-700"}`}>
              {formatRupiah(sisaPagu)}
            </p>
          </div>
        </div>

        {melebihi && (
          <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 rounded px-2 py-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            Total DPA melebihi pagu APBDes sebesar {formatRupiah(Math.abs(sisaPagu))}
          </div>
        )}
      </div>

      {/* DPAL */}
      <div className="px-4 py-2.5 border-b flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2 flex-1">
          <Switch
            id="dpal-switch"
            checked={isDPAL}
            onCheckedChange={handleToggleDPAL}
            disabled={status === "dikonfirmasi"}
          />
          <Label htmlFor="dpal-switch" className="text-sm cursor-pointer">
            DPAL (Kegiatan Lanjutan)
          </Label>
        </div>
        {isDPAL && (
          <Select
            value={sumberDPAL}
            onValueChange={handleSumberDPAL}
            disabled={status === "dikonfirmasi"}
          >
            <SelectTrigger className="w-28 h-7 text-xs">
              <SelectValue placeholder="Tahun" />
            </SelectTrigger>
            <SelectContent>
              {tahunOptions.map((t) => (
                <SelectItem key={t} value={t} className="text-xs">TA {t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Grid 12 bulan */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-4 py-3 pb-24">
          <p className="text-xs text-muted-foreground mb-3">
            Isi jumlah rencana penarikan dana per bulan. Kosongkan jika tidak ada penarikan pada bulan tersebut.
          </p>
          <div className="space-y-1.5">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((bulanKe) => {
              const jumlahBulan = parseFloat(inputBulan[bulanKe]) || 0;
              const adaIsi = jumlahBulan > 0;
              return (
                <div
                  key={bulanKe}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 border transition-colors ${
                    adaIsi ? "bg-teal-50/60 border-teal-200" : "bg-muted/20 border-transparent"
                  }`}
                >
                  <div className="w-24 shrink-0">
                    <span className="text-xs font-mono text-muted-foreground">
                      {String(bulanKe).padStart(2, "0")}
                    </span>
                    <span className="text-sm font-medium ml-2">{NAMA_BULAN[bulanKe]}</span>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    value={inputBulan[bulanKe]}
                    onChange={(e) =>
                      setInputBulan((prev) => ({ ...prev, [bulanKe]: e.target.value }))
                    }
                    onBlur={() => handleBlurBulan(bulanKe)}
                    disabled={status === "dikonfirmasi"}
                    placeholder="0"
                    className="h-8 text-sm flex-1"
                  />
                  <div className="w-36 text-right shrink-0">
                    <span className={`text-sm font-medium ${adaIsi ? "text-teal-700" : "text-muted-foreground"}`}>
                      {adaIsi ? formatRupiah(jumlahBulan) : "—"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total row */}
          <div className="mt-3 flex items-center gap-3 rounded-lg px-3 py-2.5 bg-muted border">
            <div className="w-24 shrink-0 text-sm font-semibold">Total</div>
            <div className="flex-1" />
            <div className="w-36 text-right">
              <span className={`text-sm font-bold ${melebihi ? "text-red-600" : "text-teal-700"}`}>
                {formatRupiah(totalDPA)}
              </span>
            </div>
          </div>

          {/* Tombol aksi */}
          <div className="pt-3 pb-4 space-y-2">
            {status === "draft" && (
              <>
                <Button
                  className="w-full bg-teal-600 hover:bg-teal-700"
                  size="sm"
                  onClick={handleKonfirmasi}
                  disabled={updateMeta.isPending}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Konfirmasi DPA
                </Button>
                {/* B2 — Tombol Reset: hanya muncul jika ada data bulan */}
                {totalDPA > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-destructive hover:text-destructive border-destructive/40 hover:border-destructive"
                    onClick={() => setKonfirmasiReset(true)}
                    disabled={resetDPA.isPending}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    Reset Semua Isian Bulan
                  </Button>
                )}
              </>
            )}
            {status === "dikonfirmasi" && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleBukaKembali}
                disabled={updateMeta.isPending}
              >
                Buka Kembali ke Draft
              </Button>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Dialog konfirmasi reset */}
      <AlertDialog open={konfirmasiReset} onOpenChange={setKonfirmasiReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset semua isian DPA?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua data rencana penarikan per bulan untuk kegiatan{" "}
              <strong>{kegiatan.namaKegiatan}</strong> akan dihapus dan total DPA dikembalikan ke nol.
              Aksi ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetDPA}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ya, Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── DPAView (Miller Column + filter sumber dana) ─────────────────────────────
export function DPAView() {
  const { data: apbdesData, isLoading: loadingAPBDes } = useAPBDes();
  const { data: dpaMap, isLoading: loadingDPA } = useDPA();

  const [selectedBidang, setSelectedBidang] = useState<string | null>(null);
  const [selectedSubBidang, setSelectedSubBidang] = useState<string | null>(null);
  const [selectedKegiatan, setSelectedKegiatan] = useState<KegiatanItem | null>(null);
  // C — Filter sumber dana
  const [filterSumber, setFilterSumber] = useState<SumberDana | "semua">("semua");

  const kegiatanAll: KegiatanItem[] = useMemo(() => {
    if (!apbdesData?.belanja) return [];
    const belanja = apbdesData.belanja;
    if (Array.isArray(belanja)) return belanja.map((k) => k as KegiatanItem);
    return Object.entries(belanja).map(([entryId, k]) => ({
      ...(k as KegiatanAPBDes),
      id: entryId,
    }));
  }, [apbdesData]);

  // C — Filter kegiatan berdasarkan sumber dana (cek di rekeningList)
  const kegiatanList = useMemo(() => {
    if (filterSumber === "semua") return kegiatanAll;
    return kegiatanAll.filter((k) =>
      (k.rekeningList ?? []).some((r) => r.sumberDana === filterSumber)
    );
  }, [kegiatanAll, filterSumber]);

  const bidangList = useMemo(() => {
    const map = new Map<string, string>();
    kegiatanList.forEach((k) => {
      if (!map.has(k.bidangKode)) map.set(k.bidangKode, k.bidangNama);
    });
    return Array.from(map.entries())
      .map(([kode, nama]) => ({ kode, nama }))
      .sort((a, b) => a.kode.localeCompare(b.kode));
  }, [kegiatanList]);

  const subBidangList = useMemo(() => {
    if (!selectedBidang) return [];
    const map = new Map<string, string>();
    kegiatanList
      .filter((k) => k.bidangKode === selectedBidang)
      .forEach((k) => {
        if (!map.has(k.subBidangKode)) map.set(k.subBidangKode, k.subBidangNama);
      });
    return Array.from(map.entries())
      .map(([kode, nama]) => ({ kode, nama }))
      .sort((a, b) => a.kode.localeCompare(b.kode));
  }, [kegiatanList, selectedBidang]);

  const filteredKegiatan = useMemo(() => {
    if (!selectedSubBidang) return [];
    return kegiatanList
      .filter((k) => k.bidangKode === selectedBidang && k.subBidangKode === selectedSubBidang)
      .sort((a, b) => a.namaKegiatan.localeCompare(b.namaKegiatan));
  }, [kegiatanList, selectedBidang, selectedSubBidang]);

  // Reset pilihan jika filter berubah menyebabkan kegiatan terpilih tidak ada
  const handleFilterSumber = (val: SumberDana | "semua") => {
    setFilterSumber(val);
    setSelectedBidang(null);
    setSelectedSubBidang(null);
    setSelectedKegiatan(null);
  };

  const isLoading = loadingAPBDes || loadingDPA;

  if (isLoading) {
    return (
      <div className="flex gap-2 p-4 h-full">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-1 space-y-2">
            <Skeleton className="h-8 w-full" />
            {Array.from({ length: 6 }).map((_, j) => (
              <Skeleton key={j} className="h-10 w-full" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (kegiatanAll.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
        <FileText className="w-12 h-12 mb-3 opacity-20" />
        <p className="font-medium">Belum ada kegiatan APBDes</p>
        <p className="text-sm mt-1">Tambahkan kegiatan belanja di menu APBDes terlebih dahulu.</p>
      </div>
    );
  }

  const getKegiatanBadge = (kegiatanId: string) => {
    const dpa = dpaMap?.[kegiatanId];
    if (!dpa) return null;
    if (dpa.status === "dikonfirmasi")
      return <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0 inline-block" />;
    if (dpa.totalDPA > 0)
      return <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0 inline-block" />;
    return null;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* C — Filter sumber dana (bar atas) */}
      <div className="shrink-0 px-4 py-2 border-b flex items-center gap-2">
        <span className="text-xs text-muted-foreground shrink-0">Filter:</span>
        <Select value={filterSumber} onValueChange={(v) => handleFilterSumber(v as SumberDana | "semua")}>
          <SelectTrigger className="h-8 text-xs w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUMBER_DANA_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filterSumber !== "semua" && (
          <Badge variant="secondary" className="text-xs">
            {kegiatanList.length} kegiatan ditemukan
          </Badge>
        )}
      </div>

      <div className="flex flex-1 overflow-x-auto overflow-y-hidden min-h-0">
        <div className="flex h-full min-w-max">
          {/* Kolom 1 — Bidang */}
          <div className="w-56 shrink-0 border-r flex flex-col h-full">
            <div className="text-xs font-semibold text-muted-foreground px-3 py-2 bg-muted/20 border-b">BIDANG</div>
            <ScrollArea className="flex-1 min-h-0">
              {bidangList.length === 0 && (
                <p className="text-xs text-muted-foreground px-3 py-4 text-center">
                  {filterSumber !== "semua" ? "Tidak ada kegiatan dengan sumber dana ini" : "Belum ada bidang"}
                </p>
              )}
              {bidangList.map((b) => (
                <button
                  key={b.kode}
                  className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 border-l-2 transition-colors ${
                    selectedBidang === b.kode
                      ? "bg-teal-50 border-l-teal-600 text-teal-900"
                      : "border-l-transparent hover:bg-muted/50"
                  }`}
                  onClick={() => {
                    setSelectedBidang(b.kode);
                    setSelectedSubBidang(null);
                    setSelectedKegiatan(null);
                  }}
                >
                  <span className="font-mono text-xs text-muted-foreground w-8 shrink-0">{b.kode}</span>
                  <span className="flex-1 leading-snug">{b.nama}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </button>
              ))}
            </ScrollArea>
          </div>

          {/* Kolom 2 — Sub-Bidang */}
          <div className="w-56 shrink-0 border-r flex flex-col h-full">
            <div className="text-xs font-semibold text-muted-foreground px-3 py-2 bg-muted/20 border-b">SUB BIDANG</div>
            <ScrollArea className="flex-1 min-h-0">
              {!selectedBidang ? (
                <p className="text-xs text-muted-foreground px-3 py-4">Pilih bidang dahulu</p>
              ) : subBidangList.length === 0 ? (
                <p className="text-xs text-muted-foreground px-3 py-4">Tidak ada sub-bidang</p>
              ) : (
                subBidangList.map((sb) => (
                  <button
                    key={sb.kode}
                    className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 border-l-2 transition-colors ${
                      selectedSubBidang === sb.kode
                        ? "bg-teal-50 border-l-teal-600 text-teal-900"
                        : "border-l-transparent hover:bg-muted/50"
                    }`}
                    onClick={() => {
                      setSelectedSubBidang(sb.kode);
                      setSelectedKegiatan(null);
                    }}
                  >
                    <span className="font-mono text-xs text-muted-foreground w-8 shrink-0">{sb.kode}</span>
                    <span className="flex-1 leading-snug">{sb.nama}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  </button>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Kolom 3 — Kegiatan */}
          <div className="w-64 shrink-0 border-r flex flex-col h-full">
            <div className="text-xs font-semibold text-muted-foreground px-3 py-2 bg-muted/20 border-b">KEGIATAN</div>
            <ScrollArea className="flex-1 min-h-0">
              {!selectedSubBidang ? (
                <p className="text-xs text-muted-foreground px-3 py-4">Pilih sub-bidang dahulu</p>
              ) : filteredKegiatan.length === 0 ? (
                <p className="text-xs text-muted-foreground px-3 py-4">Tidak ada kegiatan</p>
              ) : (
                filteredKegiatan.map((k) => {
                  const dpa = dpaMap?.[k.id];
                  const melebihi = dpa && k.totalPagu > 0 && dpa.totalDPA > k.totalPagu;
                  // C — Tampilkan badge sumber dana di setiap kegiatan
                  const sumberSet = new Set((k.rekeningList ?? []).map((r) => r.sumberDana).filter(Boolean));
                  const sumberList = Array.from(sumberSet).join(", ");
                  return (
                    <button
                      key={k.id}
                      className={`w-full text-left px-3 py-2.5 text-sm flex items-start gap-2 border-l-2 transition-colors ${
                        selectedKegiatan?.id === k.id
                          ? "bg-teal-50 border-l-teal-600 text-teal-900"
                          : "border-l-transparent hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedKegiatan(k)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="leading-snug font-medium truncate">{k.namaKegiatan}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Pagu: {formatRupiah(k.totalPagu ?? 0)}
                        </p>
                        {sumberList && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">{sumberList}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0 pt-0.5">
                        {getKegiatanBadge(k.id)}
                        {melebihi && <AlertTriangle className="w-3 h-3 text-red-500" />}
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                    </button>
                  );
                })
              )}
            </ScrollArea>
            {selectedSubBidang && filteredKegiatan.length > 0 && (
              <div className="px-3 py-2 border-t text-xs text-muted-foreground space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" /> Dikonfirmasi
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Draft (ada isian)
                </div>
              </div>
            )}
          </div>

          {/* Kolom 4 — Detail */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="text-xs font-semibold text-muted-foreground px-3 py-2 bg-muted/20 border-b">
              RENCANA PENARIKAN DANA PER BULAN
            </div>
            {!selectedKegiatan ? (
              <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground text-sm p-8 text-center">
                <FileText className="w-10 h-10 mb-3 opacity-20" />
                <p>Pilih kegiatan untuk mengisi rencana penarikan dana</p>
              </div>
            ) : (
              <DetailPanel kegiatan={selectedKegiatan} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
