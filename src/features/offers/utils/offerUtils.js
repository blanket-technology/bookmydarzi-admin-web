export function offerToForm(offer) {
  return {
    title: offer.Title || "",
    description: offer.Description || "",
    discount_type: offer.DiscountType === "flat" ? "flat" : "percentage",
    discount_percent: offer.DiscountPercent ?? "",
    discount_amount: offer.DiscountAmount ?? "",
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
