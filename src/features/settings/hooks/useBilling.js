import { useEffect } from "react";
import { useSettingsStore } from "../store/settingsStore.js";

export default function useBilling() {
  const billingData = useSettingsStore((s) => s.billingData);
  const billingLoading = useSettingsStore((s) => s.billingLoading);
  const billingError = useSettingsStore((s) => s.billingError);
  const billingEditing = useSettingsStore((s) => s.billingEditing);
  const billingForm = useSettingsStore((s) => s.billingForm);
  const billingSaving = useSettingsStore((s) => s.billingSaving);
  const billingSaveMsg = useSettingsStore((s) => s.billingSaveMsg);
  const cacheClearing = useSettingsStore((s) => s.cacheClearing);
  const cacheMsg = useSettingsStore((s) => s.cacheMsg);
  const loadBilling = useSettingsStore((s) => s.loadBilling);
  const setBillingEditing = useSettingsStore((s) => s.setBillingEditing);
  const setBillingForm = useSettingsStore((s) => s.setBillingForm);
  const setBillingSaveMsg = useSettingsStore((s) => s.setBillingSaveMsg);
  const saveBilling = useSettingsStore((s) => s.saveBilling);
  const clearCache = useSettingsStore((s) => s.clearCache);
  const setCacheMsg = useSettingsStore((s) => s.setCacheMsg);

  useEffect(() => {
    loadBilling();
  }, [loadBilling]);

  return {
    billingData,
    billingLoading,
    billingError,
    billingEditing,
    billingForm,
    billingSaving,
    billingSaveMsg,
    cacheClearing,
    cacheMsg,
    setBillingEditing,
    setBillingForm,
    setBillingSaveMsg,
    saveBilling,
    clearCache,
    setCacheMsg,
  };
}
