import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CreditCard,
  FileText,
  Scissors,
  ShieldCheck,
  RotateCcw,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  ArrowLeft,
  Briefcase,
  MapPin,
  Wand2,
  ChevronDown,
} from "lucide-react";
import { InputField } from "../../../components/common/FormFields.jsx";
import SectionHeader from "../../../components/common/SectionHeader.jsx";
import { KycCard, DocModal } from "../../../components/common/KycUpload.jsx";
import { generatePassword } from "../../users/utils/userUtils.js";
import useAddTailor from "../hooks/useAddTailor.js";

export default function AddTailorPage() {
  const navigate = useNavigate();
  // Professional Details is genuinely optional (the section's own subtitle
  // says so) but was rendered as 4 equally-prominent fields every time,
  // making the "just create the login" path feel like a long form.
  // Collapsed by default - the fast path (Account Details -> KYC -> Create)
  // stays uncluttered, and anyone who wants to fill it in up front still can
  // with one click, same fields, no functionality removed.
  const [showProfessionalDetails, setShowProfessionalDetails] = useState(false);
  const {
    form,
    errors,
    showErrors,
    showPassword,
    kyc,
    viewing,
    status,
    msg,
    loading,
    kycCount,
    onChange,
    setKyc,
    setViewing,
    setShowPassword,
    setStatus,
    reset,
    submit,
  } = useAddTailor();

  return (
    <>
      {viewing && <DocModal file={viewing} onClose={() => setViewing(null)} />}

      <div className="p-3 sm:p-5 w-full min-h-screen bg-gray-100 flex flex-col">
      <div className="w-full flex-1 flex flex-col bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header - same dark teal, same icon-watermark pattern, same
            back-button treatment as AddBridgePage.jsx so every "Add {Role}"
            screen reads as one consistent family. */}
        <div className="relative bg-[#025e5e] px-8 py-6 overflow-hidden">
          <Scissors size={140} className="absolute -right-8 -top-8 text-white opacity-[0.06] rotate-12" />
          <div className="relative z-10">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-teal-100 hover:text-white text-xs font-semibold mb-3 transition-colors"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-white/15 rounded-2xl flex items-center justify-center shrink-0">
                <UserPlus size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white leading-tight">Register New Tailor</h2>
                <p className="text-teal-100 text-xs mt-1">Create a tailor account with profile and KYC documents</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-8 py-7 space-y-8">
            {status && (
              <div
                className={`rounded-xl px-4 py-3.5 text-sm font-semibold flex items-start gap-3 border-2 ${
                  status === "success"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : status === "partial"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-red-50 text-red-800 border-red-200"
                }`}
              >
                {status === "success" ? (
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                ) : status === "partial" ? (
                  <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                ) : (
                  <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                )}
                <span className="flex-1">{msg}</span>
                <button type="button" onClick={() => setStatus(null)} className="text-gray-400 hover:text-gray-600 shrink-0">
                  <X size={16} />
                </button>
              </div>
            )}

            <form onSubmit={submit} noValidate className="space-y-8">
              {/* Account Details - same section as AddBridgePage's "Account
                  Details" (name/email/mobile/password), so both screens
                  collect login credentials identically. */}
              <div className="space-y-5">
                <SectionHeader icon={User} title="Account Details" subtitle="Login credentials and contact information" />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <InputField
                    icon={User}
                    name="full_name"
                    label="Full Name"
                    placeholder="Enter full name"
                    value={form.full_name}
                    onChange={onChange}
                    error={errors.full_name}
                    touched={showErrors}
                  />
                  <InputField
                    icon={Mail}
                    name="email"
                    label="Email Address"
                    placeholder="tailor@bookmydarzi.com"
                    type="email"
                    value={form.email}
                    onChange={onChange}
                    error={errors.email}
                    touched={showErrors}
                  />
                  <InputField
                    icon={Phone}
                    name="phone"
                    label="Mobile Number"
                    placeholder="10-digit mobile number"
                    value={form.phone}
                    onChange={onChange}
                    error={errors.phone}
                    touched={showErrors}
                  />
                  <InputField
                    icon={Scissors}
                    name="specialization"
                    label="Specialization"
                    placeholder="e.g. Bridal wear, Suits"
                    value={form.specialization}
                    onChange={onChange}
                    error={errors.specialization}
                    touched={showErrors}
                  />
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="text-xs font-semibold text-gray-600 flex items-center gap-1 mb-1.5">
                      Password
                      <span className="text-gray-400 font-normal">(optional - defaults to Tailor@123)</span>
                    </label>
                    <div className="relative flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                          <Lock size={17} />
                        </span>
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={form.password}
                          onChange={onChange}
                          placeholder="Leave blank for default"
                          autoComplete="off"
                          className="w-full h-11 pl-11 pr-10 text-sm rounded-xl border-2 outline-none transition-all bg-gray-50 focus:bg-white placeholder:text-gray-400 border-gray-300 focus:border-[#006B6B]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((p) => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onChange({ target: { name: "password", value: generatePassword() } });
                          setShowPassword(true);
                        }}
                        className="shrink-0 px-3 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 text-xs font-semibold"
                        title="Generate a strong password"
                      >
                        <Wand2 size={13} /> Generate
                      </button>
                    </div>
                    {showErrors && errors.password && (
                      <p className="text-xs text-red-600 flex items-center gap-1 mt-1.5">
                        <AlertCircle size={12} className="shrink-0" /> {errors.password}
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                  Password rules: min 6 characters, at least 1 uppercase letter, at least 1 number. The tailor should change their password after first login.
                </p>
              </div>

              {/* Additional Details - genuinely optional (experience,
                  location, bio - Specialization moved into Account Details
                  above since it's actually required by validate()).
                  Collapsed by default so the fast "just create the login"
                  path isn't cluttered by fields most admins skip anyway. */}
              <div className="space-y-5">
                <button
                  type="button"
                  onClick={() => setShowProfessionalDetails((v) => !v)}
                  className="w-full flex items-center justify-between pb-4 border-b-2 border-gray-100 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center shrink-0 border border-teal-100">
                      <Briefcase size={20} className="text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-base leading-tight">Additional Details</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Optional - experience, location, bio. Can be filled in later.</p>
                    </div>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`text-gray-400 shrink-0 transition-transform ${showProfessionalDetails ? "rotate-180" : ""}`}
                  />
                </button>

                {showProfessionalDetails && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <InputField
                        icon={Briefcase}
                        name="experience"
                        label="Experience (years)"
                        placeholder="e.g. 5"
                        type="number"
                        value={form.experience}
                        onChange={onChange}
                        required={false}
                        touched={false}
                      />
                      <InputField
                        icon={MapPin}
                        name="location"
                        label="Service Location"
                        placeholder="e.g. Sector 63, Noida"
                        value={form.location}
                        onChange={onChange}
                        required={false}
                        touched={false}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-600">Bio</label>
                      <textarea
                        name="bio"
                        rows={2}
                        value={form.bio}
                        onChange={onChange}
                        placeholder="Short professional bio"
                        className="w-full border-2 border-gray-300 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#006B6B] resize-none bg-gray-50 focus:bg-white transition-colors"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* KYC Section - identical KycCard/DocModal used on the tailor
                  detail page's Documents tab, so upload/preview UI is
                  pixel-identical whether adding or later editing. */}
              <div className="space-y-5">
                <SectionHeader
                  icon={ShieldCheck}
                  title="KYC Verification"
                  subtitle="Optional - can also be uploaded later from the tailor's profile"
                  badge={
                    <span className="text-xs font-bold px-3 py-1 rounded-full border border-amber-200 text-amber-600 bg-amber-50">
                      {kycCount}/3 uploaded
                    </span>
                  }
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <KycCard
                    label="Aadhar Card"
                    icon={CreditCard}
                    docKey="aadhar"
                    pendingFile={kyc.aadhar}
                    existingUrl={null}
                    editMode
                    onPickFile={(k, f) => setKyc((p) => ({ ...p, [k]: f }))}
                    onView={(k) => kyc[k] && setViewing(kyc[k])}
                    onClearPending={(k) => setKyc((p) => ({ ...p, [k]: null }))}
                  />
                  <KycCard
                    label="PAN Card"
                    icon={FileText}
                    docKey="pan_card"
                    pendingFile={kyc.pan_card}
                    existingUrl={null}
                    editMode
                    onPickFile={(k, f) => setKyc((p) => ({ ...p, [k]: f }))}
                    onView={(k) => kyc[k] && setViewing(kyc[k])}
                    onClearPending={(k) => setKyc((p) => ({ ...p, [k]: null }))}
                  />
                  <KycCard
                    label="Other Document"
                    icon={FileText}
                    docKey="other"
                    pendingFile={kyc.other}
                    existingUrl={null}
                    editMode
                    onPickFile={(k, f) => setKyc((p) => ({ ...p, [k]: f }))}
                    onView={(k) => kyc[k] && setViewing(kyc[k])}
                    onClearPending={(k) => setKyc((p) => ({ ...p, [k]: null }))}
                  />
                </div>

                <div className="flex items-center gap-2 bg-[#FFF9E6] border border-[#FFEBA6] rounded-xl px-4 py-2.5">
                  <AlertCircle size={15} className="text-[#D99B00] shrink-0" />
                  <p className="text-xs text-[#805B00] font-medium">
                    Accepted formats: JPG, PNG, PDF &nbsp;·&nbsp; Max 5 MB per file
                  </p>
                </div>

                {/* A tailor is never auto-verified on creation, even with
                    all 3 documents attached here - verification is always a
                    separate, deliberate admin action from the tailor's
                    profile page (same rule the edit path enforces: is_approved
                    can only flip false->true once all 3 KYC docs exist, and
                    even then it's never automatic). Spelling that out here
                    means the admin isn't surprised the new tailor shows
                    "Pending Verification" immediately after creation. */}
                <div
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 border ${
                    kycCount === 3
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-gray-50 border-gray-200 text-gray-600"
                  }`}
                >
                  <ShieldCheck size={15} className={`shrink-0 ${kycCount === 3 ? "text-emerald-500" : "text-gray-400"}`} />
                  <p className="text-xs font-medium">
                    {kycCount === 3
                      ? "All 3 documents attached - this tailor is ready to be verified from their profile page after creation."
                      : `${kycCount}/3 documents attached - this tailor will be created as Pending Verification. Upload all 3 documents before they can be verified.`}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={reset}
                  disabled={loading}
                  className="flex-1 h-11 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <RotateCcw size={15} /> Reset
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-11 px-8 bg-[#007A7A] hover:bg-[#006B6B] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25 transition-all"
                >
                  <UserPlus size={16} />
                  {loading ? "Creating…" : "Create Tailor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
