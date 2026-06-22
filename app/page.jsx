import Link from "next/link";
import HomeHeroCarousel from "@/components/HomeHeroCarousel";
import VehicleSearchBar from "@/components/VehicleSearchBar";
import HomeNewProductsClient from "@/components/HomeNewProductsClient";
import HomeCommercialLinesSection from "@/components/HomeCommercialLinesSection";
import { getProductos, getSiteHome } from "@/app/lib/api";
import HomeThemeSwitch from "@/components/HomeThemeSwitch";
import HomeVideoSection from "@/components/HomeVideoSection";
import HomeEditableBannersSection from "@/components/HomeEditableBannersSection";

export const metadata = {
  title: "Andyfer's",
  description:
    "Catálogo inteligente Andyfers para buscar refacciones por vehículo, código, cruce o descripción y solicitar cotización con ventas.",
};

function findBlock(siteHome, key) {
  return (
    siteHome?.content_blocks?.find((item) => item.content_key === key) || null
  );
}

function findSection(siteHome, key) {
  return (
    siteHome?.featured_sections?.find((item) => item.section_key === key) ||
    null
  );
}

export default async function HomePage() {
  let productosNuevos = [];
  let siteHome = null;

  try {
    const response = await getSiteHome();
    siteHome = response.data || null;
  } catch {
    siteHome = null;
  }

  const newProductsSection = findSection(siteHome, "home_productos_nuevos");

  try {
    const response = await getProductos({
      limit: newProductsSection?.limite_productos || 12,
      nuevo: 1,
    });

    productosNuevos = response.data || [];
  } catch {
    productosNuevos = [];
  }

  const heroContent = findBlock(siteHome, "home_intro_principal");
  const aboutContent = findBlock(siteHome, "home_quienes_somos");
  const finalCta = findBlock(siteHome, "home_cta_final");
  const commercialLinesSection = findSection(
    siteHome,
    "home_lineas_comerciales"
  );

  return (
    <main className="andy-home-page">
      <HomeThemeSwitch />

      <HomeHeroCarousel
        initialSlides={siteHome?.hero_slides || []}
        heroContent={heroContent}
      />

      <section className="andy-guided-search-section">
        <div className="container andy-guided-search-inner">
          <VehicleSearchBar />

          <div className="andy-guided-brand">
            <img
              src="/andyfers-home/logo-andyfers.png"
              alt="Andyfers Autopartes"
            />
          </div>
        </div>
      </section>

      <div
        id="home-theme-trigger"
        className="home-theme-trigger"
        aria-hidden="true"
      />

      <div className="andy-white-home-area">
        <HomeVideoSection />

        <section className="andy-about-section">
          <div className="container andy-about-inner">
            <span className="andy-section-kicker">
              {aboutContent?.etiqueta || "¿Quiénes somos?"}
            </span>

            <h2>{aboutContent?.titulo || "En Andyfer’s."}</h2>

            <p className="andy-about-lead">
              {aboutContent?.contenido ||
                "Cada vehículo tiene una historia. La nuestra es ayudarte a mantenerlo en movimiento. Soluciones confiables para el sistema de enfriamiento, refacciones de calidad y un compromiso con la industria automotriz mexicana. Detrás de cada pieza hay una persona que busca tranquilidad. Por eso, la excelencia no es un lujo, es nuestra norma."}
            </p>

            <p>
              {aboutContent?.subtitulo ||
                "Porque un motor frío también calienta corazones."}
            </p>
          </div>
        </section>

        <HomeNewProductsClient
          productos={productosNuevos}
          section={newProductsSection}
        />

        <HomeEditableBannersSection banners={siteHome?.banners || []} />

        <section className="andy-final-public-cta">
          <div className="container andy-final-public-cta-inner">
            <div>
              <span>{finalCta?.etiqueta || "¿Ya sabes qué pieza buscas?"}</span>
              <h2>
                {finalCta?.titulo ||
                  "Encuéntrala en el catálogo o arma tu cotización."}
              </h2>
            </div>

            <div className="andy-final-public-actions">
              <Link
                href={finalCta?.cta_url || "/catalogo"}
                className="andy-hero-btn catalogo"
              >
                {finalCta?.cta_texto || "Ver catálogo"}
              </Link>

              <Link href="/cotizacion" className="andy-hero-btn cotizacion">
                Mi cotización
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}