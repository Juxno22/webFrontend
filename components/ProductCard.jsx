"use client";

import Link from "next/link";
import { Plus, Wrench, Gauge, Boxes } from "lucide-react";
import { addToQuoteCart } from "../app/lib/quoteCart";

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
  const codigoDetalle = getProductCode(producto);
  const codigoVisible = codigoDetalle || "Sin código";

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

  return (
    <article className="product-card">
      <div className="product-media">
        <div className="product-code">{codigoVisible}</div>
        {producto.imagen_thumbnail_url || producto.imagen_url ? (
          <img
            className="product-card-image"
            src={producto.imagen_thumbnail_url || producto.imagen_url}
            alt={producto.descripcion || codigoVisible}
            loading="lazy"
          />
        ) : (
          <div className="product-icon">
            <Wrench size={42} />
          </div>
        )}
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

        <div className="product-actions">
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
        </div>
      </div>
    </article>
  );
}