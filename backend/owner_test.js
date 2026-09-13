const assert = require('node:assert/strict');
const app = require('./server');
const { pool } = require('./db/pool');

async function request(base, path, ownerId = 9) {
  const response = await fetch(`${base}${path}`, { headers: { 'x-owner-id': String(ownerId) } });
  return { response, body: await response.json() };
}

async function run() {
  const server = process.env.OWNER_TEST_BASE_URL ? null : app.listen(0);
  const base = process.env.OWNER_TEST_BASE_URL || `http://127.0.0.1:${server.address().port}`;
  try {
    const unauthorized = await request(base, '/api/owner/bookings', 0);
    assert.equal(unauthorized.response.status, 401);

    const bookings = await request(base, '/api/owner/bookings');
    assert.equal(bookings.response.status, 200);
    assert.ok(bookings.body.items.length > 0);
    assert.equal(bookings.body.company, 'Apex Car Rentals');
    assert.ok(bookings.body.items.every((item) => item.vehicle.brand && item.vehicle.vehicle_number));
    assert.ok(bookings.body.items.every((item) => item.customer.name && item.location_name));

    const booking = await request(base, `/api/owner/bookings/${bookings.body.items[0].booking_id}`);
    assert.equal(booking.response.status, 200);
    assert.ok(booking.body.payment === null || booking.body.payment.status);

    const inspections = await request(base, '/api/owner/inspections');
    assert.equal(inspections.response.status, 200);
    assert.ok(inspections.body.items.length > 0);
    assert.ok(inspections.body.items.every((item) => item.vehicle.brand && item.vehicle.vehicle_number));
    assert.ok(inspections.body.items.every((item) => item.status && item.odometer >= 0));

    const maintenance = await request(base, '/api/owner/maintenance');
    assert.equal(maintenance.response.status, 200);
    assert.ok(maintenance.body.items.length > 0);
    assert.ok(maintenance.body.items.every((item) => item.cost >= 0 && item.status));

    const history = await request(base, '/api/owner/history');
    assert.equal(history.response.status, 200);
    assert.ok(history.body.items.length > 0);
    assert.ok(history.body.items.every((item) => item.status && item.changed_at));
    console.log('Owner operations API integration tests passed.');
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await pool.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
