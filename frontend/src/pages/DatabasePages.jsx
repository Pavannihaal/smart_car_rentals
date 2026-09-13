import { useEffect, useState } from "react";
import { ErrorState, LoadingState, PageHeader } from "../components/common";
import { databaseSchema } from "../data/databaseSchema";
import { queryExamples } from "../data/queryExamples";
import { mockApi } from "../services/mockApi";

export function DatabaseOverviewPage() {
  const [state, setState] = useState({
    loading: true,
    error: "",
    schema: null
  });

  useEffect(() => {
    let isMounted = true;

    mockApi
      .getDatabaseSchema()
      .then((schema) => {
        if (isMounted) {
          setState({ loading: false, error: "", schema });
        }
      })
      .catch(() => {
        if (isMounted) {
          setState({
            loading: false,
            error: "The database overview could not be loaded from the mock schema layer.",
            schema: null
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (state.loading) {
    return (
      <div className="stack-page">
        <PageHeader
          eyebrow="Database Design"
          title="SmartCar schema overview"
          description="Loading the academic DBMS presentation layer."
        />
        <LoadingState title="Loading schema overview" description="Preparing table and relationship summaries." />
      </div>
    );
  }

  if (state.error || !state.schema) {
    return (
      <div className="stack-page">
        <PageHeader
          eyebrow="Database Design"
          title="SmartCar schema overview"
          description="Frontend presentation shells are aligned with the Phase 2 tables and relationships already implemented in PostgreSQL."
        />
        <ErrorState description={state.error} />
      </div>
    );
  }

  return (
    <div className="stack-page">
      <PageHeader
        eyebrow="Database Design"
        title="SmartCar schema overview"
        description="Frontend presentation shells are aligned with the Phase 2 tables and relationships already implemented in PostgreSQL."
      />
      <section className="grid-two">
        <article className="card summary-card">
          <h3>12 core tables</h3>
          <p>
            Users, customers, rental companies, locations, vehicles, bookings, payments,
            inspections, maintenance, history, reviews, and messages.
          </p>
        </article>
        <article className="card summary-card">
          <h3>Relationship focus</h3>
          <p>{state.schema.relations.join(" | ")}</p>
        </article>
      </section>
    </div>
  );
}

export function ErDiagramPage() {
  return (
    <div className="stack-page">
      <PageHeader
        eyebrow="ER Diagram"
        title="Entity relationship story"
        description="Phase 3A provides a presentable ER shell before a visual diagram asset is added in Phase 3G."
      />
      <section className="card er-shell">
        {databaseSchema.relations.map((relation) => (
          <div key={relation} className="er-row">
            <span>{relation}</span>
          </div>
        ))}
      </section>
    </div>
  );
}

export function SchemaViewerPage() {
  return (
    <div className="stack-page">
      <PageHeader
        eyebrow="Relational Schema"
        title="Schema viewer"
        description="Each block below maps directly to the SQL schema file you already built."
      />
      <section className="schema-grid">
        {databaseSchema.tables.map((table) => (
          <article key={table.name} className="card schema-card">
            <h3>{table.name}</h3>
            <ul>
              {table.columns.slice(0, 6).map((column) => (
                <li key={column}>{column}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}

export function TableViewerPage() {
  return (
    <div className="stack-page">
      <PageHeader
        eyebrow="Tables"
        title="Database table viewer"
        description="This shell is ready for table-preview widgets, pagination, and live query responses later."
      />
      <section className="table-collection">
        {databaseSchema.tables.map((table) => (
          <article key={table.name} className="card table-preview">
            <div className="split-line">
              <h3>{table.name}</h3>
              <span>{table.columns.length} columns</span>
            </div>
            <p>{table.columns.join(", ")}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

export function QueryDemoPage() {
  return (
    <div className="stack-page">
      <PageHeader
        eyebrow="Queries"
        title="SQL query demonstrations"
        description="The examples below are derived from your `database/queries.sql` phase work."
      />
      <section className="table-collection">
        {queryExamples.map((query) => (
          <article key={query.title} className="card query-card">
            <h3>{query.title}</h3>
            <pre>{query.sql}</pre>
          </article>
        ))}
      </section>
    </div>
  );
}
