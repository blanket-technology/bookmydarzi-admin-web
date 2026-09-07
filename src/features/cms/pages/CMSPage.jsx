import PageHeader from "../../../components/common/PageHeader.jsx";
import { FAQsSectionBody } from "../../support/components/FAQsSection.jsx";
import BannersSection from "../components/BannersSection.jsx";
import CMSTabBar from "../components/CMSTabBar.jsx";
import LookbookPage from "./LookbookPage.jsx";
import useCMS from "../hooks/useCMS.js";

export default function CMSPage() {
  const { activeTab, setActiveTab } = useCMS();

  return (
    <div className="p-3 sm:p-5 w-full min-h-screen bg-gray-100">
      <PageHeader title="CMS" subtitle="Manage customer-facing homepage content" />
      <CMSTabBar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="mt-4">
        {activeTab === "banners" && <BannersSection />}
        {activeTab === "faqs" && <FAQsSectionBody />}
        {activeTab === "lookbook" && <LookbookPage />}
      </div>
    </div>
  );
}
