const assert = require('node:assert/strict');
const app = require('./server');
const { pool } = require('./db/pool');

async function request(base, path, ownerId = 9) {
  const response = await fetch(`${base}${path}`, { headers: { 'x-owner-id': String(ownerId) } });
  return { response, body: await response.json() };
}

async function run() {
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const analytics = await request(base, '/api/owner/analytics');
    assert.equal(analytics.response.status, 200);
    for (const key of ['revenue_ranking', 'top_vehicles', 'cumulative_revenue', 'booking_summary', 'never_booked_vehicles', 'confirmed_customers', 'above_average_price', 'maintenance_comparison', 'rental_duration_by_type']) {
      assert.ok(key in analytics.body, `missing ${key}`);
    }
    assert.ok(analytics.body.revenue_ranking.every((row) => Number(row.company_id) === 1));
    assert.ok(analytics.body.top_vehicles.every((row) => Number(row.revenue_rank) <= 3));
    assert.ok(analytics.body.cumulative_revenue.every((row, index, rows) => index === 0 || Number(row.cumulative_revenue) >= Number(rows[index - 1].cumulative_revenue)));
    assert.equal(Number(analytics.body.booking_summary.total), analytics.body.booking_summary.pending * 1 + analytics.body.booking_summary.confirmed * 1 + analytics.body.booking_summary.active * 1 + analytics.body.booking_summary.completed * 1 + analytics.body.booking_summary.cancelled * 1);

    const history = await request(base, '/api/owner/history?vehicle_id=1');
    assert.equal(history.response.status, 200);
    assert.ok(history.body.items.length > 0);
    assert.equal(history.body.items[0].vehicle_id, 1);
    assert.ok('previous_status' in history.body.items[0]);
    assert.ok('duration_in_status' in history.body.items[0]);

    const unauthorized = await request(base, '/api/owner/analytics', 10);
    assert.equal(unauthorized.response.status, 200);
    assert.ok(unauthorized.body.revenue_ranking.every((row) => Number(row.company_id) === 2));
    console.log('Owner analytics integration tests passed.');
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
