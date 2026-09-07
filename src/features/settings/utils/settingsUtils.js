export function formatAuditAction(action) {
  return (action || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatAuditDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  );
}

export function filterVisibleGroups(groups, permissions) {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.module === null || permissions[item.module]),
    }))
    .filter((group) => group.items.length > 0);
}

export function formatAuditRelated(log) {
  return [
    log.order_id && `Order #${log.order_id}`,
    log.tailor_id && `Tailor #${log.tailor_id}`,
    log.user_id && `User #${log.user_id}`,
    log.application_id && `App #${log.application_id}`,
  ]
    .filter(Boolean)
    .join(", ");
}
