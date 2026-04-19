"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookMarked,
  BookOpen,
  ClipboardList,
  Wallet,
  FileText,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard",  href: "/dashboard",               icon: LayoutDashboard },
  { label: "APBDes",     href: "/dashboard/apbdes",        icon: BookOpen },
  { label: "DPA",        href: "/dashboard/dpa",           icon: ClipboardList },
  { label: "Tata Usaha", href: "/dashboard/penatausahaan", icon: Wallet },
  { label: "Buku Bantu", href: "/dashboard/buku-pembantu", icon: BookMarked },
  { label: "Laporan",    href: "/dashboard/pelaporan",     icon: FileText },
  { label: "Pengaturan", href: "/dashboard/pengaturan",    icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
      {/* Scroll horizontal agar semua menu terjangkau di layar kecil */}
      <div className="overflow-x-auto">
        <div className="flex items-center h-16 min-w-max px-2 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors shrink-0",
                  active
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}