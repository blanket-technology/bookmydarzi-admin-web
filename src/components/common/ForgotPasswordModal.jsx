import { useState } from "react";
import { KeyRound, X, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import api from "../../services/api";
import { extractErrorMessage } from "../../utils/formatters";

const INPUT = "w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400";

function Toast({ msg, onClose }) {
  if (!msg) return null;
  const ok = msg.type === "success";
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold mb-4 ${ok ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
      {ok ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> : <AlertCircle size={16} className="text-red-500 shrink-0" />}
      <span className="flex-1">{msg.text}</span>
      {onClose && <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>}
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-600 block mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

/**
 * Reset-password modal - "Change Password" (already logged in, from Settings)
 * and "Forgot Password" (from the login screen) both use this same 3-step
 * OTP flow (request -> verify -> reset) against the same backend endpoints;
 * only the entry point and title differ.
 */
export default function ForgotPasswordModal({ userEmail, onClose, title = "Change Password" }) {
  const [step, setStep]       = useState(1); // 1=request, 2=verify, 3=reset
  const [email, setEmail]     = useState(userEmail || "");
  const [otp, setOtp]         = useState("");
  const [resetToken, setToken]= useState("");
  const [newPwd, setNewPwd]   = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState(null);

  const requestOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg(null);
    try {
      await api.post("/auth/forgot-password/request", { email });
      setStep(2);
      setMsg({ type: "success", text: `OTP sent to ${email}` });
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed to send OTP." });
    } finally { setLoading(false); }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg(null);
    try {
      const res = await api.post("/auth/forgot-password/verify", { email, otp });
      setToken(res.data.reset_token);
      setStep(3);
      setMsg(null);
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Invalid OTP." });
    } finally { setLoading(false); }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg(null);
    try {
      await api.post("/auth/forgot-password/reset", { reset_token: resetToken, new_password: newPwd });
      setMsg({ type: "success", text: "Password changed successfully!" });
      setTimeout(onClose, 1500);
    } catch (err) {
      setMsg({ type: "error", text: extractErrorMessage(err, "Reset failed.") });
    } finally { setLoading(false); }
  };

  const stepLabel = ["Request OTP", "Enter OTP", "Set New Password"][step - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <KeyRound size={18} className="text-teal-600" /> {title}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-5 mt-3">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${step >= s ? "bg-teal-600 border-teal-600 text-white" : "border-gray-300 text-gray-400"}`}>{s}</div>
              {s < 3 && <div className={`h-0.5 w-8 rounded ${step > s ? "bg-teal-500" : "bg-gray-200"}`} />}
            </div>
          ))}
          <span className="ml-1 text-xs font-semibold text-teal-700">{stepLabel}</span>
        </div>

        <Toast msg={msg} onClose={() => setMsg(null)} />

        {step === 1 && (
          <form onSubmit={requestOtp} className="space-y-4">
            <Field label="Registered Email" required>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT} placeholder="admin@example.com" />
            </Field>
            <p className="text-xs text-gray-500">A 6-digit OTP will be sent to this email address.</p>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : null} Send OTP
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={verifyOtp} className="space-y-4">
            <Field label="6-Digit OTP" required>
              <input type="text" required maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} className={`${INPUT} tracking-widest text-center text-xl`} placeholder="• • • • • •" />
            </Field>
            <button type="button" onClick={() => { setStep(1); setMsg(null); }} className="text-xs text-teal-600 hover:underline">Resend OTP</button>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={loading || otp.length < 6} className="flex-1 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : null} Verify OTP
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={resetPassword} className="space-y-4">
            <Field label="New Password" required>
              <div className="relative">
                <input type={showPwd ? "text" : "password"} required minLength={6} value={newPwd} onChange={(e) => setNewPwd(e.target.value)} className={`${INPUT} pr-10`} placeholder="Min 6 chars, 1 uppercase, 1 number" />
                <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
            <p className="text-xs text-gray-500">Must include at least one uppercase letter and one number.</p>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : null} Set Password
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
