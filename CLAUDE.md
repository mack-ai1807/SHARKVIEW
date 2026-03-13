# SHARKVIEW — Claude Code Context

## Project
**Name:** SHARKVIEW — Next gen Free PDF Editor
**Description:** A desktop PDF editor/viewer built with Tauri v2 + React + TypeScript + Vite

## Tech Stack (exact versions)
- Node: v22.22.0
- Rust: 1.93.1
- Tauri CLI: 2.10.1
- Tauri (runtime): 2.10.3
- React: 19.x
- TypeScript: 5.x (strict mode always)
- Vite: 8.x
- Zustand: 5.x
- PDF.js (pdfjs-dist): 5.x
- Tailwind CSS: 4.x (uses `@tailwindcss/postcss` + `@import "tailwindcss"` in CSS)

## Folder Structure
```
SHARKVIEW/
├── src/                    # React frontend
│   ├── components/         # UI components (PascalCase filenames)
│   ├── hooks/              # Custom React hooks (useXxx.ts)
│   ├── store/
│   │   └── viewerStore.ts  # Zustand global store
│   ├── utils/              # Utility functions (camelCase)
│   ├── main.tsx            # Entry point
│   └── index.css           # Tailwind imports
├── src-tauri/              # Rust/Tauri backend
│   ├── src/
│   │   ├── main.rs
│   │   └── lib.rs          # Tauri commands go here
│   ├── Cargo.toml
│   └── tauri.conf.json
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── CLAUDE.md
```

## Zustand Store (`src/store/viewerStore.ts`)
Key state shape:
- `filePath: string | null` — absolute path of open file
- `fileName: string | null` — display name
- `pdfDocument: unknown | null` — PDFDocumentProxy from pdfjs-dist
- `totalPages: number`
- `currentPage: number` — 1-indexed
- `zoom: number` — 1.0 = 100%, range 0.25–4.0
- `rotation: number` — 0 | 90 | 180 | 270
- `isLoading: boolean`
- `error: string | null`
- `sidebarOpen: boolean`
- `thumbnailsVisible: boolean`

Import: `import { useViewerStore } from "../store/viewerStore";`

## Naming Conventions
- Components: PascalCase (`PdfViewer.tsx`, `ToolBar.tsx`)
- Hooks: camelCase with `use` prefix (`usePdfRenderer.ts`)
- Utils: camelCase (`formatPageNumber.ts`)
- Store actions: camelCase verbs (`setZoom`, `toggleSidebar`)
- CSS: Tailwind utility classes only, no custom CSS unless unavoidable

## Code Rules
- **NEVER** use class components — function components only
- **ALWAYS** use TypeScript strict mode (tsconfig has `"strict": true`)
- **NEVER** use `any` — use `unknown` and narrow types
- Imports: named imports preferred over default imports
- No barrel files (`index.ts` re-exports) unless clearly needed

## PDF.js Usage (pdfjs-dist v5)
```typescript
// Correct import (pdfjs-dist v5):
import * as pdfjsLib from "pdfjs-dist";

// Set worker source (done once in src/main.tsx — do NOT repeat in components):
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",  // v5: use .min.mjs
  import.meta.url
).href;

// Load a PDF document:
const loadingTask = pdfjsLib.getDocument({ url: filePath });
const pdf = await loadingTask.promise;
```

## Tauri v2 Plugin Names
**Important: v2 plugin names changed from v1 — always use v2 names!**

| Feature | v1 (WRONG — do not use) | v2 (correct) |
|---|---|---|
| File dialog | `@tauri-apps/api/dialog` | `@tauri-apps/plugin-dialog` |
| Filesystem | `@tauri-apps/api/fs` | `@tauri-apps/plugin-fs` |
| Shell | `@tauri-apps/api/shell` | `@tauri-apps/plugin-shell` |
| Window | `@tauri-apps/api/window` | `@tauri-apps/api/window` (unchanged) |

Example usage:
```typescript
import { open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";

// Open native file dialog
const path = await open({
  multiple: false,
  filters: [{ name: "PDF", extensions: ["pdf"] }],
});
```

## Tauri v2 Commands
Define in `src-tauri/src/lib.rs`, register in `tauri::Builder`:
```rust
#[tauri::command]
fn my_command(arg: String) -> Result<String, String> {
    Ok(format!("processed: {}", arg))
}

// In run():
.invoke_handler(tauri::generate_handler![my_command])
```

Call from frontend:
```typescript
import { invoke } from "@tauri-apps/api/core";
const result = await invoke<string>("my_command", { arg: "value" });
```

## Dev Commands
```bash
npm run dev          # Vite dev server (port 1420)
cargo tauri dev      # Full Tauri app with hot reload
npm test             # Vitest unit tests
npm run test:e2e     # Playwright E2E tests
npm run build        # Production build
```
