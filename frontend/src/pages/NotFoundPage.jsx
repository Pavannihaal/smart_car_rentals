import { Link } from "react-router-dom";
import { PageHeader } from "../components/common";

export function NotFoundPage() {
  return (
    <div className="stack-page">
      <PageHeader
        eyebrow="404"
        title="Route not found"
        description="The requested page is outside the current SmartCar demo routes."
      />
      <section className="card summary-card">
        <p>This frontend foundation already includes all planned Phase 3B route groups.</p>
        <Link className="primary-button" to="/">
          Return home
        </Link>
      </section>
    </div>
  );
}
