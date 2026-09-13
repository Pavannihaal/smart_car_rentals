# SmartCar — Master Project Prompt

## 1. Project Identity

**Project Name:** SmartCar

**Project Type:** Academic DBMS + Full-Stack Car Rental Operations and Fleet Advisory Platform

**Technology Stack**
- Frontend: React + JavaScript + React Router
- Backend: Node.js + Express
- Database: PostgreSQL
- Communication: REST initially
- Socket.IO: Deferred

## 2. Core Project Vision

SmartCar is a car-rental platform designed around three connected layers:

### Layer 1 — Rental Operations
- Customer registration/profile
- Vehicle search
- Vehicle details
- Booking
- Payment records
- Booking history
- Customer-rental communication

### Layer 2 — Fleet Operations
The system tracks the operational lifecycle of every rental vehicle:

`AVAILABLE → RESERVED → RENTED → RETURNED → INSPECTION → CLEANING/MAINTENANCE → READY → AVAILABLE`

### Layer 3 — Analytics & Advisory

Rental companies generate operational data through their normal activities.

SmartCar analyzes that relational data and provides:

`Operational Data → SQL Analytics → Problem Detection → Evidence → Recommendation → Owner Decision`

The advisory layer is rule-based and DBMS-driven initially. AI is not required.

---

## 3. Problem Statement

Rental companies may manage bookings, availability, returns, inspections, cleaning, maintenance, communication and financial records through disconnected/manual processes.

This can make it difficult to determine:
- which vehicles are actually performing well;
- which vehicles are underutilized;
- how much downtime vehicles experience;
- where return-to-ready delays occur;
- whether repeated inspection or maintenance problems affect availability;
- which operational issues deserve attention.

SmartCar attempts to provide one relational system that records these activities and converts them into useful operational decision support.

---

## 4. Important Market Positioning

Existing rental and fleet platforms already provide many individual capabilities such as:
- online booking;
- availability calendars;
- fleet management;
- utilization analytics;
- revenue/profitability reporting;
- maintenance tracking;
- inspection workflows;
- vehicle turnaround;
- pricing/forecasting;
- recommendation/AI features.

Therefore SmartCar must **not** claim that any of these individual capabilities are globally new.

The intended academic contribution is:

> A transparent, DBMS-first, cross-table decision-support framework that connects rental-operational records, derives measurable fleet indicators, detects operational patterns using explicit rules, and explains recommendations through underlying database evidence.

This is a **project design contribution**, not a patent or worldwide novelty claim.

---

## 5. Locked Database Architecture

SmartCar currently has exactly 12 core tables:

1. users
2. customers
3. rental_companies
4. locations
5. vehicles
6. bookings
7. payments
8. vehicle_inspections
9. maintenance
10. vehicle_status_history
11. reviews
12. messages

### Weak Entities

`vehicle_inspections`
- Weak entity
- Dependent on `bookings`
- Composite primary key:
  `(booking_id, inspection_no)`

`maintenance`
- Weak entity
- Dependent on `vehicles`
- Composite primary key:
  `(vehicle_id, maintenance_no)`

Do not redesign this schema unless an actual audit proves that a requirement cannot be supported.

---

## 6. Current Verified Database Data

The verified seed dataset contains:

- 12 users
- 9 customers
- 3 rental companies
- 5 locations
- 10 vehicles
- 13 bookings
- 11 payments
- 8 inspections
- 5 maintenance records
- 46 vehicle status-history records
- 6 reviews
- 10 messages

Phase 2 validation confirmed:
- all 12 tables;
- relationships;
- weak entities;
- constraints;
- indexes;
- seed data;
- 10 SQL demonstration queries.

---

## 7. Advisory Layer

The advisory layer should answer practical rental-owner questions.

### Initial advisory questions

1. Which vehicles are underutilized?
2. Which vehicles have excessive maintenance downtime?
3. Which vehicles have unusually long return-to-ready time?
4. Which vehicles repeatedly have inspection issues?
5. Which vehicles have high utilization but high downtime?
6. Which vehicles have low utilization and low downtime?
7. Which vehicles have low utilization and high downtime?
8. Which vehicles have high utilization and low downtime?
9. Which vehicles show repeated maintenance problems?
10. Which vehicle/category patterns deserve fleet attention?

---

## 8. Initial Advisory Rules

### R1 — Low Utilization

If vehicle utilization is materially below the fleet baseline:

`UNDERUTILIZED`

Possible recommendation:
> Review demand, pricing, location and booking patterns.

### R2 — Excessive Maintenance Downtime

If maintenance downtime is materially above the fleet baseline:

`MAINTENANCE_DOWNTIME`

Possible recommendation:
> Review recurring maintenance causes and scheduling.

### R3 — Long Return-to-Ready

If return-to-ready duration is materially above the fleet baseline:

`TURNAROUND_BOTTLENECK`

Possible recommendation:
> Review inspection, cleaning and maintenance handoffs.

### R4 — Repeated Inspection Issues

If inspection problems are materially above the fleet baseline:

`REPEATED_INSPECTION_ISSUES`

Possible recommendation:
> Review recurring condition/damage and maintenance patterns.

### R5 — High Utilization + High Downtime

`HIGH_DEMAND_OPERATIONAL_RISK`

Possible recommendation:
> Investigate downtime because unavailable periods affect a highly demanded vehicle.

### R6 — Low Utilization + Low Downtime

`DEMAND_SIDE_UNDERUTILIZATION`

Possible recommendation:
> Review pricing, location and demand before assuming an operational problem.

### R7 — Low Utilization + High Downtime

`OPERATIONAL_UNDERPERFORMANCE`

Possible recommendation:
> Investigate operational downtime before changing fleet allocation.

### R8 — High Utilization + Low Downtime

`HEALTHY_PERFORMER`

Possible recommendation:
> Maintain availability and monitor demand.

### R9 — Repeated Maintenance

`RECURRING_MAINTENANCE`

Possible recommendation:
> Review recurring maintenance history.

### R10 — Fleet/Category Attention

If a category consistently has strong utilization/demand and acceptable downtime:

`FLEET_EXPANSION_REVIEW`

Possible recommendation:
> Consider whether additional capacity of this category should be evaluated.

Thresholds must be justified using fleet averages, medians or documented project thresholds.

---

## 9. Explainability Requirement

Every advisory result should follow:

`Recommendation → Observation → Evidence → Rule → Suggested Action`

Example:

**Recommendation:** Review Vehicle V102

**Observation:** Low utilization

**Evidence:**
- Vehicle utilization: 38%
- Fleet average: 67%
- Maintenance downtime: 9.4 days
- Fleet average downtime: 3.1 days

**Rule:**
`LOW_UTILIZATION_HIGH_DOWNTIME`

**Suggested action:**
> Review recurring maintenance and inspection delays before increasing booking allocation.

The owner should be able to understand why the recommendation exists.

---

## 10. Advisory Metrics to Audit

Before implementation, verify whether the current database can calculate:

- utilization;
- booking/rental days;
- maintenance downtime;
- maintenance frequency;
- maintenance cost;
- inspection issue count/rate;
- vehicle status duration;
- return → inspection duration;
- return → ready duration;
- revenue per vehicle;
- recurring maintenance/inspection patterns.

Do not assume a metric is possible merely because a related table exists.

---

## 11. Scope Restrictions

Do not introduce these unless explicitly approved later:

- GPS tracking
- Google Maps/Places
- KYC APIs
- real payment gateway
- Socket.IO
- AI/LLM dependency
- advanced predictive ML
- unnecessary external integrations
- microservices

The initial advisory engine should be implementable with:

`PostgreSQL + SQL + Node/Express + React`

---

## 12. Agent Workflow

Every agent must:

1. Read all project documentation.
2. Inspect the actual repository.
3. Identify the current verified phase/sub-phase.
4. Verify previous work.
5. Never redo completed work.
6. Never redesign locked architecture without evidence.
7. Work only on the requested task.
8. Test changes.
9. Update `DEVELOPMENT_STATUS.md`.
10. Record exact files changed.
11. Record tests performed.
12. Record issues/blockers.
13. Record **ONE exact next action**.
14. Stop.

If documentation conflicts with the repository, inspect the repository and report the discrepancy instead of blindly rebuilding.

---

## 13. Current Immediate Task

The immediate task is:

> Create/finalize `ADVISORY_RESEARCH_AND_DESIGN.md`, then inspect the actual PostgreSQL schema and map every advisory metric/rule to the exact existing tables and columns.

Classify every requirement as:

- **Directly computable**
- **Partially computable**
- **Impossible with current data**

Do not modify the schema or application code until this audit is complete.