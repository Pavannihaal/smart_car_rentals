export const queryExamples = [
  {
    title: "Display all vehicles with company and location",
    sql: "SELECT v.vehicle_id, rc.company_name, l.name AS location_name, v.brand, v.model, v.status FROM vehicles v JOIN rental_companies rc ON rc.company_id = v.company_id JOIN locations l ON l.location_id = v.location_id;"
  },
  {
    title: "Display available vehicles",
    sql: "SELECT vehicle_id, brand, model, type, price_per_day FROM vehicles WHERE status = 'AVAILABLE';"
  },
  {
    title: "Search by vehicle type",
    sql: "SELECT vehicle_id, brand, model, type, price_per_day FROM vehicles WHERE type = 'SUV';"
  },
  {
    title: "Search by price range",
    sql: "SELECT vehicle_id, brand, model, price_per_day FROM vehicles WHERE price_per_day BETWEEN 2000 AND 6000;"
  },
  {
    title: "Display customer booking history",
    sql: "SELECT b.booking_id, v.brand, v.model, b.pickup_datetime, b.return_datetime, b.status FROM bookings b JOIN vehicles v ON v.vehicle_id = b.vehicle_id WHERE b.customer_id = 1;"
  },
  {
    title: "Display vehicles under maintenance",
    sql: "SELECT v.vehicle_number, v.brand, v.model, m.description, m.status FROM maintenance m JOIN vehicles v ON v.vehicle_id = m.vehicle_id WHERE m.status IN ('PENDING', 'IN_PROGRESS');"
  }
];
