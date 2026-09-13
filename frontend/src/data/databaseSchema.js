export const databaseSchema = {
  tables: [
    {
      name: "users",
      columns: ["user_id", "email", "password_hash", "role", "created_at"]
    },
    {
      name: "customers",
      columns: [
        "customer_id",
        "user_id",
        "name",
        "phone",
        "license_number",
        "license_status",
        "address",
        "created_at"
      ]
    },
    {
      name: "rental_companies",
      columns: [
        "company_id",
        "user_id",
        "company_name",
        "contact_number",
        "address",
        "created_at"
      ]
    },
    {
      name: "locations",
      columns: [
        "location_id",
        "company_id",
        "name",
        "address",
        "city",
        "state",
        "zip_code"
      ]
    },
    {
      name: "vehicles",
      columns: [
        "vehicle_id",
        "company_id",
        "location_id",
        "vehicle_number",
        "brand",
        "model",
        "year",
        "type",
        "fuel_type",
        "transmission",
        "price_per_day",
        "seats",
        "mileage",
        "status",
        "current_fuel_level",
        "rating",
        "image_url",
        "created_at"
      ]
    },
    {
      name: "bookings",
      columns: [
        "booking_id",
        "customer_id",
        "vehicle_id",
        "pickup_datetime",
        "return_datetime",
        "total_amount",
        "status",
        "created_at"
      ]
    },
    {
      name: "payments",
      columns: [
        "payment_id",
        "booking_id",
        "amount",
        "payment_method",
        "payment_status",
        "transaction_reference",
        "paid_at"
      ]
    },
    {
      name: "vehicle_inspections",
      columns: [
        "booking_id",
        "inspection_no",
        "inspector_name",
        "inspection_date",
        "fuel_level",
        "odometer",
        "body_condition",
        "interior_condition",
        "is_clean",
        "issues_found",
        "status"
      ]
    },
    {
      name: "maintenance",
      columns: [
        "vehicle_id",
        "maintenance_no",
        "description",
        "cost",
        "start_date",
        "end_date",
        "status"
      ]
    },
    {
      name: "vehicle_status_history",
      columns: [
        "history_id",
        "vehicle_id",
        "status",
        "changed_at",
        "updated_by_user_id",
        "comments"
      ]
    },
    {
      name: "reviews",
      columns: [
        "review_id",
        "booking_id",
        "customer_id",
        "vehicle_id",
        "rating",
        "comment",
        "created_at"
      ]
    },
    {
      name: "messages",
      columns: [
        "message_id",
        "booking_id",
        "sender_user_id",
        "message_text",
        "sent_at",
        "is_read"
      ]
    }
  ],
  relations: [
    "users 1-1 customers",
    "users 1-1 rental_companies",
    "rental_companies 1-many locations",
    "rental_companies 1-many vehicles",
    "locations 1-many vehicles",
    "customers 1-many bookings",
    "vehicles 1-many bookings",
    "bookings 1-many messages",
    "bookings 1-many vehicle_inspections",
    "vehicles 1-many maintenance",
    "vehicles 1-many vehicle_status_history",
    "bookings 1-1 reviews"
  ]
};
