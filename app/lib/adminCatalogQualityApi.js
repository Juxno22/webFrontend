import { adminFetch } from "./adminApi";

function buildAdminCatalogQualityQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      searchParams.set(key, String(value).trim());
    }
  });

  return searchParams.toString();
}

function withQuery(path, params = {}) {
  const query = buildAdminCatalogQualityQuery(params);

  return `${path}${query ? `?${query}` : ""}`;
}

export async function getAdminCatalogQualityCierre(params = {}) {
  return adminFetch(withQuery("/api/admin/catalogo-calidad/cierre", params));
}

export async function getAdminCatalogQualityResumen(params = {}) {
  return adminFetch(withQuery("/api/admin/catalogo-calidad/resumen", params));
}

export async function getAdminCatalogQualityProductos(params = {}) {
  return adminFetch(withQuery("/api/admin/catalogo-calidad/productos", params));
}

export async function getAdminCatalogQualitySinImagen(params = {}) {
  return adminFetch(withQuery("/api/admin/catalogo-calidad/sin-imagen", params));
}

export async function getAdminCatalogQualityIncompletos(params = {}) {
  return adminFetch(withQuery("/api/admin/catalogo-calidad/incompletos", params));
}

export async function getAdminCatalogQualityOpciones() {
  return adminFetch("/api/admin/catalogo-calidad/opciones");
}

export async function getAdminCatalogQualityOportunidades(params = {}) {
  return adminFetch(withQuery("/api/admin/catalogo-calidad/oportunidades", params));
}
