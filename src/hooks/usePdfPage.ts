import { useEffect, useRef } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";

export function usePdfPage(
  pdfDocument: PDFDocumentProxy | null,
  pageNumber: number,
  zoom: number,
  rotation: number
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!pdfDocument || !canvasRef.current) return;

    let cancelled = false;
    let renderTask: RenderTask | null = null;

    const render = async () => {
      const page = await pdfDocument.getPage(pageNumber);
      if (cancelled || !canvasRef.current) return;

      const viewport = page.getViewport({ scale: zoom, rotation });
      const canvas = canvasRef.current;

      // Scale for device pixel ratio — fixes blurry text on Retina/HiDPI screens
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx || cancelled) return;
      ctx.scale(dpr, dpr);

      renderTask = page.render({ canvasContext: ctx, viewport, canvas });
      try {
        await renderTask.promise;
      } catch {
        // ignore cancellation errors
      }
    };

    render().catch(console.error);

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pdfDocument, pageNumber, zoom, rotation]);

  return canvasRef;
}
