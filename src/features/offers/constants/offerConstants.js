export const INIT_FORM = {
  title: "",
  description: "",
  discount_type: "percentage",
  discount_percent: "",
  discount_amount: "",
  coupon_code: "",
  image_url: "",
  valid_from: "",
  valid_until: "",
};

export const EXPIRY_FILTER_OPTIONS = [
  { value: "", label: "All" },
  { value: "active", label: "Active only" },
  { value: "expired", label: "Expired / Disabled" },
];

export const OFFER_IMAGE_UPLOAD_PATH = "/admin/homepage/offers/upload-image";
