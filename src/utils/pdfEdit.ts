import { PDFDocument, degrees, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup, PDFName } from "pdf-lib";
import type { PDFDocumentProxy } from "pdfjs-dist";

// ─── AcroForm helpers ────────────────────────────────────────────────────────

export type FormFieldType = "text" | "checkbox" | "dropdown" | "radio" | "other";

export interface FormField {
  name: string;
  type: FormFieldType;
  value: string | boolean;
  options?: string[]; // for dropdown / radio
}

/** Extract all AcroForm fields and their current values from a PDF */
export async function getPdfFormFields(pdfBytes: Uint8Array): Promise<FormField[]> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const form = doc.getForm();
  return form.getFields().map((field) => {
    const name = field.getName();
    if (field instanceof PDFTextField) {
      return { name, type: "text", value: field.getText() ?? "" };
    }
    if (field instanceof PDFCheckBox) {
      return { name, type: "checkbox", value: field.isChecked() };
    }
    if (field instanceof PDFDropdown) {
      const selected = field.getSelected();
      return { name, type: "dropdown", value: selected[0] ?? "", options: field.getOptions() };
    }
    if (field instanceof PDFRadioGroup) {
      return { name, type: "radio", value: field.getSelected() ?? "", options: field.getOptions() };
    }
    return { name, type: "other", value: "" };
  });
}

/** Write filled values back into the PDF and return updated bytes */
export async function fillPdfForm(
  pdfBytes: Uint8Array,
  values: Record<string, string | boolean>
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const form = doc.getForm();
  for (const field of form.getFields()) {
    const name = field.getName();
    const val = values[name];
    if (val === undefined) continue;
    if (field instanceof PDFTextField) {
      field.setText(String(val));
    } else if (field instanceof PDFCheckBox) {
      val ? field.check() : field.uncheck();
    } else if (field instanceof PDFDropdown) {
      if (typeof val === "string" && val) field.select(val);
    } else if (field instanceof PDFRadioGroup) {
      if (typeof val === "string" && val) field.select(val);
    }
  }
  return doc.save();
}

// ─────────────────────────────────────────────────────────────────────────────

/** Download a Uint8Array as a file */
export function downloadBytes(bytes: Uint8Array, filename: string) {
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Download image bytes */
export function downloadImageBytes(bytes: Uint8Array, filename: string, mime: string) {
  const blob = new Blob([new Uint8Array(bytes)], { type: mime });
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

/**
 * Compress Images — re-renders every page via pdfjs canvas at JPEG quality,
 * then rebuilds a new PDF with those images. Significantly reduces file size
 * for scanned or image-heavy documents.
 */
export async function compressImages(
  pdfDoc: PDFDocumentProxy,
  quality = 0.65
): Promise<Uint8Array> {
  const newDoc = await PDFDocument.create();

  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const naturalVp = page.getViewport({ scale: 1 });
    const renderVp = page.getViewport({ scale: 1.5 }); // render at 1.5× for crispness

    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(renderVp.width);
    canvas.height = Math.floor(renderVp.height);
    const ctx = canvas.getContext("2d")!;

    await page.render({ canvasContext: ctx, viewport: renderVp, canvas }).promise;

    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, "");
    const imgBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    const jpegImg = await newDoc.embedJpg(imgBytes);
    const newPage = newDoc.addPage([naturalVp.width, naturalVp.height]);
    newPage.drawImage(jpegImg, { x: 0, y: 0, width: naturalVp.width, height: naturalVp.height });
  }

  return newDoc.save();
}

/**
 * Remove Watermark — heuristic removal:
 * 1. Deletes all page annotation arrays (covers annotation-based watermarks)
 * 2. Flattens AcroForm fields (removes form-overlay watermarks)
 */
export async function removeWatermark(pdfBytes: Uint8Array): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  for (const page of doc.getPages()) {
    page.node.delete(PDFName.of("Annots"));
  }
  try {
    doc.getForm().flatten();
  } catch {
    // No form fields — ignore
  }
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
