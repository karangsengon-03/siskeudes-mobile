"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuthStore } from "@/store/authStore";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LogOut, Landmark } from "lucide-react";
import { toast } from "sonner";

export function TopBar() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { tahunAnggaran, tahunOptions, setTahunAnggaran } = useAppStore();

  async function handleLogout() {
    await signOut(auth);
    toast.success("Berhasil keluar");
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-40 bg-background border-b h-14 flex items-center px-4 gap-3">
      <Landmark className="h-5 w-5 text-primary shrink-0 md:hidden" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">SisKeuDes Mobile</p>
        <p className="text-xs text-muted-foreground truncate hidden sm:block">
          {user?.nama}
        </p>
      </div>

      {/* Pilih Tahun Anggaran */}
      <Select value={tahunAnggaran} onValueChange={setTahunAnggaran}>
        <SelectTrigger className="w-24 h-8 text-xs">
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

      <Button
        variant="ghost"
        size="icon"
        onClick={handleLogout}
        className="shrink-0 md:hidden"
        title="Keluar"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </header>
  );
}