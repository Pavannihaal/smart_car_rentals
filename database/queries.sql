-- SmartCar DBMS Predefined Query Demonstrations

-- 1. Display all vehicles (showing company name and location name)
-- What it does:
-- - Retrieves all registered vehicles with full specifications (brand, model, year, type, fuel, transmission, price, seats, mileage, status, rating).
-- - Performs INNER JOINs with 'rental_companies' on company_id and 'locations' on location_id to display owning company and current branch.
-- - Orders the fleet in ascending order by vehicle_id for standard catalog display.
SELECT 
    v.vehicle_id, 
    rc.company_name, 
    l.name AS location_name, 
    v.vehicle_number, 
    v.brand, 
    v.model, 
    v.year, 
    v.type, 
    v.fuel_type, 
    v.transmission, 
    v.price_per_day, 
    v.seats, 
    v.mileage, 
    v.status, 
    v.rating
FROM vehicles v
JOIN rental_companies rc ON v.company_id = rc.company_id
JOIN locations l ON v.location_id = l.location_id
ORDER BY v.vehicle_id;


-- 2. Display available vehicles
-- What it does:
-- - Filters the fleet to return only vehicles currently available for booking (status = 'AVAILABLE').
-- - Joins 'locations' to retrieve branch name and city where each available vehicle is stationed.
-- - Displays key customer-facing attributes: brand, model, type, daily rental price, seating capacity, and current fuel level.
-- - Orders results by price_per_day in ascending order so customers see the most affordable options first.
SELECT 
    v.vehicle_id, 
    v.brand, 
    v.model, 
    v.type, 
    v.price_per_day, 
    v.seats, 
    v.current_fuel_level, 
    l.name AS location_name, 
    l.city
FROM vehicles v
JOIN locations l ON v.location_id = l.location_id
WHERE v.status = 'AVAILABLE'
ORDER BY v.price_per_day ASC;


-- 3. Search vehicles by vehicle type (e.g., 'SUV')
-- What it does:
-- - Filters the fleet to find vehicles belonging to a specific body/vehicle category (e.g., type = 'SUV').
-- - Joins 'locations' to include the city where each matching vehicle is based.
-- - Returns vehicle identification, make, model, type, rental rate, operational status, and city.
-- - Sorts the results alphabetically by brand, then by model.
SELECT 
    v.vehicle_id, 
    v.brand, 
    v.model, 
    v.type, 
    v.price_per_day, 
    v.status, 
    l.city
FROM vehicles v
JOIN locations l ON v.location_id = l.location_id
WHERE v.type = 'SUV'
ORDER BY v.brand, v.model;


-- 4. Search vehicles by price range (e.g., between 2000 and 6000 per day)
-- What it does:
-- - Filters vehicles whose daily rental price falls within a specified budget window (BETWEEN 2000.00 AND 6000.00).
-- - Joins 'locations' to provide the pickup branch name for each vehicle.
-- - Orders matching vehicles by price_per_day descending (premium-to-economy within the selected range).
SELECT 
    v.vehicle_id, 
    v.brand, 
    v.model, 
    v.type, 
    v.price_per_day, 
    v.status, 
    l.name AS location_name
FROM vehicles v
JOIN locations l ON v.location_id = l.location_id
WHERE v.price_per_day BETWEEN 2000.00 AND 6000.00
ORDER BY v.price_per_day DESC;


-- 5. Display vehicles at a specific location (e.g., location_id = 3)
-- What it does:
-- - Retrieves all vehicles physically assigned to a specific branch/location (WHERE location_id = 3).
-- - Displays vehicle identifier, brand, model, registration plate number, type, current status, and daily rental rate.
-- - Orders records primarily by status (grouping by availability) and secondarily by brand name.
SELECT 
    v.vehicle_id, 
    v.brand, 
    v.model, 
    v.vehicle_number, 
    v.type, 
    v.status, 
    v.price_per_day
FROM vehicles v
WHERE v.location_id = 3
ORDER BY v.status, v.brand;


-- 6. Display customer booking history (e.g., customer_id = 1)
-- What it does:
-- - Fetches the complete rental reservation history for a specific customer (WHERE customer_id = 1).
-- - Joins 'vehicles' to show the vehicle brand and model rented for each reservation.
-- - Performs a LEFT JOIN with 'payments' to include payment status (e.g., PAID, PENDING) and payment method if recorded.
-- - Sorts reservations chronologically with the most recent pickup datetime first (ORDER BY pickup_datetime DESC).
SELECT 
    b.booking_id, 
    v.brand, 
    v.model, 
    b.pickup_datetime, 
    b.return_datetime, 
    b.total_amount, 
    b.status AS booking_status,
    p.payment_status,
    p.payment_method
FROM bookings b
JOIN vehicles v ON b.vehicle_id = v.vehicle_id
LEFT JOIN payments p ON b.booking_id = p.booking_id
WHERE b.customer_id = 1
ORDER BY b.pickup_datetime DESC;


-- 7. Display rental company fleet (e.g., company_id = 1)
-- What it does:
-- - Lists the entire vehicle inventory owned by a specific rental agency (WHERE company_id = 1).
-- - Joins 'locations' to show the current branch location name where each fleet vehicle is situated.
-- - Displays vehicle license number, make, model, vehicle class, and current operational status.
-- - Orders the fleet by status and vehicle_id for fleet management overview.
SELECT 
    v.vehicle_id, 
    v.vehicle_number, 
    v.brand, 
    v.model, 
    v.type, 
    v.status, 
    l.name AS current_location
FROM vehicles v
JOIN locations l ON v.location_id = l.location_id
WHERE v.company_id = 1
ORDER BY v.status, v.vehicle_id;


-- 8. Display vehicles currently under maintenance
-- What it does:
-- - Queries vehicles currently undergoing or awaiting servicing (maintenance status IN ('PENDING', 'IN_PROGRESS')).
-- - Joins 'vehicles' with 'maintenance' records to associate vehicle make, model, and registration plate.
-- - Retrieves service record details including work order number (maintenance_no), issue description, estimated/incurred cost, and service start date.
-- - Orders by service start_date chronologically to highlight ongoing work orders.
SELECT 
    v.vehicle_id, 
    v.vehicle_number, 
    v.brand, 
    v.model, 
    m.maintenance_no, 
    m.description, 
    m.cost, 
    m.start_date, 
    m.status AS maintenance_status
FROM maintenance m
JOIN vehicles v ON m.vehicle_id = v.vehicle_id
WHERE m.status IN ('PENDING', 'IN_PROGRESS')
ORDER BY m.start_date;


-- 9. Display vehicle status history (e.g., vehicle_id = 1)
-- What it does:
-- - Provides an audit trail tracking all lifecycle and status transitions for a specific vehicle (WHERE vehicle_id = 1).
-- - Joins 'vehicle_status_history' with 'users' (LEFT JOIN) to show the email of the staff member or user who initiated the change.
-- - Displays the updated status, timestamp of change, user email, and administrative remarks/comments.
-- - Orders events in reverse chronological order (changed_at DESC) to present the most recent status transition first.
SELECT 
    h.history_id, 
    h.status, 
    h.changed_at, 
    u.email AS updated_by, 
    h.comments
FROM vehicle_status_history h
LEFT JOIN users u ON h.updated_by_user_id = u.user_id
WHERE h.vehicle_id = 1
ORDER BY h.changed_at DESC;


-- 10. Display messages for a booking (e.g., booking_id = 3)
-- What it does:
-- - Retrieves the conversation and messaging thread associated with a specific booking (WHERE booking_id = 3).
-- - Joins 'messages' with 'users' to show sender details (sender email and role: 'customer' or 'owner').
-- - Displays the message body, timestamp sent, and read receipt flag (is_read).
-- - Orders the messages chronologically (ORDER BY sent_at ASC) to preserve conversational context.
SELECT 
    m.message_id, 
    u.email AS sender, 
    u.role AS sender_role, 
    m.message_text, 
    m.sent_at, 
    m.is_read
FROM messages m
JOIN users u ON m.sender_user_id = u.user_id
WHERE m.booking_id = 3
ORDER BY m.sent_at ASC;
