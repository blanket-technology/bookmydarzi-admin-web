import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
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
  ChevronDown,
} from "lucide-react";
import { InputField } from "../../../components/common/FormFields.jsx";
import SectionHeader from "../../../components/common/SectionHeader.jsx";
import { KycCard, DocModal } from "../../../components/common/KycUpload.jsx";
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
    kyc,
    viewing,
    status,
    msg,
    loading,
    kycCount,
    onChange,
    setKyc,
    setViewing,
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
                <h2 className="text-xl font-bold text-white leading-tight">Add New Tailor</h2>
                <p className="text-teal-100 text-xs mt-1">
                  Submits a tailor application for review - approve it from Tailor Applications to create the account
                </p>
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
                <SectionHeader icon={User} title="Applicant Details" subtitle="Contact information for the application" />

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
                    required={false}
                    touched={false}
                  />
                  <InputField
                    icon={MapPin}
                    name="address"
                    label="Address"
                    placeholder="Street / area"
                    value={form.address}
                    onChange={onChange}
                    required={false}
                    touched={false}
                  />
                  <InputField
                    icon={MapPin}
                    name="city"
                    label="City"
                    placeholder="e.g. Bhopal"
                    value={form.city}
                    onChange={onChange}
                    required={false}
                    touched={false}
                  />
                </div>
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
                      <p className="text-xs text-gray-400 mt-0.5">Optional - experience, state, pincode. Can be filled in later.</p>
                    </div>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`text-gray-400 shrink-0 transition-transform ${showProfessionalDetails ? "rotate-180" : ""}`}
                  />
                </button>

                {showProfessionalDetails && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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
                      name="state"
                      label="State"
                      placeholder="e.g. MP"
                      value={form.state}
                      onChange={onChange}
                      required={false}
                      touched={false}
                    />
                    <InputField
                      icon={MapPin}
                      name="pincode"
                      label="Pincode"
                      placeholder="e.g. 462001"
                      value={form.pincode}
                      onChange={onChange}
                      required={false}
                      touched={false}
                    />
                  </div>
                )}
              </div>

              {/* KYC Section - identical KycCard/DocModal used on the tailor
                  detail page's Documents tab, so upload/preview UI is
                  pixel-identical whether adding or later editing. */}
              <div className="space-y-5">
                <SectionHeader
                  icon={ShieldCheck}
                  title="KYC Documents"
                  subtitle="Aadhaar (both sides) and PAN are required before this application can be approved - can also be added later from the application detail page"
                  badge={
                    <span className="text-xs font-bold px-3 py-1 rounded-full border border-amber-200 text-amber-600 bg-amber-50">
                      {kycCount}/3 uploaded
                    </span>
                  }
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <KycCard
                    label="Aadhaar Front"
                    icon={CreditCard}
                    docKey="aadhaar_front"
                    pendingFile={kyc.aadhaar_front}
                    existingUrl={null}
                    editMode
                    onPickFile={(k, f) => setKyc((p) => ({ ...p, [k]: f }))}
                    onView={(k) => kyc[k] && setViewing(kyc[k])}
                    onClearPending={(k) => setKyc((p) => ({ ...p, [k]: null }))}
                  />
                  <KycCard
                    label="Aadhaar Back"
                    icon={CreditCard}
                    docKey="aadhaar_back"
                    pendingFile={kyc.aadhaar_back}
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
                </div>

                <div className="flex items-center gap-2 bg-[#FFF9E6] border border-[#FFEBA6] rounded-xl px-4 py-2.5">
                  <AlertCircle size={15} className="text-[#D99B00] shrink-0" />
                  <p className="text-xs text-[#805B00] font-medium">
                    Accepted formats: JPG, PNG, PDF &nbsp;·&nbsp; Max 8 MB per file
                  </p>
                </div>

                {/* Submitting creates a PENDING TailorApplication only - no
                    account exists yet. Approving it (Tailor Applications tab)
                    is what actually creates the User+Tailor rows, same as
                    any self-service applicant - see approve_tailor_application. */}
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
                      ? "All required documents attached - this application is ready to approve from the Tailor Applications tab."
                      : `${kycCount}/3 documents attached - Aadhaar (front + back) and PAN are required before this application can be approved.`}
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
                  {loading ? "Submitting…" : "Submit Application"}
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
