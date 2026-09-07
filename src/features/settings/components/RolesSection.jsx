import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { getStoredUser } from "../../auth/store/authStore.js";
import { MODULES, ROLES, resolvePermissions } from "../../../constants/permissions.js";
import { SectionCard } from "./BillingSection.jsx";

const ROLE_LABELS = {
  [ROLES.SUPERADMIN]: "Super Admin",
  [ROLES.ADMIN]: "Admin",
  [ROLES.EMPLOYEE]: "Employee",
  [ROLES.TAILOR]: "Tailor",
};

const MODULE_LABELS = {
  [MODULES.DASHBOARD]: "Dashboard",
  [MODULES.REVENUE_ANALYTICS]: "Revenue Analytics",
  [MODULES.FINANCIAL_REPORTS]: "Financial Reports",
  [MODULES.PAYMENTS]: "Payments",
  [MODULES.COD_COLLECTION]: "COD Collection",
  [MODULES.USERS]: "User Management",
  [MODULES.EMPLOYEES]: "Bridge / Employees",
  [MODULES.TAILORS]: "Tailors",
  [MODULES.ORDERS]: "Orders",
  [MODULES.CMS]: "CMS",
  [MODULES.COUPONS]: "Offers & Coupons",
  [MODULES.NOTIFICATIONS]: "Notifications",
  [MODULES.CHAT_SUPPORT]: "Chat Support",
  [MODULES.SUPPORT_FAQS]: "FAQs",
  [MODULES.SUPPORT_TICKETS]: "Support Tickets",
  [MODULES.CANCELLATIONS]: "Cancellations",
  [MODULES.SERVICE_AREAS]: "Service Areas",
  [MODULES.LOOKBOOK]: "Lookbook",
  [MODULES.CATALOG]: "Catalog",
  [MODULES.AUDIT_LOG]: "Audit Log",
  [MODULES.ROLES_PERMISSIONS]: "Roles & Permissions",
  [MODULES.SYSTEM_CONFIG]: "Billing & System Config",
  [MODULES.MY_ACCOUNT]: "My Account",
};

const ALL_ROLES = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.EMPLOYEE, ROLES.TAILOR];

export default function RolesSection() {
  const myRole = getStoredUser()?.Role?.toLowerCase();

  return (
    <div className="space-y-5">
      <SectionCard title="Roles & Permissions" subtitle="What each role can access, enforced by both this UI and the backend API">
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3.5 mb-4">
          <ShieldCheck size={16} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800">
            This matrix is enforced in code on both sides - the sidebar/routes here, and the corresponding endpoint's role check on the server. It is read-only by design: a module is only ever granted to a role after confirming the backend actually authorizes that role for it.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold sticky left-0 bg-gray-50">Module</th>
                {ALL_ROLES.map((role) => (
                  <th key={role} className={`px-4 py-3 text-center font-semibold whitespace-nowrap ${role === myRole ? "text-teal-700" : ""}`}>
                    {ROLE_LABELS[role]}
                    {role === myRole && <span className="block text-[10px] font-normal text-teal-500 normal-case">(you)</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.values(MODULES).map((moduleKey, i) => (
                <tr key={moduleKey} className={`border-t border-gray-50 ${i % 2 === 1 ? "bg-gray-50/40" : ""}`}>
                  <td className="px-4 py-2.5 font-semibold text-gray-800 sticky left-0 bg-inherit">{MODULE_LABELS[moduleKey] ?? moduleKey}</td>
                  {ALL_ROLES.map((role) => {
                    const granted = Boolean(resolvePermissions(role)[moduleKey]);
                    return (
                      <td key={role} className="px-4 py-2.5 text-center">
                        {granted ? (
                          <CheckCircle2 size={16} className="inline text-emerald-500" />
                        ) : (
                          <span className="inline-block w-4 h-px bg-gray-300" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
