// src/app/dashboard/pembukuan/page.tsx
"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSaldoAwal } from "@/hooks/useSaldoAwal";
import { useJurnalPenyesuaian } from "@/hooks/useJurnalPenyesuaian";
import { useAppStore } from "@/store/appStore";
import { Wallet2, BookOpenCheck, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";

export default function PembukuanPage() {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const { data: saldo } = useSaldoAwal();
  const { data: jurnal = [] } = useJurnalPenyesuaian();

  const saldoIsi = saldo && saldo.updatedAt > 0;
  const totalKas = saldo ? saldo.kasTunai + saldo.bank : 0;

  const menuItems = [
    {
      label: "Saldo Awal",
      desc: "Kas tunai, kas bank, hutang pajak tahun lalu, dan ekuitas SAL",
      href: "/dashboard/pembukuan/saldo-awal",
      icon: Wallet2,
      status: saldoIsi
        ? { label: `Rp ${totalKas.toLocaleString("id-ID")}`, ok: true }
        : { label: "Belum diisi", ok: false },
    },
    {
      label: "Jurnal Penyesuaian",
      desc: "SiLPA tahun lalu per sumber dana dan setoran BPJS 1% Siltap",
      href: "/dashboard/pembukuan/jurnal-penyesuaian",
      icon: BookOpenCheck,
      status: jurnal.length > 0
        ? { label: `${jurnal.length} entri`, ok: true }
        : { label: "Belum ada entri", ok: false },
    },
  ];

  return (
    <div className="space-y-5 pb-24">
      <div>
        <h1 className="text-lg font-semibold">Pembukuan</h1>
        <p className="text-sm text-muted-foreground">Tahun Anggaran {tahun}</p>
      </div>

      <div className="space-y-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="h-10 w-10 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{item.desc}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {item.status.ok
                        ? <CheckCircle2 className="h-3 w-3 text-green-600" />
                        : <AlertCircle className="h-3 w-3 text-amber-500" />}
                      <span className={`text-xs font-medium ${item.status.ok ? "text-green-700" : "text-amber-600"}`}>
                        {item.status.label}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
