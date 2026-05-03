"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuthStore } from "@/store/authStore";
import { useAppStore } from "@/store/appStore";
import {
  LayoutDashboard,
  Database,
  BookOpen,
  BookMarked,
  ClipboardList,
  Wallet,
  FileText,
  Settings,
  LogOut,
  Landmark,
  BookKey,
  Map,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Master Data", href: "/dashboard/master", icon: Database },
  { label: "Perencanaan", href: "/dashboard/perencanaan", icon: Map },
  { label: "APBDes", href: "/dashboard/apbdes", icon: BookOpen },
  { label: "DPA", href: "/dashboard/dpa", icon: ClipboardList },
  { label: "Pembukuan", href: "/dashboard/pembukuan", icon: BookKey },
  { label: "Penatausahaan", href: "/dashboard/penatausahaan", icon: Wallet },
  { label: "Buku Pembantu", href: "/dashboard/buku-pembantu", icon: BookMarked },
  { label: "Pelaporan", href: "/dashboard/pelaporan", icon: FileText },
  { label: "Pengaturan", href: "/dashboard/pengaturan", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { tahunAnggaran, tahunOptions, setTahunAnggaran } = useAppStore();

  async function handleLogout() {
    await signOut(auth);
    toast.success("Berhasil keluar");
    router.push("/login");
  }

  return (
    <aside className="hidden md:flex flex-col w-60 h-full bg-sidebar border-r">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-5 border-b">
        <Landmark className="h-6 w-6 text-primary shrink-0" />
        <div className="leading-tight">
          <p className="text-sm font-semibold">SisKeuDes <span className="text-xs font-normal text-muted-foreground">v1.0</span></p>
          <p className="text-xs text-muted-foreground">Karang Sengon · {tahunAnggaran}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
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
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
<div className="px-4 py-4 border-t space-y-3">
  <Select value={tahunAnggaran} onValueChange={setTahunAnggaran}>
    <SelectTrigger className="w-full h-8 text-xs">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {tahunOptions.map((y) => (
        <SelectItem key={y} value={y} className="text-xs">
          TA {y}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  {user?.nama && (
  <p className="text-xs font-medium truncate">{user.nama}</p>
)}
<p className="text-xs text-muted-foreground truncate">
  {user?.role === "Bendahara Desa (Kaur Keuangan)" ? "Bendahara Desa" :
   user?.role === "Koordinator PPKD (Sekdes)" ? "Sekretaris Desa" :
   user?.role === "PKPKD (Kades)" ? "Kepala Desa" : 
   user?.role === "Operator" ? "Operator Desa" : user?.email ?? ""}
</p>
  <button
    onClick={handleLogout}
    className="flex items-center gap-2 text-xs text-destructive hover:underline"
  >
    <LogOut className="h-3.5 w-3.5" />
    Keluar
  </button>
</div>
    </aside>
  );
}