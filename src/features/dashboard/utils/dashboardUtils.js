import { ORDER_STATUS } from "../constants/dashboardConstants.js";

export function isToday(isoDate) {
  if (!isoDate) return false;
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function formatRecentOrderDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return (
    d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) +
    " · " +
    d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  );
}

export function computeEmployeeStats(orders) {
  let assigned = 0;
  let pickupQueue = 0;
  let deliveryQueue = 0;
  let codPending = 0;
  let todaysTasks = 0;

  for (const order of orders) {
    const status = (order.Status || "").toLowerCase();
    if (
      [ORDER_STATUS.ORDER_ACCEPTED, ORDER_STATUS.SEARCHING_TAILOR, ORDER_STATUS.BROADCASTED].includes(
        status
      )
    ) {
      assigned += 1;
    }
    if ([ORDER_STATUS.PICKUP_SCHEDULED, ORDER_STATUS.PICKUP_PENDING].includes(status)) {
      pickupQueue += 1;
      if (isToday(order.ScheduledPickupAt)) todaysTasks += 1;
    }
    if (status === ORDER_STATUS.OUT_FOR_DELIVERY) {
      deliveryQueue += 1;
      todaysTasks += 1;
    }
    if (status === ORDER_STATUS.OUT_FOR_DELIVERY && Number(order.RemainingAmount ?? 0) > 0) {
      codPending += 1;
    }
  }
  return { assigned, pickupQueue, deliveryQueue, codPending, todaysTasks };
}

export function computeTailorStats(orders) {
  let assigned = 0;
  let stitchingQueue = 0;
  let readyForDispatch = 0;
  let completedToday = 0;

  for (const order of orders) {
    const status = (order.Status || "").toLowerCase();
    if (status === ORDER_STATUS.CLOTH_RECEIVED_BY_TAILOR) {
      assigned += 1;
    } else if (
      [ORDER_STATUS.STITCHING_STARTED, ORDER_STATUS.IN_PROGRESS, ORDER_STATUS.FINAL_CHECK].includes(
        status
      )
    ) {
      stitchingQueue += 1;
    } else if (status === ORDER_STATUS.READY_FOR_DISPATCH) {
      readyForDispatch += 1;
    } else if (status === ORDER_STATUS.COMPLETED && isToday(order.UpdatedAt)) {
      completedToday += 1;
    }
  }
  return { assigned, stitchingQueue, readyForDispatch, completedToday };
}
