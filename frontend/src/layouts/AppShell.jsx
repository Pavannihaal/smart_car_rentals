import { Outlet } from "react-router-dom";
import { Navigation } from "../components/shared";

const shellContent = {
  customer: {
    title: "Customer Hub",
    subtitle: "Search vehicles, complete bookings, and stay connected to owners.",
    links: [
      { to: "/customer", label: "Overview", caption: "Trip status and shortcuts", end: true },
      { to: "/customer/search", label: "Search", caption: "Filter and explore cars" },
      { to: "/customer/bookings", label: "My Bookings", caption: "Track current and past rentals" },
      { to: "/customer/profile", label: "Profile", caption: "License and contact info" },
      { to: "/database", label: "Database", caption: "Design-side reference" }
    ]
  },
  owner: {
    title: "Owner Console",
    subtitle: "Manage fleet readiness, bookings, inspections, and maintenance.",
    links: [
      { to: "/owner", label: "Dashboard", caption: "Operations snapshot", end: true },
      { to: "/owner/fleet", label: "Fleet", caption: "Vehicle inventory and states" },
      { to: "/owner/bookings", label: "Bookings", caption: "Reservation pipeline" },
      { to: "/owner/inspections", label: "Inspections", caption: "Condition checks" },
      { to: "/owner/maintenance", label: "Maintenance", caption: "Service schedule" },
      { to: "/owner/analytics", label: "Analytics", caption: "Performance summary" },
      { to: "/database", label: "Database", caption: "Design-side reference" }
    ]
  },
  database: {
    title: "Database Design",
    subtitle: "Present schema, ER flow, table structure, and query examples together.",
    links: [
      { to: "/database", label: "Overview", caption: "Relationship summary", end: true },
      { to: "/database/er", label: "ER Diagram", caption: "Entity connection story" },
      { to: "/database/schema", label: "Schema", caption: "Relational structure" },
      { to: "/database/tables", label: "Tables", caption: "Column-level view" },
      { to: "/database/queries", label: "Queries", caption: "SQL demonstrations" },
      { to: "/customer", label: "Customer", caption: "Return to customer shell" },
      { to: "/owner", label: "Owner", caption: "Return to owner shell" }
    ]
  }
};

export function AppShell({ area }) {
  const content = shellContent[area];

  return (
    <div className="app-shell">
      <Navigation
        title={content.title}
        subtitle={content.subtitle}
        links={content.links}
      />
      <main className="content-shell">
        <Outlet />
      </main>
    </div>
  );
}
