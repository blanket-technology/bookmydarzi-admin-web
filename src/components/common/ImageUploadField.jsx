import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import api, { resolveMediaUrl } from "../../services/api";
import { extractErrorMessage } from "../../utils/formatters";

const inp = "w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-teal-500";

/**
 * ImageUploadField - URL text input + real file upload button, shared across
 * every admin form that manages an image (Catalog, Offers, ...). Uploading
 * posts to `uploadPath` as multipart/form-data and expects `{ url }` back;
 * on failure the admin can still paste a URL directly, so upload failure
 * never blocks saving the form.
 *
 * Props:
 *   value      {string}   current image URL
 *   onChange   {function} (url: string) => void
 *   uploadPath {string}   backend endpoint, e.g. "/catalog/upload-image"
 */
export default function ImageUploadField({ value, onChange, uploadPath }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post(uploadPath, fd, { headers: { "Content-Type": "multipart/form-data" } });
      onChange(res.data.url);
    } catch (err) {
      const detail = extractErrorMessage(err, "Upload failed.");
      setUploadError(detail + " You can paste an image URL directly in the field above.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          className={inp + " flex-1"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://… or upload"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-teal-200 text-teal-700 text-sm font-semibold hover:bg-teal-50 disabled:opacity-50 shrink-0"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {uploading ? "Uploading…" : "Upload"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>
      {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
      {value && (
        <div className="flex items-center gap-2">
          <img
            src={resolveMediaUrl(value)}
            alt="preview"
            className="w-12 h-12 rounded-lg object-cover border border-gray-200"
            onError={(e) => { e.target.style.display = "none"; }}
          />
          <span className="text-xs text-gray-400 truncate flex-1">{value}</span>
        </div>
      )}
    </div>
  );
}
