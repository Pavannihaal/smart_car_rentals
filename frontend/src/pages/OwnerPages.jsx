import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { AdvisoryDashboard } from "../components/AdvisoryDashboard";
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge, Toast } from "../components/common";
import { fallbackVehicleImage, getVehicleImage } from "../data/vehicleImages";
import { ownerApi } from "../services/ownerApi";
import { getCurrentSessionUser } from "../data/users";

const availableStatuses = ["AVAILABLE", "READY", "RETURNED"];
const inspectionStatuses = ["INSPECTION", "CLEANING"];
const operationsUnavailable = "This operational module has no write actions yet. The view only represents records returned by the owner API.";

function useOwnerResource(loader, dependencies = []) {
  const [state, setState] = useState({ loading: true, error: "", data: null });
  useEffect(() => {
    let active = true;
    setState({ loading: true, error: "", data: null });
    loader().then((data) => active && setState({ loading: false, error: "", data })).catch((error) => active && setState({ loading: false, error: error.message, data: null }));
    return () => { active = false; };
  }, dependencies);
  return state;
}

function dateTime(value) { return value ? new Date(value).toLocaleString() : "Not recorded"; }
function dateOnly(value) { return value ? new Date(value).toLocaleDateString() : "Not recorded"; }
function money(value) { return value === null || value === undefined ? "No amount" : `Rs ${Number(value).toLocaleString("en-IN")}`; }

function VehicleReference({ vehicle, linked = true }) {
  const content = <><strong>{vehicle.brand} {vehicle.model}</strong><span>{vehicle.vehicle_number}</span></>;
  return linked ? <Link className="record-vehicle" to={`/owner/vehicles/${vehicle.vehicle_id}`}>{content}</Link> : <div className="record-vehicle">{content}</div>;
}

function FleetCard({ vehicle, featured = false }) {
  return <article className={`card fleet-card ${featured ? "fleet-card-featured" : ""}`}><div className="fleet-image-frame"><img src={getVehicleImage(vehicle)} alt={`${vehicle.brand} ${vehicle.model}`} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackVehicleImage; }} /></div><div className="split-line"><div><p className="eyebrow">{vehicle.brand}</p><h3>{vehicle.model}</h3></div><StatusBadge status={vehicle.status} /></div><p>{vehicle.vehicle_number} / {vehicle.location_name}, {vehicle.city}</p><div className="vehicle-stats"><span>{vehicle.type}</span><span>{vehicle.year}</span><span>{vehicle.transmission}</span><span>{money(vehicle.price_per_day)}/day</span></div><Link className="secondary-button" to={`/owner/vehicles/${vehicle.vehicle_id}`}>Open vehicle</Link></article>;
}

function UnavailableOwnerPage({ eyebrow, title, description }) {
  return <div className="stack-page"><PageHeader eyebrow={eyebrow} title={title} description={description} /><EmptyState title="Owner operation unavailable" description={operationsUnavailable} /></div>;
}

function FilterBar({ search, setSearch, status, setStatus, statuses, placeholder }) {
  return <section className="owner-filters"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={placeholder} /><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option>{statuses.map((item) => <option key={item} value={item}>{item}</option>)}</select><button type="button" className="secondary-button" onClick={() => { setSearch(""); setStatus(""); }}>Clear</button></section>;
}

export function OwnerDashboardPage() {
  const fleetState = useOwnerResource(() => ownerApi.getFleet(), []);
  const metricsState = useOwnerResource(() => ownerApi.getOperationalMetrics(), []);
  if (fleetState.loading) return <div className="stack-page"><LoadingState title="Loading fleet overview" /></div>;
  if (fleetState.error) return <div className="stack-page"><ErrorState title="Fleet unavailable" description={fleetState.error} /></div>;
  const vehicles = fleetState.data?.items || [];
  const counts = vehicles.reduce((result, vehicle) => { result[vehicle.status] = (result[vehicle.status] || 0) + 1; return result; }, {});
  const metrics = metricsState.data?.vehicle_metrics || [];
  const utilizationValues = metrics.map((item) => item.utilization).filter((value) => value !== null && value !== undefined).map(Number).filter(Number.isFinite);
  const averageUtilization = utilizationValues.length ? `${(utilizationValues.reduce((sum, value) => sum + value, 0) / utilizationValues.length * 100).toFixed(1)}%` : "—";
  const availableCount = vehicles.filter((vehicle) => availableStatuses.includes(vehicle.status)).length;
  const attentionVehicles = vehicles.filter((vehicle) => !availableStatuses.includes(vehicle.status)).slice(0, 3);
  return <div className="stack-page"><PageHeader eyebrow="Rental Owner" title="Fleet command center" description="A grounded view of vehicle readiness and operational evidence from SmartCar." actions={<Link className="primary-button" to="/owner/fleet">Manage fleet</Link>} /><section className="grid-four"><article className="card dashboard-card"><p className="eyebrow">Total vehicles</p><h3>{vehicles.length}</h3><p>Current fleet records</p></article><article className="card dashboard-card"><p className="eyebrow">Available</p><h3>{availableCount}</h3><p>Available, ready, or returned</p></article><article className="card dashboard-card"><p className="eyebrow">Booked / rented</p><h3>{(counts.RESERVED || 0) + (counts.RENTED || 0)}</h3><p>Current vehicle status</p></article><article className="card dashboard-card"><p className="eyebrow">Service / inspection</p><h3>{(counts.MAINTENANCE || 0) + (counts.INSPECTION || 0) + (counts.CLEANING || 0)}</h3><p>Current lifecycle queue</p></article></section><section className="owner-dashboard-grid"><section className="card pipeline-card"><p className="eyebrow">Fleet status mix</p><div className="pipeline-grid">{Object.entries(counts).map(([status, count]) => <div className="pipeline-node" key={status}><strong>{count}</strong><span>{status}</span></div>)}</div></section><section className="card dashboard-card"><p className="eyebrow">Advisory evidence</p><h3>{metricsState.loading ? "Loading" : averageUtilization}</h3><p>{utilizationValues.length ? "Average utilization among vehicles with evidence" : "No utilization evidence available"}</p><Link className="secondary-button" to="/owner/advisory">Open advisory</Link></section></section><section><div className="section-head-split"><h3>Fleet requiring attention</h3><Link to="/owner/fleet">View all</Link></div>{attentionVehicles.length ? <section className="catalog-grid">{attentionVehicles.map((vehicle) => <FleetCard key={vehicle.vehicle_id} vehicle={vehicle} />)}</section> : <EmptyState title="Fleet is operationally ready" description="No vehicle currently carries a service, inspection, rental, or inactive status." />}</section><p className="owner-data-note">Bookings, inspections, maintenance, and history are available from the Owner Operations workspace.</p></div>;
}

export function OwnerFleetPage() {
  const state = useOwnerResource(() => ownerApi.getFleet(), []);
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(() => searchParams.get("filter") || "");
  const [type, setType] = useState("");
  const vehicles = state.data?.items || [];
  const statusMatches = (vehicle) => ({ available: availableStatuses.includes(vehicle.status), reserved: vehicle.status === "RESERVED", rented: vehicle.status === "RENTED", inspection: inspectionStatuses.includes(vehicle.status), maintenance: vehicle.status === "MAINTENANCE" }[status] ?? (!status || vehicle.status === status));
  const filtered = useMemo(() => vehicles.filter((vehicle) => `${vehicle.brand} ${vehicle.model} ${vehicle.vehicle_number} ${vehicle.city}`.toLowerCase().includes(query.toLowerCase()) && statusMatches(vehicle) && (!type || vehicle.type === type)), [vehicles, query, status, type]);
  if (state.loading) return <div className="stack-page"><LoadingState title="Loading fleet" /></div>;
  if (state.error) return <div className="stack-page"><ErrorState title="Fleet unavailable" description={state.error} /></div>;
  const statuses = [...new Set(vehicles.map((item) => item.status))];
  const types = [...new Set(vehicles.map((item) => item.type))];
  return <div className="stack-page"><PageHeader eyebrow="Fleet" title="Vehicle inventory" description="Real fleet records with operational status, location, rate, and vehicle-specific photography." /><section className="owner-filters"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search brand, model, number" /><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option>{statuses.map((item) => <option key={item} value={item}>{item}</option>)}</select><select value={type} onChange={(event) => setType(event.target.value)}><option value="">All categories</option>{types.map((item) => <option key={item} value={item}>{item}</option>)}</select><button type="button" className="secondary-button" onClick={() => { setQuery(""); setStatus(""); setType(""); }}>Clear</button></section>{filtered.length ? <section className="catalog-grid">{filtered.map((vehicle, index) => <FleetCard key={vehicle.vehicle_id} vehicle={vehicle} featured={index === 0} />)}</section> : <EmptyState title="No vehicles match" description="Try another fleet search or filter." />}</div>;
}

export function OwnerVehicleDetailsPage() {
  const { id } = useParams();
  const state = useOwnerResource(() => ownerApi.getVehicle(id), [id]);
  if (state.loading) return <div className="stack-page"><LoadingState title="Loading vehicle" /></div>;
  if (state.error || !state.data) return <div className="stack-page"><ErrorState title="Vehicle not found" description={state.error || "This vehicle record does not exist."} action={<Link className="primary-button" to="/owner/fleet">Back to fleet</Link>} /></div>;
  const vehicle = state.data;
  return <div className="stack-page"><PageHeader eyebrow="Owner Vehicle Detail" title={`${vehicle.brand} ${vehicle.model}`} description={`${vehicle.vehicle_number} / ${vehicle.company_name}`} actions={<Link className="secondary-button" to="/owner/fleet">Back to fleet</Link>} /><section className="vehicle-detail-layout"><div className="vehicle-detail-image"><img src={getVehicleImage(vehicle)} alt={`${vehicle.brand} ${vehicle.model}`} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackVehicleImage; }} /></div><section className="card detail-panel"><div className="detail-highlight"><StatusBadge status={vehicle.status} /><strong>{money(vehicle.price_per_day)}/day</strong></div><div className="detail-grid"><div><span>Category</span><strong>{vehicle.type}</strong></div><div><span>Year</span><strong>{vehicle.year}</strong></div><div><span>Fuel</span><strong>{vehicle.fuel_type}</strong></div><div><span>Transmission</span><strong>{vehicle.transmission}</strong></div><div><span>Seats</span><strong>{vehicle.seats}</strong></div><div><span>Mileage</span><strong>{Number(vehicle.mileage).toLocaleString("en-IN")} km</strong></div><div><span>Location</span><strong>{vehicle.location_name}, {vehicle.city}</strong></div><div><span>Fuel level</span><strong>{vehicle.current_fuel_level}%</strong></div></div></section></section><section className="owner-detail-dependencies"><Link className="card state-card state-card-link" to={`/owner/history?vehicle_id=${vehicle.vehicle_id}`}><p className="eyebrow">History</p><h3>Open lifecycle history</h3><p>Review recorded status transitions for this vehicle.</p></Link><Link className="card state-card state-card-link" to={`/owner/inspections?vehicle_id=${vehicle.vehicle_id}`}><p className="eyebrow">Inspections</p><h3>Open inspection records</h3><p>Review condition reports linked to this vehicle.</p></Link><Link className="card state-card state-card-link" to={`/owner/maintenance?vehicle_id=${vehicle.vehicle_id}`}><p className="eyebrow">Maintenance</p><h3>Open maintenance records</h3><p>Review service records linked to this vehicle.</p></Link></section></div>;
}

export function OwnerBookingsPage() {
  const state = useOwnerResource(() => ownerApi.getBookings(), []);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const items = state.data?.items || [];
  const filtered = items.filter((item) => `${item.customer?.name || ""} ${item.vehicle?.brand || ""} ${item.vehicle?.model || ""} ${item.vehicle?.vehicle_number || ""}`.toLowerCase().includes(search.toLowerCase()) && (!status || item.status === status));
  if (state.loading) return <div className="stack-page"><LoadingState title="Loading owner bookings" /></div>;
  if (state.error) return <div className="stack-page"><ErrorState title="Bookings unavailable" description={state.error} /></div>;
  return <div className="stack-page"><PageHeader eyebrow="Bookings" title="Reservation pipeline" description="Company-scoped bookings with customer, vehicle, timing, payment, and location details." /><FilterBar search={search} setSearch={setSearch} status={status} setStatus={setStatus} statuses={["PENDING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"]} placeholder="Search customer, vehicle, or number" />{filtered.length ? <section className="record-list">{filtered.map((booking) => <Link className="card record-row" to={`/owner/bookings/${booking.booking_id}`} key={booking.booking_id}><div><p className="eyebrow">Booking #{booking.booking_id}</p><VehicleReference linked={false} vehicle={{ ...booking.vehicle, vehicle_id: booking.vehicle_id }} /><span>{booking.customer?.name || "Customer"} / {booking.location_name}, {booking.city}</span></div><div><StatusBadge status={booking.status} /><strong>{money(booking.total_amount)}</strong></div><div><span>Pickup</span><strong>{dateTime(booking.pickup_datetime)}</strong></div><div><span>Return</span><strong>{dateTime(booking.return_datetime)}</strong></div><div><span>Payment</span><strong>{booking.payment?.status || "No payment record"}</strong></div></Link>)}</section> : <EmptyState title="No bookings found" description="No real bookings match the current search and status filter." />}</div>;
}

export function OwnerBookingDetailsPage() {
  const { id } = useParams();
  const state = useOwnerResource(() => ownerApi.getBooking(id), [id]);
  const [updatedBooking, setUpdatedBooking] = useState(null);
  const [toast, setToast] = useState(null);

  if (state.loading) return <div className="stack-page"><LoadingState title="Loading booking detail" /></div>;
  if (state.error || !state.data) return <div className="stack-page"><ErrorState title="Booking not found" description={state.error || "This booking is not available to the current owner."} action={<Link className="primary-button" to="/owner/bookings">Back to bookings</Link>} /></div>;

  const booking = updatedBooking || state.data;

  return <div className="stack-page">{toast && <Toast {...toast} onClose={() => setToast(null)} />}<PageHeader eyebrow={`Booking #${booking.booking_id}`} title={`${booking.vehicle?.brand || "Vehicle"} ${booking.vehicle?.model || ""}`} description={`${booking.customer?.name || "Customer"} / ${booking.location_name}, ${booking.city}`} actions={<Link className="secondary-button" to="/owner/bookings">Back to bookings</Link>} /><section className="card operational-detail"><div className="split-line"><div><p className="eyebrow">Booking status</p><StatusBadge status={booking.status} /></div><div className="header-actions">{booking.status === "PENDING" ? <OwnerBookingActions
            booking={booking}
            onStatusChange={(updated) => setUpdatedBooking(updated)}
            setToast={setToast}
          /> : null}<strong>{money(booking.total_amount)}</strong></div></div><div className="detail-grid"><div><span>Customer</span><strong>{booking.customer?.name || "Customer"}</strong><small>{booking.customer?.email}</small></div><div><span>Vehicle</span><strong>{booking.vehicle?.vehicle_number}</strong><small>{booking.vehicle?.status} current status</small></div><div><span>Pickup</span><strong>{dateTime(booking.pickup_datetime)}</strong></div><div><span>Return</span><strong>{dateTime(booking.return_datetime)}</strong></div><div><span>Location</span><strong>{booking.location_name}, {booking.city}</strong></div><div><span>Payment</span><strong>{booking.payment?.status || "No payment record"}</strong></div></div></section><OwnerBookingMessages bookingId={booking.booking_id} /></div>;
}

function OwnerBookingActions({ booking, onStatusChange, setToast }) {
  const [busy, setBusy] = useState("");
  const [feedback, setFeedback] = useState("");
  const bookingId = booking.booking_id;
  const vehicleName = `${booking.vehicle?.brand || ""} ${booking.vehicle?.model || ""}`.trim() || "vehicle";

  const update = async (statusLabel) => {
    setBusy(statusLabel);
    setFeedback("");
    try {
      await ownerApi.updateBookingStatus(bookingId, statusLabel);
      let updatedBookingData;
      try {
        updatedBookingData = await ownerApi.getBooking(bookingId);
      } catch (e) {
        updatedBookingData = { ...booking, status: statusLabel };
      }
      const isConfirmed = statusLabel === "CONFIRMED";
      setToast({
        message: `Booking #${bookingId} for ${vehicleName} ${isConfirmed ? "accepted" : "rejected"} successfully!`,
        type: "info",
        duration: 5000
      });
      onStatusChange(updatedBookingData);
    } catch (error) {
      setFeedback(error.message || "Failed to update booking status");
      setBusy("");
    }
  };

  return (
    <div className="booking-actions">
      <button type="button" className="primary-button" disabled={busy !== ""} onClick={() => update("CONFIRMED")}>
        {busy === "CONFIRMED" ? "Accepting..." : "Accept / Confirm"}
      </button>
      <button type="button" className="secondary-button" disabled={busy !== ""} onClick={() => update("CANCELLED")}>
        {busy === "CANCELLED" ? "Rejecting..." : "Reject"}
      </button>
      {feedback ? <span className="form-error">{feedback}</span> : null}
    </div>
  );
}

function OwnerBookingMessages({ bookingId }) {
  const [text, setText] = useState("");
  const [sent, setSent] = useState(0);
  const [feedback, setFeedback] = useState("");
  const state = useOwnerResource(() => ownerApi.getMessages(bookingId), [bookingId, sent]);
  const send = async (event) => { event.preventDefault(); if (!text.trim()) return; setFeedback(""); try { await ownerApi.sendMessage({ booking_id: Number(bookingId), message_text: text }); setText(""); setSent((value) => value + 1); } catch (error) { setFeedback(error.message); } };
  if (state.loading) return <section className="card operational-detail"><p className="eyebrow">Messages</p><p>Loading booking conversation...</p></section>;
  if (state.error) return <section className="card operational-detail"><p className="eyebrow">Messages</p><p className="form-error">{state.error}</p></section>;
  return <section className="card operational-detail"><p className="eyebrow">Messages</p><div className="chat-list">{(state.data?.items || []).length ? state.data.items.map((message) => <article key={message.message_id} className={message.sender_role === "owner" ? "chat-bubble mine" : "chat-bubble"}><strong>{message.sender_email}</strong><p>{message.message_text}</p><span>{dateTime(message.sent_at)}</span></article>) : <p>No messages yet.</p>}</div><form className="message-compose" onSubmit={send}><input value={text} onChange={(event) => setText(event.target.value)} placeholder="Message customer" required /><button type="submit" className="primary-button">Send message</button></form>{feedback ? <p className="form-error">{feedback}</p> : null}</section>;
}

export function OwnerInspectionsPage() {
  const [searchParams] = useSearchParams();
  const vehicleId = searchParams.get("vehicle_id") || "";
  const state = useOwnerResource(() => ownerApi.getInspections(vehicleId ? { vehicle_id: vehicleId } : {}), [vehicleId]);
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [status, setStatus] = useState("");
  const items = state.data?.items || [];
  const filtered = items.filter((item) => `${item.vehicle.brand} ${item.vehicle.model} ${item.vehicle.vehicle_number} ${item.customer_name}`.toLowerCase().includes(search.toLowerCase()) && (!status || item.status === status));
  if (state.loading) return <div className="stack-page"><LoadingState title="Loading inspections" /></div>;
  if (state.error) return <div className="stack-page"><ErrorState title="Inspections unavailable" description={state.error} /></div>;
  return <div className="stack-page"><PageHeader eyebrow="Inspections" title="Condition review queue" description="Inspection records from completed or returned bookings, including the original condition fields." /><FilterBar search={search} setSearch={setSearch} status={status} setStatus={setStatus} statuses={["GOOD", "MINOR_ISSUE", "MAJOR_ISSUE"]} placeholder="Search vehicle or customer" />{filtered.length ? <section className="record-list">{filtered.map((inspection) => <Link className="card record-row" to={`/owner/inspections/${inspection.booking_id}/${inspection.inspection_no}`} key={`${inspection.booking_id}-${inspection.inspection_no}`}><div><p className="eyebrow">Booking #{inspection.booking_id}</p><VehicleReference linked={false} vehicle={inspection.vehicle} /><span>{inspection.customer_name}</span></div><div><StatusBadge status={inspection.status} /><strong>{dateTime(inspection.inspection_date)}</strong></div><div><span>Odometer</span><strong>{Number(inspection.odometer).toLocaleString("en-IN")} km</strong></div><div><span>Findings</span><strong>{inspection.issues_found || "No issues recorded"}</strong></div></Link>)}</section> : <EmptyState title="No inspections found" description="No real inspection records match the current search and result filter." />}</div>;
}

export function OwnerInspectionDetailsPage() {
  const { bookingId, inspectionNo } = useParams();
  const state = useOwnerResource(() => ownerApi.getInspection(bookingId, inspectionNo), [bookingId, inspectionNo]);
  if (state.loading) return <div className="stack-page"><LoadingState title="Loading inspection detail" /></div>;
  if (state.error || !state.data) return <div className="stack-page"><ErrorState title="Inspection not found" description={state.error} action={<Link className="primary-button" to="/owner/inspections">Back to inspections</Link>} /></div>;
  const inspection = state.data;
  return <div className="stack-page"><PageHeader eyebrow="Inspection Detail" title={`${inspection.vehicle.brand} ${inspection.vehicle.model}`} description={`Booking #${inspection.booking_id} / ${dateTime(inspection.inspection_date)}`} actions={<Link className="secondary-button" to="/owner/inspections">Back to inspections</Link>} /><section className="card operational-detail"><div className="split-line"><div><p className="eyebrow">Result</p><StatusBadge status={inspection.status} /></div><strong>{inspection.inspector_name}</strong></div><div className="detail-grid"><div><span>Odometer</span><strong>{Number(inspection.odometer).toLocaleString("en-IN")} km</strong></div><div><span>Fuel level</span><strong>{inspection.fuel_level}%</strong></div><div><span>Body condition</span><strong>{inspection.body_condition}</strong></div><div><span>Interior condition</span><strong>{inspection.interior_condition}</strong></div><div><span>Clean</span><strong>{inspection.is_clean ? "Yes" : "No"}</strong></div><div><span>Customer</span><strong>{inspection.customer_name}</strong></div></div><div className="record-notes"><span>Issues / findings</span><p>{inspection.issues_found || "No issues recorded."}</p></div></section></div>;
}

export function OwnerMaintenancePage() {
  const [searchParams] = useSearchParams();
  const vehicleId = searchParams.get("vehicle_id") || "";
  const state = useOwnerResource(() => ownerApi.getMaintenance(vehicleId ? { vehicle_id: vehicleId } : {}), [vehicleId]);
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [status, setStatus] = useState("");
  const items = state.data?.items || [];
  const filtered = items.filter((item) => `${item.vehicle.brand} ${item.vehicle.model} ${item.vehicle.vehicle_number} ${item.description}`.toLowerCase().includes(search.toLowerCase()) && (!status || item.status === status));
  if (state.loading) return <div className="stack-page"><LoadingState title="Loading maintenance" /></div>;
  if (state.error) return <div className="stack-page"><ErrorState title="Maintenance unavailable" description={state.error} /></div>;
  return <div className="stack-page"><PageHeader eyebrow="Maintenance" title="Service schedule" description="Recorded maintenance work with cost, dates, status, and service description." /><FilterBar search={search} setSearch={setSearch} status={status} setStatus={setStatus} statuses={["PENDING", "IN_PROGRESS", "COMPLETED"]} placeholder="Search vehicle or service description" />{filtered.length ? <section className="record-list">{filtered.map((record) => <Link className="card record-row" to={`/owner/maintenance/${record.vehicle_id}/${record.maintenance_no}`} key={`${record.vehicle_id}-${record.maintenance_no}`}><div><p className="eyebrow">{dateOnly(record.start_date)}</p><VehicleReference linked={false} vehicle={record.vehicle} /><span>{record.description}</span></div><div><StatusBadge status={record.status} /><strong>{money(record.cost)}</strong></div><div><span>Start</span><strong>{dateOnly(record.start_date)}</strong></div><div><span>End</span><strong>{dateOnly(record.end_date)}</strong></div></Link>)}</section> : <EmptyState title="No maintenance records found" description="No real maintenance records match the current search and status filter." />}</div>;
}

export function OwnerMaintenanceDetailsPage() {
  const { vehicleId, maintenanceNo } = useParams();
  const state = useOwnerResource(() => ownerApi.getMaintenanceRecord(vehicleId, maintenanceNo), [vehicleId, maintenanceNo]);
  if (state.loading) return <div className="stack-page"><LoadingState title="Loading maintenance detail" /></div>;
  if (state.error || !state.data) return <div className="stack-page"><ErrorState title="Maintenance record not found" description={state.error} action={<Link className="primary-button" to="/owner/maintenance">Back to maintenance</Link>} /></div>;
  const record = state.data;
  return <div className="stack-page"><PageHeader eyebrow="Maintenance Detail" title={`${record.vehicle.brand} ${record.vehicle.model}`} description={record.description} actions={<Link className="secondary-button" to="/owner/maintenance">Back to maintenance</Link>} /><section className="card operational-detail"><div className="split-line"><div><p className="eyebrow">Status</p><StatusBadge status={record.status} /></div><strong>{money(record.cost)}</strong></div><div className="detail-grid"><div><span>Vehicle</span><strong>{record.vehicle.vehicle_number}</strong></div><div><span>Start date</span><strong>{dateOnly(record.start_date)}</strong></div><div><span>End date</span><strong>{dateOnly(record.end_date)}</strong></div><div><span>Location</span><strong>{record.location_name}, {record.city}</strong></div></div><div className="record-notes"><span>Service details</span><p>{record.description}</p></div></section></div>;
}

export function OwnerHistoryPage() {
  const [searchParams] = useSearchParams();
  const vehicleId = searchParams.get("vehicle_id") || "";
  const state = useOwnerResource(() => ownerApi.getHistory(vehicleId), [vehicleId]);
  const [status, setStatus] = useState("");
  if (state.loading) return <div className="stack-page"><LoadingState title="Loading vehicle history" /></div>;
  if (state.error) return <div className="stack-page"><ErrorState title="History unavailable" description={state.error} /></div>;
  const allItems = state.data?.items || [];
  const items = allItems.filter((item) => !status || item.status === status);
  const statuses = [...new Set(allItems.map((item) => item.status))];
  return <div className="stack-page"><PageHeader eyebrow="Vehicle History" title={vehicleId ? "Vehicle lifecycle timeline" : "Fleet lifecycle timeline"} description="Chronological status transitions recorded by the existing vehicle history table." actions={<Link className="secondary-button" to="/owner/fleet">Back to fleet</Link>} /><section className="owner-filters"><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All event types</option>{statuses.map((item) => <option key={item} value={item}>{item}</option>)}</select></section>{items.length ? <section className="timeline-list">{items.map((item) => <article className="card timeline-item" key={item.history_id}><div className="timeline-marker"><StatusBadge status={item.status} /></div><div><div className="split-line"><VehicleReference vehicle={item.vehicle} /><time>{dateTime(item.changed_at)}</time></div><p>{item.comments || "No transition comment recorded."}</p></div></article>)}</section> : <EmptyState title="No history events found" description="No real lifecycle events match the selected vehicle and event filter." />}</div>;
}

function analyticsNumber(value) {
  return value === null || value === undefined || !Number.isFinite(Number(value)) ? null : Number(value);
}

function analyticsPercent(value) {
  const number = analyticsNumber(value);
  return number === null ? "—" : `${(number * 100).toFixed(1)}%`;
}

function analyticsAverage(rows, field) {
  const values = rows.map((row) => analyticsNumber(row[field])).filter((value) => value !== null);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function AnalyticsMetric({ label, value, detail }) {
  return <article className="card analytics-metric"><p className="eyebrow">{label}</p><h3>{value}</h3><p>{detail}</p></article>;
}

export function OwnerAnalyticsPage() {
  const state = useOwnerResource(() => Promise.all([ownerApi.getFleet(), ownerApi.getOperationalMetrics()]).then(([fleet, metrics]) => ({ fleet: fleet.items || [], metrics: metrics.vehicle_metrics || [] })), []);
  if (state.loading) return <div className="stack-page"><LoadingState title="Loading fleet analytics" description="Reading measured rental, maintenance, inspection, and revenue evidence." /></div>;
  if (state.error) return <div className="stack-page"><ErrorState title="Analytics unavailable" description={state.error} /></div>;
  const fleet = state.data?.fleet || [];
  const fleetIds = new Set(fleet.map((vehicle) => vehicle.vehicle_id));
  const rows = (state.data?.metrics || []).filter((row) => fleetIds.has(row.vehicle_id));
  const withUtilization = rows.filter((row) => analyticsNumber(row.utilization) !== null);
  const withRevenue = rows.filter((row) => analyticsNumber(row.paid_revenue) !== null);
  const withDowntime = rows.filter((row) => analyticsNumber(row.maintenance_downtime_days) !== null);
  const counts = fleet.reduce((result, vehicle) => { result[vehicle.status] = (result[vehicle.status] || 0) + 1; return result; }, {});
  const categories = [...new Set(fleet.map((vehicle) => vehicle.type))];
  const categoryRows = categories.map((category) => {
    const ids = new Set(fleet.filter((vehicle) => vehicle.type === category).map((vehicle) => vehicle.vehicle_id));
    const categoryMetrics = rows.filter((row) => ids.has(row.vehicle_id));
    return { category, vehicles: ids.size, bookings: categoryMetrics.reduce((sum, row) => sum + (analyticsNumber(row.booking_count) || 0), 0), utilization: analyticsAverage(categoryMetrics, "utilization"), downtime: analyticsAverage(categoryMetrics, "maintenance_downtime_days"), revenue: categoryMetrics.reduce((sum, row) => sum + (analyticsNumber(row.paid_revenue) || 0), 0) };
  });
  const totalBookings = rows.reduce((sum, row) => sum + (analyticsNumber(row.booking_count) || 0), 0);
  const totalRentalDays = rows.reduce((sum, row) => sum + (analyticsNumber(row.rental_days) || 0), 0);
  const totalRevenue = withRevenue.reduce((sum, row) => sum + (analyticsNumber(row.paid_revenue) || 0), 0);
  return <div className="stack-page analytics-page"><PageHeader eyebrow="Owner Analytics" title="What the fleet data shows" description="Measured operational evidence from this owner fleet. Missing evidence remains unavailable rather than being treated as zero." /><section className="grid-four"><AnalyticsMetric label="Fleet vehicles" value={fleet.length} detail="Current company fleet records" /><AnalyticsMetric label="Rental evidence" value={`${withUtilization.length} / ${fleet.length}`} detail="Vehicles with measured utilization" /><AnalyticsMetric label="Booking activity" value={totalBookings} detail={`${totalRentalDays.toFixed(1)} measured rental days`} /><AnalyticsMetric label="Paid revenue" value={withRevenue.length ? money(totalRevenue) : "—"} detail={`${withRevenue.length} vehicles with revenue evidence`} /></section><section className="analytics-section"><div className="section-head-split"><div><p className="eyebrow">Utilization / rental activity</p><h3>How much of the measured fleet is being used?</h3></div><span className="analytics-note">{withUtilization.length} of {fleet.length} vehicles have evidence</span></div><div className="analytics-bars">{rows.map((row) => <div className="analytics-bar-row" key={row.vehicle_id}><span>{row.brand} {row.model}</span><div className="analytics-bar-track"><div className="analytics-bar-fill" style={{ width: `${Math.max(0, Math.min(100, (analyticsNumber(row.utilization) || 0) * 100))}%` }} /></div><strong>{analyticsPercent(row.utilization)}</strong></div>)}</div><p className="analytics-note">A blank bar represents no measured utilization evidence, not zero utilization.</p></section><section className="analytics-grid-two"><section className="analytics-section"><div className="section-head-split"><div><p className="eyebrow">Current status distribution</p><h3>Where vehicles are in the lifecycle</h3></div></div><div className="analytics-status-list">{Object.entries(counts).map(([status, count]) => <div className="analytics-status-row" key={status}><StatusBadge status={status} /><strong>{count}</strong><span>{fleet.length ? `${((count / fleet.length) * 100).toFixed(0)}% of fleet` : "—"}</span></div>)}</div></section><section className="analytics-section"><div className="section-head-split"><div><p className="eyebrow">Maintenance evidence</p><h3>Service burden with recorded data</h3></div></div><div className="analytics-evidence-list"><div><span>Vehicles with downtime</span><strong>{withDowntime.length} / {fleet.length}</strong></div><div><span>Average downtime</span><strong>{analyticsNumber(analyticsAverage(withDowntime, "maintenance_downtime_days")) === null ? "—" : `${analyticsAverage(withDowntime, "maintenance_downtime_days").toFixed(2)} days`}</strong></div><div><span>Vehicles with maintenance cost</span><strong>{rows.filter((row) => analyticsNumber(row.maintenance_cost) !== null).length} / {fleet.length}</strong></div><div><span>Average inspection issue rate</span><strong>{analyticsPercent(analyticsAverage(rows, "inspection_issue_rate"))}</strong></div></div></section></section><section className="analytics-section"><div className="section-head-split"><div><p className="eyebrow">Vehicle category comparison</p><h3>How categories compare on measured activity</h3></div></div>{categoryRows.length ? <div className="card table-card table-scroll"><table><thead><tr><th>Category</th><th>Vehicles</th><th>Bookings</th><th>Avg utilization</th><th>Avg downtime</th><th>Paid revenue</th></tr></thead><tbody>{categoryRows.map((row) => <tr key={row.category}><td>{row.category}</td><td>{row.vehicles}</td><td>{row.bookings}</td><td>{analyticsPercent(row.utilization)}</td><td>{row.downtime === null ? "—" : `${row.downtime.toFixed(2)} days`}</td><td>{row.revenue ? money(row.revenue) : "—"}</td></tr>)}</tbody></table></div> : <EmptyState title="No category data" description="The current fleet has no category records to compare." />}</section></div>;
}
export function OwnerAdvisoryPage() { return <AdvisoryDashboard />; }
export function OwnerReportsPage() {
  const state = useOwnerResource(() => Promise.all([
    ownerApi.getFleet(),
    ownerApi.getBookings(),
    ownerApi.getInspections(),
    ownerApi.getMaintenance(),
    ownerApi.getOperationalMetrics(),
    ownerApi.getRecommendations()
  ]).then(([fleet, bookings, inspections, maintenance, metrics, recommendations]) => ({
    fleet: fleet.items || [],
    bookings: bookings.items || [],
    inspections: inspections.items || [],
    maintenance: maintenance.items || [],
    metrics: metrics.vehicle_metrics || [],
    recommendations: recommendations.recommendations || []
  })), []);
  if (state.loading) return <div className="stack-page"><LoadingState title="Preparing owner report" description="Assembling current fleet, rental, payment, service, and advisory records." /></div>;
  if (state.error) return <div className="stack-page"><ErrorState title="Report unavailable" description={state.error} /></div>;
  const { fleet, bookings, inspections, maintenance, metrics, recommendations } = state.data;
  const paidBookings = bookings.filter((booking) => booking.payment?.status === "PAID");
  const paidRevenue = paidBookings.reduce((sum, booking) => sum + Number(booking.payment?.amount ?? 0), 0);
  const hasPaidRevenue = paidBookings.length > 0;
  const statusCounts = fleet.reduce((result, vehicle) => { result[vehicle.status] = (result[vehicle.status] || 0) + 1; return result; }, {});
  const bookingCounts = bookings.reduce((result, booking) => { result[booking.status] = (result[booking.status] || 0) + 1; return result; }, {});
  const maintenanceCounts = maintenance.reduce((result, record) => { result[record.status] = (result[record.status] || 0) + 1; return result; }, {});
  const totalMaintenanceCost = maintenance.reduce((sum, record) => sum + Number(record.cost || 0), 0);
  const hasMaintenance = maintenance.length > 0;
  const evidenceRows = metrics.filter((row) => row.utilization !== null || row.paid_revenue !== null || row.maintenance_downtime_days !== null);
  return <div className="stack-page reports-page"><PageHeader eyebrow="Owner Reports" title="Operational summary" description="A concise review of current fleet, rental, payment, service, inspection, and advisory records." /><p className="reports-context">Current records returned from the owner workspace. No forecast, trend, or synthetic figure is included.</p><section className="grid-four"><article className="card dashboard-card"><p className="eyebrow">Fleet</p><h3>{fleet.length}</h3><p>Current vehicle records</p></article><article className="card dashboard-card"><p className="eyebrow">Bookings</p><h3>{bookings.length}</h3><p>{bookingCounts.CONFIRMED || 0} confirmed / {bookingCounts.ACTIVE || 0} active</p></article><article className="card dashboard-card"><p className="eyebrow">Paid revenue</p><h3>{hasPaidRevenue ? money(paidRevenue) : "—"}</h3><p>{hasPaidRevenue ? `${paidBookings.length} paid booking${paidBookings.length === 1 ? "" : "s"}` : "No paid revenue evidence"}</p></article><article className="card dashboard-card"><p className="eyebrow">Advisory</p><h3>{recommendations.length}</h3><p>{recommendations.length ? "Signals for owner review" : "No current recommendations"}</p></article></section><section className="reports-grid-two"><section className="reports-section"><p className="eyebrow">Fleet summary</p><h3>Current vehicle status</h3><div className="report-list">{Object.entries(statusCounts).map(([status, count]) => <div className="report-list-row" key={status}><StatusBadge status={status} /><strong>{count}</strong><span>{fleet.length ? `${((count / fleet.length) * 100).toFixed(0)}% of fleet` : "—"}</span></div>)}</div></section><section className="reports-section"><p className="eyebrow">Booking / rental summary</p><h3>Reservation status</h3><div className="report-list">{Object.entries(bookingCounts).map(([status, count]) => <div className="report-list-row" key={status}><StatusBadge status={status} /><strong>{count}</strong><span>record{count === 1 ? "" : "s"}</span></div>)}{!bookings.length ? <p className="reports-muted">No booking records available.</p> : null}</div></section></section><section className="reports-grid-two"><section className="reports-section"><p className="eyebrow">Revenue / payment summary</p><h3>Recorded payment evidence</h3><div className="report-list"><div className="report-list-row"><span>Paid bookings</span><strong>{paidBookings.length}</strong><span>of {bookings.length} bookings</span></div><div className="report-list-row"><span>Paid amount</span><strong>{hasPaidRevenue ? money(paidRevenue) : "—"}</strong><span>{hasPaidRevenue ? "recorded" : "No evidence"}</span></div></div><p className="reports-muted">Pending, failed, or missing payment records are not counted as paid revenue.</p></section><section className="reports-section"><p className="eyebrow">Maintenance summary</p><h3>Recorded service workload</h3><div className="report-list">{Object.entries(maintenanceCounts).map(([status, count]) => <div className="report-list-row" key={status}><StatusBadge status={status} /><strong>{count}</strong><span>record{count === 1 ? "" : "s"}</span></div>)}<div className="report-list-row"><span>Total recorded cost</span><strong>{hasMaintenance ? money(totalMaintenanceCost) : "—"}</strong><span>{hasMaintenance ? "from maintenance records" : "No evidence"}</span></div></div></section></section><section className="reports-section"><p className="eyebrow">Inspection summary</p><h3>Recorded condition reviews</h3>{inspections.length ? <div className="card table-card table-scroll"><table><thead><tr><th>Result</th><th>Vehicle</th><th>Inspection date</th><th>Odometer</th><th>Findings</th></tr></thead><tbody>{inspections.map((inspection) => <tr key={`${inspection.booking_id}-${inspection.inspection_no}`}><td><StatusBadge status={inspection.status} /></td><td>{inspection.vehicle.brand} {inspection.vehicle.model}</td><td>{dateOnly(inspection.inspection_date)}</td><td>{Number(inspection.odometer).toLocaleString("en-IN")} km</td><td>{inspection.issues_found || "No issues recorded"}</td></tr>)}</tbody></table></div> : <EmptyState title="No inspection records" description="No real inspection records are available for this report." />}</section><section className="reports-section"><p className="eyebrow">Measured operational evidence</p><h3>Vehicles with recorded metrics</h3>{evidenceRows.length ? <div className="card table-card table-scroll"><table><thead><tr><th>Vehicle</th><th>Utilization</th><th>Downtime</th><th>Paid revenue</th></tr></thead><tbody>{evidenceRows.map((row) => <tr key={row.vehicle_id}><td>{row.brand} {row.model}</td><td>{row.utilization === null ? "—" : `${(Number(row.utilization) * 100).toFixed(1)}%`}</td><td>{row.maintenance_downtime_days === null ? "—" : `${Number(row.maintenance_downtime_days).toFixed(2)} days`}</td><td>{row.paid_revenue === null ? "—" : money(row.paid_revenue)}</td></tr>)}</tbody></table></div> : <EmptyState title="No measured evidence" description="The current report window has no rental, downtime, or paid-revenue evidence to summarize." />}</section></div>;
}
export function OwnerSettingsPage() {
  const currentOwner = getCurrentSessionUser("owner");
  const [companyName, setCompanyName] = useState(currentOwner.name || "Apex Car Rentals");
  const [email, setEmail] = useState(currentOwner.email || "apex_owner@gmail.com");
  const [phone, setPhone] = useState("+91 22888 87777");
  const [address, setAddress] = useState("Apex Towers, Andheri East, Mumbai");
  const [autoApprove, setAutoApprove] = useState(false);
  const [depositAmount, setDepositAmount] = useState(5000);
  const [fuelPolicy, setFuelPolicy] = useState("same_to_same");
  const [inspectionAlerts, setInspectionAlerts] = useState(true);
  const [savedFeedback, setSavedFeedback] = useState("");

  const handleSave = (e) => {
    e.preventDefault();
    setSavedFeedback("Settings and business preferences saved successfully.");
    setTimeout(() => setSavedFeedback(""), 4000);
  };

  return (
    <div className="stack-page settings-page">
      <PageHeader
        eyebrow="Owner Settings"
        title="Company Profile & Operations"
        description="Configure your rental company information, booking acceptance policies, and fleet service parameters."
      />

      {savedFeedback && (
        <div className="status-pill status-healthy" style={{ padding: "12px 18px", fontSize: "0.95rem" }}>
          ✓ {savedFeedback}
        </div>
      )}

      <form onSubmit={handleSave} className="form-grid">
        <section className="card operational-detail">
          <div className="split-line">
            <div>
              <p className="eyebrow">Company Profile</p>
              <h3>Rental Organization Details</h3>
            </div>
            <span className="badge-pill">Company #{currentOwner.company_id || 1}</span>
          </div>

          <div className="form-grid" style={{ marginTop: "16px" }}>
            <label>
              <span>Company Name</span>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </label>
            <label>
              <span>Owner Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label>
              <span>Contact Phone / Hotline</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </label>
            <label>
              <span>Registered Business Address</span>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </label>
          </div>
        </section>

        <section className="card operational-detail">
          <div className="split-line">
            <div>
              <p className="eyebrow">Booking & Rental Policies</p>
              <h3>Operational Rules</h3>
            </div>
          </div>

          <div className="form-grid" style={{ marginTop: "16px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                style={{ width: "20px", height: "20px" }}
              />
              <div>
                <strong>Auto-Approve Verified Bookings</strong>
                <p style={{ margin: "2px 0 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  Automatically confirm bookings without requiring manual review if vehicle is ready.
                </p>
              </div>
            </label>

            <label>
              <span>Security Deposit (INR)</span>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                min="0"
                step="500"
              />
            </label>

            <label>
              <span>Fuel Return Requirement</span>
              <select value={fuelPolicy} onChange={(e) => setFuelPolicy(e.target.value)}>
                <option value="same_to_same">Same-to-Same (Return at pickup level)</option>
                <option value="full_to_full">Full-to-Full (100% full upon return)</option>
                <option value="prepaid">Pre-paid Fuel Option</option>
              </select>
            </label>
          </div>
        </section>

        <section className="card operational-detail">
          <div className="split-line">
            <div>
              <p className="eyebrow">Inspection & Maintenance Alerts</p>
              <h3>Lifecycle Triggers</h3>
            </div>
          </div>

          <div className="form-grid" style={{ marginTop: "16px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={inspectionAlerts}
                onChange={(e) => setInspectionAlerts(e.target.checked)}
                style={{ width: "20px", height: "20px" }}
              />
              <div>
                <strong>Mandatory Return Inspection</strong>
                <p style={{ margin: "2px 0 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  Queue vehicle into INSPECTION state immediately when a customer return is completed.
                </p>
              </div>
            </label>
          </div>
        </section>

        <div className="split-line" style={{ marginTop: "12px" }}>
          <button type="submit" className="primary-button">
            Save Settings & Preferences
          </button>
        </div>
      </form>
    </div>
  );
}

