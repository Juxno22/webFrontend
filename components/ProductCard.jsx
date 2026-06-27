"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Gauge, Boxes, ShoppingCart } from "lucide-react";
import { addToQuoteCart } from "../app/lib/quoteCart";
import { addToSalesCart, openSalesCartDrawer } from "../app/lib/salesCart";
import ProductMediaImage from "@/components/ProductMediaImage";
import { getProductSaleInfo } from "../app/lib/productSale";

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

export default function ProductCard({ producto }) {
  const router = useRouter();
  const codigoDetalle = getProductCode(producto);
  const codigoVisible = codigoDetalle || "Sin código";
  const saleInfo = getProductSaleInfo(producto);

  function handleAdd() {
    addToQuoteCart(producto);

    window.dispatchEvent(
      new CustomEvent("andyfers_toast", {
        detail: {
          message: `${codigoVisible} agregado a cotización`,
        },
      })
    );
  }

  function handleAddToSalesCart() {
    addToSalesCart(producto);

    window.dispatchEvent(
      new CustomEvent("andyfers_toast", {
        detail: {
          message: `${codigoVisible} agregado al carrito`,
        },
      })
    );

    openSalesCartDrawer();
  }

  function openProductDetail() {
    if (!codigoDetalle) return;

    router.push(`/producto/${encodeURIComponent(codigoDetalle)}`);
  }

  function handleProductMediaKeyDown(event) {
    if (!codigoDetalle) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openProductDetail();
    }
  }

  return (
    <article className="product-card">
      <div
        className={`product-media ${codigoDetalle ? "is-clickable" : ""}`}
        role={codigoDetalle ? "link" : undefined}
        tabIndex={codigoDetalle ? 0 : undefined}
        aria-label={
          codigoDetalle ? `Ver detalle de ${codigoVisible}` : undefined
        }
        onClick={openProductDetail}
        onKeyDown={handleProductMediaKeyDown}
      >
        <div className="product-code">{codigoVisible}</div>
        <ProductMediaImage
          producto={producto}
          className="product-card-image"
          fallbackClassName="product-icon"
          iconSize={42}
        />
      </div>

      <div className="product-body">
        <div className="product-tags">
          {producto.categoria && <span>{producto.categoria}</span>}
          {producto.familia && <span>{producto.familia}</span>}
        </div>

        <h3>{producto.descripcion}</h3>

        <div className="product-meta">
          {producto.armadora && (
            <div>
              <Gauge size={15} />
              <span>{producto.armadora}</span>
            </div>
          )}

          <div>
            <Boxes size={15} />
            <span>{Number(producto.total_cruces || 0)} cruces</span>
          </div>
        </div>

        <div className="product-warning">
          Compatibilidad y disponibilidad sujetas a validación.
        </div>

        <div className={`product-sale-info ${saleInfo.canSell ? "is-ready" : "is-unavailable"}`}>
          <strong>{saleInfo.formattedPrice || "Precio no disponible"}</strong>
          <span>{saleInfo.canSell ? saleInfo.stockLabel : saleInfo.unavailableReason}</span>
        </div>

        <div className="product-actions product-actions-three">
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

          <button className="btn-card-primary" onClick={handleAdd}>
            <Plus size={16} />
            Cotizar
          </button>

          <button
            type="button"
            className="btn-card-cart"
            onClick={handleAddToSalesCart}
            disabled={!saleInfo.canSell}
            title={!saleInfo.canSell ? saleInfo.unavailableReason : "Agregar al carrito"}
          >
            <ShoppingCart size={16} />
            Carrito
          </button>
        </div>
      </div>
    </article>
  );
}