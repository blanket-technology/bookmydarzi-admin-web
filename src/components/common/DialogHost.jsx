import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { ConfirmModal } from "./EntityWorkspace";
import { _resolveConfirm } from "../../services/dialogService";

/**
 * Renders the single active confirm dialog triggered via dialogService's
 * confirmDialog() - mount once, near the app root (Layout.jsx). Stores/hooks
 * that have no component tree of their own can still show the app's real
 * confirm modal instead of window.confirm() by calling confirmDialog().
 */
export default function DialogHost() {
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    const onOpen = (e) => setDialog(e.detail);
    const onClose = () => setDialog(null);
    window.addEventListener("bmd:confirm-open", onOpen);
    window.addEventListener("bmd:confirm-close", onClose);
    return () => {
      window.removeEventListener("bmd:confirm-open", onOpen);
      window.removeEventListener("bmd:confirm-close", onClose);
    };
  }, []);

  return (
    <ConfirmModal
      open={!!dialog}
      icon={AlertTriangle}
      title={dialog?.title ?? "Are you sure?"}
      description={dialog?.description}
      confirmLabel={dialog?.confirmLabel ?? "Confirm"}
      cancelLabel={dialog?.cancelLabel ?? "Cancel"}
      tone={dialog?.tone ?? "danger"}
      onConfirm={() => _resolveConfirm(true)}
      onCancel={() => _resolveConfirm(false)}
    />
  );
}
