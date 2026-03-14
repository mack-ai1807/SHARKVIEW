import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { useViewerStore } from "../../store/viewerStore";

const THUMB_SCALE = 0.18;

function PageThumb({
  pdf,
  pageNumber,
  isActive,
  onClick,
}: {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      const page = await pdf.getPage(pageNumber);
      if (cancelled || !canvasRef.current) return;
      const vp = page.getViewport({ scale: THUMB_SCALE });
      const canvas = canvasRef.current;
      canvas.width = vp.width;
      canvas.height = vp.height;
      const ctx = canvas.getContext("2d");
      if (!ctx || cancelled) return;
      await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise;
      if (!cancelled) setRendered(true);
    };
    render().catch(console.error);
    return () => { cancelled = true; };
  }, [pdf, pageNumber]);

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-lg p-1.5 transition ${
        isActive
          ? "bg-blue-100 ring-2 ring-blue-500"
          : "hover:bg-gray-100"
      }`}
      title={`Page ${pageNumber}`}
    >
      <div className="relative bg-white shadow">
        <canvas
          ref={canvasRef}
          className={`block transition-opacity ${rendered ? "opacity-100" : "opacity-0"}`}
        />
        {!rendered && (
          <div
            style={{ width: 90, height: 127 }}
            className="animate-pulse bg-gray-200"
          />
        )}
      </div>
      <span className="text-xs text-gray-500">{pageNumber}</span>
    </button>
  );
}

export function ThumbnailSidebar() {
  const { pdfDocument, totalPages, currentPage, sidebarOpen, setCurrentPage } =
    useViewerStore();

  if (!sidebarOpen || !pdfDocument || !totalPages) return null;

  const pdf = pdfDocument as PDFDocumentProxy;

  return (
    <div className="flex w-28 flex-col overflow-y-auto border-r border-gray-200 bg-white py-2">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
        <PageThumb
          key={n}
          pdf={pdf}
          pageNumber={n}
          isActive={n === currentPage}
          onClick={() => setCurrentPage(n)}
        />
      ))}
    </div>
  );
}
