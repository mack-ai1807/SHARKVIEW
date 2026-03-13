import { useRef, useState, useCallback } from "react";
import { useViewerStore } from "../../store/viewerStore";
import { usePdfDocument } from "../../hooks/usePdfDocument";

const ZOOM_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0];

interface ToolBarProps {
  containerWidth: number;
}

export function ToolBar({ containerWidth }: ToolBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { loadFile } = usePdfDocument();
  const [pageInput, setPageInput] = useState("");

  const { currentPage, totalPages, zoom, isLoading, setCurrentPage, setZoom } =
    useViewerStore();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await loadFile(file, containerWidth);
    e.target.value = "";
  };

  const handlePageSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const n = parseInt(pageInput, 10);
      if (!isNaN(n) && n >= 1 && n <= totalPages) setCurrentPage(n);
      setPageInput("");
    },
    [pageInput, totalPages, setCurrentPage]
  );

  const canNav = totalPages > 0 && !isLoading;

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-white px-3 py-2 shadow-sm">
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

      <div className="mx-1 h-6 w-px bg-gray-200" />

      {/* Page navigation */}
      <button
        onClick={() => setCurrentPage(currentPage - 1)}
        disabled={!canNav || currentPage <= 1}
        className="rounded px-2 py-1 text-base leading-none text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        title="Previous page (←)"
      >
        ‹
      </button>

      {/* Page input */}
      <form onSubmit={handlePageSubmit} className="flex items-center gap-1">
        <input
          type="text"
          value={pageInput || (totalPages ? String(currentPage) : "")}
          onChange={(e) => setPageInput(e.target.value)}
          onFocus={() => setPageInput(String(currentPage))}
          onBlur={() => setPageInput("")}
          disabled={!canNav}
          className="w-10 rounded border border-gray-300 px-1 py-0.5 text-center text-sm text-gray-700 disabled:opacity-40"
          title="Jump to page"
        />
      </form>
      <span className="text-sm text-gray-400">
        {totalPages ? `/ ${totalPages}` : "/ —"}
      </span>

      <button
        onClick={() => setCurrentPage(currentPage + 1)}
        disabled={!canNav || currentPage >= totalPages}
        className="rounded px-2 py-1 text-base leading-none text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        title="Next page (→)"
      >
        ›
      </button>

      <div className="mx-1 h-6 w-px bg-gray-200" />

      {/* Zoom */}
      <button
        onClick={() => setZoom(Math.max(0.25, Math.round((zoom - 0.25) * 4) / 4))}
        disabled={!canNav}
        className="rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        title="Zoom out (−)"
      >
        −
      </button>

      <select
        value={ZOOM_PRESETS.includes(zoom) ? zoom : "custom"}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) setZoom(v);
        }}
        disabled={!canNav}
        className="rounded border border-gray-300 px-1 py-0.5 text-sm text-gray-700 disabled:opacity-40"
        title="Zoom level"
      >
        {!ZOOM_PRESETS.includes(zoom) && (
          <option value="custom">{Math.round(zoom * 100)}%</option>
        )}
        {ZOOM_PRESETS.map((z) => (
          <option key={z} value={z}>
            {Math.round(z * 100)}%
          </option>
        ))}
      </select>

      <button
        onClick={() => setZoom(Math.min(4, Math.round((zoom + 0.25) * 4) / 4))}
        disabled={!canNav}
        className="rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        title="Zoom in (+)"
      >
        +
      </button>

      {isLoading && (
        <span className="ml-2 text-sm text-gray-400">Loading…</span>
      )}
    </div>
  );
}
