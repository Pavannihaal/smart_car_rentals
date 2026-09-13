# SmartCar — System Architecture

## 1. Technology Stack

### Frontend
- React
- JavaScript
- React Router
- Existing project styling system

### Backend
- Node.js
- Express
- REST APIs

### Database
- PostgreSQL

### Communication
- REST initially
- Socket.IO deferred

---

# 2. High-Level Architecture

```text
              USERS
        ┌──────┼──────┐
        ↓      ↓      ↓
    Customer  Owner  DBMS Demo
        └──────┼──────┘
               ↓
             React
               ↓
        Node + Express
               ↓
          PostgreSQL
               ↓
        SQL / Analytics
               ↓
          Advisory Rules
               ↓
       Recommendations
```

---

# 3. Customer Flow

```text
Home
 ↓
Search Cars
 ↓
Vehicle Details
 ↓
Booking
 ↓
Confirmation
 ↓
My Bookings
 ↓
Messages / Profile
```

---

# 4. Rental Owner Flow

```text
Dashboard
 ↓
Fleet
 ↓
Bookings
 ↓
Inspections
 ↓
Maintenance
 ↓
Vehicle History
 ↓
Analytics
 ↓
Advisory
 ↓
Settings
```

---

# 5. DBMS Demonstration Flow

```text
Database Overview
       ↓
ER/EER Diagram
       ↓
Relational Schema
       ↓
Tables
       ↓
SQL Queries
       ↓
Analytics
       ↓
Advisory
```

---

# 6. Vehicle Lifecycle

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
 ├──────────────┐
 ↓              ↓
GOOD           ISSUE
 ↓              ↓
CLEANING    MAINTENANCE
 └──────┬───────┘
        ↓
      READY
        ↓
   AVAILABLE
```

---

# 7. Advisory Architecture

```text
             OPERATIONAL DATA
                    ↓
              PostgreSQL DB
                    ↓
             Analytical SQL
                    ↓
              Derived Metrics
                    ↓
              Business Rules
                    ↓
            Pattern / Exception
                    ↓
              Evidence Builder
                    ↓
             Recommendation
                    ↓
               Owner UI
```

---

# 8. Explainability

A recommendation must not appear as an unexplained statement.

The UI should conceptually show:

```text
PROBLEM
   ↓
OBSERVATION
   ↓
EVIDENCE
   ↓
RULE TRIGGERED
   ↓
RECOMMENDATION
```

---

# 9. Implementation Philosophy

The advisory system should initially use:

```text
PostgreSQL
+
SQL
+
Node/Express
+
React
```

No AI service is necessary.

The system should remain understandable during a DBMS viva.

---

# 10. Current Frontend Phases

### 3A — React Foundation
Complete.

### 3B — Application Shell
Current/next.

### 3C — Customer Interface

### 3D — Rental Owner Interface

### 3E — Booking Workflow

### 3F — Vehicle Lifecycle UI

### 3G — ER/EER Diagram UI

### 3H — Relational Schema UI

### 3I — Database Table Viewer

### 3J — SQL Demonstration

### 3K — Chat + Call

### 3L — UI Polish

The advisory UI should be integrated into the rental-owner analytics area after the advisory specification and database audit are complete.