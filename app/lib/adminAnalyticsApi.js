import { adminFetch } from "./adminApi";

function buildAdminAnalyticsQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      searchParams.set(key, String(value).trim());
    }
  });

  return searchParams.toString();
}

function withQuery(path, params = {}) {
  const query = buildAdminAnalyticsQuery(params);

  return `${path}${query ? `?${query}` : ""}`;
}

export async function getAdminAnalyticsDashboard(params = {}) {
  return adminFetch(withQuery("/api/admin/analytics/dashboard", params));
}

export async function getAdminAnalyticsBusquedasSinResultado(params = {}) {
  return adminFetch(
    withQuery("/api/admin/analytics/busquedas-sin-resultado", params)
  );
}

export async function getAdminAnalyticsProductosConsultados(params = {}) {
  return adminFetch(
    withQuery("/api/admin/analytics/productos-consultados", params)
  );
}

export async function getAdminAnalyticsProductosCotizados(params = {}) {
  return adminFetch(
    withQuery("/api/admin/analytics/productos-cotizados", params)
  );
}

export async function getAdminAnalyticsVehiculos(params = {}) {
  return adminFetch(withQuery("/api/admin/analytics/vehiculos", params));
}

export async function getAdminAnalyticsEventos(params = {}) {
  return adminFetch(withQuery("/api/admin/analytics/eventos", params));
}

export async function getAdminAnalyticsOportunidades(params = {}) {
  return adminFetch(withQuery("/api/admin/analytics/oportunidades", params));
}

export async function syncAdminAnalyticsOportunidades(params = {}) {
  return adminFetch(withQuery("/api/admin/analytics/oportunidades/sync", params), {
    method: "POST",
  });
}

export async function updateAdminAnalyticsOportunidad(id, payload) {
  return adminFetch(`/api/admin/analytics/oportunidades/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
