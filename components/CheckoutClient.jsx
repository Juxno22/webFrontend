"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CreditCard,
  Loader2,
  ShieldCheck,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { crearCheckoutVenta } from "@/app/lib/api";
import {
  buildSalesCheckoutProductsPayload,
  clearSalesCart,
  getSalesCart,
  removeSalesItem,
  updateSalesItemQuantity,
} from "@/app/lib/salesCart";
import { saveLastOrder } from "@/app/lib/orderTracking";

function getItemCode(item = {}) {
  return item.codigo_andyfers || item.codigo_importacion || item.product_key;
}

function getCheckoutUrl(mercadoPago = {}) {
  return mercadoPago.init_point || mercadoPago.sandbox_init_point;
}

export default function CheckoutClient() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    nombre_cliente: "",
    whatsapp: "",
    direccion_envio: "",
    comentarios_cliente: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalPieces = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.cantidad || 0), 0);
  }, [items]);

  useEffect(() => {
    setItems(getSalesCart());
  }, []);

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function updateQuantity(productKey, value) {
    const updated = updateSalesItemQuantity(productKey, value);
    setItems(updated);
  }

  function removeItem(productKey) {
    const updated = removeSalesItem(productKey);
    setItems(updated);
  }

  function validateForm() {
    const errors = [];

    if (!form.nombre_cliente.trim()) errors.push("El nombre es obligatorio.");
    if (!form.whatsapp.trim()) errors.push("El WhatsApp es obligatorio.");
    if (!form.direccion_envio.trim()) {
      errors.push("La dirección de envío es obligatoria.");
    }

    if (!items.length) errors.push("Tu carrito está vacío.");

    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const errors = validateForm();

    if (errors.length > 0) {
      setError(errors.join(" "));
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await crearCheckoutVenta({
        ...form,
        productos: buildSalesCheckoutProductsPayload(items),
      });

      const checkoutUrl = getCheckoutUrl(response?.data?.mercado_pago);
      const folio = response?.data?.folio;

      if (!checkoutUrl) {
        throw new Error("Mercado Pago no regresó una URL de checkout.");
      }

      if (folio) {
        saveLastOrder({
          folio,
          whatsapp: form.whatsapp,
          nombre_cliente: form.nombre_cliente,
        });
      }

      clearSalesCart();

      window.location.assign(checkoutUrl);
    } catch (err) {
      setError(err.message || "No se pudo iniciar el pago.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="checkout-page">
      <div className="container checkout-layout">
        <div className="checkout-main">
          <Link href="/catalogo" className="checkout-back-link">
            <ArrowLeft size={17} />
            Seguir comprando
          </Link>

          <div className="checkout-heading">
            <span>Compra segura</span>
            <h1>Finalizar compra</h1>
            <p>
              Capturamos tus datos de envío antes de redirigirte a Mercado Pago.
              Andyfers no recibe ni procesa datos de tarjeta.
            </p>
          </div>

          <form className="checkout-form" onSubmit={handleSubmit}>
            <div className="checkout-form-grid">
              <label>
                Nombre completo *
                <input
                  type="text"
                  value={form.nombre_cliente}
                  onChange={(event) =>
                    updateField("nombre_cliente", event.target.value)
                  }
                  placeholder="Nombre del comprador"
                  autoComplete="name"
                />
              </label>

              <label>
                Teléfono / WhatsApp *
                <input
                  type="tel"
                  value={form.whatsapp}
                  onChange={(event) =>
                    updateField("whatsapp", event.target.value)
                  }
                  placeholder="238..."
                  autoComplete="tel"
                />
              </label>
            </div>

            <label>
              Dirección de envío *
              <textarea
                value={form.direccion_envio}
                onChange={(event) =>
                  updateField("direccion_envio", event.target.value)
                }
                placeholder="Calle, número, colonia, ciudad, estado, referencias"
                rows={4}
              />
            </label>

            <label>
              Comentarios opcionales
              <textarea
                value={form.comentarios_cliente}
                onChange={(event) =>
                  updateField("comentarios_cliente", event.target.value)
                }
                placeholder="Horario de entrega, referencias adicionales, etc."
                rows={3}
              />
            </label>

            {error && <div className="checkout-error">{error}</div>}

            <button
              type="submit"
              className="btn-primary checkout-submit"
              disabled={loading || items.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="checkout-spin" />
                  Creando checkout...
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  Pagar con Mercado Pago
                </>
              )}
            </button>

            <div className="checkout-security-note">
              <ShieldCheck size={18} />
              <span>
                El pago se realiza en Mercado Pago. Andyfers solo guarda la
                venta, dirección, productos y estado de pago.
              </span>
            </div>
          </form>
        </div>

        <aside className="checkout-summary">
          <div className="checkout-summary-head">
            <ShoppingCart size={20} />
            <div>
              <span>Resumen</span>
              <strong>
                {totalPieces} pieza{totalPieces === 1 ? "" : "s"}
              </strong>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="checkout-empty">
              <p>No tienes productos en el carrito.</p>
              <Link href="/catalogo" className="btn-secondary">
                Ver catálogo
              </Link>
            </div>
          ) : (
            <div className="checkout-items">
              {items.map((item) => (
                <article className="checkout-item" key={item.product_key}>
                  <div>
                    <strong>{getItemCode(item)}</strong>
                    <p>{item.descripcion}</p>
                  </div>

                  <div className="checkout-item-actions">
                    <input
                      type="number"
                      min="1"
                      value={item.cantidad}
                      onChange={(event) =>
                        updateQuantity(item.product_key, event.target.value)
                      }
                    />

                    <button
                      type="button"
                      aria-label="Quitar producto"
                      onClick={() => removeItem(item.product_key)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="checkout-price-note">
            Precio, existencia y stock se validan antes de
            crear la preferencia de Mercado Pago.
          </div>
        </aside>
      </div>
    </section>
  );
}