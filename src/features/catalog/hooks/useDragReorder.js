import { useEffect, useState } from "react";
import api from "../../../services/api.js";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { notifyError } from "../../../services/dialogService.js";

/**
 * Native HTML5 drag-and-drop reordering for a card grid,
 * with optimistic local order + a single bulk persist call.
 */
export default function useDragReorder(items, getId, reorderPath, onPersisted) {
  const [order, setOrder] = useState(items);
  const [dragId, setDragId] = useState(null);
  const [armedId, setArmedId] = useState(null);

  // Syncs local optimistic order back to the upstream `items` prop whenever
  // it changes (e.g. a refetch after another admin's edit) - but never while
  // a drag is in progress, so an incoming prop update can't yank a card out
  // from under the user's cursor mid-drag.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (dragId != null) return;
    setOrder((prev) => {
      if (prev.length !== items.length) return items;
      for (let i = 0; i < items.length; i += 1) {
        if (getId(prev[i]) !== getId(items[i])) return items;
      }
      return prev;
    });
  }, [items, dragId, getId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const persist = async (newOrder) => {
    try {
      await api.post(reorderPath, {
        items: newOrder.map((it, idx) => ({ id: getId(it), display_order: idx + 1 })),
      });
      onPersisted?.(newOrder);
    } catch (err) {
      notifyError(extractErrorMessage(err, "Failed to save new order."));
      onPersisted?.(null);
    }
  };

  const cardProps = (item) => ({
    draggable: armedId === getId(item),
    onDragStart: (e) => { setDragId(getId(item)); e.dataTransfer.effectAllowed = "move"; },
    onDragOver: (e) => {
      e.preventDefault();
      const overId = getId(item);
      if (dragId == null || overId === dragId) return;
      setOrder((prev) => {
        const from = prev.findIndex((x) => getId(x) === dragId);
        const to = prev.findIndex((x) => getId(x) === overId);
        if (from === -1 || to === -1) return prev;
        const next = [...prev];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return next;
      });
    },
    onDragEnd: () => {
      const dropped = order;
      setDragId(null);
      setArmedId(null);
      const changed = dropped.some((it, i) => getId(it) !== getId(items[i]));
      if (changed) persist(dropped);
    },
  });

  const handleProps = (item) => ({
    onMouseDown: () => setArmedId(getId(item)),
    onMouseUp: () => setArmedId(null),
    onClick: (e) => e.stopPropagation(),
    title: "Drag to reorder",
    className: "cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 shrink-0",
  });

  return { order, cardProps, handleProps, isDragging: dragId != null };
}
