import { useNavigate } from "react-router-dom";
import { Check, Mail, Phone, ChevronRight, Users as UsersIcon } from "lucide-react";
import DataTable from "../../../components/common/DataTable.jsx";
import { formatEntityId, formatDate } from "../../../utils/formatters.js";
import { ROLE_BADGE, ROLE_LABEL, USER_TABLE_COLUMNS } from "../constants/userConstants.js";

const AVATAR_TONES = [
  "bg-teal-100 text-teal-700",
  "bg-blue-100 text-blue-700",
  "bg-indigo-100 text-indigo-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-emerald-100 text-emerald-700",
];

// Deterministic per-user avatar tint so the same person always gets the same
// color across renders/sessions, instead of every row defaulting to teal.
function avatarTone(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

function VerificationPill({ icon: Icon, verified, label }) {
  return (
    <span
      title={`${label} ${verified ? "verified" : "not verified"}`}
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
        verified ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"
      }`}
    >
      <Icon size={11} />
      {verified && <Check size={10} strokeWidth={3} />}
    </span>
  );
}

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
      emptyIcon={UsersIcon}
      emptyMessage={`No accounts found${roleFilter ? ` with role "${activeRoleLabel}"` : ""}${search ? ` for "${search}"` : ""}.`}
      pagination={{ page, total, limit, onPageChange, onLimitChange }}
      renderRow={(u) => {
        const displayName = u.FullName || "Unnamed";
        const initials = (u.FullName || u.Email || "U").trim()[0].toUpperCase();
        const tone = avatarTone(String(u.Id ?? u.Email ?? initials));
        return (
          <tr
            key={u.Id}
            onClick={() => navigate(`/customers/${u.Id}`, { state: { userId: u.Id } })}
            className="group hover:bg-teal-50/40 transition-colors text-gray-700 cursor-pointer"
          >
            <td className="px-4 py-3 font-mono text-[11px] font-semibold text-gray-400 whitespace-nowrap">
              {formatEntityId(u.Role?.toLowerCase(), u.Id, u.UserCode)}
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className={`relative w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${tone}`}>
                  {initials}
                  {!u.IsActive && (
                    <span
                      title="Account deactivated"
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-rose-500 ring-2 ring-white"
                    />
                  )}
                </div>
                <span className="font-semibold text-gray-800 whitespace-nowrap">{displayName}</span>
              </div>
            </td>
            <td className="px-4 py-3 text-gray-500">{u.Email || <span className="text-gray-400">N/A</span>}</td>
            <td className="px-4 py-3 text-gray-500 font-mono text-[13px]">{u.Mobile || <span className="text-gray-400 font-sans">N/A</span>}</td>
            <td className="px-4 py-3">
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${ROLE_BADGE[u.Role?.toLowerCase()] || "bg-gray-100 text-gray-600"}`}>
                {ROLE_LABEL[u.Role?.toLowerCase()] ?? u.Role ?? "N/A"}
              </span>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center justify-center gap-1">
                <VerificationPill icon={Mail} verified={u.IsEmailVerified} label="Email" />
                <VerificationPill icon={Phone} verified={u.IsMobileVerified} label="Mobile" />
              </div>
            </td>
            <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-[13px]">
              {u.CreatedAt ? formatDate(u.CreatedAt) : "N/A"}
            </td>
            <td className="px-2 py-3 text-right w-6">
              <ChevronRight size={15} className="text-gray-300 group-hover:text-teal-500 transition-colors" />
            </td>
          </tr>
        );
      }}
    />
  );
}
