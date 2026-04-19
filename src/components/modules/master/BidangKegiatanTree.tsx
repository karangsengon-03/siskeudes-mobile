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
  Layers,
  FolderOpen,
  Folder,
  FileText,
} from "lucide-react";
import { BIDANG_KEGIATAN, getAllKegiatan } from "@/lib/constants/bidangKegiatan";
import { useBidangKegiatan } from "@/hooks/useMaster";
import { cn } from "@/lib/utils";

const BIDANG_COLOR: Record<string, string> = {
  "1": "text-blue-700 dark:text-blue-400",
  "2": "text-green-700 dark:text-green-400",
  "3": "text-orange-700 dark:text-orange-400",
  "4": "text-purple-700 dark:text-purple-400",
  "5": "text-red-700 dark:text-red-400",
};

export default function BidangKegiatanTree() {
  const { saving, seedDefault } = useBidangKegiatan();
  const [search, setSearch] = useState("");
  const [openBidang, setOpenBidang] = useState<Set<string>>(new Set());
  const [openSubBidang, setOpenSubBidang] = useState<Set<string>>(new Set());

  const toggleBidang = (kode: string) => {
    setOpenBidang((prev) => {
      const next = new Set(prev);
      next.has(kode) ? next.delete(kode) : next.add(kode);
      return next;
    });
  };

  const toggleSubBidang = (kode: string) => {
    setOpenSubBidang((prev) => {
      const next = new Set(prev);
      next.has(kode) ? next.delete(kode) : next.add(kode);
      return next;
    });
  };

  // Filtered tree berdasar search
  const filteredTree = useMemo(() => {
    if (!search.trim()) return BIDANG_KEGIATAN;
    const q = search.toLowerCase();
    return BIDANG_KEGIATAN.map((b) => ({
      ...b,
      subBidang: b.subBidang
        .map((sb) => ({
          ...sb,
          kegiatan: sb.kegiatan.filter(
            (k) =>
              k.kode.toLowerCase().includes(q) ||
              k.uraian.toLowerCase().includes(q) ||
              sb.uraian.toLowerCase().includes(q) ||
              b.uraian.toLowerCase().includes(q)
          ),
        }))
        .filter((sb) => sb.kegiatan.length > 0),
    })).filter((b) => b.subBidang.length > 0);
  }, [search]);

  const totalKegiatan = getAllKegiatan().length;

  // Saat search: paksa expand semua
  const isBidangOpen = (kode: string) =>
    search.trim() ? true : openBidang.has(kode);
  const isSubBidangOpen = (kode: string) =>
    search.trim() ? true : openSubBidang.has(kode);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4 text-teal-600" />
              Bidang &amp; Kegiatan Desa
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              5 bidang · 27 sub-bidang · {totalKegiatan} kegiatan default (Permendagri 20/2018)
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
            placeholder="Cari bidang, sub-bidang, atau kegiatan..."
            className="pl-8 h-8 text-sm"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="max-height: 540px overflow-y-auto">
          {filteredTree.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Tidak ditemukan hasil untuk "{search}"
            </div>
          ) : (
            filteredTree.map((bidang) => (
              <div key={bidang.kode}>
                {/* Bidang row */}
                <button
                  onClick={() => toggleBidang(bidang.kode)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 bg-muted/60 border-b hover:bg-muted/80 transition-colors text-left"
                >
                  {isBidangOpen(bidang.kode) ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  {isBidangOpen(bidang.kode) ? (
                    <FolderOpen className={cn("h-4 w-4 shrink-0", BIDANG_COLOR[bidang.kode])} />
                  ) : (
                    <Folder className={cn("h-4 w-4 shrink-0", BIDANG_COLOR[bidang.kode])} />
                  )}
                  <span className={cn("font-bold text-sm", BIDANG_COLOR[bidang.kode])}>
                    Bidang {bidang.kode}
                  </span>
                  <span className="font-semibold text-sm text-foreground">
                    {bidang.uraian}
                  </span>
                  <Badge variant="secondary" className="ml-auto text-[10px]">
                    {bidang.subBidang.reduce((a, sb) => a + sb.kegiatan.length, 0)} kegiatan
                  </Badge>
                </button>

                {/* Sub-Bidang rows */}
                {isBidangOpen(bidang.kode) &&
                  bidang.subBidang.map((sb) => (
                    <div key={sb.kode}>
                      <button
                        onClick={() => toggleSubBidang(`${bidang.kode}.${sb.kode}`)}
                        className="w-full flex items-center gap-2 pl-8 pr-3 py-2 border-b hover:bg-muted/40 transition-colors text-left bg-background"
                      >
                        {isSubBidangOpen(`${bidang.kode}.${sb.kode}`) ? (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        )}
                        <span className="font-mono text-[11px] text-muted-foreground w-12 shrink-0">
                          {bidang.kode}.{sb.kode}
                        </span>
                        <span className="font-medium text-sm text-foreground flex-1 text-left">
                          {sb.uraian}
                        </span>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {sb.kegiatan.length}
                        </Badge>
                      </button>

                      {/* Kegiatan rows */}
                      {isSubBidangOpen(`${bidang.kode}.${sb.kode}`) &&
                        sb.kegiatan.map((k) => (
                          <div
                            key={k.kode}
                            className="flex items-start gap-2 pl-16 pr-3 py-1.5 border-b border-border/30 hover:bg-muted/20 transition-colors"
                          >
                            <FileText className="h-3 w-3 text-muted-foreground/60 shrink-0 mt-0.5" />
                            <span className="font-mono text-[10px] text-muted-foreground/70 w-16 shrink-0">
                              {bidang.kode}.{sb.kode}.{k.kode.split(".").pop()}
                            </span>
                            <span className="text-xs text-muted-foreground flex-1">
                              {k.uraian}
                            </span>
                          </div>
                        ))}
                    </div>
                  ))}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
