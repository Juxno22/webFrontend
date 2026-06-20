const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function apiFetch(path, options = {}) {
    const url = `${API_URL}${path}`
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
        cache: "no-store",
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(data?.error || "Error al conectar con la API");
    }
    return data;
}

export async function getBackendHealth() {
    return apiFetch("/api/health");
}

export async function getDbHealth() {
    return apiFetch("/api/db-health");
}

export function buildQuery(params = {}) {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).trim() !== "") {
            searchParams.set(key, String(value).trim());
        }
    });

    return searchParams.toString();
}

export async function getCategorias() {
    return apiFetch("/api/categorias");
}

export async function getFamilias() {
    return apiFetch("/api/familias");
}

export async function getArmadoras() {
    return apiFetch("/api/armadoras");
}

export async function getProductos(params = {}) {
    const query = buildQuery(params);
    return apiFetch(`/api/productos${query ? `?${query}` : ""}`);
}

export async function getProducto(codigo) {
    return apiFetch(`/api/productos/${encodeURIComponent(codigo)}`);
}

export async function getProductosDestacados(limit = 8) {
    return apiFetch(`/api/productos/destacados?limit=${limit}`);
}

export async function crearCotizacion(payload){
    return apiFetch("/api/cotizaciones", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function getCotizacionPublica(folio){
    return apiFetch(`/api/cotizaciones/${encodeURIComponent(folio)}/publica`);
}

export async function getVehiculoAnios() {
  return apiFetch("/api/vehiculos/anios");
}

export async function getVehiculoMarcas(anio) {
  return apiFetch(`/api/vehiculos/marcas?anio=${encodeURIComponent(anio)}`);
}

export async function getVehiculoModelos(anio, marca) {
  const query = buildQuery({ anio, marca });

  return apiFetch(`/api/vehiculos/modelos?${query}`);
}

export async function getVehiculoMotores(anio, marca, modelo) {
  const query = buildQuery({ anio, marca, modelo });

  return apiFetch(`/api/vehiculos/motores?${query}`);
}

export async function getVehiculoLineas(anio, marca, modelo, motor) {
  const query = buildQuery({ anio, marca, modelo, motor });

  return apiFetch(`/api/vehiculos/lineas?${query}`);
}

export async function getSearchSuggestions(q) {
  const query = buildQuery({ q });

  return apiFetch(`/api/buscar/sugerencias?${query}`);
}

export async function buscarConIA(payload = {}) {
  return apiFetch("/api/ia/buscar", {
    method: "POST",
    body: JSON.stringify({
      pregunta: payload.pregunta,
      q: payload.q,
      message: payload.message,
      origen: payload.origen || "CHAT_PUBLICO",
      session_id: payload.session_id || null,
    }),
  });
}
export async function getHomeHeroSlides() {
  return apiFetch("/api/home/hero-slides");
}

export async function getSiteHome() {
  return apiFetch("/api/site/home");
}

export async function getSiteContent(pagina = "HOME") {
  const query = buildQuery({ pagina });

  return apiFetch(`/api/site/content${query ? `?${query}` : ""}`);
}

export async function getSiteBanners(pagina = "HOME") {
  const query = buildQuery({ pagina });

  return apiFetch(`/api/site/banners${query ? `?${query}` : ""}`);
}

export async function getSiteLineasComerciales() {
  return apiFetch("/api/site/lineas-comerciales");
}

export async function getSiteSeccionesDestacadas(pagina = "HOME") {
  const query = buildQuery({ pagina });

  return apiFetch(`/api/site/secciones-destacadas${query ? `?${query}` : ""}`);
}

export async function getSiteContacto() {
  return apiFetch("/api/site/contacto");
}