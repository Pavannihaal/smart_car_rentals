import { StatusBadge } from "./common";

export function FleetVehicleCard({ vehicle }) {
  return (
    <article className="card fleet-card">
      <div className="split-line">
        <div>
          <p className="eyebrow">{vehicle.vehicle_number}</p>
          <h3>
            {vehicle.brand} {vehicle.model}
          </h3>
        </div>
        <StatusBadge status={vehicle.status} />
      </div>
      <p>
        {vehicle.company_name} · {vehicle.location_name}
      </p>
      <div className="vehicle-stats">
        <span>{vehicle.year}</span>
        <span>{vehicle.mileage} km</span>
        <span>Fuel {vehicle.current_fuel_level}%</span>
      </div>
    </article>
  );
}

export function FleetPipeline({ items }) {
  return (
    <section className="card pipeline-card">
      <p className="eyebrow">Lifecycle Pipeline</p>
      <div className="pipeline-grid">
        {items.map((item) => (
          <div key={item.stage} className="pipeline-node">
            <strong>{item.count}</strong>
            <span>{item.stage}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function BookingTable({ rows }) {
  return (
    <div className="card table-card">
      <table>
        <thead>
          <tr>
            <th>Booking</th>
            <th>Vehicle</th>
            <th>Status</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.booking_id}>
              <td>#{row.booking_id}</td>
              <td>{row.vehicle_label}</td>
              <td>{row.status}</td>
              <td>Rs {row.total_amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MaintenanceCard({ title, detail, status }) {
  return (
    <article className="card maintenance-card">
      <div className="split-line">
        <h3>{title}</h3>
        <StatusBadge status={status} />
      </div>
      <p>{detail}</p>
    </article>
  );
}

export function InspectionCard({ inspector, outcome, note }) {
  return (
    <article className="card inspection-card">
      <p className="eyebrow">{inspector}</p>
      <h3>{outcome}</h3>
      <p>{note}</p>
    </article>
  );
}

export function VehicleTimeline({ events }) {
  return (
    <section className="card timeline-card">
      <p className="eyebrow">Vehicle Timeline</p>
      <div className="timeline-list">
        {events.map((event) => (
          <div key={`${event.label}-${event.date}`} className="timeline-item">
            <strong>{event.label}</strong>
            <span>{event.date}</span>
            <p>{event.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
