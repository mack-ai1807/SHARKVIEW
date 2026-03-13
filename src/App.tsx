import { useEffect, useState, useCallback } from "react";
import { useViewerStore } from "./store/viewerStore";
import { ToolBar } from "./components/toolbar/ToolBar";
import { PageToolsBar } from "./components/toolbar/PageToolsBar";
import { PdfViewer } from "./components/viewer/PdfViewer";
import { ThumbnailSidebar } from "./components/sidebar/ThumbnailSidebar";
import { ToolHub } from "./components/hub/ToolHub";

function App() {
  const fileName = useViewerStore((s) => s.fileName);
  const appMode = useViewerStore((s) => s.appMode);
  const setAppMode = useViewerStore((s) => s.setAppMode);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    document.title = fileName
      ? `${fileName} — SHARKVIEW`
      : "SHARKVIEW — Next Gen PDF Editor";
  }, [fileName]);

  const handleContainerWidth = useCallback((w: number) => {
    setContainerWidth(w);
  }, []);

  if (appMode === "hub") {
    return <ToolHub />;
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden text-gray-900">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
        <button
          onClick={() => setAppMode("hub")}
          className="text-sm font-bold tracking-widest text-gray-800 hover:text-blue-600 transition-colors"
          title="Back to tool hub"
        >
          🦈 SHARKVIEW
        </button>
        {fileName && (
          <span className="text-xs text-gray-400">{fileName}</span>
        )}
      </header>
      <ToolBar containerWidth={containerWidth} />
      <PageToolsBar />
      <div className="flex flex-1 overflow-hidden">
        <ThumbnailSidebar />
        <PdfViewer onContainerWidth={handleContainerWidth} />
      </div>
    </div>
  );
}

export default App;
