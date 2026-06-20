import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Droplets,
  Fan,
  Gauge,
  Package,
  Wrench,
} from "lucide-react";

const iconMap = {
  radiator: Fan,
  droplets: Droplets,
  gauge: Gauge,
  package: Package,
  boxes: Boxes,
  wrench: Wrench,
};

export default function HomeCommercialLinesSection({
  lines = [],
  section = null,
}) {
  const visibleLines = Array.isArray(lines)
    ? lines.filter((line) => Number(line.visible_home) === 1)
    : [];

  if (!visibleLines.length) return null;

  const title = section?.titulo || "Líneas comerciales";
  const subtitle = section?.subtitulo || "Encuentra productos por línea";
  const description =
    section?.descripcion ||
    "Explora las principales líneas de producto Andyfers y llega más rápido al catálogo.";

  return (
    <section className="andy-home-lines-section">
      <div className="container">
        <div className="andy-home-lines-head">
          <div>
            <span className="andy-section-kicker">{subtitle}</span>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>

          {section?.cta_url && (
            <Link href={section.cta_url} className="andy-products-link">
              {section.cta_texto || "Ver catálogo"}
            </Link>
          )}
        </div>

        <div className="andy-home-lines-grid">
          {visibleLines.map((line) => {
            const Icon = iconMap[line.icono] || Boxes;

            return (
              <Link
                href={line.url_destino || "/catalogo"}
                className="andy-home-line-card"
                key={line.id || line.line_key}
              >
                <div
                  className="andy-home-line-icon"
                  style={line.color ? { "--line-color": line.color } : undefined}
                >
                  <Icon size={25} />
                </div>

                <h3>{line.nombre}</h3>

                <p>{line.descripcion_corta || line.descripcion_larga}</p>

                <div className="andy-home-line-action">
                  Ver productos
                  <ArrowRight size={16} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}