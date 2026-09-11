export function offerToForm(offer) {
  return {
    title: offer.Title || "",
    description: offer.Description || "",
    discount_type: offer.DiscountType === "flat" ? "flat" : "percentage",
    discount_percent: offer.DiscountPercent ?? "",
    discount_amount: offer.DiscountAmount ?? "",
    min_order_value: offer.MinOrderValue || "",
    max_discount_amount: offer.MaxDiscountAmount ?? "",
    coupon_code: offer.CouponCode || "",
    image_url: offer.ImageUrl || "",
    valid_from: offer.ValidFrom ? offer.ValidFrom.slice(0, 10) : "",
    valid_until: offer.ValidUntil ? offer.ValidUntil.slice(0, 10) : "",
  };
}

export function buildOfferPayload(form) {
  return {
    title: form.title,
    description: form.description || null,
    discount_type: form.discount_type,
    discount_percent:
      form.discount_type === "percentage" && form.discount_percent !== ""
        ? Number(form.discount_percent)
        : 0,
    discount_amount:
      form.discount_type === "flat" && form.discount_amount !== ""
        ? Number(form.discount_amount)
        : null,
    min_order_value: form.min_order_value !== "" ? Number(form.min_order_value) : 0,
    max_discount_amount:
      form.discount_type === "percentage" && form.max_discount_amount !== ""
        ? Number(form.max_discount_amount)
        : null,
    coupon_code: form.coupon_code.trim().toUpperCase() || null,
    image_url: form.image_url || null,
    valid_from: form.valid_from || null,
    valid_until: form.valid_until || null,
  };
}

export function filterOffersByExpiry(offers, expiryFilter) {
  if (!expiryFilter) return offers;
  return offers.filter((o) => {
    const expired = o.ValidUntil && new Date(o.ValidUntil) < new Date();
    return expiryFilter === "expired" ? expired : !expired;
  });
}

export function validateOfferDates(form) {
  if (form.valid_from && form.valid_until && form.valid_from >= form.valid_until) {
    return "Start date must be before expiry date.";
  }
  return null;
}

// Mirrors OfferCreateRequest/OfferUpdateRequest's model_validator on the
// backend (app/schemas/home_admin.py) - a mismatched/missing discount value
// for the selected discount_type is a hard 422 there. Catching it here means
// an admin sees the specific field error inline instead of a generic "Save
// failed" after the request round-trips.
export function validateOfferDiscount(form) {
  if (form.discount_type === "flat") {
    const amount = Number(form.discount_amount);
    if (form.discount_amount === "" || !Number.isFinite(amount) || amount <= 0) {
      return "Discount amount must be a positive number.";
    }
    // A flat coupon that discounts almost/all of its own qualifying minimum
    // order is effectively "free" or loses money outright - mirrors the
    // backend's OfferCreate/OfferUpdate model_validator (home_admin.py).
    const minOrder = Number(form.min_order_value) || 0;
    if (minOrder <= amount) {
      return `Minimum order value must be greater than the discount amount (₹${amount}).`;
    }
  } else {
    const percent = Number(form.discount_percent);
    if (form.discount_percent === "" || !Number.isFinite(percent) || percent <= 0 || percent > 100) {
      return "Discount percent must be between 0 and 100.";
    }
    if (form.max_discount_amount !== "") {
      const cap = Number(form.max_discount_amount);
      if (!Number.isFinite(cap) || cap <= 0) {
        return "Max discount cap must be a positive number, or left blank for uncapped.";
      }
    }
  }
  return null;
}
