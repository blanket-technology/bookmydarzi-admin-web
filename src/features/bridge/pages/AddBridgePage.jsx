import { useNavigate } from "react-router-dom";
import {
  User, Mail, Phone, Lock, Eye, EyeOff,
  CheckCircle2, XCircle, AlertCircle, RotateCcw, UserPlus, X, Bike,
  Briefcase, MapPin, Truck, Clock, Calendar, ArrowLeft,
  ShieldCheck, CreditCard, FileText,
} from "lucide-react";
import { InputField, SelectField } from "../../../components/common/FormFields.jsx";
import SectionHeader from "../../../components/common/SectionHeader.jsx";
import { KycCard, DocModal } from "../../../components/common/KycUpload.jsx";
import { BRIDGE_TYPE_OPTIONS } from "../constants/bridgeConstants.js";
import useAddBridge from "../hooks/useAddBridge.js";

export default function AddBridgePage() {
  const navigate = useNavigate();
  const {
    form,
    profile,
    kyc,
    viewing,
    errors,
    showErrors,
    showPassword,
    loading,
    status,
    msg,
    kycCount,
    onChange,
    setProfileField,
    setKyc,
    setViewing,
    setShowPassword,
    setStatus,
    reset,
    submit,
  } = useAddBridge();

  return (
    <>
      {viewing && <DocModal file={viewing} onClose={() => setViewing(null)} />}

      <div className="p-3 sm:p-5 w-full min-h-screen bg-gray-100 flex flex-col">
      <div className="w-full flex-1 flex flex-col bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header - matches AddTailorPage.jsx's header treatment (same dark
            teal, same icon-watermark pattern, same back-button placement) so
            every "Add {Role}" screen reads as one consistent family. */}
        <div className="relative bg-[#025e5e] px-8 py-6 overflow-hidden">
          <Bike size={140} className="absolute -right-8 -top-8 text-white opacity-[0.06] rotate-12" />
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
                <h2 className="text-xl font-bold text-white leading-tight">Add Bridge Employee</h2>
                <p className="text-teal-100 text-xs mt-1">Create a field employee account for cloth pickup & delivery</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-8">
            {status && (
              <div className={`rounded-xl px-4 py-3.5 text-sm font-semibold flex items-start gap-3 border-2 ${status === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"}`}>
                {status === "success" ? <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" /> : <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />}
                <span className="flex-1">{msg}</span>
                <button type="button" onClick={() => setStatus(null)} className="text-gray-400 hover:text-gray-600 shrink-0">
                  <X size={16} />
                </button>
              </div>
            )}

            <form onSubmit={submit} noValidate className="space-y-8">
              {/* ── Account Details ── */}
              <div className="space-y-5">
                <SectionHeader icon={User} title="Account Details" subtitle="Login credentials and contact information" />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <InputField
                    icon={User} name="name" label="Full Name" placeholder="Enter full name"
                    value={form.name} onChange={onChange} error={errors.name} touched={showErrors}
                  />
                  <InputField
                    icon={Mail} name="email" label="Email Address" placeholder="employee@bookmydarzi.com" type="email"
                    value={form.email} onChange={onChange} error={errors.email} touched={showErrors}
                  />
                  <InputField
                    icon={Phone} name="mobile" label="Mobile Number" placeholder="10-digit number"
                    value={form.mobile} onChange={onChange} error={errors.mobile} touched={showErrors}
                  />
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="text-xs font-semibold text-gray-600 flex items-center gap-1 mb-1.5">
                      Password
                      <span className="text-gray-400 font-normal">(optional - defaults to Bridge@123)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                        <Lock size={17} />
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Leave blank to use default (Bridge@123)"
                        value={form.password}
                        onChange={onChange}
                        autoComplete="off"
                        className="w-full h-11 pl-11 pr-10 text-sm rounded-xl border-2 outline-none transition-all bg-gray-50 focus:bg-white placeholder:text-gray-400 border-gray-300 focus:border-[#006B6B]"
                      />
                      <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                  Password rules: min 6 characters, at least 1 uppercase letter, at least 1 number. The employee should change their password after first login.
                </p>
              </div>

              {/* ── Professional Details (optional) ── */}
              <div className="space-y-5">
                <SectionHeader
                  icon={Briefcase}
                  title="Professional Details"
                  subtitle="Optional - can also be filled in later from the employee's profile"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <InputField
                    icon={Clock} name="experience_years" label="Experience (years)" placeholder="e.g. 3" type="number"
                    value={profile.experience_years} onChange={(e) => setProfileField("experience_years", e.target.value)}
                    required={false} touched={false}
                  />
                  <SelectField
                    icon={Briefcase} name="bridge_type" label="Bridge Type" value={profile.bridge_type}
                    onChange={(e) => setProfileField("bridge_type", e.target.value)}
                    options={BRIDGE_TYPE_OPTIONS}
                  />
                  <InputField
                    icon={MapPin} name="assigned_area" label="Assigned Area" placeholder="e.g. Noida Sector 62, Indirapuram"
                    value={profile.assigned_area} onChange={(e) => setProfileField("assigned_area", e.target.value)}
                    required={false} touched={false}
                  />
                  <InputField
                    icon={Truck} name="vehicle_type" label="Vehicle Type" placeholder="e.g. Bike"
                    value={profile.vehicle_type} onChange={(e) => setProfileField("vehicle_type", e.target.value)}
                    required={false} touched={false}
                  />
                  <InputField
                    icon={Clock} name="working_shift" label="Working Shift" placeholder="e.g. 9:00 AM - 7:00 PM"
                    value={profile.working_shift} onChange={(e) => setProfileField("working_shift", e.target.value)}
                    required={false} touched={false}
                  />
                  <InputField
                    icon={Calendar} name="joining_date" label="Joining Date" type="date"
                    value={profile.joining_date} onChange={(e) => setProfileField("joining_date", e.target.value)}
                    required={false} touched={false}
                  />
                </div>
              </div>

              {/* ── KYC Section - identical KycCard/DocModal used on the
                  employee detail page and the Add Tailor screen, so upload/
                  preview UI is consistent across every "Add {Role}" screen. ── */}
              <div className="space-y-5">
                <SectionHeader
                  icon={ShieldCheck}
                  title="KYC Verification"
                  subtitle="Optional - can also be uploaded later from the employee's profile"
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

                {/* Mirrors AddTailorPage.jsx's equivalent hint - a Bridge
                    employee is never auto-verified on creation either
                    (BridgeProfile.IsApproved defaults false and requires all
                    3 KYC docs + a separate admin action, same as Tailor). */}
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
                      ? "All 3 documents attached - this employee is ready to be verified from their profile page after creation."
                      : `${kycCount}/3 documents attached - this employee will be created as Pending Verification. Upload all 3 documents before they can be verified.`}
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
                  {loading ? "Creating…" : "Create Employee"}
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
