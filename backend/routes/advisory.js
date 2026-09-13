const express = require('express');
const advisory = require('../services/advisoryService');

const router = express.Router();

// GET /api/advisory/recommendations
router.get('/recommendations', async (req, res, next) => {
  try {
    const rows = await advisory.fetchRecommendations();
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
    const rows = await advisory.fetchVehicleMetrics();
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
    const row = await advisory.fetchBaselines();
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
