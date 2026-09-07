export const TICKET_STATUSES = ["open", "in_progress", "resolved", "closed"];

export const TICKET_STATUS_LABEL = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

export const CHAT_STATUS_LABEL = {
  ai_handling: "AI Handling",
  open: "Open",
  pending_human: "Awaiting Agent",
  assigned: "Assigned",
  resolved: "Resolved",
  closed: "Closed",
};

export const FAQ_CATEGORIES = ["general", "order", "payment", "delivery", "account"];

export const FAQ_CAT_BADGE = {
  order: "bg-blue-100 text-blue-700",
  payment: "bg-amber-100 text-amber-700",
  delivery: "bg-teal-100 text-teal-700",
  account: "bg-indigo-100 text-indigo-700",
  general: "bg-gray-100 text-gray-600",
};

export const INBOX_FETCH_LIMIT = 100;
export const DEFAULT_TICKET_PAGE = 1;
export const DEFAULT_TICKET_LIMIT = 25;
export const TICKET_SEARCH_DEBOUNCE_MS = 400;
