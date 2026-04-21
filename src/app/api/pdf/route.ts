// src/app/api/pdf/route.ts
// Generate PDF server-side dengan renderToBuffer

import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
// Gunakan React dari @react-pdf/renderer scope, bukan dari Next.js
import * as ReactPDF from "@react-pdf/renderer";
import React from "react";
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const componentMap: Record<string, React.ComponentType<any>> = {
      "apbdes-global": PDFAPBDesGlobal,
      "apbdes-per-kegiatan": PDFAPBDesPerKegiatan,
      "apbdes-rinci": PDFAPBDesRinci,
      "bku-bulanan": PDFBKUBulanan,
      "buku-kas-tunai": PDFBukuKasTunai,
      "buku-bank": PDFBukuBank,
      "buku-pajak": PDFBukuPajak,
      "buku-pajak-rekap": PDFBukuPajakRekap,
      "buku-panjar": PDFBukuPanjar,
      "realisasi-semester-i": PDFRealisasiSemesterI,
      "dpa-per-kegiatan": PDFDPAPerKegiatan,
    };

    const Component = componentMap[type];
    if (!Component) {
      return NextResponse.json({ error: "Unknown PDF type" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(Component, props as any);
    const buffer = await renderToBuffer(element);

    return new NextResponse(new Uint8Array(buffer), {
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
