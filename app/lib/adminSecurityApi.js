import { adminFetch } from "./adminApi";

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      searchParams.set(key, String(value).trim());
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function getAdminSecuritySummary(params = {}) {
  return adminFetch(`/api/admin/seguridad/resumen${buildQuery(params)}`);
}

export async function getAdminAuditLogs(params = {}) {
  return adminFetch(`/api/admin/seguridad/auditoria${buildQuery(params)}`);
}

export async function getAdminSecurityEvents(params = {}) {
  return adminFetch(`/api/admin/seguridad/eventos${buildQuery(params)}`);
}

export async function updateAdminSecurityEventStatus(id, estado) {
  return adminFetch(`/api/admin/seguridad/eventos/${encodeURIComponent(id)}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ estado }),
  });
}

export async function createAdminSecurityManualEvent(payload = {}) {
  return adminFetch("/api/admin/seguridad/eventos/manual", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getAdminCriticalActionSummary(params = {}) {
  return adminFetch(`/api/admin/seguridad/acciones-criticas/resumen${buildQuery(params)}`);
}

export async function getAdminCriticalActionLogs(params = {}) {
  return adminFetch(`/api/admin/seguridad/acciones-criticas${buildQuery(params)}`);
}
