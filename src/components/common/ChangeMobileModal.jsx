import { useState } from "react";
import { Smartphone, Loader2, X, ArrowLeft } from "lucide-react";
import OtpBoxInput from "./OtpBoxInput.jsx";
import {
  requestCurrentMobileOtp,
  verifyCurrentMobileOtp,
  requestNewMobileOtp,
  verifyNewMobile,
} from "../../features/auth/services/authService.js";
import { extractErrorMessage } from "../../utils/formatters.js";

/**
 * OTP-verified mobile change. Backend requires proving control of the CURRENT
 * number before setting a new one, so this is a 4-step flow:
 *   1. verify-current-request : OTP to current mobile (+ password if set)
 *   2. verify-current         : confirm that OTP
 *   3. request                : OTP to the new mobile
 *   4. verify                 : confirm that OTP → mobile updated
 * Backend: /users/change-mobile/verify-current/request, /verify-current,
 *          /request, /verify.
 */
export default function ChangeMobileModal({ currentMobile, requiresPassword = true, onClose, onChanged }) {
  // When the account has NO mobile on file yet, there's nothing to verify -
  // skip the "confirm your current number" steps and go straight to adding a
  // new one (the backend's set-new-mobile step only needs the password, not a
  // prior current-mobile verification).
  const hasCurrentMobile = Boolean((currentMobile || "").trim());

  // steps: "start"/"current-verify" (verify existing) → "new-mobile" → "new-verify"
  const [step, setStep] = useState(
    !hasCurrentMobile ? "new-mobile" : (requiresPassword ? "start" : "current-verify-send"),
  );
  const [password, setPassword] = useState("");
  const [currentOtp, setCurrentOtp] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [newOtp, setNewOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const sendCurrentOtp = async (e) => {
    e?.preventDefault();
    if (requiresPassword && !password.trim()) { setError("Enter your current password to confirm."); return; }
    setBusy(true); setError("");
    try {
      const res = await requestCurrentMobileOtp(requiresPassword ? password : undefined);
      setInfo(res?.message || `OTP sent to your current number ${currentMobile}.`);
      setStep("current-verify");
    } catch (err) {
      setError(extractErrorMessage(err, "Couldn't send the code to your current mobile."));
    } finally { setBusy(false); }
  };

  const verifyCurrent = async (e) => {
    e?.preventDefault();
    if (currentOtp.length !== 6) { setError("Enter the 6-digit code."); return; }
    setBusy(true); setError("");
    try {
      await verifyCurrentMobileOtp(currentOtp);
      setInfo("");
      setStep("new-mobile");
    } catch (err) {
      setError(extractErrorMessage(err, "Invalid or expired code."));
    } finally { setBusy(false); }
  };

  const sendNewOtp = async (e) => {
    e?.preventDefault();
    const mobile = newMobile.trim();
    if (mobile.length < 10) { setError("Enter a valid 10-digit mobile number."); return; }
    if (hasCurrentMobile && mobile === (currentMobile || "").trim()) { setError("That's already your current number."); return; }
    // When we entered directly at this step (no mobile on file), the password
    // was never collected earlier - require it here.
    if (requiresPassword && !hasCurrentMobile && !password.trim()) {
      setError("Enter your current password to confirm."); return;
    }
    setBusy(true); setError("");
    try {
      const res = await requestNewMobileOtp(mobile, requiresPassword ? password : undefined);
      setInfo(res?.message || `OTP sent to ${mobile}.`);
      setStep("new-verify");
    } catch (err) {
      setError(extractErrorMessage(err, "Couldn't send the code to the new number."));
    } finally { setBusy(false); }
  };

  const verifyNew = async (e) => {
    e?.preventDefault();
    if (newOtp.length !== 6) { setError("Enter the 6-digit code."); return; }
    setBusy(true); setError("");
    try {
      await verifyNewMobile(newMobile.trim(), newOtp);
      onChanged?.();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, "Invalid or expired code."));
    } finally { setBusy(false); }
  };

  // If no password is required, jump straight to sending the current-mobile OTP.
  const effectiveStep = step === "current-verify-send" ? "start" : step;

  // The no-current-mobile flow is 2 steps (enter number → verify); the normal
  // change flow is 3 (verify current → enter new → verify new).
  const STEP_LABEL = hasCurrentMobile
    ? {
        start: "Step 1 of 3 - Confirm it's you",
        "current-verify": "Step 1 of 3 - Verify current number",
        "new-mobile": "Step 2 of 3 - New number",
        "new-verify": "Step 3 of 3 - Verify new number",
      }
    : {
        "new-mobile": "Step 1 of 2 - Enter mobile number",
        "new-verify": "Step 2 of 2 - Verify number",
      };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Smartphone size={16} className="text-teal-600" />
            <h3 className="text-sm font-bold text-gray-800">{hasCurrentMobile ? "Change Mobile" : "Add Mobile"}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>
        <p className="text-[11px] text-gray-400 mb-4">{STEP_LABEL[effectiveStep]}</p>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs mb-3">{error}</div>}
        {info && effectiveStep !== "start" && <p className="text-xs text-gray-500 mb-3">{info}</p>}

        {effectiveStep === "start" && (
          <form onSubmit={sendCurrentOtp} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Current Mobile</label>
              <input value={currentMobile || "-"} disabled className="w-full px-3 py-2 rounded-lg border-2 border-gray-100 bg-gray-50 text-sm text-gray-500" />
            </div>
            {requiresPassword && (
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Current Password <span className="text-red-500">*</span></label>
                <input type="password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 text-sm outline-none focus:border-teal-400" placeholder="••••••••" />
              </div>
            )}
            <p className="text-[11px] text-gray-400">We'll send a code to your current number to confirm it's you.</p>
            <button type="submit" disabled={busy} className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold disabled:opacity-60">
              {busy ? <Loader2 size={14} className="animate-spin" /> : null} Send Code to Current Number
            </button>
          </form>
        )}

        {effectiveStep === "current-verify" && (
          <form onSubmit={verifyCurrent} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-2">Enter the code sent to <span className="font-bold text-gray-700">{currentMobile}</span></label>
              <OtpBoxInput value={currentOtp} onChange={setCurrentOtp} autoFocus onComplete={() => verifyCurrent()} />
            </div>
            <button type="submit" disabled={busy || currentOtp.length !== 6} className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold disabled:opacity-60">
              {busy ? <Loader2 size={14} className="animate-spin" /> : null} Verify Current Number
            </button>
          </form>
        )}

        {effectiveStep === "new-mobile" && (
          <form onSubmit={sendNewOtp} className="space-y-3">
            {!hasCurrentMobile && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
                No mobile number is on file for this account. Add one below.
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">New Mobile <span className="text-red-500">*</span></label>
              <input autoFocus value={newMobile} maxLength={10}
                onChange={(e) => setNewMobile(e.target.value.replace(/\D/g, ""))}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 text-sm outline-none focus:border-teal-400" placeholder="10-digit mobile" />
            </div>
            {/* When we skipped the current-verify step (no mobile on file), the
                password wasn't collected yet - the set-new-mobile call needs it. */}
            {requiresPassword && !hasCurrentMobile && (
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Current Password <span className="text-red-500">*</span></label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 text-sm outline-none focus:border-teal-400" placeholder="••••••••" />
              </div>
            )}
            <button type="submit" disabled={busy} className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold disabled:opacity-60">
              {busy ? <Loader2 size={14} className="animate-spin" /> : null} Send Code to New Number
            </button>
          </form>
        )}

        {effectiveStep === "new-verify" && (
          <form onSubmit={verifyNew} className="space-y-4">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => { setStep("new-mobile"); setError(""); }} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><ArrowLeft size={14} /></button>
              <label className="text-xs font-semibold text-gray-500">Enter the code sent to <span className="font-bold text-gray-700">{newMobile}</span></label>
            </div>
            <OtpBoxInput value={newOtp} onChange={setNewOtp} autoFocus onComplete={() => verifyNew()} />
            <button type="submit" disabled={busy || newOtp.length !== 6} className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold disabled:opacity-60">
              {busy ? <Loader2 size={14} className="animate-spin" /> : null} Verify & Update Mobile
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
