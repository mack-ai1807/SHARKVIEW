import React from "react";
import ReactDOM from "react-dom/client";
import * as pdfjsLib from "pdfjs-dist";
import App from "./App";
import "./index.css";

// Configure PDF.js worker once at application entry point
// pdfjs-dist v5: worker path uses .min.mjs (ESM)
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).href;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
