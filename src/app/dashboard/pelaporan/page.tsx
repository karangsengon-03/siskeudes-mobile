"use client";

// src/app/dashboard/pelaporan/page.tsx
// Session 7 — Pelaporan & Generate PDF
// Semua komponen PDF di-import dengan dynamic import + ssr:false

import dynamic from "next/dynamic";
import { useState } from "react";
import type { DocumentProps, BlobProviderParams } from "@react-pdf/renderer";
import { useDataLaporan } from "@/hooks/usePelaporan";
import { useAppStore } from "@/store/appStore";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown, Loader2, FileText, BarChart3, BookOpen, Wallet, PiggyBank, Receipt } from "lucide-react";

// ─── Dynamic imports dengan ssr:false ─────────────────────────────────────────
// @react-pdf/renderer TIDAK boleh di-render server-side
const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFDownloadLink),
  { ssr: false, loading: () => <Skeleton className="h-9 w-40" /> }
);

const PDFAPBDesGlobal = dynamic(
  () => import("@/components/modules/pelaporan/PDFAPBDesGlobal").then((m) => m.PDFAPBDesGlobal),
  { ssr: false }
);
const PDFAPBDesPerKegiatan = dynamic(
  () => import("@/components/modules/pelaporan/PDFAPBDesPerKegiatan").then((m) => m.PDFAPBDesPerKegiatan),
  { ssr: false }
);
const PDFAPBDesRinci = dynamic(
  () => import("@/components/modules/pelaporan/PDFAPBDesRinci").then((m) => m.PDFAPBDesRinci),
  { ssr: false }
);
const PDFBKUBulanan = dynamic(
  () => import("@/components/modules/pelaporan/PDFBKUBulanan").then((m) => m.PDFBKUBulanan),
  { ssr: false }
);
const PDFBukuKasTunai = dynamic(
  () => import("@/components/modules/pelaporan/PDFBukuKasTunai").then((m) => m.PDFBukuKasTunai),
  { ssr: false }
);
const PDFBukuBank = dynamic(
  () => import("@/components/modules/pelaporan/PDFBukuBank").then((m) => m.PDFBukuBank),
  { ssr: false }
);
const PDFBukuPajak = dynamic(
  () => import("@/components/modules/pelaporan/PDFBukuPajak").then((m) => m.PDFBukuPajak),
  { ssr: false }
);
const PDFBukuPajakRekap = dynamic(
  () => import("@/components/modules/pelaporan/PDFBukuPajakRekap").then((m) => m.PDFBukuPajakRekap),
  { ssr: false }
);
const PDFBukuPanjar = dynamic(
  () => import("@/components/modules/pelaporan/PDFBukuPanjar").then((m) => m.PDFBukuPanjar),
  { ssr: false }
);
const PDFRealisasiSemesterI = dynamic(
  () => import("@/components/modules/pelaporan/PDFRealisasiSemesterI").then((m) => m.PDFRealisasiSemesterI),
  { ssr: false }
);
const PDFDPAPerKegiatan = dynamic(
  () => import("@/components/modules/pelaporan/PDFDPAPerKegiatan").then((m) => m.PDFDPAPerKegiatan),
  { ssr: false }
);

// ─── Konstanta bulan ──────────────────────────────────────────────────────────
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

// ─── Tipe props tombol download ───────────────────────────────────────────────
interface DownloadBtnProps {
  label: string;
  filename: string;
  document: React.ReactElement<DocumentProps>;
}

function DownloadBtn({ label, filename, document }: DownloadBtnProps) {
  const renderChild = ({ loading }: BlobProviderParams) => (
        <button
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
  return (
    <PDFDownloadLink document={document} fileName={filename}>
      {renderChild as unknown as React.ReactElement<BlobProviderParams>}
    </PDFDownloadLink>
  );
}

// ─── Komponen kartu kategori laporan ─────────────────────────────────────────
interface LaporanCardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function LaporanCard({ icon, title, children }: LaporanCardProps) {
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

// ─── Halaman utama ────────────────────────────────────────────────────────────
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

  // Nama file helper
  const suffix = bulan ? `_${bulanLabel.replace(/ /g, "-")}_${tahun}` : `_${tahun}`;
  const desaNama = (dataDesa?.namaDesa ?? "Desa").replace(/ /g, "-");

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Judul + filter bulan */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-base font-semibold">Pelaporan</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Generate PDF laporan keuangan — Tahun {tahun}
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
        <DownloadBtn
          label="APBDes Global (Pendapatan, Belanja, Pembiayaan)"
          filename={`APBDes-Global_${desaNama}_${tahun}.pdf`}
          document={
            <PDFAPBDesGlobal
              tahun={tahun}
              dataDesa={dataDesa}
              pendapatanList={pendapatanList}
              belanjaList={belanjaList}
              pembiayaanList={pembiayaanList}
            />
          }
        />
        <DownloadBtn
          label="APBDes Per Kegiatan (Anggaran & Realisasi)"
          filename={`APBDes-PerKegiatan_${desaNama}${suffix}.pdf`}
          document={
            <PDFAPBDesPerKegiatan
              tahun={tahun}
              dataDesa={dataDesa}
              belanjaList={belanjaList}
              realisasiPerRekening={realisasiPerRekening}
            />
          }
        />
        <DownloadBtn
          label="APBDes Rinci (RAB per Sub Item)"
          filename={`APBDes-Rinci_${desaNama}_${tahun}.pdf`}
          document={
            <PDFAPBDesRinci
              tahun={tahun}
              dataDesa={dataDesa}
              belanjaList={belanjaList}
            />
          }
        />
      </LaporanCard>

      {/* ── DPA ── */}
      <LaporanCard icon={<BarChart3 className="h-4 w-4" />} title="DPA">
        <DownloadBtn
          label="DPA Per Kegiatan (Rencana Kas 12 Bulan)"
          filename={`DPA-PerKegiatan_${desaNama}_${tahun}.pdf`}
          document={
            <PDFDPAPerKegiatan
              tahun={tahun}
              dataDesa={dataDesa}
              belanjaList={belanjaList}
              dpaMap={dpaMap}
            />
          }
        />
      </LaporanCard>

      {/* ── BKU ── */}
      <LaporanCard icon={<BookOpen className="h-4 w-4" />} title="Buku Kas Umum (BKU)">
        <DownloadBtn
          label={`BKU — ${bulanLabel} ${tahun}`}
          filename={`BKU_${desaNama}${suffix}.pdf`}
          document={
            <PDFBKUBulanan
              tahun={tahun}
              dataDesa={dataDesa}
              bkuList={bkuAll}
              bulan={bulan}
            />
          }
        />
      </LaporanCard>

      {/* ── Buku Pembantu ── */}
      <LaporanCard icon={<Wallet className="h-4 w-4" />} title="Buku Pembantu">
        <DownloadBtn
          label={`Buku Pembantu Kas Tunai — ${bulanLabel}`}
          filename={`BukuKasTunai_${desaNama}${suffix}.pdf`}
          document={
            <PDFBukuKasTunai
              tahun={tahun}
              dataDesa={dataDesa}
              rows={bukuKasTunai}
              bulan={bulan}
            />
          }
        />
        <DownloadBtn
          label={`Buku Pembantu Bank — ${bulanLabel}`}
          filename={`BukuBank_${desaNama}${suffix}.pdf`}
          document={
            <PDFBukuBank
              tahun={tahun}
              dataDesa={dataDesa}
              rows={bukuBank}
              bulan={bulan}
            />
          }
        />
        <DownloadBtn
          label={`Buku Pembantu Pajak — ${bulanLabel}`}
          filename={`BukuPajak_${desaNama}${suffix}.pdf`}
          document={
            <PDFBukuPajak
              tahun={tahun}
              dataDesa={dataDesa}
              rows={bukuPajak}
              bulan={bulan}
            />
          }
        />
        <DownloadBtn
          label={`Rekapitulasi Pajak — ${bulanLabel}`}
          filename={`RekapPajak_${desaNama}${suffix}.pdf`}
          document={
            <PDFBukuPajakRekap
              tahun={tahun}
              dataDesa={dataDesa}
              rows={bukuPajakRekap}
              bulan={bulan}
            />
          }
        />
        <DownloadBtn
          label={`Buku Pembantu Panjar — ${bulanLabel}`}
          filename={`BukuPanjar_${desaNama}${suffix}.pdf`}
          document={
            <PDFBukuPanjar
              tahun={tahun}
              dataDesa={dataDesa}
              rows={bukuPanjar}
              bulan={bulan}
            />
          }
        />
      </LaporanCard>

      {/* ── Realisasi ── */}
      <LaporanCard icon={<Receipt className="h-4 w-4" />} title="Laporan Realisasi">
        <DownloadBtn
          label="Realisasi APBDes Semester I (Jan–Jun)"
          filename={`RealisasiSemesterI_${desaNama}_${tahun}.pdf`}
          document={
            <PDFRealisasiSemesterI
              tahun={tahun}
              dataDesa={dataDesa}
              belanjaList={belanjaList}
              dicairkanSPP={dicairkanSPP}
              realisasiPerKegiatan={realisasiPerKegiatan}
            />
          }
        />
      </LaporanCard>

      {/* Info */}
      <p className="text-xs text-muted-foreground text-center pb-2">
        Filter bulan hanya mempengaruhi laporan BKU & Buku Pembantu.{"\n"}
        APBDes, DPA, dan Realisasi Semester I selalu tampil data penuh.
      </p>
    </div>
  );
}
