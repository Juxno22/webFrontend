import Link from "next/link";
import ProductDetailClient from "../../../components/ProductDetailClient";
import { getProducto } from "../../lib/api";

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

function getProductCode(producto, fallback = "") {
  return cleanText(
    producto?.codigo_andyfers || producto?.codigo_importacion || fallback,
    fallback
  );
}

function getProductImage(producto) {
  return (
    producto?.imagen_principal?.secure_url ||
    producto?.imagen_principal?.thumbnail_url ||
    producto?.imagen_url ||
    producto?.imagen_thumbnail_url ||
    producto?.multimedia?.[0]?.secure_url ||
    producto?.galeria?.[0]?.secure_url ||
    ""
  );
}

function buildProductDescription(producto, codigoVisible) {
  const descripcion = cleanText(producto?.descripcion);
  const familia = cleanText(producto?.familia);
  const armadora = cleanText(producto?.armadora);
  const categoria = cleanText(producto?.categoria);

  const parts = [descripcion, familia, categoria, armadora]
    .filter(Boolean)
    .join(" | ");

  return (
    parts ||
    `Consulta compatibilidad y solicita cotización del producto ${codigoVisible} en Andyfers.`
  ).slice(0, 280);
}

function ProductJsonLd({ producto, codigo }) {
  const codigoVisible = getProductCode(producto, codigo);
  const description = buildProductDescription(producto, codigoVisible);
  const image = getProductImage(producto);
  const canonical = siteUrl(`/producto/${encodeURIComponent(codigoVisible)}`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${codigoVisible} - ${cleanText(producto.descripcion, "Refacción Andyfers")}`,
    description,
    sku: codigoVisible,
    mpn: cleanText(producto.codigo_importacion || producto.codigo_andyfers || codigoVisible),
    brand: {
      "@type": "Brand",
      name: cleanText(producto.marca_producto, "Andyfers"),
    },
    category: cleanText(producto.categoria || producto.familia, "Refacciones automotrices"),
    url: canonical,
    image: image ? [image] : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export async function generateMetadata({ params }) {
  const { codigo } = await params;

  try {
    const response = await getProducto(codigo);
    const producto = response.data;
    const codigoVisible = getProductCode(producto, codigo);
    const description = buildProductDescription(producto, codigoVisible);
    const image = getProductImage(producto);
    const canonical = `/producto/${encodeURIComponent(codigoVisible)}`;
    const title = `${codigoVisible} | ${cleanText(producto.familia || producto.categoria, "Producto")}`;

    return {
      title,
      description,
      alternates: {
        canonical,
      },
      openGraph: {
        type: "website",
        url: canonical,
        title: `${codigoVisible} | Andyfers`,
        description,
        siteName: "Andyfers",
        images: image
          ? [
              {
                url: image,
                alt: `${codigoVisible} ${cleanText(producto.descripcion)}`,
              },
            ]
          : undefined,
      },
      twitter: {
        card: image ? "summary_large_image" : "summary",
        title: `${codigoVisible} | Andyfers`,
        description,
        images: image ? [image] : undefined,
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch {
    return {
      title: `${codigo} | Producto no encontrado`,
      description: `Detalle de producto ${codigo} en catálogo Andyfers.`,
      robots: {
        index: false,
        follow: true,
      },
    };
  }
}

export default async function ProductoPage({ params }) {
  const { codigo } = await params;

  let producto = null;
  let error = "";

  try {
    const response = await getProducto(codigo);
    producto = response.data;
  } catch (err) {
    error = err.message;
  }

  if (error || !producto) {
    return (
      <main className="product-detail-page">
        <section className="product-detail-error-section">
          <div className="container">
            <div className="empty-state">
              <h1>Producto no encontrado</h1>
              <p>{error || "No pudimos cargar este producto."}</p>
              <Link href="/catalogo" className="btn-primary">
                Volver al catálogo
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="product-detail-page">
      <ProductJsonLd producto={producto} codigo={codigo} />
      <ProductDetailClient producto={producto} />
    </main>
  );
}
