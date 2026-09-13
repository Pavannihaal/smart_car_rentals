-- SmartCar Advisory Analytical Views (Final Correctness Pass)
--
-- Design contract:
--   * Observation window: [active_start, active_end] where
--       active_start = GREATEST(report_start_date, vehicle.created_at)
--       active_end   = report_end_date
--     report_start_date = MIN(vehicles.created_at)
--     report_end_date   = GREATEST(MAX(bookings.return_datetime),
--                                   MAX(maintenance.end_date),
--                                   MAX(vehicle_inspections.inspection_date),
--                                   MAX(vehicle_status_history.changed_at),
--                                   CURRENT_DATE)
--   * NULL semantics: missing evidence => NULL (never zero). Count metrics
--     (maintenance_frequency, booking_count, etc.) retain true zero.
--   * Utilization: union of clipped booking intervals / window length.
--     No LEAST cap; overlapping bookings cannot double-count.
--   * All timestamp-based metrics (E, G, H, I, J, K, L) are filtered to the
--     per-vehicle active window so they describe the same reporting period.

-- ============================================
-- FLEET BOUNDS (shared observation window)
-- ============================================
CREATE OR REPLACE VIEW advisory_fleet_bounds AS
SELECT
    MIN(v.created_at) AS report_start_date,
    GREATEST(
        COALESCE((SELECT MAX(b.return_datetime) FROM bookings b), '1900-01-01'::timestamp),
        COALESCE((SELECT MAX(m.end_date)   FROM maintenance  m), '1900-01-01'::timestamp),
        COALESCE((SELECT MAX(vi.inspection_date) FROM vehicle_inspections vi), '1900-01-01'::timestamp),
        COALESCE((SELECT MAX(vsh.changed_at) FROM vehicle_status_history vsh), '1900-01-01'::timestamp),
        CURRENT_DATE::timestamp
    ) AS report_end_date
FROM vehicles v;


-- ============================================
-- METRIC A: Rental Days (union of clipped booking intervals)
-- rental_days = SUM of (upper - lower) for each merged range component.
-- Outer-bounds subtraction is wrong when the multirange has gaps; we sum
-- the parts. booking_count counts only in-window eligible bookings.
-- ============================================
CREATE OR REPLACE VIEW advisory_rental_days AS
WITH fleet AS (SELECT * FROM advisory_fleet_bounds),
windows AS (
    SELECT
        v.vehicle_id,
        GREATEST(f.report_start_date, v.created_at) AS active_start,
        f.report_end_date AS active_end
    FROM vehicles v CROSS JOIN fleet f
),
clipped AS (
    -- Each booking's interval clipped to [active_start, active_end].
    -- Discard if booking lies entirely outside the window.
    SELECT
        b.vehicle_id,
        tstzrange(
            GREATEST(b.pickup_datetime, w.active_start),
            LEAST (b.return_datetime,  w.active_end),
            '[)'
        ) AS r
    FROM bookings b
    JOIN windows w ON w.vehicle_id = b.vehicle_id
    WHERE b.status IN ('COMPLETED','ACTIVE','CONFIRMED')
      AND b.return_datetime IS NOT NULL
      AND b.pickup_datetime  IS NOT NULL
      AND GREATEST(b.pickup_datetime, w.active_start)
          < LEAST (b.return_datetime, w.active_end)
),
merged AS (
    SELECT vehicle_id, range_agg(r) AS u FROM clipped GROUP BY vehicle_id
),
parts AS (
    -- Expand the multirange into its constituent ranges; sum their lengths.
    SELECT m.vehicle_id,
           SUM(EXTRACT(EPOCH FROM (upper(p.r) - lower(p.r))) / 86400.0) AS rental_days,
           (SELECT COUNT(*) FROM clipped c WHERE c.vehicle_id = m.vehicle_id) AS booking_count
    FROM merged m, LATERAL unnest(m.u) AS p(r)
    GROUP BY m.vehicle_id
)
SELECT
    p.vehicle_id,
    p.rental_days,
    p.booking_count
FROM parts p;


-- ============================================
-- METRIC B: Vehicle Utilization (true ratio, no cap)
-- ============================================
CREATE OR REPLACE VIEW advisory_utilization AS
WITH fleet AS (SELECT * FROM advisory_fleet_bounds),
windows AS (
    SELECT
        v.vehicle_id,
        EXTRACT(EPOCH FROM (f.report_end_date - GREATEST(f.report_start_date, v.created_at))) / 86400.0
            AS observation_window_days
    FROM vehicles v CROSS JOIN fleet f
)
SELECT
    w.vehicle_id,
    rd.rental_days,
    w.observation_window_days,
    CASE
        WHEN w.observation_window_days > 0 AND rd.rental_days IS NOT NULL
        THEN rd.rental_days / w.observation_window_days
        ELSE NULL
    END AS utilization
FROM windows w
LEFT JOIN advisory_rental_days rd ON rd.vehicle_id = w.vehicle_id;


-- ============================================
-- METRIC C: Maintenance Frequency (in-window, true zero allowed)
-- ============================================
CREATE OR REPLACE VIEW advisory_maintenance_frequency AS
WITH fleet AS (SELECT * FROM advisory_fleet_bounds),
windows AS (
    SELECT vehicle_id,
           GREATEST(f.report_start_date, v.created_at) AS active_start,
           f.report_end_date                            AS active_end
    FROM vehicles v CROSS JOIN fleet f
)
SELECT
    m.vehicle_id,
    COUNT(*) AS maintenance_count
FROM maintenance m
JOIN windows w ON w.vehicle_id = m.vehicle_id
WHERE m.start_date IS NOT NULL
  -- in-window: event starts within active period (or ends within it)
  AND m.start_date <  w.active_end
  AND COALESCE(m.end_date::timestamp, w.active_end) > w.active_start
GROUP BY m.vehicle_id;


-- ============================================
-- METRIC D: Maintenance Cost (in-window)
-- ============================================
CREATE OR REPLACE VIEW advisory_maintenance_cost AS
WITH fleet AS (SELECT * FROM advisory_fleet_bounds),
windows AS (
    SELECT vehicle_id,
           GREATEST(f.report_start_date, v.created_at) AS active_start,
           f.report_end_date                            AS active_end
    FROM vehicles v CROSS JOIN fleet f
)
SELECT
    m.vehicle_id,
    COUNT(*) AS maintenance_count,
    -- Evidence-based: NULL when all costs are NULL or no records exist.
    -- SUM() of all-NULL inputs returns NULL, which is exactly what we want.
    SUM(m.cost) AS total_maintenance_cost
FROM maintenance m
JOIN windows w ON w.vehicle_id = m.vehicle_id
WHERE m.start_date IS NOT NULL
  AND m.start_date <  w.active_end
  AND COALESCE(m.end_date::timestamp, w.active_end) > w.active_start
GROUP BY m.vehicle_id;


-- ============================================
-- METRIC E: Maintenance Downtime (in-window, NULL when no evidence)
-- Downtime = sum of (effective_end - start_date) clipped to active window.
-- ============================================
CREATE OR REPLACE VIEW advisory_maintenance_downtime AS
WITH fleet AS (SELECT report_end_date FROM advisory_fleet_bounds),
windows AS (
    SELECT vehicle_id,
           GREATEST(f.report_start_date, v.created_at) AS active_start,
           f.report_end_date                            AS active_end
    FROM vehicles v CROSS JOIN (SELECT * FROM advisory_fleet_bounds) f
),
clipped AS (
    SELECT
        m.vehicle_id,
        GREATEST(m.start_date::timestamp, w.active_start) AS seg_start,
        LEAST(COALESCE(m.end_date::timestamp, w.active_end), w.active_end) AS seg_end
    FROM maintenance m
    JOIN windows w ON w.vehicle_id = m.vehicle_id
    WHERE m.start_date IS NOT NULL
      AND (m.end_date IS NOT NULL OR m.status IN ('IN_PROGRESS','PENDING'))
      AND GREATEST(m.start_date::timestamp, w.active_start)
          < LEAST(COALESCE(m.end_date::timestamp, w.active_end), w.active_end)
)
SELECT
    vehicle_id,
    COUNT(*) AS maintenance_count,
    SUM(EXTRACT(EPOCH FROM (seg_end - seg_start)) / 86400.0) AS maintenance_downtime_days
FROM clipped
GROUP BY vehicle_id;


-- ============================================
-- METRIC F: Vehicle Status Duration (in-window)
-- ============================================
CREATE OR REPLACE VIEW advisory_status_duration AS
WITH fleet AS (SELECT report_end_date FROM advisory_fleet_bounds),
windows AS (
    SELECT vehicle_id,
           GREATEST(f.report_start_date, v.created_at) AS active_start,
           f.report_end_date                            AS active_end
    FROM vehicles v CROSS JOIN (SELECT * FROM advisory_fleet_bounds) f
),
ordered AS (
    SELECT
        vsh.vehicle_id, vsh.status, vsh.changed_at,
        LEAD(vsh.changed_at) OVER (PARTITION BY vsh.vehicle_id ORDER BY vsh.changed_at) AS next_changed_at
    FROM vehicle_status_history vsh
    JOIN windows w ON w.vehicle_id = vsh.vehicle_id
    WHERE vsh.changed_at IS NOT NULL
      AND vsh.changed_at >= w.active_start
      AND vsh.changed_at <  w.active_end
)
SELECT
    vehicle_id, status,
    COUNT(*) AS transition_count,
    COALESCE(SUM(
        EXTRACT(EPOCH FROM (
            COALESCE(next_changed_at, (SELECT report_end_date FROM fleet)) - changed_at
        )) / 86400.0
    ), 0) AS total_duration_days
FROM ordered
GROUP BY vehicle_id, status;


-- ============================================
-- METRIC G: Return -> Inspection (in-window, NULL when no evidence)
-- ============================================
CREATE OR REPLACE VIEW advisory_return_inspection AS
WITH fleet AS (SELECT * FROM advisory_fleet_bounds),
windows AS (
    SELECT vehicle_id,
           GREATEST(f.report_start_date, v.created_at) AS active_start,
           f.report_end_date                            AS active_end
    FROM vehicles v CROSS JOIN fleet f
)
SELECT
    b.vehicle_id,
    COUNT(*) AS return_with_inspection_count,
    AVG(EXTRACT(EPOCH FROM (vi.inspection_date - b.return_datetime)) / 86400.0)
        AS avg_return_inspection_days
FROM bookings b
JOIN vehicle_inspections vi ON vi.booking_id = b.booking_id
JOIN windows w ON w.vehicle_id = b.vehicle_id
WHERE b.return_datetime  IS NOT NULL
  AND vi.inspection_date  IS NOT NULL
  AND b.status IN ('COMPLETED','ACTIVE','CONFIRMED')
  AND b.return_datetime  >= w.active_start
  AND b.return_datetime  <  w.active_end
  AND vi.inspection_date >= w.active_start
  AND vi.inspection_date <  w.active_end
GROUP BY b.vehicle_id;


-- ============================================
-- METRIC H: Return -> Ready (in-window, NULL when no valid READY evidence)
-- ============================================
CREATE OR REPLACE VIEW advisory_return_ready AS
WITH fleet AS (SELECT * FROM advisory_fleet_bounds),
windows AS (
    SELECT vehicle_id,
           GREATEST(f.report_start_date, v.created_at) AS active_start,
           f.report_end_date                            AS active_end
    FROM vehicles v CROSS JOIN fleet f
),
return_events AS (
    SELECT vsh.vehicle_id, vsh.changed_at AS return_ts
    FROM vehicle_status_history vsh
    JOIN windows w ON w.vehicle_id = vsh.vehicle_id
    WHERE vsh.status = 'RETURNED'
      AND vsh.changed_at >= w.active_start
      AND vsh.changed_at <  w.active_end
),
ready_events AS (
    SELECT vsh.vehicle_id, vsh.changed_at AS ready_ts
    FROM vehicle_status_history vsh
    JOIN windows w ON w.vehicle_id = vsh.vehicle_id
    WHERE vsh.status = 'READY'
      AND vsh.changed_at >= w.active_start
      AND vsh.changed_at <  w.active_end
),
paired AS (
    SELECT r.vehicle_id, MIN(rr.ready_ts) AS ready_ts, r.return_ts
    FROM return_events r
    JOIN ready_events rr
      ON rr.vehicle_id = r.vehicle_id
     AND rr.ready_ts > r.return_ts
    GROUP BY r.vehicle_id, r.return_ts
)
SELECT
    vehicle_id,
    COUNT(*) AS return_ready_count,
    AVG(EXTRACT(EPOCH FROM (ready_ts - return_ts)) / 86400.0) AS avg_return_ready_days
FROM paired
GROUP BY vehicle_id;


-- ============================================
-- METRIC I: Inspection Issue Rate (in-window, NULL when no inspections)
-- ============================================
CREATE OR REPLACE VIEW advisory_inspection_issue_rate AS
WITH fleet AS (SELECT * FROM advisory_fleet_bounds),
windows AS (
    SELECT vehicle_id,
           GREATEST(f.report_start_date, v.created_at) AS active_start,
           f.report_end_date                            AS active_end
    FROM vehicles v CROSS JOIN fleet f
)
SELECT
    b.vehicle_id,
    COUNT(*) AS total_inspections,
    COUNT(*) FILTER (WHERE vi.status IN ('MINOR_ISSUE','MAJOR_ISSUE')) AS issue_inspections,
    CASE WHEN COUNT(*) > 0
         THEN COUNT(*) FILTER (WHERE vi.status IN ('MINOR_ISSUE','MAJOR_ISSUE'))::NUMERIC / COUNT(*)
         ELSE NULL END AS issue_rate
FROM bookings b
JOIN vehicle_inspections vi ON vi.booking_id = b.booking_id
JOIN windows w ON w.vehicle_id = b.vehicle_id
WHERE vi.inspection_date >= w.active_start
  AND vi.inspection_date <  w.active_end
GROUP BY b.vehicle_id;


-- ============================================
-- METRIC J: Revenue (in-window; PAID payments linked via bookings)
-- ============================================
CREATE OR REPLACE VIEW advisory_revenue AS
WITH fleet AS (SELECT * FROM advisory_fleet_bounds),
windows AS (
    SELECT vehicle_id,
           GREATEST(f.report_start_date, v.created_at) AS active_start,
           f.report_end_date                            AS active_end
    FROM vehicles v CROSS JOIN fleet f
)
SELECT
    b.vehicle_id,
    COUNT(p.payment_id) AS paid_payment_count,
    SUM(p.amount)       AS paid_revenue
FROM bookings b
JOIN payments p ON p.booking_id = b.booking_id
JOIN windows w ON w.vehicle_id = b.vehicle_id
WHERE p.payment_status = 'PAID'
  AND b.pickup_datetime >= w.active_start
  AND b.pickup_datetime <  w.active_end
GROUP BY b.vehicle_id;


-- ============================================
-- METRIC K: Recurring Maintenance (in-window, >=2 events)
-- ============================================
CREATE OR REPLACE VIEW advisory_recurring_maintenance AS
WITH fleet AS (SELECT * FROM advisory_fleet_bounds),
windows AS (
    SELECT vehicle_id,
           GREATEST(f.report_start_date, v.created_at) AS active_start,
           f.report_end_date                            AS active_end
    FROM vehicles v CROSS JOIN fleet f
)
SELECT
    m.vehicle_id,
    COUNT(*) AS maintenance_count
FROM maintenance m
JOIN windows w ON w.vehicle_id = m.vehicle_id
WHERE m.start_date IS NOT NULL
  AND m.start_date <  w.active_end
  AND COALESCE(m.end_date::timestamp, w.active_end) > w.active_start
GROUP BY m.vehicle_id
HAVING COUNT(*) >= 2;


-- ============================================
-- METRIC L: Recurring Inspection Issues (in-window, >=2 issues)
-- ============================================
CREATE OR REPLACE VIEW advisory_recurring_inspection_issues AS
WITH fleet AS (SELECT * FROM advisory_fleet_bounds),
windows AS (
    SELECT vehicle_id,
           GREATEST(f.report_start_date, v.created_at) AS active_start,
           f.report_end_date                            AS active_end
    FROM vehicles v CROSS JOIN fleet f
)
SELECT
    b.vehicle_id,
    COUNT(*) FILTER (WHERE vi.status IN ('MINOR_ISSUE','MAJOR_ISSUE')) AS issue_inspections
FROM bookings b
JOIN vehicle_inspections vi ON vi.booking_id = b.booking_id
JOIN windows w ON w.vehicle_id = b.vehicle_id
WHERE vi.inspection_date >= w.active_start
  AND vi.inspection_date <  w.active_end
GROUP BY b.vehicle_id
HAVING COUNT(*) FILTER (WHERE vi.status IN ('MINOR_ISSUE','MAJOR_ISSUE')) >= 2;


-- ============================================
-- UNIFIED ADVISORY METRICS VIEW
-- Count metrics (maintenance_frequency, booking_count, total_inspections,
-- issue_inspections, paid_payment_count, return_ready_count,
-- return_with_inspection_count) are COALESCEd to 0 so vehicles without
-- evidence get a true zero. Evidence-based metrics (durations, averages,
-- ratios, costs, revenue) remain NULL when there is no evidence.
-- ============================================
CREATE OR REPLACE VIEW advisory_vehicle_metrics AS
WITH fleet AS (SELECT * FROM advisory_fleet_bounds)
SELECT
    v.vehicle_id,
    v.brand,
    v.model,
    v.type,
    v.status AS vehicle_status,
    EXTRACT(EPOCH FROM (f.report_end_date - GREATEST(f.report_start_date, v.created_at))) / 86400.0
        AS observation_window_days,
    -- COUNT metrics: genuine zero when no evidence exists
    COALESCE(rd.booking_count, 0)            AS booking_count,
    -- evidence-based: NULL when no in-window rental evidence
    rd.rental_days                          AS rental_days,
    u.utilization,
    COALESCE(mf.maintenance_count, 0)       AS maintenance_frequency,
    -- evidence-based: NULL when no maintenance records exist (cost may be 0 only with cost NULL)
    -- evidence-based: NULL when no maintenance records OR when all costs are NULL.
    mc.total_maintenance_cost                AS maintenance_cost,
    md.maintenance_downtime_days,
    COALESCE(ri.return_with_inspection_count, 0) AS return_with_inspection_count,
    ri.avg_return_inspection_days,
    COALESCE(rr.return_ready_count, 0)      AS return_ready_count,
    rr.avg_return_ready_days,
    COALESCE(iir.total_inspections, 0)      AS total_inspections,
    COALESCE(iir.issue_inspections, 0)      AS issue_inspections,
    iir.issue_rate                          AS inspection_issue_rate,
    COALESCE(rv.paid_payment_count, 0)      AS paid_payment_count,
    rv.paid_revenue,
    CASE WHEN rm.vehicle_id IS NOT NULL THEN TRUE ELSE FALSE END AS has_recurring_maintenance,
    CASE WHEN rii.vehicle_id IS NOT NULL THEN TRUE ELSE FALSE END AS has_recurring_inspection_issues
FROM vehicles v
CROSS JOIN fleet f
LEFT JOIN advisory_rental_days              rd  ON rd.vehicle_id  = v.vehicle_id
LEFT JOIN advisory_utilization               u   ON u.vehicle_id   = v.vehicle_id
LEFT JOIN advisory_maintenance_frequency     mf  ON mf.vehicle_id  = v.vehicle_id
LEFT JOIN advisory_maintenance_cost          mc  ON mc.vehicle_id  = v.vehicle_id
LEFT JOIN advisory_maintenance_downtime      md  ON md.vehicle_id  = v.vehicle_id
LEFT JOIN advisory_return_inspection         ri  ON ri.vehicle_id  = v.vehicle_id
LEFT JOIN advisory_return_ready              rr  ON rr.vehicle_id  = v.vehicle_id
LEFT JOIN advisory_inspection_issue_rate     iir ON iir.vehicle_id = v.vehicle_id
LEFT JOIN advisory_revenue                   rv  ON rv.vehicle_id  = v.vehicle_id
LEFT JOIN advisory_recurring_maintenance     rm  ON rm.vehicle_id  = v.vehicle_id
LEFT JOIN advisory_recurring_inspection_issues rii ON rii.vehicle_id = v.vehicle_id;
