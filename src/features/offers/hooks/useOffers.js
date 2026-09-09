import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { confirmDialog, notifyError } from "../../../services/dialogService.js";
import { INIT_FORM } from "../constants/offerConstants.js";
import {
  buildOfferPayload,
  filterOffersByExpiry,
  offerToForm,
  validateOfferDates,
  validateOfferDiscount,
} from "../utils/offerUtils.js";
import { useOfferStore } from "../store/offerStore.js";
import { offersQueryKey } from "../../../services/queryKeys.js";
import * as offerService from "../services/offerService.js";

export default function useOffers() {
  const queryClient = useQueryClient();
  const expiryFilter = useOfferStore((s) => s.expiryFilter);
  const setExpiryFilter = useOfferStore((s) => s.setExpiryFilter);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INIT_FORM);
  const [saveMsg, setSaveMsg] = useState(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: offersQueryKey(),
    queryFn: offerService.getOffers,
    // React Query v5: keepPreviousData was removed; use placeholderData with
    // keepPreviousData helper semantics (retain last data while refetching).
    placeholderData: (prev) => prev,
  });

  const offers = data ?? [];
  const loading = isLoading;
  const errorMessage = isError ? extractErrorMessage(error, "Failed to load offers.") : "";

  // React Query v5 requires the object form { queryKey }. The old positional
  // call invalidateQueries(["offers"]) silently failed to match in v5, so the
  // offers list was NOT refetched after an edit/create/toggle - which is why
  // updated offer/coupon details didn't reflect in the module.
  const invalidateOffers = () => queryClient.invalidateQueries({ queryKey: offersQueryKey() });

  const createOfferMutation = useMutation({
    mutationFn: offerService.createOffer,
    onSuccess: invalidateOffers,
  });
  const updateOfferMutation = useMutation({
    mutationFn: ({ id, payload }) => offerService.updateOffer(id, payload),
    onSuccess: invalidateOffers,
  });
  const deleteOfferMutation = useMutation({
    mutationFn: (id) => offerService.deleteOffer(id),
    onSuccess: invalidateOffers,
  });
  const toggleOfferMutation = useMutation({
    mutationFn: ({ id, nextActive }) => offerService.toggleOfferActive(id, nextActive),
    onSuccess: invalidateOffers,
  });

  // Resets the form to blank whenever editingId clears (modal closed, or
  // switched to "new offer"), so a previous edit's values never leak into
  // the next create/edit session.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!editingId) setForm(INIT_FORM);
  }, [editingId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const visibleOffers = useMemo(
    () => filterOffersByExpiry(offers, expiryFilter),
    [offers, expiryFilter]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(INIT_FORM);
    setSaveMsg(null);
    setShowModal(true);
  };

  const openEdit = (offer) => {
    setEditingId(offer.Id);
    setForm(offerToForm(offer));
    setSaveMsg(null);
    setShowModal(true);
  };

  const updateForm = (patch) => setForm((p) => ({ ...p, ...patch }));

  const handleSave = async (e) => {
    e.preventDefault();
    const dateError = validateOfferDates(form);
    if (dateError) {
      setSaveMsg({ type: "error", text: dateError });
      return;
    }
    const discountError = validateOfferDiscount(form);
    if (discountError) {
      setSaveMsg({ type: "error", text: discountError });
      return;
    }
    setSaveMsg(null);
    try {
      const payload = buildOfferPayload(form);
      if (editingId) {
        await updateOfferMutation.mutateAsync({ id: editingId, payload });
        setSaveMsg({ type: "success", text: "Offer updated." });
      } else {
        await createOfferMutation.mutateAsync(payload);
        setSaveMsg({ type: "success", text: "Offer created." });
      }
      setTimeout(() => setShowModal(false), 700);
    } catch (err) {
      setSaveMsg({ type: "error", text: extractErrorMessage(err, "Save failed.") });
    }
  };

  const handleDelete = async (offer) => {
    if (!(await confirmDialog({
      title: "Delete this offer?",
      description: `Permanently delete "${offer.Title}"? This cannot be undone.`,
      confirmLabel: "Yes, Delete",
      tone: "danger",
    }))) return;
    try {
      await deleteOfferMutation.mutateAsync(offer.Id);
    } catch (err) {
      notifyError(extractErrorMessage(err, "Delete failed."));
    }
  };

  const handleToggle = async (offer) => {
    const nextActive = !offer.IsActive;
    const action = nextActive ? "enable" : "disable";
    if (!(await confirmDialog({
      title: `${nextActive ? "Enable" : "Disable"} this offer?`,
      description: `Are you sure you want to ${action} "${offer.Title}"?`,
      confirmLabel: `Yes, ${nextActive ? "Enable" : "Disable"}`,
      tone: "neutral",
    }))) return;
    try {
      await toggleOfferMutation.mutateAsync({ id: offer.Id, nextActive });
    } catch (err) {
      notifyError(extractErrorMessage(err, "Update failed."));
    }
  };

  return {
    offers,
    visibleOffers,
    loading,
    error: errorMessage,
    expiryFilter,
    showModal,
    editingId,
    form,
    saveMsg,
    setExpiryFilter,
    setShowModal,
    updateForm,
    fetchOffers: () => queryClient.invalidateQueries({ queryKey: offersQueryKey() }),
    openCreate,
    openEdit,
    handleSave,
    handleDelete,
    handleToggle,
  };
}
