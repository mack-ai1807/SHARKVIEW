import { useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { useViewerStore } from "../store/viewerStore";

export function usePdfDocument() {
  const { setFile, setPdfDocument, setLoading, setError, reset } =
    useViewerStore();

  const loadFile = useCallback(
    async (file: File) => {
      reset();
      setLoading(true);
      setFile(file.name, file.name);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const loadingTask = pdfjsLib.getDocument({ data });
        const pdf = await loadingTask.promise;
        setPdfDocument(pdf, pdf.numPages);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load PDF");
      } finally {
        setLoading(false);
      }
    },
    [reset, setLoading, setFile, setPdfDocument, setError]
  );

  return { loadFile };
}
