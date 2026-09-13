import { customerApi } from "./customerApi";
import {
  getAdvisoryBaselines,
  getAdvisoryRecommendations,
  getAdvisoryVehicleMetrics
} from "./advisoryApi";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:4000";

async function request(path, init = {}) {
  const session = JSON.parse(localStorage.getItem("smartcar_session") || "null");
  const ownerId = session?.user_id || 9;
  const defaultHeaders = {
    "Content-Type": "application/json",
    "X-Owner-Id": String(ownerId),
    ...(init.headers || {}),
  };
  const fetchOptions = {
    method: init.method || "GET",
    headers: defaultHeaders,
    ...(init.body ? { body: init.body } : {}),
  };
  const response = await fetch(`${API_BASE}${path}`, fetchOptions);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || "The owner request could not be completed.");
    error.code = payload.error;
    error.status = response.status;
    throw error;
  }
  return payload;
}

export const ownerApi = {
  getFleet() {
    return request("/api/owner/fleet");
  },
  getVehicle(vehicleId) {
    return customerApi.getVehicle(vehicleId);
  },
  getOperationalMetrics() {
    return getAdvisoryVehicleMetrics();
  },
  getBaselines() {
    return getAdvisoryBaselines();
  },
  getRecommendations() {
    return getAdvisoryRecommendations();
  },
  getBookings(params = {}) {
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== "" && value !== undefined));
    return request(`/api/owner/bookings${query.toString() ? `?${query}` : ""}`);
  },
  getBooking(bookingId) {
    return request(`/api/owner/bookings/${bookingId}`);
  },
  updateBookingStatus(bookingId, status) {
    return request(`/api/owner/bookings/${bookingId}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
  },
  getInspections(params = {}) {
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== "" && value !== undefined));
    return request(`/api/owner/inspections${query.toString() ? `?${query}` : ""}`);
  },
  getInspection(bookingId, inspectionNo) {
    return request(`/api/owner/inspections/${bookingId}/${inspectionNo}`);
  },
  getMaintenance(params = {}) {
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== "" && value !== undefined));
    return request(`/api/owner/maintenance${query.toString() ? `?${query}` : ""}`);
  },
  getMaintenanceRecord(vehicleId, maintenanceNo) {
    return request(`/api/owner/maintenance/${vehicleId}/${maintenanceNo}`);
  },
  getHistory(vehicleId) {
    return request(`/api/owner/history${vehicleId ? `?vehicle_id=${vehicleId}` : ""}`);
  },
  getMessages(bookingId) {
    return request(`/api/owner/messages${bookingId ? `?booking_id=${bookingId}` : ""}`);
  },
  sendMessage(payload) {
    return request("/api/owner/messages", { method: "POST", body: JSON.stringify(payload) });
  }
};