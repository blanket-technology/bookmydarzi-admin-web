import { useRef, useEffect } from "react";

/**
 * Visual boxed OTP input (6 separate cells) backed by a single hidden text
 * input - one controlled value, no per-cell focus-juggling state to get
 * wrong. Supports typing, backspace-to-clear-previous, arrow-key navigation,
 * and pasting a full code (e.g. from a password manager or SMS autofill).
 */
export default function OtpBoxInput({
  length = 6,
  value,
  onChange,
  autoFocus = false,
  onComplete,
}) {
  const hiddenInputRef = useRef(null);
  const cellRefs = useRef([]);

  useEffect(() => {
    if (autoFocus) hiddenInputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (value.length === length) onComplete?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, length]);

  const digits = Array.from({ length }, (_, i) => value[i] ?? "");
  const activeIndex = Math.min(value.length, length - 1);

  const focusHiddenInput = () => hiddenInputRef.current?.focus();

  const handleChange = (e) => {
    const next = e.target.value.replace(/\D/g, "").slice(0, length);
    onChange(next);
  };

  const handleKeyDown = (e) => {
    // Backspace on an empty value has nothing to delete from the hidden
    // input's own onChange - handle it directly so it still clears the last
    // filled digit instead of doing nothing.
    if (e.key === "Backspace" && value.length > 0 && hiddenInputRef.current?.selectionStart === 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="relative">
      {/* The real input: invisible, full-width, sits over the boxes and
          captures every keystroke/paste/autofill - the boxes below are pure
          display, driven by `value`. */}
      <input
        ref={hiddenInputRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={length}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="absolute inset-0 w-full h-full opacity-0 cursor-text"
        aria-label="Verification code"
      />

      <div className="flex justify-between gap-2" onClick={focusHiddenInput}>
        {digits.map((digit, i) => (
          <div
            key={i}
            ref={(el) => (cellRefs.current[i] = el)}
            className={`flex-1 h-12 rounded-lg border-2 flex items-center justify-center text-lg font-mono font-bold text-slate-800 transition-colors ${
              i === activeIndex
                ? "border-teal-700 ring-2 ring-teal-700/20"
                : digit
                  ? "border-teal-200 bg-teal-50/40"
                  : "border-slate-300"
            }`}
          >
            {digit}
          </div>
        ))}
      </div>
    </div>
  );
}
