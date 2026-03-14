import { useEffect, useRef, useState, useCallback } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import * as pdfjsLib from "pdfjs-dist";
import { useViewerStore } from "./store/viewerStore";
import { ToolBar } from "./components/toolbar/ToolBar";
import { PdfViewer } from "./components/viewer/PdfViewer";
import { ViewerSidebar } from "./components/sidebar/ViewerSidebar";
import { ToolHub } from "./components/hub/ToolHub";
import { SignatureModal } from "./components/tools/SignatureModal";
import { FillPdfPanel } from "./components/tools/FillPdfPanel";
import { SplitModal } from "./components/tools/SplitModal";
import {
  rotatePage,
  deletePage,
  mergePdfs,
  splitPdf,
  compressPdf,
  compressImages,
  unlockPdf,
  removeWatermark,
  addSignatureToPdf,
  downloadBytes,
} from "./utils/pdfEdit";

function App() {
  const {
    fileName, appMode, setAppMode,
    pdfBytes, pdfDocument, currentPage, totalPages,
    setPdfBytes, setPdfDocument, setCurrentPage, setZoom,
  } = useViewerStore();

  const [containerWidth, setContainerWidth] = useState(0);
  const [busy, setBusy] = useState(false);
  const [showSign, setShowSign] = useState(false);
  const [showFill, setShowFill] = useState(false);
  const [showSplit, setShowSplit] = useState(false);
  const mergeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = fileName ? `${fileName} — SHARKVIEW` : "SHARKVIEW — Next Gen PDF Editor";
  }, [fileName]);

  const baseName = fileName?.replace(/\.pdf$/i, "") ?? "document";

  const reloadFromBytes = useCallback(async (newBytes: Uint8Array) => {
    const data = new Uint8Array(newBytes);
    const task = pdfjsLib.getDocument({ data });
    const pdf = await task.promise;
    setPdfBytes(newBytes);
    setPdfDocument(pdf, pdf.numPages);
    setCurrentPage(Math.min(currentPage, pdf.numPages));
  }, [currentPage, setPdfBytes, setPdfDocument, setCurrentPage]);

  const fitToWidth = useCallback(() => {
    if (!pdfDocument || !containerWidth) return;
    const pdf = pdfDocument as PDFDocumentProxy;
    pdf.getPage(currentPage).then((page) => {
      const vp = page.getViewport({ scale: 1 });
      setZoom(Math.max(0.25, Math.min((containerWidth - 48) / vp.width, 4)));
    });
  }, [pdfDocument, currentPage, containerWidth, setZoom]);

  // ── Tool dispatcher ────────────────────────────────────────────────────────

  const handleToolAction = useCallback(async (toolId: string) => {
    if (!pdfBytes) return;

    switch (toolId) {
      case "rotate-cw": {
        setBusy(true);
        try { await reloadFromBytes(await rotatePage(pdfBytes, currentPage - 1, 90)); }
        finally { setBusy(false); }
        break;
      }
      case "rotate-ccw": {
        setBusy(true);
        try { await reloadFromBytes(await rotatePage(pdfBytes, currentPage - 1, -90)); }
        finally { setBusy(false); }
        break;
      }
      case "delete-page": {
        if (totalPages <= 1) return;
        if (!confirm(`Delete page ${currentPage}?`)) return;
        setBusy(true);
        try { await reloadFromBytes(await deletePage(pdfBytes, currentPage - 1)); }
        finally { setBusy(false); }
        break;
      }
      case "sign":
        setShowSign(true);
        break;
      case "fill":
        setShowFill(true);
        break;
      case "compress-pdf": {
        setBusy(true);
        try { downloadBytes(await compressPdf(pdfBytes), `${baseName}_compressed.pdf`); }
        finally { setBusy(false); }
        break;
      }
      case "compress-images": {
        if (!pdfDocument) return;
        setBusy(true);
        try {
          const compressed = await compressImages(pdfDocument as PDFDocumentProxy);
          downloadBytes(compressed, `${baseName}_img_compressed.pdf`);
        } finally { setBusy(false); }
        break;
      }
      case "unlock": {
        setBusy(true);
        try { await reloadFromBytes(await unlockPdf(pdfBytes)); }
        finally { setBusy(false); }
        break;
      }
      case "remove-watermark": {
        setBusy(true);
        try { await reloadFromBytes(await removeWatermark(pdfBytes)); }
        finally { setBusy(false); }
        break;
      }
      case "merge":
        mergeInputRef.current?.click();
        break;
      case "split":
        setShowSplit(true);
        break;
      case "pdf-to-jpg":
      case "pdf-to-png": {
        if (!pdfDocument) return;
        const fmt = toolId === "pdf-to-jpg" ? "jpeg" : "png";
        const ext = toolId === "pdf-to-jpg" ? "jpg" : "png";
        const mime = `image/${fmt}`;
        setBusy(true);
        try {
          const pdf = pdfDocument as PDFDocumentProxy;
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const vp = page.getViewport({ scale: 2 });
            const canvas = document.createElement("canvas");
            canvas.width = vp.width; canvas.height = vp.height;
            const ctx = canvas.getContext("2d")!;
            await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise;
            canvas.toBlob((blob) => {
              if (!blob) return;
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = `${baseName}_page${i}.${ext}`; a.click();
              URL.revokeObjectURL(url);
            }, mime, 0.92);
          }
        } finally { setBusy(false); }
        break;
      }
      case "save":
        downloadBytes(pdfBytes, `${baseName}_edited.pdf`);
        break;
    }
  }, [pdfBytes, pdfDocument, currentPage, totalPages, baseName, reloadFromBytes]);

  const handleMergeFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!pdfBytes || !e.target.files?.length) return;
    setBusy(true);
    try {
      const extras = await Promise.all(
        Array.from(e.target.files).map(async (f) => new Uint8Array(await f.arrayBuffer()))
      );
      await reloadFromBytes(await mergePdfs([pdfBytes, ...extras]));
    } finally { setBusy(false); e.target.value = ""; }
  };

  const handleSignApply = async (dataUrl: string) => {
    if (!pdfBytes) return;
    setShowSign(false);
    setBusy(true);
    try { await reloadFromBytes(await addSignatureToPdf(pdfBytes, currentPage - 1, dataUrl)); }
    finally { setBusy(false); }
  };

  const handleFillApply = async (updatedBytes: Uint8Array) => {
    setShowFill(false);
    setBusy(true);
    try { await reloadFromBytes(updatedBytes); }
    finally { setBusy(false); }
  };

  const handleSplitApply = async (from: number, to: number) => {
    if (!pdfBytes) return;
    setShowSplit(false);
    setBusy(true);
    try { downloadBytes(await splitPdf(pdfBytes, from - 1, to - 1), `${baseName}_pages${from}-${to}.pdf`); }
    finally { setBusy(false); }
  };

  if (appMode === "hub") return <ToolHub />;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      {/* Modals */}
      {showSign && <SignatureModal onApply={handleSignApply} onClose={() => setShowSign(false)} />}
      {showFill && pdfBytes && (
        <FillPdfPanel pdfBytes={pdfBytes} onApply={handleFillApply} onClose={() => setShowFill(false)} />
      )}
      {showSplit && (
        <SplitModal totalPages={totalPages} onSplit={handleSplitApply} onClose={() => setShowSplit(false)} />
      )}
      <input ref={mergeInputRef} type="file" accept=".pdf" multiple className="hidden" onChange={handleMergeFiles} />

      {/* Header — dark slate */}
      <header className="flex shrink-0 items-center justify-between bg-slate-900 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className="text-base font-black tracking-tight text-white">🦈 SHARKVIEW</span>
          {fileName && (
            <span className="max-w-xs truncate rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
              {fileName}
            </span>
          )}
        </div>
        <button
          onClick={() => setAppMode("hub")}
          className="flex items-center gap-1.5 rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-600"
        >
          ← Hub
        </button>
      </header>

      {/* Nav toolbar */}
      <ToolBar onFitToWidth={fitToWidth} />

      {/* Body: sidebar + canvas */}
      <div className="flex flex-1 overflow-hidden">
        <ViewerSidebar onToolAction={handleToolAction} busy={busy} />
        <PdfViewer onContainerWidth={setContainerWidth} />
      </div>
    </div>
  );
}

export default App;
