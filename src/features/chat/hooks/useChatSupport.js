import { useEffect, useRef, useState } from "react";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { confirmDialog, notifyError } from "../../../services/dialogService.js";
import { getStoredUser } from "../../../store/authStore.jsx";
import { SESSION_POLL_INTERVAL_MS, STATUS_OPTIONS } from "../constants/chatConstants.js";
import { filterSessions } from "../utils/chatUtils.js";
import { useChatStore } from "../store/chatStore.js";

export default function useChatSupport() {
  const sessions = useChatStore((s) => s.sessions);
  const analytics = useChatStore((s) => s.analytics);
  const filterStatus = useChatStore((s) => s.filterStatus);
  const fetchError = useChatStore((s) => s.fetchError);
  const agentOnline = useChatStore((s) => s.agentOnline);
  const agentStatusLoading = useChatStore((s) => s.agentStatusLoading);
  const setFilterStatus = useChatStore((s) => s.setFilterStatus);
  const fetchSessions = useChatStore((s) => s.fetchSessions);
  const fetchAnalytics = useChatStore((s) => s.fetchAnalytics);
  const fetchAgentStatus = useChatStore((s) => s.fetchAgentStatus);
  const toggleAgentOnlineStore = useChatStore((s) => s.toggleAgentOnline);
  const resolveSession = useChatStore((s) => s.resolveSession);

  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showConversation, setShowConversation] = useState(false);
  const [agentToggling, setAgentToggling] = useState(false);
  const pollRef = useRef(null);
  const currentUser = getStoredUser();

  // Fetch-on-mount/filter-change plus a polling interval for live session
  // updates; setLoading brackets the initial batch fetch, it isn't derived
  // state.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchSessions(), fetchAnalytics(), fetchAgentStatus()]).finally(() => setLoading(false));
    pollRef.current = setInterval(fetchSessions, SESSION_POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [fetchSessions, fetchAnalytics, fetchAgentStatus, filterStatus]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSessionSelect = (session) => {
    setActiveSession(session);
    setShowConversation(true);
  };

  const handleBack = () => {
    setShowConversation(false);
    setActiveSession(null);
  };

  const toggleAgentOnline = async () => {
    if (!currentUser?.Id || agentToggling) return;
    setAgentToggling(true);
    try {
      await toggleAgentOnlineStore(currentUser.Id, agentOnline);
    } catch (err) {
      notifyError(extractErrorMessage(err, "Could not update your status."));
    } finally {
      setAgentToggling(false);
    }
  };

  const handleResolve = async (sessionUuid) => {
    if (!(await confirmDialog({
      title: "Mark conversation as resolved?",
      description: "This closes out the conversation as resolved.",
      confirmLabel: "Yes, Resolve",
      tone: "neutral",
    }))) return;
    try {
      await resolveSession(sessionUuid);
      if (activeSession?.uuid === sessionUuid) {
        setActiveSession(null);
        setShowConversation(false);
      }
    } catch (err) {
      notifyError(extractErrorMessage(err, "Resolve failed"));
    }
  };

  const filtered = filterSessions(sessions, searchQuery);

  return {
    sessions,
    activeSession,
    filterStatus,
    loading,
    analytics,
    searchQuery,
    showConversation,
    fetchError,
    agentOnline,
    agentStatusLoading,
    agentToggling,
    filtered,
    statusOptions: STATUS_OPTIONS,
    setFilterStatus,
    setSearchQuery,
    fetchSessions,
    handleSessionSelect,
    handleBack,
    toggleAgentOnline,
    handleResolve,
  };
}
