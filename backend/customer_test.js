const assert = require('node:assert/strict');
const app = require('./server');
const { query, pool } = require('./db/pool');

async function request(base, path, options) {
  const response = await fetch(`${base}${path}`, {
    headers: { 'content-type': 'application/json' },
    ...options
  });
  return { response, body: await response.json() };
}

async function run() {
  const server = process.env.CUSTOMER_TEST_BASE_URL ? null : app.listen(0);
  const base = process.env.CUSTOMER_TEST_BASE_URL || `http://127.0.0.1:${server.address().port}`;
  let createdBookingId;
  try {
    const list = await request(base, '/api/vehicles?search=Honda&availability=available');
    assert.equal(list.response.status, 200);
    assert.ok(list.body.items.some((vehicle) => vehicle.brand === 'Honda'));

    const detail = await request(base, '/api/vehicles/1');
    assert.equal(detail.response.status, 200);
    assert.equal(detail.body.vehicle_id, 1);

    const missing = await request(base, '/api/vehicles/99999');
    assert.equal(missing.response.status, 404);

    const available = await request(base, '/api/vehicles/1/availability?pickup=2026-09-15T09:00&return=2026-09-17T09:00');
    assert.equal(available.response.status, 200);
    assert.equal(available.body.available, true);
    assert.equal(available.body.rental_days, 2);

    const conflict = await request(base, '/api/vehicles/1/availability?pickup=2026-09-02T09:00&return=2026-09-03T09:00');
    assert.equal(conflict.response.status, 200);
    assert.equal(conflict.body.available, false);
    assert.equal(conflict.body.reason, 'booking_conflict');

    const invalidDates = await request(base, '/api/vehicles/1/availability?pickup=2026-09-18T09:00&return=2026-09-17T09:00');
    assert.equal(invalidDates.response.status, 400);

    const invalidBookingDates = await request(base, '/api/bookings', {
      method: 'POST',
      body: JSON.stringify({ customer_id: 1, vehicle_id: 1, pickup_datetime: '2026-09-18T09:00', return_datetime: '2026-09-17T09:00' })
    });
    assert.equal(invalidBookingDates.response.status, 400);

    const invalidBookingVehicle = await request(base, '/api/bookings', {
      method: 'POST',
      body: JSON.stringify({ customer_id: 1, vehicle_id: 99999, pickup_datetime: '2026-09-15T09:00', return_datetime: '2026-09-17T09:00' })
    });
    assert.equal(invalidBookingVehicle.response.status, 404);

    const created = await request(base, '/api/bookings', {
      method: 'POST',
      body: JSON.stringify({ customer_id: 1, vehicle_id: 1, pickup_datetime: '2026-09-15T09:00', return_datetime: '2026-09-17T09:00' })
    });
    assert.equal(created.response.status, 201);
    assert.equal(created.body.total_amount, 5000);
    createdBookingId = created.body.booking_id;

    const duplicate = await request(base, '/api/bookings', {
      method: 'POST',
      body: JSON.stringify({ customer_id: 1, vehicle_id: 1, pickup_datetime: '2026-09-16T09:00', return_datetime: '2026-09-18T09:00' })
    });
    assert.equal(duplicate.response.status, 409);

    const mahindraConflict = await request(base, '/api/vehicles/8/availability?pickup=2026-09-05T20:13&return=2026-09-05T21:13');
    assert.equal(mahindraConflict.response.status, 200);
    assert.equal(mahindraConflict.body.available, false);
    assert.equal(mahindraConflict.body.reason, 'booking_conflict');
    assert.ok(mahindraConflict.body.conflict?.booking_id);
    assert.ok(mahindraConflict.body.next_available_datetime);

    const oneHourNoConflict = await request(base, '/api/vehicles/8/availability?pickup=2026-08-06T10:00&return=2026-08-06T11:00');
    assert.equal(oneHourNoConflict.response.status, 200);
    assert.equal(oneHourNoConflict.body.available, true);

    const exactEndBoundary = await request(base, '/api/vehicles/8/availability?pickup=2026-08-08T18:00&return=2026-08-08T19:00');
    assert.equal(exactEndBoundary.response.status, 200);
    assert.equal(exactEndBoundary.body.available, true);

    const exactStartBoundary = await request(base, '/api/vehicles/8/availability?pickup=2026-08-05T09:00&return=2026-08-05T10:00');
    assert.equal(exactStartBoundary.response.status, 200);
    assert.equal(exactStartBoundary.body.available, true);

    const persisted = await query('SELECT booking_id, total_amount FROM bookings WHERE booking_id = $1', [createdBookingId]);
    assert.equal(persisted.rowCount, 1);
    assert.equal(Number(persisted.rows[0].total_amount), 5000);
    console.log('Customer API integration tests passed.');
  } finally {
    if (createdBookingId) await query('DELETE FROM bookings WHERE booking_id = $1', [createdBookingId]);
    if (server) await new Promise((resolve) => server.close(resolve));
    await pool.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});