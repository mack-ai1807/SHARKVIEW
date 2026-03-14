import { useState } from "react";

interface Props {
  totalPages: number;
  onSplit: (from: number, to: number) => void;
  onClose: () => void;
}

export function SplitModal({ totalPages, onSplit, onClose }: Props) {
  const [from, setFrom] = useState("1");
  const [to, setTo] = useState(String(totalPages));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const f = parseInt(from, 10);
    const t = parseInt(to, 10);
    if (isNaN(f) || isNaN(t) || f < 1 || t > totalPages || f > t) return;
    onSplit(f, t);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-80 rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="mb-1 text-base font-semibold text-gray-800">Split / Extract Pages</h2>
        <p className="mb-4 text-xs text-gray-400">Extract a page range as a new PDF</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-gray-600">From page</label>
              <input
                type="number" min={1} max={totalPages} value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <span className="mt-5 text-gray-400">–</span>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-gray-600">To page</label>
              <input
                type="number" min={1} max={totalPages} value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <p className="text-[11px] text-gray-400">Total pages: {totalPages}</p>

          <div className="flex justify-between pt-1">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              ✂️ Extract
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
