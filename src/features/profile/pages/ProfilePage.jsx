import PageHeader from "../../../components/common/PageHeader.jsx";
import ProfileAccountSection from "../../../components/common/ProfileAccountSection.jsx";
import useProfile from "../hooks/useProfile.js";

export default function ProfilePage() {
  const { title, subtitle } = useProfile();

  return (
    <div className="p-4 sm:p-5 w-full min-h-screen bg-gray-100">
      <PageHeader title={title} subtitle={subtitle} />
      <ProfileAccountSection />
    </div>
  );
}
