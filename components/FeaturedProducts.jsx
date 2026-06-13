import Link from "next/link";
import { getProductosDestacados } from "../app/lib/api";
import ProductCard from "./ProductCard";

export default async function FeaturedProducts() {
  let productos = [];

  try {
    const response = await getProductosDestacados(6);
    productos = response.data || [];
  } catch {
    productos = [];
  }

  if (!productos.length) return null;

  return (
    <section className="section">
      <div className="container">
        <div className="section-heading">
          <span>Catálogo Andyfers</span>
          <h2>Productos destacados</h2>
          <p>
            Primeros productos disponibles desde la base de datos. En módulos
            siguientes ajustaremos prioridades, imágenes y contenido comercial.
          </p>
        </div>

        <div className="product-grid">
          {productos.map((producto) => (
            <ProductCard key={producto.id} producto={producto} />
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 28 }}>
          <Link href="/catalogo" className="btn-primary">
            Ver catálogo completo
          </Link>
        </div>
      </div>
    </section>
  );
}