# SmartCar — Project Context

## Project

SmartCar is an academic DBMS/full-stack project for car-rental operations.

The project combines:

**Car Rental + Fleet Operations + Vehicle Lifecycle + Analytics + Advisory**

---

## Main Users

### Customer
The customer can:
- search cars;
- view vehicle details;
- book;
- view booking history;
- see payment information;
- communicate with the rental company.

### Rental Company
The rental company can:
- manage vehicles;
- manage bookings;
- inspect returned vehicles;
- track maintenance;
- track vehicle status;
- view operational analytics;
- receive advisory recommendations.

### DBMS Demonstration
The project demonstrates:
- EER/ER diagram;
- relational schema;
- database tables;
- SQL queries;
- relationships;
- constraints;
- indexes;
- analytics;
- advisory rules.

---

## Core Vehicle Lifecycle

```text
AVAILABLE
    ↓
RESERVED
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
```

The lifecycle itself is **not claimed as novel**.

It is the structured operational history that supports the analytics/advisory layer.

---

## New Direction

SmartCar now includes an:

# Operations Analytics & Advisory Layer

The company records operational data.

SmartCar analyzes it.

```text
Company Data
     ↓
PostgreSQL
     ↓
SQL Analytics
     ↓
Pattern Detection
     ↓
Business Rule
     ↓
Evidence
     ↓
Recommendation
```

---

## Example

The system detects:

```text
Vehicle V102

Utilization = 38%
Fleet average = 67%

Maintenance downtime = 9.4 days
Fleet average = 3.1 days
```

SmartCar can say:

> Vehicle V102 requires operational review because it has low utilization combined with unusually high maintenance downtime.

The important part is that the owner can see **why** the recommendation was generated.

---

## Positioning

SmartCar should be presented as:

> **A database-driven decision-support system for car-rental operations.**

Not as:
- the first rental platform;
- the first fleet-management platform;
- the first analytics system;
- the first advisory platform;
- an AI system unless AI is actually implemented.

---

## Current Research Status

Secondary market research has established that many commercial platforms already provide:
- booking;
- availability;
- maintenance;
- inspection;
- turnaround;
- utilization;
- revenue analytics;
- fleet reporting;
- pricing/forecasting;
- recommendation features.

Therefore the SmartCar contribution should focus on a **transparent DBMS implementation of cross-table operational decision support**.

Real operator interviews are still required for field validation.

---

## Current Development State

- Phase 1: Complete
- Phase 2: Complete and verified
- Phase 3A: Complete
- Phase 3B: Current/next
- Advisory research: Complete
- Advisory design: Next
- Database advisory audit: Next
- Advisory implementation: Not started

---

## Immediate Next Action

**Create/finalize the advisory design document and audit the current database against its requirements before changing code or schema.**