// src/app/dashboard/pembukuan/saldo-awal/page.tsx
"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, Info, Wallet, Building2, Receipt } from "lucide-react";
import { useSaldoAwal, useSaveSaldoAwal, type SaldoAwal } from "@/hooks/useSaldoAwal";
import { useAppStore } from "@/store/appStore";
import { toast } from "sonner";

function parseCurrency(val: string): number {
  return Number(val.replace(/\./g, "").replace(",", ".")) || 0;
}

function formatCurrency(val: number): string {
  if (!val && val !== 0) return "";
  return val.toLocaleString("id-ID");
}

type FormValues = {
  kasTunai: string;
  bank: string;
  ppn: string;
  pph22: string;
  pph23: string;
  pajakDaerah: string;
  ekuitas: string;
};

function toForm(data: SaldoAwal): FormValues {
  return {
    kasTunai: formatCurrency(data.kasTunai),
    bank: formatCurrency(data.bank),
    ppn: formatCurrency(data.hutangPajak.ppn),
    pph22: formatCurrency(data.hutangPajak.pph22),
    pph23: formatCurrency(data.hutangPajak.pph23),
    pajakDaerah: formatCurrency(data.hutangPajak.pajakDaerah),
    ekuitas: formatCurrency(data.ekuitas),
  };
}

const EMPTY_FORM: FormValues = {
  kasTunai: "", bank: "", ppn: "", pph22: "", pph23: "", pajakDaerah: "", ekuitas: "",
};

function CurrencyInput({ value, onChange, id, placeholder }: {
  value: string; onChange: (v: string) => void; id: string; placeholder?: string;
}) {
  return (
    <Input
      id={id}
      inputMode="numeric"
      placeholder={placeholder ?? "0"}
      value={value}
      onChange={(e) => {
        const raw = e.target.value.replace(/\./g, "").replace(/[^0-9]/g, "");
        onChange(raw ? formatCurrency(Number(raw)) : "");
      }}
      className="text-right font-mono"
    />
  );
}

export default function SaldoAwalPage() {
  const tahun = useAppStore((s) => s.tahunAnggaran);
  const { data, isLoading } = useSaldoAwal();
  const { mutate: save, isPending } = useSaveSaldoAwal();

  const { control, handleSubmit, reset, watch } = useForm<FormValues>({
    defaultValues: EMPTY_FORM,
  });

  useEffect(() => {
    if (data) reset(toForm(data));
  }, [data, reset]);

  const vals = watch();
  const totalKas = parseCurrency(vals.kasTunai) + parseCurrency(vals.bank);
  const totalHutang = parseCurrency(vals.ppn) + parseCurrency(vals.pph22) +
    parseCurrency(vals.pph23) + parseCurrency(vals.pajakDaerah);

  const onSubmit = (form: FormValues) => {
    save({
      kasTunai: parseCurrency(form.kasTunai),
      bank: parseCurrency(form.bank),
      hutangPajak: {
        ppn: parseCurrency(form.ppn),
        pph22: parseCurrency(form.pph22),
        pph23: parseCurrency(form.pph23),
        pajakDaerah: parseCurrency(form.pajakDaerah),
      },
      ekuitas: parseCurrency(form.ekuitas),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-12 justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Memuat Saldo Awal...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto pb-24">
      {/* Info */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <p>
          Saldo awal adalah kondisi kas dan kewajiban desa pada awal tahun anggaran{" "}
          <strong>{tahun}</strong>. Data ini digunakan sebagai "Saldo Pindahan" di BKU
          dan dasar hutang pajak tahun lalu.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Kas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4 text-teal-600" />
              Kas Awal
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="kasTunai">Kas Tunai Bendahara (Rp)</Label>
              <Controller
                control={control}
                name="kasTunai"
                render={({ field }) => (
                  <CurrencyInput id="kasTunai" value={field.value} onChange={field.onChange} />
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bank">Rekening Kas Bank (Rp)</Label>
              <Controller
                control={control}
                name="bank"
                render={({ field }) => (
                  <CurrencyInput id="bank" value={field.value} onChange={field.onChange} />
                )}
              />
            </div>
            <div className="sm:col-span-2 text-sm text-muted-foreground flex justify-between border-t pt-3">
              <span>Total Kas Awal</span>
              <span className="font-semibold font-mono">
                Rp {totalKas.toLocaleString("id-ID")}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Hutang Pajak */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-4 w-4 text-teal-600" />
              Hutang Pajak Tahun Lalu
            </CardTitle>
            <CardDescription className="text-xs">
              Pajak yang sudah dipotong dari tahun sebelumnya namun belum disetorkan ke kas negara
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {(
              [
                { name: "ppn" as const, label: "Hutang PPN" },
                { name: "pph22" as const, label: "Hutang PPh Pasal 22" },
                { name: "pph23" as const, label: "Hutang PPh Pasal 23" },
                { name: "pajakDaerah" as const, label: "Pajak Daerah" },
              ] as const
            ).map(({ name, label }) => (
              <div key={name} className="space-y-1.5">
                <Label htmlFor={name}>{label} (Rp)</Label>
                <Controller
                  control={control}
                  name={name}
                  render={({ field }) => (
                    <CurrencyInput id={name} value={field.value} onChange={field.onChange} />
                  )}
                />
              </div>
            ))}
            <div className="sm:col-span-2 text-sm text-muted-foreground flex justify-between border-t pt-3">
              <span>Total Hutang Pajak</span>
              <span className="font-semibold font-mono">
                Rp {totalHutang.toLocaleString("id-ID")}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Ekuitas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-teal-600" />
              Ekuitas SAL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label htmlFor="ekuitas">Ekuitas / Ekuitas SAL (Rp)</Label>
              <Controller
                control={control}
                name="ekuitas"
                render={({ field }) => (
                  <CurrencyInput id="ekuitas" value={field.value} onChange={field.onChange} />
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isPending}
            className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isPending ? "Menyimpan..." : "Simpan Saldo Awal"}
          </Button>
        </div>
      </form>
    </div>
  );
}
