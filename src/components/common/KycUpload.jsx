import { useRef } from "react";
import {
  FileText, CloudUpload, FileUp, Eye, CheckCircle2, Trash2, X,
} from "lucide-react";
import { resolveMediaUrl } from "../../services/api";

// Shared KYC document card + viewer, extracted from Tailor/TailorFullDetails.jsx
// so any entity type with document upload (Tailor, Bridge/employee) renders
// the exact same upload/replace/view UI.

export function KycCard({ label, icon: DocIcon, docKey, pendingFile, existingUrl, onPickFile, onView, onClearPending, onDelete, uploading, editMode }) {
  const ref = useRef(null);
  const hasPending  = !!pendingFile;
  const hasExisting = !!existingUrl;
  const has = hasPending || hasExisting;

  const statusLabel = uploading
    ? "Uploading…"
    : hasPending
    ? "Ready to save"
    : hasExisting
    ? "✓ Uploaded"
    : "Pending";

  const statusColor = uploading
    ? "bg-amber-100 text-amber-700 border-amber-200"
    : has
    ? "bg-teal-50 text-teal-700 border-teal-200"
    : "bg-white text-gray-400 border-gray-200";

  return (
    <div className={`rounded-2xl border-2 overflow-hidden transition-all duration-200
      ${has ? "border-teal-400 shadow-md shadow-teal-100/60" : "border-dashed border-gray-200 hover:border-teal-300"}`}>

      <div className={`px-4 py-3.5 flex items-center justify-between
        ${has ? "bg-teal-600" : "bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-100"}`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
            ${has ? "bg-white/20" : "bg-white border-2 border-gray-200"}`}>
            <DocIcon size={18} className={has ? "text-white" : "text-gray-400"} />
          </div>
          <div>
            <p className={`text-sm font-bold ${has ? "text-white" : "text-gray-700"}`}>{label}</p>
            <p className={`text-xs mt-0.5 ${has ? "text-teal-100" : "text-gray-400"}`}>
              {hasPending ? pendingFile.name : hasExisting ? "File on server" : "Not uploaded"}
            </p>
          </div>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      <div className="p-4 bg-white space-y-3">
        {hasPending ? (
          <div className="flex items-center gap-3 bg-amber-50 border-2 border-amber-200 rounded-xl px-4 py-3">
            <FileText size={16} className="text-amber-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-amber-800 font-semibold truncate">{pendingFile.name}</p>
              <p className="text-[11px] text-amber-500 mt-0.5">{(pendingFile.size / 1024).toFixed(0)} KB · pending upload</p>
            </div>
          </div>
        ) : hasExisting ? (
          <div className="flex items-center gap-3 bg-teal-50 border-2 border-teal-200 rounded-xl px-4 py-3">
            <CheckCircle2 size={16} className="text-teal-600 shrink-0" />
            <p className="text-xs text-teal-800 font-semibold flex-1">Document on server</p>
          </div>
        ) : (
          <div
            onClick={() => editMode && ref.current.click()}
            className={`flex flex-col items-center justify-center gap-2 py-6 rounded-xl
              bg-gray-50 border-2 border-dashed border-gray-200 transition-all group
              ${editMode ? "cursor-pointer hover:bg-teal-50/40 hover:border-teal-300" : "cursor-default"}`}>
            <CloudUpload size={28} className={`text-gray-300 ${editMode ? "group-hover:text-teal-400 transition-colors" : ""}`} />
            <p className={`text-xs font-semibold ${editMode ? "text-gray-400 group-hover:text-teal-600 transition-colors" : "text-gray-300"}`}>
              {editMode ? "Click to upload" : "No file uploaded"}
            </p>
            <p className="text-[11px] text-gray-300">JPG · PNG · PDF · max 5 MB</p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input ref={ref} type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden"
            onChange={(e) => { if (e.target.files[0]) onPickFile(docKey, e.target.files[0]); e.target.value = ""; }} />

          <button type="button" onClick={() => ref.current.click()} disabled={!editMode || uploading}
            className={`flex-1 h-9 flex items-center justify-center gap-2 rounded-xl text-xs font-bold border-2 transition-all
              ${editMode && !uploading
                ? "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                : "bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed"}`}>
            <FileUp size={14} /> {has ? "Replace" : "Upload"}
          </button>

          <button type="button" onClick={() => onView(docKey)} disabled={!has || uploading} title="View"
            className={`w-9 h-9 flex items-center justify-center rounded-xl border-2 transition-all
              ${has && !uploading
                ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200"
                : "bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed"}`}>
            <Eye size={15} />
          </button>

          {hasPending ? (
            <button type="button" onClick={() => onClearPending(docKey)} title="Remove pending"
              className="w-9 h-9 flex items-center justify-center rounded-xl border-2 bg-red-50 hover:bg-red-100 text-red-600 border-red-200 transition-all">
              <Trash2 size={15} />
            </button>
          ) : hasExisting && editMode && onDelete ? (
            <button type="button" onClick={() => onDelete(docKey)} disabled={uploading} title="Delete document"
              className={`w-9 h-9 flex items-center justify-center rounded-xl border-2 transition-all
                ${uploading
                  ? "bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed"
                  : "bg-red-50 hover:bg-red-100 text-red-600 border-red-200"}`}>
              <Trash2 size={15} />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function DocModal({ file, serverUrl, onClose }) {
  if (!file && !serverUrl) return null;
  const isLocalFile = !!file;
  const url   = isLocalFile ? URL.createObjectURL(file) : resolveMediaUrl(serverUrl);
  const isPdf = isLocalFile ? file.type === "application/pdf" : url?.endsWith(".pdf");
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden max-h-[92vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-teal-100 rounded-xl flex items-center justify-center">
              <FileText size={18} className="text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 truncate max-w-xs">
                {isLocalFile ? file.name : url?.split("/").pop()}
              </p>
              <p className="text-xs text-gray-400">
                {isLocalFile ? `${(file.size / 1024).toFixed(1)} KB · ${file.type}` : "Stored on server"}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-500 transition-all">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          {isPdf
            ? <iframe src={url} title="Preview" className="w-full h-[68vh] rounded-xl border" />
            : <img src={url} alt="Preview" className="max-w-full max-h-[68vh] mx-auto rounded-xl shadow object-contain" />}
        </div>
      </div>
    </div>
  );
}
