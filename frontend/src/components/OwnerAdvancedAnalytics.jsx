import { useEffect, useState } from "react";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "./common";
import { ownerApi } from "../services/ownerApi";

function number(value) {
  return value === null || value === undefined ? null : Number(value);
}

function money(value) {
  const amount = number(value);
  return amount === null || !Number.isFinite(amount) ? "—" : `Rs ${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function AnalyticsTable({ columns, rows, empty = "No matching records in the current database." }) {
  if (!rows.length) return <EmptyState title="No matching records" description={empty} />;
  return <div className="card table-card table-scroll"><table><thead><tr>{columns.map((column) => <th key={column.label}>{column.label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row.vehicle_id || row.customer_id || row.vehicle_type || row.revenue_date || index}>{columns.map((column) => <td key={column.label}>{column.render ? column.render(row) : row[column.key]}</td>)}</tr>)}</tbody></table></div>;
}

export function OwnerAdvancedAnalytics() {
  const [state, setState] = useState({ loading: true, error: "", data: null });
  useEffect(() => {
    let active = true;
    ownerApi.getAnalytics().then((data) => active && setState({ loading: false, error: "", data })).catch((error) => active && setState({ loading: false, error: error.message, data: null }));
    return () => { active = false; };
  }, []);
  if (state.loading) return <section className="analytics-section"><LoadingState title="Loading advanced SQL analytics" /></section>;
  if (state.error) return <section className="analytics-section"><ErrorState title="Advanced analytics unavailable" description={state.error} /></section>;
  const data = state.data;
  const summary = data.booking_summary || {};
  return <>
    <section className="analytics-section"><div className="section-head-split"><div><p className="eyebrow">PostgreSQL conditional aggregation</p><h3>Booking status summary</h3></div><span className="analytics-note">Company-scoped counts</span></div><div className="grid-four">{["pending", "confirmed", "active", "completed", "cancelled"].map((status) => <article className="card analytics-metric" key={status}><p className="eyebrow">{status}</p><h3>{summary[status] || 0}</h3><p>Bookings in this status</p></article>)}</div></section>
    <section className="analytics-grid-two analytics-section">
      <section className="reports-section"><p className="eyebrow">RANK() OVER(PARTITION BY)</p><h3>Vehicle revenue ranking</h3><AnalyticsTable columns={[{ label: "Rank", render: (row) => row.revenue_rank }, { label: "Vehicle", render: (row) => `${row.brand} ${row.model}` }, { label: "Revenue", render: (row) => money(row.revenue) }]} rows={data.revenue_ranking || []} /></section>
      <section className="reports-section"><p className="eyebrow">ROW_NUMBER() OVER(PARTITION BY)</p><h3>Top three vehicles</h3><AnalyticsTable columns={[{ label: "Rank", render: (row) => row.revenue_rank }, { label: "Vehicle", render: (row) => `${row.brand} ${row.model}` }, { label: "Revenue", render: (row) => money(row.revenue) }]} rows={data.top_vehicles || []} /></section>
    </section>
    <section className="analytics-grid-two analytics-section">
      <section className="reports-section"><p className="eyebrow">Windowed running total</p><h3>Cumulative revenue</h3><AnalyticsTable columns={[{ label: "Date", key: "revenue_date" }, { label: "Period", render: (row) => money(row.period_revenue) }, { label: "Cumulative", render: (row) => money(row.cumulative_revenue) }]} rows={data.cumulative_revenue || []} /></section>
      <section className="reports-section"><p className="eyebrow">Date arithmetic</p><h3>Average rental duration</h3><AnalyticsTable columns={[{ label: "Type", key: "vehicle_type" }, { label: "Average days", render: (row) => number(row.average_rental_days)?.toFixed(2) || "—" }, { label: "Bookings", key: "booking_count" }]} rows={data.rental_duration_by_type || []} /></section>
    </section>
    <section className="analytics-grid-two analytics-section">
      <section className="reports-section"><p className="eyebrow">NOT EXISTS</p><h3>Never-booked vehicles</h3><AnalyticsTable columns={[{ label: "Vehicle", render: (row) => `${row.brand} ${row.model}` }, { label: "Number", key: "vehicle_number" }, { label: "Location", render: (row) => `${row.location_name}, ${row.city}` }]} rows={data.never_booked_vehicles || []} /></section>
      <section className="reports-section"><p className="eyebrow">Scalar subquery</p><h3>Above-average rental price</h3><AnalyticsTable columns={[{ label: "Vehicle", render: (row) => `${row.brand} ${row.model}` }, { label: "Daily rate", render: (row) => money(row.price_per_day) }, { label: "Fleet average", render: (row) => money(row.fleet_average_price) }]} rows={data.above_average_price || []} /></section>
    </section>
    <section className="analytics-grid-two analytics-section">
      <section className="reports-section"><p className="eyebrow">CTE + company average</p><h3>Maintenance above company average</h3><AnalyticsTable columns={[{ label: "Vehicle", render: (row) => `${row.brand} ${row.model}` }, { label: "Events", key: "maintenance_count" }, { label: "Company average", render: (row) => number(row.company_average)?.toFixed(2) || "—" }]} rows={data.maintenance_comparison || []} /></section>
      <section className="reports-section"><p className="eyebrow">EXISTS</p><h3>Customers with confirmed bookings</h3><AnalyticsTable columns={[{ label: "Customer", key: "name" }, { label: "Email", key: "email" }]} rows={data.confirmed_customers || []} /></section>
    </section>
  </>;
}

export function VehicleStatusTransitions({ vehicleId }) {
  const [state, setState] = useState({ loading: true, error: "", rows: [] });
  useEffect(() => {
    let active = true;
    ownerApi.getStatusTransitions(vehicleId).then((data) => active && setState({ loading: false, error: "", rows: data.items || [] })).catch((error) => active && setState({ loading: false, error: error.message, rows: [] }));
    return () => { active = false; };
  }, [vehicleId]);
  return <section className="analytics-section"><div className="section-head-split"><div><p className="eyebrow">LAG() / LEAD() OVER()</p><h3>Status transition analysis</h3></div><span className="analytics-note">Database-derived lifecycle durations</span></div>{state.loading ? <LoadingState title="Loading status transitions" /> : state.error ? <ErrorState title="Status analysis unavailable" description={state.error} /> : <AnalyticsTable columns={[{ label: "Previous", render: (row) => row.previous_status || "Initial" }, { label: "Current", render: (row) => <StatusBadge status={row.current_status} /> }, { label: "Changed", render: (row) => new Date(row.changed_at).toLocaleString() }, { label: "Next", render: (row) => row.next_status || "Current" }, { label: "Duration", render: (row) => row.duration_in_status === null ? "Ongoing" : `${Number(row.duration_in_status).toFixed(2)} days` }]} rows={state.rows} empty="This vehicle has no recorded status history." />}</section>;
}
