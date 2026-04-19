"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, BookOpen, Layers } from "lucide-react";
import FormDesa from "@/components/modules/master/FormDesa";
import KodeRekeningTable from "@/components/modules/master/KodeRekeningTable";
import BidangKegiatanTree from "@/components/modules/master/BidangKegiatanTree";

export default function MasterPage() {
  return (
    <div className="flex flex-col gap-4 p-6 md:p-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold tracking-tight">Data Master</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Kelola data referensi: identitas desa, kode rekening, dan bidang kegiatan
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="desa" className="w-full flex flex-col">
        <TabsList className="w-full md:w-auto grid grid-cols-3 md:inline-flex h-9">
          <TabsTrigger value="desa" className="text-xs gap-1.5">
            <Building2 className="h-3.5 w-3.5 hidden sm:block" />
            Data Desa
          </TabsTrigger>
          <TabsTrigger value="rekening" className="text-xs gap-1.5">
            <BookOpen className="h-3.5 w-3.5 hidden sm:block" />
            Kode Rekening
          </TabsTrigger>
          <TabsTrigger value="kegiatan" className="text-xs gap-1.5">
            <Layers className="h-3.5 w-3.5 hidden sm:block" />
            Bidang/Kegiatan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="desa" className="mt-4 w-full">
          <FormDesa />
        </TabsContent>

        <TabsContent value="rekening" className="mt-4 w-full">
          <KodeRekeningTable />
        </TabsContent>

        <TabsContent value="kegiatan" className="mt-4 w-full">
          <BidangKegiatanTree />
        </TabsContent>
      </Tabs>
    </div>
  );
}
