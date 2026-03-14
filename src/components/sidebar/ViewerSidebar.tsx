import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { useViewerStore, type SidebarTab } from "../../store/viewerStore";

// ─── Tool definitions ─────────────────────────────────────────────────────────

interface ToolDef {
  id: string;
  icon: string;
  label: string;
  danger?: boolean;
}

const TOOL_GROUPS: { heading: string; tools: ToolDef[] }[] = [
  {
    heading: "Edit",
    tools: [
      { id: "rotate-cw",    icon: "↻", label: "Rotate CW" },
      { id: "rotate-ccw",   icon: "↺", label: "Rotate CCW" },
      { id: "delete-page",  icon: "🗑", label: "Delete Page", danger: true },
      { id: "fill",         icon: "📝", label: "Fill Form" },
      { id: "sign",         icon: "✍️", label: "Sign PDF" },
    ],
  },
  {
    heading: "Optimize",
    tools: [
      { id: "compress-pdf",    icon: "🗜", label: "Compress PDF" },
      { id: "compress-images", icon: "🖼", label: "Compress Images" },
      { id: "unlock",          icon: "🔓", label: "Unlock PDF" },
      { id: "remove-watermark",icon: "🚿", label: "Remove Watermark" },
    ],
  },
  {
    heading: "Organize",
    tools: [
      { id: "merge",  icon: "🔗", label: "Merge PDF" },
      { id: "split",  icon: "✂️", label: "Split PDF" },
    ],
  },
  {
    heading: "Export",
    tools: [
      { id: "pdf-to-jpg", icon: "🖼", label: "PDF → JPG" },
      { id: "pdf-to-png", icon: "🖼", label: "PDF → PNG" },
    ],
  },
  {
    heading: "Save",
    tools: [
      { id: "save", icon: "💾", label: "Save PDF" },
    ],
  },
];

// ─── Page thumbnail ───────────────────────────────────────────────────────────

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
      canvas.width = Math.floor(vp.width);
      canvas.height = Math.floor(vp.height);
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
      className={`flex w-full flex-col items-center gap-1 rounded-lg p-2 transition-colors ${
        isActive
          ? "bg-blue-600/20 ring-1 ring-blue-500"
          : "hover:bg-slate-600/50"
      }`}
      title={`Page ${pageNumber}`}
    >
      <div className="relative overflow-hidden rounded bg-white shadow">
        <canvas ref={canvasRef} className={`block transition-opacity ${rendered ? "opacity-100" : "opacity-0"}`} />
        {!rendered && (
          <div className="absolute inset-0 animate-pulse bg-slate-600" style={{ width: 80, height: 104 }} />
        )}
      </div>
      <span className={`text-[10px] font-medium ${isActive ? "text-blue-400" : "text-slate-400"}`}>
        {pageNumber}
      </span>
    </button>
  );
}

// ─── Main sidebar ─────────────────────────────────────────────────────────────

interface ViewerSidebarProps {
  onToolAction: (toolId: string) => void;
  busy: boolean;
}

export function ViewerSidebar({ onToolAction, busy }: ViewerSidebarProps) {
  const { pdfDocument, totalPages, currentPage, setCurrentPage, sidebarOpen, sidebarTab, setSidebarTab, pdfBytes } =
    useViewerStore();

  const pdf = pdfDocument as PDFDocumentProxy | null;

  if (!sidebarOpen) return null;

  return (
    <aside className="flex w-[220px] shrink-0 flex-col border-r border-slate-700 bg-slate-800">
      {/* Tab bar */}
      <div className="flex border-b border-slate-700">
        {(["tools", "pages"] as SidebarTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setSidebarTab(tab)}
            className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              sidebarTab === tab
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab === "tools" ? "⚙ Tools" : "📄 Pages"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {sidebarTab === "tools" && (
          <div className="p-3 space-y-4">
            {TOOL_GROUPS.map(({ heading, tools }) => (
              <div key={heading}>
                <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                  {heading}
                </p>
                <div className="space-y-1">
                  {tools.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => onToolAction(tool.id)}
                      disabled={busy || !pdfBytes}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        tool.danger
                          ? "text-red-400 hover:bg-red-900/30 hover:text-red-300"
                          : "text-slate-300 hover:bg-slate-700 hover:text-white"
                      }`}
                    >
                      <span className="text-sm leading-none">{tool.icon}</span>
                      {tool.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {sidebarTab === "pages" && (
          <div className="p-2">
            {!pdf || !totalPages ? (
              <p className="mt-4 text-center text-xs text-slate-500">No pages yet</p>
            ) : (
              Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <PageThumb
                  key={n}
                  pdf={pdf}
                  pageNumber={n}
                  isActive={n === currentPage}
                  onClick={() => setCurrentPage(n)}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Busy indicator */}
      {busy && (
        <div className="border-t border-slate-700 px-3 py-2 text-xs text-slate-400">
          ⏳ Working…
        </div>
      )}
    </aside>
  );
}
