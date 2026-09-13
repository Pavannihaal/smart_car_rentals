-- SmartCar DBMS Predefined Query Demonstrations

-- 1. Display all vehicles (showing company name and location name)
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
