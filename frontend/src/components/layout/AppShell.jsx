import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Breadcrumbs } from "./Breadcrumbs";
import { PageContainer } from "./PageContainer";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { getAreaConfig, getRouteMeta } from "../../routes/navigation";
import { getCurrentSessionUser } from "../../data/users";

export function AppShell({ area }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("smartcar_theme") || "dark";
  });

  const areaConfig = getAreaConfig(area);
  const routeMeta = getRouteMeta(location.pathname);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("smartcar_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div className={`app-shell area-${area}`}>
      <Sidebar
        area={area}
        title={areaConfig.title}
        subtitle={areaConfig.subtitle}
        sections={areaConfig.sections}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
      <div className="shell-main">
        <Topbar
          areaLabel={areaConfig.topbarLabel}
          pageTitle={routeMeta.title}
          pageDescription={routeMeta.description}
          currentUser={getCurrentSessionUser(area)}
          onMenuToggle={() => setIsOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <PageContainer>
          <Breadcrumbs items={routeMeta.breadcrumbs} />
          <Outlet />
        </PageContainer>
      </div>
    </div>
  );
}
