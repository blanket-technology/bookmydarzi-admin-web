import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Loader2, Pencil, Check, X, Camera, Mail, Phone, ShieldCheck, CalendarDays, UserCircle2 } from "lucide-react";
import { profileQueryKey } from "../../services/queryKeys.js";
import { fetchUserProfile, updateUserProfile, uploadProfilePhoto } from "../../features/auth/services/authService.js";
import { extractErrorMessage } from "../../utils/formatters.js";
import ForgotPasswordModal from "./ForgotPasswordModal";
import ChangeEmailModal from "./ChangeEmailModal.jsx";
import ChangeMobileModal from "./ChangeMobileModal.jsx";

function SectionCard({ title, subtitle, action, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {(title || subtitle || action) && (
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-base font-bold text-gray-800">{title}</h2>}
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, action, icon: Icon }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b last:border-0 border-gray-50">
      <span className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide shrink-0">
        {Icon && <Icon size={14} className="text-gray-400" />}
        {label}
      </span>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-semibold text-gray-800 truncate">{value || "-"}</span>
        {action}
      </div>
    </div>
  );
}

function ChangeLink({ onClick, label = "Change" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 text-[11px] font-bold text-teal-700 hover:text-teal-800 border border-teal-200 hover:border-teal-300 rounded-md px-2 py-0.5"
    >
      {label}
    </button>
  );
}

/**
 * Shared "My Account" content - own account details + password change.
 * Used both as a tab inside SettingsPage and as the standalone Profile page
 * (Bridge/employee role) so the two never drift out of sync.
 */
export default function ProfileAccountSection() {
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "" });
  const [saveError, setSaveError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const refreshProfile = () => queryClient.invalidateQueries({ queryKey: profileQueryKey() });

  const photoMutation = useMutation({
    mutationFn: uploadProfilePhoto,
    onSuccess: (res) => {
      // Optimistically update the cached profile's image, then refetch for the
      // authoritative value (handles ImageKit vs local-disk URL resolution).
      const url = res?.profile_image_url;
      if (url) {
        queryClient.setQueryData(profileQueryKey(), (prev) =>
          prev ? { ...prev, ProfileImageUrl: url } : prev,
        );
      }
      queryClient.invalidateQueries({ queryKey: profileQueryKey() });
      setPhotoError("");
    },
    onError: (err) => setPhotoError(extractErrorMessage(err, "Couldn't upload photo.")),
  });

  const onPickPhoto = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    if (!/^image\//.test(file.type)) { setPhotoError("Please choose an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setPhotoError("Image must be 5 MB or smaller."); return; }
    setPhotoError("");
    photoMutation.mutate(file);
  };

  const { data: profile, isLoading: loading } = useQuery({
    queryKey: profileQueryKey(),
    queryFn: fetchUserProfile,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });

  const saveMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (updated) => {
      // Backend returns the fresh profile - prime the cache so the UI updates
      // immediately, then invalidate to stay in sync with any server-side
      // normalisation.
      if (updated) queryClient.setQueryData(profileQueryKey(), updated);
      queryClient.invalidateQueries({ queryKey: profileQueryKey() });
      setEditing(false);
      setSaveError("");
    },
    onError: (err) => setSaveError(extractErrorMessage(err, "Couldn't save changes.")),
  });

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-teal-600" size={28} /></div>;

  const fullName = [profile?.FirstName, profile?.LastName].filter(Boolean).join(" ") || "-";
  const joined = profile?.CreatedAt ? new Date(profile.CreatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "-";

  const startEdit = () => {
    setForm({ first_name: profile?.FirstName || "", last_name: profile?.LastName || "" });
    setSaveError("");
    setEditing(true);
  };
  const cancelEdit = () => { setEditing(false); setSaveError(""); };
  const submitEdit = (e) => {
    e.preventDefault();
    if (!form.first_name.trim()) { setSaveError("First name is required."); return; }
    saveMutation.mutate({ first_name: form.first_name.trim(), last_name: form.last_name.trim() });
  };

  const editHeaderBtn = !editing ? (
    <button
      onClick={startEdit}
      className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800"
    >
      <Pencil size={13} /> Edit
    </button>
  ) : null;

  // Email/mobile changes need OTP + password only when the account has a real
  // email set (a pure-mobile or OAuth account may not). Best-effort heuristic.
  const requiresPassword = Boolean(profile?.Email);

  const initials =
    [profile?.FirstName, profile?.LastName]
      .filter(Boolean)
      .map((n) => n[0]?.toUpperCase())
      .join("") || (profile?.Email?.[0]?.toUpperCase() ?? "U");

  return (
    <div className="space-y-5">
      {showPwdModal && <ForgotPasswordModal userEmail={profile?.Email || ""} onClose={() => setShowPwdModal(false)} />}
      {showEmailModal && (
        <ChangeEmailModal
          currentEmail={profile?.Email}
          requiresPassword={requiresPassword}
          onClose={() => setShowEmailModal(false)}
          onChanged={refreshProfile}
        />
      )}
      {showMobileModal && (
        <ChangeMobileModal
          currentMobile={profile?.Mobile}
          requiresPassword={requiresPassword}
          onClose={() => setShowMobileModal(false)}
          onChanged={refreshProfile}
        />
      )}

      {/* ── Profile hero: compact banner + avatar (photo upload) + identity ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-teal-700 via-teal-600 to-teal-800" />
        <div className="px-6 pb-5">
          {/* Avatar + identity sit on one baseline, overlapping the banner. */}
          <div className="flex items-center gap-4 -mt-10">
            {/* Avatar with camera-edit overlay */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-md ring-1 ring-black/5">
                {profile?.ProfileImageUrl ? (
                  <img
                    src={profile.ProfileImageUrl}
                    alt="Profile"
                    className="w-full h-full rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-xl bg-teal-50 flex items-center justify-center text-xl font-bold text-teal-700">
                    {initials}
                  </div>
                )}
                {photoMutation.isPending && (
                  <div className="absolute inset-1 rounded-xl bg-black/40 flex items-center justify-center">
                    <Loader2 size={20} className="animate-spin text-white" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={photoMutation.isPending}
                title="Change photo"
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-teal-700 hover:bg-teal-800 text-white flex items-center justify-center shadow-md border-2 border-white disabled:opacity-60"
              >
                <Camera size={13} />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPickPhoto} />
            </div>

            {/* Identity - aligned to the bottom of the avatar so name sits just
                below the banner edge, badges beneath it. */}
            <div className="min-w-0 pt-9">
              <h1 className="text-lg font-bold text-gray-800 truncate leading-tight">{fullName}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                {profile?.Role && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 ring-1 ring-teal-200">
                    <ShieldCheck size={10} /> {profile.Role}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${profile?.IsActive ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-rose-50 text-rose-600 ring-1 ring-rose-200"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${profile?.IsActive ? "bg-emerald-500" : "bg-rose-500"}`} />
                  {profile?.IsActive ? "Active" : "Inactive"}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-gray-400">
                  <CalendarDays size={11} /> Member since {joined}
                </span>
              </div>
            </div>
          </div>
          {photoError && (
            <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">{photoError}</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <SectionCard title="Profile Information" subtitle="Your account details" action={editHeaderBtn}>
          {/* Name: inline-editable. Everything else stays visible in both modes;
              Email/Mobile carry their own OTP-verified "Change" action. */}
          {editing ? (
            <form onSubmit={submitEdit} className="pb-1">
              {saveError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs mb-3">{saveError}</div>
              )}
              <div className="grid grid-cols-2 gap-3 mb-1">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">First Name <span className="text-red-500">*</span></label>
                  <input
                    autoFocus
                    value={form.first_name}
                    onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 text-sm outline-none focus:border-teal-400"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Last Name</label>
                  <input
                    value={form.last_name}
                    onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 text-sm outline-none focus:border-teal-400"
                    placeholder="Last name"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border-2 border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50"
                >
                  <X size={13} /> Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold disabled:opacity-60"
                >
                  {saveMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  Save Name
                </button>
              </div>
            </form>
          ) : (
            <InfoRow label="Full Name" value={fullName} />
          )}

          {/* These rows are always shown - editing name never hides them. */}
          <div className={editing ? "mt-4 pt-3 border-t border-gray-100" : ""}>
            <InfoRow
              label="Email"
              icon={Mail}
              value={profile?.Email}
              action={<ChangeLink onClick={() => setShowEmailModal(true)} label={profile?.Email ? "Change" : "Add"} />}
            />
            <InfoRow
              label="Mobile"
              icon={Phone}
              value={profile?.Mobile}
              action={<ChangeLink onClick={() => setShowMobileModal(true)} label={profile?.Mobile ? "Change" : "Add"} />}
            />
            <InfoRow label="Role" icon={UserCircle2} value={profile?.Role} />
            <InfoRow label="Account Status" icon={ShieldCheck} value={profile?.IsActive ? "Active" : "Inactive"} />
            <InfoRow label="Member Since" icon={CalendarDays} value={joined} />
          </div>
        </SectionCard>

        <SectionCard title="Security" subtitle="Manage your login credentials">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">Password</p>
              <p className="text-xs text-gray-500 mt-0.5">Change your account password via OTP verification</p>
            </div>
            <button
              onClick={() => setShowPwdModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl transition-colors shrink-0"
            >
              <KeyRound size={15} /> Change Password
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
