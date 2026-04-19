// src/app/dashboard/penatausahaan/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SPPList } from "@/components/modules/penatausahaan/SPPList";
import { BKUView } from "@/components/modules/penatausahaan/BKUView";
import { FormSPP } from "@/components/modules/penatausahaan/FormSPP";
import { FormPenerimaan } from "@/components/modules/penatausahaan/FormPenerimaan";
import { FormSPJ } from "@/components/modules/penatausahaan/FormSPJ";
import { FormMutasiKas } from "@/components/modules/penatausahaan/FormMutasiKas";
import { FormPenyetoranPajak } from "@/components/modules/penatausahaan/FormPenyetoranPajak";
import { PenerimaanList } from "@/components/modules/penatausahaan/PenerimaanList";
import { SPJList } from "@/components/modules/penatausahaan/SPJList";
import { MutasiKasList } from "@/components/modules/penatausahaan/MutasiKasList";
import { PenyetoranPajakList } from "@/components/modules/penatausahaan/PenyetoranPajakList";
import {
  ArrowDownCircle,
  ArrowRightLeft,
  BookOpen,
  FileCheck,
  FileText,
  Plus,
  Receipt,
} from "lucide-react";

type Menu = "penerimaan" | "mutasi" | "spp" | "spj" | "penyetoran_pajak" | "bku";

const MENU_ITEMS: { key: Menu; label: string; sublabel: string; icon: React.ReactNode }[] = [
  { key: "penerimaan",       label: "Penerimaan",  sublabel: "Tunai & Bank",      icon: <ArrowDownCircle className="h-4 w-4" /> },
  { key: "mutasi",           label: "Mutasi Kas",  sublabel: "Bank → Tunai",      icon: <ArrowRightLeft className="h-4 w-4" /> },
  { key: "spp",              label: "SPP",         sublabel: "Surat Permintaan",  icon: <FileText className="h-4 w-4" /> },
  { key: "spj",              label: "SPJ",         sublabel: "Pertanggungjawaban",icon: <FileCheck className="h-4 w-4" /> },
  { key: "penyetoran_pajak", label: "Setor Pajak", sublabel: "Penyetoran Pajak",  icon: <Receipt className="h-4 w-4" /> },
  { key: "bku",              label: "BKU",         sublabel: "Buku Kas Umum",     icon: <BookOpen className="h-4 w-4" /> },
];

export default function PenatausahaanPage() {
  const [menu, setMenu] = useState<Menu>("penerimaan");
  const [formSPPOpen, setFormSPPOpen] = useState(false);
  const [formPenerimaanOpen, setFormPenerimaanOpen] = useState(false);
  const [formSPJOpen, setFormSPJOpen] = useState(false);
  const [formMutasiOpen, setFormMutasiOpen] = useState(false);
  const [formPenyetoranOpen, setFormPenyetoranOpen] = useState(false);

  const tombolTambah: Partial<Record<Menu, { label: string; onClick: () => void }>> = {
    penerimaan:       { label: "Tambah",      onClick: () => setFormPenerimaanOpen(true) },
    mutasi:           { label: "Mutasi Baru", onClick: () => setFormMutasiOpen(true) },
    spp:              { label: "SPP Baru",    onClick: () => setFormSPPOpen(true) },
    spj:              { label: "Buat SPJ",    onClick: () => setFormSPJOpen(true) },
    penyetoran_pajak: { label: "Setor Pajak", onClick: () => setFormPenyetoranOpen(true) },
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div>
          <h1 className="text-base font-semibold leading-tight">Penatausahaan</h1>
          <p className="text-xs text-muted-foreground">
            {MENU_ITEMS.find((m) => m.key === menu)?.sublabel}
          </p>
        </div>
        {tombolTambah[menu] && (
          <Button size="sm" onClick={tombolTambah[menu]!.onClick}>
            <Plus className="h-4 w-4 mr-1" />
            {tombolTambah[menu]!.label}
          </Button>
        )}
      </div>

      {/* Split panel */}
      <div className="flex flex-1 overflow-hidden">

        {/* Navigasi kiri */}
        <div className="w-24 shrink-0 border-r flex flex-col overflow-y-auto bg-muted/20">
          {MENU_ITEMS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMenu(m.key)}
              className={cn(
                "w-full flex flex-col items-center gap-1 px-2 py-3 border-b text-center transition-colors",
                menu === m.key
                  ? "bg-teal-50 dark:bg-teal-950/30 border-l-2 border-l-teal-600 text-teal-700 dark:text-teal-400"
                  : "border-l-2 border-l-transparent hover:bg-muted/50 text-muted-foreground"
              )}
            >
              <span className={cn(
                "p-1.5 rounded-md",
                menu === m.key ? "bg-teal-100 dark:bg-teal-900/50 text-teal-600" : ""
              )}>
                {m.icon}
              </span>
              <span className="text-xs font-semibold leading-tight">{m.label}</span>
              <span className="text-[10px] leading-tight opacity-70">{m.sublabel}</span>
            </button>
          ))}
        </div>

        {/* Konten kanan */}
        <div className="flex-1 overflow-auto flex flex-col">
          {menu === "penerimaan"       && <PenerimaanList />}
          {menu === "mutasi"           && <MutasiKasList />}
          {menu === "spp"              && <SPPList />}
          {menu === "spj"              && <SPJList />}
          {menu === "penyetoran_pajak" && <PenyetoranPajakList />}
          {menu === "bku"              && <BKUView />}
        </div>
      </div>

      {/* Form sheets */}
      <FormPenerimaan     open={formPenerimaanOpen}   onClose={() => setFormPenerimaanOpen(false)} />
      <FormMutasiKas      open={formMutasiOpen}        onClose={() => setFormMutasiOpen(false)} />
      <FormSPP            open={formSPPOpen}           onClose={() => setFormSPPOpen(false)} />
      <FormSPJ            open={formSPJOpen}           onClose={() => setFormSPJOpen(false)} />
      <FormPenyetoranPajak open={formPenyetoranOpen}  onClose={() => setFormPenyetoranOpen(false)} />
    </div>
  );
}