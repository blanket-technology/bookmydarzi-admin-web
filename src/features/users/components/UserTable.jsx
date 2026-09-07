import { useNavigate } from "react-router-dom";
import { Check, Mail, Phone } from "lucide-react";
import DataTable from "../../../components/common/DataTable.jsx";
import { formatEntityId, formatDate } from "../../../utils/formatters.js";
import { ROLE_BADGE, ROLE_LABEL, USER_TABLE_COLUMNS } from "../constants/userConstants.js";

export default function UserTable({
  users,
  loading,
  search,
  roleFilter,
  activeRoleLabel,
  page,
  total,
  limit,
  onPageChange,
  onLimitChange,
}) {
  const navigate = useNavigate();

  return (
    <DataTable
      columns={USER_TABLE_COLUMNS}
      rows={users}
      rowKey={(u) => u.Id}
      loading={loading}
      emptyMessage={`No accounts found${roleFilter ? ` with role "${activeRoleLabel}"` : ""}${search ? ` for "${search}"` : ""}.`}
      pagination={{ page, total, limit, onPageChange, onLimitChange }}
      renderRow={(u) => (
        <tr
          key={u.Id}
          onClick={() => navigate(`/customers/${u.Id}`, { state: { userId: u.Id } })}
          className="hover:bg-teal-50/40 transition-colors text-gray-700 cursor-pointer"
        >
          <td className="px-4 py-2.5 font-mono font-semibold text-teal-700 whitespace-nowrap">
            {formatEntityId(u.Role?.toLowerCase(), u.Id, u.UserCode)}
          </td>
          <td className="px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 font-bold text-xs shrink-0">
                {(u.FullName || u.Email || "?")[0].toUpperCase()}
              </div>
              <span className="font-semibold whitespace-nowrap">{u.FullName || "-"}</span>
              {!u.IsActive && (
                <span title="Account deactivated" className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
              )}
            </div>
          </td>
          <td className="px-4 py-2.5 text-gray-500">{u.Email || "-"}</td>
          <td className="px-4 py-2.5 text-gray-500 font-mono">{u.Mobile || "-"}</td>
          <td className="px-4 py-2.5">
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${ROLE_BADGE[u.Role?.toLowerCase()] || "bg-gray-100 text-gray-600"}`}>
              {ROLE_LABEL[u.Role?.toLowerCase()] ?? u.Role ?? "-"}
            </span>
          </td>
          <td className="px-4 py-2.5">
            <div className="flex items-center justify-center gap-1.5">
              <span
                title={u.IsEmailVerified ? "Email verified" : "Email not verified"}
                className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                  u.IsEmailVerified ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"
                }`}
              >
                <Mail size={11} />
                {u.IsEmailVerified && <Check size={10} />}
              </span>
              <span
                title={u.IsMobileVerified ? "Mobile verified" : "Mobile not verified"}
                className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                  u.IsMobileVerified ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"
                }`}
              >
                <Phone size={11} />
                {u.IsMobileVerified && <Check size={10} />}
              </span>
            </div>
          </td>
          <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">
            {u.CreatedAt ? formatDate(u.CreatedAt) : "-"}
          </td>
        </tr>
      )}
    />
  );
}
