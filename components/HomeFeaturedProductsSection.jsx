"use client";

import Link from "next/link";
import {
  Boxes,
  Gauge,
  Plus,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import ProductMediaImage from "@/components/ProductMediaImage";
import { addToQuoteCart } from "@/app/lib/quoteCart";
import { addToSalesCart, openSalesCartDrawer } from "@/app/lib/salesCart";
import { useRouter } from "next/navigation";

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

export default function HomeFeaturedProductsSection({
  productos = [],
  section = null,
}) {
  const router = useRouter();

  function openProductDetail(codigoDetalle) {
    if (!codigoDetalle) return;

    router.push(`/producto/${encodeURIComponent(codigoDetalle)}`);
  }

  function handleProductMediaKeyDown(event, codigoDetalle) {
    if (!codigoDetalle) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openProductDetail(codigoDetalle);
    }
  }
  if (!productos.length) return null;

  const kicker = section?.subtitulo || "Referencias recomendadas";
  const title = section?.titulo || "Productos destacados";
  const description =
    section?.descripcion ||
    "Productos seleccionados para destacar dentro del catálogo Andyfers.";
  const ctaText = section?.cta_texto || "Explorar productos";
  const ctaUrl = section?.cta_url || "/catalogo";

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

  function addProductToSalesCart(producto) {
    const code = getProductCode(producto) || "Producto";

    addToSalesCart(producto);

    window.dispatchEvent(
      new CustomEvent("andyfers_toast", {
        detail: {
          message: `${code} agregado al carrito`,
        },
      })
    );

    openSalesCartDrawer();
  }

  return (
    <section className="andy-new-products-section andy-featured-products-recycled">
      <div className="container">
        <div className="andy-new-products-head">
          <div>
            <span className="andy-section-kicker">{kicker}</span>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>

          {ctaUrl && (
            <Link href={ctaUrl} className="andy-products-link">
              {ctaText}
            </Link>
          )}
        </div>

        <div className="andy-products-marquee">
          <div className="andy-products-track">
            {[...productos, ...productos].map((producto, index) => {
              const codigoDetalle = getProductCode(producto);
              const codigoVisible = codigoDetalle || "Sin código";

              return (
                <article
                  className="andy-new-product-card is-featured-product"
                  key={`${producto.id}-${index}`}
                >
                  <div
                    className={`andy-new-product-media ${codigoDetalle ? "is-clickable" : ""
                      }`}
                    role={codigoDetalle ? "link" : undefined}
                    tabIndex={codigoDetalle ? 0 : undefined}
                    aria-label={
                      codigoDetalle ? `Ver detalle de ${codigoVisible}` : undefined
                    }
                    onClick={() => openProductDetail(codigoDetalle)}
                    onKeyDown={(event) =>
                      handleProductMediaKeyDown(event, codigoDetalle)
                    }
                  >
                    <em className="andy-new-product-ribbon featured">
                      <Sparkles size={13} />
                      DESTACADO
                    </em>

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

                    <div className="andy-new-product-actions product-actions-three">
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
                        type="button"
                        onClick={() => addProduct(producto)}
                      >
                        <Plus size={16} />
                        Cotizar
                      </button>

                      <button
                        type="button"
                        className="btn-card-cart"
                        onClick={() => addProductToSalesCart(producto)}
                      >
                        <ShoppingCart size={16} />
                        Carrito
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