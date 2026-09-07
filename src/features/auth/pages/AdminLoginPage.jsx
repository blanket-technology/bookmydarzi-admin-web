import { Eye, EyeOff, AlertTriangle } from "lucide-react";
import OtpBoxInput from "../../../components/common/OtpBoxInput.jsx";
import Captcha from "../../../components/common/Captcha.jsx";
import ForgotPasswordModal from "../../../components/common/ForgotPasswordModal.jsx";
// logo.png lives in /public, so it's served at the site root (no bundler import).
const logoImage = "/logo.png";
import useAdminLogin from "../hooks/useAdminLogin.js";

export default function AdminLoginPage() {
  const {
    errorRef,
    formRef,
    email,
    password,
    showPassword,
    rememberMe,
    showForgotPassword,
    captchaInput,
    captchaKey,
    loading,
    error,
    otpStage,
    otp,
    otpVerifying,
    resendCooldown,
    greetingName,
    setEmail,
    setPassword,
    setShowPassword,
    setRememberMe,
    setShowForgotPassword,
    setGeneratedCaptcha,
    setCaptchaInput,
    setOtp,
    handleSubmit,
    handleVerifyOtp,
    handleResendOtp,
    handleBackToPassword,
  } = useAdminLogin();

  return (
    <div className="min-h-screen bg-sky-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">

        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
          {otpStage ? (
            <form ref={formRef} onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Verify it's you</h1>
                <p className="text-slate-500 mt-1.5 text-sm">
                  We sent a 6-digit code to <span className="font-semibold text-slate-700">{email}</span>
                </p>
              </div>

              {error && (
                <div
                  ref={errorRef}
                  className="flex items-start gap-2 bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-lg text-sm font-medium"
                >
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block mb-2 text-sm font-medium text-slate-700">
                  Verification Code
                </label>
                <OtpBoxInput
                  length={6}
                  value={otp}
                  onChange={setOtp}
                  autoFocus
                  onComplete={() => {
                    formRef.current?.requestSubmit();
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={otpVerifying || otp.length !== 6}
                className={`w-full py-3 rounded-xl font-semibold text-white shadow-lg transition ${
                  otpVerifying || otp.length !== 6
                    ? "bg-slate-300 cursor-not-allowed"
                    : "bg-teal-700 hover:bg-teal-800 active:scale-[0.98]"
                }`}
              >
                {otpVerifying ? "Verifying…" : "Verify & Sign In"}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={handleBackToPassword}
                  className="text-slate-500 hover:text-slate-700 font-medium"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0}
                  className={`font-medium ${resendCooldown > 0 ? "text-slate-400 cursor-not-allowed" : "text-teal-700 hover:text-teal-800"}`}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  {greetingName ? `Welcome back ${greetingName}!` : "Welcome back!"}
                </h1>
                <p className="text-slate-500 mt-1.5 text-sm">
                  Enter your details below to continue
                </p>
              </div>

              {error && (
                <div
                  ref={errorRef}
                  className="flex items-start gap-2 bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-lg text-sm font-medium"
                >
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block mb-2 text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@bookmydarzi.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/30"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-300 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-teal-700 font-medium hover:text-teal-800 hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <Captcha
                key={captchaKey}
                onCaptchaChange={setGeneratedCaptcha}
                captchaInput={captchaInput}
                setCaptchaInput={setCaptchaInput}
              />

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl font-semibold text-white shadow-lg transition ${
                  loading
                    ? "bg-slate-300 cursor-not-allowed"
                    : "bg-teal-700 hover:bg-teal-800 active:scale-[0.98]"
                }`}
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
          )}
        </div>

        <div className="hidden md:block md:w-1/2 p-3">
          <div className="w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-teal-700 to-teal-900 flex items-center justify-center p-10">
            <img
              src={logoImage}
              alt="BookMyDarzi"
              className="max-w-[70%] max-h-[70%] object-contain drop-shadow-lg"
            />
          </div>
        </div>
      </div>

      {showForgotPassword && (
        <ForgotPasswordModal
          userEmail={email}
          title="Reset Password"
          onClose={() => setShowForgotPassword(false)}
        />
      )}
    </div>
  );
}
