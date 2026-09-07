import PageHeader from "../../../components/common/PageHeader.jsx";
import { FAQsSectionBody } from "../components/FAQsSection.jsx";

export default function FAQsPage() {
  return (
    <div className="p-3 sm:p-5 w-full min-h-screen bg-gray-100">
      <PageHeader title="FAQs Management" subtitle="Manage customer-facing frequently asked questions" />
      <FAQsSectionBody />
    </div>
  );
}
