// src/app/api/pdf/route.ts
// Generate PDF di server (Node.js) — hindari browser bundle issue

import { NextRequest, NextResponse } from "next/server";
import { pdf } from "@react-pdf/renderer";
import React from "react";

// Import semua komponen PDF (server-side, tidak ada masalah ESM)
import { PDFAPBDesGlobal } from "@/components/modules/pelaporan/PDFAPBDesGlobal";
import { PDFAPBDesPerKegiatan } from "@/components/modules/pelaporan/PDFAPBDesPerKegiatan";
import { PDFAPBDesRinci } from "@/components/modules/pelaporan/PDFAPBDesRinci";
import { PDFBKUBulanan } from "@/components/modules/pelaporan/PDFBKUBulanan";
import { PDFBukuKasTunai } from "@/components/modules/pelaporan/PDFBukuKasTunai";
import { PDFBukuBank } from "@/components/modules/pelaporan/PDFBukuBank";
import { PDFBukuPajak } from "@/components/modules/pelaporan/PDFBukuPajak";
import { PDFBukuPajakRekap } from "@/components/modules/pelaporan/PDFBukuPajakRekap";
import { PDFBukuPanjar } from "@/components/modules/pelaporan/PDFBukuPanjar";
import { PDFRealisasiSemesterI } from "@/components/modules/pelaporan/PDFRealisasiSemesterI";
import { PDFDPAPerKegiatan } from "@/components/modules/pelaporan/PDFDPAPerKegiatan";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, props } = body as { type: string; props: Record<string, unknown> };

    let docElement: React.ReactElement | null = null;

    switch (type) {
      case "apbdes-global":
        docElement = React.createElement(PDFAPBDesGlobal, props as never);
        break;
      case "apbdes-per-kegiatan":
        docElement = React.createElement(PDFAPBDesPerKegiatan, props as never);
        break;
      case "apbdes-rinci":
        docElement = React.createElement(PDFAPBDesRinci, props as never);
        break;
      case "bku-bulanan":
        docElement = React.createElement(PDFBKUBulanan, props as never);
        break;
      case "buku-kas-tunai":
        docElement = React.createElement(PDFBukuKasTunai, props as never);
        break;
      case "buku-bank":
        docElement = React.createElement(PDFBukuBank, props as never);
        break;
      case "buku-pajak":
        docElement = React.createElement(PDFBukuPajak, props as never);
        break;
      case "buku-pajak-rekap":
        docElement = React.createElement(PDFBukuPajakRekap, props as never);
        break;
      case "buku-panjar":
        docElement = React.createElement(PDFBukuPanjar, props as never);
        break;
      case "realisasi-semester-i":
        docElement = React.createElement(PDFRealisasiSemesterI, props as never);
        break;
      case "dpa-per-kegiatan":
        docElement = React.createElement(PDFDPAPerKegiatan, props as never);
        break;
      default:
        return NextResponse.json({ error: "Unknown PDF type" }, { status: 400 });
    }

    const blob = await pdf(docElement).toBlob();
    const buffer = Buffer.from(await blob.arrayBuffer());

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${type}.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json({ error: "Gagal generate PDF" }, { status: 500 });
  }
}
