const assert = require('node:assert/strict');
const app = require('./server');
const { pool } = require('./db/pool');

async function request(base, path, ownerId) {
  const response = await fetch(`${base}${path}`, { headers: { 'x-owner-id': String(ownerId) } });
  return { response, body: await response.json() };
}

async function run() {
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const [companyA, companyB] = await Promise.all([
      request(base, '/api/advisory/vehicle-metrics', 9),
      request(base, '/api/advisory/vehicle-metrics', 10)
    ]);
    assert.equal(companyA.response.status, 200);
    assert.equal(companyB.response.status, 200);
    assert.equal(companyA.body.count, 4);
    assert.equal(companyB.body.count, 3);
    assert.ok(companyA.body.vehicle_metrics.every((row) => [1, 2, 3, 9].includes(Number(row.vehicle_id))));
    assert.ok(companyB.body.vehicle_metrics.every((row) => [4, 5, 10].includes(Number(row.vehicle_id))));

    const [baselineA, baselineB] = await Promise.all([
      request(base, '/api/advisory/baselines', 9),
      request(base, '/api/advisory/baselines', 10)
    ]);
    assert.equal(baselineA.body.total_vehicles, '4');
    assert.equal(baselineB.body.total_vehicles, '3');
    assert.notEqual(baselineA.body.fleet_median_utilization, baselineB.body.fleet_median_utilization);

    const [recommendationsA, recommendationsB] = await Promise.all([
      request(base, '/api/advisory/recommendations', 9),
      request(base, '/api/advisory/recommendations', 10)
    ]);
    assert.equal(recommendationsA.response.status, 200);
    assert.equal(recommendationsB.response.status, 200);
    assert.ok(recommendationsA.body.recommendations.every((row) => row.vehicle_id === null || [1, 2, 3, 9].includes(Number(row.vehicle_id))));
    assert.ok(recommendationsB.body.recommendations.every((row) => row.vehicle_id === null || [4, 5, 10].includes(Number(row.vehicle_id))));

    const unauthenticated = await fetch(`${base}/api/advisory/baselines`);
    assert.equal(unauthenticated.status, 401);
    console.log('Advisory company-scope integration tests passed.');
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
