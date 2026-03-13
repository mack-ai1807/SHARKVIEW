import { create } from "zustand";

interface ViewerState {
  // File
  filePath: string | null;
  fileName: string | null;

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
  thumbnailsVisible: boolean;

  // Actions
  setFile: (path: string, name: string) => void;
  setPdfDocument: (doc: unknown, total: number) => void;
  setCurrentPage: (page: number) => void;
  setZoom: (zoom: number) => void;
  setRotation: (rotation: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleSidebar: () => void;
  toggleThumbnails: () => void;
  reset: () => void;
}

const initialState = {
  filePath: null,
  fileName: null,
  pdfDocument: null,
  totalPages: 0,
  currentPage: 1,
  zoom: 1.0,
  rotation: 0 as const,
  isLoading: false,
  error: null,
  sidebarOpen: true,
  thumbnailsVisible: false,
};

export const useViewerStore = create<ViewerState>((set) => ({
  ...initialState,
  setFile: (path, name) => set({ filePath: path, fileName: name, error: null }),
  setPdfDocument: (doc, total) => set({ pdfDocument: doc, totalPages: total }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setZoom: (zoom) => set({ zoom }),
  setRotation: (rotation) => set({ rotation }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleThumbnails: () => set((s) => ({ thumbnailsVisible: !s.thumbnailsVisible })),
  reset: () => set(initialState),
}));
