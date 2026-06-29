"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Copy, PackageCheck, XCircle } from "lucide-react";
import { getVentaPublica } from "@/app/lib/api";
import { getLastOrder } from "@/app/lib/orderTracking";

const CONFIG = {
  exito: {
    icon: CheckCircle2,
    kicker: "Pago recibido",
    title: "Gracias por tu compra",
    description:
      "Mercado Pago recibió tu pago. Estamos validando la confirmación para preparar tu pedido.",
  },
  pendiente: {
    icon: Clock3,
    kicker: "Pago pendiente",
    title: "Tu pago está en revisión",
    description:
      "Mercado Pago todavía no confirma el pago. Cuando se apruebe, actualizaremos el estado de tu pedido.",
  },
  error: {
    icon: XCircle,
    kicker: "Pago no completado",
    title: "No se pudo completar el pago",
    description:
      "Mercado Pago no aprobó la operación o el proceso fue cancelado. Puedes intentarlo nuevamente.",
  },
};

function getPublicStatusLabel(estado) {
  switch (estado) {
    case "PENDIENTE_PAGO":
      return "Pendiente de pago";
    case "PAGADA":
      return "Pago confirmado";
    case "EN_PREPARACION":
      return "En preparación";
    case "LISTA_ENTREGA":
      return "Lista para entrega";
    case "ENTREGADA":
      return "Entregada";
    case "PAGO_RECHAZADO":
      return "Pago rechazado";
    case "CANCELADA":
      return "Cancelada";
    default:
      return estado || "En validación";
  }
}

export default function CheckoutReturnClient({ type = "exito" }) {
  const config = CONFIG[type] || CONFIG.exito;
  const Icon = config.icon;

  const [lastOrder, setLastOrder] = useState(null);
  const [venta, setVenta] = useState(null);
  const [copied, setCopied] = useState(false);

  const folio = useMemo(() => {
    return venta?.folio || lastOrder?.folio || "";
  }, [venta, lastOrder]);

  useEffect(() => {
    const saved = getLastOrder();

    setLastOrder(saved);

    async function loadOrder() {
      if (!saved?.folio) return;

      try {
        const response = await getVentaPublica(saved.folio, saved.whatsapp);
        setVenta(response.data);
      } catch {
        // Si aún no está disponible o falló, al menos mostramos el folio guardado.
      }
    }

    loadOrder();
  }, []);

  async function copyFolio() {
    if (!folio) return;

    await navigator.clipboard.writeText(folio);
    setCopied(true);

    setTimeout(() => setCopied(false), 1800);
  }

  const whatsappText = folio
    ? `Hola, quiero consultar el estado de mi pedido Andyfers ${folio}.`
    : "Hola, quiero consultar el estado de mi pedido Andyfers.";

  return (
    <section className="checkout-return-page">
      <div className="checkout-return-card">
        <Icon size={46} />

        <span>{config.kicker}</span>
        <h1>{config.title}</h1>
        <p>{config.description}</p>

        {folio && (
          <div className="checkout-order-number">
            <PackageCheck size={22} />
            <div>
              <span>Número de pedido Andyfers</span>
              <strong>{folio}</strong>
              <small>
                Guárdalo. Te servirá para consultar tu pedido por WhatsApp.
              </small>
            </div>

            <button type="button" onClick={copyFolio}>
              <Copy size={16} />
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
        )}

        {venta && (
          <div className="checkout-order-status">
            <span>Estado actual</span>
            <strong>{getPublicStatusLabel(venta.estado)}</strong>
          </div>
        )}

        <div className="checkout-return-actions">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
            className="btn-primary"
            target="_blank"
            rel="noreferrer"
          >
            Consultar por WhatsApp
          </a>

          <Link href="/catalogo" className="btn-secondary">
            Seguir comprando
          </Link>

          <Link href="/" className="btn-secondary">
            Volver al inicio
          </Link>
        </div>
      </div>
    </section>
  );
}