"use client";

import { useState, useEffect } from "react";
import { useFieldArray, useForm, Controller } from "react-hook-form";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useBidangKegiatan } from "@/hooks/useMaster";
import { BIDANG_KEGIATAN } from "@/lib/constants/bidangKegiatan";
import { useSaveKegiatan } from "@/hooks/useAPBDes";
import type { KegiatanAPBDes, SumberDana } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";

// Kode rekening belanja level 4 (rincian obyek)
// Kode rekening belanja level 4 — Permendagri 20/2018 (lengkap)
const REKENING_BELANJA = [
  // 5.1 Belanja Pegawai
  { kode: "5.1.01.01", nama: "Penghasilan Tetap Kepala Desa" },
  { kode: "5.1.01.02", nama: "Penghasilan Tetap Perangkat Desa" },
  { kode: "5.1.02.01", nama: "Tunjangan Kepala Desa" },
  { kode: "5.1.02.02", nama: "Tunjangan Perangkat Desa" },
  { kode: "5.1.02.03", nama: "Tunjangan BPD" },
  { kode: "5.1.03.01", nama: "Jaminan Sosial Kesehatan Kepala Desa" },
  { kode: "5.1.03.02", nama: "Jaminan Sosial Ketenagakerjaan Kepala Desa" },
  { kode: "5.1.03.03", nama: "Jaminan Sosial Kesehatan Perangkat Desa" },
  { kode: "5.1.03.04", nama: "Jaminan Sosial Ketenagakerjaan Perangkat Desa" },
  { kode: "5.1.04.01", nama: "Tunjangan Purna Tugas Kepala Desa" },
  { kode: "5.1.04.02", nama: "Tunjangan Purna Tugas Perangkat Desa" },
  // 5.2 Belanja Barang/Jasa
  { kode: "5.2.01.01", nama: "Honorarium Pengelola Keuangan Desa" },
  { kode: "5.2.01.02", nama: "Honorarium Tim Pelaksana Kegiatan" },
  { kode: "5.2.01.03", nama: "Honorarium Tim Pengadaan Barang/Jasa" },
  { kode: "5.2.01.04", nama: "Honorarium Petugas/Operator Desa" },
  { kode: "5.2.01.90", nama: "Honorarium Lainnya" },
  { kode: "5.2.02.01", nama: "Belanja Perlengkapan - Alat Tulis Kantor dan Benda Pos" },
  { kode: "5.2.02.02", nama: "Belanja Perlengkapan - Alat/Bahan Kebersihan dan Sanitasi" },
  { kode: "5.2.02.03", nama: "Belanja Perlengkapan - Bahan Bakar Minyak/Gas/Pelumas" },
  { kode: "5.2.02.04", nama: "Belanja Perlengkapan - Dokumentasi/Publikasi/Dekorasi" },
  { kode: "5.2.02.05", nama: "Belanja Perlengkapan - Konsumsi/Makanan dan Minuman" },
  { kode: "5.2.02.06", nama: "Belanja Perlengkapan - Pakaian Dinas/Seragam/Atribut" },
  { kode: "5.2.02.07", nama: "Belanja Perlengkapan - Alat dan Bahan Pertanian" },
  { kode: "5.2.02.08", nama: "Belanja Perlengkapan - Alat dan Bahan Kesehatan/Obat-obatan" },
  { kode: "5.2.02.90", nama: "Belanja Perlengkapan - Lainnya" },
  { kode: "5.2.03.01", nama: "Belanja Jasa - Jasa Sewa Gedung/Ruang Rapat/Pertemuan" },
  { kode: "5.2.03.02", nama: "Belanja Jasa - Jasa Sewa Peralatan/Perlengkapan Kantor" },
  { kode: "5.2.03.03", nama: "Belanja Jasa - Jasa Sewa Sarana Mobilitas/Kendaraan" },
  { kode: "5.2.03.04", nama: "Belanja Jasa - Jasa Sewa Alat Berat" },
  { kode: "5.2.03.05", nama: "Belanja Jasa - Jasa Profesi (Narasumber/Tenaga Ahli/Instruktur)" },
  { kode: "5.2.03.06", nama: "Belanja Jasa - Jasa Upah Tenaga Kerja" },
  { kode: "5.2.03.07", nama: "Belanja Jasa - Jasa Konsultansi/Perencanaan" },
  { kode: "5.2.03.08", nama: "Belanja Jasa - Jasa Konsultansi/Pengawasan" },
  { kode: "5.2.03.09", nama: "Belanja Jasa - Jasa Pelayanan Kesehatan" },
  { kode: "5.2.03.90", nama: "Belanja Jasa - Lainnya" },
  { kode: "5.2.04.01", nama: "Belanja Perjalanan Dinas - Dalam Kabupaten/Kota" },
  { kode: "5.2.04.02", nama: "Belanja Perjalanan Dinas - Ke Luar Kabupaten/Kota dalam Provinsi" },
  { kode: "5.2.04.03", nama: "Belanja Perjalanan Dinas - Ke Luar Provinsi" },
  { kode: "5.2.05.01", nama: "Belanja Operasional Perkantoran - Listrik" },
  { kode: "5.2.05.02", nama: "Belanja Operasional Perkantoran - Air" },
  { kode: "5.2.05.03", nama: "Belanja Operasional Perkantoran - Telepon/Komunikasi/Internet" },
  { kode: "5.2.05.04", nama: "Belanja Operasional Perkantoran - Langganan Koran/Majalah/Publikasi" },
  { kode: "5.2.05.90", nama: "Belanja Operasional Perkantoran - Lainnya" },
  { kode: "5.2.06.01", nama: "Belanja Pemeliharaan - Pemeliharaan Kendaraan Dinas" },
  { kode: "5.2.06.02", nama: "Belanja Pemeliharaan - Pemeliharaan Peralatan dan Mesin" },
  { kode: "5.2.06.03", nama: "Belanja Pemeliharaan - Pemeliharaan Gedung/Bangunan Kantor" },
  { kode: "5.2.06.04", nama: "Belanja Pemeliharaan - Pemeliharaan Jalan/Sarana Prasarana" },
  { kode: "5.2.06.90", nama: "Belanja Pemeliharaan - Lainnya" },
  { kode: "5.2.07.01", nama: "Belanja Barang dan Jasa yang Diserahkan kepada Masyarakat" },
  { kode: "5.2.07.02", nama: "Belanja Beasiswa Pendidikan" },
  { kode: "5.2.07.03", nama: "Belanja Bantuan Pangan/Sembako" },
  { kode: "5.2.07.90", nama: "Belanja Barang/Jasa lainnya yang Diserahkan kepada Masyarakat" },
  // 5.3 Belanja Modal
  { kode: "5.3.01.01", nama: "Belanja Modal Peralatan - Komputer/Laptop/Printer/Scanner" },
  { kode: "5.3.01.02", nama: "Belanja Modal Peralatan - Kamera/Handycam/Proyektor" },
  { kode: "5.3.01.03", nama: "Belanja Modal Peralatan - Mesin Tik/Mesin Hitung" },
  { kode: "5.3.01.04", nama: "Belanja Modal Peralatan - Meja dan Kursi Kerja/Rapat" },
  { kode: "5.3.01.05", nama: "Belanja Modal Peralatan - Lemari Arsip/Filing Kabinet" },
  { kode: "5.3.01.06", nama: "Belanja Modal Peralatan - AC/Kipas Angin/Penghangat Ruangan" },
  { kode: "5.3.01.07", nama: "Belanja Modal Peralatan - Alat Komunikasi/HT" },
  { kode: "5.3.01.08", nama: "Belanja Modal Peralatan - Alat Pertanian/Peternakan" },
  { kode: "5.3.01.90", nama: "Belanja Modal Peralatan - Lainnya" },
  { kode: "5.3.02.01", nama: "Belanja Modal Gedung dan Bangunan - Bangunan Kantor/Balai Desa" },
  { kode: "5.3.02.02", nama: "Belanja Modal Gedung dan Bangunan - Bangunan PAUD/TPA/TPQ" },
  { kode: "5.3.02.03", nama: "Belanja Modal Gedung dan Bangunan - Bangunan Posyandu/PKD" },
  { kode: "5.3.02.04", nama: "Belanja Modal Gedung dan Bangunan - Bangunan Sanggar/Serbaguna" },
  { kode: "5.3.02.90", nama: "Belanja Modal Gedung dan Bangunan - Lainnya" },
  { kode: "5.3.03.01", nama: "Belanja Modal Jalan/Prasarana - Jalan Desa/Jalan Lingkungan" },
  { kode: "5.3.03.02", nama: "Belanja Modal Jalan/Prasarana - Jembatan Desa" },
  { kode: "5.3.03.03", nama: "Belanja Modal Jalan/Prasarana - Irigasi/Saluran Air" },
  { kode: "5.3.03.04", nama: "Belanja Modal Jalan/Prasarana - Drainase/Selokan" },
  { kode: "5.3.03.05", nama: "Belanja Modal Jalan/Prasarana - MCK/Sanitasi Umum" },
  { kode: "5.3.03.06", nama: "Belanja Modal Jalan/Prasarana - Air Bersih/Sumur Bor/Reservoir" },
  { kode: "5.3.03.07", nama: "Belanja Modal Jalan/Prasarana - Embung/Penampung Air" },
  { kode: "5.3.03.08", nama: "Belanja Modal Jalan/Prasarana - Tembok Penahan Tanah" },
  { kode: "5.3.03.90", nama: "Belanja Modal Jalan/Prasarana - Lainnya" },
  // 5.4 Belanja Tidak Terduga
  { kode: "5.4.01.01", nama: "Belanja Tidak Terduga" },
];

const SUMBER_DANA: SumberDana[] = ["DD", "ADD", "PAD", "BHPR", "BKP", "BKK", "LAIN"];

interface SubItemForm {
  id: string;
  uraian: string;
  volume: number;
  satuan: string;
  hargaSatuan: number;
}

interface RekeningForm {
  id: string;
  kodeRekening: string;
  namaRekening: string;
  sumberDana: SumberDana;
  subItems: SubItemForm[];
}

interface FormValues {
  bidangKode: string;
  subBidangKode: string;
  kodeKegiatan: string;
  namaKegiatan: string;
  rekeningList: RekeningForm[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  editData?: KegiatanAPBDes | null;
}

export function FormKegiatan({ open, onClose, editData }: Props) {
  const { bidang: bidangList } = useBidangKegiatan();
  const saveKegiatan = useSaveKegiatan();

  const [expandedRekening, setExpandedRekening] = useState<Record<string, boolean>>({});

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      bidangKode: "",
      subBidangKode: "",
      kodeKegiatan: "",
      namaKegiatan: "",
      rekeningList: [],
    },
  });

  const { fields: rekeningFields, append: appendRekening, remove: removeRekening } =
    useFieldArray({ control, name: "rekeningList" });

  const watchedBidang = watch("bidangKode");
  const watchedSubBidang = watch("subBidangKode");
  const watchedRekeningList = watch("rekeningList");

  // Populate when editing
  useEffect(() => {
    if (open && editData) {
      reset({
        bidangKode: editData.bidangKode,
        subBidangKode: editData.subBidangKode,
        kodeKegiatan: editData.kodeKegiatan ?? "",
        namaKegiatan: editData.namaKegiatan,
        rekeningList: editData.rekeningList.map((r) => ({
          id: r.id,
          kodeRekening: r.kodeRekening,
          namaRekening: r.namaRekening,
          sumberDana: r.sumberDana,
          subItems: r.subItems.map((s) => ({
            id: s.id,
            uraian: s.uraian,
            volume: s.volume,
            satuan: s.satuan,
            hargaSatuan: s.hargaSatuan,
          })),
        })),
      });
    } else if (open && !editData) {
      reset({ bidangKode: "", subBidangKode: "", namaKegiatan: "", rekeningList: [] });
    }
  }, [open, editData, reset]);

  // Bidang/sub-bidang/kegiatan dari konstanta via hook
  const subBidangList = (bidangList ?? []).find((b) => b.kode === watchedBidang)?.subBidang ?? [];
  const kegiatanList = (() => {
    if (!watchedBidang || !watchedSubBidang) return [];
    const bidang = BIDANG_KEGIATAN.find((b) => b.kode === watchedBidang);
    const sb = bidang?.subBidang.find((s) => s.kode === watchedSubBidang);
    return sb?.kegiatan ?? [];
  })();

  function addRekening() {
    const id = nanoid(8);
    appendRekening({
      id,
      kodeRekening: "",
      namaRekening: "",
      sumberDana: "DD",
      subItems: [{ id: nanoid(8), uraian: "", volume: 1, satuan: "unit", hargaSatuan: 0 }],
    });
    setExpandedRekening((prev) => ({ ...prev, [id]: true }));
  }

  function calcTotalRekening(idx: number) {
    const items = watchedRekeningList[idx]?.subItems ?? [];
    return items.reduce((acc, s) => acc + (Number(s.volume) || 0) * (Number(s.hargaSatuan) || 0), 0);
  }

  function calcGrandTotal() {
    return (watchedRekeningList ?? []).reduce((acc, _, idx) => acc + calcTotalRekening(idx), 0);
  }

  async function onSubmit(data: FormValues) {
    console.log("submit data:", data);
    if (data.rekeningList.length === 0 && !editData) {
      toast.error("Tambahkan minimal 1 kode rekening");
      return;
    }
    for (const r of data.rekeningList) {
      if (!r.kodeRekening) { toast.error("Pilih kode rekening untuk semua item"); return; }
      if (r.subItems.length === 0) { toast.error("Setiap rekening wajib memiliki minimal 1 sub-item RAB"); return; }
    }

    const bidangData = bidangList.find((b) => b.kode === data.bidangKode);
    const subBidangData = subBidangList.find((s) => s.kode === data.subBidangKode);

    try {
      await saveKegiatan.mutateAsync({
        id: editData?.id,
        bidangKode: data.bidangKode,
        bidangNama: bidangData?.nama ?? "",
        subBidangKode: data.subBidangKode,
        subBidangNama: subBidangData?.nama ?? "",
        kodeKegiatan: data.kodeKegiatan,
        namaKegiatan: data.namaKegiatan,
        rekeningList: data.rekeningList.map((r) => ({
          id: r.id,
          kodeRekening: r.kodeRekening,
          namaRekening: r.namaRekening,
          sumberDana: r.sumberDana,
          subItems: r.subItems.map((s) => ({
            id: s.id,
            uraian: s.uraian,
            volume: Number(s.volume),
            satuan: s.satuan,
            hargaSatuan: Number(s.hargaSatuan),
            jumlah: Number(s.volume) * Number(s.hargaSatuan),
          })),
          totalPagu: r.subItems.reduce(
            (acc, s) => acc + Number(s.volume) * Number(s.hargaSatuan), 0
          ),
        })),
        totalPagu: 0, // recalculated in hook
        status: editData?.status ?? "draft",
      });
      toast.success(editData ? "Kegiatan diperbarui" : "Kegiatan ditambahkan");
      onClose();
    } catch {
      toast.error("Gagal menyimpan kegiatan");
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="h-[95dvh] flex flex-col p-0 overflow-hidden" style={{ maxHeight: "95dvh" }}>
        <SheetHeader className="px-4 pt-4 pb-2 shrink-0">
          <SheetTitle>{editData ? "Edit Kegiatan" : "Tambah Kegiatan Belanja"}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">

            {/* Bidang */}
            <div className="space-y-1.5">
              <Label>Bidang</Label>
              <Controller
                control={control}
                name="bidangKode"
                rules={{ required: true }}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      setValue("subBidangKode", "");
                      setValue("kodeKegiatan", "");
                      setValue("namaKegiatan", "");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih bidang..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(bidangList ?? []).map((b) => (
                        <SelectItem key={b.kode} value={b.kode}>
                          {b.kode}. {b.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.bidangKode && <p className="text-xs text-destructive">Wajib dipilih</p>}
            </div>

            {/* Sub-Bidang */}
            <div className="space-y-1.5">
              <Label>Sub-Bidang</Label>
              <Controller
                control={control}
                name="subBidangKode"
                rules={{ required: true }}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      setValue("kodeKegiatan", "");
                      setValue("namaKegiatan", "");
                    }}
                    disabled={!watchedBidang}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih sub-bidang..." />
                    </SelectTrigger>
                    <SelectContent>
                      {subBidangList.map((s) => (
                        <SelectItem key={s.kode} value={s.kode}>
                          {s.kode} {s.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.subBidangKode && <p className="text-xs text-destructive">Wajib dipilih</p>}
            </div>

            {/* Kegiatan — pilih dari daftar konstanta */}
            <div className="space-y-1.5">
              <Label>Kegiatan</Label>
              <Controller
                control={control}
                name="kodeKegiatan"
                rules={{ required: true }}
                render={({ field }) => (
                  <Select
                    onValueChange={(v) => {
                      field.onChange(v);
                    }}
                    disabled={!watchedSubBidang}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kegiatan..." />
                    </SelectTrigger>
                    <SelectContent>
                      {kegiatanList.map((k) => (
                        <SelectItem key={k.kode} value={k.kode}>
                          {k.kode} {k.uraian}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.kodeKegiatan && <p className="text-xs text-destructive">Wajib dipilih</p>}
            </div>

            {/* Nama Kegiatan — otomatis dari pilihan, tapi bisa diedit */}
            <div className="space-y-1.5">
              <Label>Nama Kegiatan</Label>
              <Input
                {...register("namaKegiatan", { required: true })}
                placeholder="Ketik nama kegiatan..."
              />
              {errors.namaKegiatan && <p className="text-xs text-destructive">Wajib diisi</p>}
            </div>

            <Separator />

            {/* Rincian Rekening + RAB */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Rincian Anggaran (RAB)</Label>
                <span className="text-sm font-semibold text-teal-600">
                  {formatRupiah(calcGrandTotal())}
                </span>
              </div>

              {rekeningFields.map((field, rIdx) => {
                const isExp = expandedRekening[field.id] !== false;
                const totalRek = calcTotalRekening(rIdx);

                return (
                  <div key={field.id} className="border rounded-lg overflow-hidden">
                    {/* Rekening header */}
                    <div
                      className="flex items-center justify-between px-3 py-2.5 bg-muted/40 cursor-pointer"
                      onClick={() =>
                        setExpandedRekening((prev) => ({ ...prev, [field.id]: !isExp }))
                      }
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <ChevronDown
                          className={`w-4 h-4 shrink-0 transition-transform ${isExp ? "" : "-rotate-90"}`}
                        />
                        <Controller
                          control={control}
                          name={`rekeningList.${rIdx}.kodeRekening`}
                          rules={{ required: true }}
                          render={({ field: f }) => (
                            <Select
                              value={f.value}
                              onValueChange={(v) => {
                                f.onChange(v);
                                const found = REKENING_BELANJA.find((r) => r.kode === v);
                                if (found)
                                  setValue(`rekeningList.${rIdx}.namaRekening`, found.nama);
                              }}
                            >
                              <SelectTrigger
                                className="h-7 text-xs border-0 bg-transparent p-0 shadow-none flex-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <SelectValue placeholder="Pilih rekening..." />
                              </SelectTrigger>
                              <SelectContent>
                                {REKENING_BELANJA.map((r) => (
                                  <SelectItem key={r.kode} value={r.kode}>
                                    {r.kode} — {r.nama}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-medium text-teal-600">
                          {formatRupiah(totalRek)}
                        </span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRekening(rIdx);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {isExp && (
                      <div className="px-3 py-2 space-y-2">
                        {/* Sumber Dana */}
                        <div className="flex items-center gap-2">
                          <Label className="text-xs w-24 shrink-0">Sumber Dana</Label>
                          <Controller
                            control={control}
                            name={`rekeningList.${rIdx}.sumberDana`}
                            render={({ field: f }) => (
                              <Select value={f.value} onValueChange={f.onChange}>
                                <SelectTrigger className="h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {SUMBER_DANA.map((s) => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>

                        {/* Sub-Items */}
                        <SubItemsField
                          control={control}
                          register={register}
                          rIdx={rIdx}
                          watchedRekeningList={watchedRekeningList}
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              <Button type="button" size="sm" variant="outline" className="w-full gap-1" onClick={addRekening}>
                <Plus className="w-4 h-4" /> Tambah Kode Rekening
              </Button>
            </div>
          </div>

          <SheetFooter className="px-4 py-3 border-t shrink-0 flex-row gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" className="flex-1" disabled={saveKegiatan.isPending}>
              {saveKegiatan.isPending ? "Menyimpan..." : "Simpan Kegiatan"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ── Sub-komponen SubItemsField ────────────────────────────────
function SubItemsField({
  control,
  register,
  rIdx,
  watchedRekeningList,
}: {
  control: any;
  register: any;
  rIdx: number;
  watchedRekeningList: RekeningForm[];
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `rekeningList.${rIdx}.subItems`,
  });

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground font-medium">Rincian RAB:</p>
      {fields.map((sf, sIdx) => {
        const vol = Number(watchedRekeningList[rIdx]?.subItems?.[sIdx]?.volume ?? 0);
        const harga = Number(watchedRekeningList[rIdx]?.subItems?.[sIdx]?.hargaSatuan ?? 0);
        const jumlah = vol * harga;

        return (
          <div key={sf.id} className="border rounded p-2 space-y-1.5 bg-background">
            <div className="flex items-center gap-1.5">
              <Input
                {...register(`rekeningList.${rIdx}.subItems.${sIdx}.uraian`, { required: true })}
                placeholder="Uraian..."
                className="h-7 text-xs flex-1"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive shrink-0"
                onClick={() => remove(sIdx)}
                disabled={fields.length === 1}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Volume</p>
                <Input
                  {...register(`rekeningList.${rIdx}.subItems.${sIdx}.volume`, { required: true, min: 0 })}
                  type="number"
                  min={0}
                  step="any"
                  className="h-7 text-xs"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Satuan</p>
                <Input
                  {...register(`rekeningList.${rIdx}.subItems.${sIdx}.satuan`, { required: true })}
                  placeholder="unit"
                  className="h-7 text-xs"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Harga Satuan</p>
                <Input
                  {...register(`rekeningList.${rIdx}.subItems.${sIdx}.hargaSatuan`, { required: true, min: 0 })}
                  type="number"
                  min={0}
                  className="h-7 text-xs"
                />
              </div>
            </div>
            <div className="text-right text-xs font-medium text-teal-600">
              = {formatRupiah(jumlah)}
            </div>
          </div>
        );
      })}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-7 text-xs w-full gap-1"
        onClick={() =>
          append({ id: nanoid(8), uraian: "", volume: 1, satuan: "unit", hargaSatuan: 0 })
        }
      >
        <Plus className="w-3 h-3" /> Tambah Sub-item
      </Button>
    </div>
  );
}