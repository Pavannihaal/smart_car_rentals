import { bookings } from "../data/bookings";
import { databaseSchema } from "../data/databaseSchema";
import { messages } from "../data/messages";
import { queryExamples } from "../data/queryExamples";
import { users } from "../data/users";
import { vehicles } from "../data/vehicles";

const delay = (value) =>
  new Promise((resolve) => {
    window.setTimeout(() => resolve(value), 120);
  });

export const mockApi = {
  getVehicles() {
    return delay(vehicles);
  },
  getVehicleById(vehicleId) {
    return delay(
      vehicles.find((vehicle) => vehicle.vehicle_id === Number(vehicleId)) || null
    );
  },
  getBookings() {
    return delay(bookings);
  },
  getBookingById(bookingId) {
    return delay(
      bookings.find((booking) => booking.booking_id === Number(bookingId)) || null
    );
  },
  getMessagesForBooking(bookingId) {
    return delay(
      messages.filter((message) => message.booking_id === Number(bookingId))
    );
  },
  getUsers() {
    return delay(users);
  },
  getDatabaseSchema() {
    return delay(databaseSchema);
  },
  getQueryExamples() {
    return delay(queryExamples);
  }
};
