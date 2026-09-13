

## 39. Backend Advisory Implementation (2026-09-04)

### Files added/changed

| File | Purpose |
|------|---------|
| backend/server.js | Express app, health route, mount advisory router, error handler |
| backend/db/pool.js | pg Pool using .env |
| backend/services/advisoryService.js | ensureViews, fetchRecommendations, fetchVehicleMetrics, fetchBaselines |
| backend/routes/advisory.js | REST endpoints under /api/advisory |
| backend/middleware/errorHandler.js | JSON error responses |
| backend/smoke_test.js | 20-check smoke test against live server |
| package.json | Added backend and smoke scripts; added express + cors deps |

### Backend endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/health | DB connectivity check |
| GET | /api/advisory/health | Views initialized check |
| GET | /api/advisory/recommendations | R1-R10 results (canonical 32-column output) |
| GET | /api/advisory/vehicle-metrics | All 10 vehicles' unified metrics |
| GET | /api/advisory/baselines | Fleet medians + eligible populations |

### Validation

- npm run advisory: 34 passed, 0 failed (SQL layer unchanged)
- node backend/smoke_test.js: 20 passed, 0 failed (endpoint + payload checks)
- Confirmed:
  * null JSON values for evidence-based metrics without evidence (rental_days, utilization, maintenance_cost, downtime, averages, rates, revenue)
  * Numeric string counts for count metrics with no records (booking_count, total_inspections, etc.)
  * Numeric string for V6 rental_days and utilization (pg returns NUMERIC as string by default)
  * Numeric value for V5 maintenance_cost
  * Zero recommendations cleanly returned as { count: 0, recommendations: [] }
  * 404 handler returns JSON { error: 'not_found', message }

### NULL preservation contract

- pg returns NULL columns as JSON null (not 0) - verified for rental_days, utilization, maintenance_cost, maintenance_downtime_days, paid_revenue, avg_return_ready_days, inspection_issue_rate, avg_return_inspection_days.
- Count metrics that are COALESCEd to 0 in the view surface as JSON numeric strings (e.g. booking_count: "0"). Frontend can Number(...) if needed.

### Limitations

- Backend uses lazy ensureViews on first request; if schema changes, restart server or call /api/advisory/health.
- Frontend mock API is still used for non-advisory endpoints (out of scope).

## Phase 3 Customer Operations (2026-09-05)

Implemented and internally verified against the live PostgreSQL-backed Express server:

- Customer-specific bookings and booking details
- Existing payment records
- Customer profile retrieval and editing
- Booking-linked customer messages
- Customer isolation using the existing demo session customer ID

Added API routes under `/api/customer` and connected the existing Customer pages without changing the schema, Owner functionality, Phase 2 booking logic, or Advisory system.

Verification: Phase 3 customer API integration passed; backend smoke 20/20; advisory verification 34/34; frontend build passed; `git diff --check` passed. Manual browser QA remains pending. Phase 4 is not started.

## Frontend Phase 4 — Owner Workspace Foundation (2026-09-05)

Implemented and internally verified:

- Real vehicle-backed Owner dashboard and fleet inventory
- Owner fleet search and actual status/type filters
- Real vehicle detail foundation with shared vehicle photography
- Existing advisory dashboard available at `/owner/advisory`
- Honest unavailable states for Owner bookings, inspections, maintenance, history, and settings because dedicated APIs do not yet exist

No backend, schema, database, Owner operations API, or Advisory logic was changed. Frontend build passed and live vehicle/advisory endpoint checks passed. Manual browser QA remains pending. Frontend Phase 5 is not started.
- pg NUMERIC serialization as string is preserved; conversion happens client-side or in middleware per the existing project convention.

## ONE EXACT NEXT ACTION

Build the React advisory UI to display backend advisory endpoints.
