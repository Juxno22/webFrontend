import Link from "next/link";

function cleanText(value, fallback = "") {
  if (value === null || value === undefined) return fallback;

  return String(value).replace(/\s+/g, " ").trim() || fallback;
}

export default function CatalogSeoIndexClient({ categorias = [], familias = [] }) {
  return (
    <main className="seo-landing-page">
      <section className="seo-landing-hero seo-index-hero">
        <div className="seo-landing-copy">
          <div className="seo-eyebrow">Catálogo SEO Andyfers</div>
          <h1>Líneas y categorías</h1>
          <p>
            Explora las páginas indexables del catálogo Andyfers por categoría y familia comercial.
            Estas landings ayudan a posicionar productos y facilitan la navegación hacia cotización.
          </p>
        </div>

        <div className="seo-landing-summary">
          <div>
            <strong>{categorias.length}</strong>
            <span>categorías</span>
          </div>
          <div>
            <strong>{familias.length}</strong>
            <span>familias</span>
          </div>
          <div>
            <strong>{categorias.length + familias.length}</strong>
            <span>landings</span>
          </div>
        </div>
      </section>

      <section className="seo-landing-facets seo-index-grid">
        <div className="seo-facet-card seo-index-card">
          <h2>Categorías</h2>
          <div className="seo-chip-list">
            {categorias.map((item) => (
              <Link key={item.slug} href={`/catalogo/categoria/${encodeURIComponent(item.slug)}`}>
                {cleanText(item.nombre, item.slug)} <span>{item.total_productos}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="seo-facet-card seo-index-card">
          <h2>Familias comerciales</h2>
          <div className="seo-chip-list">
            {familias.map((item) => (
              <Link key={item.slug} href={`/catalogo/familia/${encodeURIComponent(item.slug)}`}>
                {cleanText(item.nombre || item.familia, item.slug)} <span>{item.total_productos}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
