import { useRef } from "react";
import { useViewerStore, type ToolId } from "../../store/viewerStore";
import { usePdfDocument } from "../../hooks/usePdfDocument";

interface ToolCard {
  id: ToolId;
  label: string;
  description: string;
  icon: string;
  color: string;
  acceptFiles?: string;
}

const TOOL_SECTIONS: { section: string; tools: ToolCard[] }[] = [
  {
    section: "Edit & Compress",
    tools: [
      {
        id: "view-pdf",
        label: "View / Edit PDF",
        description: "Open, navigate and annotate a PDF",
        icon: "📄",
        color: "bg-blue-50 border-blue-200",
        acceptFiles: ".pdf,application/pdf",
      },
      {
        id: "compress-pdf",
        label: "Compress PDF",
        description: "Reduce file size while preserving quality",
        icon: "🗜️",
        color: "bg-orange-50 border-orange-200",
        acceptFiles: ".pdf,application/pdf",
      },
      {
        id: "rotate-pdf",
        label: "Rotate Pages",
        description: "Rotate PDF pages to portrait or landscape",
        icon: "🔄",
        color: "bg-teal-50 border-teal-200",
        acceptFiles: ".pdf,application/pdf",
      },
      {
        id: "sign-pdf",
        label: "Sign PDF",
        description: "Draw your signature and apply to PDF",
        icon: "✍️",
        color: "bg-purple-50 border-purple-200",
        acceptFiles: ".pdf,application/pdf",
      },
    ],
  },
  {
    section: "Split & Merge",
    tools: [
      {
        id: "merge-pdf",
        label: "Merge PDF",
        description: "Combine multiple PDFs into one document",
        icon: "🔗",
        color: "bg-green-50 border-green-200",
        acceptFiles: ".pdf,application/pdf",
      },
      {
        id: "split-pdf",
        label: "Split PDF",
        description: "Extract pages or split into separate files",
        icon: "✂️",
        color: "bg-yellow-50 border-yellow-200",
        acceptFiles: ".pdf,application/pdf",
      },
    ],
  },
  {
    section: "Convert from PDF",
    tools: [
      {
        id: "pdf-to-jpg",
        label: "PDF to JPG",
        description: "Export each PDF page as a JPG image",
        icon: "🖼️",
        color: "bg-pink-50 border-pink-200",
        acceptFiles: ".pdf,application/pdf",
      },
      {
        id: "pdf-to-png",
        label: "PDF to PNG",
        description: "Export each PDF page as a PNG image",
        icon: "🖼️",
        color: "bg-violet-50 border-violet-200",
        acceptFiles: ".pdf,application/pdf",
      },
    ],
  },
  {
    section: "Convert to PDF",
    tools: [
      {
        id: "jpg-to-pdf",
        label: "JPG to PDF",
        description: "Convert JPG images into a PDF document",
        icon: "📷",
        color: "bg-rose-50 border-rose-200",
        acceptFiles: "image/jpeg,.jpg,.jpeg",
      },
      {
        id: "png-to-pdf",
        label: "PNG to PDF",
        description: "Convert PNG images into a PDF document",
        icon: "🖼️",
        color: "bg-cyan-50 border-cyan-200",
        acceptFiles: "image/png,.png",
      },
    ],
  },
  {
    section: "Sign & Security",
    tools: [
      {
        id: "unlock-pdf",
        label: "Unlock PDF",
        description: "Remove password protection from PDF",
        icon: "🔓",
        color: "bg-amber-50 border-amber-200",
        acceptFiles: ".pdf,application/pdf",
      },
    ],
  },
];

export function ToolHub() {
  const { setActiveTool, setAppMode } = useViewerStore();
  const { loadFile } = usePdfDocument();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingToolRef = useRef<ToolCard | null>(null);

  const handleToolClick = (tool: ToolCard) => {
    pendingToolRef.current = tool;
    if (fileInputRef.current) {
      fileInputRef.current.accept = tool.acceptFiles ?? "*";
      fileInputRef.current.multiple = tool.id === "merge-pdf" || tool.id === "jpg-to-pdf" || tool.id === "png-to-pdf";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const tool = pendingToolRef.current;
    if (!tool || !e.target.files?.length) return;
    e.target.value = "";

    setActiveTool(tool.id);
    setAppMode("viewer");

    const file = e.target.files[0];
    // Load the file into the viewer (containerWidth 0 → will use default zoom)
    await loadFile(file, window.innerWidth - 240);
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black tracking-tight text-gray-900">
            🦈 SHARKVIEW
          </span>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            Next Gen PDF Editor
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Choose a tool to get started
        </p>
      </header>

      {/* Tool grid */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {TOOL_SECTIONS.map(({ section, tools }) => (
          <div key={section} className="mb-8">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
              {section}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => handleToolClick(tool)}
                  className={`flex items-start gap-3 rounded-xl border p-4 text-left transition hover:shadow-md active:scale-[0.98] ${tool.color}`}
                >
                  <span className="text-2xl leading-none">{tool.icon}</span>
                  <div>
                    <div className="text-sm font-semibold text-gray-800">
                      {tool.label}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500">
                      {tool.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
