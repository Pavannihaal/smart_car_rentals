export function StatusBadge({ status }) {
  const normalized = String(status || "UNKNOWN").toLowerCase().replace(/\s+/g, "_");

  return <span className={`status-pill status-${normalized}`}>{status}</span>;
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="header-actions">{actions}</div> : null}
    </header>
  );
}

export function DashboardCard({ label, value, detail }) {
  return (
    <article className="card dashboard-card">
      <p className="eyebrow">{label}</p>
      <h3>{value}</h3>
      <p>{detail}</p>
    </article>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <section className="card state-card">
      <p className="eyebrow">Empty</p>
      <h3>{title}</h3>
      <p>{description}</p>
      {action ? <div className="state-action">{action}</div> : null}
    </section>
  );
}

export function LoadingSpinner() {
  return <span className="loading-spinner" aria-hidden="true" />;
}

export function LoadingState({ title = "Loading", description = "Please wait while we prepare this view." }) {
  return (
    <section className="card state-card">
      <LoadingSpinner />
      <h3>{title}</h3>
      <p>{description}</p>
    </section>
  );
}

export function LoadingCard() {
  return (
    <article className="card loading-card">
      <div className="skeleton-line wide" />
      <div className="skeleton-line medium" />
      <div className="skeleton-line short" />
    </article>
  );
}

export function LoadingTable() {
  return (
    <section className="card table-card">
      {[1, 2, 3, 4].map((row) => (
        <div key={row} className="table-skeleton-row">
          <div className="skeleton-line medium" />
          <div className="skeleton-line short" />
          <div className="skeleton-line short" />
          <div className="skeleton-line short" />
        </div>
      ))}
    </section>
  );
}

export function ErrorState({
  title = "Something went wrong.",
  description = "We couldn't load this information.",
  action
}) {
  return (
    <section className="card state-card error-card">
      <p className="eyebrow">Error</p>
      <h3>{title}</h3>
      <p>{description}</p>
      {action ? <div className="state-action">{action}</div> : null}
    </section>
  );
}

export function Toast({ message, type = "info", duration = 3000, onClose }) {
  const [visible, setVisible] = React.useState(true);
  React.useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) {
    onClose && onClose();
    return null;
  }
  return (
    <div className={`toast toast-${type}`} role="alert">
      {message}
      <button className="toast-close" onClick={() => setVisible(false)} aria-label="Close">✕</button>
    </div>
  );
}
