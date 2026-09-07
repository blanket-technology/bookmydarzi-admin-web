import { Image as ImageIcon, HelpCircle, BookImage } from "lucide-react";

export const CMS_TABS = [
  { id: "banners", label: "Banners", icon: ImageIcon },
  { id: "faqs", label: "FAQ", icon: HelpCircle },
  { id: "lookbook", label: "Lookbook", icon: BookImage },
];

export const DEFAULT_CMS_TAB = "banners";

export const BANNER_INIT = {
  title: "",
  subtitle: "",
  image_url: "",
  redirect_url: "",
  display_order: "0",
  valid_until: "",
};

export const LOOKBOOK_CATEGORIES = [
  "general",
  "mens",
  "womens",
  "kids",
  "wedding",
  "ethnic",
  "western",
];

export const LOOKBOOK_ITEM_INIT = {
  title: "",
  image_url: "",
  category_tag: "general",
  caption: "",
  display_order: "0",
  service_id: "",
  is_active: true,
};

export const BANNER_IMAGE_UPLOAD_PATH = "/admin/homepage/banners/upload-image";
export const LOOKBOOK_IMAGE_UPLOAD_PATH = "/admin/lookbook/upload-image";
export const LOOKBOOK_FETCH_LIMIT = 100;
