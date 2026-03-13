import { useRef, useEffect, useCallback } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { useViewerStore } from "../../store/viewerStore";
import { usePdfPage } from "../../hooks/usePdfPage";

interface PdfViewerProps {
  onContainerWidth: (width: number) => void;
}

export function PdfViewer({ onContainerWidth }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { pdfDocument, currentPage, zoom, rotation, isLoading, error, totalPages,
    setCurrentPage, setZoom } = useViewerStore();

  const canvasRef = usePdfPage(
    pdfDocument as PDFDocumentProxy | null,
    currentPage,
    zoom,
    rotation
  );

  // Report container width to parent (for fit-to-width on open)
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      onContainerWidth(entry.contentRect.width);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [onContainerWidth]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!totalPages) return;
      if (e.target instanceof HTMLInputElement) return; // don't hijack text inputs
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
        case "PageDown":
          e.preventDefault();
          setCurrentPage(currentPage + 1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
        case "PageUp":
          e.preventDefault();
          setCurrentPage(currentPage - 1);
          break;
        case "+":
        case "=":
          e.preventDefault();
          setZoom(Math.min(4, zoom + 0.25));
          break;
        case "-":
          e.preventDefault();
          setZoom(Math.max(0.25, zoom - 0.25));
          break;
        case "Home":
          e.preventDefault();
          setCurrentPage(1);
          break;
        case "End":
          e.preventDefault();
          setCurrentPage(totalPages);
          break;
      }
    },
    [totalPages, currentPage, zoom, setCurrentPage, setZoom]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="rounded bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!totalPages && !isLoading) {
    return (
      <div
        ref={containerRef}
        className="flex flex-1 flex-col items-center justify-center gap-3"
      >
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
      <div ref={containerRef} className="flex flex-1 items-center justify-center">
        <p className="text-sm text-gray-400">Loading PDF…</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-1 items-start justify-center overflow-auto bg-gray-300 p-6"
      tabIndex={-1}
    >
      <canvas ref={canvasRef} className="shadow-xl" />
    </div>
  );
}
