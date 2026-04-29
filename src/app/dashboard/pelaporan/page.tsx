"use client";

// src/app/dashboard/pelaporan/page.tsx
// Generate PDF laporan keuangan — preview dulu di modal, baru download

import { useState, useCallback, useEffect, useRef } from "react";
import { useDataLaporan } from "@/hooks/usePelaporan";
import { useAppStore } from "@/store/appStore";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  FileDown, Loader2, FileText, BarChart3, BookOpen,
  Wallet, Receipt, Eye, X, Download,
} from "lucide-react";

const BULAN_OPTS = [
  { value: "0",  label: "Semua Bulan" },
  { value: "1",  label: "Januari" },
  { value: "2",  label: "Februari" },
  { value: "3",  label: "Maret" },
  { value: "4",  label: "April" },
  { value: "5",  label: "Mei" },
  { value: "6",  label: "Juni" },
  { value: "7",  label: "Juli" },
  { value: "8",  label: "Agustus" },
  { value: "9",  label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

// ─── PDF Preview Modal ────────────────────────────────────────────────────────

interface PDFPreviewModalProps {
  blobUrl: string;
  filename: string;
  onClose: () => void;
}

function PDFPreviewModal({ blobUrl, filename, onClose }: PDFPreviewModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Tutup modal saat klik overlay (luar iframe)
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  }, [onClose]);

  // Tutup modal saat tekan Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleDownload = useCallback(() => {
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [blobUrl, filename]);

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex flex-col bg-black/70 backdrop-blur-sm"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-card border-b border-border shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-medium truncate">{filename}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
          >
            <X className="h-4 w-4" />
            Tutup
          </button>
        </div>
      </div>

      {/* PDF iframe */}
      <div className="flex-1 overflow-hidden p-3">
        <iframe
          src={blobUrl}
          className="w-full h-full rounded-md border border-border bg-white"
          title={filename}
        />
      </div>
    </div>
  );
}

// ─── Preview button ───────────────────────────────────────────────────────────

interface PreviewBtnProps {
  label: string;
  onPreview: () => Promise<{ blobUrl: string; filename: string }>;
}

function PreviewBtn({ label, onPreview }: PreviewBtnProps) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ blobUrl: string; filename: string } | null>(null);

  // Revoke blob URL saat modal ditutup untuk hindari memory leak
  const handleClose = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview.blobUrl);
      setPreview(null);
    }
  }, [preview]);

  const handleClick = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await onPreview();
      setPreview(result);
    } catch (err) {
      console.error("PDF error:", err);
      alert("Gagal generate PDF. Coba lagi.\n" + String(err));
    } finally {
      setLoading(false);
    }
  }, [loading, onPreview]);

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed w-full"
      >
        {loading
          ? <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          : <Eye className="h-4 w-4 shrink-0 text-primary" />}
        <span className="text-left leading-tight">
          {loading ? "Menyiapkan PDF..." : label}
        </span>
      </button>

      {preview && (
        <PDFPreviewModal
          blobUrl={preview.blobUrl}
          filename={preview.filename}
          onClose={handleClose}
        />
      )}
    </>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────

function LaporanCard({
  icon, title, children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <span className="text-primary">{icon}</span>
        <h2 className="font-semibold text-sm">{title}</h2>
      </div>
      <div className="grid grid-cols-1 gap-2">{children}</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PelaporanPage() {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const [bulanStr, setBulanStr] = useState("0");
  const bulan = bulanStr === "0" ? undefined : parseInt(bulanStr);
  const bulanLabel = BULAN_OPTS.find((o) => o.value === bulanStr)?.label ?? "Semua Bulan";

  const {
    isLoading, dataDesa,
    pendapatanList, belanjaList, pembiayaanList,
    dpaMap, bkuAll,
    bukuBank, bukuKasTunai, bukuPajak, bukuPajakRekap, bukuPanjar,
    dicairkanSPP, realisasiPerRekening, realisasiPerKegiatan,
  } = useDataLaporan(bulan);

  const suffix = bulan
    ? `_${bulanLabel.replace(/ /g, "-")}_${tahun}`
    : `_${tahun}`;
  const desaNama = (dataDesa?.namaDesa ?? "Desa").replace(/ /g, "-");

  // Helper: generate blob URL (bukan auto-download)
  const makePDFBlob = useCallback(
    (fnName: string, filename: string, extraProps?: Record<string, unknown>) =>
      async (): Promise<{ blobUrl: string; filename: string }> => {
        const mod = await import("@/lib/generatePDF");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fn = (mod as any)[fnName];
        if (typeof fn !== "function") throw new Error(`PDF function "${fnName}" not found`);
        // Panggil fungsi dengan returnBlob: true agar tidak auto doc.save()
        const blob: Blob = await fn({ tahun, dataDesa, ...extraProps }, true);
        const blobUrl = URL.createObjectURL(blob);
        return { blobUrl, filename };
      },
    [tahun, dataDesa]
  );

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header + filter bulan */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-base font-semibold">Pelaporan</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Preview PDF laporan keuangan — Tahun {tahun}
          </p>
        </div>
        <Select value={bulanStr} onValueChange={setBulanStr}>
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BULAN_OPTS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── APBDes ── */}
      <LaporanCard icon={<FileText className="h-4 w-4" />} title="APBDes">
        <PreviewBtn
          label="APBDes Global (Pendapatan, Belanja, Pembiayaan)"
          onPreview={makePDFBlob("downloadPDF_APBDesGlobal",
            `APBDes-Global_${desaNama}_${tahun}.pdf`,
            { pendapatanList, belanjaList, pembiayaanList })}
        />
        <PreviewBtn
          label="APBDes Per Kegiatan (Anggaran & Realisasi)"
          onPreview={makePDFBlob("downloadPDF_APBDesPerKegiatan",
            `APBDes-PerKegiatan_${desaNama}${suffix}.pdf`,
            { belanjaList, realisasiPerRekening })}
        />
        <PreviewBtn
          label="APBDes Rinci (RAB per Sub Item)"
          onPreview={makePDFBlob("downloadPDF_APBDesRinci",
            `APBDes-Rinci_${desaNama}_${tahun}.pdf`,
            { belanjaList })}
        />
      </LaporanCard>

      {/* ── DPA ── */}
      <LaporanCard icon={<BarChart3 className="h-4 w-4" />} title="DPA">
        <PreviewBtn
          label="DPA Per Kegiatan (Rencana Kas 12 Bulan)"
          onPreview={makePDFBlob("downloadPDF_DPAPerKegiatan",
            `DPA-PerKegiatan_${desaNama}_${tahun}.pdf`,
            { belanjaList, dpaMap })}
        />
      </LaporanCard>

      {/* ── BKU ── */}
      <LaporanCard icon={<BookOpen className="h-4 w-4" />} title="Buku Kas Umum (BKU)">
        <PreviewBtn
          label={`BKU — ${bulanLabel} ${tahun}`}
          onPreview={makePDFBlob("downloadPDF_BKUBulanan",
            `BKU_${desaNama}${suffix}.pdf`,
            { bkuList: bkuAll, bulan })}
        />
      </LaporanCard>

      {/* ── Buku Pembantu ── */}
      <LaporanCard icon={<Wallet className="h-4 w-4" />} title="Buku Pembantu">
        <PreviewBtn
          label={`Buku Pembantu Kas Tunai — ${bulanLabel}`}
          onPreview={makePDFBlob("downloadPDF_BukuKasTunai",
            `BukuKasTunai_${desaNama}${suffix}.pdf`,
            { rows: bukuKasTunai, bulan })}
        />
        <PreviewBtn
          label={`Buku Pembantu Bank — ${bulanLabel}`}
          onPreview={makePDFBlob("downloadPDF_BukuBank",
            `BukuBank_${desaNama}${suffix}.pdf`,
            { rows: bukuBank, bulan })}
        />
        <PreviewBtn
          label={`Buku Pembantu Pajak — ${bulanLabel}`}
          onPreview={makePDFBlob("downloadPDF_BukuPajak",
            `BukuPajak_${desaNama}${suffix}.pdf`,
            { rows: bukuPajak, bulan })}
        />
        <PreviewBtn
          label={`Rekapitulasi Pajak — ${bulanLabel}`}
          onPreview={makePDFBlob("downloadPDF_BukuPajakRekap",
            `RekapPajak_${desaNama}${suffix}.pdf`,
            { rows: bukuPajakRekap, bulan })}
        />
        <PreviewBtn
          label={`Buku Pembantu Panjar — ${bulanLabel}`}
          onPreview={makePDFBlob("downloadPDF_BukuPanjar",
            `BukuPanjar_${desaNama}${suffix}.pdf`,
            { rows: bukuPanjar, bulan })}
        />
      </LaporanCard>

      {/* ── Realisasi ── */}
      <LaporanCard icon={<Receipt className="h-4 w-4" />} title="Laporan Realisasi">
        <PreviewBtn
          label="Realisasi APBDes Semester I (Jan–Jun)"
          onPreview={makePDFBlob("downloadPDF_RealisasiSemesterI",
            `RealisasiSemesterI_${desaNama}_${tahun}.pdf`,
            { belanjaList, dicairkanSPP, realisasiPerKegiatan })}
        />
      </LaporanCard>

      <p className="text-xs text-muted-foreground text-center pb-2">
        Filter bulan hanya mempengaruhi BKU &amp; Buku Pembantu.
        APBDes, DPA, dan Realisasi Semester I selalu tampil data penuh.
      </p>
    </div>
  );
}
