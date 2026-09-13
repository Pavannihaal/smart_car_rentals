# SmartCar — Development Roadmap

## Phase 1 — Project Foundation

**Status: COMPLETE**

Completed:
- project concept;
- problem analysis;
- architecture;
- EER/ER planning;
- database planning;
- locked 12-table design.

---

# Phase 2 — Database

**Status: COMPLETE**

Completed:
- PostgreSQL schema;
- 12 tables;
- relationships;
- weak entities;
- constraints;
- indexes;
- seed data;
- 10 SQL queries;
- database verification.

---

# Phase 3A — React Foundation

**Status: COMPLETE**

Completed:
- React foundation;
- routing;
- component structure;
- page structure;
- mock-data architecture.

---

# Phase 3B — Application Shell

**Status: CURRENT / NEXT**

Build:
- AppShell;
- Sidebar;
- Topbar;
- PageContainer;
- Breadcrumbs;
- StatusBadge;
- LoadingState;
- EmptyState;
- ErrorState;
- customer navigation;
- rental-owner navigation;
- DBMS navigation.

---

# Advisory Research & Design Stream

This is a new project stream that must be completed before implementing the advisory engine.

### Step A1
Market research.

**Status: COMPLETE**

### Step A2
Identify what existing platforms already provide.

**Status: COMPLETE**

### Step A3
Define SmartCar's advisory opportunity.

**Status: COMPLETE**

### Step A4
Create `ADVISORY_RESEARCH_AND_DESIGN.md`.

**Status: NEXT**

### Step A5
Audit the existing 12-table database.

For every metric/rule:
- map exact table;
- map exact column;
- determine computability;
- identify limitations.

**Status: NEXT**

### Step A6
Decide whether minimal schema/data enhancement is required.

### Step A7
Finalize advisory rules and thresholds.

### Step A8
Create analytical SQL/views.

### Step A9
Implement backend advisory logic.

### Step A10
Implement React advisory dashboard.

### Step A11
Create realistic test scenarios.

### Step A12
Validate assumptions with real rental operators.

---

# Remaining Phase 3

### 3C
Customer interface.

### 3D
Rental-owner interface.

### 3E
Booking workflow.

### 3F
Vehicle lifecycle interface.

### 3G
ER/EER diagram.

### 3H
Relational schema viewer.

### 3I
Database table viewer.

### 3J
SQL query demonstration.

### 3K
Chat + call.

### 3L
Responsive/polished UI.

---

# Later Phases

### Phase 4
Node/Express backend + PostgreSQL APIs.

### Phase 5
Authentication and authorization.

### Phase 6
Booking business logic.

### Phase 7
Vehicle operational lifecycle.

### Phase 8
Advanced DBMS analytics + advisory.

### Phase 9
Security and validation.

### Phase 10
Testing.

### Phase 11
Deployment and final demonstration.

### Phase 12
Optional advanced features:
- Socket.IO;
- Google Maps/Places;
- KYC;
- GPS;
- real payments;
- notifications;
- AI/ML;
- other integrations.

---

# Scope Rule

Do not add complexity just to make the project appear advanced.

The first target is:

**Correct relational database → useful SQL analytics → explainable advisory → working application.**