"use client";

// src/app/dashboard/pelaporan/page.tsx
// Session 8 fix — PDF hanya dibuat saat tombol diklik (lazy), bukan saat render

import { useState, useCallback } from "react";
import { useDataLaporan } from "@/hooks/usePelaporan";
import { useAppStore } from "@/store/appStore";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown, Loader2, FileText, BarChart3, BookOpen, Wallet, Receipt } from "lucide-react";

const BULAN_OPTS = [
  { value: "0", label: "Semua Bulan" },
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Maret" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Juni" },
  { value: "7", label: "Juli" },
  { value: "8", label: "Agustus" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

// ─── Tombol download — PDF dibuat HANYA saat diklik ──────────────
interface DownloadBtnProps {
  label: string;
  filename: string;
  // Factory function — dipanggil saat klik, bukan saat render
  makeDocument: () => Promise<React.ReactElement>;
}

function DownloadBtn({ label, filename, makeDocument }: DownloadBtnProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      // Import @react-pdf/renderer hanya saat klik
      const { pdf } = await import("@react-pdf/renderer");
      const doc = await makeDocument();
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF error:", err);
      alert("Gagal generate PDF. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [loading, makeDocument, filename]);

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed w-full"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
      ) : (
        <FileDown className="h-4 w-4 shrink-0 text-primary" />
      )}
      <span className="text-left leading-tight">{loading ? "Menyiapkan PDF..." : label}</span>
    </button>
  );
}

function LaporanCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
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

export default function PelaporanPage() {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const [bulanStr, setBulanStr] = useState("0");
  const bulan = bulanStr === "0" ? undefined : parseInt(bulanStr);
  const bulanLabel = BULAN_OPTS.find((o) => o.value === bulanStr)?.label ?? "Semua Bulan";

  const {
    isLoading,
    dataDesa,
    pendapatanList,
    belanjaList,
    pembiayaanList,
    dpaMap,
    bkuAll,
    bukuBank,
    bukuKasTunai,
    bukuPajak,
    bukuPajakRekap,
    bukuPanjar,
    dicairkanSPP,
    realisasiPerRekening,
    realisasiPerKegiatan,
  } = useDataLaporan(bulan);

  const suffix = bulan ? `_${bulanLabel.replace(/ /g, "-")}_${tahun}` : `_${tahun}`;
  const desaNama = (dataDesa?.namaDesa ?? "Desa").replace(/ /g, "-");

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
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-base font-semibold">Pelaporan</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Generate PDF laporan keuangan — Tahun {tahun}</p>
        </div>
        <Select value={bulanStr} onValueChange={setBulanStr}>
          <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {BULAN_OPTS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* ── APBDes ── */}
      <LaporanCard icon={<FileText className="h-4 w-4" />} title="APBDes">
        <DownloadBtn
          label="APBDes Global (Pendapatan, Belanja, Pembiayaan)"
          filename={`APBDes-Global_${desaNama}_${tahun}.pdf`}
          makeDocument={async () => {
            const { PDFAPBDesGlobal } = await import("@/components/modules/pelaporan/PDFAPBDesGlobal");
            return <PDFAPBDesGlobal tahun={tahun} dataDesa={dataDesa} pendapatanList={pendapatanList} belanjaList={belanjaList} pembiayaanList={pembiayaanList} />;
          }}
        />
        <DownloadBtn
          label="APBDes Per Kegiatan (Anggaran & Realisasi)"
          filename={`APBDes-PerKegiatan_${desaNama}${suffix}.pdf`}
          makeDocument={async () => {
            const { PDFAPBDesPerKegiatan } = await import("@/components/modules/pelaporan/PDFAPBDesPerKegiatan");
            return <PDFAPBDesPerKegiatan tahun={tahun} dataDesa={dataDesa} belanjaList={belanjaList} realisasiPerRekening={realisasiPerRekening} />;
          }}
        />
        <DownloadBtn
          label="APBDes Rinci (RAB per Sub Item)"
          filename={`APBDes-Rinci_${desaNama}_${tahun}.pdf`}
          makeDocument={async () => {
            const { PDFAPBDesRinci } = await import("@/components/modules/pelaporan/PDFAPBDesRinci");
            return <PDFAPBDesRinci tahun={tahun} dataDesa={dataDesa} belanjaList={belanjaList} />;
          }}
        />
      </LaporanCard>

      {/* ── DPA ── */}
      <LaporanCard icon={<BarChart3 className="h-4 w-4" />} title="DPA">
        <DownloadBtn
          label="DPA Per Kegiatan (Rencana Kas 12 Bulan)"
          filename={`DPA-PerKegiatan_${desaNama}_${tahun}.pdf`}
          makeDocument={async () => {
            const { PDFDPAPerKegiatan } = await import("@/components/modules/pelaporan/PDFDPAPerKegiatan");
            return <PDFDPAPerKegiatan tahun={tahun} dataDesa={dataDesa} belanjaList={belanjaList} dpaMap={dpaMap} />;
          }}
        />
      </LaporanCard>

      {/* ── BKU ── */}
      <LaporanCard icon={<BookOpen className="h-4 w-4" />} title="Buku Kas Umum (BKU)">
        <DownloadBtn
          label={`BKU — ${bulanLabel} ${tahun}`}
          filename={`BKU_${desaNama}${suffix}.pdf`}
          makeDocument={async () => {
            const { PDFBKUBulanan } = await import("@/components/modules/pelaporan/PDFBKUBulanan");
            return <PDFBKUBulanan tahun={tahun} dataDesa={dataDesa} bkuList={bkuAll} bulan={bulan} />;
          }}
        />
      </LaporanCard>

      {/* ── Buku Pembantu ── */}
      <LaporanCard icon={<Wallet className="h-4 w-4" />} title="Buku Pembantu">
        <DownloadBtn
          label={`Buku Pembantu Kas Tunai — ${bulanLabel}`}
          filename={`BukuKasTunai_${desaNama}${suffix}.pdf`}
          makeDocument={async () => {
            const { PDFBukuKasTunai } = await import("@/components/modules/pelaporan/PDFBukuKasTunai");
            return <PDFBukuKasTunai tahun={tahun} dataDesa={dataDesa} rows={bukuKasTunai} bulan={bulan} />;
          }}
        />
        <DownloadBtn
          label={`Buku Pembantu Bank — ${bulanLabel}`}
          filename={`BukuBank_${desaNama}${suffix}.pdf`}
          makeDocument={async () => {
            const { PDFBukuBank } = await import("@/components/modules/pelaporan/PDFBukuBank");
            return <PDFBukuBank tahun={tahun} dataDesa={dataDesa} rows={bukuBank} bulan={bulan} />;
          }}
        />
        <DownloadBtn
          label={`Buku Pembantu Pajak — ${bulanLabel}`}
          filename={`BukuPajak_${desaNama}${suffix}.pdf`}
          makeDocument={async () => {
            const { PDFBukuPajak } = await import("@/components/modules/pelaporan/PDFBukuPajak");
            return <PDFBukuPajak tahun={tahun} dataDesa={dataDesa} rows={bukuPajak} bulan={bulan} />;
          }}
        />
        <DownloadBtn
          label={`Rekapitulasi Pajak — ${bulanLabel}`}
          filename={`RekapPajak_${desaNama}${suffix}.pdf`}
          makeDocument={async () => {
            const { PDFBukuPajakRekap } = await import("@/components/modules/pelaporan/PDFBukuPajakRekap");
            return <PDFBukuPajakRekap tahun={tahun} dataDesa={dataDesa} rows={bukuPajakRekap} bulan={bulan} />;
          }}
        />
        <DownloadBtn
          label={`Buku Pembantu Panjar — ${bulanLabel}`}
          filename={`BukuPanjar_${desaNama}${suffix}.pdf`}
          makeDocument={async () => {
            const { PDFBukuPanjar } = await import("@/components/modules/pelaporan/PDFBukuPanjar");
            return <PDFBukuPanjar tahun={tahun} dataDesa={dataDesa} rows={bukuPanjar} bulan={bulan} />;
          }}
        />
      </LaporanCard>

      {/* ── Realisasi ── */}
      <LaporanCard icon={<Receipt className="h-4 w-4" />} title="Laporan Realisasi">
        <DownloadBtn
          label="Realisasi APBDes Semester I (Jan–Jun)"
          filename={`RealisasiSemesterI_${desaNama}_${tahun}.pdf`}
          makeDocument={async () => {
            const { PDFRealisasiSemesterI } = await import("@/components/modules/pelaporan/PDFRealisasiSemesterI");
            return <PDFRealisasiSemesterI tahun={tahun} dataDesa={dataDesa} belanjaList={belanjaList} dicairkanSPP={dicairkanSPP} realisasiPerKegiatan={realisasiPerKegiatan} />;
          }}
        />
      </LaporanCard>

      <p className="text-xs text-muted-foreground text-center pb-2">
        Filter bulan hanya mempengaruhi laporan BKU &amp; Buku Pembantu.
        APBDes, DPA, dan Realisasi Semester I selalu tampil data penuh.
      </p>
    </div>
  );
}
