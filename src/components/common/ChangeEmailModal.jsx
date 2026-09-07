import { useState } from "react";
import { Mail, Loader2, X, ArrowLeft } from "lucide-react";
import OtpBoxInput from "./OtpBoxInput.jsx";
import { requestEmailChange, verifyEmailChange } from "../../features/auth/services/authService.js";
import { extractErrorMessage } from "../../utils/formatters.js";

/**
 * OTP-verified email change.
 *   Step 1 (request): enter new email (+ current password if the account has
 *     a real email) → backend sends a 6-digit OTP to the NEW email.
 *   Step 2 (verify):  enter the OTP → email is updated.
 * Backend: POST /users/change-email/request, /users/change-email/verify.
 */
export default function ChangeEmailModal({ currentEmail, requiresPassword = true, onClose, onChanged }) {
  const [step, setStep] = useState("request"); // "request" | "verify"
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const submitRequest = async (e) => {
    e.preventDefault();
    const email = newEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (email === (currentEmail || "").trim().toLowerCase()) {
      setError("That's already your current email.");
      return;
    }
    if (requiresPassword && !password.trim()) {
      setError("Enter your current password to confirm.");
      return;
    }
    setBusy(true); setError("");
    try {
      const res = await requestEmailChange(email, requiresPassword ? password : undefined);
      setInfo(res?.message || `OTP sent to ${email}.`);
      setStep("verify");
    } catch (err) {
      setError(extractErrorMessage(err, "Couldn't send the verification code."));
    } finally {
      setBusy(false);
    }
  };

  const submitVerify = async (e) => {
    e?.preventDefault();
    if (otp.length !== 6) { setError("Enter the 6-digit code."); return; }
    setBusy(true); setError("");
    try {
      await verifyEmailChange(newEmail.trim().toLowerCase(), otp);
      onChanged?.();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, "Invalid or expired code."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {step === "verify" && (
              <button onClick={() => { setStep("request"); setError(""); }} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                <ArrowLeft size={16} />
              </button>
            )}
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-teal-600" />
              <h3 className="text-sm font-bold text-gray-800">Change Email</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs mb-3">{error}</div>}

        {step === "request" ? (
          <form onSubmit={submitRequest} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Current Email</label>
              <input value={currentEmail || "-"} disabled className="w-full px-3 py-2 rounded-lg border-2 border-gray-100 bg-gray-50 text-sm text-gray-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">New Email <span className="text-red-500">*</span></label>
              <input
                type="email" autoFocus value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 text-sm outline-none focus:border-teal-400"
                placeholder="new@email.com"
              />
            </div>
            {requiresPassword && (
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Current Password <span className="text-red-500">*</span></label>
                <input
                  type="password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 text-sm outline-none focus:border-teal-400"
                  placeholder="••••••••"
                />
              </div>
            )}
            <p className="text-[11px] text-gray-400">We'll send a 6-digit verification code to the new email.</p>
            <button type="submit" disabled={busy} className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold disabled:opacity-60">
              {busy ? <Loader2 size={14} className="animate-spin" /> : null} Send Verification Code
            </button>
          </form>
        ) : (
          <form onSubmit={submitVerify} className="space-y-4">
            {info && <p className="text-xs text-gray-500">{info}</p>}
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-2">Enter the 6-digit code sent to <span className="font-bold text-gray-700">{newEmail}</span></label>
              <OtpBoxInput value={otp} onChange={setOtp} autoFocus onComplete={() => submitVerify()} />
            </div>
            <button type="submit" disabled={busy || otp.length !== 6} className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold disabled:opacity-60">
              {busy ? <Loader2 size={14} className="animate-spin" /> : null} Verify & Update Email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
