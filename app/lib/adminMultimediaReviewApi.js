import { adminFetch, getAdminToken } from "./adminApi";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      searchParams.set(key, String(value).trim());
    }
  });

  return searchParams.toString();
}

function withQuery(path, params = {}) {
  const query = buildQuery(params);

  return `${path}${query ? `?${query}` : ""}`;
}

export async function getAdminMultimediaMacheoResumen() {
  return adminFetch("/api/admin/multimedia-macheo/resumen");
}

export async function getAdminMultimediaMacheoReportes(params = {}) {
  return adminFetch(withQuery("/api/admin/multimedia-macheo/reportes", params));
}

export async function getAdminMultimediaMacheoReporte(id, params = {}) {
  return adminFetch(
    withQuery(`/api/admin/multimedia-macheo/reportes/${encodeURIComponent(id)}`, params)
  );
}

export async function uploadAdminMultimediaMacheoReporte(file, payload = {}) {
  const token = getAdminToken();
  const formData = new FormData();

  if (file) formData.append("file", file);

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      formData.append(key, String(value).trim());
    }
  });

  const response = await fetch(`${API_URL}/api/admin/multimedia-macheo/reportes/upload`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || data?.ok === false) {
    throw new Error(data?.error || "No se pudo cargar el reporte multimedia.");
  }

  return data;
}

export async function updateAdminMultimediaMacheoItem(id, payload) {
  return adminFetch(`/api/admin/multimedia-macheo/items/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function generateAdminMultimediaMacheoPendientes(id) {
  return adminFetch(
    `/api/admin/multimedia-macheo/reportes/${encodeURIComponent(id)}/generar-pendientes`,
    {
      method: "POST",
    }
  );
}

export async function deleteAdminMultimediaMacheoReporte(id) {
  return adminFetch(`/api/admin/multimedia-macheo/reportes/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function downloadAdminMultimediaMacheoReporte(id, params = {}) {
  const token = getAdminToken();
  const query = buildQuery(params);

  const response = await fetch(
    `${API_URL}/api/admin/multimedia-macheo/reportes/${encodeURIComponent(id)}/export${
      query ? `?${query}` : ""
    }`,
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "No se pudo exportar el reporte multimedia.");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `multimedia_macheo_reporte_${id}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
