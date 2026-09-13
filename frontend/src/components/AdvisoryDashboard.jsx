import { useEffect, useMemo, useState } from "react";
import { DashboardCard, EmptyState, ErrorState, LoadingState, PageHeader } from "../components/common";
import { getAdvisoryBaselines, getAdvisoryRecommendations, getAdvisoryVehicleMetrics } from "../services/advisoryApi";

const EVIDENCE_METRICS = [
  "rental_days",
  "utilization",
  "maintenance_cost",
  "maintenance_downtime_days",
  "avg_return_inspection_days",
  "avg_return_ready_days",
  "inspection_issue_rate",
  "paid_revenue"
];

const COUNT_METRICS = [
  "booking_count",
  "maintenance_frequency",
  "return_with_inspection_count",
  "return_ready_count",
  "total_inspections",
  "issue_inspections",
  "paid_payment_count"
];

const METRIC_LABELS = {
  rental_days: "Rental days",
  utilization: "Utilization",
  maintenance_cost: "Maintenance cost",
  maintenance_downtime_days: "Maintenance downtime",
  avg_return_inspection_days: "Avg return → inspection",
  avg_return_ready_days: "Avg return → READY",
  inspection_issue_rate: "Inspection issue rate",
  paid_revenue: "Paid revenue",
  booking_count: "Bookings (in-window)",
  maintenance_frequency: "Maintenance events",
  return_with_inspection_count: "Returned + inspected",
  return_ready_count: "Returned → READY",
  total_inspections: "Total inspections",
  issue_inspections: "Issue inspections",
  paid_payment_count: "Paid payments"
};

const BASELINE_METRIC_MAP = [
  { label: "Utilization", field: "fleet_median_utilization", metric: "utilization", popField: "utilization_pop" },
  { label: "Maintenance downtime", field: "fleet_median_maintenance_downtime", metric: "maintenance_downtime_days", popField: "maintenance_downtime_pop" },
  { label: "Maintenance freq.", field: "fleet_median_maintenance_frequency", metric: "maintenance_frequency", popField: "maintenance_frequency_pop" },
  { label: "Return → READY", field: "fleet_median_return_ready_days", metric: "avg_return_ready_days", popField: "return_ready_pop" },
  { label: "Inspection issue rate", field: "fleet_median_inspection_issue_rate", metric: "inspection_issue_rate", popField: "inspection_issue_pop" },
  { label: "Paid revenue", field: "fleet_median_paid_revenue", metric: "paid_revenue", popField: "revenue_pop" }
];

function formatValue(metric, value) {
  if (value === null || value === undefined) {
    return "—";
  }

  if (EVIDENCE_METRICS.includes(metric)) {
    if (metric === "utilization" || metric === "inspection_issue_rate") {
      const ratio = Number(value);
      if (Number.isNaN(ratio)) return "—";
      return `${(ratio * 100).toFixed(1)}%`;
    }
    if (metric === "maintenance_cost" || metric === "paid_revenue") {
      const num = Number(value);
      if (Number.isNaN(num)) return "—";
      return `Rs ${num.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
    }
    const num = Number(value);
    if (Number.isNaN(num)) return "—";
    return num.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  }

  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  return num.toString();
}

function getVehicleLabel(row) {
  if (!row) return `#?`;
  const parts = [row.brand, row.model].filter(Boolean);
  if (parts.length > 0) return parts.join(" ");
  return `#${row.vehicle_id ?? "?"}`;
}

function getEvidenceStatus(row) {
  const hasRental = row && (row.rental_days !== null && row.rental_days !== undefined);
  const hasMaintenance = row && (row.maintenance_cost !== null && row.maintenance_cost !== undefined || row.maintenance_downtime_days !== null && row.maintenance_downtime_days !== undefined);
  const hasInspection = row && (row.inspection_issue_rate !== null && row.inspection_issue_rate !== undefined);
  const hasRevenue = row && (row.paid_revenue !== null && row.paid_revenue !== undefined);

  if (hasRental || hasMaintenance || hasInspection || hasRevenue) {
    const signals = [];
    if (hasRental) signals.push("Rental");
    if (hasMaintenance) signals.push("Maintenance");
    if (hasInspection) signals.push("Inspection");
    if (hasRevenue) signals.push("Revenue");
    return signals.join(" + ");
  }
  return "No current evidence";
}

function recommendationVehicle(row) {
  return [row.brand, row.model].filter(Boolean).join(" ") || `Vehicle #${row.vehicle_id ?? "?"}`;
}

function recommendationMetric(row) {
  const metrics = {
    R1: ["Utilization", row.utilization, "utilization"],
    R2: ["Maintenance downtime", row.maintenance_downtime_days, "maintenance_downtime_days"],
    R3: ["Avg return → READY", row.avg_return_ready_days, "avg_return_ready_days"],
    R4: ["Inspection issue rate", row.inspection_issue_rate, "inspection_issue_rate"],
    R5: ["Utilization", row.utilization, "utilization"],
    R6: ["Utilization", row.utilization, "utilization"],
    R7: ["Utilization", row.utilization, "utilization"],
    R8: ["Utilization", row.utilization, "utilization"],
    R9: ["Maintenance events", row.maintenance_frequency, "maintenance_frequency"],
    R10: ["Booking activity", row.booking_count, "booking_count"]
  };
  const [label, value, metric] = metrics[row.rule_id] || ["Primary metric", null, ""];
  return { label, value: formatValue(metric, value), metric };
}

function RecommendationCard({ row, selected, onSelect }) {
  const metric = recommendationMetric(row);
  return <button type="button" className={`card recommendation-card ${selected ? "selected" : ""}`} onClick={onSelect}><div className="recommendation-card-head"><div><p className="eyebrow">{row.rule_id} / {row.rule_title || row.rule_code || "Advisory signal"}</p><h3>{recommendationVehicle(row)}</h3></div><span className="severity-pill">{row.severity || "—"}</span></div><div className="recommendation-card-body"><div><span>Key metric</span><strong>{metric.value}</strong></div><p>{row.observation || "No interpretation provided."}</p></div><span className="recommendation-card-action">{selected ? "Details open" : "Open explanation"}</span></button>;
}

function RecommendationDetail({ row }) {
  const metric = recommendationMetric(row);
  const baseline = row[`fleet_median_${metric.metric}`];
  const threshold = row.low_utilization_threshold || row.high_downtime_threshold || row.high_return_ready_threshold || row.high_issue_rate_threshold;
  const evidence = [
    ["Primary metric", metric.value],
    ["Fleet baseline", formatValue(metric.metric, baseline)],
    ["Comparison threshold", formatValue(metric.metric, threshold)],
    ["Bookings", formatValue("booking_count", row.booking_count)],
    ["Rental days", formatValue("rental_days", row.rental_days)],
    ["Maintenance cost", formatValue("maintenance_cost", row.maintenance_cost)],
    ["Inspection issue rate", formatValue("inspection_issue_rate", row.inspection_issue_rate)],
    ["Paid revenue", formatValue("paid_revenue", row.paid_revenue)]
  ];
  return <section className="card recommendation-detail"><div className="recommendation-detail-head"><div><p className="eyebrow">Explainability chain</p><h3>{row.rule_id}: {row.rule_title || row.rule_code}</h3><p>{recommendationVehicle(row)} / {row.type || "Fleet signal"}</p></div><span className="severity-pill">{row.severity || "—"}</span></div><div className="recommendation-chain"><span>Recommendation</span><b>→</b><span>Rule {row.rule_id}</span><b>→</b><span>{metric.label}</span><b>→</b><span>Evidence</span></div><div className="recommendation-evidence-grid">{evidence.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><div className="recommendation-explanation"><div><p className="eyebrow">Interpretation</p><p>{row.observation || "No interpretation provided by the advisory rule."}</p></div><div><p className="eyebrow">Suggested operational action</p><p>{row.recommended_action || "No action guidance provided by the advisory rule."}</p></div><div><p className="eyebrow">Data limitation</p><p>{row.data_limitation || "No additional limitation recorded for this signal."}</p></div></div><p className="advisory-decision-note">SmartCar identifies and explains an operational signal. The owner evaluates the context and decides what action to take; no vehicle change is automated here.</p></section>;
}

function VehicleInsightCard({ row }) {
  const [expanded, setExpanded] = useState(false);
  const label = getVehicleLabel(row);
  const evidence = getEvidenceStatus(row);
  const hasEvidence = evidence !== "No current evidence";

  return (
    <article className={`card vehicle-insight-card ${hasEvidence ? "has-evidence" : "no-evidence"}`}>
      <div className="vehicle-insight-header">
        <div>
          <p className="eyebrow">{row.type}</p>
          <h3>{label}</h3>
        </div>
        <span className={`evidence-pill ${hasEvidence ? "evidence-positive" : "evidence-neutral"}`}>
          {evidence}
        </span>
      </div>

      <div className="vehicle-insight-metrics">
        <div className="insight-metric">
          <span className="insight-label">Bookings</span>
          <span className="insight-value">{formatValue("booking_count", row.booking_count)}</span>
        </div>
        <div className="insight-metric">
          <span className="insight-label">Utilization</span>
          <span className="insight-value">{formatValue("utilization", row.utilization)}</span>
        </div>
        <div className="insight-metric">
          <span className="insight-label">Maintenance</span>
          <span className="insight-value">{formatValue("maintenance_frequency", row.maintenance_frequency)}</span>
        </div>
        {hasEvidence && (
          <>
            {row.rental_days !== null && row.rental_days !== undefined && (
              <div className="insight-metric">
                <span className="insight-label">Rental days</span>
                <span className="insight-value">{formatValue("rental_days", row.rental_days)}</span>
              </div>
            )}
            {row.maintenance_cost !== null && row.maintenance_cost !== undefined && (
              <div className="insight-metric">
                <span className="insight-label">Maintenance cost</span>
                <span className="insight-value">{formatValue("maintenance_cost", row.maintenance_cost)}</span>
              </div>
            )}
            {row.maintenance_downtime_days !== null && row.maintenance_downtime_days !== undefined && (
              <div className="insight-metric">
                <span className="insight-label">Downtime</span>
                <span className="insight-value">{formatValue("maintenance_downtime_days", row.maintenance_downtime_days)}</span>
              </div>
            )}
            {row.paid_revenue !== null && row.paid_revenue !== undefined && (
              <div className="insight-metric">
                <span className="insight-label">Revenue</span>
                <span className="insight-value">{formatValue("paid_revenue", row.paid_revenue)}</span>
              </div>
            )}
          </>
        )}
      </div>

      <button className="insight-expand" type="button" onClick={() => setExpanded((prev) => !prev)}>
        {expanded ? "Hide full metrics" : "View full metrics"}
      </button>

      {expanded && (
        <div className="insight-details">
          <table>
            <tbody>
              {COUNT_METRICS.map((metric) => (
                <tr key={metric}>
                  <td>{METRIC_LABELS[metric]}</td>
                  <td>{formatValue(metric, row[metric])}</td>
                </tr>
              ))}
              {EVIDENCE_METRICS.map((metric) => (
                <tr key={metric}>
                  <td>{METRIC_LABELS[metric]}</td>
                  <td>{formatValue(metric, row[metric])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

export function AdvisoryDashboard() {
  const [recommendations, setRecommendations] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [baselines, setBaselines] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [recs, vehMetrics, base] = await Promise.all([
          getAdvisoryRecommendations(),
          getAdvisoryVehicleMetrics(),
          getAdvisoryBaselines()
        ]);

        if (cancelled) return;
        setRecommendations(recs);
        setMetrics(vehMetrics);
        setBaselines(base);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load advisory data.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const metricsRows = useMemo(() => {
    if (!metrics || !Array.isArray(metrics.vehicle_metrics)) return [];
    return metrics.vehicle_metrics;
  }, [metrics]);

  const totalVehicles = metricsRows.length;
  const vehiclesWithRentalEvidence = useMemo(() => {
    if (!baselines) return 0;
    return Number(baselines.utilization_pop ?? 0);
  }, [baselines]);
  const vehiclesWithMaintenanceEvidence = useMemo(() => {
    if (!baselines) return 0;
    return Number(baselines.maintenance_downtime_pop ?? 0);
  }, [baselines]);
  const activeRecommendations = recommendations ? recommendations.count : 0;

  if (loading) {
    return <LoadingState title="Loading advisory insights" description="Computing fleet recommendations and metrics." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Advisory data unavailable"
        description={error}
        action={
          <button className="secondary-button" type="button" onClick={() => window.location.reload()}>
            Retry
          </button>
        }
      />
    );
  }

  return (
    <div className="stack-page">
      <PageHeader eyebrow="Owner Advisory" title="What deserves attention and why?" description="Deterministic SmartCar signals, evidence, and operational context for owner review." />
      <p className="advisory-subtitle">
        Metrics are derived from rental, maintenance, inspection, payment and lifecycle records using deterministic advisory rules.
      </p>

      <section className="grid-four">
        <DashboardCard label="Total vehicles" value={totalVehicles.toString()} detail="Active observation window" />
        <DashboardCard label="Rental evidence" value={vehiclesWithRentalEvidence.toString()} detail="Vehicles with in-window bookings" />
        <DashboardCard label="Maintenance evidence" value={vehiclesWithMaintenanceEvidence.toString()} detail="Vehicles with in-window maintenance" />
        <DashboardCard label="Active recommendations" value={activeRecommendations.toString()} detail={activeRecommendations > 0 ? "Rule(s) fired" : "No actionable signals"} />
      </section>

      <section className="advisory-section">
        <h3>Operational Snapshot</h3>
        <div className="snapshot-grid">
          <article className="card snapshot-card">
            <p className="eyebrow">Rental Activity</p>
            <h3>{vehiclesWithRentalEvidence} vehicle{vehiclesWithRentalEvidence === 1 ? "" : "s"} with rental evidence</h3>
            <p className="snapshot-detail">
              Fleet median utilization: {baselines && baselines.fleet_median_utilization !== null ? `${(Number(baselines.fleet_median_utilization) * 100).toFixed(1)}%` : "—"}
              <br />
              Rental evidence is currently concentrated in {vehiclesWithRentalEvidence} vehicle{vehiclesWithRentalEvidence === 1 ? "" : "s"}.
            </p>
          </article>
          <article className="card snapshot-card">
            <p className="eyebrow">Maintenance Activity</p>
            <h3>{vehiclesWithMaintenanceEvidence} vehicle{vehiclesWithMaintenanceEvidence === 1 ? "" : "s"} with maintenance evidence</h3>
            <p className="snapshot-detail">
              Fleet median downtime: {baselines && baselines.fleet_median_maintenance_downtime !== null ? `${Number(baselines.fleet_median_maintenance_downtime).toFixed(2)} days` : "—"}
              <br />
              Maintenance evidence is currently concentrated in {vehiclesWithMaintenanceEvidence} vehicle{vehiclesWithMaintenanceEvidence === 1 ? "" : "s"}.
            </p>
          </article>
        </div>
      </section>

      <section className="advisory-section">
        <h3>Vehicle Insights</h3>
        <div className="vehicle-insights-grid">
          {metricsRows.map((row) => (
            <VehicleInsightCard key={row.vehicle_id} row={row} />
          ))}
        </div>
      </section>

      <section className="advisory-section">
        <div className="section-head-split"><div><p className="eyebrow">Recommendations requiring attention</p><h3>{activeRecommendations ? `${activeRecommendations} signal${activeRecommendations === 1 ? "" : "s"} for owner review` : "No current advisory recommendations"}</h3></div><span className="advisory-note">Rule engine output: {activeRecommendations}</span></div>
        {activeRecommendations === 0 ? <EmptyState title="No current advisory recommendations" description="The available operational evidence did not trigger a recommendation under the configured SmartCar rules. This is a truthful zero-recommendation state, not missing UI data." /> : <div className="recommendation-layout"><div className="recommendation-list">{recommendations.recommendations.map((row) => <RecommendationCard key={`${row.rule_id}-${row.vehicle_id || row.type}`} row={row} selected={selectedRecommendation === row} onSelect={() => setSelectedRecommendation(row)} />)}</div>{selectedRecommendation ? <RecommendationDetail row={selectedRecommendation} /> : <EmptyState title="Select a recommendation" description="Open a signal to inspect its rule, metric, baseline, raw evidence, interpretation, and suggested action." />}</div>}
      </section>

      <section className="advisory-section advisory-decision-section"><p className="eyebrow">Owner consultation</p><h3>Recommendation is not automatic action</h3><p>SmartCar identifies an operational signal and explains the evidence. The owner evaluates the situation and decides what action to take.</p></section>

      <section className="advisory-section">
        <h3>Fleet Baselines</h3>
        <div className="baseline-grid">
          {BASELINE_METRIC_MAP.map((item) => {
            const value = baselines ? baselines[item.field] : null;
            const population = baselines ? Number(baselines[item.popField] ?? 0) : 0;
            const formatted = value === null || value === undefined ? "—" : formatValue(item.metric, value);
            return (
              <article key={item.label} className="card baseline-card">
                <p className="eyebrow">{item.label}</p>
                <h3>{formatted}</h3>
                <p>Population: {population}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="advisory-section methodology-section">
        <h3>Methodology</h3>
        <div className="card summary-card">
          <div className="methodology-flow">
            <span>Database</span>
            <span className="methodology-arrow">↓</span>
            <span>SQL Metrics</span>
            <span className="methodology-arrow">↓</span>
            <span>Fleet Baseline</span>
            <span className="methodology-arrow">↓</span>
            <span>R1–R10 Rules</span>
            <span className="methodology-arrow">↓</span>
            <span>Operational Signal</span>
            <span className="methodology-arrow">↓</span>
            <span>Owner Review</span>
          </div>
          <p>
            SmartCar derives operational metrics from PostgreSQL data and compares eligible vehicles against fleet baselines.
            Deterministic advisory rules identify measurable conditions and present evidence for owner review.
            The final business decision remains with the rental owner.
          </p>
        </div>
      </section>
    </div>
  );
}
