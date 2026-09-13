# SmartCar — Database Design

## 1. Locked Core Schema

SmartCar currently contains exactly 12 core tables.

1. `users`
2. `customers`
3. `rental_companies`
4. `locations`
5. `vehicles`
6. `bookings`
7. `payments`
8. `vehicle_inspections`
9. `maintenance`
10. `vehicle_status_history`
11. `reviews`
12. `messages`

---

## 2. Weak Entities

### vehicle_inspections

Weak entity dependent on `bookings`.

Primary key:

```text
(booking_id, inspection_no)
```

### maintenance

Weak entity dependent on `vehicles`.

Primary key:

```text
(vehicle_id, maintenance_no)
```

---

## 3. Relationships

```text
users 1:1 customers

users 1:1 rental_companies

rental_companies 1:N locations

rental_companies 1:N vehicles

locations 1:N vehicles

customers 1:N bookings

vehicles 1:N bookings

bookings 1:N payments

bookings 1:N vehicle_inspections

vehicles 1:N maintenance

vehicles 1:N vehicle_status_history

bookings 1:0..1 reviews

bookings 1:N messages

users 1:N messages
```

---

## 4. Verified Seed Data

| Table | Records |
|---|---:|
| users | 12 |
| customers | 9 |
| rental_companies | 3 |
| locations | 5 |
| vehicles | 10 |
| bookings | 13 |
| payments | 11 |
| vehicle_inspections | 8 |
| maintenance | 5 |
| vehicle_status_history | 46 |
| reviews | 6 |
| messages | 10 |

---

## 5. Existing Database Validation

Phase 2 confirmed:
- tables created;
- relationships implemented;
- weak entities implemented;
- constraints implemented;
- indexes implemented;
- seed data loaded;
- 10 SQL demonstration queries executed successfully.

---

# 6. Advisory Database Audit

Before changing the database, inspect the actual schema.

The following must be tested.

| Metric | Likely tables | What must be verified |
|---|---|---|
| Utilization | vehicles, bookings, status_history | Can rental/available time be derived? |
| Maintenance downtime | maintenance, status_history | Are useful start/end timestamps available? |
| Inspection issues | inspections | Is outcome/issue data stored? |
| Status duration | status_history | Are status transitions timestamped? |
| Return → inspection | bookings, inspections, status_history | Can both events be paired? |
| Return → ready | bookings, status_history | Is READY transition recorded? |
| Maintenance frequency | maintenance | Are dates/events available? |
| Maintenance cost | maintenance | Is cost available? |
| Revenue per vehicle | bookings, payments | Can revenue be linked to a vehicle? |
| Recurring problems | inspections, maintenance, status_history | Is historical detail sufficient? |

---

## 7. Required Audit Classification

Every advisory requirement must be classified as:

### Directly computable

Current database contains enough reliable data.

### Partially computable

Some information exists but the metric has limitations.

### Impossible

Required information does not exist in the current schema/data.

---

## 8. Critical Rule

Do NOT assume a field exists.

Inspect:
- table definitions;
- column names;
- data types;
- constraints;
- foreign keys;
- indexes;
- actual seed records.

---

## 9. Potential Fields to Check

These are possibilities only; they must NOT be added automatically.

Potentially useful:
- maintenance start timestamp;
- maintenance completion timestamp;
- maintenance reason;
- inspection outcome;
- inspection issue indicator;
- status-history reason;
- explicit READY transition;
- booking total amount.

Only add a field if the audit proves that it is necessary.

---

## 10. Existing SQL Demonstrations

The verified SQL demonstrations include:

1. all vehicles;
2. available vehicles;
3. vehicle type search;
4. price-range search;
5. location search;
6. customer booking history;
7. rental-company fleet;
8. vehicles under maintenance;
9. vehicle status history;
10. booking messages.

Advisory SQL must be designed after the database audit.