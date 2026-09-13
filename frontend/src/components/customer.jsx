import { Link } from "react-router-dom";
import { StatusBadge } from "./common";
import { fallbackVehicleImage, getVehicleImage } from "../data/vehicleImages";

export function VehicleStatusBadge({ status }) {
  return <StatusBadge status={status} />;
}

export function VehicleCard({ vehicle, featured = false }) {
  return (
    <article className={`card vehicle-card ${featured ? "vehicle-card-featured" : ""}`}>
      <div className="vehicle-image-frame">
        <img src={getVehicleImage(vehicle)} alt={`${vehicle.brand} ${vehicle.model}`} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackVehicleImage; }} />
      </div>
      <div className="vehicle-card-top"><div><p className="eyebrow">{vehicle.brand}</p><h3>{vehicle.model}</h3></div><VehicleStatusBadge status={vehicle.status} /></div>
      <p className="vehicle-meta">{vehicle.location_name}, {vehicle.city}</p>
      <div className="vehicle-stats"><span>{vehicle.type}</span><span>{vehicle.seats} seats</span><span>{vehicle.transmission}</span><span>{vehicle.fuel_type}</span></div>
      <div className="card-foot"><strong className="price-tag">Rs {vehicle.price_per_day.toLocaleString("en-IN")}/day</strong><Link className="primary-button" to={`/customer/vehicles/${vehicle.vehicle_id}`}>View Details</Link></div>
    </article>
  );
}

export function SearchFilters({ filters, options, onChange, onClear }) {
  return (
    <section className="filter-strip customer-filters">
      <label><span>Search</span><input value={filters.search} onChange={(event) => onChange("search", event.target.value)} placeholder="Brand or model" /></label>
      <label><span>Category</span><select value={filters.category} onChange={(event) => onChange("category", event.target.value)}><option value="">All types</option>{options.types.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <label><span>Fuel</span><select value={filters.fuel} onChange={(event) => onChange("fuel", event.target.value)}><option value="">All fuels</option>{options.fuels.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <label><span>Transmission</span><select value={filters.transmission} onChange={(event) => onChange("transmission", event.target.value)}><option value="">Any transmission</option>{options.transmissions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <label><span>Location</span><select value={filters.location} onChange={(event) => onChange("location", event.target.value)}><option value="">All locations</option>{options.locations.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <label className="filter-checkbox"><input type="checkbox" checked={filters.availability === "available"} onChange={(event) => onChange("availability", event.target.checked ? "available" : "")} /><span>Bookable only</span></label>
      <button type="button" className="secondary-button" onClick={onClear}>Clear filters</button>
    </section>
  );
}

export function BookingCard({ booking }) {
  const vehicleLabel = booking.vehicle_label || `${booking.vehicle?.brand || "Vehicle"} ${booking.vehicle?.model || ""}`;
  return <article className="card booking-card"><div className="booking-card-heading">{booking.vehicle ? <img src={getVehicleImage(booking.vehicle)} alt={vehicleLabel} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackVehicleImage; }} /> : null}<div className="split-line"><h3>{vehicleLabel}</h3><VehicleStatusBadge status={booking.status} /></div></div><p>{booking.location_name}{booking.city ? `, ${booking.city}` : ""}</p><div className="booking-dates"><span>{new Date(booking.pickup_datetime).toLocaleString()}</span><span>{new Date(booking.return_datetime).toLocaleString()}</span></div><div className="split-line"><span>Payment: {booking.payment?.payment_status || booking.payment_status || "No record"}</span><strong>Rs {Number(booking.total_amount).toLocaleString("en-IN")}</strong></div></article>;
}

export function BookingSummary({ booking }) {
  const vehicleLabel = booking.vehicle_label || `${booking.vehicle?.brand || "Vehicle"} ${booking.vehicle?.model || ""}`;
  return <section className="card summary-card"><p className="eyebrow">Booking Summary</p><h3>Booking #{booking.booking_id}</h3><dl className="summary-grid"><div><dt>Vehicle</dt><dd>{vehicleLabel}</dd></div><div><dt>Status</dt><dd>{booking.status}</dd></div><div><dt>Pickup</dt><dd>{new Date(booking.pickup_datetime).toLocaleString()}</dd></div><div><dt>Return</dt><dd>{new Date(booking.return_datetime).toLocaleString()}</dd></div><div><dt>Amount</dt><dd>Rs {Number(booking.total_amount).toLocaleString("en-IN")}</dd></div><div><dt>Payment</dt><dd>{booking.payment?.payment_status || booking.payment_status || "No payment record"}</dd></div></dl></section>;
}