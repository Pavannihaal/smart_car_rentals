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
      headers: path.startsWith('/api/advisory/') ? { 'x-owner-id': '9' } : {},
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
        const rows = r.body.vehicle_metrics;
        const checks = [
          ['owner response contains only company 1 vehicles', rows.length === 4 && rows.every((v) => [1, 2, 3, 9].includes(Number(v.vehicle_id)))],
          ['count metrics are non-null', rows.every((v) => v.booking_count !== null && v.total_inspections !== null)],
          ['missing rental evidence remains NULL', rows.filter((v) => v.booking_count === '0').every((v) => v.rental_days === null && v.utilization === null)],
          ['missing maintenance evidence remains NULL', rows.filter((v) => v.maintenance_frequency === '0').every((v) => v.maintenance_cost === null && v.maintenance_downtime_days === null)],
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
          ['baselines has company-scoped population', r.body.total_vehicles === '4'],
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
