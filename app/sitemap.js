import { buildCanonicalProductPath } from "@/app/lib/productSeoUrl.js";

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

async function getSeoLandings() {
  try {
    const response = await fetch(`${API_URL}/api/seo/landings`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) return { categorias: [], familias: [] };

    const data = await response.json().catch(() => null);

    return {
      categorias: Array.isArray(data?.data?.categorias) ? data.data.categorias : [],
      familias: Array.isArray(data?.data?.familias) ? data.data.familias : [],
    };
  } catch {
    return { categorias: [], familias: [] };
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
      url: siteUrl("/catalogo/lineas"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.88,
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

  const [productos, landings] = await Promise.all([
    getSitemapProducts(),
    getSeoLandings(),
  ]);

  const categoryPages = landings.categorias
    .filter((item) => item.slug)
    .map((item) => ({
      url: siteUrl(`/catalogo/categoria/${encodeURIComponent(item.slug)}`),
      lastModified: safeDate(item.updated_at),
      changeFrequency: "weekly",
      priority: 0.86,
      images: item.imagen_url ? [item.imagen_url] : undefined,
    }));

  const familyPages = landings.familias
    .filter((item) => item.slug)
    .map((item) => ({
      url: siteUrl(`/catalogo/familia/${encodeURIComponent(item.slug)}`),
      lastModified: safeDate(item.updated_at),
      changeFrequency: "weekly",
      priority: 0.84,
      images: item.imagen_url ? [item.imagen_url] : undefined,
    }));

  const productPages = productos
    .filter((producto) => producto.codigo_publico)
    .map((producto) => ({
      url: siteUrl(buildCanonicalProductPath(producto,producto.codigo_publico)),
      lastModified: safeDate(producto.updated_at || producto.created_at),
      changeFrequency: producto.destacado || producto.nuevo_web ? "weekly" : "monthly",
      priority: producto.destacado ? 0.85 : producto.nuevo_web ? 0.8 : 0.65,
      images: producto.imagen_url ? [producto.imagen_url] : undefined,
    }));

  return [...staticPages, ...categoryPages, ...familyPages, ...productPages];
}
