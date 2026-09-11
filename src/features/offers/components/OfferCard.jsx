import {
  Pencil, Trash2, Image as ImageIcon, Calendar, Percent, Ticket,
  PauseCircle, PlayCircle, IndianRupee,
} from "lucide-react";
import { resolveMediaUrl } from "../../../services/api.js";

export default function OfferCard({ offer, onEdit, onDelete, onToggle }) {
  const hasImage = !!offer.ImageUrl;
  const isExpired = offer.ValidUntil && new Date(offer.ValidUntil) < new Date();
  const isUpcoming = offer.ValidFrom && new Date(offer.ValidFrom) > new Date();
  const isDisabled = !offer.IsActive;

  return (
    <div className={`bg-white rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col ${isDisabled ? "border-gray-200 opacity-60" : isExpired ? "border-red-100 opacity-75" : "border-gray-100"}`}>
      {/* Image */}
      <div className="relative h-36 bg-gray-100 shrink-0">
        {hasImage ? (
          <img
            src={resolveMediaUrl(offer.ImageUrl)}
            alt={offer.Title}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-teal-50 to-gray-100">
            <ImageIcon size={24} className="text-gray-300" />
            <span className="text-[11px] text-gray-400 font-medium">No image</span>
          </div>
        )}
        {/* Discount badge overlay */}
        {offer.DiscountType === "flat" && offer.DiscountAmount > 0 ? (
          <span className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-teal-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
            <IndianRupee size={10} /> {offer.DiscountAmount} off
          </span>
        ) : offer.DiscountPercent > 0 ? (
          <span className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-teal-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
            <Percent size={10} /> {offer.DiscountPercent}% off
            {offer.MaxDiscountAmount > 0 ? ` up to ₹${offer.MaxDiscountAmount.toLocaleString("en-IN")}` : ""}
          </span>
        ) : null}
        {isDisabled ? (
          <span className="absolute top-2.5 right-2.5 bg-gray-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            Disabled
          </span>
        ) : isExpired ? (
          <span className="absolute top-2.5 right-2.5 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            Expired
          </span>
        ) : isUpcoming ? (
          <span className="absolute top-2.5 right-2.5 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            Scheduled
          </span>
        ) : null}
      </div>

      {/* Content */}
      <div className="px-3.5 py-3 flex-1 flex flex-col gap-1.5">
        <p className="font-bold text-gray-800 text-sm leading-snug line-clamp-1">{offer.Title}</p>
        {offer.Description && (
          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{offer.Description}</p>
        )}
        {(offer.CouponCode || offer.MinOrderValue > 0) && (
          <div className="flex items-center gap-1.5 pt-1 flex-wrap">
            {offer.CouponCode && (
              <>
                <Ticket size={11} className="text-teal-500 shrink-0" />
                <span className="text-[11px] font-mono font-bold text-teal-700 tracking-wider bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-md">
                  {offer.CouponCode}
                </span>
              </>
            )}
            {offer.MinOrderValue > 0 && (
              <span className="text-[11px] font-semibold text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">
                Min ₹{offer.MinOrderValue.toLocaleString("en-IN")}
              </span>
            )}
          </div>
        )}
        <div className="flex items-center gap-1.5 mt-auto pt-1">
          <Calendar size={11} className="text-gray-400 shrink-0" />
          <span className={`text-[11px] font-medium ${isExpired ? "text-red-500" : isUpcoming ? "text-amber-600" : "text-gray-400"}`}>
            {isUpcoming
              ? `Starts ${new Date(offer.ValidFrom).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
              : offer.ValidUntil
                ? `Until ${new Date(offer.ValidUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                : "No expiry"}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex border-t border-gray-100">
        <button
          onClick={() => onEdit(offer)}
          className="flex-1 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-1 transition-colors"
        >
          <Pencil size={11} /> Edit
        </button>
        <div className="w-px bg-gray-100" />
        <button
          onClick={() => onToggle(offer)}
          title={isDisabled ? "Enable this offer" : "Disable this offer"}
          className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
            isDisabled ? "text-emerald-600 hover:bg-emerald-50" : "text-amber-600 hover:bg-amber-50"
          }`}
        >
          {isDisabled ? <PlayCircle size={11} /> : <PauseCircle size={11} />}
          {isDisabled ? "Enable" : "Disable"}
        </button>
        <div className="w-px bg-gray-100" />
        <button
          onClick={() => onDelete(offer)}
          className="flex-1 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center justify-center gap-1 transition-colors"
        >
          <Trash2 size={11} /> Delete
        </button>
      </div>
    </div>
  );
}
