import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Droplets,
  Gauge,
  PackageSearch,
  ShieldCheck,
  Thermometer,
  Wrench,
  ThermometerSnowflakeIcon,
  TerminalSquareIcon,
  Fan,
  ChartBarStackedIcon,
} from "lucide-react";

const lineas = [
  {
    title: "Termostatos",
    description:
      "Componentes para regular el flujo de refrigerante y ayudar al control térmico del motor.",
    icon: Gauge,
    href: "/catalogo?familia=TERMOSTATO",
    tags: ["Temperatura", "Motor", "Refrigerante"],
  },
  {
    title: "Bombas de agua",
    description:
      "Piezas para mantener la circulación del refrigerante dentro del sistema.",
    icon: Droplets,
    href: "/catalogo?familia=BOMBAS%20DE%20AGUA",
    tags: ["Flujo", "Refrigerante", "Motor"],
  },
  {
    title: "Depósitos y tapones",
    description:
      "Soluciones para recuperación, almacenamiento y presión del sistema de enfriamiento.",
    icon: ShieldCheck,
    href: "/catalogo?q=deposito",
    tags: ["Depósito", "Tapón", "Presión"],
  },
  {
    title: "Tomas de agua",
    description:
      "Tomas de agua, tomas de aire, carcasas y conexiones relacionadas.",
    icon: Boxes,
    href: "/catalogo?q=toma",
    tags: ["Toma agua", "Toma aire", "Conexión"],
  },
  {
    title: "Mangueras",
    description:
      "Mangueras y soluciones flexibles para conducción dentro del sistema automotriz.",
    icon: PackageSearch,
    href: "/catalogo?familia=MANGUERA%20MULTIFLEX",
    tags: ["Flexible", "Multiflex", "Conducción"],
  },
  {
    title: "Poleas",
    description:
      "Poleas con búsqueda por diámetro, material, tipo, canales, cruces y códigos equivalentes.",
    icon: Wrench,
    href: "/catalogo?familia=POLEAS",
    tags: ["Diámetro", "Canales", "Cruces", "OEM"],
  },
  {
    title: "Fan clutch",
    description:
      "Fan clutch con búsqueda por diámetro, tipo, cruces y códigos equivalentes.",
    icon: Fan,
    href: "/catalogo",
    tags: ["Diámetro", "Tipo", "Cruces", "OEM"],
  },
  {
    title: "Tensores",
    description:
      "Esenciales para mantener la tensión adecuada.",
    icon: ChartBarStackedIcon,
    href: "/catalogo?familia=TENSOR",
    tags: ["Tensión", "Correas ", " Cadenas del Motor"],
  },
];

export const metadata = {
  title: "Líneas de producto | Andyfers",
  description:
    "Explora las líneas de producto Andyfers y consulta refacciones por sistema, familia, cruce o atributo técnico.",
};

export default function LineasPage() {
  return (
    <main className="lineas-page">
      <section className="lineas-page-hero">
        <div className="lineas-home-decor lineas-home-decor-left" />
        <div className="lineas-home-decor lineas-home-decor-right" />

        <div className="container lineas-page-hero-inner">
          <div>
            <h1>Catalogo por linea.</h1>
          </div>
        </div>
      </section>

      <section className="lineas-list-section">
        <div className="container">

          <div className="lineas-list-grid">
            {lineas.map((linea) => {
              const Icon = linea.icon;

              return (
                <Link
                  href={linea.href}
                  className="linea-clean-card"
                  key={linea.title}
                >
                  <div className="linea-clean-icon">
                    <Icon size={28} />
                  </div>

                  <h3>{linea.title}</h3>
                  <p>{linea.description}</p>

                  <div className="linea-clean-tags">
                    {linea.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>

                  <div className="linea-clean-action">
                    Ver productos
                    <ArrowRight size={16} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}