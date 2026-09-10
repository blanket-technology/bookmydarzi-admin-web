import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, Navigate } from "react-router-dom";
import {
  Users,
  User,
  Scissors,
  ShoppingCart,
  Grid,
  BarChart2,
  Tag,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Settings,
  BookImage,
  Bell,
  MapPin,
  Inbox,
  Bike,
  CreditCard,
  Calendar,
  Truck,
  PackageCheck,
} from "lucide-react";
import { LogoutPage } from "../../features/auth";
import { adminWsService } from "../../services/adminWsService";
import { getStoredUser, getStoredPermissions } from "../../store/authStore";
import { MODULES } from "../../constants/permissions";
import DialogHost from "../common/DialogHost";
import ConnectionStatusBanner from "../common/ConnectionStatusBanner";

function SidebarContent({ isCollapsed, navItems, location, setIsMobileOpen, adminUser }) {
  return (
    <div className="flex flex-col h-full bg-white text-slate-700 select-none border-r border-slate-100 overflow-hidden">
      {/* Logo Section */}
      <div
        className={`flex items-center h-14 px-4 shrink-0 ${isCollapsed ? "justify-center" : "justify-start gap-2.5"}`}
      >
        <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shrink-0 shadow-sm">
          <span className="text-white font-extrabold text-sm">B</span>
        </div>

        {!isCollapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-slate-800 leading-tight truncate">BookMyDarzi</span>
            {/* <span className="text-[10px] text-slate-400 font-medium">Admin Panel</span> */}
          </div>
        )}

        <button
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden ml-auto p-1 rounded-lg hover:bg-slate-100 text-slate-500"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-1.5 overflow-y-auto overflow-x-hidden flex flex-col">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-2 rounded-lg font-semibold text-xs transition-all duration-150 group relative ${
                  isActive
                    ? "bg-brand text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-brand-dark"
                } ${
                  isCollapsed
                    ? "justify-center w-9 h-9 p-0 mx-auto"
                    : "px-3 py-2 w-full justify-start"
                }`}
                title={isCollapsed ? item.name : ""}
              >
                <Icon
                  size={15}
                  className={`shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-teal-600"}`}
                />
                {!isCollapsed && <span className="truncate">{item.name}</span>}

                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 pointer-events-none shadow-lg">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Admin User Info */}
      {adminUser && !isCollapsed && (
        <div className="px-3 py-2 border-t border-slate-100 shrink-0">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-50">
            <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold shrink-0">
              {(adminUser.FullName || adminUser.Email || "A")[0].toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-800 truncate leading-tight">
                {adminUser.FullName || adminUser.Email || "Admin"}
              </span>
              <span className="text-[10px] text-slate-400 font-medium capitalize">{adminUser.Role || "admin"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Logout Container */}
      <div className="px-3 py-2.5 border-t border-slate-100 shrink-0">
        <LogoutPage isCollapsed={isCollapsed} />
      </div>
    </div>
  );
}

function Layout() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [wsToast, setWsToast] = useState(null); // { msg, type }

  const token = sessionStorage.getItem("access_token");
  const adminUser = getStoredUser();

  // useEffect must be called unconditionally (Rules of Hooks).
  // The auth guard redirect happens AFTER all hooks below.
  useEffect(() => {
    if (!sessionStorage.getItem("access_token")) return;
    adminWsService.connect();

    const onToast = (e) => {
      setWsToast(e.detail);
      setTimeout(() => setWsToast(null), 4000);
    };
    window.addEventListener("bmd:toast", onToast);

    return () => {
      adminWsService.disconnect();
      window.removeEventListener("bmd:toast", onToast);
    };
  }, []);

  if (!token) {
    return <Navigate to="/" replace />;
  }

  const permissions = getStoredPermissions();

  // Roles with no access to any of Settings' other tabs (billing/CMS/roles/
  // audit are all admin-only modules) only ever see the "My Account" tab
  // buried inside a page whose other tabs they can't open - Bridge/employee
  // get a standalone "Profile" page instead. Admin/superadmin already reach
  // the same account info via Settings, so they don't need a second entry.
  const hasFullSettingsAccess =
    permissions[MODULES.SYSTEM_CONFIG] || permissions[MODULES.CMS] ||
    permissions[MODULES.ROLES_PERMISSIONS] || permissions[MODULES.AUDIT_LOG];

  const allNavItems = [
    { name: "Dashboard", path: "/dashboard", icon: BarChart2, module: MODULES.DASHBOARD },
    { name: "User Management", path: "/users", icon: Users, module: MODULES.USERS },
    { name: "Tailors", path: "/tailordetails", icon: Scissors, module: MODULES.TAILORS },
    { name: "Bridge", path: "/bridgedetail", icon: Bike, module: MODULES.EMPLOYEES },
    { name: "Order Management", path: "/ordersdetails", icon: ShoppingCart, module: MODULES.ORDERS },
    { name: "Deliveries", path: "/deliveries", icon: Truck, module: MODULES.FLEET_TRACKING },
    { name: "Pickups", path: "/pickups", icon: PackageCheck, module: MODULES.FLEET_TRACKING },
    { name: "Payments", path: "/payments", icon: CreditCard, module: MODULES.PAYMENTS },
    { name: "Catalog", path: "/catalog", icon: Grid, module: MODULES.CATALOG },
    { name: "Reporting", path: "/reporting", icon: BarChart2, module: MODULES.FINANCIAL_REPORTS },
    { name: "Offers & Coupons", path: "/offers", icon: Tag, module: MODULES.COUPONS },
    { name: "Leave Requests", path: "/leave-requests", icon: Calendar, module: MODULES.LEAVE_REQUESTS },
    { name: "Notifications", path: "/notifications", icon: Bell, module: MODULES.NOTIFICATIONS },
    { name: "CMS", path: "/cms", icon: BookImage, module: MODULES.CMS },
    { name: "Settings", path: "/settings", icon: Settings, module: hasFullSettingsAccess ? MODULES.MY_ACCOUNT : null },
    { name: "My Profile", path: "/profile", icon: User, module: hasFullSettingsAccess ? null : MODULES.MY_ACCOUNT },
    { name: "Service Areas", path: "/service-areas", icon: MapPin, module: MODULES.SERVICE_AREAS },
    { name: "Support", path: "/support", icon: Inbox, module: MODULES.SUPPORT_TICKETS },
  ];

  const navItems = allNavItems.filter((item) => item.module && permissions[item.module]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden w-screen">
      <DialogHost />
      <ConnectionStatusBanner />
      {/* App-wide toast - WS-pushed events and dialogService.notifyError/
          notifySuccess both dispatch the same "bmd:toast" event, so any
          store/hook can surface an error here instead of window.alert(). */}
      {wsToast && (
        <div
          className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold transition-all ${
            wsToast.type === "success"
              ? "bg-emerald-600 text-white"
              : wsToast.type === "error"
                ? "bg-red-600 text-white"
                : "bg-teal-700 text-white"
          }`}
        >
          <span>{wsToast.msg}</span>
          <button onClick={() => setWsToast(null)} className="opacity-70 hover:opacity-100 ml-1">
            <X size={14} />
          </button>
        </div>
      )}
      {/* 1. DESKTOP SIDEBAR */}
      <aside
        className={`hidden md:block shrink-0 bg-white sticky top-0 h-screen transition-all duration-300 ease-in-out border-r border-slate-200 z-30 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        <SidebarContent
          isCollapsed={isCollapsed}
          navItems={navItems}
          location={location}
          setIsMobileOpen={setIsMobileOpen}
          adminUser={adminUser}
        />

        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute bottom-6 -right-3 w-6 h-6 bg-brand hover:bg-brand-dark text-white rounded-full flex items-center justify-center border-2 border-white shadow-md transition-transform active:scale-95 z-40"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>

      {/* 2. MOBILE SIDEBAR DRAWER */}
      <>
        {isMobileOpen && (
          <div
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
        <aside
          className={`fixed inset-y-0 left-0 w-64 bg-white z-50 md:hidden shadow-2xl transition-transform duration-300 ease-in-out transform ${
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarContent
          isCollapsed={isCollapsed}
          navItems={navItems}
          location={location}
          setIsMobileOpen={setIsMobileOpen}
          adminUser={adminUser}
        />
        </aside>
      </>

      {/* 3. MAIN CONTENT AREA */}
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        {/* Global Floating Header for Mobile */}
        <header className="md:hidden flex items-center h-16 px-4 bg-white border-b border-slate-200 shrink-0 shadow-sm">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <Menu size={24} />
          </button>
          <div className="ml-3 text-lg font-bold text-slate-800 tracking-wide">
            BookMy<span className="text-brand">Darzi</span>
          </div>
        </header>

        {/* Dynamic Pages Render Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;