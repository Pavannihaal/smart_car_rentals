-- SmartCar Advisory Rules (R1-R10)
-- Based on finalized metric formulas and thresholds
-- Uses advisory_vehicle_metrics view for per-vehicle metrics
-- All CTEs output a canonical 32-column schema so UNION ALL works

-- ============================================
-- FLEET BASELINES (computed once for all rules)
-- What it does:
-- - Calculates continuous 50th percentile (median) benchmarks across the active fleet for 6 key metrics:
--   1) fleet_median_utilization: Median vehicle utilization rate.
--   2) fleet_median_maintenance_downtime: Median maintenance downtime in days.
--   3) fleet_median_maintenance_frequency: Median number of maintenance events.
--   4) fleet_median_return_ready_days: Median turnaround days from returned to ready.
--   5) fleet_median_inspection_issue_rate: Median ratio of inspection issues.
--   6) fleet_median_paid_revenue: Median paid revenue per vehicle.
-- - Filters: Evaluates only vehicles with an active observation window (observation_window_days > 0).
-- - NULL semantics: Excludes NULLs using FILTER clauses so vehicles without evidence do not distort the median.
-- ============================================
WITH fleet_baselines AS (
    SELECT
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY utilization)
            FILTER (WHERE utilization IS NOT NULL) AS fleet_median_utilization,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY maintenance_downtime_days)
            FILTER (WHERE maintenance_downtime_days IS NOT NULL) AS fleet_median_maintenance_downtime,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY maintenance_frequency)
            FILTER (WHERE maintenance_frequency IS NOT NULL) AS fleet_median_maintenance_frequency,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY avg_return_ready_days)
            FILTER (WHERE avg_return_ready_days IS NOT NULL) AS fleet_median_return_ready_days,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY inspection_issue_rate)
            FILTER (WHERE inspection_issue_rate IS NOT NULL) AS fleet_median_inspection_issue_rate,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY paid_revenue)
            FILTER (WHERE paid_revenue IS NOT NULL) AS fleet_median_paid_revenue
    FROM advisory_vehicle_metrics
    WHERE observation_window_days > 0
),

-- ============================================
-- BASELINE POPULATIONS
-- What it does:
-- - Counts the number of vehicles contributing valid (non-null) evidence to each baseline metric.
-- - Provides the total vehicle count within the observation window.
-- - Ensures statistical transparency into baseline sample sizes.
-- ============================================
baseline_populations AS (
    SELECT
        COUNT(*) FILTER (WHERE utilization IS NOT NULL) AS utilization_pop,
        COUNT(*) FILTER (WHERE maintenance_downtime_days IS NOT NULL) AS maintenance_downtime_pop,
        COUNT(*) FILTER (WHERE maintenance_frequency IS NOT NULL) AS maintenance_frequency_pop,
        COUNT(*) FILTER (WHERE avg_return_ready_days IS NOT NULL) AS return_ready_pop,
        COUNT(*) FILTER (WHERE inspection_issue_rate IS NOT NULL) AS inspection_issue_pop,
        COUNT(*) FILTER (WHERE paid_revenue IS NOT NULL) AS revenue_pop,
        COUNT(*) AS total_vehicles
    FROM advisory_vehicle_metrics
    WHERE observation_window_days > 0
),

-- ============================================
-- R1: UNDERUTILIZED
-- What it does:
-- - Identifies vehicles whose utilization is significantly below expected fleet performance.
-- - Trigger condition: Vehicle utilization is less than (fleet median utilization - 10 percentage points).
-- - Severity: REVIEW.
-- - Outputs: Canonical 32 columns including vehicle details, utilization metrics, threshold baselines,
--   contextual observations, recommended business action, and data limitation notes.
-- ============================================
r1_underutilized AS (
    SELECT 
        'UNDERUTILIZED' AS rule_code,
        'R1' AS rule_id,
        'Underutilized Vehicle' AS rule_title,
        'REVIEW' AS severity,
        m.vehicle_id,
        m.brand,
        m.model,
        m.type,
        m.utilization,
        b.fleet_median_utilization,
        b.fleet_median_utilization - 0.10 AS low_utilization_threshold,
        m.maintenance_frequency,
        b.fleet_median_maintenance_frequency,
        m.maintenance_cost,
        m.maintenance_downtime_days,
        b.fleet_median_maintenance_downtime * 1.5 AS high_downtime_threshold,
        m.return_ready_count,
        m.avg_return_ready_days,
        b.fleet_median_return_ready_days * 1.5 AS high_return_ready_threshold,
        m.total_inspections,
        m.issue_inspections,
        m.inspection_issue_rate,
        b.fleet_median_inspection_issue_rate * 1.5 AS high_issue_rate_threshold,
        m.paid_revenue,
        m.booking_count,
        m.rental_days,
        m.return_with_inspection_count,
        m.avg_return_inspection_days,
        m.observation_window_days,
        'Utilization is below fleet median minus 10 percentage points.' AS observation,
        'Review demand, pricing, location and booking patterns.' AS recommended_action,
        CASE
            WHEN m.rental_days IS NULL AND m.booking_count = 0
            THEN 'Data limitation: No in-window booking records found. Utilization is NULL.'
            ELSE NULL
        END AS data_limitation
    FROM advisory_vehicle_metrics m
    CROSS JOIN fleet_baselines b
    WHERE m.utilization < (b.fleet_median_utilization - 0.10)
        AND m.observation_window_days > 0
),


-- ============================================
-- R2: MAINTENANCE_DOWNTIME
-- What it does:
-- - Identifies vehicles with excessive cumulative maintenance downtime during the observation window.
-- - Trigger condition: Total maintenance downtime days > 1.5x fleet median maintenance downtime.
-- - Severity: REVIEW.
-- - Outputs: Canonical 32 columns with downtime thresholds, observations, and recommendations
--   to review recurring repair causes and maintenance scheduling.
-- ============================================
r2_maintenance_downtime AS (
    SELECT 
        'MAINTENANCE_DOWNTIME' AS rule_code,
        'R2' AS rule_id,
        'Excessive Maintenance Downtime' AS rule_title,
        'REVIEW' AS severity,
        m.vehicle_id,
        m.brand,
        m.model,
        m.type,
        NULL::NUMERIC AS utilization,
        NULL::NUMERIC AS fleet_median_utilization,
        NULL::NUMERIC AS low_utilization_threshold,
        m.maintenance_frequency,
        b.fleet_median_maintenance_frequency,
        m.maintenance_cost,
        m.maintenance_downtime_days,
        b.fleet_median_maintenance_downtime * 1.5 AS high_downtime_threshold,
        m.return_ready_count,
        m.avg_return_ready_days,
        b.fleet_median_return_ready_days * 1.5 AS high_return_ready_threshold,
        m.total_inspections,
        m.issue_inspections,
        m.inspection_issue_rate,
        b.fleet_median_inspection_issue_rate * 1.5 AS high_issue_rate_threshold,
        m.paid_revenue,
        m.booking_count,
        m.rental_days,
        m.return_with_inspection_count,
        m.avg_return_inspection_days,
        m.observation_window_days,
        'Maintenance downtime exceeds 1.5x fleet median.' AS observation,
        'Review recurring maintenance causes and scheduling.' AS recommended_action,
        CASE 
            WHEN m.maintenance_downtime_days = 0 
            THEN 'Data limitation: No maintenance records found. Downtime is 0 days.'
            ELSE NULL 
        END AS data_limitation
    FROM advisory_vehicle_metrics m
    CROSS JOIN fleet_baselines b
    WHERE m.maintenance_downtime_days > (b.fleet_median_maintenance_downtime * 1.5)
        AND m.observation_window_days > 0
),


-- ============================================
-- R3: TURNAROUND_BOTTLENECK
-- What it does:
-- - Detects vehicles experiencing prolonged delays transitioning from 'RETURNED' to 'READY' status.
-- - Trigger condition: Average return-to-ready days > 1.5x fleet median turnaround days,
--   with at least 1 recorded return event (return_ready_count > 0).
-- - Severity: REVIEW.
-- - Outputs: Canonical 32 columns advising review of post-trip inspection, detailing, and maintenance handoffs.
-- ============================================
r3_turnaround_bottleneck AS (
    SELECT 
        'TURNAROUND_BOTTLENECK' AS rule_code,
        'R3' AS rule_id,
        'Return-to-Ready Bottleneck' AS rule_title,
        'REVIEW' AS severity,
        m.vehicle_id,
        m.brand,
        m.model,
        m.type,
        NULL::NUMERIC AS utilization,
        NULL::NUMERIC AS fleet_median_utilization,
        NULL::NUMERIC AS low_utilization_threshold,
        m.maintenance_frequency,
        b.fleet_median_maintenance_frequency,
        m.maintenance_cost,
        m.maintenance_downtime_days,
        b.fleet_median_maintenance_downtime * 1.5 AS high_downtime_threshold,
        m.return_ready_count,
        m.avg_return_ready_days,
        b.fleet_median_return_ready_days * 1.5 AS high_return_ready_threshold,
        m.total_inspections,
        m.issue_inspections,
        m.inspection_issue_rate,
        b.fleet_median_inspection_issue_rate * 1.5 AS high_issue_rate_threshold,
        m.paid_revenue,
        m.booking_count,
        m.rental_days,
        m.return_with_inspection_count,
        m.avg_return_inspection_days,
        m.observation_window_days,
        'Return-to-ready duration exceeds 1.5x fleet median.' AS observation,
        'Review inspection, cleaning and maintenance handoffs.' AS recommended_action,
        CASE 
            WHEN m.return_ready_count = 0 
            THEN 'Data limitation: No return-to-ready transitions recorded. Vehicle may lack READY status history.'
            ELSE NULL 
        END AS data_limitation
    FROM advisory_vehicle_metrics m
    CROSS JOIN fleet_baselines b
    WHERE m.avg_return_ready_days > (b.fleet_median_return_ready_days * 1.5)
        AND m.return_ready_count > 0
        AND m.observation_window_days > 0
),


-- ============================================
-- R4: REPEATED_INSPECTION_ISSUES
-- What it does:
-- - Detects vehicles with chronic physical or mechanical issues found during post-rental check-in.
-- - Trigger condition: Inspection issue rate > 1.5x fleet median issue rate AND has at least 2 issue inspections
--   (ensuring the pattern is recurring rather than an isolated incident).
-- - Severity: REVIEW.
-- - Outputs: Canonical 32 columns recommending inspection of recurring wear, body damage, or component failure.
-- ============================================
r4_repeated_inspection_issues AS (
    SELECT 
        'REPEATED_INSPECTION_ISSUES' AS rule_code,
        'R4' AS rule_id,
        'Repeated Inspection Issues' AS rule_title,
        'REVIEW' AS severity,
        m.vehicle_id,
        m.brand,
        m.model,
        m.type,
        NULL::NUMERIC AS utilization,
        NULL::NUMERIC AS fleet_median_utilization,
        NULL::NUMERIC AS low_utilization_threshold,
        m.maintenance_frequency,
        b.fleet_median_maintenance_frequency,
        m.maintenance_cost,
        m.maintenance_downtime_days,
        b.fleet_median_maintenance_downtime * 1.5 AS high_downtime_threshold,
        m.return_ready_count,
        m.avg_return_ready_days,
        b.fleet_median_return_ready_days * 1.5 AS high_return_ready_threshold,
        m.total_inspections,
        m.issue_inspections,
        m.inspection_issue_rate,
        b.fleet_median_inspection_issue_rate * 1.5 AS high_issue_rate_threshold,
        m.paid_revenue,
        m.booking_count,
        m.rental_days,
        m.return_with_inspection_count,
        m.avg_return_inspection_days,
        m.observation_window_days,
        'Inspection issue rate exceeds 1.5x fleet median with at least 2 issue inspections.' AS observation,
        'Review recurring condition/damage and maintenance patterns.' AS recommended_action,
        CASE 
            WHEN m.total_inspections = 0 
            THEN 'Data limitation: No inspection records found.'
            WHEN m.issue_inspections < 2 
            THEN 'Data limitation: Fewer than 2 issue inspections recorded. Pattern not statistically reliable.'
            ELSE NULL 
        END AS data_limitation
    FROM advisory_vehicle_metrics m
    CROSS JOIN fleet_baselines b
    WHERE m.inspection_issue_rate > (b.fleet_median_inspection_issue_rate * 1.5)
        AND m.issue_inspections >= 2
        AND m.observation_window_days > 0
),


-- ============================================
-- R5: HIGH_DEMAND_OPERATIONAL_RISK
-- What it does:
-- - Identifies high-value assets where strong rental demand intersects with high maintenance unreliability.
-- - Trigger condition: Vehicle utilization >= fleet median AND maintenance downtime > 1.5x fleet median downtime.
-- - Severity: HIGH_PRIORITY.
-- - Outputs: Canonical 32 columns alerting management that high-demand vehicles are stuck in service bays,
--   causing direct revenue loss and customer fulfillment risk.
-- ============================================
r5_high_demand_operational_risk AS (
    SELECT 
        'HIGH_DEMAND_OPERATIONAL_RISK' AS rule_code,
        'R5' AS rule_id,
        'High Demand + High Downtime Risk' AS rule_title,
        'HIGH_PRIORITY' AS severity,
        m.vehicle_id,
        m.brand,
        m.model,
        m.type,
        m.utilization,
        b.fleet_median_utilization,
        b.fleet_median_utilization - 0.10 AS low_utilization_threshold,
        m.maintenance_frequency,
        b.fleet_median_maintenance_frequency,
        m.maintenance_cost,
        m.maintenance_downtime_days,
        b.fleet_median_maintenance_downtime * 1.5 AS high_downtime_threshold,
        m.return_ready_count,
        m.avg_return_ready_days,
        b.fleet_median_return_ready_days * 1.5 AS high_return_ready_threshold,
        m.total_inspections,
        m.issue_inspections,
        m.inspection_issue_rate,
        b.fleet_median_inspection_issue_rate * 1.5 AS high_issue_rate_threshold,
        m.paid_revenue,
        m.booking_count,
        m.rental_days,
        m.return_with_inspection_count,
        m.avg_return_inspection_days,
        m.observation_window_days,
        'High utilization combined with excessive maintenance downtime.' AS observation,
        'Investigate downtime because unavailable periods affect a highly demanded vehicle.' AS recommended_action,
        'Inherits limitations of utilization and downtime metrics.' AS data_limitation
    FROM advisory_vehicle_metrics m
    CROSS JOIN fleet_baselines b
    WHERE m.utilization >= b.fleet_median_utilization
        AND m.maintenance_downtime_days > (b.fleet_median_maintenance_downtime * 1.5)
        AND m.observation_window_days > 0
),


-- ============================================
-- R6: DEMAND_SIDE_UNDERUTILIZATION
-- What it does:
-- - Differentiates commercial/marketing underperformance from mechanical/maintenance unavailability.
-- - Trigger condition: Low utilization (< fleet median - 10%) BUT acceptable downtime (<= 1.5x fleet median).
-- - Severity: INFO.
-- - Outputs: Canonical 32 columns signaling that the vehicle is mechanically sound and available,
--   so underutilization is driven by commercial factors (pricing, location, marketing, or vehicle appeal).
-- ============================================
r6_demand_side_underutilization AS (
    SELECT 
        'DEMAND_SIDE_UNDERUTILIZATION' AS rule_code,
        'R6' AS rule_id,
        'Demand-Side Underutilization' AS rule_title,
        'INFO' AS severity,
        m.vehicle_id,
        m.brand,
        m.model,
        m.type,
        m.utilization,
        b.fleet_median_utilization,
        b.fleet_median_utilization - 0.10 AS low_utilization_threshold,
        m.maintenance_frequency,
        b.fleet_median_maintenance_frequency,
        m.maintenance_cost,
        m.maintenance_downtime_days,
        b.fleet_median_maintenance_downtime * 1.5 AS high_downtime_threshold,
        m.return_ready_count,
        m.avg_return_ready_days,
        b.fleet_median_return_ready_days * 1.5 AS high_return_ready_threshold,
        m.total_inspections,
        m.issue_inspections,
        m.inspection_issue_rate,
        b.fleet_median_inspection_issue_rate * 1.5 AS high_issue_rate_threshold,
        m.paid_revenue,
        m.booking_count,
        m.rental_days,
        m.return_with_inspection_count,
        m.avg_return_inspection_days,
        m.observation_window_days,
        'Low utilization with acceptable maintenance downtime.' AS observation,
        'Review pricing, location and demand.' AS recommended_action,
        'Inherits limitations of utilization and downtime metrics.' AS data_limitation
    FROM advisory_vehicle_metrics m
    CROSS JOIN fleet_baselines b
    WHERE m.utilization < (b.fleet_median_utilization - 0.10)
        AND m.maintenance_downtime_days <= (b.fleet_median_maintenance_downtime * 1.5)
        AND m.observation_window_days > 0
),


-- ============================================
-- R7: OPERATIONAL_UNDERPERFORMANCE
-- What it does:
-- - Flags severely underperforming assets suffering from both poor utilization and excessive downtime.
-- - Trigger condition: Vehicle utilization < fleet median - 10% AND maintenance downtime > 1.5x fleet median.
-- - Severity: HIGH_PRIORITY.
-- - Outputs: Canonical 32 columns instructing operators to resolve mechanical downtime bottlenecks first
--   before reallocating fleet or adjusting pricing.
-- ============================================
r7_operational_underperformance AS (
    SELECT 
        'OPERATIONAL_UNDERPERFORMANCE' AS rule_code,
        'R7' AS rule_id,
        'Operational Underperformance' AS rule_title,
        'HIGH_PRIORITY' AS severity,
        m.vehicle_id,
        m.brand,
        m.model,
        m.type,
        m.utilization,
        b.fleet_median_utilization,
        b.fleet_median_utilization - 0.10 AS low_utilization_threshold,
        m.maintenance_frequency,
        b.fleet_median_maintenance_frequency,
        m.maintenance_cost,
        m.maintenance_downtime_days,
        b.fleet_median_maintenance_downtime * 1.5 AS high_downtime_threshold,
        m.return_ready_count,
        m.avg_return_ready_days,
        b.fleet_median_return_ready_days * 1.5 AS high_return_ready_threshold,
        m.total_inspections,
        m.issue_inspections,
        m.inspection_issue_rate,
        b.fleet_median_inspection_issue_rate * 1.5 AS high_issue_rate_threshold,
        m.paid_revenue,
        m.booking_count,
        m.rental_days,
        m.return_with_inspection_count,
        m.avg_return_inspection_days,
        m.observation_window_days,
        'Low utilization combined with excessive maintenance downtime.' AS observation,
        'Investigate operational downtime before changing fleet allocation.' AS recommended_action,
        'Inherits limitations of utilization and downtime metrics.' AS data_limitation
    FROM advisory_vehicle_metrics m
    CROSS JOIN fleet_baselines b
    WHERE m.utilization < (b.fleet_median_utilization - 0.10)
        AND m.maintenance_downtime_days > (b.fleet_median_maintenance_downtime * 1.5)
        AND m.observation_window_days > 0
),


-- ============================================
-- R8: HEALTHY_PERFORMER
-- What it does:
-- - Identifies top-performing, reliable fleet vehicles operating at healthy utilization with low downtime.
-- - Trigger condition: Vehicle utilization >= fleet median AND maintenance downtime <= 1.5x fleet median.
-- - Severity: INFO.
-- - Outputs: Canonical 32 columns highlighting healthy operational performance to serve as fleet benchmarks.
-- ============================================
r8_healthy_performer AS (
    SELECT 
        'HEALTHY_PERFORMER' AS rule_code,
        'R8' AS rule_id,
        'Healthy Performer' AS rule_title,
        'INFO' AS severity,
        m.vehicle_id,
        m.brand,
        m.model,
        m.type,
        m.utilization,
        b.fleet_median_utilization,
        b.fleet_median_utilization - 0.10 AS low_utilization_threshold,
        m.maintenance_frequency,
        b.fleet_median_maintenance_frequency,
        m.maintenance_cost,
        m.maintenance_downtime_days,
        b.fleet_median_maintenance_downtime * 1.5 AS high_downtime_threshold,
        m.return_ready_count,
        m.avg_return_ready_days,
        b.fleet_median_return_ready_days * 1.5 AS high_return_ready_threshold,
        m.total_inspections,
        m.issue_inspections,
        m.inspection_issue_rate,
        b.fleet_median_inspection_issue_rate * 1.5 AS high_issue_rate_threshold,
        m.paid_revenue,
        m.booking_count,
        m.rental_days,
        m.return_with_inspection_count,
        m.avg_return_inspection_days,
        m.observation_window_days,
        'High utilization with acceptable maintenance downtime.' AS observation,
        'Maintain availability and monitor demand.' AS recommended_action,
        'Inherits limitations of utilization and downtime metrics.' AS data_limitation
    FROM advisory_vehicle_metrics m
    CROSS JOIN fleet_baselines b
    WHERE m.utilization >= b.fleet_median_utilization
        AND m.maintenance_downtime_days <= (b.fleet_median_maintenance_downtime * 1.5)
        AND m.observation_window_days > 0
),


-- ============================================
-- R9: RECURRING_MAINTENANCE
-- What it does:
-- - Identifies vehicles frequently taken out of service for repeated maintenance visits.
-- - Trigger condition: Maintenance frequency >= 2 events AND maintenance frequency > fleet median frequency.
-- - Severity: REVIEW.
-- - Outputs: Canonical 32 columns recommending detailed review of maintenance history to detect repeat failures.
-- ============================================
r9_recurring_maintenance AS (
    SELECT 
        'RECURRING_MAINTENANCE' AS rule_code,
        'R9' AS rule_id,
        'Recurring Maintenance Events' AS rule_title,
        'REVIEW' AS severity,
        m.vehicle_id,
        m.brand,
        m.model,
        m.type,
        NULL::NUMERIC AS utilization,
        NULL::NUMERIC AS fleet_median_utilization,
        NULL::NUMERIC AS low_utilization_threshold,
        m.maintenance_frequency,
        b.fleet_median_maintenance_frequency,
        m.maintenance_cost,
        m.maintenance_downtime_days,
        b.fleet_median_maintenance_downtime * 1.5 AS high_downtime_threshold,
        m.return_ready_count,
        m.avg_return_ready_days,
        b.fleet_median_return_ready_days * 1.5 AS high_return_ready_threshold,
        m.total_inspections,
        m.issue_inspections,
        m.inspection_issue_rate,
        b.fleet_median_inspection_issue_rate * 1.5 AS high_issue_rate_threshold,
        m.paid_revenue,
        m.booking_count,
        m.rental_days,
        m.return_with_inspection_count,
        m.avg_return_inspection_days,
        m.observation_window_days,
        'Vehicle has repeated maintenance events above fleet median frequency.' AS observation,
        'Review recurring maintenance history.' AS recommended_action,
        'Does not analyze whether events are for the same underlying problem.' AS data_limitation
    FROM advisory_vehicle_metrics m
    CROSS JOIN fleet_baselines b
    WHERE m.maintenance_frequency >= 2
        AND m.maintenance_frequency > b.fleet_median_maintenance_frequency
        AND m.observation_window_days > 0
),


-- ============================================
-- R10: FLEET_EXPANSION_REVIEW
-- What it does:
-- - Category-level strategic decision-support query evaluating potential vehicle class expansion.
-- - Sub-CTE 'cat_aggs': Aggregates metrics by vehicle type (category), computing category-level averages
--   for utilization, maintenance frequency, and downtime days, plus vehicle count in each category.
-- - Trigger condition: Category vehicle count >= 2, average utilization >= fleet median, and average
--   maintenance downtime <= 1.5x fleet median downtime.
-- - Severity: INFO.
-- - Outputs: Canonical 32 columns (with vehicle-specific fields set to NULL) signaling high-performing
--   vehicle categories that may warrant fleet capacity expansion if market conditions support it.
-- ============================================
r10_fleet_expansion_review AS (
    WITH cat_aggs AS (
        SELECT
            v.type,
            AVG(m.utilization) AS avg_utilization,
            AVG(m.maintenance_frequency) AS avg_maintenance_frequency,
            AVG(m.maintenance_downtime_days) AS avg_maintenance_downtime_days,
            COUNT(*) AS vehicle_count
        FROM advisory_vehicle_metrics m
        INNER JOIN vehicles v ON m.vehicle_id = v.vehicle_id
        WHERE m.observation_window_days > 0
        GROUP BY v.type
    )
    SELECT
        'FLEET_EXPANSION_REVIEW' AS rule_code,
        'R10' AS rule_id,
        'Fleet Expansion Review' AS rule_title,
        'INFO' AS severity,
        NULL::INT AS vehicle_id,
        NULL::VARCHAR AS brand,
        NULL::VARCHAR AS model,
        c.type,
        c.avg_utilization AS utilization,
        b.fleet_median_utilization,
        b.fleet_median_utilization - 0.10 AS low_utilization_threshold,
        c.avg_maintenance_frequency AS maintenance_frequency,
        b.fleet_median_maintenance_frequency,
        NULL::NUMERIC AS maintenance_cost,
        c.avg_maintenance_downtime_days AS maintenance_downtime_days,
        b.fleet_median_maintenance_downtime * 1.5 AS high_downtime_threshold,
        NULL::INT AS return_ready_count,
        NULL::NUMERIC AS avg_return_ready_days,
        b.fleet_median_return_ready_days * 1.5 AS high_return_ready_threshold,
        NULL::INT AS total_inspections,
        NULL::INT AS issue_inspections,
        NULL::NUMERIC AS inspection_issue_rate,
        b.fleet_median_inspection_issue_rate * 1.5 AS high_issue_rate_threshold,
        NULL::NUMERIC AS paid_revenue,
        NULL::INT AS booking_count,
        NULL::NUMERIC AS rental_days,
        NULL::INT AS return_with_inspection_count,
        NULL::NUMERIC AS avg_return_inspection_days,
        NULL::NUMERIC AS observation_window_days,
        'Category demonstrates strong recorded utilization and acceptable recorded downtime.' AS observation,
        'Consider evaluating additional capacity only if external demand, financial feasibility, and business strategy also support expansion. This is a decision-support signal, not a business directive.' AS recommended_action,
        'Category-level metric inherits limitations of underlying vehicle-level metrics. High recorded utilization does not prove unmet customer demand.' AS data_limitation
    FROM cat_aggs c
    CROSS JOIN fleet_baselines b
    WHERE c.vehicle_count >= 2
      AND c.avg_utilization >= b.fleet_median_utilization
      AND c.avg_maintenance_downtime_days <= (b.fleet_median_maintenance_downtime * 1.5)
)


-- ============================================
-- UNIFIED ADVISORY RECOMMENDATIONS OUTPUT
-- What it does:
-- - Consolidates all 10 rule CTEs (R1 through R10) into a single unified result set using UNION ALL.
-- - Since every CTE outputs an identical 32-column canonical schema with matching data types,
--   UNION ALL stacks the findings into a cohesive reporting table.
-- - Sorting: Prioritizes recommendations by severity (1: HIGH_PRIORITY, 2: REVIEW, 3: INFO),
--   then by rule_code alphabetically, and finally by vehicle_id.
-- ============================================
SELECT * FROM (
    SELECT * FROM r1_underutilized
    UNION ALL
    SELECT * FROM r2_maintenance_downtime
    UNION ALL
    SELECT * FROM r3_turnaround_bottleneck
    UNION ALL
    SELECT * FROM r4_repeated_inspection_issues
    UNION ALL
    SELECT * FROM r5_high_demand_operational_risk
    UNION ALL
    SELECT * FROM r6_demand_side_underutilization
    UNION ALL
    SELECT * FROM r7_operational_underperformance
    UNION ALL
    SELECT * FROM r8_healthy_performer
    UNION ALL
    SELECT * FROM r9_recurring_maintenance
    UNION ALL
    SELECT * FROM r10_fleet_expansion_review
) combined
ORDER BY 
    CASE severity 
        WHEN 'HIGH_PRIORITY' THEN 1 
        WHEN 'REVIEW' THEN 2 
        WHEN 'INFO' THEN 3 
    END,
    rule_code,
    vehicle_id;
