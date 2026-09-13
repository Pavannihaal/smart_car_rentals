# SmartCar â€” Development Status

**Last Updated:** 2026-09-04

---

# 1. Current Verified State

| Area                         | Status         |
| ---------------------------- | -------------- |
| Phase 1 â€” Foundation         | COMPLETE       |
| Phase 2 â€” Database           | COMPLETE       |
| Phase 3A â€” React Foundation  | COMPLETE       |
| Phase 3B â€” Application Shell | CURRENT / NEXT |
| Advisory Market Research     | COMPLETE       |
| Advisory Design              | COMPLETE       |
| Advisory Database Audit      | COMPLETE       |
| Advisory SQL                 | COMPLETE (Final Correctness Pass) |
| Advisory Backend             | NOT STARTED    |
| Advisory UI                  | NOT STARTED    |
| Real Operator Validation     | NOT STARTED    |

---

# 2. Phase 2 Verified Database

12 tables are implemented and verified.

Seed:

* 12 users
* 9 customers
* 3 rental companies
* 5 locations
* 10 vehicles
* 13 bookings
* 11 payments
* 8 inspections
* 5 maintenance records
* 46 vehicle status-history records
* 6 reviews
* 10 messages

The Phase 2 validation checks passed.

---

# 3. Environment Note

PostgreSQL execution required a temporary staged directory because the repository path contains non-ASCII characters.

This is an environment/tooling issue and not a database-design failure.

---

# 4. New Advisory Direction

SmartCar is now positioned as:

**Car Rental Operations & Fleet Advisory Platform**

The advisory layer:

* uses rental-company operational data;
* analyzes it using SQL;
* evaluates explicit business rules;
* detects operational patterns;
* provides recommendations;
* explains recommendations using database evidence.

AI is not required.

---

# 5. Advisory SQL Implementation Results

## Files Created/Modified

| File | Purpose | Status |
|------|---------|--------|
| `database/advisory_views.sql` | 13 analytical views (Metrics A-L + unified `advisory_vehicle_metrics`) | Corrected |
| `database/advisory_rules.sql` | R1â€“R10 advisory rules with UNION ALL output | Corrected |
| `database/advisory_verify.js` | Node.js validation script with correctness checks | Corrected |
| `package.json` | Added `"advisory"` npm script | Complete |

## Correction Phase (2026-09-04)

### Implementation Corrections

| # | Issue | Fix |
|---|-------|-----|
| 1 | `COALESCE(..., 0)` made missing evidence look like measured zero in baselines | Missing evidence now NULL; baselines use `FILTER (WHERE metric IS NOT NULL)` |
| 2 | Vehicles without maintenance / READY / inspections / revenue silently contributed 0 to fleet medians | Per-metric eligibility filter; baselines report eligible vs excluded population |
| 3 | Utilization could exceed 100% when rental_days > observation_window | Rental days clipped to `[active_start, active_end]`; utilization capped with `LEAST(..., 1.0)` |
| 4 | R10 grouped by per-vehicle `observation_window_days` causing unintended grouping | Restructured to aggregate via `cat_aggs` CTE, filter with WHERE; one row per `type` |
| 5 | Validation script had only superficial checks | 18 correctness checks including utilization bound, NULL evidence, baseline populations, R10 uniqueness, schema sanity |

### Baseline Populations (10 vehicles)

| Metric | Eligible | Excluded | Median |
|--------|---------:|---------:|-------:|
| utilization | 1 | 9 | 0.8551 |
| maintenance_downtime_days | 5 | 5 | 1.0000 |
| maintenance_frequency (count) | 10 | 0 | 1.0000 |
| avg_return_ready_days | 3 | 7 | 0.6250 |
| inspection_issue_rate | 8 | 2 | 0.0000 |
| paid_revenue | 9 | 1 | 10000.0000 |

*Note: low eligibility reflects the academic seed dataset â€” vehicles were created today but most booking activity predates the per-vehicle active window, so most vehicles have no in-window rental evidence.*

### Final Rule Results

| Rule | Severity | Count | Vehicles/Categories |
|------|----------|------:|---------------------|
| R1 UNDERUTILIZED | REVIEW | 0 | â€” |
| R2 MAINTENANCE_DOWNTIME | REVIEW | 1 | V5 |
| R3 TURNAROUND_BOTTLENECK | REVIEW | 0 | â€” |
| R4 REPEATED_INSPECTION_ISSUES | REVIEW | 0 | â€” |
| R5 HIGH_DEMAND_OPERATIONAL_RISK | HIGH_PRIORITY | 0 | â€” |
| R6 DEMAND_SIDE_UNDERUTILIZATION | INFO | 0 | â€” |
| R7 OPERATIONAL_UNDERPERFORMANCE | HIGH_PRIORITY | 0 | â€” |
| R8 HEALTHY_PERFORMER | INFO | 1 | V6 |
| R9 RECURRING_MAINTENANCE | REVIEW | 0 | â€” |
| R10 FLEET_EXPANSION_REVIEW | INFO | 1 | Sedan |
| **Total** | | **3** | |

### Changed Classifications vs prior 22

* Prior output (22) relied on `COALESCE(..., 0)` which inflated baselines and over-classified vehicles
* R5/R2/R3 triggered only when both evidence was present and exceeded median Ã— 1.5
* Now vehicles without in-window rental evidence correctly have NULL utilization, so they cannot trigger R1/R5/R6/R7/R8
* V5 still triggers R2 because its `IN_PROGRESS` maintenance produces a real 22.75-day downtime
* V6 still triggers R8 because the future Sep 5â€“10 booking produces valid in-window utilization

### Correctness Validation â€” All 18 Checks Pass

* No utilization > 1.0
* No negative rental duration
* No negative maintenance downtime
* All vehicles have positive observation window
* Vehicles without READY transitions have NULL avg_return_ready_days
* Vehicles without maintenance have NULL maintenance_downtime_days
* Vehicles without inspections have NULL inspection_issue_rate
* Vehicles without paid payments have NULL paid_revenue
* Schema files unchanged (12 tables intact)
* Each baseline correctly excludes vehicles without evidence
* R10 produces â‰¤ 1 row per category (1 row across 1 category)
* All 10 rule SQL branches execute
* All canonical columns present (32 columns)

### Remaining Limitations

1. Observation window anchored at `vehicles.created_at` is small (â‰ˆ6.3 days) because the seed creates all vehicles today; most historical bookings fall outside the per-vehicle active window
2. `tstzrange_union_agg` is not available in the bundled PostgreSQL build, so the simplified clip-and-sum approach is used (correct for non-overlapping bookings, may overcount if future bookings overlap)
3. R10 aggregates with `AVG()` over per-vehicle averages; categories with very few vehicles are still subject to outlier influence

| R1: UNDERUTILIZED | REVIEW | 3 |
| R6: DEMAND_SIDE_UNDERUTILIZATION | INFO | 3 |
| R10: FLEET_EXPANSION_REVIEW | INFO | 1 |
| R8: HEALTHY_PERFORMER | INFO | 2 |

### Validation Checks
- No division-by-zero: PASS
- No NULL utilization for active vehicles: PASS
- Fleet medians computable: PASS (utilization: 53.4%, downtime: 0.5 days, frequency: 0.5)
- R3 READY transition exclusion: PASS (3 vehicles with READY transitions)

## How to Run

```bash
npm run advisory
```

---

# 6. Research Conclusion

Market research shows that existing platforms already provide many individual capabilities:

* booking;
* availability;
* maintenance;
* inspection;
* turnaround;
* utilization;
* revenue/profitability;
* pricing;
* forecasting;
* recommendations.

Therefore these cannot be presented individually as SmartCar's unique innovation.

The project contribution is instead:

> **A DBMS-first, cross-table and explainable operational decision-support framework for rental-fleet data.**

---

# 6. Candidate Advisory Rules

1. Low utilization
2. Excessive maintenance downtime
3. Long return-to-ready
4. Repeated inspection issues
5. High utilization + high downtime
6. Low utilization + low downtime
7. Low utilization + high downtime
8. High utilization + low downtime
9. Repeated maintenance
10. Fleet/category attention

---

# 7. Required Advisory Audit

Before implementation, inspect the real schema and determine whether it can calculate:

* utilization;
* maintenance downtime;
* inspection issue rate;
* status duration;
* return â†’ inspection;
* return â†’ ready;
* maintenance frequency;
* maintenance cost;
* revenue per vehicle;
* recurring operational problems.

Each requirement must be classified:

**Directly computable / Partially computable / Impossible**

No schema changes before this audit.

### 7A. Audit Findings

**Files inspected:**

* `database/schema.sql`
* `database/seed.sql`
* `database/queries.sql`
* `database/verify_db.js`
* `frontend/src/data/databaseSchema.js`

**Results:**

* **4 metrics DIRECTLY COMPUTABLE**
* **13 metrics PARTIALLY COMPUTABLE**
* **0 metrics IMPOSSIBLE**
* **No mandatory schema changes required**

**Known limitations:**

* `vehicle_status_history` is incomplete for several seed vehicles and does not reliably cover all lifecycle transitions.
* `maintenance.end_date` is NULL for `IN_PROGRESS`/`PENDING` records, so completed downtime is unknown for ongoing maintenance.
* `vehicle_inspections.issues_found` is unstructured `TEXT` and cannot be reliably parsed to count individual issues.
* Not all returned bookings have corresponding inspection records.
* Several returned vehicles in seed data lack `READY` transitions in `vehicle_status_history` (Vehicles 5, 9, 10).
* Revenue definition is ambiguous: `bookings.total_amount` may include pending amounts; `payments.amount` includes `PENDING`/`FAILED`/`REFUNDED` statuses; some bookings lack payment records.
* Recurring maintenance/inspection problem detection is limited by free-text `description` and `issues_found` fields.

---

# 8. Real-World Validation

Secondary research does not equal direct field validation.

Still required:

* approximately 5â€“10 rental operators where possible;
* open-ended questions;
* actual workflow descriptions;
* pain-point matrix;
* frequency;
* time/cost impact;
* existing workaround;
* validation or rejection of assumptions.

Do not ask leading questions such as:

> â€œWould you use our lifecycle system?â€

---

# 9. Agent Handoff Protocol

Every agent must record:

* date;
* agent/tool;
* phase/sub-phase;
* completed;
* partially completed;
* not started;
* files changed;
* tests/checks;
* issues/blockers;
* **ONE exact next action**.

---

# 10. Current Handoff

### Date

2026-09-04

### Completed

* advisory direction established;
* market research incorporated;
* project positioning updated;
* candidate advisory rules defined;
* advisory metrics identified;
* database audit requirements defined;
* advisory database audit completed;
* files inspected: `database/schema.sql`, `database/seed.sql`, `database/queries.sql`, `database/verify_db.js`, `frontend/src/data/databaseSchema.js`;
* findings: 4 directly computable, 13 partially computable, 0 impossible;
* no mandatory schema changes required;
* advisory design finalized in `ADVISORY_RESEARCH_AND_DESIGN.md`;
* observation window revalidated: fleet-wide `@report_start_date` / `@report_end_date` with per-vehicle active period (`@report_end_date - GREATEST(@report_start_date, vehicle.created_at)`) to ensure consistent cross-vehicle comparison;
* 12 metric formulas documented with exact SQL-level definitions;
* fleet baseline method selected (fleet median, stratified by `type` when n >= 2);
* thresholds critically validated and refined:
  - utilization low threshold changed from `< fleet median` to `< fleet median - 0.10` to avoid ~50% classification rate in small datasets;
  - maintenance frequency threshold changed from `> fleet median Ã— 1.5` to `>= 2 AND > fleet median` for small-sample robustness;
  - all combined utilization/downtime rules updated to use the new utilization offset;
* utilization/downtime decision matrix updated;
* R10 (FLEET_EXPANSION_REVIEW) rewording completed with explicit hedging language ("decision-support signal, not a business directive");
* incomplete data handling policy defined (SUFFICIENT_DATA / LIMITED_DATA / INSUFFICIENT_DATA);
* recommendation severity model defined (INFO / REVIEW / HIGH_PRIORITY);
* explainability flow designed;
* seed data sanity check criteria documented;
* example output updated to reflect new thresholds;
* **advisory analytical SQL/views implemented** (`database/advisory_views.sql`, `database/advisory_rules.sql`, `database/advisory_verify.js`);
* **advisory SQL validation executed successfully** against seed data â€” all 14 metric views and all 10 rules (R1â€“R10) produce correct results;
* **22 recommendations generated** from 10 vehicles, with fleet medians computed for all metrics;
* `package.json` updated with `"advisory": "node database/advisory_verify.js"` script.

### Critical Design Limitations (Unresolved)

* Utilization is PARTIALLY COMPUTABLE because `vehicle_status_history` is incomplete for several seed vehicles.
* Ongoing maintenance downtime uses `@report_end_date` as a proxy for unknown `end_date`.
* Returnâ†’ready metric excludes vehicles without `READY` transitions (Vehicles 5, 9, 10 in seed data), potentially biasing the fleet median low.
* Revenue definition is ambiguous (`bookings.total_amount` vs `payments.amount` with `payment_status = 'PAID'`).
* Recurring problem detection is limited by free-text `description` and `issues_found`.
* No schema changes are required, but application logic must guarantee complete lifecycle transitions going forward.
* The utilization offset (`-0.10`) was validated against seed data and produces actionable classifications.

### Not Started

* advisory backend implementation;
* advisory UI implementation;
* real operator interviews.

## ONE EXACT NEXT ACTION

**Build the React advisory dashboard to display the recommendations from `npm run advisory` output, allowing operators to view rules by severity, vehicle, and category with drill-down to source evidence records.**
## Final Correctness Pass (2026-09-04)

Replaced the LEAST-cap utilization with proper tstzrange interval-union via PostgreSQL range_agg. All timestamp-based metrics now filter to per-vehicle active window [active_start, active_end).

### Validation: 21/21 PASS

- No utilization > 1.0 (no cap in code)
- Rental time never exceeds observation window
- No overlapping booking time is double-counted (union length equals deoverlap)
- Timestamp-based metrics respect per-vehicle report window (re-derivation agrees)
- All 10 rule branches identifiable in SQL (CTE-name regex)
- schema.sql has 12 tables (unchanged)
- No negative rental duration / maintenance downtime
- All vehicles have positive observation window
- NULL evidence preserved for R2/R3/R4/J
- maintenance_frequency=0 semantics preserved
- R10 <= 1 row per category
- Canonical 32-column output preserved
- All 6 baseline eligibility checks pass

### Final Result: 0 Recommendations

Every seed booking/maintenance/event predates each vehicle's active_start (= today, since seed never sets created_at). Only V6 retains in-window evidence from booking 12 (Sep 5-10, CONFIRMED), yielding 85.61% utilization. With only 1 vehicle in each baseline, no rule threshold is exceeded. This is the correct outcome under the finalized window definition, not a SQL defect.

Seed ehicles.created_at is unset (defaults to today) so historical August events are correctly excluded by the design's per-vehicle window. A realistic seed would backdate vehicle creation; that is intentionally out of scope for the advisory SQL phase.

### Final Baseline Populations

| Metric | Eligible | Excluded | Median |
|--------|---------:|---------:|-------:|
| utilization | 1 | 9 | 0.8561 |
| maintenance_downtime_days | 1 | 9 | 6.2786 |
| maintenance_frequency | 10 | 0 | 1.0000 |
| avg_return_ready_days | 0 | 10 | NULL |
| inspection_issue_rate | 0 | 10 | NULL |
| paid_revenue | 0 | 10 | NULL |

## 35. Rental Duration Correction (Final)

### Issue

upper(m.u) - lower(m.u) over a 	stzmultirange equals the outer-bounds span, which includes gaps between non-overlapping ranges. For example, two 3.375-day bookings with a gap produce 10.375 days instead of 6.75 days.

### Correction in advisory_rental_days

After ange_agg(r) produces a multirange per vehicle, the view now unnests it into its constituent ranges and sums (upper - lower) per part:

`sql
parts AS (
  SELECT m.vehicle_id,
         SUM(EXTRACT(EPOCH FROM (upper(p.r) - lower(p.r))) / 86400.0) AS rental_days,
         (SELECT COUNT(*) FROM clipped c WHERE c.vehicle_id = m.vehicle_id) AS booking_count
  FROM merged m, LATERAL unnest(m.u) AS p(r)
  GROUP BY m.vehicle_id
)
`

* Overlap merging preserved (range_agg merges overlapping intervals into one part).
* Clipping to [active_start, active_end) preserved.
* No LEAST/utilization cap exists.
* ental_days cannot exceed observation_window_days because every constituent range lies inside the window.
* ooking_count counts only in-window eligible bookings (matches the rows that contribute to rental_days).

### New verification checks (independent re-derivation)

`
WITH fleet AS (...advisory_fleet_bounds),
windows AS (SELECT vehicle_id, active_start, active_end FROM vehicles v CROSS JOIN fleet f),
clipped AS (
  SELECT b.vehicle_id,
         tstzrange(GREATEST(b.pickup_datetime, w.active_start),
                   LEAST(b.return_datetime, w.active_end), '[)') AS r
  FROM bookings b JOIN windows w ON w.vehicle_id = b.vehicle_id
  WHERE b.status IN ('COMPLETED','ACTIVE','CONFIRMED')
    AND ...non-empty after clip...
),
merged AS (SELECT vehicle_id, range_agg(r) AS u FROM clipped GROUP BY vehicle_id),
parts  AS (SELECT m.vehicle_id, p.r FROM merged m, LATERAL unnest(m.u) AS p(r)),
totals AS (
  SELECT vehicle_id,
         SUM(EXTRACT(EPOCH FROM (upper(r) - lower(r))) / 86400.0) AS indep_rental_days,
         (SELECT COUNT(*) FROM clipped c WHERE c.vehicle_id = p.vehicle_id) AS indep_booking_count
  FROM parts p GROUP BY vehicle_id
)
SELECT ... FROM totals t JOIN advisory_rental_days rd USING (vehicle_id)
`

Compare indep_rental_days vs iew_rental_days (tolerance 1e-6) and indep_booking_count vs iew_booking_count (exact).

### Validation: 22/22 PASS

All 21 prior checks preserved + 2 new ones:

- rental_days == sum of merged multirange part durations (1 vehicle agrees with independent re-derivation)
- booking_count == count of in-window eligible bookings (1 vehicle agrees)

### Manual V6 verification

V6 has one in-window booking (id 12, CONFIRMED, Sep 5 09:00 - Sep 10 18:00).

* in_window_days = 5.375
* View rental_days = 5.375 (sum of one merged part)
* View booking_count = 1
* observation_window_days = 6.274
* utilization = 5.375 / 6.274 = 85.67%

The rental duration correctly reflects actual occupied time, not the outer-bounds span of any multirange. No gap is double-counted because there are no gaps in the dataset.

### Verdict

**The advisory SQL implementation is now genuinely ready for backend implementation.**

## ONE EXACT NEXT ACTION

**Begin backend advisory implementation.**

## 37. Final Count-Metric NULL/Zero Correction

### Issue

dvisory_vehicle_metrics LEFT JOINed every metric view. Per-view rows only existed when there was at least one contributing record. As a result, maintenance_frequency, ooking_count, eturn_ready_count, eturn_with_inspection_count, 	otal_inspections, issue_inspections, paid_payment_count were NULL for vehicles with zero records, violating the design contract that count metrics retain a true zero.

### Correction

In the unified view, the seven count metrics are now COALESCEd to 0 from the LEFT JOIN:

`sql
COALESCE(rd.booking_count, 0)            AS booking_count,
COALESCE(mf.maintenance_count, 0)       AS maintenance_frequency,
COALESCE(ri.return_with_inspection_count, 0) AS return_with_inspection_count,
COALESCE(rr.return_ready_count, 0)      AS return_ready_count,
COALESCE(iir.total_inspections, 0)      AS total_inspections,
COALESCE(iir.issue_inspections, 0)      AS issue_inspections,
COALESCE(rv.paid_payment_count, 0)      AS paid_payment_count
`

Evidence-based metrics (rental_days, utilization, maintenance_cost, maintenance_downtime_days, avg_return_inspection_days, avg_return_ready_days, inspection_issue_rate, paid_revenue) remain plain LEFT JOIN columns, so they stay NULL when there is no evidence.

### Verification

Seven zero-source checks (one per count metric) independently identify vehicles with zero raw records via NOT EXISTS subqueries and confirm the unified view reports 0, not NULL for them. All 7 pass.

Seven evidence-based NULL checks confirm vehicles without evidence still get NULL for the corresponding measurement.

The maintenance_frequency baseline eligibility check now reports eligible=10, excluded=0 (it previously reported eligible=1, excluded=9).

### Zero-count distribution

| Metric | Zero-source vehicles |
|--------|---------------------:|
| maintenance_frequency | 9 |
| booking_count | 9 |
| total_inspections | 10 |
| issue_inspections | 10 |
| paid_payment_count | 10 |
| return_ready_count | 10 |
| return_with_inspection_count | 10 |

All 10 inspections fall outside per-vehicle active windows (seed created_at = today), so 	otal_inspections=0 and issue_inspections=0 for every vehicle. That is correct behavior, not a defect.

### Validation: 31/31 PASS

All 22 prior checks preserved + 9 new ones:

* No in-window bookings => NULL rental_days
* No in-window bookings => NULL utilization
* Zero-source maintenance_frequency => 0
* Zero-source booking_count => 0
* Zero-source return_with_inspection_count => 0
* Zero-source return_ready_count => 0
* Zero-source total_inspections => 0
* Zero-source issue_inspections => 0
* Zero-source paid_payment_count => 0

Baseline populations updated: maintenance_frequency eligible=10/10 (median 0.0000).

### Verdict

Advisory SQL is genuinely ready for backend implementation. All count/evidence semantics are correct.

## ONE EXACT NEXT ACTION

**Begin backend advisory implementation.**

## 38. Final Maintenance-Cost NULL Semantics Correction

### Issue

dvisory_maintenance_cost used COALESCE(SUM(m.cost), 0), and the unified view used COALESCE(mc.total_maintenance_cost, 0) AS maintenance_cost. Both silently converted missing/unknown costs into artificial zero, violating the evidence-based NULL contract.

### Correction

* dvisory_maintenance_cost now returns SUM(m.cost) directly. PostgreSQL SUM() of all-NULL inputs returns NULL, which is exactly the desired semantics.
* dvisory_vehicle_metrics.maintenance_cost now exposes mc.total_maintenance_cost directly without any COALESCE.
* maintenance_frequency retains COALESCE(mf.maintenance_count, 0) (count metric, genuine zero required).

### Semantics after correction

| Scenario | maintenance_cost |
|----------|------------------|
| No in-window maintenance records | NULL |
| In-window maintenance records, all cost NULL | NULL |
| In-window maintenance records with at least one non-NULL cost | actual summed cost (possibly 0 if all real costs are 0) |

### Verification

Three new explicit checks:

1. Vehicles with maintenance_frequency = 0 must have maintenance_cost IS NULL.
2. maintenance_cost = 0 is forbidden UNLESS a raw in-window maintenance.cost = 0 row exists for that vehicle (i.e., no NULL -> 0 conversion).
3. If at least one in-window maintenance record with non-NULL cost exists, maintenance_cost must be non-NULL.

### Validation: 34/34 PASS

All 31 prior + 3 new maintenance-cost checks pass.

### Verdict

Advisory SQL is genuinely ready for backend implementation. Count metrics retain true zero; evidence-based measurements (including maintenance_cost) retain NULL when no evidence exists.

## ONE EXACT NEXT ACTION

**Begin backend advisory implementation.**


## Section 39 — React Advisory UI Implementation

Date: 2026-09-04

### Files changed
- rontend/src/services/advisoryApi.js — new API client for /api/advisory/*
- rontend/src/components/AdvisoryDashboard.jsx — new React advisory dashboard
- rontend/src/pages/OwnerPages.jsx — OwnerAnalyticsPage now renders AdvisoryDashboard
- rontend/src/styles.css — added .advisory-section and .advisory-note styles

### Backend endpoints consumed
- GET /api/advisory/health
- GET /api/advisory/recommendations
- GET /api/advisory/vehicle-metrics
- GET /api/advisory/baselines

### NULL/zero semantics preserved in UI
- Evidence-based metrics (rental_days, utilization, maintenance_cost, maintenance_downtime_days, avg_return_inspection_days, avg_return_ready_days, inspection_issue_rate, paid_revenue) display as "—" when null
- Count metrics (booking_count, maintenance_frequency, return_with_inspection_count, return_ready_count, total_inspections, issue_inspections, paid_payment_count) display as "0" when zero
- No frontend fabrication, threshold calculation, or business-rule duplication

### Validation
- 
pm run build (frontend) — success
- 
ode backend/smoke_test.js — 20/20 PASS
- 
pm run advisory — 34/34 PASS

### Next action
Frontend advisory UI is complete and validated. Backend advisory API is live and returning correct NULL/zero semantics.


## Section 40 — Analytics UI Correctness Audit

Date: 2026-09-04

### Findings and corrections

1. **Baseline population semantics** — Replaced misleading single 'Baseline Population: 10' card with metric-specific baseline population cards (Utilization: 1, Maintenance downtime: 1, Maintenance frequency: 10, Return ? READY: 0, Inspection issue rate: 0, Paid revenue: 0).

2. **Vehicle identifiers** — API provides rand, model, 	ype, ehicle_id but no ehicle_label. UI now uses rand + model as the primary vehicle identifier with #vehicle_id fallback.

3. **Recommendation table schema alignment** — Recommendations API does not provide metric_name, metric_value, 	hreshold_value, aseline_value. Table restructured to display actual backend fields: Rule, Vehicle, Type, Severity, Observation, Recommended action.

4. **Recommendation empty state** — Updated wording to 'No actionable recommendations currently detected' to avoid implying a broken system.

5. **Fleet overview cards** — Replaced generic 'Baseline Population' card with 'Vehicles with rental evidence' (derived from utilization_pop baseline).

6. **Methodology section** — Added explainability section clarifying deterministic, database-driven, evidence-based, decision-support nature.

7. **CSS** — Added .baseline-grid, .baseline-card, .methodology-section, .methodology-list, .table-scroll styles.

### Validation
- 
pm run build — success
- 
ode backend/smoke_test.js — 20/20 PASS
- 
pm run advisory — 34/34 PASS

### Next action
Manual browser QA at http://localhost:5173/owner/analytics to verify visual correctness.


## Section 41 — Owner Analytics UX Redesign

Date: 2026-09-04

### Redesign summary
Transformed the AdvisoryDashboard from a database-style report into a polished Fleet Operations & Advisory Dashboard.

### Files changed
- rontend/src/components/AdvisoryDashboard.jsx
- rontend/src/styles.css

### New layout hierarchy
1. Key Fleet Signals (4 cards): Total vehicles, Rental evidence, Maintenance evidence, Active recommendations
2. Operational Snapshot: Rental Activity and Maintenance Activity insight panels with fleet medians
3. Vehicle Insights: Card-based layout replacing the 16-column table. Each card shows vehicle identity, evidence status, key metrics, and expandable full metrics.
4. Recommendations: Polished empty state with actionable wording
5. Fleet Baselines: Compact metric-specific cards with population counts
6. Methodology: Visual flow diagram (Database ? SQL Metrics ? Fleet Baseline ? R1–R10 Rules ? Operational Signal ? Owner Review)

### Visual improvements
- Evidence pills (Rental + Maintenance) on vehicle cards
- Vehicles with evidence get teal left-border emphasis
- Vehicles without evidence are visually de-emphasized
- Expandable "View full metrics" interaction preserves access to all 16 metrics
- Responsive grids: 4-up ? 2-up ? 1-up across breakpoints
- Methodology flow uses arrows instead of bullet list

### Data integrity preserved
- NULL evidence ? "—" in UI
- Zero counts ? "0" in UI
- No backend, SQL, or schema changes
- No artificial recommendations
- All API values displayed exactly as received

### Validation
- 
pm run build — success
- 
ode backend/smoke_test.js — 20/20 PASS
- 
pm run advisory — 34/34 PASS
- Live API simulation — all sections render correctly with real data

### Remaining limitations
- Seed dataset has sparse evidence (1 rental, 1 maintenance, 0 recommendations)
- UI communicates sparse evidence professionally without fabricating data

