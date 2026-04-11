"use client";

import { useAuthStore } from "@/store/authStore";
import { useAppStore } from "@/store/appStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookOpen,
  ClipboardList,
  Wallet,
  FileText,
  Database,
} from "lucide-react";
import Link from "next/link";

const modules = [
  {
    label: "Master Data",
    desc: "Kode rekening & bidang kegiatan",
    href: "/dashboard/master",
    icon: Database,
    color: "text-blue-500",
  },
  {
    label: "APBDes",
    desc: "Anggaran pendapatan & belanja",
    href: "/dashboard/apbdes",
    icon: BookOpen,
    color: "text-emerald-500",
  },
  {
    label: "DPA",
    desc: "Dokumen pelaksanaan anggaran",
    href: "/dashboard/dpa",
    icon: ClipboardList,
    color: "text-violet-500",
  },
  {
    label: "Penatausahaan",
    desc: "BKU, SPP & buku pembantu",
    href: "/dashboard/penatausahaan",
    icon: Wallet,
    color: "text-orange-500",
  },
  {
    label: "Pelaporan",
    desc: "Laporan & cetak PDF",
    href: "/dashboard/pelaporan",
    icon: FileText,
    color: "text-rose-500",
  },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const tahunAnggaran = useAppStore((s) => s.tahunAnggaran);

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div>
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Selamat datang, {user?.nama} · TA {tahunAnggaran}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link key={mod.href} href={mod.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-2 pt-4 px-4">
                  <Icon className={`h-6 w-6 ${mod.color}`} />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <CardTitle className="text-sm">{mod.label}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {mod.desc}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground pt-4">
        © 2026 Pemerintah Desa Karang Sengon
      </p>
    </div>
  );
}