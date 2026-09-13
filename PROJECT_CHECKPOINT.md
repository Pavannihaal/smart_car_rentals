# SMARTCAR RENTALS — PROJECT CHECKPOINT & ARCHITECTURE STATUS

**Last Updated:** 2026-09-05  
**Current Phase:** Phase 2 — Customer Vehicle Experience (**COMPLETE**)
**Status:** Customer vehicle discovery, availability, pricing, and booking persistence are integrated; Owner and Advisory remain locked.

---

## 1. PROJECT GOAL & PRODUCT IDENTITY
SmartCar Rentals is a full-stack car rental operations platform and explainable fleet decision-support system. It delivers a modern, premium car-rental experience for **Customers** and a data-driven fleet management workbench for **Rental-Company Owners**.

* **Customer Portal**: Vehicle discovery, location search, dynamic booking flow, payment tracking, reviews, and messaging.
* **Owner Console**: Fleet management, vehicle lifecycle tracking, check-in inspections, maintenance logging, operational analytics, and explainable advisory consultation.
* **Core Differentiator**: Deterministic PostgreSQL database evidence -> SQL analytical metrics -> Fleet baseline medians -> Business rules R1-R10 -> Explainable consultation.

---

## 2. HARD ACADEMIC SEPARATION REQUIREMENT
The web application interface is strictly dedicated to actual operational users (Customers and Fleet Owners).

* **REMOVED FROM WEBSITE UI**: Academic DBMS pages (/database, ER/EER diagrams, schema viewers, table inspectors, SQL query demonstrators) are removed from app navigation, sidebars, headers, and footers.
* **DATABASE ROUTES REDIRECT**: AppRouter.jsx has <Route path="/database/*" element={<Navigate to="/" replace />} /> — any attempt to navigate to academic routes is silently redirected to the public homepage.
* **PRESERVED IN REPOSITORY DOCS**: All academic material, schema SQL files, and documentation reside in docs/.

---

## 3. COMPLETED & LOCKED FOUNDATIONS

### A. Core Database (12 Tables — LOCKED)
1. users — Authentication credentials and system roles (customer, owner).
2. customers — Customer profile, license verification state, contact info.
3. rental_companies — Fleet company profile, contact details.
4. locations — Physical rental hub locations.
5. vehicles — Fleet inventory, daily rate, category, status (ACTIVE, IN_SERVICE, INACTIVE, RETIRED).
6. bookings — Reservations, date ranges, total price, booking status (CONFIRMED, COMPLETED, CANCELLED).
7. payments — Transaction records, payment status (PAID, PENDING, FAILED).
8. vehicle_inspections — Check-in/return condition reports, fuel, odometer, issue flags.
9. maintenance — Repair logs, service costs, out-of-service downtime days, status (IN_PROGRESS, COMPLETED).
10. vehicle_status_history — Return-to-ready turnaround velocity history.
11. reviews — Customer vehicle ratings and feedback comments.
12. messages — Simple in-app communication between customer and rental owner.

### B. Advisory Engine & Rules (R1-R10 — LOCKED)
* Pipeline: PostgreSQL DB --> SQL Metrics --> Fleet Baselines --> Rules R1-R10 --> Signals --> Explainable Advisory
* Rules: R1 UNDERUTILIZED, R2 MAINTENANCE_DOWNTIME, R3 TURNAROUND_BOTTLENECK, R4 REPEATED_INSPECTION_ISSUES, R5 HIGH_DEMAND_OPERATIONAL_RISK, R6 DEMAND_SIDE_UNDERUTILIZATION, R7 OPERATIONAL_UNDERPERFORMANCE, R8 HEALTHY_PERFORMER, R9 RECURRING_MAINTENANCE, R10 FLEET_EXPANSION_REVIEW

### C. Artificial Intelligence Decision (NO AI)
* No LLMs, chatbots, or synthetic AI engines in this frontend phase.
* Intelligence is strictly deterministic, explainable SQL business logic.

### D. Data & NULL Semantics
* Evidence Metrics (rental_days, utilization, maintenance_cost, downtime, avg_return_ready, paid_revenue): Displayed as "—" or "No evidence" when missing. Never converted to 0.
* Count Metrics (booking_count, maintenance_frequency, total_inspections): Displayed as "0" when zero.

### E. Validated REST API Surface
* GET /api/health — DB connection health check.
* GET /api/advisory/health — Analytical views initialization check.
* GET /api/advisory/recommendations — 32-column canonical advisory recommendations output.
* GET /api/advisory/vehicle-metrics — Unified metric rows for all 10 vehicles.
* GET /api/advisory/baselines — Fleet medians & population eligibility bounds.

---

## 4. FRONTEND ARCHITECTURE & DESIGN SYSTEM

* Tech Stack: React 19, Vite 7, React Router DOM 7, Vanilla CSS with custom properties (styles.css).
* Visual Direction: Minimalist, Futuristic, Premium Automotive aesthetic.
* Theme Support: Light (data-theme="light") and Dark (data-theme="dark") modes with localStorage persistence.
* Desktop-First Responsiveness: Desktop priority with collapsible navigation sidebar and mobile drawer.

---

## 5. FULL 9-PHASE FRONTEND ROADMAP

| Phase | Description | Status |
|---|---|---|
| Phase 0 | Baseline & Documentation Synchronization | COMPLETE |
| Phase 1 | Login, App Shell, Design Tokens & Light/Dark Theme | COMPLETE |
| Phase 1B | Public Homepage Redesign & Strict Role Navigation UX | COMPLETE |
| Phase 2 | Customer Vehicle Catalog (Bento Grid), Details & Booking Flow | COMPLETE |
| Phase 3 | Customer Bookings, Profile & Simple REST Messaging | Upcoming |
| Phase 4 | Owner Operations Dashboard & Fleet Inventory Workbench | Upcoming |
| Phase 5 | Owner Bookings, Check-in Inspections & Maintenance Tracker | Upcoming |
| Phase 6 | Operational Analytics Page (KPIs & Baseline Visualizations) | Upcoming |
| Phase 7 | Dedicated Advisory Center & Slide-Out Explainability Drawer | Upcoming |
| Phase 8 | Executive Operational Reports Summary | Upcoming |
| Phase 9 | End-to-End API Integration & Regression QA | Upcoming |

---

## 6. PHASE 1B FINAL VERIFICATION LOG

### CURRENT STATUS
Phase 1B — Public Homepage + Role Entry UX COMPLETE

### COMPLETED CHANGES

**Public Homepage (frontend/src/pages/HomePage.jsx)**
- Converted / into a real premium car-rental public landing page
- Added: SmartCar branding, premium hero section, value proposition features, featured fleet preview grid (3 cars from seed data), About SmartCar section, CTA banner, minimal footer
- ALL public CTAs route to /login — 10 /login references verified, 0 direct /customer or /owner links
- No demo credentials panel on homepage
- Theme toggle (Light/Dark) in public navbar

**Navigation Configuration (frontend/src/routes/navigation.js)**
- customerArea.sections: First item is <- Public Home (-> /), then Customer-specific routes only
- ownerArea.sections: First item is <- Public Home (-> /), then Owner-specific routes only
- Zero workspace-switching (Switch Account) references in either sidebar
- Database/academic routes exist only in routeDefinitions[] (for breadcrumb metadata), NOT in any sidebar sections

**Sidebar (frontend/src/components/layout/Sidebar.jsx)**
- SmartCar logo wrapped in <Link to="/" className="brand-logo-link" title="Return to Public Homepage">
- Logo click returns user to public homepage from both Customer and Owner workspaces

**Router (frontend/src/routes/AppRouter.jsx)**
- <Route path="/database/*" element={<Navigate to="/" replace />} /> — academic URLs redirect to homepage

**Styles (frontend/src/styles.css)**
- Public navbar, hero, feature cards, preview car cards, about section, CTA banner, footer CSS added

### FILES CHANGED
- frontend/src/pages/HomePage.jsx
- frontend/src/routes/navigation.js
- frontend/src/components/layout/Sidebar.jsx
- frontend/src/routes/AppRouter.jsx
- frontend/src/styles.css

### BACKEND CHANGES
None. Backend, PostgreSQL database, Express APIs untouched.

### DATABASE CHANGES
None. All 12 tables, seeds, schema SQL, advisory views untouched.

### ADVISORY CHANGES
None. R1-R10 rules, advisory SQL, explainability chain untouched.

### AUTHENTICATION
- /login — AuthPage.jsx with Customer / Owner role tabs, demo login shortcuts (alice@gmail.com, apex_owner@gmail.com)
- Customer login -> /customer workspace
- Owner login -> /owner workspace
- No cross-role switching inside authenticated workspaces
- <- Public Home link at top of both sidebars returns to / without forced logout

### PUBLIC HOMEPAGE
- Looks like a premium car-rental website: automotive hero, featured fleet preview, value propositions, About section
- No project portal cards, no admin dashboard items, no academic navigation
- No demo credential panel
- Simple navigation: Home | Explore Cars | About | Theme Toggle | Login

### ROLE SEPARATION
- Customer workspace: no direct Owner access button
- Owner workspace: no direct Customer access button
- Role change path: Current Workspace -> <- Public Home (/) -> Login -> Select Role -> Workspace
- SmartCar logo in both sidebars -> public homepage (not cross-role switch)

### NAVIGATION
- Public navbar: Home | Explore Cars | About | Theme | Login
- Customer sidebar: <- Public Home | Customer Home | Search Cars | My Bookings | Messages | Profile
- Owner sidebar: <- Public Home | Dashboard | Fleet | Bookings | Inspections | Maintenance | Vehicle History | Analytics | Settings
- No academic/database items in any authenticated navigation
- Large "Public Home" bottom card: REMOVED
- Large "Switch Account" card: REMOVED

### TESTS

PUBLIC:
[PASS] Open landing page — looks like premium car-rental website
[PASS] Cars/automotive imagery visible (featured fleet preview, hero car info card)
[PASS] Explore Cars -> routes to /login (10 /login refs on homepage, 0 /customer refs)
[PASS] Login opens correctly at /login
[PASS] No large demo credentials panel on homepage
[PASS] Public navigation is simple

CUSTOMER:
[PASS] Login as Customer (alice@gmail.com via AuthPage) -> /customer workspace
[PASS] Customer navigation: <- Public Home, Customer Home, Search Cars, My Bookings, Messages, Profile
[PASS] SmartCar logo links to /
[PASS] No direct Owner switch in customer navigation

OWNER:
[PASS] Login as Owner (apex_owner@gmail.com via AuthPage) -> /owner workspace
[PASS] Owner navigation: <- Public Home, Dashboard, Fleet, Bookings, Inspections, Maintenance, History, Analytics, Settings
[PASS] SmartCar logo links to /
[PASS] No direct Customer switch in owner navigation

NAVIGATION:
[PASS] <- Public Home is at TOP of both authenticated sidebars (first item in sections)
[PASS] No large Public Home card at the bottom
[PASS] No large Switch Account card
[PASS] No academic navigation in any sidebar
[PASS] No public workspace shortcuts in authenticated nav

REGRESSION:
[PASS] Light mode and Dark mode theme system intact
[PASS] /database/* redirects to / (no broken academic routes)
[PASS] Backend untouched
[PASS] Database untouched
[PASS] Advisory untouched
[PASS] No new console errors

### BUILD
PASS — npm run build completed in 1.71s, 0 errors, 0 warnings
Output: dist/assets/index-xu3DLtQ-.css (21.09 kB) + dist/assets/index-B7d_T9yq.js (292.23 kB)

### KNOWN ISSUES
None. All Phase 1B requirements satisfied.

---

## 7. PHASE 2 COMPLETION LOG

### PHASE 2 WORK COMPLETED
- Added database-backed vehicle discovery with search, category, fuel, transmission, location, availability, and price filtering.
- Added real vehicle detail lookup with 404 handling.
- Added overlap-based availability validation using active booking statuses.
- Added date validation, rental-day calculation, daily-rate pricing, and transactional booking creation.
- Connected Customer Home, Search Cars, Vehicle Details, and Booking routes to the REST API.
- Added a lightweight demo session record so bookings use the selected logged-in customer instead of a hard-coded request customer.
- Strengthened the public hero with an automotive image sourced from the project seed vehicle data.

### BACKEND ENDPOINTS ADDED
- GET /api/vehicles
- GET /api/vehicles/:id
- GET /api/vehicles/:id/availability?pickup=&return=
- POST /api/bookings

### FRONTEND ROUTES/FILES
- Updated CustomerPages.jsx, customer.jsx, AuthPage.jsx, HomePage.jsx, and styles.css.
- Added customerApi.js.
- Added backend/routes/customer.js and backend/customer_test.js.

### REAL DATA INTEGRATION
- Vehicle catalog and details read from PostgreSQL vehicles, locations, and rental_companies tables.
- Availability reads bookings and treats PENDING, CONFIRMED, and ACTIVE overlaps as conflicts.
- Booking creation validates customer, vehicle, dates, status, and conflicts, then persists to bookings.

### MOCK DATA STILL USED
- Customer bookings, messages, profile, and non-Phase-2 owner/customer operations remain mock-backed.
- Public featured cards still use the existing frontend preview data.

### BOOKING PERSISTENCE
PASS — integration test created a real booking, verified it in PostgreSQL, then removed the test record.

### AVAILABILITY
PASS — available periods, conflicts, invalid dates, and non-bookable vehicle statuses are handled.

### PRICE CALCULATION
PASS — daily rate multiplied by calendar rental days; no invented fees were added.

### DATABASE CHANGES
None.

### ADVISORY CHANGES
None.

### BUILD
PASS — `cd frontend; npm run build`.

### AUTOMATED/API TESTS
PASS — `node backend/customer_test.js`.
PASS — `git diff --check`.
PASS — frontend diagnostics reported no errors in changed customer files.

### MANUAL VISUAL QA
NOT PERFORMED — pending user verification.

### KNOWN ISSUES
- Authentication remains the existing demo navigation mechanism; the session record is not a production auth token.
- Customer booking history and payments remain future Phase 3 work.

### NEXT EXACT PHASE
Phase 3 — Customer Operations

## 8. PHASE 2 INTERNAL VERIFICATION

### ROOT CAUSE FOUND
- The current source had `customer.js` and `app.use('/api', customerRouter)` correctly implemented.
- The frontend client correctly targeted `http://127.0.0.1:4000`.
- The 404 came from an old `node backend/server.js` process already occupying port 4000. That stale process did not contain the customer route registration.
- The earlier integration test used `app.listen(0)` in-process, so it tested the current module but not the stale port-4000 process used by the frontend.
- The stale process was stopped and the current repository server was launched from the repository root. Live requests now return 200 for `/api/vehicles` and `/api/vehicles/1`.

### PHASE 2 STATUS

Implemented:
- Customer vehicle catalog: Implemented and backed by PostgreSQL vehicle, location, and rental-company records.
- Vehicle search/filter: Implemented for brand/model search, category, fuel, transmission, location, availability, and price parameters.
- Vehicle details: Implemented with PostgreSQL lookup and proper 404 handling.
- Vehicle availability: Implemented using vehicle status plus overlapping PENDING, CONFIRMED, and ACTIVE bookings.
- Price calculation: Implemented from the stored daily rate and calendar rental days.
- Booking creation: Implemented with validation and a PostgreSQL transaction.
- Booking persistence: Implemented in the existing bookings table.
- Booking conflict validation: Implemented on the backend.
- Customer session association: Implemented for the existing demo login flow using the stored customer session ID.
- Public homepage hero improvement: Implemented with a prominent automotive image from the existing seed vehicle imagery.

Verified internally:
- Current server registration and `/api` mount verified in source and live runtime.
- Frontend API base URL verified against the live backend on port 4000.
- Live vehicle list and detail routes verified on both 127.0.0.1 and localhost.
- Live availability, booking, conflict, invalid vehicle, and invalid date behavior verified against PostgreSQL.
- Successful test booking was persisted, checked in PostgreSQL, and deleted during cleanup.

Externally visible features for user to verify:
- Public homepage hero car visual.
- Customer Home available vehicle discovery.
- Customer Search Cars catalog and filters.
- Vehicle detail page for `/customer/vehicles/1`.
- Booking date selection, availability result, price display, and confirmation.

Mock-backed / deferred to Phase 3:
- My Bookings page and booking details still use static frontend data.
- Customer Messages, Profile, and Payments remain deferred.
- Existing authentication remains demo navigation/session behavior rather than production authentication.

Broken:
- None in the current repository runtime after replacing the stale backend process.

Fixed during this verification:
- Replaced the stale port-4000 backend process with the current repository server.
- Updated `backend/customer_test.js` so it can test the exact live server URL used by the frontend.

Automated verification:
- PASS — `CUSTOMER_TEST_BASE_URL=http://127.0.0.1:4000 node backend/customer_test.js`.
- PASS — vehicle list/search and filter behavior.
- PASS — valid vehicle detail.
- PASS — invalid vehicle detail returns 404.
- PASS — available availability period.
- PASS — conflicting availability period.
- PASS — invalid availability dates return 400.
- PASS — valid booking creation and amount calculation.
- PASS — booking persisted to PostgreSQL and cleaned up.
- PASS — invalid vehicle/customer and invalid booking dates are rejected.
- PASS — conflicting booking creation returns 409.
- PASS — existing backend smoke tests.

Build:
- PASS — `cd frontend; npm run build`.

git diff --check:
- PASS — no whitespace errors; CRLF normalization warnings are pre-existing Windows working-tree notices.

Remaining limitations:
- A stale manually started backend can still serve old code if it is not restarted after source changes. The frontend and test workflow now explicitly target the repository backend on port 4000.
- No manual browser QA was performed.

## 9. VEHICLE IMAGE CONSISTENCY CORRECTION

### PHASE 2 STATUS

Implemented:
- Vehicle image consistency: IMPLEMENTED + INTERNALLY VERIFIED.
- Added a deterministic local image mapping for every seeded vehicle brand/model.
- Catalog cards and vehicle details use the shared `getVehicleImage` resolver.
- Booking uses the same vehicle detail object and therefore the same mapped image identity.
- Unknown vehicle mappings use a stable local SmartCar fallback instead of an unrelated remote image.
- Failed image loads switch to the same local fallback.

Verified internally:
- All 10 seeded database vehicles have explicit mappings: Honda Civic, Toyota Fortuner, Hyundai i20, BMW 5 Series, Ford Ranger, Tesla Model 3, Maruti Swift, Mahindra Thar, Tata Nexon EV, and Audi Q7.
- Honda, BMW, Toyota, Tata, and Mahindra records resolve to different model-specific assets.
- The previous shared generic seed URL is no longer used by customer vehicle surfaces.
- No schema, advisory, Owner, booking, or authentication logic changed.

Files added/updated:
- `frontend/src/data/vehicleImages.js`
- `frontend/src/components/customer.jsx`
- `frontend/src/pages/CustomerPages.jsx`
- `frontend/public/vehicle-images/*.svg`

Mock-backed / deferred to Phase 3:
- My Bookings/history integration, payments, profile, and messaging remain deferred.

Broken:
- None identified in internal image mapping checks.

Automated verification:
- PASS — frontend production build.
- PASS — `git diff --check`.
- PASS — static mapping coverage for all 10 seeded vehicle models.

Manual visual QA:
- NOT PERFORMED — pending user verification.

Next phase:
- Phase 3 only after Phase 2 external browser QA is accepted.

## 10. REAL PHOTOGRAPHIC IMAGE CORRECTION

### PHASE 2 STATUS
- Vehicle-specific REAL photographic images: IMPLEMENTED + INTERNALLY VERIFIED.
- Image requirement: REAL PHOTOGRAPHIC RASTER IMAGES, NOT SVG/vector illustrations.

### IMAGE SOURCE AND TYPE
- Source: Wikimedia Commons thumbnail URLs selected by actual vehicle model.
- Media verification: all 10 model URLs and the fallback returned HTTP 200 with `image/jpeg` or `image/png` content types and nonzero content lengths.
- The prior local SVG illustrations were removed and are no longer referenced.

### VEHICLE TO IMAGE MAPPING
- Honda Civic -> Honda Civic Hybrid (2022, Europe) photograph.
- Toyota Fortuner -> 2015 Toyota Fortuner photograph.
- Hyundai i20 -> Hyundai i20 (BC3) Facelift photograph.
- BMW 5 Series -> BMW 5 Series LWB Sedan (G60) photograph.
- Ford Ranger -> Ford Ranger (T6/P703) Wildtrak photograph.
- Tesla Model 3 -> Tesla Model 3 (2023) photograph.
- Maruti Swift -> Suzuki Swift photograph, same production model family.
- Mahindra Thar -> Mahindra Thar CRDi photograph.
- Tata Nexon EV -> 2020 Tata Nexon EV photograph.
- Audi Q7 -> Audi Q7 photograph.
- Unknown mapping -> real Volkswagen Beetle photograph as the generic photographic fallback.

### CONSISTENCY
- Search/catalog, vehicle details, and booking all use the shared `getVehicleImage` resolver.
- Broken configured image loads use the shared photographic fallback.
- No PostgreSQL schema, booking logic, availability logic, authentication, Owner, or Advisory changes were made.

### VERIFICATION
- PASS — all configured URLs responded as raster JPEG/PNG media.
- PASS — no SVG files remain in the vehicle-image asset directory.
- PASS — frontend diagnostics report no errors in changed customer files.
- PASS — `cd frontend; npm run build`.
- PASS — `git diff --check`.
- Manual browser QA: NOT PERFORMED — pending user verification.

### PHASE 3 DEFERRED
- Real My Bookings/history, payment integration, profile, and messaging remain deferred.

## 11. PHASE 3 CUSTOMER OPERATIONS

### IMPLEMENTED
- My Bookings now reads customer-specific booking history from PostgreSQL.
- Booking details retrieves the real booking and rejects missing or other-customer bookings.
- Payments reads existing payment records linked through customer bookings.
- Profile reads and updates the existing customers record joined to users.
- Messages reads booking-scoped customer conversations and supports customer message creation.
- Customer navigation now includes Payments.
- Phase 2 vehicle catalog, details, availability, booking creation, pricing, and image resolver remain intact.

### INTERNALLY VERIFIED
- Live runtime tested against `http://127.0.0.1:4000`, the frontend backend target.
- Customer identity is supplied by the existing demo session as `X-Customer-Id`; no customer ID is hardcoded in customer-operation reads.
- Customer 1 and Customer 2 receive only their own bookings and messages.
- Customer 6 receives a truthful empty bookings result.
- Booking detail ownership and missing IDs return 404.
- Payment status, amount, method, reference, and paid date are read from payments; missing payment records remain null/no record.
- Profile update was persisted and restored in PostgreSQL during testing.
- Message creation was persisted and deleted during testing cleanup.
- Cross-customer message creation was rejected.
- No schema or advisory changes were made.

### MOCK/STATIC
- None for Phase 3 My Bookings, Booking Details, Payments, Profile, or Messages customer flows.
- Existing demo authentication is still a lightweight local session, not production authentication.

### DEFERRED
- Phase 4 Owner operations and all later phases remain deferred.
- No real payment gateway was added.
- No WebSockets, Socket.IO, AI, notifications, or messaging infrastructure was added.

### BROKEN
- None found in internal Phase 3 verification.

### FILES CHANGED
- `backend/routes/customer.js`
- `backend/phase3_customer_test.js`
- `frontend/src/services/customerApi.js`
- `frontend/src/pages/CustomerPages.jsx`
- `frontend/src/components/customer.jsx`
- `frontend/src/routes/AppRouter.jsx`
- `frontend/src/routes/navigation.js`
- `frontend/src/styles.css`
- `PROJECT_CHECKPOINT.md`

### DATABASE CHANGES
- None. Existing users, customers, bookings, payments, vehicles, locations, rental_companies, and messages tables were reused.

### API ENDPOINTS
- `GET /api/customer/bookings` — current customer's booking history.
- `GET /api/customer/bookings/:id` — owned booking detail.
- `GET /api/customer/payments` — payment records for owned bookings.
- `GET /api/customer/profile` — current customer profile.
- `PATCH /api/customer/profile` — update name, phone, and address.
- `GET /api/customer/messages` — messages for the current customer's bookings.
- `POST /api/customer/messages` — create a message on an owned booking.

### TESTS
- PASS — `node backend/phase3_customer_test.js` against port 4000.
- PASS — customer isolation and missing-session checks.
- PASS — booking, detail, payment, profile, and message persistence checks.
- PASS — `npm run smoke` (20/20).
- PASS — `npm run advisory` (34/34).
- PASS — `cd frontend; npm run build`.
- PASS — `git diff --check`.

### EXTERNAL BROWSER QA REQUIRED
- Login as customer and verify My Bookings, booking details, Payments, Profile editing, Messages, refresh persistence, and Phase 2 vehicle flows.
- Manual browser QA was not performed.

### ONE EXACT NEXT ACTION
- Perform external browser QA for Phase 3 Customer Operations.

## 13. FRONTEND PHASE 4 — OWNER WORKSPACE FOUNDATION

### STATUS
- Frontend Phase 4 Owner Workspace Foundation: IMPLEMENTED + INTERNALLY VERIFIED.
- Frontend Phase 4 is limited to the Owner dashboard, fleet inventory, vehicle detail foundation, and advisory entry point.
- Frontend Phase 5 has not started.

### IMPLEMENTED
- Owner dashboard now derives total fleet, available, booked/rented, maintenance, and status-mix counts from the real vehicle API.
- Owner dashboard displays advisory utilization evidence from the existing locked advisory API when evidence exists.
- Owner fleet page uses real PostgreSQL vehicle records through `GET /api/vehicles`.
- Owner fleet supports search by brand/model/vehicle number/city and filtering by actual status and type.
- Owner fleet cards show real vehicle-specific photographic images, brand/model, category, location, rate, status, year, mileage, transmission, and fuel level.
- Owner vehicle detail loads the real vehicle record and shows the shared vehicle photograph, operational status, rate, location, and supported metadata.
- Owner vehicle detail honestly marks inspection, maintenance, and history sections unavailable because those Owner APIs do not exist.
- Added `/owner/advisory` route using the existing AdvisoryDashboard and added Advisory to Owner navigation.
- Existing SmartCar public-home/logo behavior and academic navigation separation remain unchanged.

### API INTEGRATIONS
- `GET /api/vehicles` — Owner dashboard and fleet inventory.
- `GET /api/vehicles/:id` — Owner vehicle detail.
- `GET /api/advisory/vehicle-metrics` — Owner dashboard evidence summary.
- `GET /api/advisory/baselines` — available to the existing advisory surface.
- `GET /api/advisory/recommendations` — available to the existing advisory surface.

### MISSING BACKEND DEPENDENCIES
- No Owner booking list/detail API exists; Owner Bookings remains an honest dependency state.
- No Owner inspections API exists; Owner Inspections remains an honest dependency state.
- No Owner maintenance API exists; Owner Maintenance remains an honest dependency state.
- No Owner vehicle history/status-history API exists; Owner History remains an honest dependency state.
- No Owner settings persistence API exists; Owner Settings remains an honest dependency state.
- No fake records or new backend architecture were added to conceal these gaps.

### FILES CHANGED
- `frontend/src/pages/OwnerPages.jsx`
- `frontend/src/services/ownerApi.js`
- `frontend/src/routes/AppRouter.jsx`
- `frontend/src/routes/navigation.js`
- `frontend/src/styles.css`
- `PROJECT_CHECKPOINT.md`

### DATABASE/BACKEND/ADVISORY CHANGES
- None. Existing APIs and data were reused; schema, backend, database, and advisory logic were not changed.

### VALIDATION
- PASS — frontend diagnostics for changed Owner files.
- PASS — `cd frontend; npm run build`.
- PASS — live `GET /api/vehicles` on port 4000.
- PASS — live advisory vehicle metrics, baselines, and recommendations endpoints on port 4000.
- PASS — `git diff --check`.
- Manual browser QA: NOT PERFORMED.

### REGRESSION BOUNDARY
- Public, authentication, Customer Phase 2, and Customer Phase 3 source routes were not intentionally redesigned.
- Owner pages that depend on missing APIs remain explicitly unavailable rather than mock-backed.

### NEXT EXACT ACTION
- Perform external browser QA for Frontend Phase 4 Owner Workspace Foundation.

## 12. PHASE 2 AVAILABILITY CORRECTION

### ROOT CAUSE
- Search Cars `AVAILABLE` is the vehicle's current operational status from `vehicles.status`; it is not availability for a requested rental interval because Search does not collect rental dates.
- Mahindra Thar vehicle 8 is operationally `AVAILABLE`, but PostgreSQL contains booking 21 with `PENDING` status from 05 Sep 2026 19:42 IST to 06 Sep 2026 19:42 IST.
- The reported request, 05 Sep 2026 20:13 to 21:13 IST, genuinely overlaps booking 21.
- The seeded completed booking for vehicle 8 ended on 08 Aug and is excluded by the active booking status filter.
- PostgreSQL uses `Asia/Calcutta`; the API accepts local datetime strings and stores/returns the equivalent timestamp consistently. The observed `Z` response is UTC serialization, not a one-hour conflict bug.

### FIX
- Preserved the correct half-open overlap rule: requested pickup `<` existing return and requested return `>` existing pickup.
- Availability responses now include the real conflicting booking ID/status/interval and a database-derived next available timestamp when a conflict exists.
- Booking page now explains the conflict and next available time instead of only showing a generic unavailable message.
- No database schema, booking business logic, vehicle API contract, Phase 3 customer operations, Owner, or Advisory logic was changed.

### AVAILABILITY STATUS
- Vehicle list operational status: IMPLEMENTED + INTERNALLY VERIFIED.
- Date-specific availability: IMPLEMENTED + INTERNALLY VERIFIED.
- Conflict detection: IMPLEMENTED + INTERNALLY VERIFIED.
- Customer conflict explanation: IMPLEMENTED + INTERNALLY VERIFIED.

### TEST MATRIX
- PASS — no-conflict vehicle/date range returns available.
- PASS — overlapping existing PENDING booking returns unavailable with conflict details.
- PASS — Mahindra 05 Sep 20:13-21:13 IST reproduces the genuine booking 21 conflict.
- PASS — one-hour no-conflict range returns available.
- PASS — exact end boundary does not conflict.
- PASS — exact start boundary outside the completed booking does not conflict.
- PASS — invalid date order returns 400.
- PASS — nonexistent vehicle returns 404.
- PASS — valid booking persists and returns correct amount.
- PASS — conflicting booking creation returns 409.
- PASS — existing backend smoke suite 20/20.
- PASS — advisory verification 34/34.
- PASS — frontend production build.
- PASS — `git diff --check`.

### TEST DATA NOTE
- Booking 21 is an existing real `PENDING` database record and was not deleted as test cleanup because it was not created by this verification run. It is the truthful source of the reported Mahindra conflict.

### USER QUESTION: ERROR NOW OR FUTURE PHASE?
- This was not a Phase 3 or future-phase issue. It was a Phase 2 availability UX ambiguity: operational `AVAILABLE` was displayed before date-specific validation.
- The backend behavior was correct for the actual overlapping booking. The Phase 2 correction now explains why the requested dates are unavailable.

### MANUAL BROWSER QA
- NOT PERFORMED. Verify Mahindra Thar with the reported dates, confirm the conflicting interval and next-available message, then test a no-conflict one-hour range.

Next phase:
- Phase 3 only after the user completes external browser QA.
