import { useState, useCallback } from "react";
import { useViewerStore } from "../../store/viewerStore";

const ZOOM_PRESETS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0, 4.0];

interface ToolBarProps {
  onFitToWidth: () => void;
}

export function ToolBar({ onFitToWidth }: ToolBarProps) {
  const [pageInput, setPageInput] = useState("");

  const { currentPage, totalPages, zoom, isLoading, sidebarOpen, setCurrentPage, setZoom, toggleSidebar } =
    useViewerStore();

  const canNav = totalPages > 0 && !isLoading;

  const handlePageSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const n = parseInt(pageInput, 10);
      if (!isNaN(n) && n >= 1 && n <= totalPages) setCurrentPage(n);
      setPageInput("");
    },
    [pageInput, totalPages, setCurrentPage]
  );

  return (
    <div className="flex items-center gap-1 border-b border-gray-200 bg-white px-3 py-1.5 shadow-sm">
      {/* Sidebar toggle */}
      <button
        onClick={toggleSidebar}
        className={`rounded p-1.5 text-gray-500 transition-colors hover:bg-gray-100 ${sidebarOpen ? "bg-gray-100 text-gray-800" : ""}`}
        title="Toggle sidebar"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="h-5 w-px bg-gray-200" />

      {/* Page navigation */}
      <button
        onClick={() => setCurrentPage(currentPage - 1)}
        disabled={!canNav || currentPage <= 1}
        className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        title="Previous page (←)"
      >
        ‹
      </button>

      <form onSubmit={handlePageSubmit} className="flex items-center gap-1">
        <input
          type="text"
          value={pageInput || (totalPages ? String(currentPage) : "")}
          onChange={(e) => setPageInput(e.target.value)}
          onFocus={() => setPageInput(String(currentPage))}
          onBlur={() => setPageInput("")}
          disabled={!canNav}
          className="w-10 rounded border border-gray-300 px-1 py-0.5 text-center text-sm text-gray-700 focus:border-blue-500 focus:outline-none disabled:opacity-40"
          title="Jump to page"
        />
      </form>

      <span className="text-sm text-gray-400">{totalPages ? `/ ${totalPages}` : "/ —"}</span>

      <button
        onClick={() => setCurrentPage(currentPage + 1)}
        disabled={!canNav || currentPage >= totalPages}
        className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        title="Next page (→)"
      >
        ›
      </button>

      <div className="h-5 w-px bg-gray-200" />

      {/* Zoom */}
      <button
        onClick={() => setZoom(zoom - 0.25)}
        disabled={!canNav || zoom <= 0.25}
        className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        title="Zoom out (−)"
      >
        −
      </button>

      <select
        value={ZOOM_PRESETS.find((z) => Math.abs(z - zoom) < 0.01) ?? "custom"}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) setZoom(v);
        }}
        disabled={!canNav}
        className="rounded border border-gray-300 px-1 py-0.5 text-sm text-gray-700 disabled:opacity-40"
      >
        {!ZOOM_PRESETS.some((z) => Math.abs(z - zoom) < 0.01) && (
          <option value="custom">{Math.round(zoom * 100)}%</option>
        )}
        {ZOOM_PRESETS.map((z) => (
          <option key={z} value={z}>{Math.round(z * 100)}%</option>
        ))}
      </select>

      <button
        onClick={() => setZoom(zoom + 0.25)}
        disabled={!canNav || zoom >= 4}
        className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        title="Zoom in (+)"
      >
        +
      </button>

      <button
        onClick={onFitToWidth}
        disabled={!canNav}
        className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        title="Fit to width"
      >
        ⊡ Fit
      </button>

      {isLoading && <span className="ml-2 text-sm text-gray-400">Loading…</span>}
    </div>
  );
}
