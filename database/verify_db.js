// SmartCar DB Validation Script
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: 'postgres'
});

async function run() {
  try {
    await client.connect();
    console.log('Successfully connected to default postgres database.');

    // 1. Create smartcar_db if not exists
    console.log('Re-creating smartcar_db...');
    await client.query('DROP DATABASE IF EXISTS smartcar_db');
    await client.query('CREATE DATABASE smartcar_db');
    console.log('Database smartcar_db created.');
    await client.end();

    // 2. Connect to smartcar_db
    const appClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: 'smartcar_db'
    });
    await appClient.connect();
    console.log('Connected to smartcar_db.');

    // 3. Run schema.sql
    console.log('Executing schema.sql...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await appClient.query(schemaSql);
    console.log('schema.sql executed successfully.');

    // 4. Run seed.sql
    console.log('Executing seed.sql...');
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    await appClient.query(seedSql);
    console.log('seed.sql executed successfully.');

    // 5. Run Validation tests (Phase 2E)
    console.log('\n======================================');
    console.log('RUNNING SCHEMA CONSTRAINT VALIDATION');
    console.log('======================================');

    // Test 1: Duplicate email fails
    try {
      await appClient.query("INSERT INTO users (email, password_hash, role) VALUES ('alice@gmail.com', 'hash', 'customer')");
      console.log('FAIL: Duplicate email succeeded.');
    } catch (e) {
      console.log('PASS: Duplicate email failed as expected:', e.message);
    }

    // Test 2: Duplicate vehicle number fails
    try {
      await appClient.query("INSERT INTO vehicles (company_id, location_id, vehicle_number, brand, model, year, type, fuel_type, transmission, price_per_day, seats, mileage) VALUES (1, 1, 'MH-02-AB-1234', 'Honda', 'Civic', 2022, 'Sedan', 'Petrol', 'Automatic', 2500.00, 5, 10000)");
      console.log('FAIL: Duplicate vehicle number succeeded.');
    } catch (e) {
      console.log('PASS: Duplicate vehicle number failed as expected:', e.message);
    }

    // Test 3: Invalid rating fails
    try {
      await appClient.query("INSERT INTO reviews (booking_id, customer_id, vehicle_id, rating, comment) VALUES (2, 2, 2, 6, 'Too good!')");
      console.log('FAIL: Invalid rating (>5) succeeded.');
    } catch (e) {
      console.log('PASS: Invalid rating failed as expected:', e.message);
    }

    // Test 4: Negative price fails
    try {
      await appClient.query("INSERT INTO vehicles (company_id, location_id, vehicle_number, brand, model, year, type, fuel_type, transmission, price_per_day, seats, mileage) VALUES (1, 1, 'MH-02-XX-9999', 'Honda', 'Civic', 2022, 'Sedan', 'Petrol', 'Automatic', -100.00, 5, 10000)");
      console.log('FAIL: Negative price succeeded.');
    } catch (e) {
      console.log('PASS: Negative price failed as expected:', e.message);
    }

    // Test 5: Invalid booking date range fails (return_datetime <= pickup_datetime)
    try {
      await appClient.query("INSERT INTO bookings (customer_id, vehicle_id, pickup_datetime, return_datetime, total_amount, status) VALUES (1, 1, '2026-09-01 12:00:00', '2026-09-01 10:00:00', 5000.00, 'PENDING')");
      console.log('FAIL: Invalid booking dates succeeded.');
    } catch (e) {
      console.log('PASS: Invalid booking dates failed as expected:', e.message);
    }

    // Test 6: Invalid foreign key fails
    try {
      await appClient.query("INSERT INTO bookings (customer_id, vehicle_id, pickup_datetime, return_datetime, total_amount, status) VALUES (999, 1, '2026-09-01 12:00:00', '2026-09-02 12:00:00', 5000.00, 'PENDING')");
      console.log('FAIL: Invalid customer foreign key succeeded.');
    } catch (e) {
      console.log('PASS: Invalid customer foreign key failed as expected:', e.message);
    }

    // Test 7: Maintenance for nonexistent vehicle fails
    try {
      await appClient.query("INSERT INTO maintenance (vehicle_id, maintenance_no, description, cost, start_date, status) VALUES (999, 1, 'Fix engine', 5000.00, '2026-08-27', 'PENDING')");
      console.log('FAIL: Maintenance for nonexistent vehicle succeeded.');
    } catch (e) {
      console.log('PASS: Maintenance for nonexistent vehicle failed as expected:', e.message);
    }

    // Test 8: Inspection for nonexistent booking fails
    try {
      await appClient.query("INSERT INTO vehicle_inspections (booking_id, inspection_no, inspector_name, fuel_level, odometer, body_condition, interior_condition, status) VALUES (999, 1, 'Rahul', 90, 1000, 'GOOD', 'GOOD', 'GOOD')");
      console.log('FAIL: Inspection for nonexistent booking succeeded.');
    } catch (e) {
      console.log('PASS: Inspection for nonexistent booking failed as expected:', e.message);
    }

    // Test 9: Duplicate review for one booking fails
    try {
      await appClient.query("INSERT INTO reviews (booking_id, customer_id, vehicle_id, rating, comment) VALUES (1, 1, 1, 4, 'Second review')");
      console.log('FAIL: Duplicate review succeeded.');
    } catch (e) {
      console.log('PASS: Duplicate review failed as expected:', e.message);
    }

    // Test 10: Empty message fails
    try {
      await appClient.query("INSERT INTO messages (booking_id, sender_user_id, message_text) VALUES (3, 3, '   ')");
      console.log('FAIL: Empty/whitespace message succeeded.');
    } catch (e) {
      console.log('PASS: Empty/whitespace message failed as expected:', e.message);
    }

    // Test 11: Invalid fuel level fails
    try {
      await appClient.query("INSERT INTO vehicle_inspections (booking_id, inspection_no, inspector_name, fuel_level, odometer, body_condition, interior_condition, status) VALUES (1, 2, 'Rahul', 150, 1000, 'GOOD', 'GOOD', 'GOOD')");
      console.log('FAIL: Invalid fuel level (>100) succeeded.');
    } catch (e) {
      console.log('PASS: Invalid fuel level failed as expected:', e.message);
    }

    // 6. Run queries.sql and output results
    console.log('\n======================================');
    console.log('EXECUTING PREDEFINED DBMS QUERIES');
    console.log('======================================');

    const queriesSql = fs.readFileSync(path.join(__dirname, 'queries.sql'), 'utf8');
    const queryBlocks = queriesSql.match(/-- \d+\.[\s\S]*?(?=(?:\r?\n-- \d+\.|\s*$))/g) || [];
    const queries = queryBlocks.map((block) => block.replace(/^--[^\n]*\r?\n/, '').trim());

    const queryNames = [
      'Display all vehicles',
      'Display available vehicles',
      'Search vehicles by vehicle type (SUV)',
      'Search vehicles by price range (2000-6000)',
      'Display vehicles at specific location (location_id = 3)',
      'Display customer booking history (customer_id = 1)',
      'Display rental company fleet (company_id = 1)',
      'Display vehicles currently under maintenance',
      'Display vehicle status history (vehicle_id = 1)',
      'Display messages for a booking (booking_id = 3)'
    ];

    for (let i = 0; i < queries.length; i++) {
      console.log(`\nQuery ${i + 1}: ${queryNames[i]}`);
      const res = await appClient.query(queries[i]);
      console.log('Result Rows count:', res.rowCount);
      console.table(res.rows.slice(0, 5));
    }

    await appClient.end();
    console.log('\nAll DBMS Phase 2 checks completed successfully!');
  } catch (err) {
    console.error('Database validation error:', err);
  }
}

run();
