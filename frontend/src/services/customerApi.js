const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:4000";

async function request(path, options) {
  const session = JSON.parse(localStorage.getItem("smartcar_session") || "null");
  const customerId = session?.customer_id || 1;
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "X-Customer-Id": String(customerId),
      ...(options?.headers || {})
    },
    ...options
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || "The request could not be completed.");
    error.code = payload.error;
    error.status = response.status;
    throw error;
  }
  return payload;
}

export const customerApi = {
  getVehicles(params = {}) {
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== "" && value !== undefined));
    return request(`/api/vehicles${query.toString() ? `?${query}` : ""}`);
  },
  getVehicle(vehicleId) {
    return request(`/api/vehicles/${vehicleId}`);
  },
  checkAvailability(vehicleId, pickup, returned) {
    const query = new URLSearchParams({ pickup, return: returned });
    return request(`/api/vehicles/${vehicleId}/availability?${query}`);
  },
  createBooking(payload) {
    return request("/api/bookings", { method: "POST", body: JSON.stringify(payload) });
  },
  getBookings() {
    return request("/api/customer/bookings");
  },
  getBooking(bookingId) {
    return request(`/api/customer/bookings/${bookingId}`);
  },
  getPayments() {
    return request("/api/customer/payments");
  },
  getProfile() {
    return request("/api/customer/profile");
  },
  updateProfile(payload) {
    return request("/api/customer/profile", { method: "PATCH", body: JSON.stringify(payload) });
  },
  getMessages() {
    return request("/api/customer/messages");
  },
  sendMessage(payload) {
    return request("/api/customer/messages", { method: "POST", body: JSON.stringify(payload) });
  }
};