import { useEffect, useRef } from "react";

// The four dashboards (Admin/Superadmin/Employee/Tailor) previously only
// ever fetched once on mount - adminWsService.js already dispatches
// BILLING_UPDATED/HOME_UPDATED/NEW_ORDER/ORDER_STATUS_UPDATED as
// window CustomEvents (mirrors useOrderList.js's own LIVE_ORDER_EVENTS
// pattern, which the order list already uses), but nothing on the
// dashboard side ever listened - an admin staring at the dashboard while
// an order/broadcast changed elsewhere saw stale numbers until a full page
// reload. This is the shared "listen + call the store's fetchers" wiring
// so each dashboard variant only has to call one hook instead of
// duplicating the event-listener boilerplate four times.
//
// The refetch functions are read from a ref, updated every render but never
// used as an effect dependency - some callers (Employee/Tailor dashboards)
// pass an inline arrow (`() => fetchRoleOrders("employee")`), a fresh
// reference every render, which would otherwise tear down and re-subscribe
// the listeners on every single render instead of once.
//
// Called on any live event AND on a 30s polling backstop - same two-layer
// approach (instant-on-event + slow poll fallback) as bmdadmin's
// useDashboard.ts on mobile, in case a given change doesn't happen to
// dispatch one of the four events below (e.g. a manual admin data edit with
// no WS notification wired for it yet).
const LIVE_DASHBOARD_EVENTS = [
  "bmd:NEW_ORDER",
  "bmd:ORDER_STATUS_UPDATED",
  "bmd:BILLING_UPDATED",
  "bmd:HOME_UPDATED",
];

const POLL_INTERVAL_MS = 30_000;

export function useLiveDashboardRefresh(...refetchFns) {
  const fnsRef = useRef(refetchFns);

  // Sync the ref in an effect (not during render, which React's rules
  // disallow mutating refs in) - runs after every render where the caller
  // passed new function references, but never causes the subscription
  // effect below to re-run.
  useEffect(() => {
    fnsRef.current = refetchFns;
  });

  useEffect(() => {
    const runAll = () => fnsRef.current.filter(Boolean).forEach((fn) => fn());

    LIVE_DASHBOARD_EVENTS.forEach((e) => window.addEventListener(e, runAll));
    const pollTimer = setInterval(runAll, POLL_INTERVAL_MS);

    return () => {
      LIVE_DASHBOARD_EVENTS.forEach((e) => window.removeEventListener(e, runAll));
      clearInterval(pollTimer);
    };
  }, []);
}
