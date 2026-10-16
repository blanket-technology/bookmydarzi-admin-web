import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import { Check, Loader2, X, ZoomIn } from "lucide-react";

/**
 * Fixed 1:1 square crop, matching the website catalog card's own
 * aspect-square + object-cover rendering - a source image with a different
 * native shape (e.g. a wide infographic banner) previously got silently
 * cropped by the browser at display time with no way for admin to control
 * which part of the image survived. This moves that same square crop
 * in front of the upload instead, so admin picks the crop once, and every
 * surface that renders the image (website card, admin list thumbnails)
 * shows the same, correctly-framed square.
 *
 * Props:
 *   file     {File}     the raw image file just selected/dropped
 *   onCancel {function} () => void - discard, back to the picker
 *   onCropped {function} (croppedFile: File) => void - cropped result,
 *     same original filename/mime type, ready to hand to the existing
 *     upload call
 */
export default function ImageCropModal({ file, onCancel, onCropped }) {
  const [imageSrc] = useState(() => URL.createObjectURL(file));
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onCropComplete = useCallback((_croppedArea, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const confirm = async () => {
    if (!croppedAreaPixels) return;
    setBusy(true);
    setError("");
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels, file.type);
      const croppedFile = new File([blob], file.name, { type: file.type });
      URL.revokeObjectURL(imageSrc);
      onCropped(croppedFile);
    } catch {
      setError("Couldn't crop this image. Try a different file.");
      setBusy(false);
    }
  };

  const cancel = () => {
    URL.revokeObjectURL(imageSrc);
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-800">Crop image</h3>
          <button onClick={cancel} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-3">
          Drag to reposition, use the slider to zoom. The square frame is exactly
          how this image will appear on the website.
        </p>

        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="flex items-center gap-2 mt-4">
          <ZoomIn size={14} className="text-gray-400 shrink-0" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-teal-600"
          />
        </div>

        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={cancel}
            disabled={busy}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={busy || !croppedAreaPixels}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50"
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            {busy ? "Applying…" : "Use this crop"}
          </button>
        </div>
      </div>
    </div>
  );
}

function getCroppedBlob(imageSrc, cropPixels, mimeType) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = cropPixels.width;
      canvas.height = cropPixels.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));
      ctx.drawImage(
        img,
        cropPixels.x,
        cropPixels.y,
        cropPixels.width,
        cropPixels.height,
        0,
        0,
        cropPixels.width,
        cropPixels.height,
      );
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Crop failed"))),
        mimeType || "image/jpeg",
        0.92,
      );
    };
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = imageSrc;
  });
}
