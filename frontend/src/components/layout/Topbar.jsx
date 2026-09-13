export function Topbar({ areaLabel, pageTitle, pageDescription, currentUser, onMenuToggle, theme, onToggleTheme }) {
  return (
    <header className="topbar">
      <div className="topbar-main">
        <button type="button" className="menu-button" onClick={onMenuToggle} aria-label="Open navigation">
          ☰ Navigation
        </button>
        <div>
          <p className="eyebrow">{areaLabel}</p>
          <h3>{pageTitle}</h3>
          <p className="topbar-desc">{pageDescription}</p>
        </div>
      </div>
      <div className="topbar-actions">
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
        >
          {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>

        <div className="mock-user-card">
          <strong>{currentUser.name}</strong>
          <span>{currentUser.detail}</span>
        </div>
      </div>
    </header>
  );
}
