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

//ATRIBUTOS
export async function createProductAttribute(productoId, payload) {
  const response = await fetch(
    `${getApiBaseUrl()}/admin/productos/${productoId}/atributos`,
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

export async function updateProductAttribute(productoId, atributoId, payload) {
  const response = await fetch(
    `${getApiBaseUrl()}/admin/productos/${productoId}/atributos/${atributoId}`,
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

export async function deleteProductAttribute(productoId, atributoId) {
  const response = await fetch(
    `${getApiBaseUrl()}/admin/productos/${productoId}/atributos/${atributoId}`,
    {
      method: "DELETE",
      headers: buildAuthHeaders(),
    }
  );

  return parseApiResponse(response);
}

//CRUCES
export async function createProductCross(productoId, payload) {
  const response = await fetch(
    `${getApiBaseUrl()}/admin/productos/${productoId}/cruces`,
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

export async function updateProductCross(productoId, cruceId, payload) {
  const response = await fetch(
    `${getApiBaseUrl()}/admin/productos/${productoId}/cruces/${cruceId}`,
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

export async function deleteProductCross(productoId, cruceId) {
  const response = await fetch(
    `${getApiBaseUrl()}/admin/productos/${productoId}/cruces/${cruceId}`,
    {
      method: "DELETE",
      headers: buildAuthHeaders(),
    }
  );

  return parseApiResponse(response);
}

//APLICACIIONES
export async function createProductApplication(productoId, payload) {
  const response = await fetch(
    `${getApiBaseUrl()}/admin/productos/${productoId}/aplicaciones`,
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

export async function updateProductApplication(productoId, aplicacionId, payload) {
  const response = await fetch(
    `${getApiBaseUrl()}/admin/productos/${productoId}/aplicaciones/${aplicacionId}`,
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

export async function deleteProductApplication(productoId, aplicacionId) {
  const response = await fetch(
    `${getApiBaseUrl()}/admin/productos/${productoId}/aplicaciones/${aplicacionId}`,
    {
      method: "DELETE",
      headers: buildAuthHeaders(),
    }
  );

  return parseApiResponse(response);
}