"use client";

import Link from "next/link";
import { Boxes, ChevronLeft, ChevronRight, Gauge, Layers3, Plus, SearchCheck, Wrench } from "lucide-react";
import { addToQuoteCart } from "@/app/lib/quoteCart";

function cleanText(value, fallback = "") {
  if (value === null || value === undefined) return fallback;

  return String(value).replace(/\s+/g, " ").trim() || fallback;
}

function isValidCode(value) {
  if (!value) return false;

  const clean = String(value).trim().toUpperCase();

  return ![
    "#N/A",
    "N/A",
    "NA",
    "ND",
    "N.D.",
    "SIN CODIGO",
    "SIN CÓDIGO",
    "NULL",
    "0",
  ].includes(clean);
}

function getProductCode(producto) {
  if (isValidCode(producto.codigo_publico)) return producto.codigo_publico;
  if (isValidCode(producto.codigo_andyfers)) return producto.codigo_andyfers;
  if (isValidCode(producto.codigo_importacion)) return producto.codigo_importacion;

  return null;
}

function buildCatalogUrl(filters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      params.set(key, String(value).trim());
    }
  });

  const query = params.toString();

  return `/catalogo${query ? `?${query}` : ""}`;
}

function ProductCard({ producto }) {
  const codigoDetalle = getProductCode(producto);
  const codigoVisible = codigoDetalle || "Sin código";
  const imageUrl = producto.imagen_thumbnail_url || producto.imagen_url;

  function handleAddToQuote() {
    addToQuoteCart(producto);

    window.dispatchEvent(
      new CustomEvent("andyfers_toast", {
        detail: {
          message: `${codigoVisible} agregado a cotización`,
        },
      })
    );
  }

  return (
    <article className="seo-product-card">
      <div className="seo-product-media">
        <span className="seo-product-code">{codigoVisible}</span>
        {imageUrl ? (
          <img src={imageUrl} alt={producto.descripcion || codigoVisible} loading="lazy" />
        ) : (
          <div className="seo-product-empty">
            <Wrench size={40} />
          </div>
        )}
      </div>

      <div className="seo-product-body">
        <div className="seo-product-tags">
          {producto.categoria && <span>{producto.categoria}</span>}
          {producto.familia && <span>{producto.familia}</span>}
        </div>

        <h2>{producto.descripcion || codigoVisible}</h2>

        <div className="seo-product-meta">
          {producto.armadora && (
            <span>
              <Gauge size={14} />
              {producto.armadora}
            </span>
          )}
          <span>
            <Boxes size={14} />
            {Number(producto.total_cruces || 0)} cruces
          </span>
          <span>
            <SearchCheck size={14} />
            {Number(producto.total_aplicaciones || 0)} aplicaciones
          </span>
        </div>

        <p>Compatibilidad y disponibilidad sujetas a validación.</p>

        <div className="seo-product-actions">
          {codigoDetalle ? (
            <Link href={`/producto/${encodeURIComponent(codigoDetalle)}`} className="seo-btn secondary">
              Ver detalle
            </Link>
          ) : (
            <button className="seo-btn secondary" disabled>
              Sin detalle
            </button>
          )}

          <button type="button" className="seo-btn primary" onClick={handleAddToQuote}>
            <Plus size={16} />
            Cotizar
          </button>
        </div>
      </div>
    </article>
  );
}

function Pagination({ basePath, pagination }) {
  const page = Number(pagination?.page || 1);
  const totalPages = Number(pagination?.total_pages || 1);

  if (totalPages <= 1) return null;

  function pageUrl(targetPage) {
    if (targetPage <= 1) return basePath;

    return `${basePath}?page=${targetPage}`;
  }

  return (
    <nav className="seo-landing-pagination" aria-label="Paginación de productos">
      {page > 1 ? (
        <Link href={pageUrl(page - 1)} className="seo-page-link">
          <ChevronLeft size={16} />
          Anterior
        </Link>
      ) : (
        <span className="seo-page-link disabled">
          <ChevronLeft size={16} />
          Anterior
        </span>
      )}

      <span className="seo-page-status">
        Página {page} de {totalPages}
      </span>

      {page < totalPages ? (
        <Link href={pageUrl(page + 1)} className="seo-page-link">
          Siguiente
          <ChevronRight size={16} />
        </Link>
      ) : (
        <span className="seo-page-link disabled">
          Siguiente
          <ChevronRight size={16} />
        </span>
      )}
    </nav>
  );
}

export default function CatalogSeoLandingClient({ tipo, data, slug }) {
  const landing = data?.landing || {};
  const productos = Array.isArray(data?.productos) ? data.productos : [];
  const facets = data?.facets || {};
  const pagination = data?.pagination || {};
  const nombre = cleanText(landing.nombre, tipo === "categoria" ? "Categoría" : "Familia");
  const basePath = tipo === "categoria" ? `/catalogo/categoria/${slug}` : `/catalogo/familia/${slug}`;
  const catalogFilters = tipo === "categoria" ? { categoria: nombre } : { familia: nombre };

  return (
    <main className="seo-landing-page">
      <section className="seo-landing-hero">
        <div className="seo-landing-copy">
          <div className="seo-eyebrow">
            <Layers3 size={16} />
            {tipo === "categoria" ? "Categoría Andyfers" : "Línea comercial Andyfers"}
          </div>

          <h1>{nombre}</h1>
          <p>{landing.descripcion_seo}</p>

          <div className="seo-landing-actions">
            <Link href={buildCatalogUrl(catalogFilters)} className="seo-btn primary hero-action">
              Ver en catálogo
            </Link>
            <Link href="/cotizacion" className="seo-btn secondary hero-action">
              Ir a cotización
            </Link>
          </div>
        </div>

        <div className="seo-landing-summary">
          <div>
            <strong>{Number(pagination.total || landing.total_productos || 0).toLocaleString("es-MX")}</strong>
            <span>productos indexables</span>
          </div>
          <div>
            <strong>{Number(facets?.armadoras?.length || 0).toLocaleString("es-MX")}</strong>
            <span>armadoras principales</span>
          </div>
          <div>
            <strong>{Number(productos.length || 0).toLocaleString("es-MX")}</strong>
            <span>mostrados en esta página</span>
          </div>
        </div>
      </section>

      <section className="seo-landing-facets" aria-label="Filtros relacionados">
        {tipo === "categoria" && Array.isArray(facets.familias) && facets.familias.length > 0 && (
          <div className="seo-facet-card">
            <h2>Familias relacionadas</h2>
            <div className="seo-chip-list">
              {facets.familias.map((item) => (
                <Link key={item.familia} href={buildCatalogUrl({ categoria: nombre, familia: item.familia })}>
                  {item.familia} <span>{item.total_productos}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {tipo === "familia" && Array.isArray(facets.categorias) && facets.categorias.length > 0 && (
          <div className="seo-facet-card">
            <h2>Categorías relacionadas</h2>
            <div className="seo-chip-list">
              {facets.categorias.map((item) => (
                <Link key={item.categoria} href={buildCatalogUrl({ categoria: item.categoria, familia: nombre })}>
                  {item.categoria} <span>{item.total_productos}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {Array.isArray(facets.armadoras) && facets.armadoras.length > 0 && (
          <div className="seo-facet-card">
            <h2>Armadoras frecuentes</h2>
            <div className="seo-chip-list">
              {facets.armadoras.map((item) => (
                <Link key={item.armadora} href={buildCatalogUrl({ ...catalogFilters, armadora: item.armadora })}>
                  {item.armadora} <span>{item.total_productos}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="seo-products-section">
        <div className="seo-section-heading">
          <span>Catálogo indexable</span>
          <h2>Productos de {nombre}</h2>
          <p>Selecciona un producto para revisar compatibilidad o agregarlo a cotización.</p>
        </div>

        {productos.length > 0 ? (
          <div className="seo-products-grid">
            {productos.map((producto) => (
              <ProductCard key={producto.id} producto={producto} />
            ))}
          </div>
        ) : (
          <div className="seo-empty-state">
            No hay productos públicos disponibles para esta landing.
          </div>
        )}

        <Pagination basePath={basePath} pagination={pagination} />
      </section>
    </main>
  );
}
