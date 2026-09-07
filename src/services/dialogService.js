/**
 * Global confirm/error-toast service - lets Zustand stores and hooks (which
 * have no React tree of their own to hang a <ConfirmModal> or local error
 * state off) trigger the same polished UI the rest of the app uses, instead
 * of falling back to the browser's raw window.confirm()/alert(). A single
 * <DialogHost /> (mounted once in Layout.jsx) listens for these events and
 * renders the actual modal/toast.
 *
 * Usage:
 *   import { confirmDialog, notifyError } from "../../services/dialogService";
 *   if (!(await confirmDialog({ title: "Delete item?", description: "..." }))) return;
 *   ...
 *   catch (err) { notifyError(extractErrorMessage(err, "Delete failed.")); }
 */

let confirmResolver = null;

/**
 * Shows a confirm dialog and resolves to true/false, mirroring
 * window.confirm()'s boolean-returning contract so existing
 * `if (!(await confirmDialog(...))) return;` call sites read the same as
 * the `if (!window.confirm(...)) return;` they replace.
 */
export function confirmDialog({ title, description, confirmLabel, cancelLabel, tone } = {}) {
  return new Promise((resolve) => {
    // Only one confirm dialog can be open at a time - resolve any stale
    // pending promise as cancelled rather than leaving it dangling.
    if (confirmResolver) confirmResolver(false);
    confirmResolver = resolve;
    window.dispatchEvent(
      new CustomEvent("bmd:confirm-open", {
        detail: { title, description, confirmLabel, cancelLabel, tone },
      }),
    );
  });
}

/** Called by DialogHost when the user picks an option - not for direct use. */
export function _resolveConfirm(result) {
  if (confirmResolver) {
    confirmResolver(result);
    confirmResolver = null;
  }
  window.dispatchEvent(new CustomEvent("bmd:confirm-close"));
}

/** Error toast - reuses Layout.jsx's existing bmd:toast listener/UI. */
export function notifyError(message) {
  window.dispatchEvent(new CustomEvent("bmd:toast", { detail: { msg: message, type: "error" } }));
}

export function notifySuccess(message) {
  window.dispatchEvent(new CustomEvent("bmd:toast", { detail: { msg: message, type: "success" } }));
}
