import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BookingCard, BookingSummary, SearchFilters, VehicleCard, VehicleStatusBadge } from "../components/customer";
import { EmptyState, ErrorState, LoadingCard, LoadingState, PageHeader, Toast } from "../components/common";
import { getCurrentSessionUser, users } from "../data/users";
import { customerApi } from "../services/customerApi";
import { fallbackVehicleImage, getVehicleImage } from "../data/vehicleImages";

const emptyFilters = { search: "", category: "", fuel: "", transmission: "", location: "", availability: "" };

function useVehicles(filters = {}) {
  const [state, setState] = useState({ loading: true, error: "", items: [] });
  useEffect(() => { let active = true; setState((current) => ({ ...current, loading: true, error: "" })); customerApi.getVehicles(filters).then((payload) => active && setState({ loading: false, error: "", items: payload.items || [] })).catch((error) => active && setState({ loading: false, error: error.message, items: [] })); return () => { active = false; }; }, [JSON.stringify(filters)]);
  return state;
}

function vehicleOptions(items) {
  return { types: [...new Set(items.map((item) => item.type))], fuels: [...new Set(items.map((item) => item.fuel_type))], transmissions: [...new Set(items.map((item) => item.transmission))], locations: [...new Set(items.map((item) => item.city))] };
}

function useCustomerResource(loader, dependencies = []) {
  const [state, setState] = useState({ loading: true, error: "", data: null });
  useEffect(() => { let active = true; setState({ loading: true, error: "", data: null }); loader().then((data) => active && setState({ loading: false, error: "", data })).catch((error) => active && setState({ loading: false, error: error.message, data: null })); return () => { active = false; }; }, dependencies);
  return state;
}

function BookingStatusGroup({ title, items }) {
  if (!items.length) return null;
  return <section><div className="section-head-split"><h3>{title}</h3><span>{items.length}</span></div><section className="grid-two">{items.map((booking) => <Link key={booking.booking_id} className="card-link" to={`/customer/bookings/${booking.booking_id}`}><BookingCard booking={booking} /></Link>)}</section></section>;
}

export function CustomerDashboardPage() {
  const state = useVehicles({ availability: "available" });
  const currentUser = getCurrentSessionUser("customer");
  return <div className="stack-page"><PageHeader eyebrow="Customer" title={`Welcome back, ${currentUser.name}`} description="Find a vehicle for your next trip from the available SmartCar fleet." actions={<Link className="primary-button" to="/customer/search">Browse all cars</Link>} /><section className="customer-discovery-banner"><div><p className="eyebrow">Ready when you are</p><h3>Choose a car that fits the trip.</h3><p>Compare real vehicle details, locations, and daily rates before you reserve.</p></div><Link className="secondary-button" to="/customer/search">Search fleet</Link></section><section><div className="section-head-split"><h3>Available vehicles</h3><Link to="/customer/search">See all</Link></div>{state.loading ? <section className="grid-two"><LoadingCard /><LoadingCard /></section> : state.error ? <ErrorState title="Fleet unavailable" description={state.error} /> : state.items.length ? <section className="catalog-grid">{state.items.slice(0, 3).map((vehicle, index) => <VehicleCard key={vehicle.vehicle_id} vehicle={vehicle} featured={index === 0} />)}</section> : <EmptyState title="No available cars" description="There are no bookable vehicles at the moment." />}</section></div>;
}

export function CustomerSearchPage() {
  const [filters, setFilters] = useState(emptyFilters);
  const state = useVehicles(filters);
  const optionsState = useCustomerResource(() => customerApi.getVehicles().then(({ items }) => vehicleOptions(items)), []);
  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  return <div className="stack-page"><PageHeader eyebrow="Customer Search" title="Find your next vehicle" description="Search the live fleet by brand, model, type, fuel, transmission, and location." actions={<Link className="secondary-button" to="/customer/bookings">View my bookings</Link>} /><SearchFilters filters={filters} options={optionsState.data || { types: [], fuels: [], transmissions: [], locations: [] }} onChange={updateFilter} onClear={() => setFilters(emptyFilters)} />{state.loading ? <section className="catalog-grid"><LoadingCard /><LoadingCard /></section> : state.error ? <ErrorState title="Fleet unavailable" description={state.error} action={<button type="button" className="primary-button" onClick={() => window.location.reload()}>Try again</button>} /> : state.items.length ? <section className="catalog-grid">{state.items.map((vehicle, index) => <VehicleCard key={vehicle.vehicle_id} vehicle={vehicle} featured={index === 0} />)}</section> : <EmptyState title="No vehicles match" description="Try clearing a filter or searching for another model." action={<button type="button" className="secondary-button" onClick={() => setFilters(emptyFilters)}>Clear filters</button>} />}</div>;
}

export function CustomerVehicleDetailsPage() {
  const { id } = useParams();
  const state = useCustomerResource(() => customerApi.getVehicle(id), [id]);
  if (state.loading) return <div className="stack-page"><LoadingState title="Loading vehicle" /></div>;
  if (!state.data) return <div className="stack-page"><ErrorState title={state.error === "Vehicle not found." ? state.error : "Vehicle unavailable"} description="The vehicle may have been removed or the link is incorrect." action={<Link className="primary-button" to="/customer/search">Back to search</Link>} /></div>;
  const vehicle = state.data;
  return <div className="stack-page"><PageHeader eyebrow={`${vehicle.brand} / ${vehicle.type}`} title={vehicle.model} description={`${vehicle.company_name} at ${vehicle.location_name}, ${vehicle.city}`} actions={<Link className="primary-button" to={`/customer/book/${vehicle.vehicle_id}`}>Book This Car</Link>} /><section className="vehicle-detail-layout"><div className="vehicle-detail-image"><img src={getVehicleImage(vehicle)} alt={`${vehicle.brand} ${vehicle.model}`} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackVehicleImage; }} /></div><section className="card detail-panel"><div className="detail-highlight"><span><VehicleStatusBadge status={vehicle.status} /></span><strong>Rs {vehicle.price_per_day.toLocaleString("en-IN")}/day</strong></div><div className="detail-grid"><div><span>Category</span><strong>{vehicle.type}</strong></div><div><span>Transmission</span><strong>{vehicle.transmission}</strong></div><div><span>Fuel</span><strong>{vehicle.fuel_type}</strong></div><div><span>Seats</span><strong>{vehicle.seats}</strong></div><div><span>Year</span><strong>{vehicle.year}</strong></div><div><span>Mileage</span><strong>{vehicle.mileage.toLocaleString("en-IN")} km</strong></div><div><span>Location</span><strong>{vehicle.location_name}, {vehicle.city}</strong></div><div><span>Vehicle number</span><strong>{vehicle.vehicle_number}</strong></div></div></section></section></div>;
}

export function CustomerBookingFlowPage() {
  const { id } = useParams();
  const vehicleState = useCustomerResource(() => customerApi.getVehicle(id), [id]);
  const [dates, setDates] = useState({ pickup: "", returned: "" });
  const [state, setState] = useState({ error: "", availability: null, booking: null, submitting: false });
  const vehicle = vehicleState.data;
  const days = useMemo(() => { if (!dates.pickup || !dates.returned) return 0; const start = new Date(dates.pickup); const end = new Date(dates.returned); if (end <= start) return 0; return Math.max(1, Math.ceil((new Date(end.getFullYear(), end.getMonth(), end.getDate()) - new Date(start.getFullYear(), start.getMonth(), start.getDate())) / 86400000)); }, [dates]);
  const checkAvailability = async (event) => { event.preventDefault(); setState((current) => ({ ...current, error: "", availability: null })); if (!dates.pickup || !dates.returned || new Date(dates.returned) <= new Date(dates.pickup)) { setState((current) => ({ ...current, error: "Choose valid dates with return after pickup." })); return; } try { const availability = await customerApi.checkAvailability(id, dates.pickup, dates.returned); setState((current) => ({ ...current, availability, error: availability.available ? "" : "Vehicle is unavailable for these dates." })); } catch (error) { setState((current) => ({ ...current, error: error.message })); } };
  const confirmBooking = async () => { const session = JSON.parse(localStorage.getItem("smartcar_session") || "null"); if (!session?.customer_id) { setState((current) => ({ ...current, error: "Please log in as a customer before booking." })); return; } setState((current) => ({ ...current, submitting: true, error: "" })); try { const booking = await customerApi.createBooking({ customer_id: session.customer_id, vehicle_id: Number(id), pickup_datetime: dates.pickup, return_datetime: dates.returned }); setState((current) => ({ ...current, submitting: false, booking })); } catch (error) { setState((current) => ({ ...current, submitting: false, error: error.message })); } };
  if (vehicleState.loading) return <div className="stack-page"><LoadingState title="Loading booking" /></div>;
  if (!vehicle) return <div className="stack-page"><ErrorState title="Vehicle not found" description={vehicleState.error} action={<Link className="primary-button" to="/customer/search">Search Cars</Link>} /></div>;
  if (state.booking) return <div className="stack-page"><PageHeader eyebrow="Booking Confirmed" title="Your reservation is saved" description={`Booking #${state.booking.booking_id} is pending owner confirmation.`} /><BookingSummary booking={{ ...state.booking, vehicle_label: `${vehicle.brand} ${vehicle.model}`, location_name: vehicle.location_name }} /><Link className="primary-button" to="/customer/search">Browse more cars</Link></div>;
  const conflict = state.availability?.conflict;
  return <div className="stack-page"><PageHeader eyebrow="Booking Workflow" title={`Reserve ${vehicle.brand} ${vehicle.model}`} description="Select your dates, check live availability, and confirm only after the backend accepts the reservation." /><section className="card summary-card"><div className="booking-vehicle-preview"><img src={getVehicleImage(vehicle)} alt={`${vehicle.brand} ${vehicle.model}`} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackVehicleImage; }} /><div><p className="eyebrow">Selected vehicle</p><h3>{vehicle.brand} {vehicle.model}</h3><p>{vehicle.type} / {vehicle.location_name}</p></div></div><form onSubmit={checkAvailability} className="form-grid"><label><span>Pickup date and time</span><input type="datetime-local" value={dates.pickup} onChange={(event) => setDates((current) => ({ ...current, pickup: event.target.value }))} required /></label><label><span>Return date and time</span><input type="datetime-local" value={dates.returned} onChange={(event) => setDates((current) => ({ ...current, returned: event.target.value }))} required /></label><div className="split-line"><span>{days ? `${days} rental day${days === 1 ? "" : "s"}` : "Select dates to calculate"}</span><strong>{days ? `Rs ${(vehicle.price_per_day * days).toLocaleString("en-IN")}` : "Rs --"}</strong></div><button type="submit" className="primary-button">Check availability</button></form>{state.error ? <p className="form-error">{state.error}</p> : null}{conflict ? <div className="availability-warning"><strong>Unavailable for your selected dates.</strong><span>Conflicting booking: {new Date(conflict.pickup_datetime).toLocaleString()} to {new Date(conflict.return_datetime).toLocaleString()}.</span>{state.availability.next_available_datetime ? <span>Next available: {new Date(state.availability.next_available_datetime).toLocaleString()}.</span> : <span>Try another date range.</span>}</div> : null}{state.availability?.available ? <div className="booking-confirmation"><p>Available for your selected dates.</p><button type="button" className="primary-button" disabled={state.submitting} onClick={confirmBooking}>{state.submitting ? "Saving..." : "Confirm booking"}</button></div> : null}</section></div>;
}

export function CustomerBookingsPage() {
  const state = useCustomerResource(() => customerApi.getBookings(), []);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!state.data?.items) return;
    const seenRaw = localStorage.getItem("smartcar_seen_notifications") || "{}";
    let seen = {};
    try { seen = JSON.parse(seenRaw); } catch (e) {}

    for (const item of state.data.items) {
      const key = `${item.booking_id}_${item.status}`;
      if (["CONFIRMED", "CANCELLED"].includes(item.status) && !seen[key]) {
        seen[key] = true;
        localStorage.setItem("smartcar_seen_notifications", JSON.stringify(seen));
        const vehicleName = item.vehicle ? `${item.vehicle.brand} ${item.vehicle.model}` : "your car";
        const companyName = item.company_name || "Apex Car Rentals";
        if (item.status === "CONFIRMED") {
          setToast({
            message: `Your car for ${vehicleName} is accepted by ${companyName}! Enjoy your travelling!`,
            type: "info",
            duration: 7000
          });
        } else {
          setToast({
            message: `Your booking for ${vehicleName} was cancelled by ${companyName}.`,
            type: "info",
            duration: 7000
          });
        }
        break;
      }
    }
  }, [state.data]);

  if (state.loading) return <div className="stack-page"><LoadingState title="Loading your bookings" /></div>;
  if (state.error) return <div className="stack-page"><ErrorState title="Bookings unavailable" description={state.error} /></div>;
  const items = state.data?.items || [];
  const today = new Date();
  const upcoming = items.filter((item) => ["PENDING", "CONFIRMED", "ACTIVE"].includes(item.status) && new Date(item.return_datetime) >= today);
  const completed = items.filter((item) => item.status === "COMPLETED" || (new Date(item.return_datetime) < today && item.status !== "CANCELLED"));
  const cancelled = items.filter((item) => item.status === "CANCELLED");
  return <div className="stack-page">{toast && <Toast {...toast} onClose={() => setToast(null)} />}<PageHeader eyebrow="My Bookings" title="Your rental history" description="Bookings and payment status retrieved from your customer account." actions={<Link className="primary-button" to="/customer/search">Explore Cars</Link>} />{items.length ? <><BookingStatusGroup title="Current and Upcoming" items={upcoming} /><BookingStatusGroup title="Past Rentals" items={completed} /><BookingStatusGroup title="Cancelled" items={cancelled} /></> : <EmptyState title="No bookings yet" description="Your confirmed rentals will appear here." action={<Link className="primary-button" to="/customer/search">Explore Cars</Link>} />}</div>;
}

export function CustomerBookingDetailsPage() {
  const { id } = useParams();
  const state = useCustomerResource(() => customerApi.getBooking(id), [id]);
  const [liveBooking, setLiveBooking] = useState(null);
  const [toast, setToast] = useState(null);

  const booking = liveBooking || state.data;

  // Poll for status updates while pending
  useEffect(() => {
    if (!booking || booking.status !== "PENDING") return;
    const interval = setInterval(async () => {
      try {
        const updated = await customerApi.getBooking(id);
        if (updated && updated.status !== booking.status) {
          setLiveBooking(updated);
          const vehicleName = updated.vehicle ? `${updated.vehicle.brand} ${updated.vehicle.model}` : "your car";
          const companyName = updated.company_name || "Apex Car Rentals";
          if (updated.status === "CONFIRMED") {
            setToast({
              message: `Your car for ${vehicleName} is accepted by ${companyName}! Enjoy your travelling!`,
              type: "info",
              duration: 7000
            });
          } else {
            setToast({
              message: `Your booking for ${vehicleName} was cancelled by ${companyName}.`,
              type: "info",
              duration: 7000
            });
          }
        }
      } catch (e) {
        // ignore errors
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [id, booking?.status]);

  if (state.loading) return <div className="stack-page"><LoadingState title="Loading booking" /></div>;
  if (!booking) return <div className="stack-page"><ErrorState title="Booking not found" description="This booking does not exist or does not belong to the current customer." action={<Link className="primary-button" to="/customer/bookings">Back to bookings</Link>} /></div>;
  return <div className="stack-page">{toast && <Toast {...toast} onClose={() => setToast(null)} />}
    <PageHeader eyebrow="Booking Details" title={`Booking #${booking.booking_id}`} description={`${booking.company_name} / ${booking.location_name}, ${booking.city}`} actions={<Link className="secondary-button" to="/customer/messages">Messages</Link>} /><section className="card booking-detail-real"><img src={getVehicleImage(booking.vehicle)} alt={`${booking.vehicle.brand} ${booking.vehicle.model}`} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackVehicleImage; }} /><div><p className="eyebrow">{booking.vehicle.type}</p><h3>{booking.vehicle.brand} {booking.vehicle.model}</h3><VehicleStatusBadge status={booking.status} /><dl className="summary-grid"><div><dt>Pickup</dt><dd>{new Date(booking.pickup_datetime).toLocaleString()}</dd></div><div><dt>Return</dt><dd>{new Date(booking.return_datetime).toLocaleString()}</dd></div><div><dt>Amount</dt><dd>Rs {booking.total_amount.toLocaleString("en-IN")}</dd></div><div><dt>Payment</dt><dd>{booking.payment?.payment_status || "No payment record"}</dd></div><div><dt>Vehicle</dt><dd>{booking.vehicle.vehicle_number}</dd></div><div><dt>Created</dt><dd>{new Date(booking.created_at).toLocaleString()}</dd></div></dl></div></section></div>;
}

export function CustomerPaymentsPage() {
  const state = useCustomerResource(() => customerApi.getPayments(), []);
  if (state.loading) return <div className="stack-page"><LoadingState title="Loading payments" /></div>;
  if (state.error) return <div className="stack-page"><ErrorState title="Payments unavailable" description={state.error} /></div>;
  const items = state.data?.items || [];
  return <div className="stack-page"><PageHeader eyebrow="Payments" title="Payment records" description="Payment information shown from the existing SmartCar payment records." />{items.length ? <section className="grid-two">{items.map((payment) => <article className="card payment-card" key={payment.payment_id}><div className="split-line"><h3>{payment.brand} {payment.model}</h3><VehicleStatusBadge status={payment.payment_status} /></div><p>Booking #{payment.booking_id}</p><div className="summary-grid"><div><span>Amount</span><strong>Rs {payment.amount.toLocaleString("en-IN")}</strong></div><div><span>Method</span><strong>{payment.payment_method}</strong></div><div><span>Paid at</span><strong>{payment.paid_at ? new Date(payment.paid_at).toLocaleString() : "No payment date"}</strong></div><div><span>Reference</span><strong>{payment.transaction_reference || "No reference"}</strong></div></div></article>)}</section> : <EmptyState title="No payments yet" description="Payment records will appear after a payment is recorded for one of your bookings." />}</div>;
}

export function CustomerMessagesPage() {
  const state = useCustomerResource(() => customerApi.getMessages(), []);
  if (state.loading) return <div className="stack-page"><LoadingState title="Loading messages" /></div>;
  if (state.error) return <div className="stack-page"><ErrorState title="Messages unavailable" description={state.error} /></div>;
  const items = state.data?.items || [];
  const threads = [...new Map(items.map((item) => [item.booking_id, item])).values()];
  return <div className="stack-page"><PageHeader eyebrow="Messages" title="Conversation inbox" description="Simple booking-linked messages from your rental conversations." />{threads.length ? <section className="table-collection">{threads.map((thread) => <Link key={thread.booking_id} className="card message-thread" to={`/customer/bookings/${thread.booking_id}/chat`}><div className="split-line"><h3>{thread.brand} {thread.model}</h3><span>Booking #{thread.booking_id}</span></div><p>{thread.message_text}</p></Link>)}</section> : <EmptyState title="No messages yet" description="Messages linked to your bookings will appear here." action={<Link className="primary-button" to="/customer/search">Explore Cars</Link>} />}</div>;
}

export function CustomerBookingChatPage() {
  const { id } = useParams();
  const [messageText, setMessageText] = useState("");
  const [sent, setSent] = useState(0);
  const [messageError, setMessageError] = useState("");
  const state = useCustomerResource(() => customerApi.getMessages(), [id, sent]);
  const sendMessage = async (event) => { event.preventDefault(); if (!messageText.trim()) return; setMessageError(""); try { await customerApi.sendMessage({ booking_id: Number(id), message_text: messageText }); setMessageText(""); setSent((value) => value + 1); } catch (error) { setMessageError(error.message); } };
  if (state.loading) return <div className="stack-page"><LoadingState title="Loading conversation" /></div>;
  if (state.error) return <div className="stack-page"><ErrorState title="Conversation unavailable" description={state.error} />;</div>;
  const bookingMessages = (state.data?.items || []).filter((message) => message.booking_id === Number(id));
  return <div className="stack-page"><PageHeader eyebrow="Booking Chat" title={`Communication for booking #${id}`} description="Messages are stored in PostgreSQL and scoped to this customer booking." /><section className="card chat-shell"><div className="chat-list">{bookingMessages.length ? bookingMessages.map((message) => <article key={message.message_id} className={message.sender_role === "customer" ? "chat-bubble mine" : "chat-bubble"}><strong>{message.sender_email}</strong><p>{message.message_text}</p><span>{new Date(message.sent_at).toLocaleString()}</span></article>) : <p>No messages yet.</p>}</div><form className="message-compose" onSubmit={sendMessage}><input value={messageText} onChange={(event) => setMessageText(event.target.value)} placeholder="Write a message" required /><button type="submit" className="primary-button">Send message</button></form>{messageError ? <p className="form-error">{messageError}</p> : null}</section></div>;
}

export function CustomerProfilePage() {
  const state = useCustomerResource(() => customerApi.getProfile(), []);
  const [form, setForm] = useState(null);
  const [feedback, setFeedback] = useState("");
  useEffect(() => { if (state.data) setForm({ name: state.data.name, phone: state.data.phone, address: state.data.address || "" }); }, [state.data]);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const save = async (event) => { event.preventDefault(); try { const profile = await customerApi.updateProfile(form); setForm({ name: profile.name, phone: profile.phone, address: profile.address || "" }); setFeedback("Profile updated."); } catch (error) { setFeedback(error.message); } };
  if (state.loading) return <div className="stack-page"><LoadingState title="Loading profile" /></div>;
  if (state.error || !form) return <div className="stack-page"><ErrorState title="Profile unavailable" description={state.error || "Customer profile not found."} /></div>;
  return <div className="stack-page"><PageHeader eyebrow="Profile" title={form.name} description="Your customer details are stored in the SmartCar database." /><form className="card summary-card form-grid" onSubmit={save}><label><span>Name</span><input value={form.name} onChange={(event) => update("name", event.target.value)} required /></label><label><span>Email</span><input value={state.data.email} readOnly /></label><label><span>Phone</span><input value={form.phone} onChange={(event) => update("phone", event.target.value)} required /></label><label><span>Address</span><input value={form.address} onChange={(event) => update("address", event.target.value)} required /></label><div className="split-line"><span>License: {state.data.license_number} / {state.data.license_status}</span><button type="submit" className="primary-button">Save profile</button></div>{feedback ? <p className="form-error">{feedback}</p> : null}</form></div>;
}