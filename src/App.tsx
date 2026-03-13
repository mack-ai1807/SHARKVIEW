import { useEffect } from "react";
import { useViewerStore } from "./store/viewerStore";

function App() {
  const currentFileName = useViewerStore((s) => s.fileName);

  useEffect(() => {
    document.title = currentFileName
      ? `${currentFileName} — SHARKVIEW`
      : "SHARKVIEW — Next Gen PDF Editor";
  }, [currentFileName]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-gray-100 text-gray-900">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight">SHARKVIEW</h1>
        {currentFileName && (
          <span className="text-sm text-gray-500">{currentFileName}</span>
        )}
      </header>
      <main className="flex flex-1 items-center justify-center overflow-hidden">
        <p className="text-gray-400">Open a PDF to get started.</p>
      </main>
    </div>
  );
}

export default App;
