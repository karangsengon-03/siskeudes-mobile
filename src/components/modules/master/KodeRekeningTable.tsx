"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ChevronRight,
  ChevronDown,
  Search,
  RefreshCw,
  Loader2,
  Database,
} from "lucide-react";
import { KODE_REKENING } from "@/lib/constants/kodeRekening";
import { useKodeRekening } from "@/hooks/useMaster";
import { cn } from "@/lib/utils";

interface RowProps {
  kode: string;
  uraian: string;
  level: 1 | 2 | 3 | 4;
  isCustom?: boolean;
}

const LEVEL_INDENT: Record<number, string> = {
  1: "pl-0",
  2: "pl-4",
  3: "pl-8",
  4: "pl-12",
};

const LEVEL_STYLE: Record<number, string> = {
  1: "font-bold text-foreground bg-muted/60",
  2: "font-semibold text-foreground",
  3: "font-medium text-muted-foreground",
  4: "text-sm text-muted-foreground",
};

function KodeRow({
  kode,
  uraian,
  level,
  isCustom,
  hasChildren,
  isOpen,
  onToggle,
}: RowProps & {
  hasChildren: boolean;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 px-3 py-2 border-b border-border/40 hover:bg-muted/30 transition-colors",
        LEVEL_STYLE[level]
      )}
    >
      {/* Toggle icon */}
      <div className="mt-0.5 shrink-0 w-4">
        {hasChildren ? (
          <button onClick={onToggle} className="text-muted-foreground hover:text-foreground">
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : null}
      </div>

      {/* Kode */}
      <span
        className={cn(
          "shrink-0 font-mono tabular-nums",
          LEVEL_INDENT[level],
          level === 1 ? "text-teal-700 dark:text-teal-400 text-sm w-16" : "w-24 text-xs"
        )}
      >
        {kode}
      </span>

      {/* Uraian */}
      <span className="flex-1 text-xs leading-relaxed">{uraian}</span>

      {/* Badge custom */}
      {isCustom && (
        <Badge variant="outline" className="text-[10px] shrink-0 border-teal-500 text-teal-600">
          Custom
        </Badge>
      )}
    </div>
  );
}

export default function KodeRekeningTable() {
  const { saving, seedDefault } = useKodeRekening();
  const [search, setSearch] = useState("");
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set(["4", "5", "6"]));

  const toggle = (kode: string) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      next.has(kode) ? next.delete(kode) : next.add(kode);
      return next;
    });
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return KODE_REKENING;
    const q = search.toLowerCase();
    // Jika ada filter: tampilkan baris yang cocok + parent-nya
    const matchKodes = new Set<string>();
    KODE_REKENING.forEach((k) => {
      if (k.kode.toLowerCase().includes(q) || k.uraian.toLowerCase().includes(q)) {
        matchKodes.add(k.kode);
        // Tambah parent chain
        const parts = k.kode.split(".");
        for (let i = 1; i < parts.length; i++) {
          matchKodes.add(parts.slice(0, i).join("."));
        }
      }
    });
    return KODE_REKENING.filter((k) => matchKodes.has(k.kode));
  }, [search]);

  // Index children
  const childMap = useMemo(() => {
    const map = new Map<string, boolean>();
    KODE_REKENING.forEach((k) => {
      if (k.parentKode) map.set(k.parentKode, true);
    });
    return map;
  }, []);

  // Expand semua saat ada search
  const effectiveOpen = search.trim()
    ? new Set(KODE_REKENING.map((k) => k.kode))
    : openKeys;

  // Filter baris yang harus tampil (parent harus open)
  const visible = useMemo(() => {
    if (search.trim()) return filtered;
    return filtered.filter((k) => {
      if (!k.parentKode) return true;
      const parts = k.kode.split(".");
      for (let i = 1; i < parts.length; i++) {
        const ancestorKode = parts.slice(0, i).join(".");
        if (!effectiveOpen.has(ancestorKode)) return false;
      }
      return true;
    });
  }, [filtered, effectiveOpen, search]);

  const totalLevel4 = KODE_REKENING.filter((k) => k.level === 4).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4 text-teal-600" />
              Kode Rekening Permendagri 20/2018
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              {totalLevel4} rincian obyek (level 4) tersedia sebagai pilihan saat input RAB/DPA
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={seedDefault}
            disabled={saving}
            className="shrink-0 text-xs gap-1.5"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Seed ke Firebase
          </Button>
        </div>

        {/* Search */}
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode atau uraian..."
            className="pl-8 h-8 text-sm"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Header kolom */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border-b text-[11px] font-medium text-muted-foreground">
          <div className="w-4 shrink-0" />
          <span className="w-24 shrink-0">Kode</span>
          <span>Uraian</span>
        </div>

        {/* Rows */}
        <div className="max-height: 520px] overflow-y-auto">
          {visible.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Tidak ditemukan kode rekening "{search}"
            </div>
          ) : (
            visible.map((k) => (
              <KodeRow
                key={k.kode}
                kode={k.kode}
                uraian={k.uraian}
                level={k.level}
                hasChildren={childMap.has(k.kode)}
                isOpen={effectiveOpen.has(k.kode)}
                onToggle={() => toggle(k.kode)}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
