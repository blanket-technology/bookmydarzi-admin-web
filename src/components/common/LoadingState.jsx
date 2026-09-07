import { Loader2 } from "lucide-react";

/**
 * LoadingState - shared centered spinner for a page section/modal body while
 * data is fetching. Every full-screen/section loading state should use this
 * instead of hand-rolling `<div className="flex items-center justify-center
 * py-N"><Loader2 className="animate-spin" /></div>` per file - keeps the
 * size, color, and vertical rhythm identical everywhere.
 *
 * Does NOT cover inline button-spinners (a submit button showing its own
 * small Loader2 while busy) - those stay local to the button, this is only
 * for "the content area itself is still loading."
 *
 * Props:
 *   label   {string}  optional caption below the spinner (e.g. "Loading payment...")
 *   compact {boolean} smaller padding (py-6) for a modal body vs. a full page (py-16)
 */
export default function LoadingState({ label, compact = false }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${compact ? "py-10" : "py-16"}`}>
      <Loader2 size={compact ? 24 : 28} className="animate-spin text-teal-600" />
      {label && <p className="text-xs text-gray-400">{label}</p>}
    </div>
  );
}
