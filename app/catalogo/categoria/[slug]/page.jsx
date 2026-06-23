import { notFound } from "next/navigation";
import CatalogSeoLandingClient from "../../../../components/CatalogSeoLandingClient";
import { getSeoCategoriaLanding } from "../../../lib/seoLandingApi";
import "../../../styles/catalog-seo-landing.css";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_PUBLIC_URL ||
  "http://localhost:3000";

function siteUrl(path = "/") {
  const base = SITE_URL.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `${base}${cleanPath}`;
}

function cleanText(value, fallback = "") {
  if (value === null || value === undefined) return fallback;

  return String(value).replace(/\s+/g, " ").trim() || fallback;
}

async function loadLanding(slug, page = 1) {
  try {
    const response = await getSeoCategoriaLanding(slug, { page, limit: 12 }, { next: { revalidate: 1800 } });

    return response?.data || null;
  } catch (error) {
    if (error?.status === 404) return null;

    throw error;
  }
}

export async function generateMetadata({ params }) {
  const slug = params?.slug || "";
  const data = await loadLanding(slug);

  if (!data?.landing) {
    return {
      title: "Categoría no encontrada",
      robots: { index: false, follow: false },
    };
  }

  const landing = data.landing;
  const title = cleanText(landing.titulo_seo, `${landing.nombre} Andyfers`);
  const description = cleanText(
    landing.descripcion_seo,
    `Consulta productos de ${landing.nombre} en Andyfers.`
  ).slice(0, 280);
  const canonical = `/catalogo/categoria/${encodeURIComponent(landing.slug || slug)}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
      siteName: "Andyfers",
      images: landing.imagen_url ? [{ url: landing.imagen_url }] : undefined,
    },
    twitter: {
      card: landing.imagen_url ? "summary_large_image" : "summary",
      title,
      description,
      images: landing.imagen_url ? [landing.imagen_url] : undefined,
    },
  };
}

function LandingJsonLd({ data, slug }) {
  const landing = data.landing;
  const productos = Array.isArray(data.productos) ? data.productos : [];
  const canonical = siteUrl(`/catalogo/categoria/${encodeURIComponent(landing.slug || slug)}`);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: cleanText(landing.titulo_seo, landing.nombre),
      description: landing.descripcion_seo,
      url: canonical,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: Number(data.pagination?.total || productos.length || 0),
        itemListElement: productos.slice(0, 12).map((producto, index) => {
          const codigo = producto.codigo_publico || producto.codigo_andyfers || producto.codigo_importacion;

          return {
            "@type": "ListItem",
            position: index + 1,
            url: codigo ? siteUrl(`/producto/${encodeURIComponent(codigo)}`) : canonical,
            name: cleanText(producto.descripcion, codigo || landing.nombre),
          };
        }),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Inicio",
          item: siteUrl("/"),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Catálogo",
          item: siteUrl("/catalogo"),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: landing.nombre,
          item: canonical,
        },
      ],
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export default async function CategoriaSeoPage({ params, searchParams }) {
  const slug = params?.slug || "";
  const page = Number(searchParams?.page || 1);
  const data = await loadLanding(slug, page);

  if (!data?.landing) notFound();

  return (
    <>
      <LandingJsonLd data={data} slug={slug} />
      <CatalogSeoLandingClient tipo="categoria" data={data} slug={data.landing.slug || slug} />
    </>
  );
}
