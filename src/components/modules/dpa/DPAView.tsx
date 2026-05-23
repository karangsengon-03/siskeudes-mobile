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
            className={status === "dikonfirmasi" ? "bg-primary hover:bg-primary/90 shrink-0" : "shrink-0"}
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
          <div className="rounded bg-primary/5 px-2 py-1.5">
            <p className="text-muted-foreground">Total DPA</p>
            <p className={`font-semibold ${melebihi ? "text-red-600" : "text-primary"}`}>
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
                    adaIsi ? "bg-primary/5 border-primary/30" : "bg-muted/20 border-transparent"
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
                    <span className={`text-sm font-medium ${adaIsi ? "text-primary" : "text-muted-foreground"}`}>
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
              <span className={`text-sm font-bold ${melebihi ? "text-red-600" : "text-primary"}`}>
                {formatRupiah(totalDPA)}
              </span>
            </div>
          </div>

          {/* Tombol aksi */}
          <div className="pt-3 pb-4 space-y-2">
            {status === "draft" && (
              <>
                <Button
                  className="w-full bg-primary hover:bg-primary/90"
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

  // Multi-expand state — konsisten dengan BidangKegiatanTree & BelanjaBidangTree
  const [expandedBidang, setExpandedBidang] = useState<Set<string>>(new Set());
  const [expandedSubBidang, setExpandedSubBidang] = useState<Set<string>>(new Set());
  const [selectedKegiatan, setSelectedKegiatan] = useState<KegiatanItem | null>(null);
  // Filter sumber dana
  const [filterSumber, setFilterSumber] = useState<SumberDana | "semua">("semua");

  function toggleBidang(kode: string) {
    setExpandedBidang((prev) => {
      const next = new Set(prev);
      if (next.has(kode)) next.delete(kode); else next.add(kode);
      return next;
    });
  }

  function toggleSubBidang(key: string) {
    setExpandedSubBidang((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

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

  // bidangList removed — treeMap is used directly in JSX

  // Build tree map: bidangKode -> subBidangKode -> kegiatan[]
  const treeMap = useMemo(() => {
    const map = new Map<string, { nama: string; subMap: Map<string, { nama: string; kegiatan: KegiatanItem[] }> }>();
    for (const k of kegiatanList) {
      if (!map.has(k.bidangKode)) map.set(k.bidangKode, { nama: k.bidangNama, subMap: new Map() });
      // reason: map.set() dipanggil di baris sebelumnya, .get() dijamin ada
      const bidang = map.get(k.bidangKode)!;
      if (!bidang.subMap.has(k.subBidangKode)) bidang.subMap.set(k.subBidangKode, { nama: k.subBidangNama, kegiatan: [] });
      // reason: subMap.set() dipanggil di baris sebelumnya, .get() dijamin ada
      bidang.subMap.get(k.subBidangKode)!.kegiatan.push(k);
    }
    return map;
  }, [kegiatanList]);

  // Helper: get kegiatan list for a specific sub-bidang
  function getKegiatan(bidangKode: string, subBidangKode: string): KegiatanItem[] {
    return (treeMap.get(bidangKode)?.subMap.get(subBidangKode)?.kegiatan ?? [])
      .slice()
      .sort((a, b) => a.namaKegiatan.localeCompare(b.namaKegiatan));
  }

  // Reset pilihan jika filter berubah
  const handleFilterSumber = (val: SumberDana | "semua") => {
    setFilterSumber(val);
    setExpandedBidang(new Set());
    setExpandedSubBidang(new Set());
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
      return <span className="w-2 h-2 rounded-full bg-primary/50 shrink-0 inline-block" />;
    if (dpa.totalDPA > 0)
      return <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0 inline-block" />;
    return null;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Filter sumber dana */}
      <div className="shrink-0 px-4 py-2 border-b flex items-center gap-2">
        <span className="text-xs text-muted-foreground shrink-0">Filter:</span>
        <Select value={filterSumber} onValueChange={(v) => handleFilterSumber(v as SumberDana | "semua")}>
          <SelectTrigger className="h-8 text-xs flex-1 min-w-0">
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
          <Badge variant="secondary" className="text-xs shrink-0">
            {kegiatanList.length}
          </Badge>
        )}
      </div>

      {/* 2-panel: kiri accordion, kanan detail */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Panel kiri — accordion multi-expand (konsisten dengan BidangKegiatanTree & BelanjaBidangTree) */}
        <div className="w-44 sm:w-56 shrink-0 border-r flex flex-col overflow-y-auto">
          {treeMap.size === 0 && (
            <p className="text-xs text-muted-foreground px-3 py-4 text-center">
              {filterSumber !== "semua" ? "Tidak ada kegiatan dengan sumber dana ini" : "Belum ada bidang"}
            </p>
          )}
          {Array.from(treeMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([bidangKode, bidangData]) => {
              const isOpenB = expandedBidang.has(bidangKode);
              return (
                <div key={bidangKode}>
                  <button
                    className={`w-full text-left px-3 py-2.5 flex items-center gap-2 border-b border-l-2 transition-colors ${
                      isOpenB
                        ? "bg-primary/5 dark:bg-primary/10 border-l-primary"
                        : "border-l-transparent hover:bg-muted/50"
                    }`}
                    onClick={() => toggleBidang(bidangKode)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-muted-foreground">{bidangKode}</p>
                      <p className="text-xs font-medium leading-snug truncate">{bidangData.nama}</p>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform ${isOpenB ? "rotate-90" : ""}`} />
                  </button>

                  {isOpenB && Array.from(bidangData.subMap.entries())
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([sbKode, sbData]) => {
                      const sbKey = `${bidangKode}|${sbKode}`;
                      const isOpenSB = expandedSubBidang.has(sbKey);
                      const kegiatan = getKegiatan(bidangKode, sbKode);
                      return (
                        <div key={sbKode}>
                          <button
                            className={`w-full text-left pl-5 pr-3 py-2 flex items-center gap-2 border-b border-l-2 transition-colors ${
                              isOpenSB
                                ? "bg-primary/5 dark:bg-primary/5 border-l-primary/70"
                                : "border-l-transparent hover:bg-muted/30"
                            }`}
                            onClick={() => toggleSubBidang(sbKey)}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-muted-foreground font-mono">{sbKode}</p>
                              <p className="text-xs font-medium leading-snug truncate">{sbData.nama}</p>
                            </div>
                            <ChevronRight className={`w-3 h-3 text-muted-foreground shrink-0 transition-transform ${isOpenSB ? "rotate-90" : ""}`} />
                          </button>

                          {isOpenSB && kegiatan.map((k) => {
                            const isSelK = selectedKegiatan?.id === k.id;
                            return (
                              <button
                                key={k.id}
                                className={`w-full text-left pl-8 pr-3 py-2 flex items-start gap-2 border-b border-l-2 transition-colors ${
                                  isSelK
                                    ? "bg-primary/5 dark:bg-primary/10 border-l-primary"
                                    : "border-l-transparent hover:bg-muted/20"
                                }`}
                                onClick={() => setSelectedKegiatan(k)}
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium leading-snug">{k.namaKegiatan}</p>
                                  <p className="text-[10px] text-muted-foreground tabular-nums">{formatRupiah(k.totalPagu ?? 0)}</p>
                                </div>
                                {getKegiatanBadge(k.id)}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })
                  }
                </div>
              );
            })
          }
        </div>


        {/* Panel kanan — detail DPA */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {!selectedKegiatan ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm p-8 text-center">
              <FileText className="w-10 h-10 mb-3 opacity-20" />
              <p>Pilih kegiatan untuk mengisi rencana penarikan dana</p>
            </div>
          ) : (
            <DetailPanel kegiatan={selectedKegiatan} />
          )}
        </div>
      </div>

    </div>
  );
}
