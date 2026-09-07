export function formatCount(n) {
  return (n ?? 0).toLocaleString("en-IN");
}

export function formatRupee(n) {
  return `₹${formatCount(n)}`;
}

export function getActiveUserPercent(users) {
  if (!users?.total) return 0;
  return Math.round((users.active / users.total) * 100);
}
