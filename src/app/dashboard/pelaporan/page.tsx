"use client";

// src/app/dashboard/pelaporan/page.tsx
// PDF generate client-side via pdf().toBlob() — tidak pakai API route

import { useState, useCallback } from "react";
import React from "react";
import { useDataLaporan } from "@/hooks/usePelaporan";
import { useAppStore } from "@/store/appStore";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown, Loader2, FileText, BarChart3, BookOpen, Wallet, Receipt } from "lucide-react";
import { downloadPDFClient } from "@/lib/generatePDF";
import dynamic from "next/dynamic";

// Dynamic import semua komponen PDF — wajib ssr:false
const PDFAPBDesGlobal = dynamic(
  () => import("@/components/modules/pelaporan/PDFAPBDesGlobal").then((m) => m.PDFAPBDesGlobal),
  { ssr: false, loading: () => null }
);
const PDFAPBDesPerKegiatan = dynamic(
  () => import("@/components/modules/pelaporan/PDFAPBDesPerKegiatan").then((m) => m.PDFAPBDesPerKegiatan),
  { ssr: false, loading: () => null }
);
const PDFAPBDesRinci = dynamic(
  () => import("@/components/modules/pelaporan/PDFAPBDesRinci").then((m) => m.PDFAPBDesRinci),
  { ssr: false, loading: () => null }
);
const PDFBKUBulanan = dynamic(
  () => import("@/components/modules/pelaporan/PDFBKUBulanan").then((m) => m.PDFBKUBulanan),
  { ssr: false, loading: () => null }
);
const PDFBukuKasTunai = dynamic(
  () => import("@/components/modules/pelaporan/PDFBukuKasTunai").then((m) => m.PDFBukuKasTunai),
  { ssr: false, loading: () => null }
);
const PDFBukuBank = dynamic(
  () => import("@/components/modules/pelaporan/PDFBukuBank").then((m) => m.PDFBukuBank),
  { ssr: false, loading: () => null }
);
const PDFBukuPajak = dynamic(
  () => import("@/components/modules/pelaporan/PDFBukuPajak").then((m) => m.PDFBukuPajak),
  { ssr: false, loading: () => null }
);
const PDFBukuPajakRekap = dynamic(
  () => import("@/components/modules/pelaporan/PDFBukuPajakRekap").then((m) => m.PDFBukuPajakRekap),
  { ssr: false, loading: () => null }
);
const PDFBukuPanjar = dynamic(
  () => import("@/components/modules/pelaporan/PDFBukuPanjar").then((m) => m.PDFBukuPanjar),
  { ssr: false, loading: () => null }
);
const PDFRealisasiSemesterI = dynamic(
  () => import("@/components/modules/pelaporan/PDFRealisasiSemesterI").then((m) => m.PDFRealisasiSemesterI),
  { ssr: false, loading: () => null }
);
const PDFDPAPerKegiatan = dynamic(
  () => import("@/components/modules/pelaporan/PDFDPAPerKegiatan").then((m) => m.PDFDPAPerKegiatan),
  { ssr: false, loading: () => null }
);

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

interface DownloadBtnProps {
  label: string;
  filename: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getElement: () => React.ReactElement<any>;
}

function DownloadBtn({ label, filename, getElement }: DownloadBtnProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const element = getElement();
      await downloadPDFClient(element, filename);
    } catch (err) {
      console.error("PDF error:", err);
      alert("Gagal generate PDF. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [loading, getElement, filename]);

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed w-full"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <FileDown className="h-4 w-4 shrink-0 text-primary" />}
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
    isLoading, dataDesa, pendapatanList, belanjaList, pembiayaanList,
    dpaMap, bkuAll, bukuBank, bukuKasTunai, bukuPajak, bukuPajakRekap,
    bukuPanjar, dicairkanSPP, realisasiPerRekening, realisasiPerKegiatan,
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

      <LaporanCard icon={<FileText className="h-4 w-4" />} title="APBDes">
        <DownloadBtn
          label="APBDes Global (Pendapatan, Belanja, Pembiayaan)"
          filename={`APBDes-Global_${desaNama}_${tahun}.pdf`}
          getElement={() => React.createElement(PDFAPBDesGlobal as React.ComponentType<Record<string, unknown>>, { tahun, dataDesa, pendapatanList, belanjaList, pembiayaanList })}
        />
        <DownloadBtn
          label="APBDes Per Kegiatan (Anggaran & Realisasi)"
          filename={`APBDes-PerKegiatan_${desaNama}${suffix}.pdf`}
          getElement={() => React.createElement(PDFAPBDesPerKegiatan as React.ComponentType<Record<string, unknown>>, { tahun, dataDesa, belanjaList, realisasiPerRekening })}
        />
        <DownloadBtn
          label="APBDes Rinci (RAB per Sub Item)"
          filename={`APBDes-Rinci_${desaNama}_${tahun}.pdf`}
          getElement={() => React.createElement(PDFAPBDesRinci as React.ComponentType<Record<string, unknown>>, { tahun, dataDesa, belanjaList })}
        />
      </LaporanCard>

      <LaporanCard icon={<BarChart3 className="h-4 w-4" />} title="DPA">
        <DownloadBtn
          label="DPA Per Kegiatan (Rencana Kas 12 Bulan)"
          filename={`DPA-PerKegiatan_${desaNama}_${tahun}.pdf`}
          getElement={() => React.createElement(PDFDPAPerKegiatan as React.ComponentType<Record<string, unknown>>, { tahun, dataDesa, belanjaList, dpaMap })}
        />
      </LaporanCard>

      <LaporanCard icon={<BookOpen className="h-4 w-4" />} title="Buku Kas Umum (BKU)">
        <DownloadBtn
          label={`BKU — ${bulanLabel} ${tahun}`}
          filename={`BKU_${desaNama}${suffix}.pdf`}
          getElement={() => React.createElement(PDFBKUBulanan as React.ComponentType<Record<string, unknown>>, { tahun, dataDesa, bkuList: bkuAll, bulan })}
        />
      </LaporanCard>

      <LaporanCard icon={<Wallet className="h-4 w-4" />} title="Buku Pembantu">
        <DownloadBtn
          label={`Buku Pembantu Kas Tunai — ${bulanLabel}`}
          filename={`BukuKasTunai_${desaNama}${suffix}.pdf`}
          getElement={() => React.createElement(PDFBukuKasTunai as React.ComponentType<Record<string, unknown>>, { tahun, dataDesa, rows: bukuKasTunai, bulan })}
        />
        <DownloadBtn
          label={`Buku Pembantu Bank — ${bulanLabel}`}
          filename={`BukuBank_${desaNama}${suffix}.pdf`}
          getElement={() => React.createElement(PDFBukuBank as React.ComponentType<Record<string, unknown>>, { tahun, dataDesa, rows: bukuBank, bulan })}
        />
        <DownloadBtn
          label={`Buku Pembantu Pajak — ${bulanLabel}`}
          filename={`BukuPajak_${desaNama}${suffix}.pdf`}
          getElement={() => React.createElement(PDFBukuPajak as React.ComponentType<Record<string, unknown>>, { tahun, dataDesa, rows: bukuPajak, bulan })}
        />
        <DownloadBtn
          label={`Rekapitulasi Pajak — ${bulanLabel}`}
          filename={`RekapPajak_${desaNama}${suffix}.pdf`}
          getElement={() => React.createElement(PDFBukuPajakRekap as React.ComponentType<Record<string, unknown>>, { tahun, dataDesa, rows: bukuPajakRekap, bulan })}
        />
        <DownloadBtn
          label={`Buku Pembantu Panjar — ${bulanLabel}`}
          filename={`BukuPanjar_${desaNama}${suffix}.pdf`}
          getElement={() => React.createElement(PDFBukuPanjar as React.ComponentType<Record<string, unknown>>, { tahun, dataDesa, rows: bukuPanjar, bulan })}
        />
      </LaporanCard>

      <LaporanCard icon={<Receipt className="h-4 w-4" />} title="Laporan Realisasi">
        <DownloadBtn
          label="Realisasi APBDes Semester I (Jan–Jun)"
          filename={`RealisasiSemesterI_${desaNama}_${tahun}.pdf`}
          getElement={() => React.createElement(PDFRealisasiSemesterI as React.ComponentType<Record<string, unknown>>, { tahun, dataDesa, belanjaList, dicairkanSPP, realisasiPerKegiatan })}
        />
      </LaporanCard>

      <p className="text-xs text-muted-foreground text-center pb-2">
        Filter bulan hanya mempengaruhi laporan BKU &amp; Buku Pembantu.
        APBDes, DPA, dan Realisasi Semester I selalu tampil data penuh.
      </p>
    </div>
  );
}