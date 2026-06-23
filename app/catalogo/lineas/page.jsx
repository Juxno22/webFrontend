import CatalogSeoIndexClient from "../../../components/CatalogSeoIndexClient";
import { getSeoLandings } from "../../lib/seoLandingApi";
import "../../styles/catalog-seo-landing.css";

export const metadata = {
  title: "Líneas y categorías Andyfers",
  description:
    "Explora las categorías y familias comerciales indexables del catálogo Andyfers para refacciones automotrices.",
  alternates: {
    canonical: "/catalogo/lineas",
  },
};

async function loadLandings() {
  try {
    const response = await getSeoLandings({ next: { revalidate: 1800 } });

    return response?.data || { categorias: [], familias: [] };
  } catch {
    return { categorias: [], familias: [] };
  }
}

export default async function CatalogoLineasPage() {
  const data = await loadLandings();

  return (
    <CatalogSeoIndexClient
      categorias={Array.isArray(data.categorias) ? data.categorias : []}
      familias={Array.isArray(data.familias) ? data.familias : []}
    />
  );
}
