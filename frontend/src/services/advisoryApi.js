const API_BASE = "http://localhost:4000";

async function request(path) {
  const response = await fetch(`${API_BASE}${path}`);

  if (response.status === 404) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || "Not found");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `Request failed: ${response.status}`);
  }

  return response.json();
}

export function getAdvisoryHealth() {
  return request("/api/advisory/health");
}

export function getAdvisoryRecommendations() {
  return request("/api/advisory/recommendations");
}

export function getAdvisoryVehicleMetrics() {
  return request("/api/advisory/vehicle-metrics");
}

export function getAdvisoryBaselines() {
  return request("/api/advisory/baselines");
}
