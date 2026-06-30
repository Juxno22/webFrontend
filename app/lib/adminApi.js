const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:4000"
).replace(/\/+$/, "");

const TOKEN_KEY = "andyfers_admin_token";
const USER_KEY = "andyfers_admin_user";

export function getAdminToken() {
  if (typeof window === "undefined") return null;

  return window.localStorage.getItem(TOKEN_KEY);
}

export function getAdminUser() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAdminSession(token, user) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAdminSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export async function adminFetch(path, options = {}) {
  const token = getAdminToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "Error en petición admin.");
  }

  return data;
}

export async function adminLogin(payload) {
  const response = await fetch(`${API_URL}/api/admin/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "No se pudo iniciar sesión.");
  }

  saveAdminSession(data.token, data.user);

  return data;
}

export async function getAdminCotizaciones(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      searchParams.set(key, String(value).trim());
    }
  });

  const query = searchParams.toString();

  return adminFetch(`/api/admin/cotizaciones${query ? `?${query}` : ""}`);
}

export async function getAdminCotizacion(folio) {
  return adminFetch(`/api/admin/cotizaciones/${encodeURIComponent(folio)}`);
}

export async function updateCotizacionEstado(folio, payload) {
  return adminFetch(`/api/admin/cotizaciones/${encodeURIComponent(folio)}/estado`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function addCotizacionEvento(folio, payload) {
  return adminFetch(`/api/admin/cotizaciones/${encodeURIComponent(folio)}/eventos`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getAdminCotizacionesResumen(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      searchParams.set(key, String(value).trim());
    }
  });

  const query = searchParams.toString();

  return adminFetch(
    `/api/admin/cotizaciones/resumen${query ? `?${query}` : ""}`
  );
}

export async function getAdminProductosResumen() {
  return adminFetch("/api/admin/productos/resumen");
}

export async function getAdminProductos(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      searchParams.set(key, String(value).trim());
    }
  });

  const query = searchParams.toString();

  return adminFetch(`/api/admin/productos${query ? `?${query}` : ""}`);
}

export async function getAdminProducto(id) {
  return adminFetch(`/api/admin/productos/${encodeURIComponent(id)}`);
}

export async function updateAdminProducto(id, payload) {
  return adminFetch(`/api/admin/productos/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getAdminHomeHeroSlides() {
  return adminFetch("/api/admin/home/hero-slides");
}

export async function createAdminHomeHeroSlide(payload) {
  return adminFetch("/api/admin/home/hero-slides", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminHomeHeroSlide(id, payload) {
  return adminFetch(`/api/admin/home/hero-slides/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminHomeHeroSlide(id) {
  return adminFetch(`/api/admin/home/hero-slides/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

function m62bGetApiBaseUrl() {
  return API_URL.endsWith("/api")
    ? API_URL
    : `${API_URL}/api`;
}

function m62bGetAdminToken() {
  if (typeof window === "undefined") return "";

  return (
    window.localStorage.getItem("andyfers_admin_token") ||
    window.localStorage.getItem("admin_token") ||
    window.localStorage.getItem("token") ||
    ""
  );
}

async function m62bParseResponse(response) {
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

function m62bAuthHeaders(extraHeaders = {}) {
  const token = m62bGetAdminToken();

  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getAdminProductoCategorias() {
  const response = await fetch(
    `${m62bGetApiBaseUrl()}/admin/productos/catalogos/categorias`,
    {
      headers: m62bAuthHeaders(),
    }
  );

  return m62bParseResponse(response);
}

export async function createAdminProducto(payload) {
  const response = await fetch(`${m62bGetApiBaseUrl()}/admin/productos`, {
    method: "POST",
    headers: m62bAuthHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });

  return m62bParseResponse(response);
}

export async function deleteAdminProducto(id) {
  const response = await fetch(`${m62bGetApiBaseUrl()}/admin/productos/${id}`, {
    method: "DELETE",
    headers: m62bAuthHeaders(),
  });

  return m62bParseResponse(response);
}

export async function updateAdminProductoAccionesRapidas(id, payload) {
  return adminFetch(
    `/api/admin/productos/${encodeURIComponent(id)}/acciones-rapidas`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

function buildAdminQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      searchParams.set(key, String(value).trim());
    }
  });

  return searchParams.toString();
}

/* ADMIN CONTENIDO EDITABLE API */

export async function getAdminSiteContentBlocks(params = {}) {
  const query = buildAdminQuery(params);

  return adminFetch(
    `/api/admin/site/content-blocks${query ? `?${query}` : ""}`
  );
}

export async function createAdminSiteContentBlock(payload) {
  return adminFetch("/api/admin/site/content-blocks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminSiteContentBlock(id, payload) {
  return adminFetch(`/api/admin/site/content-blocks/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminSiteContentBlock(id) {
  return adminFetch(`/api/admin/site/content-blocks/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function getAdminSiteBanners(params = {}) {
  const query = buildAdminQuery(params);

  return adminFetch(`/api/admin/site/banners${query ? `?${query}` : ""}`);
}

export async function createAdminSiteBanner(payload) {
  return adminFetch("/api/admin/site/banners", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminSiteBanner(id, payload) {
  return adminFetch(`/api/admin/site/banners/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminSiteBanner(id) {
  return adminFetch(`/api/admin/site/banners/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function getAdminSiteLineasComerciales(params = {}) {
  const query = buildAdminQuery(params);

  return adminFetch(
    `/api/admin/site/lineas-comerciales${query ? `?${query}` : ""}`
  );
}

export async function createAdminSiteLineaComercial(payload) {
  return adminFetch("/api/admin/site/lineas-comerciales", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminSiteLineaComercial(id, payload) {
  return adminFetch(
    `/api/admin/site/lineas-comerciales/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export async function deleteAdminSiteLineaComercial(id) {
  return adminFetch(
    `/api/admin/site/lineas-comerciales/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    }
  );
}

export async function getAdminSiteSeccionesDestacadas(params = {}) {
  const query = buildAdminQuery(params);

  return adminFetch(
    `/api/admin/site/secciones-destacadas${query ? `?${query}` : ""}`
  );
}

export async function createAdminSiteSeccionDestacada(payload) {
  return adminFetch("/api/admin/site/secciones-destacadas", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminSiteSeccionDestacada(id, payload) {
  return adminFetch(
    `/api/admin/site/secciones-destacadas/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export async function deleteAdminSiteSeccionDestacada(id) {
  return adminFetch(
    `/api/admin/site/secciones-destacadas/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    }
  );
}

export async function getAdminSiteContacto(params = {}) {
  const query = buildAdminQuery(params);

  return adminFetch(`/api/admin/site/contacto${query ? `?${query}` : ""}`);
}

export async function createAdminSiteContacto(payload) {
  return adminFetch("/api/admin/site/contacto", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminSiteContacto(id, payload) {
  return adminFetch(`/api/admin/site/contacto/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminSiteContacto(id) {
  return adminFetch(`/api/admin/site/contacto/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function uploadAdminSiteMedia(file, payload = {}) {
  const token = getAdminToken();

  const formData = new FormData();
  formData.append("file", file);

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      formData.append(key, String(value).trim());
    }
  });

  const response = await fetch(`${API_URL}/api/admin/site/media/upload`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || data?.ok === false) {
    throw new Error(data?.error || "No se pudo subir la imagen.");
  }

  return data;
}

export async function getAdminEcommerceInventarioResumen() {
  return adminFetch("/api/admin/ecommerce/inventario/resumen");
}

export async function uploadAdminEcommerceInventario(file, { dryRun = true } = {}) {
  const token = getAdminToken();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("dry_run", dryRun ? "1" : "0");

  const response = await fetch(
    `${API_URL}/api/admin/ecommerce/inventario/importar`,
    {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
      cache: "no-store",
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok || data?.ok === false) {
    throw new Error(data?.error || "No se pudo importar el inventario ecommerce.");
  }

  return data;
}

export async function getAdminVentasResumen(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      searchParams.set(key, String(value).trim());
    }
  });

  const query = searchParams.toString();

  return adminFetch(`/api/admin/ventas/resumen${query ? `?${query}` : ""}`);
}

export async function getAdminVentas(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      searchParams.set(key, String(value).trim());
    }
  });

  const query = searchParams.toString();

  return adminFetch(`/api/admin/ventas${query ? `?${query}` : ""}`);
}

export async function getAdminVenta(folio) {
  return adminFetch(`/api/admin/ventas/${encodeURIComponent(folio)}`);
}

export async function updateAdminVentaEstado(folio, payload) {
  return adminFetch(`/api/admin/ventas/${encodeURIComponent(folio)}/estado`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function addAdminVentaNota(folio, payload) {
  return adminFetch(`/api/admin/ventas/${encodeURIComponent(folio)}/notas`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getAdminOperacionResumen() {
  return adminFetch("/api/admin/operacion/resumen");
}

export async function getAdminChatConversaciones(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      searchParams.set(key, String(value).trim());
    }
  });

  const query = searchParams.toString();

  return adminFetch(`/api/admin/chat/conversaciones${query ? `?${query}` : ""}`);
}

export async function getAdminChatConversacion(id) {
  return adminFetch(`/api/admin/chat/conversaciones/${id}`);
}

export async function createAdminChatFromCotizacion(folio) {
  return adminFetch(
    `/api/admin/chat/conversaciones/from-cotizacion/${encodeURIComponent(folio)}`,
    {
      method: "POST",
    }
  );
}

export async function sendAdminChatMensaje(id, mensaje) {
  return adminFetch(`/api/admin/chat/conversaciones/${id}/mensajes`, {
    method: "POST",
    body: JSON.stringify({ mensaje }),
  });
}

export async function updateAdminChatEstado(id, estado) {
  return adminFetch(`/api/admin/chat/conversaciones/${id}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ estado }),
  });
}