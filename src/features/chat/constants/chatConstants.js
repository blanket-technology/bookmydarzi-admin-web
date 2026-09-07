export const STATUS_OPTIONS = ["all", "pending_human", "ai_handling", "assigned", "open", "resolved", "closed"];

export const STATUS_LABEL = {
  ai_handling: "AI Handling",
  open: "Open",
  pending_human: "Awaiting Agent",
  assigned: "Assigned",
  resolved: "Resolved",
  closed: "Closed",
};

export const STATUS_COLOR = {
  ai_handling: "bg-purple-100 text-purple-700",
  open: "bg-blue-100 text-blue-700",
  pending_human: "bg-amber-100 text-amber-700",
  assigned: "bg-teal-100 text-teal-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-500",
};

export const SENDER_LABELS = {
  customer: "Customer",
  agent: "Agent",
  ai: "AI",
  system: "System",
};

export const SESSIONS_FETCH_LIMIT = 100;
export const SESSION_POLL_INTERVAL_MS = 8000;
export const MESSAGES_FETCH_LIMIT = 100;

export const DEFAULT_FILTER_STATUS = "pending_human";
