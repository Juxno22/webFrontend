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

export async function seoLandingFetch(path, options = {}) {
  const fetchOptions = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  };

  if (options.next) {
    fetchOptions.next = options.next;
    delete fetchOptions.cache;
  } else {
    fetchOptions.cache = options.cache || "no-store";
  }

  const response = await fetch(`${API_URL}${path}`, fetchOptions);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.error || "Error al conectar con la API SEO.");
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function getSeoLandings(options = {}) {
  return seoLandingFetch("/api/seo/landings", options);
}

export async function getSeoCategoriaLanding(slug, params = {}, options = {}) {
  const query = buildQuery(params);

  return seoLandingFetch(
    `/api/seo/landings/categoria/${encodeURIComponent(slug)}${query ? `?${query}` : ""}`,
    options
  );
}

export async function getSeoFamiliaLanding(slug, params = {}, options = {}) {
  const query = buildQuery(params);

  return seoLandingFetch(
    `/api/seo/landings/familia/${encodeURIComponent(slug)}${query ? `?${query}` : ""}`,
    options
  );
}

export async function getSeoCategoriasLandings(options = {}) {
  return seoLandingFetch("/api/seo/landings/categorias", options);
}

export async function getSeoFamiliasLandings(options = {}) {
  return seoLandingFetch("/api/seo/landings/familias", options);
}
