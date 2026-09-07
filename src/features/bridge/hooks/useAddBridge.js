import { useAddBridgeStore } from "../store/addBridgeStore.js";

export default function useAddBridge() {
  const form = useAddBridgeStore((s) => s.form);
  const profile = useAddBridgeStore((s) => s.profile);
  const kyc = useAddBridgeStore((s) => s.kyc);
  const viewing = useAddBridgeStore((s) => s.viewing);
  const errors = useAddBridgeStore((s) => s.errors);
  const showErrors = useAddBridgeStore((s) => s.showErrors);
  const showPassword = useAddBridgeStore((s) => s.showPassword);
  const loading = useAddBridgeStore((s) => s.loading);
  const status = useAddBridgeStore((s) => s.status);
  const msg = useAddBridgeStore((s) => s.msg);

  const onChange = useAddBridgeStore((s) => s.onChange);
  const setProfileField = useAddBridgeStore((s) => s.setProfileField);
  const setKyc = useAddBridgeStore((s) => s.setKyc);
  const setViewing = useAddBridgeStore((s) => s.setViewing);
  const setShowPassword = useAddBridgeStore((s) => s.setShowPassword);
  const setStatus = useAddBridgeStore((s) => s.setStatus);
  const reset = useAddBridgeStore((s) => s.reset);
  const submit = useAddBridgeStore((s) => s.submit);

  const hasProfileData = Object.values(profile).some((v) => v !== "");
  const kycCount = Object.values(kyc).filter(Boolean).length;

  return {
    form,
    profile,
    kyc,
    viewing,
    errors,
    showErrors,
    showPassword,
    loading,
    status,
    msg,
    hasProfileData,
    kycCount,
    onChange,
    setProfileField,
    setKyc,
    setViewing,
    setShowPassword,
    setStatus,
    reset,
    submit,
  };
}
