const { query } = require('../db/pool');

async function fetchOwnerAnalytics(companyId) {
  const [revenueRanking, topVehicles, cumulativeRevenue, bookingSummary, neverBookedVehicles, confirmedCustomers, aboveAveragePrice, maintenanceComparison, rentalDuration] = await Promise.all([
    query(`
      WITH vehicle_revenue AS (
        SELECT v.vehicle_id, v.company_id, v.brand, v.model, v.vehicle_number,
          COALESCE(SUM(p.amount) FILTER (WHERE p.payment_status = 'PAID'), 0) AS revenue
        FROM vehicles v
        LEFT JOIN bookings b ON b.vehicle_id = v.vehicle_id
        LEFT JOIN payments p ON p.booking_id = b.booking_id
        WHERE v.company_id = $1
        GROUP BY v.vehicle_id, v.company_id, v.brand, v.model, v.vehicle_number
      )
      SELECT vr.*, RANK() OVER (PARTITION BY vr.company_id ORDER BY vr.revenue DESC) AS revenue_rank
      FROM vehicle_revenue vr
      ORDER BY revenue_rank, vr.vehicle_id
    `, [companyId]),
    query(`
      WITH vehicle_revenue AS (
        SELECT v.vehicle_id, v.company_id, v.brand, v.model, v.vehicle_number,
          COALESCE(SUM(p.amount) FILTER (WHERE p.payment_status = 'PAID'), 0) AS revenue
        FROM vehicles v
        LEFT JOIN bookings b ON b.vehicle_id = v.vehicle_id
        LEFT JOIN payments p ON p.booking_id = b.booking_id
        WHERE v.company_id = $1
        GROUP BY v.vehicle_id, v.company_id, v.brand, v.model, v.vehicle_number
      ), ranked AS (
        SELECT vr.*, ROW_NUMBER() OVER (PARTITION BY vr.company_id ORDER BY vr.revenue DESC, vr.vehicle_id) AS revenue_rank
        FROM vehicle_revenue vr
      )
      SELECT * FROM ranked WHERE revenue_rank <= 3 ORDER BY company_id, revenue_rank
    `, [companyId]),
    query(`
      SELECT p.paid_at::date AS revenue_date, SUM(p.amount) AS period_revenue,
        SUM(SUM(p.amount)) OVER (ORDER BY p.paid_at::date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_revenue
      FROM payments p
      JOIN bookings b ON b.booking_id = p.booking_id
      JOIN vehicles v ON v.vehicle_id = b.vehicle_id
      WHERE v.company_id = $1 AND p.payment_status = 'PAID' AND p.paid_at IS NOT NULL
      GROUP BY p.paid_at::date
      ORDER BY revenue_date
    `, [companyId]),
    query(`
      SELECT
        COUNT(*) FILTER (WHERE b.status = 'PENDING') AS pending,
        COUNT(*) FILTER (WHERE b.status = 'CONFIRMED') AS confirmed,
        COUNT(*) FILTER (WHERE b.status = 'ACTIVE') AS active,
        COUNT(*) FILTER (WHERE b.status = 'COMPLETED') AS completed,
        COUNT(*) FILTER (WHERE b.status = 'CANCELLED') AS cancelled,
        COUNT(*) AS total
      FROM bookings b
      JOIN vehicles v ON v.vehicle_id = b.vehicle_id
      WHERE v.company_id = $1
    `, [companyId]),
    query(`
      SELECT v.vehicle_id, v.vehicle_number, v.brand, v.model, v.type,
        rc.company_name, l.name AS location_name, l.city
      FROM vehicles v
      JOIN rental_companies rc ON rc.company_id = v.company_id
      JOIN locations l ON l.location_id = v.location_id
      WHERE v.company_id = $1
        AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.vehicle_id = v.vehicle_id)
      ORDER BY v.vehicle_id
    `, [companyId]),
    query(`
      SELECT c.customer_id, c.name, u.email
      FROM customers c
      JOIN users u ON u.user_id = c.user_id
      WHERE EXISTS (
        SELECT 1
        FROM bookings b
        JOIN vehicles v ON v.vehicle_id = b.vehicle_id
        WHERE b.customer_id = c.customer_id
          AND v.company_id = $1
          AND b.status = 'CONFIRMED'
      )
      ORDER BY c.name
    `, [companyId]),
    query(`
      SELECT v.vehicle_id, v.vehicle_number, v.brand, v.model, v.type,
        v.price_per_day, rc.company_name, l.name AS location_name, l.city,
        (SELECT AVG(v2.price_per_day) FROM vehicles v2 WHERE v2.company_id = $1) AS fleet_average_price
      FROM vehicles v
      JOIN rental_companies rc ON rc.company_id = v.company_id
      JOIN locations l ON l.location_id = v.location_id
      WHERE v.company_id = $1
        AND v.price_per_day > (SELECT AVG(v2.price_per_day) FROM vehicles v2 WHERE v2.company_id = $1)
      ORDER BY v.price_per_day DESC
    `, [companyId]),
    query(`
      WITH maintenance_counts AS (
        SELECT v.company_id, v.vehicle_id, v.vehicle_number, v.brand, v.model,
          COUNT(m.maintenance_no)::int AS maintenance_count
        FROM vehicles v
        LEFT JOIN maintenance m ON m.vehicle_id = v.vehicle_id
        WHERE v.company_id = $1
        GROUP BY v.company_id, v.vehicle_id, v.vehicle_number, v.brand, v.model
      ), company_average AS (
        SELECT company_id, AVG(maintenance_count) AS company_average
        FROM maintenance_counts
        GROUP BY company_id
      )
      SELECT mc.*, ca.company_average
      FROM maintenance_counts mc
      JOIN company_average ca ON ca.company_id = mc.company_id
      WHERE mc.maintenance_count > ca.company_average
      ORDER BY mc.maintenance_count DESC, mc.vehicle_id
    `, [companyId]),
    query(`
      SELECT v.type AS vehicle_type,
        AVG(EXTRACT(EPOCH FROM (b.return_datetime - b.pickup_datetime)) / 86400.0) AS average_rental_days,
        COUNT(*)::int AS booking_count
      FROM bookings b
      JOIN vehicles v ON v.vehicle_id = b.vehicle_id
      WHERE v.company_id = $1
        AND b.status = 'COMPLETED'
        AND b.return_datetime > b.pickup_datetime
      GROUP BY v.type
      ORDER BY v.type
    `, [companyId])
  ]);

  return {
    revenue_ranking: revenueRanking.rows,
    top_vehicles: topVehicles.rows,
    cumulative_revenue: cumulativeRevenue.rows,
    booking_summary: bookingSummary.rows[0],
    never_booked_vehicles: neverBookedVehicles.rows,
    confirmed_customers: confirmedCustomers.rows,
    above_average_price: aboveAveragePrice.rows,
    maintenance_comparison: maintenanceComparison.rows,
    rental_duration_by_type: rentalDuration.rows
  };
}

async function fetchStatusTransitions(companyId, vehicleId) {
  const result = await query(`
    WITH ordered_history AS (
      SELECT h.history_id, h.vehicle_id, h.status, h.changed_at, h.comments,
        LAG(h.status) OVER (PARTITION BY h.vehicle_id ORDER BY h.changed_at, h.history_id) AS previous_status,
        LEAD(h.status) OVER (PARTITION BY h.vehicle_id ORDER BY h.changed_at, h.history_id) AS next_status,
        LEAD(h.changed_at) OVER (PARTITION BY h.vehicle_id ORDER BY h.changed_at, h.history_id) AS next_changed_at
      FROM vehicle_status_history h
      JOIN vehicles v ON v.vehicle_id = h.vehicle_id
      WHERE v.company_id = $1 AND h.vehicle_id = $2
    )
    SELECT history_id, vehicle_id, status AS current_status, previous_status, changed_at,
      next_status, next_changed_at,
      CASE WHEN next_changed_at IS NULL THEN NULL
        ELSE EXTRACT(EPOCH FROM (next_changed_at - changed_at)) / 86400.0
      END AS duration_in_status,
      comments
    FROM ordered_history
    ORDER BY changed_at, history_id
  `, [companyId, vehicleId]);
  return result.rows;
}

module.exports = { fetchOwnerAnalytics, fetchStatusTransitions };
