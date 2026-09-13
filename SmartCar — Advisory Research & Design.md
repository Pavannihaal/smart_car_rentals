# SmartCar — Advisory Research & Design

## 1. Purpose

This document defines the new **DBMS-driven rental operations advisory layer** before implementation.

It should answer:

> What should SmartCar analyze, what recommendations should it provide, and can the current database support those recommendations?

---

# 2. Market Research Finding

Existing rental-management, fleet-management, analytics and rental-marketplace platforms already provide many capabilities including:

* booking;
* vehicle availability;
* fleet management;
* utilization reporting;
* revenue/profitability reporting;
* maintenance;
* inspection;
* turnaround;
* pricing;
* forecasting;
* operational analytics;
* increasingly, recommendation/AI features.

Therefore SmartCar does **not** claim these individual capabilities as novel.

---

# 3. SmartCar Opportunity

SmartCar focuses on:

> **Transparent, DBMS-first, cross-table operational decision support.**

The concept is:

```text
Rental Company Data
        ↓
PostgreSQL
        ↓
SQL Analytics
        ↓
Derived Metrics
        ↓
Business Rules
        ↓
Problem Detection
        ↓
Evidence
        ↓
Recommendation
        ↓
Owner Decision
```

---

# 4. Vehicle Lifecycle as Data Foundation

```text
BOOKING
   ↓
RENTED
   ↓
RETURNED
   ↓
INSPECTION
  ↙      ↘
GOOD     ISSUE
 ↓         ↓
CLEANING  MAINTENANCE
   ↘      ↙
      READY
        ↓
    AVAILABLE
        ↓
  NEXT BOOKING
```

The lifecycle itself is not claimed as novel.

Its importance is that timestamped operational events can provide historical data for analysis.

---

# 5. Advisory Questions

## Utilization

* Which vehicles are underutilized?
* Is low utilization associated with downtime?
* Which vehicle categories have strong utilization?

## Maintenance

* Which vehicles have excessive maintenance downtime?
* Which vehicles repeatedly enter maintenance?
* Is maintenance reducing rentable availability?

## Inspection

* Which vehicles repeatedly have inspection issues?
* Are inspection issues associated with maintenance or turnaround?

## Turnaround

* Which vehicles take unusually long from return to ready?
* Where is the recorded bottleneck?

## Combined Performance

* Which vehicles have high utilization + high downtime?
* Which have low utilization + low downtime?
* Which have low utilization + high downtime?
* Which have high utilization + low downtime?

## Fleet Decisions

* Which vehicles/categories deserve attention?
* Which vehicles should be investigated before increasing similar fleet capacity?

---

# 6. Initial Rules

## R1 — UNDERUTILIZED

Low vehicle utilization relative to fleet baseline.

Suggested action:

> Review demand, pricing, location and booking patterns.

---

## R2 — MAINTENANCE_DOWNTIME

Maintenance downtime materially above fleet baseline.

Suggested action:

> Review recurring maintenance causes and scheduling.

---

## R3 — TURNAROUND_BOTTLENECK

Return-to-ready time materially above fleet baseline.

Suggested action:

> Review inspection, cleaning and maintenance handoffs.

---

## R4 — REPEATED_INSPECTION_ISSUES

Inspection issues materially above fleet baseline.

Suggested action:

> Review recurring condition/damage and maintenance patterns.

---

## R5 — HIGH_DEMAND_OPERATIONAL_RISK

High utilization + high downtime.

Suggested action:

> Investigate downtime because unavailable periods affect a highly demanded vehicle.

---

## R6 — DEMAND_SIDE_UNDERUTILIZATION

Low utilization + low downtime.

Suggested action:

> Review pricing, location and demand.

---

## R7 — OPERATIONAL_UNDERPERFORMANCE

Low utilization + high downtime.

Suggested action:

> Investigate operational downtime before changing fleet allocation.

---

## R8 — HEALTHY_PERFORMER

High utilization + low downtime.

Suggested action:

> Maintain availability and monitor demand.

---

## R9 — RECURRING_MAINTENANCE

Repeated maintenance events over a defined period.

Suggested action:

> Review recurring maintenance history.

---

## R10 — FLEET_EXPANSION_REVIEW

Strong category utilization/demand with acceptable downtime.

Suggested action:

> Consider whether additional capacity should be evaluated.

---

# 7. Rule Design Principles

Rules must be:

* deterministic;
* explainable;
* reproducible;
* based on available database evidence.

Prefer:

* fleet average;
* fleet median;
* documented thresholds.

Avoid:

* arbitrary thresholds;
* unsupported causal claims;
* fake AI confidence scores;
* recommendations that cannot be explained.

Use language such as:

> Review

> Investigate

> Consider

rather than claiming certainty.

---

# 8. Recommendation Structure

Conceptually each recommendation should contain:

```text
Recommendation ID
Scope
Vehicle / Category
Rule Code
Severity
Title
Observation
Evidence Metrics
Contributing Factors
Recommended Action
Generated At
```

A physical recommendation table should **not** be added until the database audit determines whether it is actually required.

---

# 9. Example

```text
Rule:
LOW_UTILIZATION_HIGH_DOWNTIME

Vehicle:
V102

Utilization:
38%

Fleet average:
67%

Maintenance downtime:
9.4 days

Fleet average:
3.1 days

Inspection issues:
5

Fleet average:
1.8
```

Recommendation:

> Review recurring maintenance and inspection delays before increasing booking allocation for this vehicle.

---

# 10. Explainability

The owner should be able to follow:

```text
Recommendation
      ↓
Rule
      ↓
Metrics
      ↓
Source records
```

For example:

```text
Advisor says:
Vehicle V102 requires attention
       ↓
Why?
       ↓
Low utilization + high downtime
       ↓
Show metrics
       ↓
Show bookings
       ↓
Show maintenance
       ↓
Show inspections
       ↓
Show vehicle status history
```

---

# 11. Database Audit

The following must be mapped to exact existing columns.

| Requirement           | Likely tables                            | Required audit                           |
| --------------------- | ---------------------------------------- | ---------------------------------------- |
| Utilization           | vehicles, bookings, status_history       | Can available/rented periods be derived? |
| Maintenance downtime  | maintenance, status_history              | Are start/end periods available?         |
| Inspection issue rate | inspections                              | Is issue/outcome data available?         |
| Status duration       | status_history                           | Are timestamps reliable?                 |
| Return → inspection   | bookings, inspections, status_history    | Can events be paired?                    |
| Return → ready        | bookings, status_history                 | Is READY transition available?           |
| Maintenance frequency | maintenance                              | Are maintenance dates available?         |
| Maintenance cost      | maintenance                              | Is cost stored?                          |
| Revenue per vehicle   | bookings, payments                       | Can revenue be attributed to vehicle?    |
| Recurring problems    | inspections, maintenance, status_history | Is historical detail sufficient?         |

---

# 12. Audit Classification

Every requirement must be classified:

### Directly Computable

All required information exists and can be calculated reliably.

### Partially Computable

Some information exists, but the metric has a documented limitation.

### Impossible

Required information is not available.

---

# 13. Potential Data Gaps

Do not assume these are missing.

Verify whether the schema contains information equivalent to:

* maintenance start time;
* maintenance completion time;
* maintenance reason;
* inspection outcome;
* inspection issue;
* status-history reason;
* READY transition;
* booking total;
* payment amount.

If something is missing, document it.

Do not immediately alter the schema.

---

# 14. Implementation Plan

After the audit:

1. Map metrics to exact fields.
2. Identify genuine gaps.
3. Decide whether minimal schema enhancement is necessary.
4. Finalize rule thresholds.
5. Create analytical SQL/views.
6. Implement backend advisory rules.
7. Build React advisory dashboard.
8. Test with realistic scenarios.
9. Validate with real rental operators.
10. Update project documentation.

---

# 15. Honest Project Positioning

Recommended wording:

> **SmartCar is a database-driven decision-support system for car-rental operations. It integrates booking, vehicle lifecycle, inspection, maintenance and financial records to derive fleet-performance indicators and generate transparent, rule-based operational recommendations.**

Do not claim:

* worldwide novelty;
* first rental advisory platform;
* first rental lifecycle platform;
* patent-level novelty;
* AI capabilities that are not actually implemented.

---

# 16. Field Validation

Secondary research supports the existence of these operational concerns, but it is not equivalent to interviewing actual rental operators.

The project should eventually interview approximately 5–10 rental operators where possible.

Questions should be open-ended:

* How do customers book?
* How do you know which vehicles are available?
* What happens when a vehicle returns?
* Who inspects it?
* How do you record damage?
* How is cleaning handled?
* How is maintenance handled?
* How do you know a vehicle is ready again?
* What causes the longest vehicle downtime?
* How do you measure utilization?
* How do you decide which vehicles to buy or remove?
* If you could automate one operational task, what would it be?

Do not lead operators toward SmartCar's proposed solution.

---

# 17. Current Status

Market research: COMPLETE

Advisory opportunity definition: COMPLETE

Advisory rules: FINALIZED

Database audit: COMPLETE

SQL implementation: COMPLETE (corrected 2026-09-04; 18/18 correctness checks pass)

Backend implementation: NOT STARTED

Frontend implementation: NOT STARTED

Field validation: NOT STARTED

---

# 18. Immediate Next Action

**Build the React advisory dashboard to display the recommendations from `npm run advisory` output, allowing operators to view rules by severity, vehicle, and category with drill-down to source evidence records.**

---

# 19. Database Readiness Audit

**Audit completed:** 2026-09-03

**Files inspected:**

* `C:\Users\Pavan Nihaal\OneDrive\文档\car_rentals\database\schema.sql`
* `C:\Users\Pavan Nihaal\OneDrive\文档\car_rentals\database\seed.sql`
* `C:\Users\Pavan Nihaal\OneDrive\文档\car_rentals\database\queries.sql`
* `C:\Users\Pavan Nihaal\OneDrive\文档\car_rentals\database\verify_db.js`
* `C:\Users\Pavan Nihaal\OneDrive\文档\car_rentals\frontend\src\data\databaseSchema.js`

| Advisory Requirement             | Exact Tables                                                    | Exact Columns                                                                                                                                                          | Status               | Reason / Limitation                                                                                                                                                                                                                                                                                                                                                                                       | Minimum Missing Data                                                                                                                                          |
| -------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vehicle utilization              | `vehicles`, `bookings`, `vehicle_status_history`                | `bookings.pickup_datetime`, `bookings.return_datetime`, `bookings.status`, `vehicle_status_history.status`, `vehicle_status_history.changed_at`, `vehicles.created_at` | PARTIALLY COMPUTABLE | Booking durations are directly calculable. An observation window can be inferred from `vehicles.created_at` and booking dates. However, `vehicle_status_history` is incomplete for several seed vehicles and does not reliably cover all lifecycle transitions. No explicit reporting-period anchor exists in the schema.                                                                                 | A defined observation window or `current_date` reference; complete status-history chains for all vehicles.                                                    |
| Booking / rental days            | `bookings`                                                      | `pickup_datetime`, `return_datetime`, `status`                                                                                                                         | DIRECTLY COMPUTABLE  | `return_datetime - pickup_datetime` directly yields rental duration for any booking.                                                                                                                                                                                                                                                                                                                      | None.                                                                                                                                                         |
| Maintenance downtime             | `maintenance`, `vehicle_status_history`                         | `maintenance.start_date`, `maintenance.end_date`, `maintenance.status`, `vehicle_status_history.status`, `vehicle_status_history.changed_at`                           | PARTIALLY COMPUTABLE | For completed maintenance with non-NULL `end_date`, downtime = `end_date - start_date`. For `IN_PROGRESS` or `PENDING` maintenance, `end_date` is NULL, so completed downtime is unknown. Status-history `MAINTENANCE` transitions do not always show subsequent exits.                                                                                                                                   | A way to record or compute ongoing maintenance duration; guaranteed `READY`/`AVAILABLE` exit transitions.                                                     |
| Maintenance frequency            | `maintenance`                                                   | `vehicle_id`, `maintenance_no`, `start_date`                                                                                                                           | DIRECTLY COMPUTABLE  | `COUNT(*)` per vehicle gives frequency; `start_date` enables time-window filtering.                                                                                                                                                                                                                                                                                                                       | None.                                                                                                                                                         |
| Maintenance cost                 | `maintenance`                                                   | `cost`                                                                                                                                                                 | DIRECTLY COMPUTABLE  | `SUM(cost)` per vehicle or fleet-wide is directly supported.                                                                                                                                                                                                                                                                                                                                              | None.                                                                                                                                                         |
| Inspection issue count / rate    | `vehicle_inspections`                                           | `status`, `issues_found`, `booking_id`                                                                                                                                 | PARTIALLY COMPUTABLE | Count of inspections with `status IN ('MINOR_ISSUE', 'MAJOR_ISSUE')` per vehicle is computable. Issue rate = issue inspections / total inspections. However, `issues_found` is unstructured `TEXT` and cannot be reliably parsed to count individual issues.                                                                                                                                              | Structured issue codes or a separate issue-category table.                                                                                                    |
| Vehicle status duration          | `vehicle_status_history`                                        | `vehicle_id`, `status`, `changed_at`                                                                                                                                   | DIRECTLY COMPUTABLE  | SQL window functions (`LAG`/`LEAD`) can compute duration between consecutive `changed_at` timestamps for the same vehicle.                                                                                                                                                                                                                                                                                | None.                                                                                                                                                         |
| Return → inspection duration     | `bookings`, `vehicle_inspections`, `vehicle_status_history`     | `bookings.return_datetime`, `vehicle_inspections.inspection_date`, `bookings.booking_id`                                                                               | PARTIALLY COMPUTABLE | Where a returned booking has a corresponding inspection record, duration = `inspection_date - return_datetime`. Linked via `booking_id`.                                                                                                                                                                                                                                                                  | Not all returned bookings have corresponding inspection records. In seed data, several returns lack inspections.                                              |
| Return → ready duration          | `bookings`, `vehicle_status_history`                            | `bookings.return_datetime`, `vehicle_status_history.status`, `vehicle_status_history.changed_at`, `vehicle_status_history.vehicle_id`                                  | PARTIALLY COMPUTABLE | Find `RETURNED` timestamp and subsequent `READY` timestamp for the same vehicle. Duration = `READY.changed_at - RETURNED.changed_at`.                                                                                                                                                                                                                                                                     | Not all returned vehicles have a `READY` transition in `vehicle_status_history`. In seed data, Vehicles 5, 9, and 10 were returned but never reached `READY`. |
| Revenue per vehicle              | `bookings`, `payments`                                          | `bookings.total_amount`, `bookings.vehicle_id`, `payments.amount`, `payments.booking_id`, `payments.payment_status`                                                    | PARTIALLY COMPUTABLE | We can sum `bookings.total_amount` by `vehicle_id`. We can also sum `payments.amount` filtered by `payment_status = 'PAID'` and linked to vehicle via booking. However, `bookings.total_amount` may include pending/uncollected amounts, and payments include `PENDING`/`FAILED`/`REFUNDED` statuses. The schema does not define which field equals "actual revenue." Some bookings lack payment records. | A clear revenue definition or a guarantee that `payments.amount` with `payment_status = 'PAID'` is the authoritative revenue figure.                          |
| Recurring maintenance problems   | `maintenance`                                                   | `vehicle_id`, `maintenance_no`, `description`, `start_date`                                                                                                            | PARTIALLY COMPUTABLE | Maintenance event count per vehicle is computable. Repeated maintenance entries for a vehicle can be identified. However, "recurring problems" implies pattern detection in `description` text, which is unreliable.                                                                                                                                                                                      | Structured maintenance reason/category codes.                                                                                                                 |
| Recurring inspection problems    | `vehicle_inspections`, `bookings`                               | `vehicle_inspections.status`, `vehicle_inspections.issues_found`, `bookings.vehicle_id`                                                                                | PARTIALLY COMPUTABLE | Count of non-`GOOD` inspections per vehicle is computable. Specific recurring issue patterns from `issues_found` text are not reliably detectable.                                                                                                                                                                                                                                                        | Structured issue codes or categories.                                                                                                                         |
| High utilization + high downtime | `vehicles`, `bookings`, `maintenance`, `vehicle_status_history` | As above                                                                                                                                                               | PARTIALLY COMPUTABLE | Combines utilization and downtime metrics. Both base metrics are partially computable, so the combination is also partially computable.                                                                                                                                                                                                                                                                   | Inherits limitations of utilization and downtime calculations.                                                                                                |
| Low utilization + low downtime   | `vehicles`, `bookings`, `maintenance`, `vehicle_status_history` | As above                                                                                                                                                               | PARTIALLY COMPUTABLE | Same as above.                                                                                                                                                                                                                                                                                                                                                                                            | Inherits limitations of utilization and downtime calculations.                                                                                                |
| Low utilization + high downtime  | `vehicles`, `bookings`, `maintenance`, `vehicle_status_history` | As above                                                                                                                                                               | PARTIALLY COMPUTABLE | Same as above.                                                                                                                                                                                                                                                                                                                                                                                            | Inherits limitations of utilization and downtime calculations.                                                                                                |
| High utilization + low downtime  | `vehicles`, `bookings`, `maintenance`, `vehicle_status_history` | As above                                                                                                                                                               | PARTIALLY COMPUTABLE | Same as above.                                                                                                                                                                                                                                                                                                                                                                                            | Inherits limitations of utilization and downtime calculations.                                                                                                |
| Fleet / category attention       | `vehicles`, `bookings`, `maintenance`, `payments`               | `vehicles.type`, booking/payment/maintenance fields                                                                                                                    | PARTIALLY COMPUTABLE | Aggregate metrics by `type` are computable, but depend on partially computable base metrics.                                                                                                                                                                                                                                                                                                              | Inherits limitations of underlying metrics.                                                                                                                   |

---

# 20. Schema Findings

## Already sufficient

* **Booking/rental days**: `bookings.pickup_datetime` and `bookings.return_datetime` provide exact rental durations.
* **Maintenance frequency**: `maintenance` table with `vehicle_id` and `start_date` supports counting events per vehicle.
* **Maintenance cost**: `maintenance.cost` is stored as `NUMERIC(10,2)`.
* **Vehicle status duration**: `vehicle_status_history.changed_at` timestamps support duration calculation between consecutive records.
* **Inspection issue identification**: `vehicle_inspections.status` distinguishes `GOOD`, `MINOR_ISSUE`, and `MAJOR_ISSUE`.

## Partially sufficient

* **Vehicle utilization**: Bookings provide rental periods, but no explicit observation window exists, and `vehicle_status_history` is incomplete for several seed vehicles.
* **Maintenance downtime**: `maintenance.start_date` and `end_date` work for completed records, but ongoing maintenance lacks `end_date`, and status-history exits are sometimes missing.
* **Inspection issue rate**: We can identify issue inspections, but `issues_found` is free text and cannot be reliably counted.
* **Return → inspection duration**: Computable where both records exist, but not all returns have inspections.
* **Return → ready duration**: Computable where both transitions exist, but several returned vehicles in seed data lack `READY` transitions.
* **Revenue per vehicle**: Both `bookings.total_amount` and `payments.amount` exist, but their relationship to "actual revenue" is ambiguous due to varying `payment_status` values and missing payment records.
* **Recurring maintenance/inspection problems**: Counts are computable, but free-text fields (`description`, `issues_found`) prevent reliable pattern detection.

## Missing

* **No IMPOSSIBLE requirements**: Every audited metric has at least partial data support in the current schema. No metric is completely impossible.
* **No explicit observation window**: The schema lacks a predefined reporting period or "current date" reference.
* **No structured issue codes**: Inspection issues and maintenance reasons are stored as free text.
* **Incomplete status-history chains in seed data**: Several vehicles lack full lifecycle coverage, though the schema supports it.

---

# 21. Recommended Minimal Changes

No schema changes are strictly necessary to implement the advisory layer. All audited metrics can be computed with documented limitations.

However, the following minimal enhancements would improve reliability and reduce ambiguity:

1. **Observation window convention**: Document a standard reporting period (e.g., "from earliest `vehicles.created_at` to current date" or a configurable `@report_date` parameter). No schema change required; this can be enforced in SQL/view definitions.

2. **Ongoing maintenance duration**: For `IN_PROGRESS` maintenance with NULL `end_date`, compute duration as `CURRENT_DATE - start_date` in advisory SQL, treating ongoing maintenance as still causing downtime. No schema change required.

3. **Guaranteed lifecycle transitions**: Ensure application logic inserts `READY` and `AVAILABLE` transitions after every `RETURNED` event. No schema change required, but seed data and application logic must enforce completeness.

4. **Structured issue codes (optional)**: If recurring-problem detection becomes a priority, add `issue_code` to `vehicle_inspections` or a separate `inspection_issues` table. Similarly, add `reason_code` to `maintenance`. These are optional enhancements, not blockers.

5. **Revenue definition**: Document whether advisory revenue uses `bookings.total_amount` or `payments.amount` filtered by `payment_status = 'PAID'`. No schema change required.

---

# 22. Observation Window

**Chosen approach:** Fleet-wide configurable `@report_start_date` and `@report_end_date`.

**Why:** The schema contains no explicit reporting-period anchor, and adding one would require a schema change. A fleet-wide window ensures all vehicles are evaluated over the same calendar period, avoiding unfair comparisons between vehicles created at different times. Using per-vehicle `created_at` values as the start of each vehicle's individual measurement period preserves the rate semantics of utilization while keeping the fleet baseline consistent.

**Defaults:**
* `@report_start_date` = `MIN(vehicles.created_at)` from the fleet.
* `@report_end_date` = `GREATEST(MAX(bookings.return_datetime), MAX(maintenance.end_date), MAX(vehicle_inspections.inspection_date), MAX(vehicle_status_history.changed_at), CURRENT_DATE)`.

**Treatment:** For each vehicle, the active observation period is `@report_end_date - GREATEST(@report_start_date, vehicle.created_at)`. If a vehicle was created after the fleet start date, it is only measured from its creation onward. If a vehicle has no operational records, it is treated as having zero activity within its active period. Bookings, maintenance, inspections, and status transitions outside the active period are excluded.

---

# 23. Metric Definitions & Formulas

## A. Booking / Rental Days

**Purpose:** Total days a vehicle was actively rented.  
**Formula:** `SUM(EXTRACT(EPOCH FROM (bookings.return_datetime - bookings.pickup_datetime)) / 86400.0)`  
**Source tables:** `bookings`  
**Source columns:** `pickup_datetime`, `return_datetime`, `vehicle_id`, `status`  
**Unit:** days  
**NULL treatment:** Bookings with NULL `return_datetime` are excluded.  
**Incomplete records:** Only bookings with `status IN ('COMPLETED', 'ACTIVE', 'CONFIRMED')` are counted. `CANCELLED` bookings are excluded.  
**Status:** DIRECTLY COMPUTABLE  
**Limitation:** Does not capture unbooked idle time or time between bookings.

## B. Vehicle Utilization

**Purpose:** Proportion of the vehicle's active observation period during which it was rented.  
**Formula:** `rental_days / GREATEST(observation_window_days, 1)`  
where `observation_window_days = @report_end_date - GREATEST(@report_start_date, vehicle.created_at)`  
**Source tables:** `bookings`, `vehicles`  
**Source columns:** `bookings.pickup_datetime`, `bookings.return_datetime`, `bookings.vehicle_id`, `vehicles.created_at`  
**Unit:** ratio (0–1) or percentage  
**NULL treatment:** Bookings with NULL `return_datetime` are excluded. Vehicles with NULL `created_at` are excluded.  
**Incomplete records:** If `vehicle_status_history` is missing or incomplete, utilization is computed from booking durations only.  
**Status:** PARTIALLY COMPUTABLE  
**Limitation:** Booking-derived utilization assumes the vehicle was available whenever not on a booking. Missing status-history chains may cause overestimation if there were unrecorded maintenance or downtime periods between bookings.

## C. Maintenance Frequency

**Purpose:** Number of maintenance events per vehicle within the observation window.  
**Formula:** `COUNT(maintenance.maintenance_no)`  
**Source tables:** `maintenance`  
**Source columns:** `vehicle_id`, `maintenance_no`, `start_date`  
**Unit:** count  
**NULL treatment:** Records with NULL `start_date` are excluded.  
**Incomplete records:** Maintenance events outside the observation window are excluded.  
**Status:** DIRECTLY COMPUTABLE  
**Limitation:** Does not measure severity, cost per event, or whether events are for the same underlying problem.

## D. Maintenance Cost

**Purpose:** Total maintenance cost per vehicle within the observation window.  
**Formula:** `SUM(maintenance.cost)`  
**Source tables:** `maintenance`  
**Source columns:** `vehicle_id`, `cost`  
**Unit:** currency  
**NULL treatment:** NULL `cost` values are treated as 0.  
**Incomplete records:** None.  
**Status:** DIRECTLY COMPUTABLE  
**Limitation:** Ongoing maintenance without `end_date` may have incomplete cost if the final cost differs from the current `cost` value.

## E. Maintenance Downtime

**Purpose:** Total days a vehicle was unavailable due to maintenance within the observation window.  
**Formula:** `SUM(EXTRACT(EPOCH FROM (COALESCE(maintenance.end_date, @report_end_date) - maintenance.start_date)) / 86400.0)`  
**Source tables:** `maintenance`  
**Source columns:** `maintenance.vehicle_id`, `maintenance.start_date`, `maintenance.end_date`, `maintenance.status`  
**Unit:** days  
**NULL treatment:** NULL `end_date` treated as `@report_end_date` (ongoing maintenance counts as downtime through the report end date).  
**Incomplete records:** If `maintenance.end_date` is NULL and `status` is not `IN_PROGRESS` or `PENDING`, the record is excluded.  
**Status:** PARTIALLY COMPUTABLE  
**Limitation:** Ongoing maintenance duration is estimated, not finalized. Status-history exits from `MAINTENANCE` are not used for this metric to avoid double-counting; maintenance records are the authoritative source.

## F. Vehicle Status Duration

**Purpose:** Time spent in each operational status within the observation window.  
**Formula:** For each consecutive pair of status records for a vehicle: `LEAD(changed_at) OVER (PARTITION BY vehicle_id ORDER BY changed_at) - changed_at`. For the last record before `@report_end_date`, duration extends to `@report_end_date`.  
**Source tables:** `vehicle_status_history`  
**Source columns:** `vehicle_id`, `status`, `changed_at`  
**Unit:** days or seconds  
**NULL treatment:** Records with NULL `changed_at` are excluded.  
**Incomplete records:** If a vehicle has no status history, all status durations are 0.  
**Status:** DIRECTLY COMPUTABLE  
**Limitation:** Incomplete status-history chains mean some transitions are missed; this metric is primarily used for validation, not as the primary source for utilization or downtime.

## G. Return → Inspection Duration

**Purpose:** Time between vehicle return and the start of the first inspection for that booking.  
**Formula:** `MIN(vehicle_inspections.inspection_date) - bookings.return_datetime`  
**Source tables:** `bookings`, `vehicle_inspections`  
**Source columns:** `bookings.return_datetime`, `vehicle_inspections.inspection_date`, `bookings.booking_id`  
**Unit:** days  
**NULL treatment:** Bookings with NULL `return_datetime` are excluded. Inspections with NULL `inspection_date` are excluded.  
**Incomplete records:** If no inspection exists for a returned booking, duration is NULL and the booking is excluded from the vehicle average.  
**Status:** PARTIALLY COMPUTABLE  
**Limitation:** Not all returns have inspections; vehicles without any return→inspection durations are excluded from this metric.

## H. Return → Ready Duration

**Purpose:** Time between vehicle return and the vehicle reaching `READY` status.  
**Formula:** `MIN(CASE WHEN status = 'READY' THEN changed_at END) FILTER (WHERE changed_at > return_timestamp) - return_timestamp`, where `return_timestamp` is the `RETURNED` event timestamp from `vehicle_status_history` or `bookings.return_datetime`.  
**Source tables:** `bookings`, `vehicle_status_history`  
**Source columns:** `bookings.return_datetime`, `vehicle_status_history.status`, `vehicle_status_history.changed_at`, `vehicle_status_history.vehicle_id`  
**Unit:** days  
**NULL treatment:** Bookings with NULL `return_datetime` are excluded.  
**Incomplete records:** If no `READY` transition exists after return for a vehicle, that vehicle is excluded from fleet average calculations for this metric.  
**Status:** PARTIALLY COMPUTABLE  
**Limitation:** Several seed vehicles lack `READY` transitions after return. The metric is computed only for vehicles with complete return-to-ready chains.

## I. Inspection Issue Rate

**Purpose:** Proportion of inspections that found issues.  
**Formula:** `COUNT(*) FILTER (WHERE status IN ('MINOR_ISSUE', 'MAJOR_ISSUE')) / COUNT(*)`  
**Source tables:** `vehicle_inspections`  
**Source columns:** `status`, `issues_found`, `booking_id`  
**Unit:** ratio (0–1)  
**NULL treatment:** Inspections with NULL `status` are excluded.  
**Incomplete records:** None.  
**Status:** PARTIALLY COMPUTABLE  
**Limitation:** `issues_found` is free text and cannot be reliably parsed to count individual issues. Only the coarse `status` field is used for this metric.

## J. Revenue per Vehicle

**Purpose:** Paid revenue attributable to each vehicle within the observation window.  
**Formula:** `SUM(payments.amount) FILTER (WHERE payments.payment_status = 'PAID')` linked via `bookings.booking_id = payments.booking_id` and `bookings.vehicle_id`.  
**Source tables:** `bookings`, `payments`  
**Source columns:** `bookings.total_amount`, `bookings.vehicle_id`, `payments.amount`, `payments.booking_id`, `payments.payment_status`  
**Unit:** currency  
**NULL treatment:** NULL `payments.amount` treated as 0. Payments with NULL `payment_status` are excluded.  
**Incomplete records:** Bookings without payment records contribute 0 to paid revenue.  
**Status:** PARTIALLY COMPUTABLE  
**Limitation:** `bookings.total_amount` may include uncollected amounts. `payments.amount` includes refunded amounts even if `payment_status = 'PAID'` (depending on business logic). The authoritative revenue figure is not explicitly defined in the schema.

## K. Recurring Maintenance Events

**Purpose:** Identify vehicles with repeated maintenance activity.  
**Formula:** `COUNT(maintenance.maintenance_no) >= 2` within the observation window.  
**Source tables:** `maintenance`  
**Source columns:** `vehicle_id`, `maintenance_no`, `start_date`  
**Unit:** boolean flag per vehicle  
**NULL treatment:** Records with NULL `start_date` are excluded.  
**Incomplete records:** None.  
**Status:** PARTIALLY COMPUTABLE  
**Limitation:** "Recurring problem" implies a pattern in `description`, which is free text and cannot be reliably analyzed.

## L. Recurring Inspection Issues

**Purpose:** Identify vehicles with repeated non-GOOD inspections.  
**Formula:** `COUNT(*) FILTER (WHERE status IN ('MINOR_ISSUE', 'MAJOR_ISSUE')) >= 2` per vehicle within the observation window.  
**Source tables:** `vehicle_inspections`, `bookings`  
**Source columns:** `vehicle_inspections.status`, `vehicle_inspections.booking_id`, `bookings.vehicle_id`  
**Unit:** boolean flag per vehicle  
**NULL treatment:** Inspections with NULL `status` are excluded.  
**Incomplete records:** None.  
**Status:** PARTIALLY COMPUTABLE  
**Limitation:** Specific recurring issue patterns from `issues_found` text are not reliably detectable.

---

# 24. Fleet Baseline Method

**Chosen method:** Fleet median per metric, stratified by vehicle `type` when the category contains at least 2 vehicles; otherwise fleet-wide median.

**Why:** The median is explainable, reproducible, and resistant to one unusually high or low vehicle. For a small academic seed dataset, the median is preferable to the mean because outliers do not skew it. Percentiles and standard deviation require larger samples. Fixed business thresholds are acceptable only when justified by domain rules, which are not available here.

**Implementation note:** SQL: `PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY metric)`.

---

# 25. Threshold Definitions

### Primary Thresholds

| Metric | Low | High |
|--------|-----|------|
| Utilization | < fleet median − 0.10 | ≥ fleet median |
| Maintenance downtime | ≤ fleet median × 1.5 | > fleet median × 1.5 |
| Return → ready duration | ≤ fleet median × 1.5 | > fleet median × 1.5 |
| Inspection issue rate | ≤ fleet median × 1.5 | > fleet median × 1.5 |
| Maintenance frequency | < fleet median | > fleet median |
| Revenue per vehicle | < fleet median | ≥ fleet median |

**Justification for utilization offset:** With a small academic dataset, a median split would classify approximately half the fleet as underutilized, which is not actionable. A 10-percentage-point gap below the fleet median ensures only vehicles with meaningfully lower utilization are flagged. In a rental context, a 10% utilization difference is operationally significant.

**Justification for maintenance frequency threshold:** "Recurring" maintenance implies more than one event. Using `> fleet median` (rather than `> fleet median × 1.5`) ensures that any vehicle with at least 2 events and above-average frequency is reviewed, while vehicles with 1 event are never flagged as recurring.

**Justification for 1.5× factor on deviation metrics:** For a small academic dataset, 50% above the median is a clear but not extreme deviation. It avoids classifying almost every vehicle as problematic while still catching meaningful outliers. This is documented, not arbitrary.

**Justification for median split on utilization and revenue:** Utilization and revenue are directional. A vehicle below the fleet median is genuinely underperforming relative to peers, but the 10-percentage-point offset prevents borderline cases from being flagged.

---

# 26. Final Rule Specification

### R1 — UNDERUTILIZED

* **Rule code:** `UNDERUTILIZED`
* **Metric(s):** Vehicle utilization
* **Baseline:** Fleet median utilization
* **Threshold:** `utilization < fleet_median_utilization - 0.10`
* **Logical condition:** `vehicle_utilization < (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY utilization) FROM fleet_utilization) - 0.10`
* **Severity:** `REVIEW`
* **Evidence shown:** Vehicle utilization %, fleet median utilization %, total rental days, active observation window days
* **Recommended action:** Review demand, pricing, location and booking patterns.
* **Limitation:** Utilization is partially computable; missing status-history may cause underestimation or overestimation. The 10-percentage-point offset prevents borderline vehicles from being flagged.

### R2 — MAINTENANCE_DOWNTIME

* **Rule code:** `MAINTENANCE_DOWNTIME`
* **Metric(s):** Maintenance downtime
* **Baseline:** Fleet median maintenance downtime
* **Threshold:** `maintenance_downtime > fleet_median_maintenance_downtime × 1.5`
* **Logical condition:** `vehicle_maintenance_downtime > (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY downtime) FROM fleet_maintenance_downtime) * 1.5`
* **Severity:** `REVIEW`
* **Evidence shown:** Vehicle maintenance downtime days, fleet median days, number of maintenance events, ongoing maintenance flag
* **Recommended action:** Review recurring maintenance causes and scheduling.
* **Limitation:** Ongoing maintenance duration is estimated using `@report_end_date`.

### R3 — TURNAROUND_BOTTLENECK

* **Rule code:** `TURNAROUND_BOTTLENECK`
* **Metric(s):** Return → ready duration
* **Baseline:** Fleet median return → ready duration
* **Threshold:** `return_ready_duration > fleet_median_return_ready_duration × 1.5`
* **Logical condition:** `vehicle_return_ready_duration > (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY return_ready_duration) FROM fleet_return_ready_duration) * 1.5`
* **Severity:** `REVIEW`
* **Evidence shown:** Vehicle return-to-ready days, fleet median days, number of returns, missing READY transition count
* **Recommended action:** Review inspection, cleaning and maintenance handoffs.
* **Limitation:** Vehicles without `READY` transitions are excluded from fleet baseline, which may bias the median low.

### R4 — REPEATED_INSPECTION_ISSUES

* **Rule code:** `REPEATED_INSPECTION_ISSUES`
* **Metric(s):** Inspection issue rate
* **Baseline:** Fleet median inspection issue rate
* **Threshold:** `inspection_issue_rate > fleet_median_inspection_issue_rate × 1.5` AND `issue_count >= 2`
* **Logical condition:** `(issue_inspections / total_inspections) > fleet_median_issue_rate * 1.5 AND issue_inspections >= 2`
* **Severity:** `REVIEW`
* **Evidence shown:** Vehicle issue rate, fleet median issue rate, issue inspection count, total inspection count, sample `issues_found` text
* **Recommended action:** Review recurring condition/damage and maintenance patterns.
* **Limitation:** `issues_found` is free text; only coarse `status` is used.

### R5 — HIGH_DEMAND_OPERATIONAL_RISK

* **Rule code:** `HIGH_DEMAND_OPERATIONAL_RISK`
* **Metric(s):** Utilization, maintenance downtime
* **Baseline:** Fleet median utilization, fleet median maintenance downtime
* **Threshold:** `utilization >= fleet_median_utilization` AND `maintenance_downtime > fleet_median_maintenance_downtime × 1.5`
* **Logical condition:** `vehicle_utilization >= fleet_median_utilization AND vehicle_maintenance_downtime > fleet_median_maintenance_downtime * 1.5`
* **Severity:** `HIGH_PRIORITY`
* **Evidence shown:** Vehicle utilization %, fleet median %, maintenance downtime days, fleet median days
* **Recommended action:** Investigate downtime because unavailable periods affect a highly demanded vehicle.
* **Limitation:** Inherits limitations of both base metrics.

### R6 — DEMAND_SIDE_UNDERUTILIZATION

* **Rule code:** `DEMAND_SIDE_UNDERUTILIZATION`
* **Metric(s):** Utilization, maintenance downtime
* **Baseline:** Fleet median utilization, fleet median maintenance downtime
* **Threshold:** `utilization < fleet_median_utilization - 0.10` AND `maintenance_downtime <= fleet_median_maintenance_downtime × 1.5`
* **Logical condition:** `vehicle_utilization < fleet_median_utilization - 0.10 AND vehicle_maintenance_downtime <= fleet_median_maintenance_downtime * 1.5`
* **Severity:** `INFO`
* **Evidence shown:** Vehicle utilization %, fleet median %, maintenance downtime days, fleet median days
* **Recommended action:** Review pricing, location and demand.
* **Limitation:** Inherits limitations of both base metrics.

### R7 — OPERATIONAL_UNDERPERFORMANCE

* **Rule code:** `OPERATIONAL_UNDERPERFORMANCE`
* **Metric(s):** Utilization, maintenance downtime
* **Baseline:** Fleet median utilization, fleet median maintenance downtime
* **Threshold:** `utilization < fleet_median_utilization - 0.10` AND `maintenance_downtime > fleet_median_maintenance_downtime × 1.5`
* **Logical condition:** `vehicle_utilization < fleet_median_utilization - 0.10 AND vehicle_maintenance_downtime > fleet_median_maintenance_downtime * 1.5`
* **Severity:** `HIGH_PRIORITY`
* **Evidence shown:** Vehicle utilization %, fleet median %, maintenance downtime days, fleet median days
* **Recommended action:** Investigate operational downtime before changing fleet allocation.
* **Limitation:** Inherits limitations of both base metrics.

### R8 — HEALTHY_PERFORMER

* **Rule code:** `HEALTHY_PERFORMER`
* **Metric(s):** Utilization, maintenance downtime
* **Baseline:** Fleet median utilization, fleet median maintenance downtime
* **Threshold:** `utilization >= fleet_median_utilization` AND `maintenance_downtime <= fleet_median_maintenance_downtime × 1.5`
* **Logical condition:** `vehicle_utilization >= fleet_median_utilization AND vehicle_maintenance_downtime <= fleet_median_maintenance_downtime * 1.5`
* **Severity:** `INFO`
* **Evidence shown:** Vehicle utilization %, fleet median %, maintenance downtime days, fleet median days
* **Recommended action:** Maintain availability and monitor demand.
* **Limitation:** Inherits limitations of both base metrics.

### R9 — RECURRING_MAINTENANCE

* **Rule code:** `RECURRING_MAINTENANCE`
* **Metric(s):** Maintenance frequency
* **Baseline:** Fleet median maintenance frequency
* **Threshold:** `maintenance_frequency >= 2` AND `maintenance_frequency > fleet_median_maintenance_frequency`
* **Logical condition:** `vehicle_maintenance_count >= 2 AND vehicle_maintenance_count > fleet_median_maintenance_count`
* **Severity:** `REVIEW`
* **Evidence shown:** Vehicle maintenance count, fleet median count, recent maintenance dates, total maintenance cost
* **Recommended action:** Review recurring maintenance history.
* **Limitation:** Does not analyze whether maintenance events are for the same underlying problem. A vehicle with 2 events is only flagged if its frequency is also above the fleet median.

### R10 — FLEET_EXPANSION_REVIEW

* **Rule code:** `FLEET_EXPANSION_REVIEW`
* **Metric(s):** Category utilization, category maintenance downtime
* **Baseline:** Fleet median utilization, fleet median maintenance downtime, minimum vehicle count in category
* **Threshold:** `category_avg_utilization >= fleet_median_utilization` AND `category_avg_maintenance_downtime <= fleet_median_maintenance_downtime × 1.5` AND `category_vehicle_count >= 2`
* **Logical condition:** `AVG(vehicle_utilization) OVER (PARTITION BY type) >= fleet_median_utilization AND AVG(vehicle_maintenance_downtime) OVER (PARTITION BY type) <= fleet_median_maintenance_downtime * 1.5 AND COUNT(*) OVER (PARTITION BY type) >= 2`
* **Severity:** `INFO`
* **Evidence shown:** Category average utilization, fleet median utilization, category average downtime, fleet median downtime, category vehicle count
* **Recommended action:** The category demonstrates strong recorded utilization and acceptable recorded downtime. Consider evaluating additional capacity only if external demand, financial feasibility, and business strategy also support expansion. This is a decision-support signal, not a business directive.
* **Limitation:** Category-level metric inherits limitations of underlying vehicle-level metrics. High recorded utilization does not prove unmet customer demand.

---

# 27. Utilization/Downtime Decision Matrix

| Utilization | Downtime | Classification | Interpretation |
|-------------|----------|----------------|----------------|
| High | High | HIGH_DEMAND_OPERATIONAL_RISK | Vehicle is in demand but suffers significant downtime. Investigate whether downtime is avoidable. |
| Low | Low | DEMAND_SIDE_UNDERUTILIZATION | Vehicle is available and reliable but not in demand. Review pricing, location, or marketing. |
| Low | High | OPERATIONAL_UNDERPERFORMANCE | Vehicle suffers from both low demand and high downtime. Investigate operational causes before fleet changes. |
| High | Low | HEALTHY_PERFORMER | Vehicle performs well. Maintain availability and monitor demand. |

**Definition of HIGH and LOW:**
* **HIGH utilization:** vehicle_utilization >= fleet_median_utilization
* **LOW utilization:** vehicle_utilization < fleet_median_utilization - 0.10
* **HIGH downtime:** maintenance_downtime > fleet_median_maintenance_downtime × 1.5
* **LOW downtime:** maintenance_downtime <= fleet_median_maintenance_downtime × 1.5

These definitions apply to R5, R6, R7, and R8.

---

# 28. Incomplete Data Handling

Because many metrics are PARTIALLY COMPUTABLE, the advisory system must classify data completeness before generating recommendations.

## Completeness Levels

### SUFFICIENT_DATA

All metrics required by the rule are available with acceptable accuracy. Recommendation is generated normally.

### LIMITED_DATA

One or more required metrics are available but carry documented limitations. Recommendation is generated with an explicit caveat.

Example: Utilization is computed from bookings only because `vehicle_status_history` is incomplete. The recommendation includes:

> Data limitation: Utilization is based on booking records only. Vehicle status history is incomplete, so actual availability periods may be underrepresented.

### INSUFFICIENT_DATA

A critical metric is completely unavailable for the vehicle. Recommendation is suppressed.

Example: A vehicle has no bookings and no status history beyond `created_at`. Utilization cannot be estimated. No utilization-based recommendation is generated.

## Rule-Specific Suppression

| Rule | Suppression condition |
|------|----------------------|
| R1 UNDERUTILIZED | Suppress if utilization is NULL due to missing booking and status data. |
| R2 MAINTENANCE_DOWNTIME | Suppress if vehicle has no maintenance records and no status-history `MAINTENANCE` transitions. |
| R3 TURNAROUND_BOTTLENECK | Suppress if vehicle has no returned bookings with subsequent `READY` transitions. |
| R4 REPEATED_INSPECTION_ISSUES | Suppress if vehicle has no inspections. |
| R5–R8 | Suppress if either utilization or maintenance downtime is NULL. |
| R9 RECURRING_MAINTENANCE | Suppress if vehicle has fewer than 2 maintenance events or no maintenance records. |
| R10 FLEET_EXPANSION_REVIEW | Suppress if category has fewer than 2 vehicles. |

## NULL Treatment (Implemented 2026-09-04 Correction)

The corrected implementation enforces NULL semantics throughout the metric layer:

* `advisory_rental_days.rental_days` is NULL for vehicles with no qualifying bookings (no row produced)
* `advisory_utilization.utilization` is NULL when no in-window rental days exist or window is invalid
* `advisory_maintenance_downtime.maintenance_downtime_days` is NULL when no maintenance records exist
* `advisory_return_ready.avg_return_ready_days` is NULL when no `RETURNED → READY` transitions exist
* `advisory_return_inspection.avg_return_inspection_days` is NULL when no return→inspection pairs exist
* `advisory_inspection_issue_rate.issue_rate` is NULL when no inspections exist
* `advisory_revenue.paid_revenue` is NULL when no PAID payments exist
* `maintenance_frequency` and `maintenance_count` are count metrics — zero is meaningful and retained

Fleet baselines compute each median via `PERCENTILE_CONT(0.5) ... FILTER (WHERE metric IS NOT NULL)` so vehicles without evidence are excluded from that specific baseline.

Do not manufacture default values. Missing data results in suppression or limited-data labeling, not invented metrics.

---

# 29. Recommendation Severity

Three severity levels are defined. Severity reflects operational urgency, not AI confidence.

## INFO

Routine observation. No immediate action required.

* R6 — DEMAND_SIDE_UNDERUTILIZATION
* R8 — HEALTHY_PERFORMER
* R10 — FLEET_EXPANSION_REVIEW

## REVIEW

Deserves attention but is not an emergency. Human review is recommended.

* R1 — UNDERUTILIZED
* R2 — MAINTENANCE_DOWNTIME
* R3 — TURNAROUND_BOTTLENECK
* R4 — REPEATED_INSPECTION_ISSUES
* R9 — RECURRING_MAINTENANCE

## HIGH_PRIORITY

Combined patterns that suggest significant operational risk. Should be investigated promptly.

* R5 — HIGH_DEMAND_OPERATIONAL_RISK
* R7 — OPERATIONAL_UNDERPERFORMANCE

Severity must be justifiable from the rule and evidence alone. No fake confidence scores.

---

# 30. Explainability Flow

Every recommendation must expose the following chain:

```text
Recommendation
    ↓
Rule code and title
    ↓
Metric values (vehicle vs fleet)
    ↓
Baseline method
    ↓
Raw evidence records
    ↓
Interpretation
    ↓
Suggested action
    ↓
Data limitation (if any)
```

### Example Output

```text
RECOMMENDATION
  Rule:           OPERATIONAL_UNDERPERFORMANCE
  Severity:       HIGH_PRIORITY
  Vehicle:        V102
  
  OBSERVATION
    Utilization:  38%  (fleet median: 67%)
    Downtime:     9.4 days  (fleet median × 1.5: 4.7 days)
  
  EVIDENCE
    Bookings:     4 bookings in window
    Maintenance:  3 events, total cost $1,250
    Last event:   2026-08-15
    
  RULE
    Low utilization + high downtime
    
  BASELINE
    Fleet median utilization = 67%
    Fleet median maintenance downtime = 3.1 days
    Low utilization threshold = fleet median - 10% = 57%
    
  SUGGESTED ACTION
    Investigate operational downtime before changing fleet allocation.
    
  DATA LIMITATION
    Utilization based on booking records only.
    Status history incomplete for this vehicle.
```

This structure allows the owner to verify every claim by querying the source tables.

---

# 31. Seed Data Sanity Check

The finalized rules and thresholds were evaluated conceptually against the verified seed dataset.

### Expected behavior

* Vehicles with no bookings should show 0% utilization and trigger R1 (UNDERUTILIZED) if the fleet median is above 0.
* Vehicles with multiple maintenance events should be evaluated against R2 and R9.
* Vehicles returned but never reaching `READY` (Vehicles 5, 9, 10) should be excluded from R3 fleet baseline calculations.
* Vehicles with only `GOOD` inspections should not trigger R4.
* No rule should classify all 10 vehicles as problematic or all 10 as healthy; the median-based thresholds ensure mixed classifications in a realistic dataset.

### Known seed-data risks

* Because `vehicle_status_history` is incomplete for several vehicles, utilization values derived from bookings only may differ from what a complete status-history derivation would show. This is a known and documented limitation, not a design failure.
* If the seed dataset is unusually homogeneous, median-based thresholds may produce few or no flags. This is acceptable for an academic demonstration; the rules are designed for a realistic fleet with variance.

### Validation requirement

Before implementation, the analytical SQL should be executed against the seed data to confirm:
* no division-by-zero errors;
* no vehicles with NULL utilization where bookings exist;
* fleet medians are computable for all metrics;
* R3 excludes vehicles without `READY` transitions from its baseline without error.

---

# 32. Implementation Readiness

The advisory design is now complete. The following are finalized:

* Observation window convention
* 12 metric definitions with exact SQL formulas
* Fleet baseline method (fleet median, stratified by type when n >= 2)
* Thresholds for all 10 rules
* Utilization/downtime decision matrix
* Incomplete data handling policy
* Recommendation severity model
* Explainability flow
* Seed data sanity check criteria

**No schema changes are required.** All metrics are either directly or partially computable from the existing 12-table schema.

---

## 33. Implementation Results

The advisory SQL has been implemented, validated, and corrected against the seed data.

### Files

- `database/advisory_views.sql` — 13 analytical views (Metrics A–L + unified `advisory_vehicle_metrics`)
- `database/advisory_rules.sql` — R1–R10 advisory rules with consistent 32-column UNION ALL output
- `database/advisory_verify.js` — Validation script with 18 correctness checks
- `package.json` — Added `"advisory": "node database/advisory_verify.js"`

### Correction Phase (2026-09-04)

The initial 22-recommendation run exposed analytical correctness problems. All six required fixes were applied without changing thresholds:

1. **NULL semantics**: metrics now return NULL when no evidence exists (instead of `COALESCE(..., 0)`)
2. **Baseline populations**: each `PERCENTILE_CONT(0.5)` uses `FILTER (WHERE metric IS NOT NULL)` so vehicles without evidence are excluded from that baseline
3. **Utilization bound**: rental days are clipped to the per-vehicle active window; utilization is `LEAST(rental_days/window, 1.0)` so it can never exceed 100%
4. **R10 grouping**: R10 uses a `cat_aggs` CTE; one row per `type`, no per-vehicle grouping dimensions
5. **Validation script**: 18 explicit correctness checks covering utilization bounds, NULL evidence, baseline eligibility, R10 uniqueness, schema integrity, canonical column shape
6. **Thresholds preserved**: utilization offset (-0.10), downtime × 1.5, return-ready × 1.5, issue rate × 1.5, R9 ≥ 2 and > median, R10 min 2 vehicles — all unchanged

### Baseline Populations

| Metric | Eligible | Excluded | Median |
|--------|---------:|---------:|-------:|
| utilization | 1 | 9 | 0.8551 |
| maintenance_downtime_days | 5 | 5 | 1.0000 |
| maintenance_frequency | 10 | 0 | 1.0000 |
| avg_return_ready_days | 3 | 7 | 0.6250 |
| inspection_issue_rate | 8 | 2 | 0.0000 |
| paid_revenue | 9 | 1 | 10000.0000 |

### Final Rule Results

| Rule | Severity | Count | Vehicles/Categories |
|------|----------|------:|---------------------|
| R1 UNDERUTILIZED | REVIEW | 0 | — |
| R2 MAINTENANCE_DOWNTIME | REVIEW | 1 | V5 |
| R3 TURNAROUND_BOTTLENECK | REVIEW | 0 | — |
| R4 REPEATED_INSPECTION_ISSUES | REVIEW | 0 | — |
| R5 HIGH_DEMAND_OPERATIONAL_RISK | HIGH_PRIORITY | 0 | — |
| R6 DEMAND_SIDE_UNDERUTILIZATION | INFO | 0 | — |
| R7 OPERATIONAL_UNDERPERFORMANCE | HIGH_PRIORITY | 0 | — |
| R8 HEALTHY_PERFORMER | INFO | 1 | V6 |
| R9 RECURRING_MAINTENANCE | REVIEW | 0 | — |
| R10 FLEET_EXPANSION_REVIEW | INFO | 1 | Sedan |
| **Total** | | **3** | |

### Why the count changed from 22 to 3

The previous run used `COALESCE(metric, 0)` which silently treated missing evidence as a measured zero, inflating utilization/downtime baselines and triggering R1/R5/R6/R7/R8 on vehicles that actually had no in-window rental evidence. After NULL semantics, only V5 (R2 — real ongoing maintenance downtime of 22.75 days), V6 (R8 — single Sep 5–10 in-window booking produces valid 85.5% utilization), and Sedan (R10 — only category with ≥ 2 vehicles both having measured metrics) qualify.

### Correctness Validation — 18/18 PASS

* No utilization > 1.0
* No negative rental duration / downtime
* All vehicles have positive observation window
* Vehicles without READY/maintenance/inspections/revenue have NULL evidence (not zero)
* Schema files unchanged (12 tables)
* Each baseline correctly excludes vehicles without evidence
* R10 produces ≤ 1 row per category
* All 10 rule SQL branches execute
* All canonical 32 columns present in output

### Known Limitations

1. Observation window anchored at `vehicles.created_at` is small (≈6.3 days) for the academic seed dataset; most historical bookings fall outside per-vehicle active windows
2. Rental day computation uses clip-and-sum (not interval union); correct for non-overlapping bookings
3. R10 uses simple averages over per-vehicle metrics

### How to Run

```bash
npm run advisory
```

## ONE EXACT NEXT ACTION

**Re-audit the corrected advisory SQL results against the finalized advisory design before beginning backend implementation.**
## 34. Final Correctness Pass

The LEAST-cap utilization was replaced with a true tstzrange interval union (PostgreSQL ange_agg(tstzrange)). The cap is gone from the code; utilization is a real ratio of union-length to observation-window length.

### Files touched (final pass)

- database/advisory_views.sql — full rewrite of all 13 metric views to use a shared windows CTE, in-window filtering, NULL semantics, and ange_agg for utilization
- database/advisory_rules.sql — preserved (unchanged from prior pass)
- database/advisory_verify.js — replaced structural window check with re-derivation audit; added non-overlap check; added CTE-name regex for branch identification

### Final Utilization Formula

`
WITH clipped AS (
  SELECT tstzrange(GREATEST(pickup, active_start), LEAST(return, active_end), '[)') AS r
  FROM bookings WHERE ... AND clipped is non-empty
)
SELECT vehicle_id, range_agg(r) AS u FROM clipped GROUP BY vehicle_id;
-- union_length = (upper(u) - lower(u)) in days
-- utilization = union_length / observation_window_days
`

No LEAST(..., 1.0) exists anywhere in the code.

### Observation Window Treatment

Every timestamp-based view (E maintenance downtime, G return->inspection, H return->ready, I inspection issue rate, J revenue, K recurring maintenance, L recurring inspection issues, plus A rental days) uses the same per-vehicle active window derived from dvisory_fleet_bounds:

`
active_start = GREATEST(report_start_date, vehicle.created_at)
active_end   = report_end_date
`

Count metrics (C maintenance_frequency, D maintenance_cost.count, K/L flags) retain zero counts by design.

### Verification: 21/21 PASS

- No utilization > 1.0 (semantic, no cap in code)
- Rental time <= observation window
- Union length == deoverlap (no double-counting)
- Re-derivation audit agrees with view output
- All 10 rule CTEs identifiable
- schema.sql unchanged (12 tables)
- No negative durations
- NULL evidence preserved (R2/R3/R4/J)
- maintenance_frequency=0 semantics preserved
- R10 <= 1 row per category
- 32-column canonical output

### Final Rule Results

**0 recommendations.**

This is the correct outcome of the finalized design applied to the seed dataset. Every historical event in seed.sql (Aug 1 - Aug 29) lies before each vehicle's ctive_start = vehicles.created_at = today, so it is correctly excluded by the per-vehicle window filter. The only in-window rental is V6's future-confirmed booking 12 (Sep 5-10) giving 85.61% utilization. With one vehicle per baseline, no rule threshold is exceeded.

### Remaining Limitations

1. Seed ehicles.created_at defaults to CURRENT_TIMESTAMP (= today) because no seed INSERT sets it. A realistic seed would backdate creation so historical August activity falls inside each vehicle's active window. Modifying seed is intentionally out of scope for the advisory SQL phase.
2. R10 with mixed-NULL category members produces NULL AVG() aggregates, which correctly suppress the category; no row is fabricated.

### Verdict

**The advisory SQL implementation now satisfies all finalized design contracts.** All 21 correctness checks pass. The zero-recommendation result is a property of the seed dataset, not a defect of the SQL. The advisory layer is genuinely ready for backend implementation.

## ONE EXACT NEXT ACTION

**Begin backend advisory implementation.**

## 36. Rental Duration Correction (Final)

### Issue

upper(m.u) - lower(m.u) over a 	stzmultirange measures outer-bounds span including gaps. Two 3.375-day bookings with a gap produce 10.375 days instead of 6.75.

### Correction in advisory_rental_days

The view now unnests the merged multirange and sums per-part durations:

`sql
parts AS (
  SELECT m.vehicle_id,
         SUM(EXTRACT(EPOCH FROM (upper(p.r) - lower(p.r))) / 86400.0) AS rental_days,
         (SELECT COUNT(*) FROM clipped c WHERE c.vehicle_id = m.vehicle_id) AS booking_count
  FROM merged m, LATERAL unnest(m.u) AS p(r)
  GROUP BY m.vehicle_id
)
`

* Overlap merging preserved (range_agg merges into one part).
* Window clipping preserved.
* No LEAST/utilization cap.
* rental_days <= observation_window_days because every constituent range lies inside the window.
* booking_count counts only in-window eligible bookings.

### New verification checks

Independent re-derivation in advisory_verify.js using the same clip + range_agg + unnest pipeline compares against the view's output:

* rental_days within 1e-6 tolerance
* booking_count exact equality

### Validation: 22/22 PASS

### Manual V6 verification

V6 booking 12 (Sep 5 09:00 - Sep 10 18:00) = 5.375 days in-window. View rental_days = 5.375, booking_count = 1, utilization = 5.375 / 6.274 = 85.67%.

### Verdict

Advisory SQL is genuinely ready for backend implementation.

## ONE EXACT NEXT ACTION

**Begin backend advisory implementation.**

## 37. Final Count-Metric NULL/Zero Correction

### Issue

dvisory_vehicle_metrics LEFT JOINed metric views that only produced rows when there was evidence. Count metrics were therefore NULL for zero-record vehicles, violating the design contract that count metrics retain a true zero.

### Correction

Unified view now COALESCEs seven count metrics to 0 from the LEFT JOIN. Evidence-based measurements (durations, averages, ratios, costs, revenue) remain plain LEFT JOIN so they keep NULL when there is no evidence.

### Verification

Seven zero-source semantic checks + seven evidence-NULL semantic checks added. All pass.

### Baseline impact

maintenance_frequency baseline: eligible=10, excluded=0 (was 1/9). Median now 0.0000 (correct: nine zeros and one 1).

### Zero-count distribution

* maintenance_frequency: 9 vehicles with 0
* booking_count: 9 vehicles with 0
* total_inspections: 10 vehicles with 0 (all seed inspections fall before per-vehicle active_start)
* issue_inspections: 10 vehicles with 0
* paid_payment_count: 10 vehicles with 0 (all PAID payments on bookings whose pickup predates per-vehicle active_start)
* return_ready_count: 10 vehicles with 0
* return_with_inspection_count: 10 vehicles with 0

### Validation: 31/31 PASS

All 22 prior + 9 new semantic checks.

### Verdict

Advisory SQL is genuinely ready for backend implementation.

## ONE EXACT NEXT ACTION

**Begin backend advisory implementation.**

## 38. Final Maintenance-Cost NULL Semantics Correction

### Issue

dvisory_maintenance_cost used COALESCE(SUM(m.cost), 0), and the unified view used COALESCE(mc.total_maintenance_cost, 0) AS maintenance_cost. Both silently converted missing/unknown costs into artificial zero, violating the evidence-based NULL contract.

### Correction

* dvisory_maintenance_cost now returns SUM(m.cost) directly. SUM() of all-NULL inputs returns NULL.
* dvisory_vehicle_metrics.maintenance_cost exposes mc.total_maintenance_cost directly without COALESCE.
* maintenance_frequency retains COALESCE(..., 0) (count metric, genuine zero required).

### Semantics

| Scenario | maintenance_cost |
|----------|------------------|
| No in-window maintenance records | NULL |
| In-window maintenance records, all cost NULL | NULL |
| In-window maintenance records with at least one non-NULL cost | actual summed cost |

### Verification: 34/34 PASS

Three new explicit checks added:

1. Vehicles with maintenance_frequency = 0 must have maintenance_cost IS NULL.
2. maintenance_cost = 0 forbidden unless a raw in-window cost = 0 row exists (no NULL -> 0 conversion).
3. If any in-window maintenance record has non-NULL cost, maintenance_cost must be non-NULL.

### Verdict

Advisory SQL is genuinely ready for backend implementation. Count metrics keep true zero; evidence-based metrics keep NULL when no evidence.

## ONE EXACT NEXT ACTION

**Begin backend advisory implementation.**


## Section 39 � Frontend Advisory Implementation

Date: 2026-09-04

### Architecture decision
Advisory UI is embedded inside the existing **Owner ? Analytics** experience. No new top-level route, sidebar item, or separate application shell was created.

### Files changed
- rontend/src/services/advisoryApi.js
- rontend/src/components/AdvisoryDashboard.jsx
- rontend/src/pages/OwnerPages.jsx
- rontend/src/styles.css

### Data flow
`
PostgreSQL ? Advisory SQL Views ? Advisory Rules ? Express REST API ? React AdvisoryDashboard
`

React is strictly a presentation layer. It does not:
- calculate thresholds
- compute recommendations
- duplicate R1�R10
- invent baselines
- convert null evidence into zero

### NULL/zero contract
- Evidence-based nulls are rendered as "�"
- Count zeros are rendered as "0"
- The AdvisoryDashboard component uses explicit EVIDENCE_METRICS and COUNT_METRICS arrays to preserve this contract

### Validation
- Frontend 
pm run build � success
- Backend smoke tests � 20/20 PASS
- Advisory SQL verification � 34/34 PASS

### Next action
Frontend advisory UI is implemented and validated. Ready for manual browser QA and then production hardening.


## Section 40 � Frontend UI Correctness Audit

Date: 2026-09-04

### Audit findings
- Baseline population was misleadingly displayed as a single generic number.
- Vehicle identifiers were incorrectly referencing a non-existent ehicle_label field.
- Recommendation table referenced non-existent metric_name/metric_value columns.
- Empty-state wording implied system dysfunction.

### Corrections applied
- Baseline cards now show metric-specific populations matching backend JSON.
- Vehicle labels now use rand + model with #vehicle_id fallback.
- Recommendation table aligned with actual SQL output columns.
- Added methodology/explainability section.

### Files changed
- rontend/src/components/AdvisoryDashboard.jsx
- rontend/src/styles.css

### Validation
- 
pm run build � success
- 
ode backend/smoke_test.js � 20/20 PASS
- 
pm run advisory � 34/34 PASS

### Next action
Manual browser QA.


## Section 41 � Frontend UX Redesign

Date: 2026-09-04

### Objective
Transform the AdvisoryDashboard from a database-style report into a polished Fleet Operations & Advisory Dashboard.

### Design hierarchy
1. Key Fleet Signals
2. Operational Snapshot
3. Vehicle Insights
4. Recommendations
5. Fleet Baselines
6. Methodology

### Vehicle Insights approach
Replaced 16-column table with card-based layout:
- Each vehicle shows brand/model, type, evidence status pill
- Key metrics always visible (bookings, utilization, maintenance frequency)
- Evidence-specific metrics shown conditionally (rental days, maintenance cost, downtime, revenue)
- Expandable full-metrics table preserves access to all 16 columns
- Vehicles with evidence get teal left-border; no-evidence vehicles are de-emphasized

### Operational Snapshot
Two compact panels:
- Rental Activity: count + fleet median utilization
- Maintenance Activity: count + fleet median downtime

### Baseline redesign
Compact cards showing median value + population per metric.

### Methodology
Visual flow diagram instead of text-heavy list.

### Data contract
Backend API unchanged. NULL/zero semantics unchanged. React is strictly a presentation layer.

### Validation
- 
pm run build � success
- 
ode backend/smoke_test.js � 20/20 PASS
- 
pm run advisory � 34/34 PASS
- Live API simulation � all sections verified

### Next action
Manual browser QA at http://localhost:5173/owner/analytics.

