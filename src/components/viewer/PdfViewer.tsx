import type { PDFDocumentProxy } from "pdfjs-dist";
import { useViewerStore } from "../../store/viewerStore";
import { usePdfPage } from "../../hooks/usePdfPage";

export function PdfViewer() {
  const { pdfDocument, currentPage, zoom, rotation, isLoading, error, totalPages } =
    useViewerStore();

  const canvasRef = usePdfPage(
    pdfDocument as PDFDocumentProxy | null,
    currentPage,
    zoom,
    rotation
  );

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="rounded bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!totalPages && !isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <svg
          className="h-16 w-16 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-sm text-gray-400">Open a PDF to get started</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-gray-400">Loading PDF…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-start justify-center overflow-auto bg-gray-300 p-6">
      <canvas ref={canvasRef} className="shadow-xl" />
    </div>
  );
}
