const express = require('express');
const cors = require('cors');
const advisoryRouter = require('./routes/advisory');
const customerRouter = require('./routes/customer');
const ownerRouter = require('./routes/owner');
const errorHandler = require('./middleware/errorHandler');
const { pool } = require('./db/pool');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    const r = await pool.query('SELECT 1 AS ok');
    res.json({ status: 'ok', db: r.rows[0].ok === 1 });
  } catch (err) {
    res.status(503).json({ status: 'degraded', db: false, error: err.message });
  }
});

app.use('/api/advisory', advisoryRouter);
// Owner routes must be mounted before generic customer routes to avoid catch‑all shadowing
app.use('/api/owner', ownerRouter);
app.use('/api', customerRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'not_found', message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 4000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`SmartCar advisory backend listening on http://127.0.0.1:${PORT}`);
    console.log('Endpoints:');
    console.log('  GET /api/health');
    console.log('  GET /api/advisory/health');
    console.log('  GET /api/advisory/recommendations');
    console.log('  GET /api/advisory/vehicle-metrics');
    console.log('  GET /api/advisory/baselines');
    console.log('  GET /api/vehicles');
    console.log('  GET /api/vehicles/:id');
    console.log('  GET /api/vehicles/:id/availability');
    console.log('  POST /api/bookings');
    console.log('  GET /api/owner/bookings');
    console.log('  GET /api/owner/bookings/:id');
    console.log('  GET /api/owner/inspections');
    console.log('  GET /api/owner/inspections/:bookingId/:inspectionNo');
    console.log('  GET /api/owner/maintenance');
    console.log('  GET /api/owner/maintenance/:vehicleId/:maintenanceNo');
    console.log('  GET /api/owner/history');
  });
}

module.exports = app;
