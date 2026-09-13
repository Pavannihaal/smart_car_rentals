-- SmartCar Seed Data

-- Clear existing data
TRUNCATE TABLE
    messages,
    reviews,
    vehicle_status_history,
    maintenance,
    vehicle_inspections,
    payments,
    bookings,
    vehicles,
    locations,
    rental_companies,
    customers,
    users
RESTART IDENTITY CASCADE;

-- 1. Insert Users (12 records)
-- Passwords are dummy hashes representing BCrypt output
INSERT INTO users (user_id, email, password_hash, role) VALUES
(1, 'alice@gmail.com', '$2b$10$wN1d5uG5W1J6XfE1N/lDk.2XzVpTqJmDk0N9e7G4U2k.x3BfK1hKe', 'customer'),
(2, 'bob@yahoo.com', '$2b$10$wN1d5uG5W1J6XfE1N/lDk.2XzVpTqJmDk0N9e7G4U2k.x3BfK1hKe', 'customer'),
(3, 'charlie@gmail.com', '$2b$10$wN1d5uG5W1J6XfE1N/lDk.2XzVpTqJmDk0N9e7G4U2k.x3BfK1hKe', 'customer'),
(4, 'diana@hotmail.com', '$2b$10$wN1d5uG5W1J6XfE1N/lDk.2XzVpTqJmDk0N9e7G4U2k.x3BfK1hKe', 'customer'),
(5, 'evan@gmail.com', '$2b$10$wN1d5uG5W1J6XfE1N/lDk.2XzVpTqJmDk0N9e7G4U2k.x3BfK1hKe', 'customer'),
(6, 'fiona@gmail.com', '$2b$10$wN1d5uG5W1J6XfE1N/lDk.2XzVpTqJmDk0N9e7G4U2k.x3BfK1hKe', 'customer'),
(7, 'george@gmail.com', '$2b$10$wN1d5uG5W1J6XfE1N/lDk.2XzVpTqJmDk0N9e7G4U2k.x3BfK1hKe', 'customer'),
(8, 'hannah@gmail.com', '$2b$10$wN1d5uG5W1J6XfE1N/lDk.2XzVpTqJmDk0N9e7G4U2k.x3BfK1hKe', 'customer'),
(9, 'apex_owner@gmail.com', '$2b$10$wN1d5uG5W1J6XfE1N/lDk.2XzVpTqJmDk0N9e7G4U2k.x3BfK1hKe', 'owner'),
(10, 'elite_owner@gmail.com', '$2b$10$wN1d5uG5W1J6XfE1N/lDk.2XzVpTqJmDk0N9e7G4U2k.x3BfK1hKe', 'owner'),
(11, 'zoom_owner@gmail.com', '$2b$10$wN1d5uG5W1J6XfE1N/lDk.2XzVpTqJmDk0N9e7G4U2k.x3BfK1hKe', 'owner'),
(12, 'ian@gmail.com', '$2b$10$wN1d5uG5W1J6XfE1N/lDk.2XzVpTqJmDk0N9e7G4U2k.x3BfK1hKe', 'customer');

-- 2. Insert Customers (9 records)
INSERT INTO customers (customer_id, user_id, name, phone, license_number, license_status, address) VALUES
(1, 1, 'Alice Johnson', '+919876543210', 'DL-1234567', 'VERIFIED', '101, Bandra West, Mumbai'),
(2, 2, 'Bob Smith', '+919876543211', 'DL-7654321', 'VERIFIED', '202, Indiranagar, Bangalore'),
(3, 3, 'Charlie Brown', '+919876543212', 'DL-1122334', 'PENDING', '303, Connaught Place, New Delhi'),
(4, 4, 'Diana Prince', '+919876543213', 'DL-9988776', 'VERIFIED', '404, Gachibowli, Hyderabad'),
(5, 5, 'Evan Wright', '+919876543214', 'DL-5544332', 'VERIFIED', '505, Salt Lake, Kolkata'),
(6, 6, 'Fiona Gallagher', '+919876543215', 'DL-2233445', 'REJECTED', '606, Koregaon Park, Pune'),
(7, 7, 'George Costanza', '+919876543216', 'DL-7788990', 'VERIFIED', '707, Adyar, Chennai'),
(8, 8, 'Hannah Baker', '+919876543217', 'DL-4455667', 'VERIFIED', '808, SG Highway, Ahmedabad'),
(9, 12, 'Ian Malcolm', '+919876543218', 'DL-8899001', 'VERIFIED', '909, Jayanagar, Bangalore');

-- 3. Insert Rental Companies (3 records)
INSERT INTO rental_companies (company_id, user_id, company_name, contact_number, address) VALUES
(1, 9, 'Apex Car Rentals', '+912288887777', 'Apex Towers, Andheri East, Mumbai'),
(2, 10, 'Elite Fleet Management', '+918044445555', 'Elite Business Hub, MG Road, Bangalore'),
(3, 11, 'ZoomRentals', '+911166665555', 'Zoom Corporate Plaza, Sector 62, Noida');

-- 4. Insert Locations (5 records)
INSERT INTO locations (location_id, company_id, name, address, city, state, zip_code) VALUES
(1, 1, 'Apex Downtown', 'Near Station Road, Andheri East', 'Mumbai', 'Maharashtra', '400069'),
(2, 1, 'Apex Airport T2', 'Arrivals Gate 4, Chhatrapati Shivaji Airport', 'Mumbai', 'Maharashtra', '400099'),
(3, 2, 'Elite Luxury Lounge', 'Terminal 1 Plaza, Kempegowda Airport', 'Bangalore', 'Karnataka', '560300'),
(4, 3, 'Zoom Airport Hub', 'T3 Terminal Plaza, Indira Gandhi Airport', 'New Delhi', 'Delhi', '110037'),
(5, 3, 'Zoom Central Station', 'Near Exit 1, New Delhi Railway Station', 'New Delhi', 'Delhi', '110001');

-- 5. Insert Vehicles (10 records)
INSERT INTO vehicles (vehicle_id, company_id, location_id, vehicle_number, brand, model, year, type, fuel_type, transmission, price_per_day, seats, mileage, status, current_fuel_level, rating, image_url) VALUES
(1, 1, 1, 'MH-02-AB-1234', 'Honda', 'Civic', 2022, 'Sedan', 'Petrol', 'Automatic', 2500.00, 5, 15000, 'AVAILABLE', 95, 4.8, 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'),
(2, 1, 2, 'MH-02-CD-5678', 'Toyota', 'Fortuner', 2023, 'SUV', 'Diesel', 'Automatic', 5000.00, 7, 25000, 'RESERVED', 100, 4.5, 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'),
(3, 1, 1, 'MH-02-EF-9012', 'Hyundai', 'i20', 2021, 'Hatchback', 'Petrol', 'Manual', 1500.00, 5, 32000, 'RENTED', 80, 4.3, 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'),
(4, 2, 3, 'KA-03-GH-3456', 'BMW', '5 Series', 2023, 'Luxury', 'Petrol', 'Automatic', 12000.00, 5, 8000, 'CLEANING', 90, 4.9, 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'),
(5, 2, 3, 'KA-03-IJ-7890', 'Ford', 'Ranger', 2022, 'Truck', 'Diesel', 'Automatic', 4500.00, 5, 18000, 'MAINTENANCE', 75, 4.2, 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'),
(6, 3, 4, 'DL-01-KL-1212', 'Tesla', 'Model 3', 2023, 'Sedan', 'Electric', 'Automatic', 6000.00, 5, 10000, 'READY', 100, 4.7, 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'),
(7, 3, 5, 'DL-01-MN-3434', 'Maruti', 'Swift', 2019, 'Hatchback', 'Petrol', 'Manual', 1200.00, 5, 65000, 'INACTIVE', 40, 4.0, 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'),
(8, 3, 4, 'DL-01-OP-5656', 'Mahindra', 'Thar', 2022, 'SUV', 'Diesel', 'Manual', 3500.00, 4, 15000, 'AVAILABLE', 90, 4.4, 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'),
(9, 1, 2, 'MH-02-QR-7878', 'Tata', 'Nexon EV', 2023, 'SUV', 'Electric', 'Automatic', 2800.00, 5, 12000, 'INSPECTION', 15, 4.6, 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'),
(10, 2, 3, 'KA-03-ST-9090', 'Audi', 'Q7', 2023, 'SUV', 'Hybrid', 'Automatic', 15000.00, 7, 5000, 'RETURNED', 50, 4.9, 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80');

-- 6. Insert Bookings (13 records)
INSERT INTO bookings (booking_id, customer_id, vehicle_id, pickup_datetime, return_datetime, total_amount, status, created_at) VALUES
(1, 1, 1, '2026-08-01 09:00:00', '2026-08-05 18:00:00', 10000.00, 'COMPLETED', '2026-07-28 10:00:00'),
(2, 2, 2, '2026-08-28 10:00:00', '2026-08-30 18:00:00', 10000.00, 'CONFIRMED', '2026-08-26 14:00:00'),
(3, 3, 3, '2026-08-25 09:00:00', '2026-08-29 18:00:00', 6000.00, 'ACTIVE', '2026-08-24 11:30:00'),
(4, 4, 4, '2026-08-20 10:00:00', '2026-08-24 10:00:00', 48000.00, 'COMPLETED', '2026-08-18 09:00:00'),
(5, 5, 5, '2026-08-15 09:00:00', '2026-08-18 18:00:00', 13500.00, 'COMPLETED', '2026-08-13 15:00:00'),
(6, 7, 6, '2026-08-26 09:00:00', '2026-08-27 18:00:00', 6000.00, 'COMPLETED', '2026-08-25 17:00:00'),
(7, 8, 8, '2026-08-05 09:00:00', '2026-08-08 18:00:00', 10500.00, 'COMPLETED', '2026-08-03 10:00:00'),
(8, 9, 9, '2026-08-24 09:00:00', '2026-08-27 18:00:00', 8400.00, 'COMPLETED', '2026-08-22 13:00:00'),
(9, 1, 10, '2026-08-25 09:00:00', '2026-08-27 09:00:00', 30000.00, 'COMPLETED', '2026-08-23 16:00:00'),
(10, 2, 1, '2026-09-01 09:00:00', '2026-09-03 18:00:00', 5000.00, 'PENDING', '2026-08-27 12:00:00'),
(11, 4, 3, '2026-08-10 09:00:00', '2026-08-12 18:00:00', 3000.00, 'COMPLETED', '2026-08-08 10:00:00'),
(12, 5, 6, '2026-09-05 09:00:00', '2026-09-10 18:00:00', 30000.00, 'CONFIRMED', '2026-08-27 14:00:00'),
(13, 7, 2, '2026-08-10 09:00:00', '2026-08-12 18:00:00', 10000.00, 'CANCELLED', '2026-08-08 11:00:00');

-- 7. Insert Payments (11 records)
INSERT INTO payments (payment_id, booking_id, amount, payment_method, payment_status, transaction_reference, paid_at) VALUES
(1, 1, 10000.00, 'CARD', 'PAID', 'TXN-90128309', '2026-07-28 10:05:00'),
(2, 2, 10000.00, 'UPI', 'PAID', 'TXN-19028302', '2026-08-26 14:10:00'),
(3, 3, 6000.00, 'CASH', 'PAID', 'TXN-CASH0001', '2026-08-25 09:15:00'),
(4, 4, 48000.00, 'CARD', 'PAID', 'TXN-49028492', '2026-08-18 09:12:00'),
(5, 5, 13500.00, 'UPI', 'PAID', 'TXN-58201830', '2026-08-13 15:02:00'),
(6, 6, 6000.00, 'CARD', 'PAID', 'TXN-69201930', '2026-08-25 17:15:00'),
(7, 7, 10500.00, 'UPI', 'PAID', 'TXN-79283921', '2026-08-03 10:05:00'),
(8, 8, 8400.00, 'CARD', 'PAID', 'TXN-89283923', '2026-08-22 13:10:00'),
(9, 9, 30000.00, 'UPI', 'PAID', 'TXN-99201023', '2026-08-23 16:15:00'),
(10, 10, 5000.00, 'UPI', 'PENDING', NULL, NULL),
(11, 13, 10000.00, 'UPI', 'REFUNDED', 'TXN-REF92830', '2026-08-12 10:00:00');

-- 8. Insert Vehicle Inspections (8 records)
-- Composite primary key (booking_id, inspection_no)
INSERT INTO vehicle_inspections (booking_id, inspection_no, inspector_name, inspection_date, fuel_level, odometer, body_condition, interior_condition, is_clean, issues_found, status) VALUES
(1, 1, 'Inspector Rahul', '2026-08-05 18:30:00', 90, 15500, 'GOOD', 'GOOD', TRUE, NULL, 'GOOD'),
(4, 1, 'Inspector Amit', '2026-08-24 10:30:00', 95, 9200, 'GOOD', 'GOOD', TRUE, NULL, 'GOOD'),
(5, 1, 'Inspector Amit', '2026-08-18 18:45:00', 80, 20300, 'MINOR_ISSUE', 'GOOD', FALSE, 'Rear bumper has minor scratch, suspension feels slightly loose.', 'MINOR_ISSUE'),
(6, 1, 'Inspector Pooja', '2026-08-27 18:30:00', 100, 10200, 'GOOD', 'GOOD', TRUE, NULL, 'GOOD'),
(7, 1, 'Inspector Pooja', '2026-08-08 18:20:00', 92, 16100, 'GOOD', 'GOOD', TRUE, NULL, 'GOOD'),
(8, 1, 'Inspector Rahul', '2026-08-27 18:40:00', 15, 13500, 'MINOR_ISSUE', 'GOOD', TRUE, 'Left wing mirror glass is cracked.', 'MINOR_ISSUE'),
(9, 1, 'Inspector Amit', '2026-08-27 09:30:00', 50, 5600, 'GOOD', 'GOOD', FALSE, 'Needs interior vacuuming.', 'GOOD'),
(11, 1, 'Inspector Rahul', '2026-08-12 18:30:00', 98, 33500, 'GOOD', 'GOOD', TRUE, NULL, 'GOOD');

-- 9. Insert Maintenance (5 records)
-- Composite primary key (vehicle_id, maintenance_no)
INSERT INTO maintenance (vehicle_id, maintenance_no, description, cost, start_date, end_date, status) VALUES
(5, 1, 'Suspension tightening and rear bumper paint correction', 12500.00, '2026-08-19', NULL, 'IN_PROGRESS'),
(1, 1, 'Routine Engine Oil and Oil Filter Change', 3200.00, '2026-07-10', '2026-07-11', 'COMPLETED'),
(3, 1, 'AC gas recharge and cabin filter cleaning', 2100.00, '2026-08-01', '2026-08-02', 'COMPLETED'),
(8, 1, 'Front brake pads replacement', 4800.00, '2026-08-10', '2026-08-11', 'COMPLETED'),
(6, 1, 'Software update and tire balancing', 1500.00, '2026-08-20', '2026-08-21', 'COMPLETED');

-- 10. Insert Vehicle Status History (46 records)
-- Showing transitions along the lifecycle pipeline
INSERT INTO vehicle_status_history (vehicle_id, status, changed_at, updated_by_user_id, comments) VALUES
-- Vehicle 1 Transitions (8 records)
(1, 'AVAILABLE', '2026-07-01 09:00:00', 9, 'Initial activation'),
(1, 'RESERVED', '2026-07-28 10:00:00', 9, 'Booked by Alice (Booking 1)'),
(1, 'RENTED', '2026-08-01 09:00:00', 9, 'Handed over to Alice'),
(1, 'RETURNED', '2026-08-05 18:00:00', 9, 'Key returned by Alice'),
(1, 'INSPECTION', '2026-08-05 18:30:00', 9, 'Inspection started'),
(1, 'CLEANING', '2026-08-05 18:45:00', 9, 'Inspection passed, sent to cleaning'),
(1, 'READY', '2026-08-06 10:00:00', 9, 'Cleaning complete'),
(1, 'AVAILABLE', '2026-08-06 11:00:00', 9, 'Back on rent'),

-- Vehicle 2 Transitions (2 records)
(2, 'AVAILABLE', '2026-07-01 09:00:00', 9, 'Initial activation'),
(2, 'RESERVED', '2026-08-26 14:00:00', 9, 'Booked by Bob (Booking 2)'),

-- Vehicle 3 Transitions (10 records)
(3, 'AVAILABLE', '2026-07-01 09:00:00', 9, 'Initial activation'),
(3, 'RESERVED', '2026-08-08 10:00:00', 9, 'Booked by Diana (Booking 11)'),
(3, 'RENTED', '2026-08-10 09:00:00', 9, 'Handed over to Diana'),
(3, 'RETURNED', '2026-08-12 18:00:00', 9, 'Returned by Diana'),
(3, 'INSPECTION', '2026-08-12 18:15:00', 9, 'Inspection started'),
(3, 'CLEANING', '2026-08-12 18:40:00', 9, 'Passed inspection, cleaning'),
(3, 'READY', '2026-08-13 09:00:00', 9, 'Ready for next booking'),
(3, 'AVAILABLE', '2026-08-13 10:00:00', 9, 'Available again'),
(3, 'RESERVED', '2026-08-24 11:30:00', 9, 'Booked by Charlie (Booking 3)'),
(3, 'RENTED', '2026-08-25 09:00:00', 9, 'Handed over to Charlie'),

-- Vehicle 4 Transitions (6 records)
(4, 'AVAILABLE', '2026-07-01 09:00:00', 10, 'Initial activation'),
(4, 'RESERVED', '2026-08-18 09:00:00', 10, 'Booked by Diana (Booking 4)'),
(4, 'RENTED', '2026-08-20 10:00:00', 10, 'Handed over to Diana'),
(4, 'RETURNED', '2026-08-24 10:00:00', 10, 'Returned by Diana'),
(4, 'INSPECTION', '2026-08-24 10:20:00', 10, 'Inspection started'),
(4, 'CLEANING', '2026-08-24 10:45:00', 10, 'Inspection passed, cleaning'),

-- Vehicle 5 Transitions (6 records)
(5, 'AVAILABLE', '2026-07-01 09:00:00', 10, 'Initial activation'),
(5, 'RESERVED', '2026-08-13 15:00:00', 10, 'Booked by Evan (Booking 5)'),
(5, 'RENTED', '2026-08-15 09:00:00', 10, 'Handed over to Evan'),
(5, 'RETURNED', '2026-08-18 18:00:00', 10, 'Returned by Evan'),
(5, 'INSPECTION', '2026-08-18 18:30:00', 10, 'Inspection started'),
(5, 'MAINTENANCE', '2026-08-19 09:00:00', 10, 'Minor issue found, sent to maintenance'),

-- Vehicle 6 Transitions (7 records)
(6, 'AVAILABLE', '2026-07-01 09:00:00', 11, 'Initial activation'),
(6, 'RESERVED', '2026-08-25 17:00:00', 11, 'Booked by George (Booking 6)'),
(6, 'RENTED', '2026-08-26 09:00:00', 11, 'Handed over to George'),
(6, 'RETURNED', '2026-08-27 18:00:00', 11, 'Returned by George'),
(6, 'INSPECTION', '2026-08-27 18:15:00', 11, 'Inspection started'),
(6, 'CLEANING', '2026-08-27 18:40:00', 11, 'Inspection passed, cleaning'),
(6, 'READY', '2026-08-27 20:00:00', 11, 'Ready and charged'),

-- Vehicle 7 Transitions (2 records)
(7, 'AVAILABLE', '2026-07-01 09:00:00', 11, 'Initial activation'),
(7, 'INACTIVE', '2026-08-15 10:00:00', 11, 'Deactivated from fleet due to high age and mileage'),

-- Vehicle 9 Transitions (5 records)
(9, 'AVAILABLE', '2026-07-01 09:00:00', 9, 'Initial activation'),
(9, 'RESERVED', '2026-08-22 13:00:00', 9, 'Booked by Ian (Booking 8)'),
(9, 'RENTED', '2026-08-24 09:00:00', 9, 'Handed over to Ian'),
(9, 'RETURNED', '2026-08-27 18:00:00', 9, 'Returned by Ian'),
(9, 'INSPECTION', '2026-08-27 18:30:00', 9, 'Inspection started'),

-- Vehicle 10 Transitions (5 records)
(10, 'AVAILABLE', '2026-07-01 09:00:00', 10, 'Initial activation'),
(10, 'RESERVED', '2026-08-23 16:00:00', 10, 'Booked by Alice (Booking 9)'),
(10, 'RENTED', '2026-08-25 09:00:00', 10, 'Handed over to Alice'),
(10, 'RETURNED', '2026-08-27 09:00:00', 10, 'Returned by Alice'),
(10, 'INSPECTION', '2026-08-27 09:15:00', 10, 'Inspection started');

-- 11. Insert Reviews (6 records)
INSERT INTO reviews (review_id, booking_id, customer_id, vehicle_id, rating, comment) VALUES
(1, 1, 1, 1, 5, 'Car was clean, driving was smooth. Highly recommend Apex Downtown!'),
(2, 4, 4, 4, 5, 'Absolutely luxurious drive. Smooth pickup at Kempegowda lounge.'),
(3, 5, 5, 5, 3, 'Sturdy truck, but ride was bumpy and there were minor suspension noises.'),
(4, 6, 7, 6, 4, 'Excellent Tesla, clean inside, fully charged. Drop-off took 10 mins.'),
(5, 7, 8, 8, 4, 'Rugged Thar, perfect for my weekend trip. Good service.'),
(6, 11, 4, 3, 5, 'Extremely reliable hatchback. Great mileage inside Delhi congestion.');

-- 12. Insert Messages (10 records)
INSERT INTO messages (message_id, booking_id, sender_user_id, message_text, is_read) VALUES
(1, 3, 3, 'Hello! Just wanted to confirm if the AC is working fine on the i20.', TRUE),
(2, 3, 9, 'Hi Charlie, yes! The AC was just serviced recently. It works perfectly.', TRUE),
(3, 3, 3, 'Great, see you tomorrow morning for the pickup.', FALSE),
(4, 2, 2, 'Hi, does the Fortuner come with a fastag installed?', TRUE),
(5, 2, 9, 'Hi Bob, yes! All our vehicles have active Fastags pre-loaded.', TRUE),
(6, 8, 12, 'Hello, where should I drop off the Nexon EV key at T2?', TRUE),
(7, 8, 9, 'Hi Ian, please hand it over to the desk at Arrivals Gate 4.', TRUE),
(8, 9, 1, 'Hello, I might be 30 minutes late for the drop-off due to traffic.', TRUE),
(9, 9, 10, 'No worries Alice. Just drop it off as soon as you arrive.', TRUE),
(10, 9, 1, 'Thank you! Arriving shortly.', FALSE);

-- Keep sequences aligned with explicit demo IDs so later inserts use the next valid key.
SELECT setval(pg_get_serial_sequence('users', 'user_id'), COALESCE(MAX(user_id), 1), TRUE) FROM users;
SELECT setval(pg_get_serial_sequence('customers', 'customer_id'), COALESCE(MAX(customer_id), 1), TRUE) FROM customers;
SELECT setval(pg_get_serial_sequence('rental_companies', 'company_id'), COALESCE(MAX(company_id), 1), TRUE) FROM rental_companies;
SELECT setval(pg_get_serial_sequence('locations', 'location_id'), COALESCE(MAX(location_id), 1), TRUE) FROM locations;
SELECT setval(pg_get_serial_sequence('vehicles', 'vehicle_id'), COALESCE(MAX(vehicle_id), 1), TRUE) FROM vehicles;
SELECT setval(pg_get_serial_sequence('bookings', 'booking_id'), COALESCE(MAX(booking_id), 1), TRUE) FROM bookings;
SELECT setval(pg_get_serial_sequence('payments', 'payment_id'), COALESCE(MAX(payment_id), 1), TRUE) FROM payments;
SELECT setval(pg_get_serial_sequence('vehicle_status_history', 'history_id'), COALESCE(MAX(history_id), 1), TRUE) FROM vehicle_status_history;
SELECT setval(pg_get_serial_sequence('reviews', 'review_id'), COALESCE(MAX(review_id), 1), TRUE) FROM reviews;
SELECT setval(pg_get_serial_sequence('messages', 'message_id'), COALESCE(MAX(message_id), 1), TRUE) FROM messages;
