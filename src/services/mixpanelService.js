import mixpanel from "mixpanel-browser";

// Optional, not a hard dependency - if VITE_MIXPANEL_TOKEN isn't set (no
// Mixpanel project provisioned yet), every call here is a silent no-op
// rather than the app breaking on a missing config value.
const TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN;

let initialized = false;

export function initMixpanel() {
  if (initialized || !TOKEN) return;
  initialized = true;
  mixpanel.init(TOKEN, { track_pageview: false, persistence: "localStorage" });
}

function track(eventName, properties) {
  if (!initialized) return;
  try {
    mixpanel.track(eventName, properties);
  } catch {
    // Analytics must never disrupt the calling flow.
  }
}

// This batch's one admin-side event: tailor application approval has no
// natural tailor/customer-facing fire point since it's an admin action,
// so it's fired here rather than from a mobile app.
export function trackTailorApplicationApproved(properties) {
  track("tailor_application_approved", properties);
}
