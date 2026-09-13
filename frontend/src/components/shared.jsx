import { NavLink } from "react-router-dom";

export function Navigation({ title, subtitle, links }) {
  return (
    <aside className="nav-shell">
      <div className="brand-block">
        <p className="eyebrow">SmartCar</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <nav className="nav-links" aria-label={`${title} navigation`}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <span>{link.label}</span>
            <small>{link.caption}</small>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {actions ? <div className="header-actions">{actions}</div> : null}
    </header>
  );
}
