// src/components/modules/pelaporan/pdfStyles.ts
// Semua StyleSheet untuk @react-pdf/renderer — TIDAK boleh pakai Tailwind

import { StyleSheet, Font } from "@react-pdf/renderer";

// Register font (fallback ke Helvetica jika tidak ada custom font)
// Helvetica sudah built-in di @react-pdf/renderer
export const FONT_FAMILY = "Helvetica";
export const FONT_FAMILY_BOLD = "Helvetica-Bold";

// ─── Warna ────────────────────────────────────────────────────────
export const COLOR = {
  primary: "#1d4ed8",      // blue-700
  primaryLight: "#dbeafe", // blue-100
  header: "#1e3a5f",       // dark navy untuk header tabel
  headerText: "#ffffff",
  rowAlt: "#f8fafc",       // slate-50 untuk baris alternating
  border: "#cbd5e1",       // slate-300
  text: "#1e293b",         // slate-800
  textMuted: "#64748b",    // slate-500
  success: "#166534",      // green-800
  warning: "#92400e",      // amber-800
  totalBg: "#e2e8f0",      // slate-200
  totalText: "#0f172a",    // slate-900
};

// ─── Ukuran kertas & margin ───────────────────────────────────────
export const PAGE_PORTRAIT = {
  size: "A4" as const,
  orientation: "portrait" as const,
  style: { fontFamily: FONT_FAMILY, fontSize: 8, color: COLOR.text },
};

export const PAGE_LANDSCAPE = {
  size: "A4" as const,
  orientation: "landscape" as const,
  style: { fontFamily: FONT_FAMILY, fontSize: 8, color: COLOR.text },
};

// ─── StyleSheet utama ─────────────────────────────────────────────
export const sharedStyles = StyleSheet.create({
  // Layout
  page: {
    padding: 28,
    fontFamily: FONT_FAMILY,
    fontSize: 8,
    color: COLOR.text,
  },
  pageLandscape: {
    padding: 20,
    fontFamily: FONT_FAMILY,
    fontSize: 7.5,
    color: COLOR.text,
  },

  // Header dokumen
  docHeader: {
    marginBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: COLOR.primary,
    paddingBottom: 8,
  },
  docTitle: {
    fontSize: 11,
    fontFamily: FONT_FAMILY_BOLD,
    color: COLOR.header,
    textAlign: "center",
    marginBottom: 2,
  },
  docSubtitle: {
    fontSize: 8.5,
    textAlign: "center",
    color: COLOR.textMuted,
    marginBottom: 1,
  },
  docInfo: {
    fontSize: 8,
    textAlign: "center",
    color: COLOR.textMuted,
  },

  // Meta info desa (kiri-kanan)
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  metaBlock: {
    flexDirection: "column",
    gap: 1,
  },
  metaLabel: {
    fontSize: 7.5,
    color: COLOR.textMuted,
  },
  metaValue: {
    fontSize: 8,
    fontFamily: FONT_FAMILY_BOLD,
  },

  // Tabel
  table: {
    width: "100%",
    borderWidth: 0.5,
    borderColor: COLOR.border,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: COLOR.border,
  },
  tableRowAlt: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: COLOR.border,
    backgroundColor: COLOR.rowAlt,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLOR.header,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.primary,
  },
  tableHeaderCell: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontSize: 7.5,
    fontFamily: FONT_FAMILY_BOLD,
    color: COLOR.headerText,
    borderRightWidth: 0.5,
    borderRightColor: "#334155",
  },
  tableCell: {
    paddingVertical: 3,
    paddingHorizontal: 4,
    fontSize: 7.5,
    borderRightWidth: 0.5,
    borderRightColor: COLOR.border,
  },
  tableCellLast: {
    paddingVertical: 3,
    paddingHorizontal: 4,
    fontSize: 7.5,
  },
  tableCellBold: {
    paddingVertical: 3,
    paddingHorizontal: 4,
    fontSize: 7.5,
    fontFamily: FONT_FAMILY_BOLD,
    borderRightWidth: 0.5,
    borderRightColor: COLOR.border,
  },

  // Baris total / subtotal
  totalRow: {
    flexDirection: "row",
    backgroundColor: COLOR.totalBg,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.border,
  },
  totalCell: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontSize: 7.5,
    fontFamily: FONT_FAMILY_BOLD,
    color: COLOR.totalText,
    borderRightWidth: 0.5,
    borderRightColor: COLOR.border,
  },
  grandTotalRow: {
    flexDirection: "row",
    backgroundColor: COLOR.header,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.primary,
  },
  grandTotalCell: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontSize: 8,
    fontFamily: FONT_FAMILY_BOLD,
    color: COLOR.headerText,
    borderRightWidth: 0.5,
    borderRightColor: "#334155",
  },

  // Baris kategori/section heading dalam tabel
  sectionRow: {
    flexDirection: "row",
    backgroundColor: COLOR.primaryLight,
    borderBottomWidth: 0.5,
    borderBottomColor: COLOR.border,
  },
  sectionCell: {
    paddingVertical: 3,
    paddingHorizontal: 4,
    fontSize: 8,
    fontFamily: FONT_FAMILY_BOLD,
    color: COLOR.primary,
  },

  // TTD & tanda tangan
  ttdSection: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  ttdBox: {
    alignItems: "center",
    width: 160,
  },
  ttdLabel: {
    fontSize: 8,
    marginBottom: 40,
  },
  ttdNama: {
    fontSize: 8,
    fontFamily: FONT_FAMILY_BOLD,
    borderTopWidth: 0.5,
    borderTopColor: COLOR.text,
    paddingTop: 2,
    textAlign: "center",
  },
  ttdNip: {
    fontSize: 7.5,
    color: COLOR.textMuted,
    marginTop: 1,
  },

  // Misc
  noData: {
    textAlign: "center",
    color: COLOR.textMuted,
    paddingVertical: 16,
    fontSize: 8,
  },
  filterLabel: {
    fontSize: 7.5,
    color: COLOR.textMuted,
    marginBottom: 6,
    fontStyle: "italic",
  },
});

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTanggal(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return dateStr;
  }
}