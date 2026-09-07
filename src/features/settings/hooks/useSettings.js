import { useState } from "react";
import { getStoredPermissions } from "../../auth/store/authStore.js";
import { ACCORDION_GROUPS } from "../constants/settingsConstants.js";
import { filterVisibleGroups } from "../utils/settingsUtils.js";

export default function useSettings() {
  const permissions = getStoredPermissions();
  const visibleGroups = filterVisibleGroups(ACCORDION_GROUPS, permissions);

  const [activeTab, setActiveTab] = useState("account");
  const [openGroups, setOpenGroups] = useState({ account_group: true, billing_group: false });

  const toggleGroup = (groupId) => setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));

  const handleTabSelect = (tabId, groupId) => {
    setActiveTab(tabId);
    setOpenGroups((prev) => ({ ...prev, [groupId]: true }));
  };

  return {
    permissions,
    visibleGroups,
    activeTab,
    openGroups,
    toggleGroup,
    handleTabSelect,
  };
}
