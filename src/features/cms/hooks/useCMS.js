import { useState } from "react";
import { DEFAULT_CMS_TAB } from "../constants/cmsConstants.js";

export default function useCMS() {
  const [activeTab, setActiveTab] = useState(DEFAULT_CMS_TAB);

  return {
    activeTab,
    setActiveTab,
  };
}
