import { useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { useViewerStore } from "../store/viewerStore";

export function usePdfDocument() {
  const { setFile, setPdfDocument, setLoading, setError, setZoom, reset } =
    useViewerStore();

  const loadFile = useCallback(
    async (file: File, containerWidth?: number) => {
      reset();
      setLoading(true);
      setFile(file.name, file.name);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const loadingTask = pdfjsLib.getDocument({ data });
        const pdf = await loadingTask.promise;

        // Calculate fit-to-width zoom from first page
        if (containerWidth && containerWidth > 0) {
          const firstPage = await pdf.getPage(1);
          const naturalViewport = firstPage.getViewport({ scale: 1 });
          const padding = 48; // 24px each side
          const fitScale = (containerWidth - padding) / naturalViewport.width;
          setZoom(Math.min(Math.max(fitScale, 0.25), 3));
        }

        setPdfDocument(pdf, pdf.numPages);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load PDF");
      } finally {
        setLoading(false);
      }
    },
    [reset, setLoading, setFile, setPdfDocument, setZoom, setError]
  );

  return { loadFile };
}
