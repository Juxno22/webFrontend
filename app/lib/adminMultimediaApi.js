const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:4000"
).replace(/\/+$/, "");

function getApiBaseUrl() {
  return API_BASE_URL.endsWith("/api") ? API_BASE_URL : `${API_BASE_URL}/api`;
}

function getAdminToken() {
  if (typeof window === "undefined") return "";

  return (
    window.localStorage.getItem("andyfers_admin_token") ||
    window.localStorage.getItem("admin_token") ||
    window.localStorage.getItem("token") ||
    ""
  );
}

function buildAuthHeaders(extraHeaders = {}) {
  const token = getAdminToken();

  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseApiResponse(response) {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.ok === false) {
    throw new Error(
      payload.error ||
        payload.message ||
        "No se pudo completar la operación."
    );
  }

  return payload;
}

export async function uploadProductMedia(productoId, formData) {
  const response = await fetch(
    `${getApiBaseUrl()}/admin/productos/${productoId}/multimedia/upload`,
    {
      method: "POST",
      headers: buildAuthHeaders(),
      body: formData,
    }
  );

  return parseApiResponse(response);
}

export async function createProductMedia(productoId, payload) {
  const response = await fetch(
    `${getApiBaseUrl()}/admin/productos/${productoId}/multimedia`,
    {
      method: "POST",
      headers: buildAuthHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(payload),
    }
  );

  return parseApiResponse(response);
}

export async function updateProductMedia(productoId, mediaId, payload) {
  const response = await fetch(
    `${getApiBaseUrl()}/admin/productos/${productoId}/multimedia/${mediaId}`,
    {
      method: "PATCH",
      headers: buildAuthHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(payload),
    }
  );

  return parseApiResponse(response);
}

export async function deleteProductMedia(productoId, mediaId) {
  const response = await fetch(
    `${getApiBaseUrl()}/admin/productos/${productoId}/multimedia/${mediaId}`,
    {
      method: "DELETE",
      headers: buildAuthHeaders(),
    }
  );

  return parseApiResponse(response);
}