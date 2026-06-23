import { adminFetch } from "./adminApi";

function buildAdminCommercialTasksQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      searchParams.set(key, String(value).trim());
    }
  });

  return searchParams.toString();
}

function withQuery(path, params = {}) {
  const query = buildAdminCommercialTasksQuery(params);

  return `${path}${query ? `?${query}` : ""}`;
}

export async function getAdminCommercialTasksResumen() {
  return adminFetch("/api/admin/pendientes-comerciales/resumen");
}

export async function getAdminCommercialTasks(params = {}) {
  return adminFetch(withQuery("/api/admin/pendientes-comerciales", params));
}

export async function getAdminCommercialTask(id) {
  return adminFetch(`/api/admin/pendientes-comerciales/${encodeURIComponent(id)}`);
}

export async function getAdminCommercialTasksOpciones() {
  return adminFetch("/api/admin/pendientes-comerciales/opciones");
}

export async function createAdminCommercialTask(payload) {
  return adminFetch("/api/admin/pendientes-comerciales", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminCommercialTask(id, payload) {
  return adminFetch(`/api/admin/pendientes-comerciales/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminCommercialTask(id, payload = {}) {
  return adminFetch(`/api/admin/pendientes-comerciales/${encodeURIComponent(id)}`, {
    method: "DELETE",
    body: JSON.stringify(payload),
  });
}

export async function syncAdminCommercialQualityTasks(payload = {}) {
  return adminFetch("/api/admin/pendientes-comerciales/generar-calidad", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


export async function syncAdminCommercialAnalyticsTasks(payload = {}) {
  return adminFetch("/api/admin/pendientes-comerciales/generar-analytics", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getAdminCommercialTaskProductContext(id) {
  return adminFetch(
    `/api/admin/pendientes-comerciales/${encodeURIComponent(id)}/producto-contexto`
  );
}

export async function applyAdminCommercialTaskAction(id, payload = {}) {
  return adminFetch(
    `/api/admin/pendientes-comerciales/${encodeURIComponent(id)}/aplicar-accion`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}
