import Link from "next/link";
import ProductDetailClient from "../../../components/ProductDetailClient";
import { getProducto } from "../../lib/api";

export async function generateMetadata({ params }) {
  const { codigo } = await params;

  try {
    const response = await getProducto(codigo);
    const producto = response.data;

    const codigoVisible = producto.codigo_andyfers || codigo;

    return {
      title: `${codigoVisible} | Andyfers`,
      description: producto.descripcion,
    };
  } catch {
    return {
      title: `${codigo} | Andyfers`,
      description: `Detalle de producto ${codigo} en catálogo Andyfers.`,
    };
  }
}

export default async function ProductoPage({ params }) {
  const { codigo } = await params;

  let producto = null;
  let error = "";

  try {
    const response = await getProducto(codigo);
    producto = response.data;
  } catch (err) {
    error = err.message;
  }

  if (error || !producto) {
    return (
      <main className="product-detail-page">
        <section className="product-detail-error-section">
          <div className="container">
            <div className="empty-state">
              <h1>Producto no encontrado</h1>
              <p>{error || "No pudimos cargar este producto."}</p>
              <Link href="/catalogo" className="btn-primary">
                Volver al catálogo
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="product-detail-page">
      <ProductDetailClient producto={producto} />
    </main>
  );
}