import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLoginStore } from "../store/loginStore.js";
import { getGreetingName, setLoginFavicon, validateCaptcha } from "../utils/authUtils.js";

export default function useAdminLogin() {
  const navigate = useNavigate();
  const errorRef = useRef(null);
  const formRef = useRef(null);

  const email = useLoginStore((s) => s.email);
  const password = useLoginStore((s) => s.password);
  const showPassword = useLoginStore((s) => s.showPassword);
  const rememberMe = useLoginStore((s) => s.rememberMe);
  const showForgotPassword = useLoginStore((s) => s.showForgotPassword);
  const generatedCaptcha = useLoginStore((s) => s.generatedCaptcha);
  const captchaInput = useLoginStore((s) => s.captchaInput);
  const captchaKey = useLoginStore((s) => s.captchaKey);
  const loading = useLoginStore((s) => s.loading);
  const error = useLoginStore((s) => s.error);
  const otpStage = useLoginStore((s) => s.otpStage);
  const otp = useLoginStore((s) => s.otp);
  const otpVerifying = useLoginStore((s) => s.otpVerifying);
  const resendCooldown = useLoginStore((s) => s.resendCooldown);

  const setEmail = useLoginStore((s) => s.setEmail);
  const setPassword = useLoginStore((s) => s.setPassword);
  const setShowPassword = useLoginStore((s) => s.setShowPassword);
  const setRememberMe = useLoginStore((s) => s.setRememberMe);
  const setShowForgotPassword = useLoginStore((s) => s.setShowForgotPassword);
  const setGeneratedCaptcha = useLoginStore((s) => s.setGeneratedCaptcha);
  const setCaptchaInput = useLoginStore((s) => s.setCaptchaInput);
  const setOtp = useLoginStore((s) => s.setOtp);
  const setError = useLoginStore((s) => s.setError);
  const submitLogin = useLoginStore((s) => s.submitLogin);
  const submitOtp = useLoginStore((s) => s.submitOtp);
  const resendOtp = useLoginStore((s) => s.resendOtp);
  const backToPassword = useLoginStore((s) => s.backToPassword);
  const tickResendCooldown = useLoginStore((s) => s.tickResendCooldown);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [error]);

  useEffect(() => {
    setLoginFavicon();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => tickResendCooldown(), 1000);
    return () => clearInterval(t);
  }, [resendCooldown, tickResendCooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateCaptcha(captchaInput, generatedCaptcha)) {
      setError("Invalid captcha. Please try again.");
      useLoginStore.getState().resetCaptcha();
      return;
    }

    const result = await submitLogin();
    if (result?.success) {
      navigate("/dashboard", { replace: true });
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    const result = await submitOtp();
    if (result?.success) {
      navigate("/dashboard", { replace: true });
    }
  };

  const handleResendOtp = () => resendOtp();

  const greetingName = getGreetingName(email);

  return {
    errorRef,
    formRef,
    email,
    password,
    showPassword,
    rememberMe,
    showForgotPassword,
    generatedCaptcha,
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
    handleBackToPassword: backToPassword,
  };
}
