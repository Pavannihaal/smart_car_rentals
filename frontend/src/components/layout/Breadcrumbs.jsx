import { Link } from "react-router-dom";

export function Breadcrumbs({ items }) {
  if (!items?.length) {
    return null;
  }

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumbs">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="breadcrumb-item">
          {item.to && index < items.length - 1 ? <Link to={item.to}>{item.label}</Link> : item.label}
          {index < items.length - 1 ? <span className="breadcrumb-separator">/</span> : null}
        </span>
      ))}
    </nav>
  );
}
