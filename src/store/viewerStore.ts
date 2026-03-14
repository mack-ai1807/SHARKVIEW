import { create } from "zustand";

export type AppMode = "hub" | "viewer";

export type ToolId =
  | "view-pdf"
  | "compress-pdf"
  | "merge-pdf"
  | "split-pdf"
  | "rotate-pdf"
  | "pdf-to-jpg"
  | "pdf-to-png"
  | "jpg-to-pdf"
  | "png-to-pdf"
  | "sign-pdf"
  | "unlock-pdf"
  | "fill-pdf";

interface ViewerState {
  // App mode
  appMode: AppMode;
  activeTool: ToolId | null;
  setAppMode: (mode: AppMode) => void;
  setActiveTool: (tool: ToolId | null) => void;

  // File
  filePath: string | null;
  fileName: string | null;
  /** Raw bytes of the currently open PDF — used by pdf-lib for editing */
  pdfBytes: Uint8Array | null;

  // PDF rendering
  pdfDocument: unknown | null; // PDFDocumentProxy from pdfjs-dist
  totalPages: number;
  currentPage: number;

  // View controls
  zoom: number; // 1.0 = 100%
  rotation: number; // 0 | 90 | 180 | 270

  // UI state
  isLoading: boolean;
  error: string | null;
  sidebarOpen: boolean;

  // Actions
  setFile: (path: string, name: string) => void;
  setPdfBytes: (bytes: Uint8Array) => void;
  setPdfDocument: (doc: unknown, total: number) => void;
  setCurrentPage: (page: number) => void;
  setZoom: (zoom: number) => void;
  setRotation: (rotation: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleSidebar: () => void;
  reset: () => void;
}

const initialState = {
  appMode: "hub" as AppMode,
  activeTool: null,
  filePath: null,
  fileName: null,
  pdfBytes: null,
  pdfDocument: null,
  totalPages: 0,
  currentPage: 1,
  zoom: 1.0,
  rotation: 0,
  isLoading: false,
  error: null,
  sidebarOpen: true,
};

export const useViewerStore = create<ViewerState>((set) => ({
  ...initialState,
  setAppMode: (appMode) => set({ appMode }),
  setActiveTool: (activeTool) => set({ activeTool }),
  setFile: (path, name) => set({ filePath: path, fileName: name, error: null }),
  setPdfBytes: (pdfBytes) => set({ pdfBytes }),
  setPdfDocument: (doc, total) => set({ pdfDocument: doc, totalPages: total }),
  setCurrentPage: (page) =>
    set((s) => ({
      currentPage: Math.max(1, Math.min(page, s.totalPages || 1)),
    })),
  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(zoom, 4)) }),
  setRotation: (rotation) => set({ rotation }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  reset: () => set(initialState),
}));
