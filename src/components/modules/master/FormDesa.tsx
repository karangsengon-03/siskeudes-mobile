"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Save, Building2, Users, FileText } from "lucide-react";
import { useDataDesa, type DataDesa } from "@/hooks/useMaster";

const DEFAULT_VALUES: DataDesa = {
  namaDesa: "Karang Sengon",
  kecamatan: "Klabang",
  kabupaten: "Bondowoso",
  provinsi: "Jawa Timur",
  namaKepala: "",
  namaSekdes: "",
  namaBendahara: "",
  namaKaur: "",
  namaPelaksana: "",
  kodePos: "",
  kodeDesa: "",
  nomorPeraturanDesa: "",
  tanggalPeraturanDesa: "",
  nomorPeraturanKepDes: "",
  tanggalPeraturanKepDes: "",
};

export default function FormDesa() {
  const { data, loading, saving, save } = useDataDesa();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<DataDesa>({ defaultValues: DEFAULT_VALUES });

  useEffect(() => {
    if (data) reset({ ...DEFAULT_VALUES, ...data });
  }, [data, reset]);

  const onSubmit = (values: DataDesa) => save(values);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Memuat data desa...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Identitas Desa */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-teal-600" />
            Identitas Desa
          </CardTitle>
          <CardDescription className="text-xs">
            Data ini digunakan sebagai header laporan keuangan desa
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="namaDesa">
              Nama Desa <span className="text-red-500">*</span>
            </Label>
            <Input id="namaDesa" placeholder="Karang Sengon"
              {...register("namaDesa", { required: "Nama desa wajib diisi" })} />
            {errors.namaDesa && <p className="text-xs text-red-500">{errors.namaDesa.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="kecamatan">
              Kecamatan <span className="text-red-500">*</span>
            </Label>
            <Input id="kecamatan" placeholder="Klabang"
              {...register("kecamatan", { required: "Kecamatan wajib diisi" })} />
            {errors.kecamatan && <p className="text-xs text-red-500">{errors.kecamatan.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="kabupaten">
              Kabupaten/Kota <span className="text-red-500">*</span>
            </Label>
            <Input id="kabupaten" placeholder="Bondowoso"
              {...register("kabupaten", { required: "Kabupaten wajib diisi" })} />
            {errors.kabupaten && <p className="text-xs text-red-500">{errors.kabupaten.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="provinsi">
              Provinsi <span className="text-red-500">*</span>
            </Label>
            <Input id="provinsi" placeholder="Jawa Timur"
              {...register("provinsi", { required: "Provinsi wajib diisi" })} />
            {errors.provinsi && <p className="text-xs text-red-500">{errors.provinsi.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="kodePos">Kode Pos</Label>
            <Input id="kodePos" placeholder="68285" maxLength={5} {...register("kodePos")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="kodeDesa">
              Kode Desa <span className="text-red-500">*</span>
            </Label>
            <Input id="kodeDesa" placeholder="14.2007"
              {...register("kodeDesa", { required: "Kode desa wajib diisi" })} />
            {errors.kodeDesa && <p className="text-xs text-red-500">{errors.kodeDesa.message}</p>}
            <p className="text-xs text-muted-foreground">Digunakan untuk penomoran dokumen (SPP, KWT, dll)</p>
          </div>
        </CardContent>
      </Card>

      {/* Pejabat Desa */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-teal-600" />
            Pejabat Desa
          </CardTitle>
          <CardDescription className="text-xs">
            Nama pejabat digunakan di tanda tangan laporan PDF
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="namaKepala">
              Kepala Desa <span className="text-red-500">*</span>
            </Label>
            <Input id="namaKepala" placeholder="Nama Kepala Desa"
              {...register("namaKepala", { required: "Nama kepala desa wajib diisi" })} />
            {errors.namaKepala && <p className="text-xs text-red-500">{errors.namaKepala.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="namaSekdes">Sekretaris Desa</Label>
            <Input id="namaSekdes" placeholder="Nama Sekretaris Desa" {...register("namaSekdes")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="namaBendahara">
              Bendahara Desa <span className="text-red-500">*</span>
            </Label>
            <Input id="namaBendahara" placeholder="Nama Bendahara (Kaur Keuangan)"
              {...register("namaBendahara", { required: "Nama bendahara wajib diisi" })} />
            {errors.namaBendahara && <p className="text-xs text-red-500">{errors.namaBendahara.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="namaKaur">Kepala Urusan Keuangan</Label>
            <Input id="namaKaur" placeholder="Nama Kaur Keuangan" {...register("namaKaur")} />
            <p className="text-xs text-muted-foreground">Untuk TTD dokumen Pembiayaan</p>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="namaPelaksana">Pelaksana Kegiatan Anggaran</Label>
            <Input id="namaPelaksana" placeholder="Nama Pelaksana Kegiatan" {...register("namaPelaksana")} />
            <p className="text-xs text-muted-foreground">Untuk TTD RAB Belanja dan dokumen SPP</p>
          </div>
        </CardContent>
      </Card>

      {/* Peraturan Desa */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-teal-600" />
            Peraturan Desa
          </CardTitle>
          <CardDescription className="text-xs">
            Digunakan di kop laporan APBDes dan PAK
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="nomorPeraturanDesa">Nomor Peraturan Desa (APBDes)</Label>
            <Input id="nomorPeraturanDesa" placeholder="05" {...register("nomorPeraturanDesa")} />
            <p className="text-xs text-muted-foreground">contoh: 05</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tanggalPeraturanDesa">Tanggal Peraturan Desa (APBDes)</Label>
            <Input id="tanggalPeraturanDesa" placeholder="22 January 2024"
              {...register("tanggalPeraturanDesa")} />
            <p className="text-xs text-muted-foreground">contoh: 22 January 2024</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nomorPeraturanKepDes">Nomor Peraturan Kepala Desa</Label>
            <Input id="nomorPeraturanKepDes" placeholder="03" {...register("nomorPeraturanKepDes")} />
            <p className="text-xs text-muted-foreground">contoh: 03</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tanggalPeraturanKepDes">Tanggal Peraturan Kepala Desa</Label>
            <Input id="tanggalPeraturanKepDes" placeholder="22 January 2024"
              {...register("tanggalPeraturanKepDes")} />
            <p className="text-xs text-muted-foreground">contoh: 22 January 2024</p>
          </div>
        </CardContent>
      </Card>

      {/* Tombol Simpan */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={saving || !isDirty}
          className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Menyimpan..." : "Simpan Data Desa"}
        </Button>
      </div>
    </form>
  );
}
