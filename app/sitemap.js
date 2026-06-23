const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_PUBLIC_URL ||
  "http://localhost:3000";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const revalidate = 3600;

function siteUrl(path = "/") {
  const base = SITE_URL.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `${base}${cleanPath}`;
}

function safeDate(value) {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) return new Date();

  return date;
}

async function getSitemapProducts() {
  try {
    const response = await fetch(`${API_URL}/api/seo/sitemap-productos?limit=50000`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) return [];

    const data = await response.json().catch(() => null);

    return Array.isArray(data?.data) ? data.data : [];
  } catch {
    return [];
  }
}

export default async function sitemap() {
  const now = new Date();

  const staticPages = [
    {
      url: siteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: siteUrl("/catalogo"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: siteUrl("/cotizacion"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: siteUrl("/contacto"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  const productos = await getSitemapProducts();

  const productPages = productos
    .filter((producto) => producto.codigo_publico)
    .map((producto) => ({
      url: siteUrl(`/producto/${encodeURIComponent(producto.codigo_publico)}`),
      lastModified: safeDate(producto.updated_at || producto.created_at),
      changeFrequency: producto.destacado || producto.nuevo_web ? "weekly" : "monthly",
      priority: producto.destacado ? 0.85 : producto.nuevo_web ? 0.8 : 0.65,
      images: producto.imagen_url ? [producto.imagen_url] : undefined,
    }));

  return [...staticPages, ...productPages];
}
