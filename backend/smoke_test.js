// SmartCar backend smoke test
const http = require('http');

const endpoints = [
  { method: 'GET', path: '/api/health' },
  { method: 'GET', path: '/api/advisory/health' },
  { method: 'GET', path: '/api/advisory/recommendations' },
  { method: 'GET', path: '/api/advisory/vehicle-metrics' },
  { method: 'GET', path: '/api/advisory/baselines' },
  { method: 'GET', path: '/api/nonexistent' }
];

function request(method, path) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1', port: 4000, path, method,
    }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch (e) {}
        resolve({ status: res.statusCode, body: json ?? body });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  let pass = 0, fail = 0;
  for (const ep of endpoints) {
    try {
      const r = await request(ep.method, ep.path);
      const ok = (ep.path === '/api/nonexistent') ? r.status === 404 : r.status === 200;
      const tag = ok ? 'PASS' : 'FAIL';
      if (ok) pass++; else fail++;
      console.log(`${tag} ${ep.method} ${ep.path} -> ${r.status}`);
      if (ep.path === '/api/advisory/vehicle-metrics') {
        const v6 = r.body.vehicle_metrics.find(v => v.vehicle_id === 6);
        const v5 = r.body.vehicle_metrics.find(v => v.vehicle_id === 5);
        const v1 = r.body.vehicle_metrics.find(v => v.vehicle_id === 1);
        const checks = [
          ['V6 booking_count is "1"', v6.booking_count === '1'],
          ['V6 rental_days non-null',  v6.rental_days !== null],
          ['V6 utilization > 0.85',    Number(v6.utilization) > 0.85],
          ['V5 maintenance_frequency is "1"', v5.maintenance_frequency === '1'],
          ['V5 maintenance_cost non-null',    v5.maintenance_cost !== null],
          ['V1 rental_days is null (no in-window bookings)', v1.rental_days === null],
          ['V1 maintenance_cost is null (no records)', v1.maintenance_cost === null],
          ['V1 booking_count is "0" (count metric)', v1.booking_count === '0'],
          ['V1 total_inspections is "0" (count metric)', v1.total_inspections === '0'],
        ];
        for (const [name, ok] of checks) {
          if (ok) { pass++; console.log(`  PASS ${name}`); }
          else    { fail++; console.log(`  FAIL ${name}`); }
        }
      }
      if (ep.path === '/api/advisory/recommendations') {
        const checks = [
          ['recommendations payload has count', typeof r.body.count === 'number'],
          ['recommendations payload has recommendations array', Array.isArray(r.body.recommendations)],
        ];
        for (const [name, ok] of checks) {
          if (ok) { pass++; console.log(`  PASS ${name}`); }
          else    { fail++; console.log(`  FAIL ${name}`); }
        }
      }
      if (ep.path === '/api/advisory/baselines') {
        const checks = [
          ['baselines has fleet_median_utilization (numeric)', typeof r.body.fleet_median_utilization === 'number'],
          ['baselines has fleet_median_return_ready_days (null OK)', r.body.fleet_median_return_ready_days === null || typeof r.body.fleet_median_return_ready_days === 'number'],
          ['baselines has maintenance_frequency_pop (numeric string)', r.body.maintenance_frequency_pop === '10'],
        ];
        for (const [name, ok] of checks) {
          if (ok) { pass++; console.log(`  PASS ${name}`); }
          else    { fail++; console.log(`  FAIL ${name}`); }
        }
      }
    } catch (e) {
      fail++;
      console.log(`FAIL ${ep.method} ${ep.path} -> ${e.message}`);
    }
  }
  console.log(`\nTotal: ${pass} pass, ${fail} fail`);
  process.exit(fail === 0 ? 0 : 1);
}

main();
