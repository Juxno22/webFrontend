import Link from "next/link";
import { ArrowRight, ClipboardList, Search, Sparkles } from "lucide-react";

function getBannerIcon(banner) {
  const key = String(banner?.banner_key || "").toLowerCase();
  const position = String(banner?.posicion || "").toLowerCase();

  if (key.includes("cotizacion") || position.includes("cotizacion")) {
    return ClipboardList;
  }

  if (key.includes("catalogo") || position.includes("catalogo")) {
    return Search;
  }

  return Sparkles;
}

function getBannerImage(banner) {
  return banner?.media_url || banner?.thumbnail_url || "";
}

export default function HomeEditableBannersSection({ banners = [] }) {
  const visibleBanners = Array.isArray(banners)
    ? banners.filter((banner) => Number(banner.activo) === 1)
    : [];

  if (!visibleBanners.length) return null;

  return (
    <section className="andy-editable-banners-section">
      <div className="container">
        <div className="andy-editable-banners-grid">
          {visibleBanners.map((banner) => {
            const Icon = getBannerIcon(banner);
            const imageUrl = getBannerImage(banner);

            return (
              <article
                className="andy-editable-banner-card"
                key={banner.id || banner.banner_key}
                style={{
                  "--banner-bg": banner.color_fondo || "#ffffff",
                  "--banner-text": banner.color_texto || "var(--text-dark)",
                }}
              >
                <div className="andy-editable-banner-content">
                  <div className="andy-editable-banner-icon">
                    <Icon size={23} />
                  </div>

                  {banner.subtitulo && (
                    <span className="andy-section-kicker">
                      {banner.subtitulo}
                    </span>
                  )}

                  <h2>{banner.titulo}</h2>

                  {banner.descripcion && <p>{banner.descripcion}</p>}

                  {banner.url_boton && (
                    <Link
                      href={banner.url_boton}
                      className="andy-editable-banner-link"
                    >
                      {banner.texto_boton || "Ver más"}
                      <ArrowRight size={17} />
                    </Link>
                  )}
                </div>

                {imageUrl && (
                  <div className="andy-editable-banner-media">
                    <img
                      src={imageUrl}
                      alt={banner.titulo || "Banner Andyfers"}
                      loading="lazy"
                    />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}