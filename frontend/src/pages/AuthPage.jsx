import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "../components/common";
import { seedAccounts, users } from "../data/users";

export function AuthPage({ mode }) {
  const isLogin = mode === "login";
  const navigate = useNavigate();
  const [role, setRole] = useState("customer");
  const [email, setEmail] = useState("alice@gmail.com");
  const [password, setPassword] = useState("••••••••");

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    if (newRole === "customer") {
      setEmail(seedAccounts.customers[0].email);
    } else {
      setEmail(seedAccounts.owners[0].email);
    }
  };

  const handleAccountAutofill = (selectedEmail) => {
    setEmail(selectedEmail);
    setPassword("••••••••");
    // Auto-detect role
    const isOwner = seedAccounts.owners.some((o) => o.email === selectedEmail);
    if (isOwner) {
      setRole("owner");
    } else {
      setRole("customer");
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    // Resolve specific account
    const ownerAcc = seedAccounts.owners.find((o) => o.email.toLowerCase() === email.toLowerCase());
    const custAcc = seedAccounts.customers.find((c) => c.email.toLowerCase() === email.toLowerCase());

    let sessionRole = role;
    let userId = role === "customer" ? users.customer.user_id : users.owner.user_id;
    let customerId = role === "customer" ? users.customer.customer_id : null;
    let companyId = role === "owner" ? users.owner.company_id : null;

    if (ownerAcc) {
      sessionRole = "owner";
      userId = ownerAcc.user_id;
      companyId = ownerAcc.company_id;
      customerId = null;
    } else if (custAcc) {
      sessionRole = "customer";
      userId = custAcc.user_id;
      customerId = custAcc.customer_id;
    }

    localStorage.setItem(
      "smartcar_session",
      JSON.stringify({
        role: sessionRole,
        user_id: userId,
        customer_id: customerId,
        company_id: companyId,
        email: email
      })
    );

    if (sessionRole === "customer") {
      navigate("/customer");
    } else {
      navigate("/owner");
    }
  };

  const handleDirectDemoLogin = (account, accountRole) => {
    localStorage.setItem(
      "smartcar_session",
      JSON.stringify({
        role: accountRole,
        user_id: account.user_id,
        customer_id: accountRole === "customer" ? account.customer_id : null,
        company_id: accountRole === "owner" ? account.company_id : null,
        email: account.email
      })
    );

    if (accountRole === "customer") {
      navigate("/customer");
    } else {
      navigate("/owner");
    }
  };

  return (
    <div className="stack-page auth-page-container">
      <PageHeader
        eyebrow="SmartCar Authentication"
        title={isLogin ? "Portal Login" : "Create Account"}
        description="Access the Customer booking portal or the Fleet Owner command center."
      />

      <div className="auth-wrapper">
        <section className="card auth-card">
          <div className="auth-role-tabs">
            <button
              type="button"
              className={`role-tab ${role === "customer" ? "active" : ""}`}
              onClick={() => handleRoleChange("customer")}
            >
              Customer Portal
            </button>
            <button
              type="button"
              className={`role-tab ${role === "owner" ? "active" : ""}`}
              onClick={() => handleRoleChange("owner")}
            >
              Rental Owner Console
            </button>
          </div>

          <form onSubmit={handleLogin} className="form-grid">
            <label>
              <span>Autofill Verified Account</span>
              <select
                value={email}
                onChange={(e) => handleAccountAutofill(e.target.value)}
              >
                <optgroup label="Rental Owners">
                  {seedAccounts.owners.map((owner) => (
                    <option key={owner.email} value={owner.email}>
                      🏢 {owner.company_name} — ({owner.email})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Customers">
                  {seedAccounts.customers.map((cust) => (
                    <option key={cust.email} value={cust.email}>
                      👤 {cust.name} — ({cust.email})
                    </option>
                  ))}
                </optgroup>
              </select>
            </label>

            <label>
              <span>Email Address</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </label>

            {!isLogin && (
              <label>
                <span>Select Account Role</span>
                <select value={role} onChange={(e) => handleRoleChange(e.target.value)}>
                  <option value="customer">Customer</option>
                  <option value="owner">Rental Owner</option>
                </select>
              </label>
            )}

            <div className="split-line">
              <button type="submit" className="primary-button full-width-btn">
                {isLogin ? `Continue to ${role === "customer" ? "Customer Portal" : "Owner Console"}` : "Create Account"}
              </button>
            </div>
          </form>

          <div className="auth-footer-link">
            <Link to={isLogin ? "/register" : "/login"}>
              {isLogin ? "Need an account? Register here" : "Already registered? Login here"}
            </Link>
          </div>
        </section>

        <section className="card demo-login-card">
          <p className="eyebrow">Instant Demo Shortcuts</p>
          <h3>Verified Seed Accounts</h3>
          <p className="demo-card-subtitle">One-click evaluation logins for all pre-seeded database accounts:</p>

          <div className="demo-buttons-stack">
            <p className="eyebrow" style={{ marginTop: "4px", marginBottom: "4px" }}>Rental Owner Accounts</p>
            {seedAccounts.owners.map((owner) => (
              <button
                key={owner.email}
                type="button"
                className="secondary-button demo-login-btn owner-demo"
                onClick={() => handleDirectDemoLogin(owner, "owner")}
                title={`Login directly as ${owner.company_name}`}
              >
                <div className="demo-btn-text">
                  <strong>{owner.company_name}</strong>
                  <span>email: {owner.email}</span>
                </div>
                <span className="badge-pill">Owner Admin</span>
              </button>
            ))}

            <p className="eyebrow" style={{ marginTop: "12px", marginBottom: "4px" }}>Customer Accounts</p>
            {seedAccounts.customers.slice(0, 2).map((cust) => (
              <button
                key={cust.email}
                type="button"
                className="secondary-button demo-login-btn customer-demo"
                onClick={() => handleDirectDemoLogin(cust, "customer")}
                title={`Login directly as ${cust.name}`}
              >
                <div className="demo-btn-text">
                  <strong>{cust.name}</strong>
                  <span>email: {cust.email}</span>
                </div>
                <span className="badge-pill">Customer</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
