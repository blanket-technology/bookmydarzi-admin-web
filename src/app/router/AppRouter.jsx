import { BrowserRouter, Routes, Route } from "react-router-dom";

import ProtectedRoute from "../../components/ProtectedRoute.jsx";
import Layout from "../../components/layout/Layout.jsx";
import Captcha from "../../components/common/Captcha.jsx";

import { AdminLoginPage } from "../../features/auth/index.js";
import { DashboardPage } from "../../features/dashboard/index.js";
import {
  TailorDetailsPage as TailorDetails,
  AddTailorPage as AddTailor,
  TailorFullDetailsPage as FullDetails,
  TailorApplicationsPage as TailorApplications,
} from "../../features/tailor/index.js";
import {
  BridgeDetailsPage as BridgeDetails,
  AddBridgePage as AddBridge,
  BridgeFullDetailsPage as EmployeeOrderWorkflow,
  BridgeEmployeeDetailPage,
} from "../../features/bridge/index.js";
import {
  OrderDetailsPage as OrderDetails,
  AddOrderPage as AddOrder,
  OrderFullDetailsPage as OrderFullDetails,
  DeliveriesPage,
  PickupsPage,
} from "../../features/order/index.js";
import { InventoryPage } from "../../features/inventory/index.js";
import { PaymentsPage } from "../../features/payments/index.js";
import { OffersPage } from "../../features/offers/index.js";
import { CatalogPage } from "../../features/catalog/index.js";
import { ReportingPage } from "../../features/reporting/index.js";
import { UsersPage, UserDetailPage } from "../../features/users/index.js";
import { SettingsPage } from "../../features/settings/index.js";
import { ProfilePage } from "../../features/profile/index.js";
import { FAQsPage, SupportPage as InboxPage, SupportTicketsPage } from "../../features/support/index.js";
import { CMSPage } from "../../features/cms/index.js";
import { ChatSupportPage } from "../../features/chat/index.js";
import { CancellationsPage } from "../../features/cancellations/index.js";
import { LeaveRequestsPage } from "../../features/leave/index.js";
import { NotificationsPage } from "../../features/notifications/index.js";
import { ServiceAreasPage } from "../../features/service-areas/index.js";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLoginPage />} />
        <Route path="/captcha" element={<Captcha />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/customers/:id" element={<UserDetailPage />} />

            <Route path="/tailordetails" element={<TailorDetails />} />
            <Route path="/addtailor" element={<AddTailor />} />
            <Route path="/tailors/:id" element={<FullDetails />} />
            <Route path="/tailor-applications" element={<TailorApplications />} />

            <Route path="/bridgedetail" element={<BridgeDetails />} />
            <Route path="/addbridge" element={<AddBridge />} />
            <Route path="/employee-order-workflow/:id" element={<EmployeeOrderWorkflow />} />
            <Route path="/employees/:id" element={<BridgeEmployeeDetailPage />} />

            <Route path="/ordersdetails" element={<OrderDetails />} />
            <Route path="/addorder" element={<AddOrder />} />
            <Route path="/orders/:id" element={<OrderFullDetails />} />
            <Route path="/deliveries" element={<DeliveriesPage />} />
            <Route path="/pickups" element={<PickupsPage />} />
            <Route path="/inventory" element={<InventoryPage />} />

            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/offers" element={<OffersPage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/reporting" element={<ReportingPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/faqs" element={<FAQsPage />} />
            <Route path="/support-tickets" element={<SupportTicketsPage />} />
            <Route path="/support" element={<InboxPage />} />
            <Route path="/cms" element={<CMSPage />} />
            <Route path="/chat-support" element={<ChatSupportPage />} />
            <Route path="/cancellations" element={<CancellationsPage />} />
            <Route path="/leave-requests" element={<LeaveRequestsPage />} />
            <Route path="/service-areas" element={<ServiceAreasPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
