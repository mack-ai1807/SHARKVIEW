import { useEffect, useState, useCallback } from "react";
import { useViewerStore } from "./store/viewerStore";
import { ToolBar } from "./components/toolbar/ToolBar";
import { PdfViewer } from "./components/viewer/PdfViewer";

function App() {
  const fileName = useViewerStore((s) => s.fileName);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    document.title = fileName
      ? `${fileName} — SHARKVIEW`
      : "SHARKVIEW — Next Gen PDF Editor";
  }, [fileName]);

  const handleContainerWidth = useCallback((w: number) => {
    setContainerWidth(w);
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden text-gray-900">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
        <span className="text-sm font-bold tracking-widest text-gray-800">
          SHARKVIEW
        </span>
        {fileName && (
          <span className="text-xs text-gray-400">{fileName}</span>
        )}
      </header>
      <ToolBar containerWidth={containerWidth} />
      <PdfViewer onContainerWidth={handleContainerWidth} />
    </div>
  );
}

export default App;
