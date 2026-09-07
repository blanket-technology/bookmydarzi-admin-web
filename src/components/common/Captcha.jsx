
import { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";

const CAPTCHA_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

const Captcha = ({
  onCaptchaChange,
  captchaInput,
  setCaptchaInput,
  captchaLength = 5,
}) => {
  const [captcha, setCaptcha] = useState("");

  const generateCaptcha = useCallback(() => {
    const newCaptcha = Array.from(
      { length: captchaLength },
      () =>
        CAPTCHA_CHARS[
          Math.floor(Math.random() * CAPTCHA_CHARS.length)
        ]
    ).join("");

    setCaptcha(newCaptcha);

    if (onCaptchaChange) {
      onCaptchaChange(newCaptcha);
    }
  }, [captchaLength, onCaptchaChange]);

  // Generates the initial captcha once on mount; setState happens inside
  // generateCaptcha, not synchronously in the effect body.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    generateCaptcha();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-700">
        Verification
      </label>

      <div className="flex gap-3">
        {/* Captcha Display */}
        <div className="flex h-12 flex-1 items-center justify-center rounded-lg border border-slate-300 bg-slate-100">
          <span
            className="select-none text-xl font-bold tracking-[6px] text-teal-900"
            style={{ fontFamily: "monospace" }}
          >
            {captcha}
          </span>
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={generateCaptcha}
          aria-label="Refresh Captcha"
          className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-900 text-white transition hover:bg-teal-800"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* User Input */}
      <input
        type="text"
        required
        autoComplete="off"
        placeholder="Enter Captcha"
        value={captchaInput}
        onChange={(e) => setCaptchaInput(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700"
      />
    </div>
  );
};

export default Captcha;