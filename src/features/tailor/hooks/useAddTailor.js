import { useAddTailorStore } from "../store/addTailorStore.js";

export default function useAddTailor() {
  const form = useAddTailorStore((s) => s.form);
  const errors = useAddTailorStore((s) => s.errors);
  const showErrors = useAddTailorStore((s) => s.showErrors);
  const showPassword = useAddTailorStore((s) => s.showPassword);
  const kyc = useAddTailorStore((s) => s.kyc);
  const viewing = useAddTailorStore((s) => s.viewing);
  const status = useAddTailorStore((s) => s.status);
  const msg = useAddTailorStore((s) => s.msg);
  const loading = useAddTailorStore((s) => s.loading);

  const onChange = useAddTailorStore((s) => s.onChange);
  const setKyc = useAddTailorStore((s) => s.setKyc);
  const setViewing = useAddTailorStore((s) => s.setViewing);
  const setShowPassword = useAddTailorStore((s) => s.setShowPassword);
  const setStatus = useAddTailorStore((s) => s.setStatus);
  const reset = useAddTailorStore((s) => s.reset);
  const submit = useAddTailorStore((s) => s.submit);

  const kycCount = Object.values(kyc).filter(Boolean).length;

  return {
    form,
    errors,
    showErrors,
    showPassword,
    kyc,
    viewing,
    status,
    msg,
    loading,
    kycCount,
    onChange,
    setKyc,
    setViewing,
    setShowPassword,
    setStatus,
    reset,
    submit,
  };
}
