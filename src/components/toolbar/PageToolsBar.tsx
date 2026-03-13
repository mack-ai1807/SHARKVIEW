import { useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import * as pdfjsLib from "pdfjs-dist";
import { useViewerStore } from "../../store/viewerStore";
import { usePdfDocument } from "../../hooks/usePdfDocument";
import {
  rotatePage,
  deletePage,
  mergePdfs,
  splitPdf,
  compressPdf,
  unlockPdf,
  imagesToPdf,
  downloadBytes,
  downloadImageBytes,
} from "../../utils/pdfEdit";

export function PageToolsBar() {
  const mergeInputRef = useRef<HTMLInputElement>(null);
  const [splitFrom, setSplitFrom] = useState("");
  const [splitTo, setSplitTo] = useState("");
  const [showSplit, setShowSplit] = useState(false);
  const [busy, setBusy] = useState(false);
  const { loadFile } = usePdfDocument();

  const {
    pdfBytes,
    pdfDocument,
    currentPage,
    totalPages,
    fileName,
    setPdfBytes,
    setPdfDocument,
    setCurrentPage,
    appMode,
    activeTool,
  } = useViewerStore();

  if (appMode !== "viewer" || !totalPages) return null;

  const baseName = fileName?.replace(/\.pdf$/i, "") ?? "document";

  /** Reload the viewer after bytes change */
  const reloadFromBytes = async (newBytes: Uint8Array, newName?: string) => {
    const data = new Uint8Array(newBytes);
    const task = pdfjsLib.getDocument({ data });
    const pdf = await task.promise;
    setPdfBytes(newBytes);
    setPdfDocument(pdf, pdf.numPages);
    if (newName) useViewerStore.getState().setFile(newName, newName);
    setCurrentPage(Math.min(currentPage, pdf.numPages));
  };

  const handleRotateCW = async () => {
    if (!pdfBytes) return;
    setBusy(true);
    try {
      const updated = await rotatePage(pdfBytes, currentPage - 1, 90);
      await reloadFromBytes(updated);
    } finally { setBusy(false); }
  };

  const handleRotateCCW = async () => {
    if (!pdfBytes) return;
    setBusy(true);
    try {
      const updated = await rotatePage(pdfBytes, currentPage - 1, -90);
      await reloadFromBytes(updated);
    } finally { setBusy(false); }
  };

  const handleDeletePage = async () => {
    if (!pdfBytes || totalPages <= 1) return;
    if (!confirm(`Delete page ${currentPage}?`)) return;
    setBusy(true);
    try {
      const updated = await deletePage(pdfBytes, currentPage - 1);
      await reloadFromBytes(updated);
    } finally { setBusy(false); }
  };

  const handleSave = () => {
    if (!pdfBytes) return;
    downloadBytes(pdfBytes, `${baseName}_edited.pdf`);
  };

  const handleCompress = async () => {
    if (!pdfBytes) return;
    setBusy(true);
    try {
      const compressed = await compressPdf(pdfBytes);
      downloadBytes(compressed, `${baseName}_compressed.pdf`);
    } finally { setBusy(false); }
  };

  const handleUnlock = async () => {
    if (!pdfBytes) return;
    setBusy(true);
    try {
      const unlocked = await unlockPdf(pdfBytes);
      await reloadFromBytes(unlocked, `${baseName}_unlocked.pdf`);
    } finally { setBusy(false); }
  };

  const handleMergeFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!pdfBytes || !e.target.files?.length) return;
    setBusy(true);
    try {
      const extras = await Promise.all(
        Array.from(e.target.files).map(async (f) => new Uint8Array(await f.arrayBuffer()))
      );
      const merged = await mergePdfs([pdfBytes, ...extras]);
      await reloadFromBytes(merged, `${baseName}_merged.pdf`);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  const handleSplit = async () => {
    if (!pdfBytes) return;
    const from = parseInt(splitFrom, 10);
    const to = parseInt(splitTo, 10);
    if (isNaN(from) || isNaN(to) || from < 1 || to > totalPages || from > to) {
      alert(`Enter a valid range (1–${totalPages})`);
      return;
    }
    setBusy(true);
    try {
      const extracted = await splitPdf(pdfBytes, from - 1, to - 1);
      downloadBytes(extracted, `${baseName}_pages${from}-${to}.pdf`);
      setShowSplit(false);
    } finally { setBusy(false); }
  };

  const handleExportImages = async (format: "jpeg" | "png") => {
    if (!pdfDocument) return;
    setBusy(true);
    const pdf = pdfDocument as PDFDocumentProxy;
    try {
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const vp = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = vp.width;
        canvas.height = vp.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
        const ext = format === "jpeg" ? "jpg" : "png";
        canvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${baseName}_page${i}.${ext}`;
          a.click();
          URL.revokeObjectURL(url);
        }, mimeType, 0.92);
      }
    } finally { setBusy(false); }
  };

  // For jpg/png → pdf tools
  const handleImagesToPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setBusy(true);
    try {
      const files = Array.from(e.target.files);
      const pdfOut = await imagesToPdf(files);
      const name = files[0].name.replace(/\.[^.]+$/, "") + ".pdf";
      const data = new Uint8Array(pdfOut);
      const task = pdfjsLib.getDocument({ data });
      const pdf = await task.promise;
      useViewerStore.getState().setFile(name, name);
      setPdfBytes(pdfOut);
      setPdfDocument(pdf, pdf.numPages);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  const isImageTool = activeTool === "jpg-to-pdf" || activeTool === "png-to-pdf";

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-gray-100 bg-gray-50 px-3 py-1.5 text-xs">
      {/* Rotate */}
      <button onClick={handleRotateCW} disabled={busy} className="tool-btn" title="Rotate CW">↻ CW</button>
      <button onClick={handleRotateCCW} disabled={busy} className="tool-btn" title="Rotate CCW">↺ CCW</button>

      <div className="h-4 w-px bg-gray-300" />

      {/* Delete page */}
      <button
        onClick={handleDeletePage}
        disabled={busy || totalPages <= 1}
        className="tool-btn text-red-600 hover:bg-red-50"
        title="Delete current page"
      >
        🗑 Delete Page
      </button>

      <div className="h-4 w-px bg-gray-300" />

      {/* Merge */}
      <button
        onClick={() => mergeInputRef.current?.click()}
        disabled={busy}
        className="tool-btn"
        title="Merge another PDF into this one"
      >
        🔗 Merge PDF
      </button>
      <input ref={mergeInputRef} type="file" accept=".pdf" multiple className="hidden" onChange={handleMergeFiles} />

      {/* Split */}
      <button onClick={() => setShowSplit((v) => !v)} disabled={busy} className="tool-btn">
        ✂️ Split
      </button>
      {showSplit && (
        <span className="flex items-center gap-1">
          <span className="text-gray-500">Pages</span>
          <input
            type="number" min={1} max={totalPages} value={splitFrom}
            onChange={(e) => setSplitFrom(e.target.value)}
            className="w-12 rounded border border-gray-300 px-1 py-0.5 text-center text-xs"
            placeholder="from"
          />
          <span>–</span>
          <input
            type="number" min={1} max={totalPages} value={splitTo}
            onChange={(e) => setSplitTo(e.target.value)}
            className="w-12 rounded border border-gray-300 px-1 py-0.5 text-center text-xs"
            placeholder="to"
          />
          <button onClick={handleSplit} disabled={busy} className="rounded bg-blue-600 px-2 py-0.5 text-white hover:bg-blue-700">
            Extract
          </button>
        </span>
      )}

      <div className="h-4 w-px bg-gray-300" />

      {/* Export images */}
      <button onClick={() => handleExportImages("jpeg")} disabled={busy} className="tool-btn">
        🖼 PDF→JPG
      </button>
      <button onClick={() => handleExportImages("png")} disabled={busy} className="tool-btn">
        🖼 PDF→PNG
      </button>

      {isImageTool && (
        <>
          <div className="h-4 w-px bg-gray-300" />
          <label className="tool-btn cursor-pointer">
            📷 Add Images
            <input type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" multiple className="hidden" onChange={handleImagesToPdf} />
          </label>
        </>
      )}

      <div className="h-4 w-px bg-gray-300" />

      {/* Compress / Unlock */}
      <button onClick={handleCompress} disabled={busy} className="tool-btn">🗜 Compress</button>
      <button onClick={handleUnlock} disabled={busy} className="tool-btn">🔓 Unlock</button>

      <div className="h-4 w-px bg-gray-300" />

      {/* Save */}
      <button onClick={handleSave} disabled={busy || !pdfBytes} className="tool-btn font-semibold text-green-700 hover:bg-green-50">
        💾 Save PDF
      </button>

      {busy && <span className="ml-1 text-gray-400">Working…</span>}
    </div>
  );
}
