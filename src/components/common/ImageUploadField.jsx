import { useRef, useState } from "react";
import { Loader2, ImagePlus, Pencil, X, Link2 } from "lucide-react";
import api, { resolveMediaUrl } from "../../services/api";
import { extractErrorMessage } from "../../utils/formatters";

const urlInputClass =
  "w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-teal-500";

/**
 * ImageUploadField - large drag-and-drop preview card, shared across every
 * admin form that manages an image (Catalog, Offers, ...). Uploading posts
 * to `uploadPath` as multipart/form-data and expects `{ url }` back; the
 * raw URL is still editable via a secondary "paste a link instead" toggle,
 * so upload failure never blocks saving the form.
 *
 * Props:
 *   value      {string}   current image URL
 *   onChange   {function} (url: string) => void
 *   uploadPath {string}   backend endpoint, e.g. "/catalog/upload-image"
 */
export default function ImageUploadField({ value, onChange, uploadPath }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const fileRef = useRef(null);

  const uploadFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post(uploadPath, fd, { headers: { "Content-Type": "multipart/form-data" } });
      onChange(res.data.url);
      setUrlMode(false);
    } catch (err) {
      setUploadError(extractErrorMessage(err, "Upload failed."));
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    uploadFile(file);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) uploadFile(file);
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative aspect-[16/9] w-full rounded-2xl border-2 overflow-hidden transition-colors ${
          dragOver
            ? "border-teal-500 bg-teal-50"
            : value
              ? "border-gray-200"
              : "border-dashed border-gray-300 bg-gray-50 hover:border-teal-300 hover:bg-teal-50/40"
        }`}
      >
        {value ? (
          <>
            <img
              src={resolveMediaUrl(value)}
              alt="preview"
              className="absolute inset-0 h-full w-full object-cover"
              onError={(e) => { e.target.style.display = "none"; }}
            />
            <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/60 via-black/0 to-black/0 p-3 opacity-0 transition-opacity hover:opacity-100">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-white disabled:opacity-50"
              >
                {uploading ? <Loader2 size={13} className="animate-spin" /> : <Pencil size={13} />}
                {uploading ? "Uploading…" : "Replace"}
              </button>
              <button
                type="button"
                onClick={() => onChange("")}
                className="flex items-center gap-1 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-white"
              >
                <X size={13} /> Remove
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-400 disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 size={22} className="animate-spin text-teal-600" />
            ) : (
              <ImagePlus size={22} className={dragOver ? "text-teal-500" : "text-gray-300"} />
            )}
            <span className="text-xs font-semibold">
              {uploading ? "Uploading…" : dragOver ? "Drop to upload" : "Click or drag an image here"}
            </span>
            <span className="text-[11px] text-gray-400">PNG or JPG</span>
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      {uploadError && (
        <p className="mt-1.5 text-xs text-red-600">
          {uploadError} You can{" "}
          <button type="button" onClick={() => setUrlMode(true)} className="font-semibold underline">
            paste a link instead
          </button>
          .
        </p>
      )}

      {!urlMode && !uploadError ? (
        <button
          type="button"
          onClick={() => setUrlMode(true)}
          className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-teal-600"
        >
          <Link2 size={11} /> Paste an image link instead
        </button>
      ) : null}

      {urlMode && (
        <input
          className={urlInputClass + " mt-1.5"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          autoFocus
        />
      )}
    </div>
  );
}
