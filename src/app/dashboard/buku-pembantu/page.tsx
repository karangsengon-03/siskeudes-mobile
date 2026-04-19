"use client";

import { useState } from "react";
import { BukuKasTunai } from "@/components/modules/buku-pembantu/BukuKasTunai";
import { BukuBank } from "@/components/modules/buku-pembantu/BukuBank";
import { BukuPajak } from "@/components/modules/buku-pembantu/BukuPajak";
import { BukuPajakRekap } from "@/components/modules/buku-pembantu/BukuPajakRekap";
import { BukuPanjar } from "@/components/modules/buku-pembantu/BukuPanjar";
import { cn } from "@/lib/utils";

type Menu = "kas-tunai" | "bank" | "pajak" | "pajak-rekap" | "panjar";

const MENUS: { id: Menu; label: string }[] = [
  { id: "kas-tunai", label: "Kas Tunai" },
  { id: "bank", label: "Bank" },
  { id: "pajak", label: "Pajak" },
  { id: "pajak-rekap", label: "Rekap Pajak" },
  { id: "panjar", label: "Panjar" },
];

export default function BukuPembantuPage() {
  const [active, setActive] = useState<Menu>("kas-tunai");

  return (
    <div className="flex h-full">
      {/* sidebar sub-menu */}
      <aside className="w-36 shrink-0 border-r flex flex-col">
        {MENUS.map((m) => (
          <button
            key={m.id}
            onClick={() => setActive(m.id)}
            className={cn(
              "px-3 py-3 text-sm text-left transition-colors border-b",
              active === m.id
                ? "bg-primary text-primary-foreground font-semibold"
                : "hover:bg-muted"
            )}
          >
            {m.label}
          </button>
        ))}
      </aside>

      {/* konten */}
      <main className="flex-1 overflow-hidden">
        {active === "kas-tunai" && <BukuKasTunai />}
        {active === "bank" && <BukuBank />}
        {active === "pajak" && <BukuPajak />}
        {active === "pajak-rekap" && <BukuPajakRekap />}
        {active === "panjar" && <BukuPanjar />}
      </main>
    </div>
  );
}