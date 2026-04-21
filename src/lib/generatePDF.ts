// src/lib/generatePDF.ts
// Client-side PDF generation — tidak pakai API route

export async function downloadPDFClient(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  element: any,
  filename: string
): Promise<void> {
  const { pdf } = await import("@react-pdf/renderer");
  const blob = await pdf(element).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}