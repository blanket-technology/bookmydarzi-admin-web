export function bannerToForm(banner) {
  return {
    title: banner.Title ?? banner.title ?? "",
    subtitle: banner.Subtitle ?? banner.subtitle ?? "",
    image_url: banner.ImageUrl ?? banner.image_url ?? "",
    redirect_url: banner.RedirectUrl ?? banner.redirect_url ?? "",
    display_order: String(banner.DisplayOrder ?? banner.display_order ?? 0),
    valid_until: (banner.ValidUntil ?? banner.valid_until)
      ? String(banner.ValidUntil ?? banner.valid_until).slice(0, 10)
      : "",
  };
}

export function buildBannerPayload(form) {
  return {
    title: form.title,
    subtitle: form.subtitle || null,
    image_url: form.image_url || null,
    redirect_url: form.redirect_url || null,
    display_order: Number(form.display_order) || 0,
    valid_until: form.valid_until || null,
  };
}

export function getBannerId(banner) {
  return banner.Id ?? banner.id;
}

export function lookbookItemToForm(item) {
  return {
    title: item.title || "",
    image_url: item.image_url || "",
    category_tag: item.category_tag || "general",
    caption: item.caption || "",
    display_order: String(item.display_order ?? 0),
    service_id: item.service_id ? String(item.service_id) : "",
    is_active: item.is_active !== false,
  };
}

export function buildLookbookPayload(form, editingId) {
  const payload = {
    title: form.title || null,
    image_url: form.image_url.trim(),
    category_tag: form.category_tag || "general",
    caption: form.caption || null,
    display_order: Number(form.display_order) || 0,
    service_id: form.service_id ? Number(form.service_id) : null,
  };
  if (editingId) {
    payload.is_active = form.is_active;
  }
  return payload;
}

export function buildLookbookFetchParams(filterCat, limit) {
  const params = { limit };
  if (filterCat && filterCat !== "all") params.category = filterCat;
  return params;
}
