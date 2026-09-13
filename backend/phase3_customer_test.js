const assert = require('node:assert/strict');
const app = require('./server');
const { query, pool } = require('./db/pool');

async function request(base, path, customerId, options = {}) {
  const response = await fetch(`${base}${path}`, {
    headers: { 'content-type': 'application/json', 'x-customer-id': String(customerId), ...options.headers },
    ...options
  });
  return { response, body: await response.json() };
}

async function run() {
  const server = process.env.CUSTOMER_TEST_BASE_URL ? null : app.listen(0);
  const base = process.env.CUSTOMER_TEST_BASE_URL || `http://127.0.0.1:${server.address().port}`;
  let createdMessageId;
  let originalProfile;
  try {
    const noSession = await request(base, '/api/customer/bookings', 0);
    assert.equal(noSession.response.status, 401);

    const bookings = await request(base, '/api/customer/bookings', 1);
    assert.equal(bookings.response.status, 200);
    assert.ok(bookings.body.items.length > 0);
    assert.ok(bookings.body.items.every((item) => item.customer_id === 1));
    assert.ok(bookings.body.items.every((item) => item.vehicle.brand && item.location_name));

    const otherBookings = await request(base, '/api/customer/bookings', 2);
    assert.equal(otherBookings.response.status, 200);
    assert.ok(otherBookings.body.items.every((item) => item.customer_id === 2));
    assert.notEqual(JSON.stringify(bookings.body.items), JSON.stringify(otherBookings.body.items));

    const emptyBookings = await request(base, '/api/customer/bookings', 6);
    assert.equal(emptyBookings.response.status, 200);
    assert.deepEqual(emptyBookings.body.items, []);

    const detail = await request(base, '/api/customer/bookings/1', 1);
    assert.equal(detail.response.status, 200);
    assert.equal(detail.body.booking_id, 1);
    assert.equal(detail.body.vehicle.brand, 'Honda');

    const hiddenDetail = await request(base, '/api/customer/bookings/1', 2);
    assert.equal(hiddenDetail.response.status, 404);

    const missingDetail = await request(base, '/api/customer/bookings/99999', 1);
    assert.equal(missingDetail.response.status, 404);

    const payments = await request(base, '/api/customer/payments', 1);
    assert.equal(payments.response.status, 200);
    assert.ok(payments.body.items.length > 0);
    assert.ok(payments.body.items.every((item) => item.payment_status));

    const profile = await request(base, '/api/customer/profile', 1);
    assert.equal(profile.response.status, 200);
    originalProfile = profile.body;
    assert.equal(profile.body.customer_id, 1);

    const updatedProfile = await request(base, '/api/customer/profile', 1, {
      method: 'PATCH',
      body: JSON.stringify({ name: originalProfile.name, phone: originalProfile.phone, address: `${originalProfile.address} (test)` })
    });
    assert.equal(updatedProfile.response.status, 200);
    assert.match(updatedProfile.body.address, /\(test\)$/);
    const restoredProfile = await request(base, '/api/customer/profile', 1, {
      method: 'PATCH',
      body: JSON.stringify({ name: originalProfile.name, phone: originalProfile.phone, address: originalProfile.address })
    });
    assert.equal(restoredProfile.response.status, 200);
    assert.equal(restoredProfile.body.address, originalProfile.address);

    const messages = await request(base, '/api/customer/messages', 1);
    assert.equal(messages.response.status, 200);
    assert.ok(messages.body.items.every((item) => [1, 9].includes(item.booking_id)));
    const otherMessages = await request(base, '/api/customer/messages', 2);
    assert.equal(otherMessages.response.status, 200);
    assert.ok(otherMessages.body.items.every((item) => item.booking_id !== 1 && item.booking_id !== 9));

    const createdMessage = await request(base, '/api/customer/messages', 1, {
      method: 'POST',
      body: JSON.stringify({ booking_id: 1, message_text: 'Phase 3 integration test message' })
    });
    assert.equal(createdMessage.response.status, 201);
    createdMessageId = createdMessage.body.message_id;
    const persistedMessage = await query('SELECT message_id, message_text FROM messages WHERE message_id = $1', [createdMessageId]);
    assert.equal(persistedMessage.rowCount, 1);
    assert.equal(persistedMessage.rows[0].message_text, 'Phase 3 integration test message');

    const hiddenMessageWrite = await request(base, '/api/customer/messages', 2, {
      method: 'POST',
      body: JSON.stringify({ booking_id: 1, message_text: 'Should be rejected' })
    });
    assert.equal(hiddenMessageWrite.response.status, 404);
    console.log('Phase 3 customer API integration tests passed.');
  } finally {
    if (createdMessageId) await query('DELETE FROM messages WHERE message_id = $1', [createdMessageId]);
    if (server) await new Promise((resolve) => server.close(resolve));
    await pool.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});