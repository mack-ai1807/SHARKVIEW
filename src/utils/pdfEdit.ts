import { PDFDocument, degrees } from "pdf-lib";

/** Download a Uint8Array as a file */
export function downloadBytes(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Download image bytes */
export function downloadImageBytes(bytes: Uint8Array, filename: string, mime: string) {
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Rotate a single page by 90° CW and return updated bytes */
export async function rotatePage(
  pdfBytes: Uint8Array,
  pageIndex: number, // 0-based
  deltaDegrees: 90 | -90 | 180
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes);
  const page = doc.getPage(pageIndex);
  const current = page.getRotation().angle;
  page.setRotation(degrees((current + deltaDegrees + 360) % 360));
  return doc.save();
}

/** Delete a single page and return updated bytes */
export async function deletePage(
  pdfBytes: Uint8Array,
  pageIndex: number // 0-based
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes);
  doc.removePage(pageIndex);
  return doc.save();
}

/** Merge multiple PDFs into one and return bytes */
export async function mergePdfs(files: Uint8Array[]): Promise<Uint8Array> {
  const merged = await PDFDocument.create();
  for (const bytes of files) {
    const src = await PDFDocument.load(bytes);
    const pageIndices = src.getPageIndices();
    const pages = await merged.copyPages(src, pageIndices);
    pages.forEach((p) => merged.addPage(p));
  }
  return merged.save();
}

/** Extract a range of pages [startIndex, endIndex] (0-based inclusive) */
export async function splitPdf(
  pdfBytes: Uint8Array,
  startIndex: number,
  endIndex: number
): Promise<Uint8Array> {
  const src = await PDFDocument.load(pdfBytes);
  const dest = await PDFDocument.create();
  const indices = Array.from(
    { length: endIndex - startIndex + 1 },
    (_, i) => startIndex + i
  );
  const pages = await dest.copyPages(src, indices);
  pages.forEach((p) => dest.addPage(p));
  return dest.save();
}

/** Compress PDF by re-saving (removes unused objects, flattens) */
export async function compressPdf(pdfBytes: Uint8Array): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  return doc.save({ useObjectStreams: true });
}

/** Attempt to unlock (load ignoring encryption) and re-save */
export async function unlockPdf(pdfBytes: Uint8Array): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  return doc.save();
}

/** Embed a signature (PNG data URL) onto a page at the bottom-right area */
export async function addSignatureToPdf(
  pdfBytes: Uint8Array,
  pageIndex: number, // 0-based
  signatureDataUrl: string
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes);
  const page = doc.getPage(pageIndex);
  const { width: pageW, height: pageH } = page.getSize();

  // Strip data URL header and convert to bytes
  const base64 = signatureDataUrl.replace(/^data:image\/png;base64,/, "");
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

  const img = await doc.embedPng(bytes);

  // Place at bottom-right: 38% wide, proportional height, 5% margin from edges
  const sigW = pageW * 0.38;
  const sigH = (img.height / img.width) * sigW;
  const x = pageW * 0.57;
  const y = pageH * 0.05; // 5% up from bottom (pdf-lib origin = bottom-left)

  page.drawImage(img, { x, y, width: sigW, height: sigH });
  return doc.save();
}

/** Convert images to PDF. Each image becomes one page. */
export async function imagesToPdf(files: File[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (const file of files) {
    const ab = await file.arrayBuffer();
    const bytes = new Uint8Array(ab);
    let img;
    if (file.type === "image/jpeg" || file.name.toLowerCase().endsWith(".jpg") || file.name.toLowerCase().endsWith(".jpeg")) {
      img = await doc.embedJpg(bytes);
    } else {
      img = await doc.embedPng(bytes);
    }
    const page = doc.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }
  return doc.save();
}
