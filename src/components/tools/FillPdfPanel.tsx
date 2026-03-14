import { useEffect, useState } from "react";
import { getPdfFormFields, fillPdfForm, type FormField } from "../../utils/pdfEdit";

interface Props {
  pdfBytes: Uint8Array;
  onApply: (updatedBytes: Uint8Array) => void;
  onClose: () => void;
}

export function FillPdfPanel({ pdfBytes, onApply, onClose }: Props) {
  const [fields, setFields] = useState<FormField[]>([]);
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [noFields, setNoFields] = useState(false);

  useEffect(() => {
    getPdfFormFields(pdfBytes)
      .then((detected) => {
        setFields(detected.filter((f) => f.type !== "other"));
        if (detected.filter((f) => f.type !== "other").length === 0) {
          setNoFields(true);
        }
        // Seed values with current field values
        const init: Record<string, string | boolean> = {};
        for (const f of detected) init[f.name] = f.value;
        setValues(init);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [pdfBytes]);

  const set = (name: string, val: string | boolean) =>
    setValues((prev) => ({ ...prev, [name]: val }));

  const handleApply = async () => {
    setBusy(true);
    try {
      const updated = await fillPdfForm(pdfBytes, values);
      onApply(updated);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex w-[520px] max-h-[80vh] flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">Fill PDF Form</h2>
          <p className="text-xs text-gray-400">
            {loading
              ? "Detecting form fields…"
              : noFields
              ? "No fillable form fields found in this PDF"
              : `${fields.length} field${fields.length !== 1 ? "s" : ""} detected`}
          </p>
        </div>

        {/* Field list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
              Loading fields…
            </div>
          )}

          {!loading && noFields && (
            <div className="rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-6 text-center">
              <div className="text-3xl mb-2">📋</div>
              <p className="text-sm font-medium text-yellow-800">No AcroForm fields found</p>
              <p className="mt-1 text-xs text-yellow-600">
                This PDF does not contain interactive form fields.
                Use the Sign PDF tool to add a signature instead.
              </p>
            </div>
          )}

          {!loading &&
            fields.map((field) => (
              <div key={field.name}>
                <label className="mb-1 block text-xs font-medium text-gray-600 truncate" title={field.name}>
                  {field.name}
                </label>

                {field.type === "text" && (
                  <input
                    type="text"
                    value={String(values[field.name] ?? "")}
                    onChange={(e) => set(field.name, e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                )}

                {field.type === "checkbox" && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(values[field.name])}
                      onChange={(e) => set(field.name, e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Checked</span>
                  </label>
                )}

                {field.type === "dropdown" && (
                  <select
                    value={String(values[field.name] ?? "")}
                    onChange={(e) => set(field.name, e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">— select —</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}

                {field.type === "radio" && (
                  <div className="flex flex-wrap gap-3">
                    {field.options?.map((opt) => (
                      <label key={opt} className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-700">
                        <input
                          type="radio"
                          name={field.name}
                          value={opt}
                          checked={values[field.name] === opt}
                          onChange={() => set(field.name, opt)}
                          className="text-blue-600"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 flex justify-between items-center">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={busy || noFields || loading}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Applying…" : "📝 Apply & Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
