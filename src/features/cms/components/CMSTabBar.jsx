import { CMS_TABS } from "../constants/cmsConstants.js";

export default function CMSTabBar({ activeTab, setActiveTab }) {
  return (
    <div className="flex items-center gap-1.5 border-b border-gray-200 mt-3">
      {CMS_TABS.map((t) => {
        const Icon = t.icon;
        const active = activeTab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              active
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon size={14} /> {t.label}
          </button>
        );
      })}
    </div>
  );
}
