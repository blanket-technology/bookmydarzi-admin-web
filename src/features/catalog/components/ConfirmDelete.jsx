import { Trash2 } from "lucide-react";
import { ConfirmModal } from "../../../components/common/EntityWorkspace.jsx";

export default function ConfirmDelete({ message, onConfirm, onClose, loading }) {
  return (
    <ConfirmModal
      open
      icon={Trash2}
      title="Confirm Delete"
      description={message}
      confirmLabel={loading ? "Deleting…" : "Delete"}
      cancelLabel="Cancel"
      tone="danger"
      onConfirm={onConfirm}
      onCancel={onClose}
    />
  );
}
