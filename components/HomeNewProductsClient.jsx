"use client";

import Link from "next/link";
import { Boxes, Gauge, Plus } from "lucide-react";
import { addToQuoteCart } from "@/app/lib/quoteCart";

function isValidCode(value) {
  if (!value) return false;

  const clean = String(value).trim().toUpperCase();

  return ![
    "#N/A",
    "N/A",
    "NA",
    "ND",
    "N.D.",
    "SIN CODIGO",
    "SIN CÓDIGO",
    "NULL",
    "0",
  ].includes(clean);
}

function getProductCode(producto) {
  if (isValidCode(producto.codigo_andyfers)) return producto.codigo_andyfers;
  if (isValidCode(producto.codigo_importacion)) return producto.codigo_importacion;

  return null;
}

export default function HomeNewProductsClient({ productos = [] }) {
  if (!productos.length) return null;

  function addProduct(producto) {
    const code = getProductCode(producto) || "Producto";

    addToQuoteCart(producto);

    window.dispatchEvent(
      new CustomEvent("andyfers_toast", {
        detail: {
          message: `${code} agregado a cotización`,
        },
      })
    );
  }

  return (
    <section className="andy-new-products-section">
      <div className="container">
        <div className="andy-new-products-head">
          <div>
            <span className="andy-section-kicker">Productos nuevos</span>
            <h2>Últimas refacciones agregadas.</h2>
            <p>
              Explora los productos recientes y agrégalos a una cotización para
              validación de ventas.
            </p>
          </div>

          <Link href="/catalogo" className="andy-products-link">
            Ver catálogo completo
          </Link>
        </div>

        <div className="andy-products-marquee">
          <div className="andy-products-track">
            {[...productos, ...productos].map((producto, index) => {
              const codigoDetalle = getProductCode(producto);
              const codigoVisible = codigoDetalle || "Sin código";

              return (
                <article
                  className="andy-new-product-card"
                  key={`${producto.id}-${index}`}
                >
                  <div className="andy-new-product-media">
                    <span>{codigoVisible}</span>
                    <ProductMediaImage
                      producto={producto}
                      className="andy-new-product-image"
                      fallbackClassName="andy-new-product-icon"
                      iconSize={42}
                    />
                  </div>

                  <div className="andy-new-product-body">
                    <div className="andy-new-product-tags">
                      {producto.familia && <span>{producto.familia}</span>}
                      {producto.categoria && <span>{producto.categoria}</span>}
                    </div>

                    <h3>{producto.descripcion}</h3>

                    <div className="andy-new-product-meta">
                      {producto.armadora && (
                        <span>
                          <Gauge size={15} />
                          {producto.armadora}
                        </span>
                      )}

                      <span>
                        <Boxes size={15} />
                        {Number(producto.total_cruces || 0)} cruces
                      </span>
                    </div>

                    <div className="product-warning">
                      Compatibilidad y disponibilidad sujetas a validación.
                    </div>

                    <div className="andy-new-product-actions">
                      {codigoDetalle ? (
                        <Link
                          href={`/producto/${encodeURIComponent(codigoDetalle)}`}
                          className="btn-card-secondary"
                        >
                          Ver detalle
                        </Link>
                      ) : (
                        <button className="btn-card-secondary" disabled>
                          Sin código
                        </button>
                      )}

                      <button
                        className="btn-card-primary"
                        onClick={() => addProduct(producto)}
                      >
                        <Plus size={16} />
                        Cotizar
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}