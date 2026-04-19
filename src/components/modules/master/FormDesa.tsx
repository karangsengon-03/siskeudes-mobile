"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, Building2 } from "lucide-react";
import { useDataDesa, type DataDesa } from "@/hooks/useMaster";

const DEFAULT_VALUES: DataDesa = {
  namaDesa: "Karang Sengon",
  kecamatan: "Klabang",
  kabupaten: "Bondowoso",
  provinsi: "Jawa Timur",
  namaKepala: "",
  namaSekdes: "",
  namaBendahara: "",
  kodePos: "",
};

export default function FormDesa() {
  const { data, loading, saving, save } = useDataDesa();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<DataDesa>({ defaultValues: DEFAULT_VALUES });

  // Isi form saat data RTDB sudah loaded
  useEffect(() => {
    if (data) reset(data);
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
            <Input
              id="namaDesa"
              placeholder="Karang Sengon"
              {...register("namaDesa", { required: "Nama desa wajib diisi" })}
            />
            {errors.namaDesa && (
              <p className="text-xs text-red-500">{errors.namaDesa.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="kecamatan">
              Kecamatan <span className="text-red-500">*</span>
            </Label>
            <Input
              id="kecamatan"
              placeholder="Klabang"
              {...register("kecamatan", { required: "Kecamatan wajib diisi" })}
            />
            {errors.kecamatan && (
              <p className="text-xs text-red-500">{errors.kecamatan.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="kabupaten">
              Kabupaten/Kota <span className="text-red-500">*</span>
            </Label>
            <Input
              id="kabupaten"
              placeholder="Bondowoso"
              {...register("kabupaten", { required: "Kabupaten wajib diisi" })}
            />
            {errors.kabupaten && (
              <p className="text-xs text-red-500">{errors.kabupaten.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="provinsi">
              Provinsi <span className="text-red-500">*</span>
            </Label>
            <Input
              id="provinsi"
              placeholder="Jawa Timur"
              {...register("provinsi", { required: "Provinsi wajib diisi" })}
            />
            {errors.provinsi && (
              <p className="text-xs text-red-500">{errors.provinsi.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="kodePos">Kode Pos</Label>
            <Input
              id="kodePos"
              placeholder="68285"
              maxLength={5}
              {...register("kodePos")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pejabat Desa */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Pejabat Desa</CardTitle>
          <CardDescription className="text-xs">
            Nama pejabat digunakan di tanda tangan laporan PDF
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="namaKepala">
              Kepala Desa <span className="text-red-500">*</span>
            </Label>
            <Input
              id="namaKepala"
              placeholder="Nama Kepala Desa"
              {...register("namaKepala", { required: "Nama kepala desa wajib diisi" })}
            />
            {errors.namaKepala && (
              <p className="text-xs text-red-500">{errors.namaKepala.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="namaSekdes">Sekretaris Desa</Label>
            <Input
              id="namaSekdes"
              placeholder="Nama Sekretaris Desa"
              {...register("namaSekdes")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="namaBendahara">
              Bendahara Desa <span className="text-red-500">*</span>
            </Label>
            <Input
              id="namaBendahara"
              placeholder="Nama Bendahara Desa (Kaur Keuangan)"
              {...register("namaBendahara", { required: "Nama bendahara wajib diisi" })}
            />
            {errors.namaBendahara && (
              <p className="text-xs text-red-500">{errors.namaBendahara.message}</p>
            )}
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
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Menyimpan..." : "Simpan Data Desa"}
        </Button>
      </div>
    </form>
  );
}
