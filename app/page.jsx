import HomeHeroCarousel from "@/components/HomeHeroCarousel";
import VehicleSearchBar from "@/components/VehicleSearchBar";
import HomeNewProductsClient from "@/components/HomeNewProductsClient";
import { getProductos } from "@/app/lib/api";
import HomeThemeSwitch from "@/components/HomeThemeSwitch";
import HomeVideoSection from "@/components/HomeVideoSection";

export const metadata = {
  title: "Andyfers Autopartes | Catálogo inteligente",
  description:
    "Catálogo inteligente Andyfers para buscar refacciones por vehículo, código, cruce o descripción y solicitar cotización con ventas.",
};

export default async function HomePage() {
  let productosNuevos = [];

  try {
    const response = await getProductos({
      limit: 12,
    });

    productosNuevos = response.data || [];
  } catch {
    productosNuevos = [];
  }

  return (
    <main className="andy-home-page">
      <HomeThemeSwitch />

      <HomeHeroCarousel />

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

      <div id="home-theme-trigger" className="home-theme-trigger" aria-hidden="true" />

      <div className="andy-white-home-area">
        <HomeVideoSection />
        <section className="andy-about-section">
          <div className="container andy-about-inner">
            <span className="andy-section-kicker">¿Quiénes somos?</span>

            <h2>En Andyfer’s.</h2>

            <p className="andy-about-lead">
              Cada vehículo tiene una historia. La nuestra es ayudarte a mantenerlo en movimiento. Soluciones confiables para el sistema de enfriamiento, refacciones de calidad y un compromiso con la industria automotriz mexicana. Detrás de cada pieza hay una persona que busca tranquilidad. Por eso, la excelencia no es un lujo, es nuestra norma.
            </p>

            <p>
              Porque un motor frío también calienta corazones.
            </p>
          </div>
        </section>
        <HomeNewProductsClient productos={productosNuevos} />
      </div>
    </main>
  );
}