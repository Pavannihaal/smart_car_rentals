

## 38. Backend Advisory Implementation (2026-09-04)

### Backend structure

backend/
  server.js               Express app
  db/pool.js              pg connection pool
  services/advisoryService.js  Reads SQL files, exposes fetch helpers
  routes/advisory.js      REST endpoints
  middleware/errorHandler.js   JSON error responses
  smoke_test.js           20-check endpoint smoke test

### Endpoints

- GET /api/health                  DB check
- GET /api/advisory/health         Views initialized
- GET /api/advisory/recommendations  R1-R10 results
- GET /api/advisory/vehicle-metrics  Unified metrics for all vehicles
- GET /api/advisory/baselines       Fleet medians + populations

### Behavior preserved from SQL layer

- NULL evidence preserved as JSON null
- Count metrics keep true zero (surfaced as string "0")
- Zero recommendations return { count: 0, recommendations: [] } cleanly
- Canonical 32-column recommendation shape preserved
- No artificial recommendations or thresholds altered

### Validation

- npm run advisory: 34 passed, 0 failed
- node backend/smoke_test.js: 20 passed, 0 failed
- Live HTTP tests against running server confirmed V6 utilization 85.83%, V5 maintenance_cost 12500, all others null/zeros.

## ONE EXACT NEXT ACTION

Build the React advisory UI to display backend advisory endpoints.
