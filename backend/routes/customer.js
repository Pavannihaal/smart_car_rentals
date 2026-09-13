const express = require('express');
const { query, withClient } = require('../db/pool');

const router = express.Router();
const BOOKABLE_STATUSES = ['AVAILABLE', 'READY', 'RETURNED'];
const ACTIVE_BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'ACTIVE'];

const vehicleSelect = `
  SELECT
    v.vehicle_id, v.company_id, v.location_id, v.vehicle_number,
    v.brand, v.model, v.year, v.type, v.fuel_type, v.transmission,
    v.price_per_day, v.seats, v.mileage, v.status, v.current_fuel_level,
    v.rating, v.image_url, l.name AS location_name, l.city, rc.company_name
  FROM vehicles v
  JOIN locations l ON l.location_id = v.location_id
  JOIN rental_companies rc ON rc.company_id = v.company_id
`;

function parseDate(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function rentalDays(pickup, returned) {
  const pickupDate = new Date(pickup.getFullYear(), pickup.getMonth(), pickup.getDate());
  const returnDate = new Date(returned.getFullYear(), returned.getMonth(), returned.getDate());
  return Math.max(1, Math.ceil((returnDate - pickupDate) / 86400000));
}

function validatePeriod(pickupValue, returnValue) {
  const pickup = parseDate(pickupValue);
  const returned = parseDate(returnValue);
  if (!pickup || !returned || returned <= pickup) {
    return { error: 'Pickup and return must be valid dates, with return after pickup.' };
  }
  return { pickup, returned };
}

function mapVehicle(row) {
  return {
    ...row,
    price_per_day: Number(row.price_per_day),
    rating: row.rating === null ? null : Number(row.rating)
  };
}

async function getVehicle(vehicleId, client = { query }) {
  const result = await client.query(`${vehicleSelect} WHERE v.vehicle_id = $1`, [vehicleId]);
  return result.rows[0] ? mapVehicle(result.rows[0]) : null;
}

async function hasBookingConflict(vehicleId, pickup, returned, client = { query }) {
  const result = await client.query(
    `SELECT 1 FROM bookings
     WHERE vehicle_id = $1 AND status = ANY($4::varchar[])
       AND pickup_datetime < $3 AND return_datetime > $2 LIMIT 1`,
    [vehicleId, pickup, returned, ACTIVE_BOOKING_STATUSES]
  );
  return result.rowCount > 0;
}

async function getBookingConflicts(vehicleId, pickup, returned, client = { query }) {
  const result = await client.query(
    `SELECT booking_id, pickup_datetime, return_datetime, status
     FROM bookings
     WHERE vehicle_id = $1 AND status = ANY($4::varchar[])
       AND pickup_datetime < $3 AND return_datetime > $2
     ORDER BY pickup_datetime ASC`,
    [vehicleId, pickup, returned, ACTIVE_BOOKING_STATUSES]
  );
  return result.rows;
}

function nextAvailableAfter(conflicts) {
  if (!conflicts.length) return null;
  let cursor = new Date(conflicts[0].return_datetime);
  for (const conflict of conflicts.slice(1)) {
    const pickup = new Date(conflict.pickup_datetime);
    const returned = new Date(conflict.return_datetime);
    if (pickup <= cursor && returned > cursor) cursor = returned;
  }
  return cursor;
}

function requestedCustomerId(req) {
  const value = req.get('x-customer-id') || req.query.customer_id || req.body?.customer_id;
  return Number.isInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;
}

async function requireCustomer(req, client = { query }) {
  const customerId = requestedCustomerId(req);
  if (!customerId) return null;
  const result = await client.query(
    `SELECT c.customer_id, c.user_id, c.name, c.phone, c.license_number, c.license_status, c.address, c.created_at, u.email
     FROM customers c JOIN users u ON u.user_id = c.user_id
     WHERE c.customer_id = $1 AND u.role = 'customer'`,
    [customerId]
  );
  return result.rows[0] || null;
}

const customerBookingSelect = `
  SELECT b.booking_id, b.customer_id, b.vehicle_id, b.pickup_datetime, b.return_datetime,
    b.total_amount, b.status, b.created_at,
    v.brand, v.model, v.type, v.image_url, v.vehicle_number,
    l.name AS location_name, l.city, rc.company_name,
    p.payment_id, p.amount AS payment_amount, p.payment_method,
    p.payment_status, p.transaction_reference, p.paid_at
  FROM bookings b
  JOIN vehicles v ON v.vehicle_id = b.vehicle_id
  JOIN locations l ON l.location_id = v.location_id
  JOIN rental_companies rc ON rc.company_id = v.company_id
  LEFT JOIN LATERAL (
    SELECT * FROM payments payment WHERE payment.booking_id = b.booking_id ORDER BY payment.payment_id DESC LIMIT 1
  ) p ON TRUE
`;

function mapBooking(row) {
  return {
    booking_id: row.booking_id,
    customer_id: row.customer_id,
    vehicle_id: row.vehicle_id,
    vehicle: {
      brand: row.brand,
      model: row.model,
      type: row.type,
      vehicle_number: row.vehicle_number,
      image_url: row.image_url
    },
    location_name: row.location_name,
    city: row.city,
    company_name: row.company_name,
    pickup_datetime: row.pickup_datetime,
    return_datetime: row.return_datetime,
    total_amount: Number(row.total_amount),
    status: row.status,
    created_at: row.created_at,
    payment: row.payment_id ? {
      payment_id: row.payment_id,
      amount: Number(row.payment_amount),
      payment_method: row.payment_method,
      payment_status: row.payment_status,
      transaction_reference: row.transaction_reference,
      paid_at: row.paid_at
    } : null
  };
}

function customerRequired(res, customer) {
  if (customer) return true;
  res.status(401).json({ error: 'customer_session_required', message: 'A valid customer session is required.' });
  return false;
}

router.get('/vehicles', async (req, res, next) => {
  try {
    const { search, category, type, transmission, fuel, fuel_type: fuelType, location, availability, minPrice, maxPrice } = req.query;
    const values = [];
    const conditions = [];

    if (search) {
      values.push(`%${search}%`);
      conditions.push(`(v.brand ILIKE $${values.length} OR v.model ILIKE $${values.length})`);
    }
    if (category || type) {
      values.push(category || type);
      conditions.push(`v.type = $${values.length}`);
    }
    if (transmission) {
      values.push(transmission);
      conditions.push(`v.transmission = $${values.length}`);
    }
    if (fuel || fuelType) {
      values.push(fuel || fuelType);
      conditions.push(`v.fuel_type = $${values.length}`);
    }
    if (location) {
      values.push(`%${location}%`);
      conditions.push(`(l.name ILIKE $${values.length} OR l.city ILIKE $${values.length})`);
    }
    if (availability === 'available') {
      values.push(BOOKABLE_STATUSES);
      conditions.push(`v.status = ANY($${values.length}::varchar[])`);
    }
    if (minPrice !== undefined && minPrice !== '') {
      const value = Number(minPrice);
      if (!Number.isFinite(value) || value < 0) return res.status(400).json({ error: 'minPrice must be a non-negative number.' });
      values.push(value);
      conditions.push(`v.price_per_day >= $${values.length}`);
    }
    if (maxPrice !== undefined && maxPrice !== '') {
      const value = Number(maxPrice);
      if (!Number.isFinite(value) || value < 0) return res.status(400).json({ error: 'maxPrice must be a non-negative number.' });
      values.push(value);
      conditions.push(`v.price_per_day <= $${values.length}`);
    }

    const result = await query(
      `${vehicleSelect}${conditions.length ? ` WHERE ${conditions.join(' AND ')}` : ''} ORDER BY v.price_per_day ASC, v.vehicle_id ASC`,
      values
    );
    res.json({ items: result.rows.map(mapVehicle) });
  } catch (error) {
    next(error);
  }
});

router.get('/vehicles/:id', async (req, res, next) => {
  try {
    const vehicle = await getVehicle(Number(req.params.id));
    if (!vehicle) return res.status(404).json({ error: 'vehicle_not_found', message: 'Vehicle not found.' });
    res.json(vehicle);
  } catch (error) {
    next(error);
  }
});

router.get('/vehicles/:id/availability', async (req, res, next) => {
  try {
    const vehicle = await getVehicle(Number(req.params.id));
    if (!vehicle) return res.status(404).json({ error: 'vehicle_not_found', message: 'Vehicle not found.' });
    const period = validatePeriod(req.query.pickup, req.query.return);
    if (period.error) return res.status(400).json({ error: 'invalid_dates', message: period.error });
    const statusAvailable = BOOKABLE_STATUSES.includes(vehicle.status);
    const conflicts = await getBookingConflicts(vehicle.vehicle_id, period.pickup, period.returned);
    const conflict = conflicts.length > 0;
    const nextAvailable = nextAvailableAfter(conflicts);
    res.json({
      vehicle_id: vehicle.vehicle_id,
      available: statusAvailable && !conflict,
      reason: !statusAvailable ? 'vehicle_status' : conflict ? 'booking_conflict' : null,
      conflict: conflict ? {
        booking_id: conflicts[0].booking_id,
        pickup_datetime: conflicts[0].pickup_datetime,
        return_datetime: conflicts[0].return_datetime,
        status: conflicts[0].status
      } : null,
      next_available_datetime: nextAvailable ? nextAvailable.toISOString() : null,
      pickup_datetime: period.pickup.toISOString(),
      return_datetime: period.returned.toISOString(),
      rental_days: rentalDays(period.pickup, period.returned),
      daily_rate: vehicle.price_per_day
    });
  } catch (error) {
    next(error);
  }
});

router.post('/bookings', async (req, res, next) => {
  const { customer_id: customerId, vehicle_id: vehicleId, pickup_datetime: pickupValue, return_datetime: returnValue } = req.body || {};
  const period = validatePeriod(pickupValue, returnValue);
  if (!Number.isInteger(Number(customerId)) || !Number.isInteger(Number(vehicleId))) {
    return res.status(400).json({ error: 'invalid_request', message: 'customer_id and vehicle_id are required.' });
  }
  if (period.error) return res.status(400).json({ error: 'invalid_dates', message: period.error });

  try {
    const booking = await withClient(async (client) => {
      await client.query('BEGIN');
      try {
        const customer = await client.query(
          `SELECT c.customer_id FROM customers c JOIN users u ON u.user_id = c.user_id WHERE c.customer_id = $1 AND u.role = 'customer'`,
          [Number(customerId)]
        );
        if (!customer.rowCount) {
          const error = new Error('Customer not found.');
          error.status = 404;
          error.code = 'customer_not_found';
          throw error;
        }

        const vehicle = await getVehicle(Number(vehicleId), client);
        if (!vehicle) {
          const error = new Error('Vehicle not found.');
          error.status = 404;
          error.code = 'vehicle_not_found';
          throw error;
        }
        if (!BOOKABLE_STATUSES.includes(vehicle.status)) {
          const error = new Error('Vehicle is not currently bookable.');
          error.status = 409;
          error.code = 'vehicle_unavailable';
          throw error;
        }
        if (await hasBookingConflict(vehicle.vehicle_id, period.pickup, period.returned, client)) {
          const error = new Error('Vehicle is unavailable for the selected dates.');
          error.status = 409;
          error.code = 'booking_conflict';
          throw error;
        }

        const totalAmount = vehicle.price_per_day * rentalDays(period.pickup, period.returned);
        const result = await client.query(
          `INSERT INTO bookings (customer_id, vehicle_id, pickup_datetime, return_datetime, total_amount, status)
           VALUES ($1, $2, $3, $4, $5, 'PENDING')
           RETURNING booking_id, customer_id, vehicle_id, pickup_datetime, return_datetime, total_amount, status, created_at`,
          [Number(customerId), vehicle.vehicle_id, period.pickup, period.returned, totalAmount]
        );
        await client.query('COMMIT');
        return { ...result.rows[0], total_amount: Number(result.rows[0].total_amount), rental_days: rentalDays(period.pickup, period.returned), vehicle };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    });
    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
});

router.get('/customer/bookings', async (req, res, next) => {
  try {
    const customer = await requireCustomer(req);
    if (!customerRequired(res, customer)) return;
    const result = await query(`${customerBookingSelect} WHERE b.customer_id = $1 ORDER BY b.pickup_datetime DESC`, [customer.customer_id]);
    res.json({ items: result.rows.map(mapBooking) });
  } catch (error) {
    next(error);
  }
});

router.get('/customer/bookings/:id', async (req, res, next) => {
  try {
    const customer = await requireCustomer(req);
    if (!customerRequired(res, customer)) return;
    const result = await query(`${customerBookingSelect} WHERE b.booking_id = $1 AND b.customer_id = $2`, [Number(req.params.id), customer.customer_id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'booking_not_found', message: 'Booking not found.' });
    res.json(mapBooking(result.rows[0]));
  } catch (error) {
    next(error);
  }
});

router.get('/customer/payments', async (req, res, next) => {
  try {
    const customer = await requireCustomer(req);
    if (!customerRequired(res, customer)) return;
    const result = await query(
      `SELECT p.payment_id, p.booking_id, p.amount, p.payment_method, p.payment_status,
        p.transaction_reference, p.paid_at, v.brand, v.model
       FROM payments p JOIN bookings b ON b.booking_id = p.booking_id
       JOIN vehicles v ON v.vehicle_id = b.vehicle_id
       WHERE b.customer_id = $1 ORDER BY p.payment_id DESC`,
      [customer.customer_id]
    );
    res.json({ items: result.rows.map((row) => ({ ...row, amount: Number(row.amount) })) });
  } catch (error) {
    next(error);
  }
});

router.get('/customer/profile', async (req, res, next) => {
  try {
    const customer = await requireCustomer(req);
    if (!customerRequired(res, customer)) return;
    res.json(customer);
  } catch (error) {
    next(error);
  }
});

router.patch('/customer/profile', async (req, res, next) => {
  try {
    const customer = await requireCustomer(req);
    if (!customerRequired(res, customer)) return;
    const allowed = ['name', 'phone', 'address'];
    const updates = allowed.filter((field) => req.body?.[field] !== undefined);
    if (!updates.length || updates.some((field) => typeof req.body[field] !== 'string' || !req.body[field].trim())) {
      return res.status(400).json({ error: 'invalid_profile', message: 'Name, phone, and address updates must be non-empty text.' });
    }
    const values = updates.map((field) => req.body[field].trim());
    const assignments = updates.map((field, index) => `${field} = $${index + 1}`).join(', ');
    values.push(customer.customer_id);
    const result = await query(
      `UPDATE customers SET ${assignments} WHERE customer_id = $${values.length} RETURNING customer_id, user_id, name, phone, license_number, license_status, address, created_at`,
      values
    );
    res.json({ ...result.rows[0], email: customer.email });
  } catch (error) {
    next(error);
  }
});

router.get('/customer/messages', async (req, res, next) => {
  try {
    const customer = await requireCustomer(req);
    if (!customerRequired(res, customer)) return;
    const result = await query(
      `SELECT m.message_id, m.booking_id, m.sender_user_id, m.message_text, m.sent_at, m.is_read,
        u.email AS sender_email, u.role AS sender_role, v.brand, v.model
       FROM messages m JOIN bookings b ON b.booking_id = m.booking_id
       JOIN users u ON u.user_id = m.sender_user_id
       JOIN vehicles v ON v.vehicle_id = b.vehicle_id
       WHERE b.customer_id = $1 ORDER BY m.sent_at ASC`,
      [customer.customer_id]
    );
    res.json({ items: result.rows });
  } catch (error) {
    next(error);
  }
});

router.post('/customer/messages', async (req, res, next) => {
  try {
    const customer = await requireCustomer(req);
    if (!customerRequired(res, customer)) return;
    const bookingId = Number(req.body?.booking_id);
    const messageText = typeof req.body?.message_text === 'string' ? req.body.message_text.trim() : '';
    if (!Number.isInteger(bookingId) || !messageText) return res.status(400).json({ error: 'invalid_message', message: 'booking_id and message_text are required.' });
    const booking = await query('SELECT booking_id FROM bookings WHERE booking_id = $1 AND customer_id = $2', [bookingId, customer.customer_id]);
    if (!booking.rowCount) return res.status(404).json({ error: 'booking_not_found', message: 'Booking not found.' });
    const result = await query(
      `INSERT INTO messages (booking_id, sender_user_id, message_text) VALUES ($1, $2, $3)
       RETURNING message_id, booking_id, sender_user_id, message_text, sent_at, is_read`,
      [bookingId, customer.user_id, messageText]
    );
    res.status(201).json({ ...result.rows[0], sender_email: customer.email, sender_role: 'customer' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;