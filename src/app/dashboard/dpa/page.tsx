// src/app/dashboard/dpa/page.tsx
"use client";

import { DPAView } from "@/components/modules/dpa/DPAView";

export default function DPAPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-background shrink-0">
        <h1 className="text-base font-semibold">DPA — Dokumen Pelaksanaan Anggaran</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Rincian anggaran per kegiatan berdasarkan pagu APBDes yang telah ditetapkan
        </p>
      </div>

      {/* Miller Column */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <DPAView />
      </div>
    </div>
  );
}
