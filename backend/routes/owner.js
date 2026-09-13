const express = require('express');
const { query, withClient } = require('../db/pool');

const router = express.Router();

function requestedOwnerUserId(req) {
  const value = req.get('x-owner-id') || req.query.owner_user_id;
  return Number.isInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;
}

async function requireOwner(req, res) {
  const userId = requestedOwnerUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'owner_session_required', message: 'A valid owner session is required.' });
    return null;
  }
  const result = await query(
    `SELECT rc.company_id, rc.company_name, u.user_id, u.email
     FROM rental_companies rc
     JOIN users u ON u.user_id = rc.user_id
     WHERE rc.user_id = $1 AND u.role = 'owner'`,
    [userId]
  );
  if (!result.rows[0]) {
    res.status(403).json({ error: 'owner_access_required', message: 'The current account is not an owner.' });
    return null;
  }
  return result.rows[0];
}

async function getOwnerBooking(bookingId, companyId, client = { query }) {
  const result = await client.query('SELECT b.booking_id, b.vehicle_id, b.pickup_datetime, b.return_datetime, b.status, v.company_id FROM bookings b JOIN vehicles v ON v.vehicle_id = b.vehicle_id WHERE b.booking_id = $1 AND v.company_id = $2', [bookingId, companyId]);
  return result.rows[0] || null;
}

router.get('/fleet', async (req, res, next) => {
  try {
    const owner = await requireOwner(req, res);
    if (!owner) return;
    const result = await query(`
      SELECT v.vehicle_id, v.company_id, v.location_id, v.vehicle_number, v.brand, v.model, v.year,
        v.type, v.fuel_type, v.transmission, v.price_per_day, v.seats, v.mileage, v.status,
        v.current_fuel_level, v.rating, v.image_url, l.name AS location_name, l.city, rc.company_name
      FROM vehicles v JOIN locations l ON l.location_id = v.location_id
      JOIN rental_companies rc ON rc.company_id = v.company_id
      WHERE v.company_id = $1 ORDER BY v.price_per_day ASC, v.vehicle_id ASC`, [owner.company_id]);
    res.json({ items: result.rows.map((row) => ({ ...row, price_per_day: Number(row.price_per_day), rating: row.rating === null ? null : Number(row.rating) })), company: owner.company_name });
    console.log('DEBUG: fleet route handler registered');
  } catch (error) { next(error); }
});

const bookingSelect = `
  SELECT b.booking_id, b.customer_id, b.vehicle_id, b.pickup_datetime, b.return_datetime,
    b.total_amount, b.status, b.created_at,
    c.name AS customer_name, cu.email AS customer_email,
    v.brand, v.model, v.vehicle_number, v.type, v.status AS vehicle_status,
    l.name AS location_name, l.city,
    p.payment_status, p.payment_method, p.amount AS payment_amount, p.paid_at
  FROM bookings b
  JOIN customers c ON c.customer_id = b.customer_id
  JOIN users cu ON cu.user_id = c.user_id
  JOIN vehicles v ON v.vehicle_id = b.vehicle_id
  JOIN locations l ON l.location_id = v.location_id
  LEFT JOIN LATERAL (
    SELECT payment_status, payment_method, amount, paid_at
    FROM payments payment
    WHERE payment.booking_id = b.booking_id
    ORDER BY payment.payment_id DESC LIMIT 1
  ) p ON TRUE
`;

function mapBooking(row) {
  return {
    booking_id: row.booking_id,
    customer_id: row.customer_id,
    vehicle_id: row.vehicle_id,
    customer: { name: row.customer_name, email: row.customer_email },
    vehicle: { brand: row.brand, model: row.model, vehicle_number: row.vehicle_number, type: row.type, status: row.vehicle_status },
    pickup_datetime: row.pickup_datetime,
    return_datetime: row.return_datetime,
    total_amount: Number(row.total_amount),
    status: row.status,
    created_at: row.created_at,
    location_name: row.location_name,
    city: row.city,
    payment: row.payment_status ? { status: row.payment_status, method: row.payment_method, amount: row.payment_amount === null ? null : Number(row.payment_amount), paid_at: row.paid_at } : null
  };
}

router.get('/bookings', async (req, res, next) => {
  try {
    const owner = await requireOwner(req, res);
    if (!owner) return;
    const values = [owner.company_id];
    const conditions = ['v.company_id = $1'];
    if (req.query.status) { values.push(req.query.status); conditions.push(`b.status = $${values.length}`); }
    if (req.query.search) {
      values.push(`%${req.query.search}%`);
      conditions.push(`(c.name ILIKE $${values.length} OR c.email ILIKE $${values.length} OR v.brand ILIKE $${values.length} OR v.model ILIKE $${values.length} OR v.vehicle_number ILIKE $${values.length})`);
    }
    const result = await query(`${bookingSelect} WHERE ${conditions.join(' AND ')} ORDER BY b.pickup_datetime DESC`, values);
    res.json({ items: result.rows.map(mapBooking), company: owner.company_name });
  } catch (error) { next(error); }
});

router.get('/bookings/:id', async (req, res, next) => {
  try {
    const owner = await requireOwner(req, res);
    if (!owner) return;
    const result = await query(`${bookingSelect} WHERE b.booking_id = $1 AND v.company_id = $2`, [Number(req.params.id), owner.company_id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'booking_not_found', message: 'Booking not found.' });
    res.json(mapBooking(result.rows[0]));
  } catch (error) { next(error); }
});

router.patch('/bookings/:id/status', async (req, res, next) => {
  try {
    const owner = await requireOwner(req, res);
    if (!owner) return;
    const nextStatus = req.body?.status;
    if (!['CONFIRMED', 'CANCELLED'].includes(nextStatus)) return res.status(400).json({ error: 'invalid_booking_status', message: 'Owner status must be CONFIRMED or CANCELLED.' });
    const updated = await withClient(async (client) => {
      await client.query('BEGIN');
      try {
        const booking = await getOwnerBooking(Number(req.params.id), owner.company_id, client);
        if (!booking) { const error = new Error('Booking not found.'); error.status = 404; error.code = 'booking_not_found'; throw error; }
        if (booking.status && booking.status !== 'PENDING') { const error = new Error('Only pending bookings can be reviewed.'); error.status = 409; error.code = 'booking_not_pending'; throw error; }
        if (nextStatus === 'CONFIRMED') {
          const conflict = await client.query(`SELECT booking_id FROM bookings WHERE vehicle_id = $1 AND booking_id <> $2 AND status = ANY($5::varchar[]) AND pickup_datetime < $4 AND return_datetime > $3 LIMIT 1`, [booking.vehicle_id, Number(req.params.id), booking.pickup_datetime, booking.return_datetime, ['PENDING', 'CONFIRMED', 'ACTIVE']]);
          if (conflict.rowCount) { const error = new Error('Booking conflicts with another active booking for this vehicle.'); error.status = 409; error.code = 'booking_conflict'; throw error; }
        }
        const result = await client.query('UPDATE bookings SET status = $1 WHERE booking_id = $2 RETURNING booking_id, status', [nextStatus, Number(req.params.id)]);
        await client.query('COMMIT');
        return result.rows[0];
      } catch (error) { await client.query('ROLLBACK'); throw error; }
    });
    res.json(updated);
  } catch (error) { next(error); }
});

const inspectionSelect = `
  SELECT vi.booking_id, vi.inspection_no, vi.inspector_name, vi.inspection_date,
    vi.fuel_level, vi.odometer, vi.body_condition, vi.interior_condition,
    vi.is_clean, vi.issues_found, vi.status,
    v.vehicle_id, v.brand, v.model, v.vehicle_number, v.type,
    b.customer_id, c.name AS customer_name, l.name AS location_name, l.city
  FROM vehicle_inspections vi
  JOIN bookings b ON b.booking_id = vi.booking_id
  JOIN customers c ON c.customer_id = b.customer_id
  JOIN vehicles v ON v.vehicle_id = b.vehicle_id
  JOIN locations l ON l.location_id = v.location_id
`;

function mapInspection(row) {
  return { ...row, vehicle: { vehicle_id: row.vehicle_id, brand: row.brand, model: row.model, vehicle_number: row.vehicle_number, type: row.type }, customer_name: row.customer_name, location_name: row.location_name, city: row.city };
}

router.get('/inspections', async (req, res, next) => {
  try {
    const owner = await requireOwner(req, res);
    if (!owner) return;
    const values = [owner.company_id];
    const conditions = ['v.company_id = $1'];
    if (req.query.vehicle_id) { values.push(Number(req.query.vehicle_id)); conditions.push(`v.vehicle_id = $${values.length}`); }
    if (req.query.status) { values.push(req.query.status); conditions.push(`vi.status = $${values.length}`); }
    if (req.query.search) { values.push(`%${req.query.search}%`); conditions.push(`(v.brand ILIKE $${values.length} OR v.model ILIKE $${values.length} OR v.vehicle_number ILIKE $${values.length} OR c.name ILIKE $${values.length})`); }
    const result = await query(`${inspectionSelect} WHERE ${conditions.join(' AND ')} ORDER BY vi.inspection_date DESC`, values);
    res.json({ items: result.rows.map(mapInspection) });
  } catch (error) { next(error); }
});

router.get('/inspections/:bookingId/:inspectionNo', async (req, res, next) => {
  try {
    const owner = await requireOwner(req, res);
    if (!owner) return;
    const result = await query(`${inspectionSelect} WHERE vi.booking_id = $1 AND vi.inspection_no = $2 AND v.company_id = $3`, [Number(req.params.bookingId), Number(req.params.inspectionNo), owner.company_id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'inspection_not_found', message: 'Inspection not found.' });
    res.json(mapInspection(result.rows[0]));
  } catch (error) { next(error); }
});

const maintenanceSelect = `
  SELECT m.vehicle_id, m.maintenance_no, m.description, m.cost, m.start_date, m.end_date, m.status,
    v.brand, v.model, v.vehicle_number, v.type, v.location_id, l.name AS location_name, l.city
  FROM maintenance m
  JOIN vehicles v ON v.vehicle_id = m.vehicle_id
  JOIN locations l ON l.location_id = v.location_id
`;

function mapMaintenance(row) {
  return { ...row, cost: Number(row.cost), vehicle: { vehicle_id: row.vehicle_id, brand: row.brand, model: row.model, vehicle_number: row.vehicle_number, type: row.type } };
}

router.get('/maintenance', async (req, res, next) => {
  try {
    const owner = await requireOwner(req, res);
    if (!owner) return;
    const values = [owner.company_id];
    const conditions = ['v.company_id = $1'];
    if (req.query.vehicle_id) { values.push(Number(req.query.vehicle_id)); conditions.push(`v.vehicle_id = $${values.length}`); }
    if (req.query.status) { values.push(req.query.status); conditions.push(`m.status = $${values.length}`); }
    if (req.query.search) { values.push(`%${req.query.search}%`); conditions.push(`(v.brand ILIKE $${values.length} OR v.model ILIKE $${values.length} OR v.vehicle_number ILIKE $${values.length} OR m.description ILIKE $${values.length})`); }
    const result = await query(`${maintenanceSelect} WHERE ${conditions.join(' AND ')} ORDER BY m.start_date DESC`, values);
    res.json({ items: result.rows.map(mapMaintenance) });
  } catch (error) { next(error); }
});

router.get('/maintenance/:vehicleId/:maintenanceNo', async (req, res, next) => {
  try {
    const owner = await requireOwner(req, res);
    if (!owner) return;
    const result = await query(`${maintenanceSelect} WHERE m.vehicle_id = $1 AND m.maintenance_no = $2 AND v.company_id = $3`, [Number(req.params.vehicleId), Number(req.params.maintenanceNo), owner.company_id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'maintenance_not_found', message: 'Maintenance record not found.' });
    res.json(mapMaintenance(result.rows[0]));
  } catch (error) { next(error); }
});

router.get('/history', async (req, res, next) => {
  try {
    const owner = await requireOwner(req, res);
    if (!owner) return;
    const values = [owner.company_id];
    const conditions = ['v.company_id = $1'];
    if (req.query.vehicle_id) { values.push(Number(req.query.vehicle_id)); conditions.push(`v.vehicle_id = $${values.length}`); }
    const result = await query(
      `SELECT h.history_id, h.vehicle_id, h.status, h.changed_at, h.comments,
        v.brand, v.model, v.vehicle_number, v.type
       FROM vehicle_status_history h JOIN vehicles v ON v.vehicle_id = h.vehicle_id
       WHERE ${conditions.join(' AND ')} ORDER BY h.changed_at DESC`, values
    );
    res.json({ items: result.rows.map((row) => ({ ...row, vehicle: { vehicle_id: row.vehicle_id, brand: row.brand, model: row.model, vehicle_number: row.vehicle_number, type: row.type } })) });
  } catch (error) { next(error); }
});

router.get('/messages', async (req, res, next) => {
  try {
    const owner = await requireOwner(req, res);
    if (!owner) return;
    const values = [owner.company_id];
    const conditions = ['v.company_id = $1'];
    if (req.query.booking_id) { values.push(Number(req.query.booking_id)); conditions.push(`m.booking_id = $${values.length}`); }
    const result = await query(`SELECT m.message_id, m.booking_id, m.sender_user_id, m.message_text, m.sent_at, m.is_read, u.email AS sender_email, u.role AS sender_role, c.customer_id, c.name AS customer_name, v.brand, v.model FROM messages m JOIN bookings b ON b.booking_id = m.booking_id JOIN vehicles v ON v.vehicle_id = b.vehicle_id JOIN users u ON u.user_id = m.sender_user_id JOIN customers c ON c.customer_id = b.customer_id WHERE ${conditions.join(' AND ')} ORDER BY m.sent_at ASC`, values);
    res.json({ items: result.rows });
  } catch (error) { next(error); }
});

router.post('/messages', async (req, res, next) => {
  try {
    const owner = await requireOwner(req, res);
    if (!owner) return;
    const bookingId = Number(req.body?.booking_id);
    const messageText = typeof req.body?.message_text === 'string' ? req.body.message_text.trim() : '';
    if (!Number.isInteger(bookingId) || !messageText) return res.status(400).json({ error: 'invalid_message', message: 'booking_id and message_text are required.' });
    const booking = await query('SELECT b.booking_id FROM bookings b JOIN vehicles v ON v.vehicle_id = b.vehicle_id WHERE b.booking_id = $1 AND v.company_id = $2', [bookingId, owner.company_id]);
    if (!booking.rowCount) return res.status(404).json({ error: 'booking_not_found', message: 'Booking not found.' });
    const result = await query('INSERT INTO messages (booking_id, sender_user_id, message_text) VALUES ($1, (SELECT user_id FROM rental_companies WHERE company_id = $2), $3) RETURNING message_id, booking_id, sender_user_id, message_text, sent_at, is_read', [bookingId, owner.company_id, messageText]);
    res.status(201).json({ ...result.rows[0], sender_role: 'owner', sender_email: owner.email });
  } catch (error) { next(error); }
});

module.exports = router;
