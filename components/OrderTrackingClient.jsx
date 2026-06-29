"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Copy,
  Loader2,
  PackageCheck,
  Search,
  Truck,
  XCircle,
} from "lucide-react";
import { getVentaPublica } from "@/app/lib/api";
import { getLastOrder } from "@/app/lib/orderTracking";

function cleanText(value) {
  return String(value || "").trim();
}

function formatMoney(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getPublicStatus(estado) {
  switch (estado) {
    case "CREADA":
    case "PENDIENTE_PAGO":
      return {
        label: "Pendiente de pago",
        description:
          "Todavía no tenemos confirmación final del pago. Si ya pagaste, puede tardar unos minutos en actualizarse.",
        icon: Clock3,
        tone: "pending",
        step: 1,
      };

    case "PAGADA":
      return {
        label: "Pago confirmado",
        description:
          "Tu pago fue confirmado. El equipo de Andyfers preparará tu pedido.",
        icon: CheckCircle2,
        tone: "success",
        step: 2,
      };

    case "EN_PREPARACION":
      return {
        label: "En preparación",
        description:
          "Tu pedido está siendo preparado por nuestro equipo.",
        icon: PackageCheck,
        tone: "active",
        step: 3,
      };

    case "LISTA_ENTREGA":
      return {
        label: "Lista para entrega",
        description:
          "Tu pedido está listo para entrega o envío. Te contactaremos para coordinar.",
        icon: Truck,
        tone: "active",
        step: 4,
      };

    case "ENTREGADA":
      return {
        label: "Entregada",
        description:
          "Tu pedido fue marcado como entregado.",
        icon: CheckCircle2,
        tone: "success",
        step: 5,
      };

    case "PAGO_RECHAZADO":
      return {
        label: "Pago rechazado",
        description:
          "Mercado Pago no aprobó la operación. Puedes intentar nuevamente o contactar a Andyfers.",
        icon: XCircle,
        tone: "error",
        step: 0,
      };

    case "CANCELADA":
      return {
        label: "Cancelada",
        description:
          "Este pedido fue cancelado. Contacta a Andyfers si necesitas más información.",
        icon: XCircle,
        tone: "error",
        step: 0,
      };

    case "REEMBOLSADA":
      return {
        label: "Reembolsada",
        description:
          "Este pedido fue marcado como reembolsado.",
        icon: XCircle,
        tone: "error",
        step: 0,
      };

    default:
      return {
        label: "En validación",
        description:
          "Estamos validando el estado actual de tu pedido.",
        icon: Clock3,
        tone: "pending",
        step: 1,
      };
  }
}

const STEPS = [
  {
    key: "PENDIENTE_PAGO",
    label: "Pedido creado",
  },
  {
    key: "PAGADA",
    label: "Pago confirmado",
  },
  {
    key: "EN_PREPARACION",
    label: "En preparación",
  },
  {
    key: "LISTA_ENTREGA",
    label: "Lista entrega",
  },
  {
    key: "ENTREGADA",
    label: "Entregada",
  },
];

export default function OrderTrackingClient() {
  const searchParams = useSearchParams();

  const [form, setForm] = useState({
    folio: "",
    whatsapp: "",
  });

  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const status = useMemo(() => {
    return getPublicStatus(venta?.estado);
  }, [venta]);

  const StatusIcon = status.icon;

  useEffect(() => {
    const saved = getLastOrder();
    const folioFromUrl = cleanText(searchParams.get("folio"));
    const whatsappFromUrl = cleanText(searchParams.get("whatsapp"));

    setForm({
      folio: folioFromUrl || saved?.folio || "",
      whatsapp: whatsappFromUrl || saved?.whatsapp || "",
    });
  }, [searchParams]);

  async function handleSubmit(event) {
    event.preventDefault();

    const folio = cleanText(form.folio);
    const whatsapp = cleanText(form.whatsapp);

    if (!folio || !whatsapp) {
      setError("Ingresa tu número de pedido y WhatsApp.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setVenta(null);

      const response = await getVentaPublica(folio, whatsapp);

      setVenta(response.data);
    } catch (err) {
      setError(
        err.message ||
          "No encontramos un pedido con esos datos. Revisa el número de pedido y WhatsApp."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyFolio() {
    if (!venta?.folio) return;

    await navigator.clipboard.writeText(venta.folio);
    setCopied(true);

    setTimeout(() => setCopied(false), 1800);
  }

  const whatsappText = venta?.folio
    ? `Hola, quiero consultar el estado de mi pedido Andyfers ${venta.folio}.`
    : "Hola, quiero consultar el estado de mi pedido Andyfers.";

  return (
    <section className="order-tracking-page">
      <div className="container order-tracking-layout">
        <div className="order-tracking-main">
          <Link href="/" className="order-tracking-back">
            <ArrowLeft size={17} />
            Volver al inicio
          </Link>

          <div className="order-tracking-heading">
            <span>Consulta pública</span>
            <h1>Rastrea tu pedido Andyfers</h1>
            <p>
              Ingresa tu número de pedido y WhatsApp para consultar el estado de
              tu compra. No mostramos datos del pedido sin validar tu número.
            </p>
          </div>

          <form className="order-tracking-form" onSubmit={handleSubmit}>
            <label>
              Número de pedido
              <input
                type="text"
                value={form.folio}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    folio: event.target.value,
                  }))
                }
                placeholder="VTA-2026-000001"
              />
            </label>

            <label>
              WhatsApp registrado
              <input
                type="tel"
                value={form.whatsapp}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    whatsapp: event.target.value,
                  }))
                }
                placeholder="238..."
              />
            </label>

            {error && (
              <div className="order-tracking-error">
                <AlertTriangle size={18} />
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={18} className="order-tracking-spin" />
                  Consultando...
                </>
              ) : (
                <>
                  <Search size={18} />
                  Consultar pedido
                </>
              )}
            </button>
          </form>
        </div>

        <aside className="order-tracking-side">
          {!venta ? (
            <div className="order-tracking-empty">
              <PackageCheck size={42} />
              <h2>Ten a la mano tu folio</h2>
              <p>
                El número de pedido aparece en la pantalla de confirmación
                después de pagar con Mercado Pago.
              </p>
            </div>
          ) : (
            <div className="order-tracking-result">
              <div className={`order-status-card tone-${status.tone}`}>
                <StatusIcon size={34} />

                <div>
                  <span>Estado actual</span>
                  <h2>{status.label}</h2>
                  <p>{status.description}</p>
                </div>
              </div>

              <div className="order-number-card">
                <div>
                  <span>Número de pedido</span>
                  <strong>{venta.folio}</strong>
                </div>

                <button type="button" onClick={copyFolio}>
                  <Copy size={16} />
                  {copied ? "Copiado" : "Copiar"}
                </button>
              </div>

              <div className="order-progress">
                {STEPS.map((step, index) => {
                  const active = status.step >= index + 1;

                  return (
                    <div
                      key={step.key}
                      className={active ? "is-active" : ""}
                    >
                      <span>{index + 1}</span>
                      <p>{step.label}</p>
                    </div>
                  );
                })}
              </div>

              <div className="order-summary-card">
                <div>
                  <span>Cliente</span>
                  <strong>{venta.nombre_cliente}</strong>
                </div>

                <div>
                  <span>Fecha de pedido</span>
                  <strong>{formatDate(venta.created_at)}</strong>
                </div>

                <div>
                  <span>Total</span>
                  <strong>{formatMoney(venta.total)}</strong>
                </div>

                <div>
                  <span>Pago</span>
                  <strong>{venta.mp_payment_status || "En validación"}</strong>
                </div>
              </div>

              {venta.items?.length > 0 && (
                <div className="order-items-card">
                  <h3>Productos</h3>

                  {venta.items.map((item) => (
                    <article key={item.id}>
                      <strong>
                        {item.codigo_andyfers ||
                          item.codigo_importacion ||
                          "Producto"}
                      </strong>
                      <p>{item.descripcion_producto}</p>
                      <span>
                        {item.cantidad} pza(s) · {formatMoney(item.subtotal)}
                      </span>
                    </article>
                  ))}
                </div>
              )}

              <div className="order-tracking-actions">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    whatsappText
                  )}`}
                  className="btn-primary"
                  target="_blank"
                  rel="noreferrer"
                >
                  Consultar por WhatsApp
                </a>

                <Link href="/catalogo" className="btn-secondary">
                  Seguir comprando
                </Link>
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}