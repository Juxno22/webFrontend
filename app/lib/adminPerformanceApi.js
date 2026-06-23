import { adminFetch } from "./adminApi";

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      searchParams.set(key, String(value).trim());
    }
  });

  return searchParams.toString();
}

export async function getAdminPerformanceResumen(params = {}) {
  const query = buildQuery(params);
  return adminFetch(`/api/admin/performance/resumen${query ? `?${query}` : ""}`);
}

export async function getAdminPerformanceEventos(params = {}) {
  const query = buildQuery(params);
  return adminFetch(`/api/admin/performance/eventos${query ? `?${query}` : ""}`);
}
