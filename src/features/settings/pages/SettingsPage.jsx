import { ChevronRight, ChevronDown } from "lucide-react";
import PageHeader from "../../../components/common/PageHeader.jsx";
import ProfileAccountSection from "../../../components/common/ProfileAccountSection.jsx";
import { MODULES } from "../../../constants/permissions.js";
import useSettings from "../hooks/useSettings.js";
import AdminAccessSection from "../components/AdminAccessSection.jsx";
import AuditSection from "../components/AuditSection.jsx";
import BillingSection from "../components/BillingSection.jsx";
import RolesSection from "../components/RolesSection.jsx";

export default function SettingsPage() {
  const {
    permissions,
    visibleGroups,
    activeTab,
    openGroups,
    toggleGroup,
    handleTabSelect,
  } = useSettings();

  return (
    <div className="p-3 sm:p-5 w-full min-h-screen bg-gray-100">
      <PageHeader title="Settings" subtitle="Account access, content management, and billing" />

      <div className="flex flex-col lg:flex-row gap-5">
        <nav className="lg:w-56 shrink-0 bg-white rounded-xl shadow-sm overflow-hidden self-start border border-gray-100">
          {visibleGroups.map((group, gi) => {
            const isOpen = !!openGroups[group.id];
            return (
              <div key={group.id} className={gi > 0 ? "border-t border-gray-100" : ""}>
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider hover:bg-gray-50 transition-colors"
                >
                  <span>{group.label}</span>
                  {isOpen ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                </button>

                {isOpen && (
                  <div className="border-t border-gray-50">
                    {group.items.map((tab) => {
                      const Icon = tab.icon;
                      const active = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => handleTabSelect(tab.id, group.id)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors text-left border-l-4 ${
                            active
                              ? "bg-teal-50 text-teal-700 border-l-teal-600"
                              : "text-gray-600 hover:bg-gray-50 border-l-transparent"
                          }`}
                        >
                          <Icon size={15} className={`shrink-0 ${active ? "text-teal-600" : "text-gray-400"}`} />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="flex-1 min-w-0">
          {activeTab === "account" && <ProfileAccountSection />}
          {activeTab === "roles" && permissions[MODULES.ROLES_PERMISSIONS] && <RolesSection />}
          {activeTab === "admin_access" && permissions[MODULES.ROLES_PERMISSIONS] && <AdminAccessSection />}
          {activeTab === "audit" && permissions[MODULES.AUDIT_LOG] && <AuditSection />}
          {activeTab === "billing" && permissions[MODULES.SYSTEM_CONFIG] && <BillingSection />}
        </div>
      </div>
    </div>
  );
}
