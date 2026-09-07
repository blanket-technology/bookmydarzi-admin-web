import api from "../../../services/api.js";

// Support-agent quick actions, triggered from the chat console's order
// context panel. All three hit real, confirmed backend routes:
//   GET   /orders/{id}                       - order detail (owner/tailor/admin)
//   PATCH /admin/orders/{id}/reschedule-pickup - move an already-scheduled pickup
//   PATCH /admin/orders/{id}/measurement       - attach/update order measurements
// EMPLOYEE-role accounts (which support agents hold) are allowed on all
// three per _require_admin_orders / get_order's admin-role branch.

export async function getOrderForAgent(orderId) {
  const response = await api.get(`/orders/${orderId}`);
  return response.data;
}

export async function rescheduleOrderPickup(orderId, { scheduledPickupAt, pickupTimeSlot, reason }) {
  const response = await api.patch(`/admin/orders/${orderId}/reschedule-pickup`, {
    scheduled_pickup_at: scheduledPickupAt,
    pickup_time_slot: pickupTimeSlot || null,
    reason: reason || null,
  });
  return response.data;
}

export async function updateOrderMeasurement(orderId, data) {
  const response = await api.patch(`/admin/orders/${orderId}/measurement`, data);
  return response.data;
}
