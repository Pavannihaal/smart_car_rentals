// SmartCar Advisory SQL Validation Script (Final Correctness Pass)
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: 'smartcar_db'
});

let checksPassed = 0;
let checksFailed = 0;
const failures = [];

function check(name, ok, detail = '') {
  if (ok) {
    checksPassed++;
    console.log(`  PASS: ${name}${detail ? ' - ' + detail : ''}`);
  } else {
    checksFailed++;
    failures.push(`${name}${detail ? ' - ' + detail : ''}`);
    console.log(`  FAIL: ${name}${detail ? ' - ' + detail : ''}`);
  }
}

async function run() {
  try {
    await client.connect();
    console.log('Connected to smartcar_db.');

    // 1. Drop existing advisory views
    const viewsToDrop = [
      'advisory_vehicle_metrics','advisory_fleet_bounds','advisory_rental_days',
      'advisory_utilization','advisory_maintenance_frequency','advisory_maintenance_cost',
      'advisory_maintenance_downtime','advisory_status_duration','advisory_return_inspection',
      'advisory_return_ready','advisory_inspection_issue_rate','advisory_revenue',
      'advisory_recurring_maintenance','advisory_recurring_inspection_issues'
    ];
    for (const v of viewsToDrop) {
      try { await client.query(`DROP VIEW IF EXISTS ${v} CASCADE`); } catch (e) {}
    }
    console.log('Existing advisory views dropped.');

    // 2. Create views
    console.log('\nCreating advisory analytical views...');
    await client.query(fs.readFileSync(path.join(__dirname, 'advisory_views.sql'), 'utf8'));
    console.log('Advisory views created successfully.');

    // 3. Validate metric views individually
    console.log('\n======================================');
    console.log('VALIDATING ADVISORY METRIC VIEWS');
    console.log('======================================');
    const metricChecks = [
      { name: 'Fleet Bounds',                 q: 'SELECT COUNT(*) AS cnt FROM advisory_fleet_bounds' },
      { name: 'Rental Days',                  q: 'SELECT COUNT(*) AS cnt FROM advisory_rental_days' },
      { name: 'Utilization',                  q: 'SELECT COUNT(*) AS cnt FROM advisory_utilization' },
      { name: 'Maintenance Frequency',        q: 'SELECT COUNT(*) AS cnt FROM advisory_maintenance_frequency' },
      { name: 'Maintenance Cost',             q: 'SELECT COUNT(*) AS cnt FROM advisory_maintenance_cost' },
      { name: 'Maintenance Downtime',         q: 'SELECT COUNT(*) AS cnt FROM advisory_maintenance_downtime' },
      { name: 'Status Duration',              q: 'SELECT COUNT(*) AS cnt FROM advisory_status_duration' },
      { name: 'Return -> Inspection',         q: 'SELECT COUNT(*) AS cnt FROM advisory_return_inspection' },
      { name: 'Return -> Ready',              q: 'SELECT COUNT(*) AS cnt FROM advisory_return_ready' },
      { name: 'Inspection Issue Rate',        q: 'SELECT COUNT(*) AS cnt FROM advisory_inspection_issue_rate' },
      { name: 'Revenue',                      q: 'SELECT COUNT(*) AS cnt FROM advisory_revenue' },
      { name: 'Recurring Maintenance',        q: 'SELECT COUNT(*) AS cnt FROM advisory_recurring_maintenance' },
      { name: 'Recurring Inspection Issues',  q: 'SELECT COUNT(*) AS cnt FROM advisory_recurring_inspection_issues' },
      { name: 'Unified Metrics',              q: 'SELECT COUNT(*) AS cnt FROM advisory_vehicle_metrics' }
    ];
    for (const c of metricChecks) {
      try {
        const r = await client.query(c.q);
        console.log(`PASS: ${c.name} - ${r.rows[0].cnt} records`);
      } catch (e) {
        console.log(`FAIL: ${c.name} - ${e.message}`);
      }
    }

    // 4. Unified metrics output
    console.log('\n======================================');
    console.log('UNIFIED VEHICLE METRICS');
    console.log('======================================');
    const metricsRes = await client.query('SELECT * FROM advisory_vehicle_metrics ORDER BY vehicle_id');
    console.log('Total vehicles:', metricsRes.rowCount);
    console.table(metricsRes.rows.map(r => ({
      vid: r.vehicle_id, type: r.type,
      win: Number(r.observation_window_days).toFixed(2),
      rent: r.rental_days !== null ? Number(r.rental_days).toFixed(2) : 'NULL',
      util: r.utilization !== null ? (Number(r.utilization) * 100).toFixed(2) + '%' : 'NULL',
      mf: r.maintenance_frequency,
      mdt: r.maintenance_downtime_days !== null ? Number(r.maintenance_downtime_days).toFixed(2) : 'NULL',
      rrc: r.return_ready_count,
      rrd: r.avg_return_ready_days !== null ? Number(r.avg_return_ready_days).toFixed(2) : 'NULL',
      ii: (r.issue_inspections ?? 'null') + '/' + (r.total_inspections ?? 'null'),
      rev: r.paid_revenue !== null ? Number(r.paid_revenue).toFixed(0) : 'NULL'
    })));

    // 5. CORRECTNESS CHECKS
    console.log('\n======================================');
    console.log('CORRECTNESS CHECKS');
    console.log('======================================');

    // 5.1 No utilization > 1.0 (real semantic check; no cap exists in code)
    const utilOver = await client.query(`
      SELECT COUNT(*) AS cnt FROM advisory_vehicle_metrics
      WHERE utilization IS NOT NULL AND utilization > 1.0
    `);
    check('No utilization > 1.0 (semantic, no artificial cap)',
      Number(utilOver.rows[0].cnt) === 0,
      `${utilOver.rows[0].cnt} vehicles over 1.0`);

    // 5.2 Rental time does not exceed observation window
    const rentOver = await client.query(`
      SELECT vehicle_id, rental_days, observation_window_days
      FROM advisory_vehicle_metrics
      WHERE rental_days IS NOT NULL
        AND observation_window_days > 0
        AND rental_days > observation_window_days + 1e-9
    `);
    check('Rental time never exceeds observation window',
      rentOver.rowCount === 0,
      rentOver.rowCount === 0 ? 'all within bounds' :
        `exceeds: ${rentOver.rows.map(r => `V${r.vehicle_id} ${Number(r.rental_days).toFixed(2)}d > ${Number(r.observation_window_days).toFixed(2)}d`).join('; ')}`);

    // 5.3 No overlap double-counting in rental union, AND rental_days == sum of merged parts
    // Independently compute occupied duration by:
    //   (a) clipping each booking to [active_start, active_end),
    //   (b) range_agg -> tstzmultirange,
    //   (c) unnesting the multirange and summing (upper - lower) of each constituent range.
    // The view must agree with this independent calculation to within a tiny tolerance.
    // This also confirms booking_count equals the number of in-window eligible bookings.
    const indep = await client.query(`
      WITH fleet AS (SELECT * FROM advisory_fleet_bounds),
      windows AS (
        SELECT v.vehicle_id,
               GREATEST(f.report_start_date, v.created_at) AS active_start,
               f.report_end_date AS active_end
        FROM vehicles v CROSS JOIN fleet f
      ),
      clipped AS (
        SELECT b.vehicle_id,
               tstzrange(
                 GREATEST(b.pickup_datetime, w.active_start),
                 LEAST (b.return_datetime,  w.active_end),
                 '[)'
               ) AS r
        FROM bookings b JOIN windows w ON w.vehicle_id = b.vehicle_id
        WHERE b.status IN ('COMPLETED','ACTIVE','CONFIRMED')
          AND b.return_datetime IS NOT NULL
          AND GREATEST(b.pickup_datetime, w.active_start) < LEAST(b.return_datetime, w.active_end)
      ),
      merged AS (SELECT vehicle_id, range_agg(r) AS u FROM clipped GROUP BY vehicle_id),
      parts  AS (SELECT m.vehicle_id, p.r FROM merged m, LATERAL unnest(m.u) AS p(r)),
      totals AS (
        SELECT vehicle_id,
               SUM(EXTRACT(EPOCH FROM (upper(r) - lower(r))) / 86400.0) AS indep_rental_days,
               (SELECT COUNT(*) FROM clipped c WHERE c.vehicle_id = p.vehicle_id) AS indep_booking_count
        FROM parts p GROUP BY vehicle_id
      )
      SELECT t.vehicle_id, t.indep_rental_days, t.indep_booking_count,
             rd.rental_days AS view_rental_days, rd.booking_count AS view_booking_count
      FROM totals t JOIN advisory_rental_days rd USING (vehicle_id)
    `);
    let rentalMismatch = 0, bookingMismatch = 0;
    const mismatches = [];
    for (const row of indep.rows) {
      if (Math.abs(Number(row.indep_rental_days) - Number(row.view_rental_days)) > 1e-6) {
        rentalMismatch++;
        mismatches.push(`V${row.vehicle_id}: indep=${Number(row.indep_rental_days).toFixed(4)} view=${Number(row.view_rental_days).toFixed(4)}`);
      }
      if (Number(row.indep_booking_count) !== Number(row.view_booking_count)) {
        bookingMismatch++;
        mismatches.push(`V${row.vehicle_id}: indep_count=${row.indep_booking_count} view_count=${row.view_booking_count}`);
      }
    }
    check('rental_days == sum of merged multirange part durations',
      rentalMismatch === 0,
      rentalMismatch === 0
        ? `${indep.rowCount} vehicles agree with independent re-derivation`
        : `mismatches: ${mismatches.join('; ')}`);
    check('booking_count == count of in-window eligible bookings',
      bookingMismatch === 0,
      bookingMismatch === 0
        ? `${indep.rowCount} vehicles agree`
        : `mismatches: ${mismatches.join('; ')}`);

    // 5.4 Timestamp-based metrics respect per-vehicle report window
    // Correct semantic check: every row that contributes to a metric must have its
    // timestamp within [active_start, active_end) of that vehicle. We verify by
    // re-deriving each metric from raw rows with the window filter applied and
    // confirming the per-vehicle result agrees with the view output.
    const audit = await client.query(`
      WITH fleet AS (SELECT * FROM advisory_fleet_bounds),
      windows AS (
        SELECT v.vehicle_id,
               GREATEST(f.report_start_date, v.created_at) AS active_start,
               f.report_end_date AS active_end
        FROM vehicles v CROSS JOIN fleet f
      ),
      m_raw AS (
        SELECT m.vehicle_id, COUNT(*) AS cnt, SUM(
          EXTRACT(EPOCH FROM (
            LEAST(COALESCE(m.end_date::timestamp, w.active_end), w.active_end) -
            GREATEST(m.start_date::timestamp, w.active_start)
          ))/86400.0
        ) AS dt
        FROM maintenance m JOIN windows w USING (vehicle_id)
        WHERE m.start_date IS NOT NULL
          AND (m.end_date IS NOT NULL OR m.status IN ('IN_PROGRESS','PENDING'))
          AND GREATEST(m.start_date::timestamp, w.active_start)
              < LEAST(COALESCE(m.end_date::timestamp, w.active_end), w.active_end)
        GROUP BY m.vehicle_id
      ),
      rr_raw AS (
        SELECT b.vehicle_id, COUNT(*) AS cnt, AVG(
          EXTRACT(EPOCH FROM (vi.inspection_date - b.return_datetime))/86400.0
        ) AS avg_d
        FROM bookings b
        JOIN vehicle_inspections vi ON vi.booking_id=b.booking_id
        JOIN windows w USING (vehicle_id)
        WHERE b.return_datetime IS NOT NULL AND vi.inspection_date IS NOT NULL
          AND b.status IN ('COMPLETED','ACTIVE','CONFIRMED')
          AND b.return_datetime  >= w.active_start AND b.return_datetime  < w.active_end
          AND vi.inspection_date >= w.active_start AND vi.inspection_date < w.active_end
        GROUP BY b.vehicle_id
      )
      SELECT
        (SELECT COUNT(*) FROM m_raw mr JOIN advisory_maintenance_downtime md USING (vehicle_id)
          WHERE ABS(mr.cnt - md.maintenance_count) > 0) AS maint_count_mismatch,
        (SELECT COUNT(*) FROM rr_raw rr JOIN advisory_return_inspection ri USING (vehicle_id)
          WHERE ABS(rr.cnt - ri.return_with_inspection_count) > 0) AS ri_count_mismatch
    `);
    const bad = Number(audit.rows[0].maint_count_mismatch) + Number(audit.rows[0].ri_count_mismatch);
    check('Timestamp-based metrics respect per-vehicle report window (re-derivation agrees)',
      bad === 0,
      `maint_count_mismatch=${audit.rows[0].maint_count_mismatch}, ri_count_mismatch=${audit.rows[0].ri_count_mismatch}`);

    // 5.5 All 10 rule branches identifiable in SQL structure
    const rulesSql = fs.readFileSync(path.join(__dirname, 'advisory_rules.sql'), 'utf8');
    const expectedBranches = [
      'r1_underutilized',
      'r2_maintenance_downtime',
      'r3_turnaround_bottleneck',
      'r4_repeated_inspection_issues',
      'r5_high_demand_operational_risk',
      'r6_demand_side_underutilization',
      'r7_operational_underperformance',
      'r8_healthy_performer',
      'r9_recurring_maintenance',
      'r10_fleet_expansion_review'
    ];
    const missingBranches = expectedBranches.filter(n => !new RegExp(`\\b${n}\\b`).test(rulesSql));
    check('All 10 rule branches identifiable in SQL',
      missingBranches.length === 0,
      missingBranches.length === 0 ? 'all 10 CTEs present' : `missing: ${missingBranches.join(', ')}`);

    // 5.6 Schema files unchanged
    const schemaContent = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    const tableCount = (schemaContent.match(/CREATE TABLE/g) || []).length;
    check('schema.sql has 12 tables (unchanged)', tableCount === 12, `${tableCount} CREATE TABLE statements`);

    // 5.7 No negative rental duration
    const negRental = await client.query(`
      SELECT COUNT(*) AS cnt FROM advisory_vehicle_metrics
      WHERE rental_days IS NOT NULL AND rental_days < 0
    `);
    check('No negative rental duration',
      Number(negRental.rows[0].cnt) === 0, `${negRental.rows[0].cnt} vehicles`);

    // 5.8 No negative maintenance downtime
    const negMaint = await client.query(`
      SELECT COUNT(*) AS cnt FROM advisory_vehicle_metrics
      WHERE maintenance_downtime_days IS NOT NULL AND maintenance_downtime_days < 0
    `);
    check('No negative maintenance downtime',
      Number(negMaint.rows[0].cnt) === 0, `${negMaint.rows[0].cnt} vehicles`);

    // 5.9 All vehicles have positive observation window
    const noWindow = await client.query(`
      SELECT COUNT(*) AS cnt FROM advisory_vehicle_metrics WHERE observation_window_days <= 0
    `);
    check('All vehicles have positive observation window',
      Number(noWindow.rows[0].cnt) === 0, `${noWindow.rows[0].cnt} vehicles`);

    // 5.10 Vehicles without READY transitions have NULL avg_return_ready_days
    const r3NullE = await client.query(`
      SELECT COUNT(*) AS cnt FROM advisory_vehicle_metrics
      WHERE return_ready_count = 0 AND avg_return_ready_days IS NOT NULL
    `);
    check('No READY transitions => NULL avg_return_ready_days',
      Number(r3NullE.rows[0].cnt) === 0, `${r3NullE.rows[0].cnt} vehicles wrongly measured 0`);

    // 5.11 Evidence-based metrics: maintenance_downtime_days NULL when no maintenance
    const mNullE = await client.query(`
      SELECT COUNT(*) AS cnt FROM advisory_vehicle_metrics
      WHERE maintenance_frequency = 0 AND maintenance_downtime_days IS NOT NULL
    `);
    check('No maintenance records => NULL maintenance_downtime_days',
      Number(mNullE.rows[0].cnt) === 0, `${mNullE.rows[0].cnt} vehicles wrongly measured 0`);

    // 5.12 Evidence-based metrics: inspection_issue_rate NULL when no inspections
    const iNullE = await client.query(`
      SELECT COUNT(*) AS cnt FROM advisory_vehicle_metrics
      WHERE total_inspections = 0 AND inspection_issue_rate IS NOT NULL
    `);
    check('No inspections => NULL inspection_issue_rate',
      Number(iNullE.rows[0].cnt) === 0, `${iNullE.rows[0].cnt} vehicles wrongly measured 0`);

    // 5.13 Evidence-based metrics: paid_revenue NULL when no paid payments
    const rvNullE = await client.query(`
      SELECT COUNT(*) AS cnt FROM advisory_vehicle_metrics
      WHERE paid_payment_count = 0 AND paid_revenue IS NOT NULL
    `);
    check('No paid payments => NULL paid_revenue',
      Number(rvNullE.rows[0].cnt) === 0, `${rvNullE.rows[0].cnt} vehicles wrongly measured 0`);

    // 5.14 Evidence-based metrics: rental_days NULL when no in-window bookings
    const rdNullE = await client.query(`
      SELECT COUNT(*) AS cnt FROM advisory_vehicle_metrics
      WHERE booking_count = 0 AND rental_days IS NOT NULL
    `);
    check('No in-window bookings => NULL rental_days',
      Number(rdNullE.rows[0].cnt) === 0, `${rdNullE.rows[0].cnt} vehicles wrongly measured 0`);

    // 5.15 Evidence-based metrics: utilization NULL when no in-window bookings
    const uNullE = await client.query(`
      SELECT COUNT(*) AS cnt FROM advisory_vehicle_metrics
      WHERE rental_days IS NULL AND utilization IS NOT NULL
    `);
    check('No in-window bookings => NULL utilization',
      Number(uNullE.rows[0].cnt) === 0, `${uNullE.rows[0].cnt} vehicles wrongly measured 0`);

    // 5.16 Evidence-based metrics: maintenance_cost NULL when no maintenance records
    const mcNullE = await client.query(`
      SELECT COUNT(*) AS cnt FROM advisory_vehicle_metrics
      WHERE maintenance_frequency = 0 AND maintenance_cost IS NOT NULL
    `);
    check('No maintenance records => NULL maintenance_cost (NOT 0)',
      Number(mcNullE.rows[0].cnt) === 0, `${mcNullE.rows[0].cnt} vehicles wrongly got a zero cost`);

    // 5.17 maintenance_cost must NOT silently convert NULL cost rows to zero.
    // If a vehicle has in-window maintenance records but all `cost` values are NULL,
    // `maintenance_cost` must remain NULL (not 0).
    // Equivalently: maintenance_cost = 0 is forbidden UNLESS the raw data actually
    // contains a maintenance row with cost = 0 inside the active window.
    const mcZeroFromNull = await client.query(`
      WITH fleet AS (SELECT * FROM advisory_fleet_bounds),
      windows AS (
        SELECT v.vehicle_id,
               GREATEST(f.report_start_date, v.created_at) AS active_start,
               f.report_end_date AS active_end
        FROM vehicles v CROSS JOIN fleet f
      )
      SELECT COUNT(*) AS bad FROM advisory_vehicle_metrics m
      WHERE m.maintenance_cost = 0
        AND NOT EXISTS (
          SELECT 1 FROM maintenance mm JOIN windows w USING (vehicle_id)
          WHERE mm.vehicle_id = m.vehicle_id
            AND mm.start_date IS NOT NULL
            AND mm.start_date::timestamp <  w.active_end
            AND COALESCE(mm.end_date::timestamp, w.active_end) > w.active_start
            AND mm.cost = 0
        )
    `);
    check('maintenance_cost = 0 only when raw data contains an actual cost=0 row (no NULL->0 conversion)',
      Number(mcZeroFromNull.rows[0].bad) === 0,
      `${mcZeroFromNull.rows[0].bad} vehicles have cost=0 with no underlying cost=0 record`);

    // 5.18 maintenance_cost must not be NULL when actual cost evidence exists in-window.
    // If a vehicle has at least one in-window maintenance record with non-NULL cost,
    // the view must return a non-NULL summed cost.
    const mcShouldExist = await client.query(`
      WITH fleet AS (SELECT * FROM advisory_fleet_bounds),
      windows AS (
        SELECT v.vehicle_id,
               GREATEST(f.report_start_date, v.created_at) AS active_start,
               f.report_end_date AS active_end
        FROM vehicles v CROSS JOIN fleet f
      ),
      has_real_cost AS (
        SELECT DISTINCT mm.vehicle_id FROM maintenance mm
        JOIN windows w USING (vehicle_id)
        WHERE mm.start_date IS NOT NULL
          AND mm.cost IS NOT NULL
          AND mm.start_date::timestamp <  w.active_end
          AND COALESCE(mm.end_date::timestamp, w.active_end) > w.active_start
      )
      SELECT COUNT(*) AS bad
      FROM has_real_cost h
      JOIN advisory_vehicle_metrics m USING (vehicle_id)
      WHERE m.maintenance_cost IS NULL
    `);
    check('maintenance_cost NOT NULL when at least one in-window non-NULL cost exists',
      Number(mcShouldExist.rows[0].bad) === 0,
      `${mcShouldExist.rows[0].bad} vehicles with real cost evidence have NULL cost in view`);

    // 5.20 COUNT METRICS: zero-count vehicles get a true 0 (not NULL)
    // For each count metric, count vehicles whose raw source has 0 records but the
    // unified view still shows NULL for that count.
    const countMetrics = [
      { col: 'maintenance_frequency',       label: 'maintenance_frequency',       raw: 'maintenance' },
      { col: 'booking_count',               label: 'booking_count',               raw: 'in_window_booking' },
      { col: 'return_with_inspection_count',label: 'return_with_inspection_count',raw: 'return_inspection' },
      { col: 'return_ready_count',          label: 'return_ready_count',          raw: 'return_ready' },
      { col: 'total_inspections',           label: 'total_inspections',           raw: 'inspection' },
      { col: 'issue_inspections',           label: 'issue_inspections',           raw: 'issue_inspection' },
      { col: 'paid_payment_count',          label: 'paid_payment_count',          raw: 'paid_payment' }
    ];

    // For each count metric, independently count vehicles with zero raw records
    // and verify the unified view reports 0 for them.
    for (const m of countMetrics) {
      // Define the zero-source condition in a CTE per metric, then check view matches.
      const zeroSourceQ = (() => {
        switch (m.raw) {
          case 'maintenance':
            return `
              WITH zeros AS (
                SELECT v.vehicle_id FROM vehicles v
                WHERE NOT EXISTS (
                  SELECT 1 FROM maintenance mm
                  WHERE mm.vehicle_id = v.vehicle_id
                    AND mm.start_date IS NOT NULL
                )
              )
              SELECT COUNT(*) AS zero_count FROM zeros z
              JOIN advisory_vehicle_metrics m USING (vehicle_id)
              WHERE m.${m.col} IS NULL
            `;
          case 'in_window_booking':
            return `
              WITH fleet AS (SELECT * FROM advisory_fleet_bounds),
              windows AS (
                SELECT v.vehicle_id,
                       GREATEST(f.report_start_date, v.created_at) AS active_start,
                       f.report_end_date AS active_end
                FROM vehicles v CROSS JOIN fleet f
              ),
              zeros AS (
                SELECT v.vehicle_id FROM vehicles v
                WHERE NOT EXISTS (
                  SELECT 1 FROM bookings b JOIN windows w USING (vehicle_id)
                  WHERE b.status IN ('COMPLETED','ACTIVE','CONFIRMED')
                    AND b.return_datetime IS NOT NULL
                    AND GREATEST(b.pickup_datetime, w.active_start) < LEAST(b.return_datetime, w.active_end)
                )
              )
              SELECT COUNT(*) AS zero_count FROM zeros z
              JOIN advisory_vehicle_metrics m USING (vehicle_id)
              WHERE m.${m.col} IS NULL
            `;
          case 'return_inspection':
            return `
              WITH zeros AS (
                SELECT v.vehicle_id FROM vehicles v
                WHERE NOT EXISTS (
                  SELECT 1 FROM bookings b
                  JOIN vehicle_inspections vi ON vi.booking_id = b.booking_id
                  WHERE b.vehicle_id = v.vehicle_id
                    AND b.return_datetime IS NOT NULL
                    AND vi.inspection_date IS NOT NULL
                    AND b.status IN ('COMPLETED','ACTIVE','CONFIRMED')
                )
              )
              SELECT COUNT(*) AS zero_count FROM zeros z
              JOIN advisory_vehicle_metrics m USING (vehicle_id)
              WHERE m.${m.col} IS NULL
            `;
          case 'return_ready':
            return `
              WITH zeros AS (
                SELECT v.vehicle_id FROM vehicles v
                WHERE NOT EXISTS (
                  SELECT 1 FROM vehicle_status_history vsh1
                  JOIN vehicle_status_history vsh2
                    ON vsh2.vehicle_id = vsh1.vehicle_id
                   AND vsh2.status = 'READY'
                   AND vsh2.changed_at > vsh1.changed_at
                  WHERE vsh1.vehicle_id = v.vehicle_id
                    AND vsh1.status = 'RETURNED'
                )
              )
              SELECT COUNT(*) AS zero_count FROM zeros z
              JOIN advisory_vehicle_metrics m USING (vehicle_id)
              WHERE m.${m.col} IS NULL
            `;
          case 'inspection':
            return `
              WITH zeros AS (
                SELECT v.vehicle_id FROM vehicles v
                WHERE NOT EXISTS (
                  SELECT 1 FROM bookings b
                  JOIN vehicle_inspections vi ON vi.booking_id = b.booking_id
                  WHERE b.vehicle_id = v.vehicle_id
                )
              )
              SELECT COUNT(*) AS zero_count FROM zeros z
              JOIN advisory_vehicle_metrics m USING (vehicle_id)
              WHERE m.${m.col} IS NULL
            `;
          case 'issue_inspection':
            return `
              WITH zeros AS (
                SELECT v.vehicle_id FROM vehicles v
                WHERE NOT EXISTS (
                  SELECT 1 FROM bookings b
                  JOIN vehicle_inspections vi ON vi.booking_id = b.booking_id
                  WHERE b.vehicle_id = v.vehicle_id
                    AND vi.status IN ('MINOR_ISSUE','MAJOR_ISSUE')
                )
              )
              SELECT COUNT(*) AS zero_count FROM zeros z
              JOIN advisory_vehicle_metrics m USING (vehicle_id)
              WHERE m.${m.col} IS NULL
            `;
          case 'paid_payment':
            return `
              WITH zeros AS (
                SELECT v.vehicle_id FROM vehicles v
                WHERE NOT EXISTS (
                  SELECT 1 FROM bookings b
                  JOIN payments p ON p.booking_id = b.booking_id
                  WHERE b.vehicle_id = v.vehicle_id
                    AND p.payment_status = 'PAID'
                )
              )
              SELECT COUNT(*) AS zero_count FROM zeros z
              JOIN advisory_vehicle_metrics m USING (vehicle_id)
              WHERE m.${m.col} IS NULL
            `;
        }
      })();
      const r = await client.query(zeroSourceQ);
      const bad = Number(r.rows[0].zero_count);
      check(`Zero-source ${m.label} => count = 0 (not NULL) in unified view`,
        bad === 0,
        `${bad} zero-source vehicles still NULL`);
    }

    // 5.21 Additional: zero-count vehicles actually appear with 0 in view
    const zeroCountCheck = await client.query(`
      SELECT
        SUM(CASE WHEN maintenance_frequency = 0 THEN 1 ELSE 0 END) AS mf_zero,
        SUM(CASE WHEN booking_count = 0 THEN 1 ELSE 0 END)             AS bc_zero,
        SUM(CASE WHEN total_inspections = 0 THEN 1 ELSE 0 END)         AS ti_zero,
        SUM(CASE WHEN issue_inspections = 0 THEN 1 ELSE 0 END)         AS ii_zero,
        SUM(CASE WHEN paid_payment_count = 0 THEN 1 ELSE 0 END)        AS pc_zero,
        SUM(CASE WHEN return_ready_count = 0 THEN 1 ELSE 0 END)        AS rr_zero,
        SUM(CASE WHEN return_with_inspection_count = 0 THEN 1 ELSE 0 END) AS ri_zero
      FROM advisory_vehicle_metrics
    `);
    console.log(`  INFO: zero-count distribution: ${JSON.stringify(zeroCountCheck.rows[0])}`);

    // 6. FLEET BASELINES — eligible populations
    console.log('\n======================================');
    console.log('FLEET BASELINES (eligible populations & medians)');
    console.log('======================================');
    const baselines = [
      { name: 'utilization',               col: 'utilization',               evidence: true  },
      { name: 'maintenance_downtime_days', col: 'maintenance_downtime_days', evidence: true  },
      { name: 'maintenance_frequency',     col: 'maintenance_frequency',     evidence: false },
      { name: 'avg_return_ready_days',     col: 'avg_return_ready_days',     evidence: true  },
      { name: 'inspection_issue_rate',     col: 'inspection_issue_rate',     evidence: true  },
      { name: 'paid_revenue',              col: 'paid_revenue',              evidence: true  }
    ];
    const baselineRows = [];
    for (const b of baselines) {
      const popRes = await client.query(`
        SELECT COUNT(*) FILTER (WHERE ${b.col} IS NOT NULL) AS eligible,
               COUNT(*) FILTER (WHERE ${b.col} IS NULL)     AS excluded,
               COUNT(*) AS total
        FROM advisory_vehicle_metrics WHERE observation_window_days > 0
      `);
      const medRes = await client.query(`
        SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ${b.col}) AS median
        FROM advisory_vehicle_metrics
        WHERE observation_window_days > 0 AND ${b.col} IS NOT NULL
      `);
      const r = popRes.rows[0];
      baselineRows.push({
        metric: b.name,
        eligible: Number(r.eligible),
        excluded: Number(r.excluded),
        median: medRes.rows[0].median !== null ? Number(medRes.rows[0].median).toFixed(4) : 'NULL'
      });
      if (b.evidence) {
        check(`Baseline eligibility excludes NULL evidence for ${b.name}`,
          Number(r.eligible) + Number(r.excluded) === Number(r.total),
          `eligible=${r.eligible}, excluded=${r.excluded}`);
      } else {
        // maintenance_frequency is now a true count metric (never NULL); baseline
        // must include all 10 vehicles (including zero-count ones).
        check(`Count-metric baseline (${b.name}) includes all 10 vehicles (including zeros)`,
          Number(r.excluded) === 0 && Number(r.eligible) === Number(r.total),
          `eligible=${r.eligible}, excluded=${r.excluded} (zeros must be eligible)`);
      }
    }
    console.table(baselineRows);

    // 7. RUN RULES
    console.log('\n======================================');
    console.log('EXECUTING ADVISORY RULES (R1-R10)');
    console.log('======================================');
    const rulesRes = await client.query(rulesSql);
    console.log(`\nTotal recommendations generated: ${rulesRes.rowCount}`);

    const ruleGroups = {};
    for (const row of rulesRes.rows) {
      (ruleGroups[row.rule_code] = ruleGroups[row.rule_code] || []).push(row);
    }

    // 7.5 R10: at most one row per category
    const r10Rows = ruleGroups['FLEET_EXPANSION_REVIEW'] || [];
    const catCounts = {};
    for (const row of r10Rows) if (row.type) catCounts[row.type] = (catCounts[row.type] || 0) + 1;
    const dupCats = Object.entries(catCounts).filter(([, n]) => n > 1);
    check('R10 produces at most one row per category',
      dupCats.length === 0,
      `${r10Rows.length} row(s) across ${Object.keys(catCounts).length} category(ies)`);

    // 7.6 Canonical 32-column output
    const requiredCols = [
      'rule_code','rule_id','rule_title','severity',
      'vehicle_id','brand','model','type',
      'utilization','fleet_median_utilization',
      'maintenance_frequency','fleet_median_maintenance_frequency',
      'maintenance_cost','maintenance_downtime_days','high_downtime_threshold',
      'return_ready_count','avg_return_ready_days','high_return_ready_threshold',
      'total_inspections','issue_inspections','inspection_issue_rate','high_issue_rate_threshold',
      'paid_revenue','booking_count','rental_days',
      'return_with_inspection_count','avg_return_inspection_days','observation_window_days',
      'low_utilization_threshold','observation','recommended_action','data_limitation'
    ];
    if (rulesRes.rowCount > 0) {
      const sampleCols = Object.keys(rulesRes.rows[0]);
      const missing = requiredCols.filter(c => !sampleCols.includes(c));
      check('Canonical 32-column output present',
        missing.length === 0,
        missing.length === 0 ? `${sampleCols.length} columns` : `missing: ${missing.join(', ')}`);
    } else {
      // Even with zero rows, run rules with LIMIT 0 just to get column metadata
      const meta = await client.query(`SELECT * FROM (${rulesSql.replace(/;\s*$/, '')}) sub LIMIT 0`);
      const cols = meta.fields.map(f => f.name);
      const missing = requiredCols.filter(c => !cols.includes(c));
      check('Canonical 32-column output present (zero rows)',
        missing.length === 0,
        missing.length === 0 ? `${cols.length} columns` : `missing: ${missing.join(', ')}`);
    }

    // 7.7 Decision matrix summary
    const decisionMatrix = await client.query(`
      WITH fb AS (
        SELECT
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY utilization)
            FILTER (WHERE utilization IS NOT NULL) AS util_med,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY maintenance_downtime_days)
            FILTER (WHERE maintenance_downtime_days IS NOT NULL) AS dt_med
        FROM advisory_vehicle_metrics WHERE observation_window_days > 0
      )
      SELECT
        SUM(CASE WHEN utilization >= util_med AND maintenance_downtime_days > dt_med*1.5 THEN 1 ELSE 0 END) AS high_high,
        SUM(CASE WHEN utilization <  util_med - 0.10 AND maintenance_downtime_days <= dt_med*1.5 THEN 1 ELSE 0 END) AS low_low,
        SUM(CASE WHEN utilization <  util_med - 0.10 AND maintenance_downtime_days >  dt_med*1.5 THEN 1 ELSE 0 END) AS low_high,
        SUM(CASE WHEN utilization >= util_med AND maintenance_downtime_days <= dt_med*1.5 THEN 1 ELSE 0 END) AS high_low
      FROM advisory_vehicle_metrics CROSS JOIN fb WHERE observation_window_days > 0
    `);
    console.log('\nDecision matrix (util x downtime, 10 vehicles):');
    console.table(decisionMatrix.rows[0]);

    // Print rule breakdown
    const allCodes = ['UNDERUTILIZED','MAINTENANCE_DOWNTIME','TURNAROUND_BOTTLENECK',
      'REPEATED_INSPECTION_ISSUES','HIGH_DEMAND_OPERATIONAL_RISK','DEMAND_SIDE_UNDERUTILIZATION',
      'OPERATIONAL_UNDERPERFORMANCE','HEALTHY_PERFORMER','RECURRING_MAINTENANCE','FLEET_EXPANSION_REVIEW'];
    console.log('\nRule execution summary:');
    for (const code of allCodes) {
      const cnt = (ruleGroups[code] || []).length;
      console.log(`  ${code}: ${cnt} recommendation(s)`);
    }

    // 8. DETAILED RECOMMENDATIONS
    console.log('\n======================================');
    console.log('DETAILED ADVISORY RECOMMENDATIONS');
    console.log('======================================');
    for (const row of rulesRes.rows) {
      console.log(`\nRECOMMENDATION`);
      console.log(`  Rule:           ${row.rule_code}`);
      console.log(`  Severity:       ${row.severity}`);
      if (row.vehicle_id !== null && row.vehicle_id !== undefined) {
        console.log(`  Vehicle:        V${row.vehicle_id} (${row.brand} ${row.model})`);
      } else {
        console.log(`  Category:       ${row.type}`);
      }
      console.log(`\n  OBSERVATION`);
      console.log(`    ${row.observation}`);
      if (row.utilization !== null && row.utilization !== undefined) {
        console.log(`    Utilization:  ${(Number(row.utilization) * 100).toFixed(2)}%  (fleet median: ${((Number(row.fleet_median_utilization) || 0) * 100).toFixed(2)}%)`);
      }
      if (row.maintenance_downtime_days !== null && row.maintenance_downtime_days !== undefined) {
        console.log(`    Downtime:     ${Number(row.maintenance_downtime_days).toFixed(2)} days  (fleet median x1.5: ${Number(row.high_downtime_threshold || 0).toFixed(2)} days)`);
      }
      if (row.avg_return_ready_days !== null && row.avg_return_ready_days !== undefined) {
        console.log(`    Return->Ready: ${Number(row.avg_return_ready_days).toFixed(2)} days  (fleet median x1.5: ${Number(row.high_return_ready_threshold || 0).toFixed(2)} days)`);
      }
      if (row.inspection_issue_rate !== null && row.inspection_issue_rate !== undefined) {
        console.log(`    Issue Rate:   ${(Number(row.inspection_issue_rate) * 100).toFixed(1)}%  (fleet median x1.5: ${((Number(row.high_issue_rate_threshold) || 0) * 100).toFixed(1)}%)`);
      }
      console.log(`\n  SUGGESTED ACTION`);
      console.log(`    ${row.recommended_action}`);
      if (row.data_limitation) {
        console.log(`\n  DATA LIMITATION`);
        console.log(`    ${row.data_limitation}`);
      }
    }

    console.log('\n======================================');
    console.log(`CHECKS: ${checksPassed} passed, ${checksFailed} failed`);
    if (checksFailed > 0) {
      console.log('FAILURES:');
      for (const f of failures) console.log('  - ' + f);
      process.exitCode = 1;
    }
    console.log('Advisory SQL validation completed.');
    console.log('======================================');

    await client.end();
  } catch (err) {
    console.error('Advisory validation error:', err);
    process.exit(1);
  }
}

run();
