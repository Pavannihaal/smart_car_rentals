-- SmartCar Database Schema

-- Drop tables if they exist (for clean re-run)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS vehicle_status_history CASCADE;
DROP TABLE IF EXISTS maintenance CASCADE;
DROP TABLE IF EXISTS vehicle_inspections CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS rental_companies CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users Table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('customer', 'owner')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Customers Table
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    license_status VARCHAR(50) NOT NULL CHECK (license_status IN ('PENDING', 'VERIFIED', 'REJECTED')) DEFAULT 'PENDING',
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Rental Companies Table
CREATE TABLE rental_companies (
    company_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Locations Table
CREATE TABLE locations (
    location_id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES rental_companies(company_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL
);

-- 5. Vehicles Table
CREATE TABLE vehicles (
    vehicle_id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES rental_companies(company_id) ON DELETE RESTRICT,
    location_id INT NOT NULL REFERENCES locations(location_id) ON DELETE RESTRICT,
    vehicle_number VARCHAR(50) UNIQUE NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INT NOT NULL CHECK (year >= 1900),
    type VARCHAR(50) NOT NULL CHECK (type IN ('Sedan', 'SUV', 'Hatchback', 'Luxury', 'Truck')),
    fuel_type VARCHAR(50) NOT NULL CHECK (fuel_type IN ('Petrol', 'Diesel', 'Electric', 'Hybrid')),
    transmission VARCHAR(50) NOT NULL CHECK (transmission IN ('Manual', 'Automatic')),
    price_per_day NUMERIC(10, 2) NOT NULL CHECK (price_per_day > 0),
    seats INT NOT NULL CHECK (seats > 0) DEFAULT 5,
    mileage INT NOT NULL CHECK (mileage >= 0),
    status VARCHAR(50) NOT NULL CHECK (status IN (
        'AVAILABLE', 'RESERVED', 'RENTED', 'RETURNED', 
        'INSPECTION', 'CLEANING', 'MAINTENANCE', 'READY', 'INACTIVE'
    )) DEFAULT 'AVAILABLE',
    current_fuel_level INT NOT NULL CHECK (current_fuel_level BETWEEN 0 AND 100) DEFAULT 100,
    rating NUMERIC(3, 2) DEFAULT 0.0 CHECK (rating BETWEEN 0 AND 5),
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Bookings Table
CREATE TABLE bookings (
    booking_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
    vehicle_id INT NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
    pickup_datetime TIMESTAMP NOT NULL,
    return_datetime TIMESTAMP NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(50) NOT NULL CHECK (status IN (
        'PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'
    )) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_dates CHECK (return_datetime > pickup_datetime)
);

-- 7. Payments Table
CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    booking_id INT NOT NULL REFERENCES bookings(booking_id) ON DELETE RESTRICT,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('UPI', 'CARD', 'CASH')),
    payment_status VARCHAR(50) NOT NULL CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')) DEFAULT 'PENDING',
    transaction_reference VARCHAR(100),
    paid_at TIMESTAMP
);

-- 8. Vehicle Inspections Table (Weak Entity dependent on Bookings)
CREATE TABLE vehicle_inspections (
    booking_id INT NOT NULL REFERENCES bookings(booking_id) ON DELETE RESTRICT,
    inspection_no INT NOT NULL,
    inspector_name VARCHAR(255) NOT NULL,
    inspection_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fuel_level INT NOT NULL CHECK (fuel_level BETWEEN 0 AND 100),
    odometer INT NOT NULL CHECK (odometer >= 0),
    body_condition VARCHAR(100) NOT NULL,
    interior_condition VARCHAR(100) NOT NULL,
    is_clean BOOLEAN NOT NULL DEFAULT TRUE,
    issues_found TEXT,
    status VARCHAR(50) NOT NULL CHECK (status IN ('GOOD', 'MINOR_ISSUE', 'MAJOR_ISSUE')),
    PRIMARY KEY (booking_id, inspection_no)
);

-- 9. Maintenance Table (Weak Entity dependent on Vehicles)
CREATE TABLE maintenance (
    vehicle_id INT NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
    maintenance_no INT NOT NULL,
    description TEXT NOT NULL,
    cost NUMERIC(10, 2) NOT NULL CHECK (cost >= 0),
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')) DEFAULT 'PENDING',
    PRIMARY KEY (vehicle_id, maintenance_no)
);

-- 10. Vehicle Status History Table
CREATE TABLE vehicle_status_history (
    history_id SERIAL PRIMARY KEY,
    vehicle_id INT NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL CHECK (status IN (
        'AVAILABLE', 'RESERVED', 'RENTED', 'RETURNED', 
        'INSPECTION', 'CLEANING', 'MAINTENANCE', 'READY', 'INACTIVE'
    )),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by_user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    comments TEXT
);

-- 11. Reviews Table (completed booking can have at most one review)
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    booking_id INT UNIQUE NOT NULL REFERENCES bookings(booking_id) ON DELETE RESTRICT,
    customer_id INT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
    vehicle_id INT NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Messages Table (Booking-linked messages)
CREATE TABLE messages (
    message_id SERIAL PRIMARY KEY,
    booking_id INT NOT NULL REFERENCES bookings(booking_id) ON DELETE RESTRICT,
    sender_user_id INT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    message_text TEXT NOT NULL CHECK (TRIM(message_text) <> ''),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN NOT NULL DEFAULT FALSE
);

-- Index Definitions
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_company ON vehicles(company_id);
CREATE INDEX idx_vehicles_location ON vehicles(location_id);
CREATE INDEX idx_bookings_vehicle ON bookings(vehicle_id);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_dates ON bookings(pickup_datetime, return_datetime);
CREATE INDEX idx_maintenance_vehicle ON maintenance(vehicle_id);
CREATE INDEX idx_vehicle_status_history_vehicle ON vehicle_status_history(vehicle_id, changed_at);
CREATE INDEX idx_messages_booking_sent ON messages(booking_id, sent_at);
