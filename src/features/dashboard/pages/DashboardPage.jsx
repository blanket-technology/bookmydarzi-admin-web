import useDashboard from "../hooks/useDashboard.js";

export default function DashboardPage() {
  const { hasAccess, DashboardView } = useDashboard();

  if (!hasAccess) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50 p-6">
        <div className="text-center text-slate-400 text-sm">
          You don&apos;t have access to a dashboard.
        </div>
      </div>
    );
  }

  return <DashboardView />;
}
