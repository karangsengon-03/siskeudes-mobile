"use client";

// src/app/dashboard/pelaporan/page.tsx
// PDF generate client-side via pdf().toBlob() — tidak pakai API route

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useCallback } from "react";
import React from "react";
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

async function downloadPDFClient(
  moduleName: string,
  exportName: string,
  props: Record<string, unknown>,
  filename: string
): Promise<void> {
  const [{ pdf }, mod] = await Promise.all([
    import("@react-pdf/renderer"),
    import(`@/components/modules/pelaporan/${moduleName}`),
  ]);
  const Component = mod[exportName] as React.ComponentType<any>;
  const element = React.createElement(Component, props);
  const blob = await pdf(element as any).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface DownloadBtnProps {
  label: string;
  filename: string;
  moduleName: string;
  exportName: string;
  getProps: () => Record<string, unknown>;
}

function DownloadBtn({ label, filename, moduleName, exportName, getProps }: DownloadBtnProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      await downloadPDFClient(moduleName, exportName, getProps(), filename);
    } catch (err) {
      console.error("PDF error:", err);
      alert("Gagal generate PDF. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [loading, moduleName, exportName, getProps, filename]);

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
          moduleName="PDFAPBDesGlobal"
          exportName="PDFAPBDesGlobal"
          getProps={() => ({ tahun, dataDesa, pendapatanList, belanjaList, pembiayaanList })}
        />
        <DownloadBtn
          label="APBDes Per Kegiatan (Anggaran & Realisasi)"
          filename={`APBDes-PerKegiatan_${desaNama}${suffix}.pdf`}
          moduleName="PDFAPBDesPerKegiatan"
          exportName="PDFAPBDesPerKegiatan"
          getProps={() => ({ tahun, dataDesa, belanjaList, realisasiPerRekening })}
        />
        <DownloadBtn
          label="APBDes Rinci (RAB per Sub Item)"
          filename={`APBDes-Rinci_${desaNama}_${tahun}.pdf`}
          moduleName="PDFAPBDesRinci"
          exportName="PDFAPBDesRinci"
          getProps={() => ({ tahun, dataDesa, belanjaList })}
        />
      </LaporanCard>

      <LaporanCard icon={<BarChart3 className="h-4 w-4" />} title="DPA">
        <DownloadBtn
          label="DPA Per Kegiatan (Rencana Kas 12 Bulan)"
          filename={`DPA-PerKegiatan_${desaNama}_${tahun}.pdf`}
          moduleName="PDFDPAPerKegiatan"
          exportName="PDFDPAPerKegiatan"
          getProps={() => ({ tahun, dataDesa, belanjaList, dpaMap })}
        />
      </LaporanCard>

      <LaporanCard icon={<BookOpen className="h-4 w-4" />} title="Buku Kas Umum (BKU)">
        <DownloadBtn
          label={`BKU — ${bulanLabel} ${tahun}`}
          filename={`BKU_${desaNama}${suffix}.pdf`}
          moduleName="PDFBKUBulanan"
          exportName="PDFBKUBulanan"
          getProps={() => ({ tahun, dataDesa, bkuList: bkuAll, bulan })}
        />
      </LaporanCard>

      <LaporanCard icon={<Wallet className="h-4 w-4" />} title="Buku Pembantu">
        <DownloadBtn
          label={`Buku Pembantu Kas Tunai — ${bulanLabel}`}
          filename={`BukuKasTunai_${desaNama}${suffix}.pdf`}
          moduleName="PDFBukuKasTunai"
          exportName="PDFBukuKasTunai"
          getProps={() => ({ tahun, dataDesa, rows: bukuKasTunai, bulan })}
        />
        <DownloadBtn
          label={`Buku Pembantu Bank — ${bulanLabel}`}
          filename={`BukuBank_${desaNama}${suffix}.pdf`}
          moduleName="PDFBukuBank"
          exportName="PDFBukuBank"
          getProps={() => ({ tahun, dataDesa, rows: bukuBank, bulan })}
        />
        <DownloadBtn
          label={`Buku Pembantu Pajak — ${bulanLabel}`}
          filename={`BukuPajak_${desaNama}${suffix}.pdf`}
          moduleName="PDFBukuPajak"
          exportName="PDFBukuPajak"
          getProps={() => ({ tahun, dataDesa, rows: bukuPajak, bulan })}
        />
        <DownloadBtn
          label={`Rekapitulasi Pajak — ${bulanLabel}`}
          filename={`RekapPajak_${desaNama}${suffix}.pdf`}
          moduleName="PDFBukuPajakRekap"
          exportName="PDFBukuPajakRekap"
          getProps={() => ({ tahun, dataDesa, rows: bukuPajakRekap, bulan })}
        />
        <DownloadBtn
          label={`Buku Pembantu Panjar — ${bulanLabel}`}
          filename={`BukuPanjar_${desaNama}${suffix}.pdf`}
          moduleName="PDFBukuPanjar"
          exportName="PDFBukuPanjar"
          getProps={() => ({ tahun, dataDesa, rows: bukuPanjar, bulan })}
        />
      </LaporanCard>

      <LaporanCard icon={<Receipt className="h-4 w-4" />} title="Laporan Realisasi">
        <DownloadBtn
          label="Realisasi APBDes Semester I (Jan–Jun)"
          filename={`RealisasiSemesterI_${desaNama}_${tahun}.pdf`}
          moduleName="PDFRealisasiSemesterI"
          exportName="PDFRealisasiSemesterI"
          getProps={() => ({ tahun, dataDesa, belanjaList, dicairkanSPP, realisasiPerKegiatan })}
        />
      </LaporanCard>

      <p className="text-xs text-muted-foreground text-center pb-2">
        Filter bulan hanya mempengaruhi laporan BKU &amp; Buku Pembantu.
        APBDes, DPA, dan Realisasi Semester I selalu tampil data penuh.
      </p>
    </div>
  );
}
