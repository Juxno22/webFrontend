import { Suspense } from "react";
import CatalogClient from "@/components/CatalogClient";
import VehicleSearchBar from "@/components/VehicleSearchBar";

export const metadata = {
  title: "Catálogo de refacciones | Andyfers",
  description:
    "Consulta el catálogo de refacciones Andyfers por código, categoría, familia, armadora o número de cruce.",
};

export default function CatalogoPage() {
  return (
    <>
      <section className="catalog-racing-hero">
        {/*<div className="catalog-racing-decor catalog-racing-decor-left" />
        <div className="catalog-racing-decor catalog-racing-decor-right" />*/}
        <div className="container catalog-racing-inner">
          <div className="quote-hero-logo-pop-catalogo" aria-hidden="true">
            <img
              src="/andyfers-home/logo-andyfers.png"
              alt="Andyfers Autopartes"
              height={"80pvh"}
            />
          </div>
        </div>
      </section>
      <section className="catalog-workspace-section">
        <div className="container catalog-workspace">
          <aside className="catalog-vehicle-sidebar">
            <VehicleSearchBar variant="sidebar" />
          </aside>

          <main className="catalog-products-area">
            <Suspense fallback={<div className="catalog-loader">Cargando catálogo...</div>}>
              <CatalogClient variant="topFilters" />
            </Suspense>
          </main>
        </div>
      </section>
    </>
  );
}