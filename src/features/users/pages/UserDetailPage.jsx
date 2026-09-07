import useUserDetail from "../hooks/useUserDetail.js";
import UserDetailContent from "../components/UserDetailContent.jsx";

export default function UserDetailPage() {
  const ctx = useUserDetail();
  return <UserDetailContent {...ctx} />;
}
