import { useRef } from "react";
import { useViewerStore } from "../../store/viewerStore";
import { usePdfDocument } from "../../hooks/usePdfDocument";

export function ToolBar() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { loadFile } = usePdfDocument();

  const { currentPage, totalPages, zoom, isLoading, setCurrentPage, setZoom } =
    useViewerStore();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await loadFile(file);
    // reset input so the same file can be re-opened
    e.target.value = "";
  };

  const canNav = totalPages > 0 && !isLoading;

  return (
    <div className="flex items-center gap-1 border-b border-gray-200 bg-white px-3 py-2 shadow-sm">
      {/* Open PDF */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="rounded bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800"
      >
        Open PDF
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="mx-2 h-6 w-px bg-gray-200" />

      {/* Page navigation */}
      <button
        onClick={() => setCurrentPage(currentPage - 1)}
        disabled={!canNav || currentPage <= 1}
        className="rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        title="Previous page"
      >
        ‹
      </button>
      <span className="min-w-[6rem] text-center text-sm text-gray-600">
        {totalPages ? `${currentPage} / ${totalPages}` : "—"}
      </span>
      <button
        onClick={() => setCurrentPage(currentPage + 1)}
        disabled={!canNav || currentPage >= totalPages}
        className="rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        title="Next page"
      >
        ›
      </button>

      <div className="mx-2 h-6 w-px bg-gray-200" />

      {/* Zoom */}
      <button
        onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
        disabled={!canNav}
        className="rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        title="Zoom out"
      >
        −
      </button>
      <span className="min-w-[4rem] text-center text-sm text-gray-600">
        {Math.round(zoom * 100)}%
      </span>
      <button
        onClick={() => setZoom(Math.min(4, zoom + 0.25))}
        disabled={!canNav}
        className="rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        title="Zoom in"
      >
        +
      </button>

      {isLoading && (
        <span className="ml-3 text-sm text-gray-400">Loading…</span>
      )}
    </div>
  );
}
