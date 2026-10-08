const fs = require('fs');
const path = require('path');
const { withClient } = require('../db/pool');

const VIEWS_FILE = path.join(__dirname, '..', '..', 'database', 'advisory_views.sql');
const RULES_FILE = path.join(__dirname, '..', '..', 'database', 'advisory_rules.sql');

let initialized = false;
let initializationPromise = null;

async function ensureViews() {
  if (initialized) return;
  if (!initializationPromise) {
    initializationPromise = (async () => {
      const sql = fs.readFileSync(VIEWS_FILE, 'utf8');
      await withClient(async (client) => {
        await client.query(sql);
      });
      initialized = true;
    })().finally(() => {
      initializationPromise = null;
    });
  }
  await initializationPromise;
}

async function scopeMetrics(client, companyId) {
  await client.query(`
    CREATE TEMP TABLE advisory_vehicle_metrics ON COMMIT DROP AS
    SELECT m.*
    FROM public.advisory_vehicle_metrics m
    JOIN public.vehicles v ON v.vehicle_id = m.vehicle_id
    WHERE v.company_id = $1
  `, [companyId]);
}

async function fetchRecommendations(companyId) {
  await ensureViews();
  const sql = fs.readFileSync(RULES_FILE, 'utf8');
  return withClient(async (client) => {
    await scopeMetrics(client, companyId);
    const r = await client.query(sql);
    return r.rows;
  });
}

async function fetchVehicleMetrics(companyId) {
  await ensureViews();
  return withClient(async (client) => {
    const r = await client.query(`
      SELECT m.*
      FROM public.advisory_vehicle_metrics m
      JOIN public.vehicles v ON v.vehicle_id = m.vehicle_id
      WHERE v.company_id = $1
      ORDER BY m.vehicle_id
    `, [companyId]);
    return r.rows;
  });
}

async function fetchBaselines(companyId) {
  await ensureViews();
  return withClient(async (client) => {
    const r = await client.query(`
      WITH base AS (
        SELECT m.*
        FROM public.advisory_vehicle_metrics m
        JOIN public.vehicles v ON v.vehicle_id = m.vehicle_id
        WHERE v.company_id = $1 AND m.observation_window_days > 0
      )
      SELECT
        (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY utilization)
           FROM base WHERE utilization IS NOT NULL) AS fleet_median_utilization,
        (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY maintenance_downtime_days)
           FROM base WHERE maintenance_downtime_days IS NOT NULL) AS fleet_median_maintenance_downtime,
        (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY maintenance_frequency)
           FROM base WHERE maintenance_frequency IS NOT NULL) AS fleet_median_maintenance_frequency,
        (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY avg_return_ready_days)
           FROM base WHERE avg_return_ready_days IS NOT NULL) AS fleet_median_return_ready_days,
        (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY inspection_issue_rate)
           FROM base WHERE inspection_issue_rate IS NOT NULL) AS fleet_median_inspection_issue_rate,
        (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY paid_revenue)
           FROM base WHERE paid_revenue IS NOT NULL) AS fleet_median_paid_revenue,
        (SELECT COUNT(*) FROM base WHERE utilization IS NOT NULL) AS utilization_pop,
        (SELECT COUNT(*) FROM base WHERE maintenance_downtime_days IS NOT NULL) AS maintenance_downtime_pop,
        (SELECT COUNT(*) FROM base WHERE maintenance_frequency IS NOT NULL) AS maintenance_frequency_pop,
        (SELECT COUNT(*) FROM base WHERE avg_return_ready_days IS NOT NULL) AS return_ready_pop,
        (SELECT COUNT(*) FROM base WHERE inspection_issue_rate IS NOT NULL) AS inspection_issue_pop,
        (SELECT COUNT(*) FROM base WHERE paid_revenue IS NOT NULL) AS revenue_pop,
        (SELECT COUNT(*) FROM base) AS total_vehicles
    `, [companyId]);
    return r.rows[0];
  });
}

module.exports = {
  ensureViews,
  fetchRecommendations,
  fetchVehicleMetrics,
  fetchBaselines,
};
