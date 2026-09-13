import { matchPath } from "react-router-dom";
import { users } from "../data/users";

const customerArea = {
  title: "Customer",
  subtitle: "Browse cars, track bookings, and stay in touch with rental owners.",
  topbarLabel: "Customer Workspace",
  currentUser: {
    name: users.customer.name,
    detail: "Verified customer"
  },
  sections: [
    {
      title: "Navigate",
      items: [
        { to: "/", label: "← Public Home", caption: "Return to public landing page" },
        { to: "/customer", label: "Customer Home", caption: "Overview and quick actions", end: true },
        { to: "/customer/search", label: "Search Cars", caption: "Explore available vehicles" },
        { to: "/customer/bookings", label: "My Bookings", caption: "Current and past rentals" },
        { to: "/customer/messages", label: "Messages", caption: "Booking conversations" },
        { to: "/customer/payments", label: "Payments", caption: "Payment records" },
        { to: "/customer/profile", label: "Profile", caption: "License and account details" }
      ]
    }
  ]
};

const ownerArea = {
  title: "Rental Owner",
  subtitle: "Coordinate fleet operations, reservations, inspections, and service.",
  topbarLabel: "Owner Operations",
  currentUser: {
    name: users.owner.company_name,
    detail: "Fleet admin"
  },
  sections: [
    {
      title: "Navigate",
      items: [
        { to: "/", label: "← Public Home", caption: "Return to public landing page" },
        { to: "/owner", label: "Dashboard", caption: "Operations overview", end: true },
        { to: "/owner/fleet", label: "Fleet", caption: "Inventory and availability" },
        { to: "/owner/bookings", label: "Bookings", caption: "Reservation management" },
        { to: "/owner/inspections", label: "Inspections", caption: "Condition checkpoints" },
        { to: "/owner/maintenance", label: "Maintenance", caption: "Service workload" },
        { to: "/owner/history", label: "Vehicle History", caption: "Lifecycle records" },
        { to: "/owner/analytics", label: "Analytics", caption: "Performance summary" },
        { to: "/owner/advisory", label: "Advisory", caption: "Explainable fleet signals" },
        { to: "/owner/reports", label: "Reports", caption: "Operational summaries" },
        { to: "/owner/settings", label: "Settings", caption: "Business preferences" }
      ]
    },
    {
      title: "Fleet Views",
      items: [
        { to: "/owner/fleet", label: "All Vehicles", caption: "Complete fleet list" },
        { to: "/owner/fleet?filter=available", label: "Available", caption: "Ready for booking" },
        { to: "/owner/fleet?filter=reserved", label: "Reserved", caption: "Assigned and upcoming" },
        { to: "/owner/fleet?filter=rented", label: "Rented", caption: "Active trips" },
        { to: "/owner/fleet?filter=inspection", label: "Inspection", caption: "Condition review queue" },
        { to: "/owner/fleet?filter=maintenance", label: "Maintenance", caption: "Service and repair" }
      ]
    }
  ]
};

const routeDefinitions = [
  {
    path: "/customer/bookings/:id/chat",
    title: "Booking Chat",
    description: "Conversation and call placeholder for a booking.",
    breadcrumbs: ({ id }) => [
      { label: "Customer", to: "/customer" },
      { label: "Bookings", to: "/customer/bookings" },
      { label: `Booking #${id}`, to: `/customer/bookings/${id}` },
      { label: "Chat" }
    ]
  },
  {
    path: "/customer/bookings/:id",
    title: "Booking Details",
    description: "View the status, timeline, and summary for one rental.",
    breadcrumbs: ({ id }) => [
      { label: "Customer", to: "/customer" },
      { label: "Bookings", to: "/customer/bookings" },
      { label: `Booking #${id}` }
    ]
  },
  {
    path: "/customer/vehicles/:id",
    title: "Vehicle Details",
    description: "Inspect a vehicle before confirming a booking.",
    breadcrumbs: ({ id }) => [
      { label: "Customer", to: "/customer" },
      { label: "Search Cars", to: "/customer/search" },
      { label: `Vehicle #${id}` }
    ]
  },
  {
    path: "/customer/book/:id",
    title: "Booking Workflow",
    description: "Select dates, review pricing, and continue to the next booking step.",
    breadcrumbs: ({ id }) => [
      { label: "Customer", to: "/customer" },
      { label: "Search Cars", to: "/customer/search" },
      { label: `Vehicle #${id}`, to: `/customer/vehicles/${id}` },
      { label: "Book" }
    ]
  },
  {
    path: "/customer/book",
    title: "Booking Workflow",
    description: "Temporary booking shell for the customer flow.",
    breadcrumbs: () => [
      { label: "Customer", to: "/customer" },
      { label: "Book" }
    ]
  },
  {
    path: "/customer/search",
    title: "Search Cars",
    description: "Browse the fleet by type, availability, and trip fit.",
    breadcrumbs: () => [
      { label: "Customer", to: "/customer" },
      { label: "Search Cars" }
    ]
  },
  {
    path: "/customer/bookings",
    title: "My Bookings",
    description: "Track current and past reservations in one place.",
    breadcrumbs: () => [
      { label: "Customer", to: "/customer" },
      { label: "My Bookings" }
    ]
  },
  {
    path: "/customer/messages",
    title: "Messages",
    description: "Development route for customer conversations before full chat features arrive.",
    breadcrumbs: () => [
      { label: "Customer", to: "/customer" },
      { label: "Messages" }
    ]
  },
  {
    path: "/customer/payments",
    title: "Payments",
    description: "Review payment records linked to your rentals.",
    breadcrumbs: () => [
      { label: "Customer", to: "/customer" },
      { label: "Payments" }
    ]
  },
  {
    path: "/customer/profile",
    title: "Profile",
    description: "Review account and license information.",
    breadcrumbs: () => [
      { label: "Customer", to: "/customer" },
      { label: "Profile" }
    ]
  },
  {
    path: "/customer",
    title: "Customer Home",
    description: "Quick access to the browsing and booking journey.",
    breadcrumbs: () => [{ label: "Customer" }]
  },
  {
    path: "/owner/vehicles/:id",
    title: "Vehicle History",
    description: "Lifecycle detail for one fleet vehicle.",
    breadcrumbs: ({ id }) => [
      { label: "Owner", to: "/owner" },
      { label: "Fleet", to: "/owner/fleet" },
      { label: `Vehicle #${id}` }
    ]
  },
  {
    path: "/owner/bookings/:id",
    title: "Booking Detail",
    description: "Inspect booking status and operational readiness.",
    breadcrumbs: ({ id }) => [
      { label: "Owner", to: "/owner" },
      { label: "Bookings", to: "/owner/bookings" },
      { label: `Booking #${id}` }
    ]
  },
  {
    path: "/owner/inspections/:bookingId/:inspectionNo",
    title: "Inspection Detail",
    description: "Review one recorded vehicle condition report.",
    breadcrumbs: ({ bookingId }) => [
      { label: "Owner", to: "/owner" },
      { label: "Inspections", to: "/owner/inspections" },
      { label: `Booking #${bookingId}` }
    ]
  },
  {
    path: "/owner/maintenance/:vehicleId/:maintenanceNo",
    title: "Maintenance Detail",
    description: "Review one recorded vehicle service event.",
    breadcrumbs: ({ vehicleId }) => [
      { label: "Owner", to: "/owner" },
      { label: "Maintenance", to: "/owner/maintenance" },
      { label: `Vehicle #${vehicleId}` }
    ]
  },
  {
    path: "/owner/fleet",
    title: "Fleet",
    description: "Inventory, readiness, and grouped fleet views.",
    breadcrumbs: () => [
      { label: "Owner", to: "/owner" },
      { label: "Fleet" }
    ]
  },
  {
    path: "/owner/bookings",
    title: "Bookings",
    description: "Reservation pipeline for incoming and active trips.",
    breadcrumbs: () => [
      { label: "Owner", to: "/owner" },
      { label: "Bookings" }
    ]
  },
  {
    path: "/owner/inspections",
    title: "Inspections",
    description: "Pre and post-rental condition review queue.",
    breadcrumbs: () => [
      { label: "Owner", to: "/owner" },
      { label: "Inspections" }
    ]
  },
  {
    path: "/owner/maintenance",
    title: "Maintenance",
    description: "Monitor pending, active, and completed service work.",
    breadcrumbs: () => [
      { label: "Owner", to: "/owner" },
      { label: "Maintenance" }
    ]
  },
  {
    path: "/owner/history",
    title: "Vehicle History",
    description: "Review lifecycle history and audit-oriented summaries.",
    breadcrumbs: () => [
      { label: "Owner", to: "/owner" },
      { label: "Vehicle History" }
    ]
  },
  {
    path: "/owner/analytics",
    title: "Analytics",
    description: "Track utilization, demand, and operational health.",
    breadcrumbs: () => [
      { label: "Owner", to: "/owner" },
      { label: "Analytics" }
    ]
  },
  {
    path: "/owner/advisory",
    title: "Advisory",
    description: "Explainable fleet signals for owner review.",
    breadcrumbs: () => [
      { label: "Owner", to: "/owner" },
      { label: "Advisory" }
    ]
  },
  {
    path: "/owner/settings",
    title: "Settings",
    description: "Business preferences and owner-side configuration placeholders.",
    breadcrumbs: () => [
      { label: "Owner", to: "/owner" },
      { label: "Settings" }
    ]
  },
  {
    path: "/owner/reports",
    title: "Reports",
    description: "Concise operational summaries for owner review.",
    breadcrumbs: () => [
      { label: "Owner", to: "/owner" },
      { label: "Reports" }
    ]
  },
  {
    path: "/owner",
    title: "Dashboard",
    description: "High-level operational picture for the rental owner.",
    breadcrumbs: () => [{ label: "Owner" }]
  },
  {
    path: "/database/er",
    title: "ER Diagram",
    description: "Relationship overview for the academic DBMS presentation.",
    breadcrumbs: () => [
      { label: "Database", to: "/database" },
      { label: "ER Diagram" }
    ]
  },
  {
    path: "/database/schema",
    title: "Relational Schema",
    description: "Review table structures tied to the implemented PostgreSQL design.",
    breadcrumbs: () => [
      { label: "Database", to: "/database" },
      { label: "Relational Schema" }
    ]
  },
  {
    path: "/database/tables",
    title: "Tables",
    description: "Present column groups for each core relation.",
    breadcrumbs: () => [
      { label: "Database", to: "/database" },
      { label: "Tables" }
    ]
  },
  {
    path: "/database/queries",
    title: "SQL Queries",
    description: "Show the predefined query demonstrations from Phase 2.",
    breadcrumbs: () => [
      { label: "Database", to: "/database" },
      { label: "SQL Queries" }
    ]
  },
  {
    path: "/database",
    title: "Database Overview",
    description: "DBMS showcase area for schema, relations, and query examples.",
    breadcrumbs: () => [{ label: "Database" }]
  }
];

export function getAreaConfig(area) {
  if (area === "customer") {
    return customerArea;
  }

  return ownerArea;
}

export function getRouteMeta(pathname) {
  for (const route of routeDefinitions) {
    const match = matchPath({ path: route.path, end: true }, pathname);

    if (match) {
      return {
        title: route.title,
        description: route.description,
        breadcrumbs: route.breadcrumbs(match.params)
      };
    }
  }

  return {
    title: "SmartCar",
    description: "SmartCar car rental and fleet management interface.",
    breadcrumbs: [{ label: "SmartCar" }]
  };
}
