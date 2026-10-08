const express = require('express');
const { query } = require('../db/pool');
const advisory = require('../services/advisoryService');

const router = express.Router();

async function requireOwner(req, res) {
  const value = req.get('x-owner-id') || req.query.owner_user_id;
  const userId = Number(value);
  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(401).json({ error: 'owner_session_required', message: 'A valid owner session is required.' });
    return null;
  }
  const result = await query(`
    SELECT rc.company_id, rc.company_name, u.user_id, u.email
    FROM rental_companies rc
    JOIN users u ON u.user_id = rc.user_id
    WHERE rc.user_id = $1 AND u.role = 'owner'
  `, [userId]);
  if (!result.rows[0]) {
    res.status(403).json({ error: 'owner_access_required', message: 'The current account is not an owner.' });
    return null;
  }
  return result.rows[0];
}

// GET /api/advisory/recommendations
router.get('/recommendations', async (req, res, next) => {
  try {
    const owner = await requireOwner(req, res);
    if (!owner) return;
    const rows = await advisory.fetchRecommendations(owner.company_id);
    res.json({
      count: rows.length,
      recommendations: rows,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/advisory/vehicle-metrics
router.get('/vehicle-metrics', async (req, res, next) => {
  try {
    const owner = await requireOwner(req, res);
    if (!owner) return;
    const rows = await advisory.fetchVehicleMetrics(owner.company_id);
    res.json({
      count: rows.length,
      vehicle_metrics: rows,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/advisory/baselines
router.get('/baselines', async (req, res, next) => {
  try {
    const owner = await requireOwner(req, res);
    if (!owner) return;
    const row = await advisory.fetchBaselines(owner.company_id);
    res.json(row);
  } catch (err) {
    next(err);
  }
});

// GET /api/advisory/health
router.get('/health', async (req, res, next) => {
  try {
    await advisory.ensureViews();
    res.json({ status: 'ok', views_initialized: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
