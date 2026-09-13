import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { AuthPage } from "../pages/AuthPage";
import {
  CustomerBookingChatPage,
  CustomerBookingDetailsPage,
  CustomerBookingFlowPage,
  CustomerBookingsPage,
  CustomerDashboardPage,
  CustomerMessagesPage,
  CustomerPaymentsPage,
  CustomerProfilePage,
  CustomerSearchPage,
  CustomerVehicleDetailsPage
} from "../pages/CustomerPages";
import {
  DatabaseOverviewPage,
  ErDiagramPage,
  QueryDemoPage,
  SchemaViewerPage,
  TableViewerPage
} from "../pages/DatabasePages";
import { HomePage } from "../pages/HomePage";
import { NotFoundPage } from "../pages/NotFoundPage";
import {
  OwnerAnalyticsPage,
  OwnerAdvisoryPage,
  OwnerBookingDetailsPage,
  OwnerBookingsPage,
  OwnerDashboardPage,
  OwnerFleetPage,
  OwnerInspectionDetailsPage,
  OwnerHistoryPage,
  OwnerInspectionsPage,
  OwnerMaintenanceDetailsPage,
  OwnerMaintenancePage,
  OwnerReportsPage,
  OwnerSettingsPage,
  OwnerVehicleDetailsPage
} from "../pages/OwnerPages";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />

      <Route path="/customer" element={<AppShell area="customer" />}>
        <Route index element={<CustomerDashboardPage />} />
        <Route path="search" element={<CustomerSearchPage />} />
        <Route path="vehicles/:id" element={<CustomerVehicleDetailsPage />} />
        <Route path="book" element={<CustomerBookingFlowPage />} />
        <Route path="book/:id" element={<CustomerBookingFlowPage />} />
        <Route path="bookings" element={<CustomerBookingsPage />} />
        <Route path="bookings/:id" element={<CustomerBookingDetailsPage />} />
        <Route path="bookings/:id/chat" element={<CustomerBookingChatPage />} />
        <Route path="messages" element={<CustomerMessagesPage />} />
        <Route path="payments" element={<CustomerPaymentsPage />} />
        <Route path="profile" element={<CustomerProfilePage />} />
      </Route>

      <Route path="/owner" element={<AppShell area="owner" />}>
        <Route index element={<OwnerDashboardPage />} />
        <Route path="fleet" element={<OwnerFleetPage />} />
        <Route path="vehicles/:id" element={<OwnerVehicleDetailsPage />} />
        <Route path="bookings" element={<OwnerBookingsPage />} />
        <Route path="bookings/:id" element={<OwnerBookingDetailsPage />} />
        <Route path="inspections" element={<OwnerInspectionsPage />} />
        <Route path="inspections/:bookingId/:inspectionNo" element={<OwnerInspectionDetailsPage />} />
        <Route path="maintenance" element={<OwnerMaintenancePage />} />
        <Route path="maintenance/:vehicleId/:maintenanceNo" element={<OwnerMaintenanceDetailsPage />} />
        <Route path="history" element={<OwnerHistoryPage />} />
        <Route path="analytics" element={<OwnerAnalyticsPage />} />
        <Route path="advisory" element={<OwnerAdvisoryPage />} />
        <Route path="reports" element={<OwnerReportsPage />} />
        <Route path="settings" element={<OwnerSettingsPage />} />
      </Route>

      <Route path="/database/*" element={<Navigate to="/" replace />} />

      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
