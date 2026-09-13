import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

export function Sidebar({ area, title, subtitle, sections, isOpen, onClose }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`sidebar-shell area-${area} ${isOpen ? "open" : ""} ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-head">
        <div className="brand-block">
          <Link to="/" className="brand-logo-link" title="Return to Public Homepage">
            <div className="brand-logo">
              <span className="logo-icon">🏎️</span>
              {!collapsed && <span className="logo-text">SMARTCAR</span>}
            </div>
          </Link>
          {!collapsed && <h1>{title}</h1>}
          {!collapsed && <p>{subtitle}</p>}
        </div>
        <div className="sidebar-head-actions">
          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={() => setCollapsed((prev) => !prev)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? "»" : "«"}
          </button>
          <button type="button" className="sidebar-close" onClick={onClose} aria-label="Close navigation">
            ✕
          </button>
        </div>
      </div>

      <div className="sidebar-sections">
        {sections.map((section) => (
          <section key={section.title} className="sidebar-section">
            {!collapsed && <p className="sidebar-section-title">{section.title}</p>}
            <div className="nav-links">
              {section.items.map((item) => (
                <NavLink
                  key={`${section.title}-${item.to}-${item.label}`}
                  to={item.to}
                  end={item.end}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                >
                  <span className="nav-label">{item.label}</span>
                  {!collapsed && item.caption ? <small>{item.caption}</small> : null}
                </NavLink>
              ))}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
