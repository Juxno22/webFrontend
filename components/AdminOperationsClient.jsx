"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Loader2,
  MessageCircle,
  PackageCheck,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";
import { getAdminOperacionResumen } from "@/app/lib/adminApi";

function formatNumber(value) {
  return new Intl.NumberFormat("es-MX").format(Number(value || 0));
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

function getVentaStatusLabel(estado) {
  switch (estado) {
    case "PENDIENTE_PAGO":
      return "Pendiente de pago";
    case "PAGO_RECHAZADO":
      return "Pago rechazado";
    case "PAGADA":
      return "Pago confirmado";
    case "EN_PREPARACION":
      return "En preparación";
    case "LISTA_ENTREGA":
      return "Lista entrega";
    case "ENTREGADA":
      return "Entregada";
    default:
      return estado || "—";
  }
}

function getQuoteStatusLabel(estado) {
  switch (estado) {
    case "NUEVA":
      return "Nueva";
    case "EN_REVISION":
      return "En revisión";
    case "CONTACTADO":
      return "Contactado";
    case "COTIZADO":
      return "Cotizado";
    case "EN_PROCESO":
      return "En proceso";
    case "REQUIERE_DATOS":
      return "Requiere datos";
    default:
      return estado || "—";
  }
}

export default function AdminOperationsClient() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAdminOperacionResumen();

      setData(response.data);
      setLastUpdatedAt(new Date());
    } catch (err) {
      setError(err.message || "No se pudo cargar el resumen operativo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) {
        loadData();
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, [loadData]);

  const actionCards = useMemo(() => {
    const ventas = data?.ventas || {};
    const ecommerce = data?.ecommerce || {};
    const cotizaciones = data?.cotizaciones || {};

    return [
      {
        label: "Pedidos por preparar",
        value: ventas.pagadas,
        description: "Pagados, esperando pasar a preparación.",
        href: "/admin/ventas",
        tone: ventas.pagadas > 0 ? "danger" : "ok",
        icon: PackageCheck,
      },
      {
        label: "En preparación",
        value: ventas.en_preparacion,
        description: "Pedidos activos en surtido/preparación.",
        href: "/admin/ventas",
        tone: ventas.en_preparacion > 0 ? "warning" : "ok",
        icon: Boxes,
      },
      {
        label: "Listos para entrega",
        value: ventas.listas_entrega,
        description: "Pedidos listos por entregar o cerrar.",
        href: "/admin/ventas",
        tone: ventas.listas_entrega > 0 ? "active" : "ok",
        icon: CheckCircle2,
      },
      {
        label: "Cotizaciones nuevas",
        value: cotizaciones.nuevas,
        description: "Solicitudes que aún no se revisan.",
        href: "/admin/cotizaciones",
        tone: cotizaciones.nuevas > 0 ? "danger" : "ok",
        icon: MessageCircle,
      },
      {
        label: "Stock bajo",
        value: ecommerce.stock_bajo?.length || 0,
        description: "Productos ecommerce con existencia baja.",
        href: "/admin/ecommerce",
        tone: ecommerce.stock_bajo?.length > 0 ? "warning" : "ok",
        icon: AlertTriangle,
      },
    ];
  }, [data]);

  return (
    <section className="admin-workspace">
      <div className="admin-page-hero">
        <div>
          <span>Centro operativo</span>
          <h1>Operación diaria</h1>
          <p>
            Vista rápida para atender ventas ecommerce, pedidos activos,
            inventario web, cotizaciones y el chat comercial.
          </p>
        </div>

        <div className="admin-page-hero-actions">
          <Link href="/admin/ventas" className="admin-primary-button">
            <ShoppingCart size={18} />
            Ventas ecommerce
          </Link>

          <Link href="/admin/chat" className="admin-secondary-button">
            <MessageCircle size={18} />
            Chat clientes
          </Link>

          <button
            type="button"
            className="admin-refresh-button"
            onClick={loadData}
            disabled={loading}
          >
            {loading ? (
              <Loader2 size={18} className="admin-spin" />
            ) : (
              <RefreshCw size={18} />
            )}
            Actualizar
          </button>
        </div>
      </div>

      {lastUpdatedAt && (
        <p className="admin-updated">
          Última actualización: {formatDate(lastUpdatedAt)}
        </p>
      )}

      {error && (
        <div className="admin-alert">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="admin-loading-panel">
          <Loader2 size={34} className="admin-spin" />
          <strong>Cargando operación diaria...</strong>
        </div>
      ) : (
        <>
          <div className="admin-home-priority-grid">
            <Link href="/admin/ventas" className="admin-home-priority-card sales">
              <div>
                <ShoppingCart size={34} />
                <span>Prioridad diaria</span>
                <h2>Ventas ecommerce</h2>
                <p>
                  {formatNumber(data?.ventas?.pagadas)} pedidos pagados por
                  preparar, {formatNumber(data?.ventas?.en_preparacion)} en
                  preparación y {formatNumber(data?.ventas?.listas_entrega)} listos
                  para entrega.
                </p>
              </div>

              <strong>
                Abrir ventas
                <ArrowRight size={17} />
              </strong>
            </Link>

            <Link href="/admin/chat" className="admin-home-priority-card chat">
              <div>
                <MessageCircle size={34} />
                <span>Atención comercial</span>
                <h2>Chat clientes</h2>
                <p>
                  El chat será el centro para compradores y cotizaciones. Mientras
                  se activa WebSocket, aquí quedará la bandeja principal.
                </p>
              </div>

              <strong>
                Abrir chat
                <ArrowRight size={17} />
              </strong>
            </Link>
          </div>

          <section className="admin-kpi-grid">
            <article className="admin-kpi-card">
              <Activity size={22} />
              <span>Pedidos activos</span>
              <strong>{formatNumber(data?.ventas?.pedidos_activos)}</strong>
              <small>{formatMoney(data?.ventas?.importe_activo)}</small>
            </article>

            <article className="admin-kpi-card">
              <ShoppingCart size={22} />
              <span>Ventas pagadas</span>
              <strong>{formatNumber(data?.ventas?.pagadas)}</strong>
              <small>{formatMoney(data?.ventas?.importe_pagado)}</small>
            </article>

            <article className="admin-kpi-card">
              <MessageCircle size={22} />
              <span>Cotizaciones abiertas</span>
              <strong>{formatNumber(data?.cotizaciones?.abiertas)}</strong>
              <small>{formatNumber(data?.cotizaciones?.nuevas)} nuevas</small>
            </article>

            <article className="admin-kpi-card">
              <Boxes size={22} />
              <span>Productos vendibles</span>
              <strong>{formatNumber(data?.ecommerce?.vendibles)}</strong>
              <small>{formatNumber(data?.ecommerce?.piezas_totales)} piezas</small>
            </article>
          </section>

          <section className="admin-action-grid">
            {actionCards.map((card) => {
              const Icon = card.icon;

              return (
                <Link
                  href={card.href}
                  key={card.label}
                  className={`admin-action-card tone-${card.tone}`}
                >
                  <Icon size={24} />
                  <div>
                    <span>{card.label}</span>
                    <strong>{formatNumber(card.value)}</strong>
                    <p>{card.description}</p>
                  </div>
                  <ArrowRight size={18} />
                </Link>
              );
            })}
          </section>

          <section className="admin-panels-grid">
            <article className="admin-panel">
              <div className="admin-panel-head">
                <div>
                  <span>Ventas ecommerce</span>
                  <h2>Pedidos que requieren acción</h2>
                  <p>
                    Pagos, preparación, entregas y pedidos pendientes de cierre.
                  </p>
                </div>

                <Link href="/admin/ventas">
                  Ver ventas
                  <ArrowRight size={15} />
                </Link>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Pedido</th>
                      <th>Cliente</th>
                      <th>Estado</th>
                      <th>Total</th>
                      <th>Actualizado</th>
                    </tr>
                  </thead>

                  <tbody>
                    {data?.ventas?.pedidos_accion?.length > 0 ? (
                      data.ventas.pedidos_accion.map((venta) => (
                        <tr key={venta.id || venta.folio}>
                          <td>
                            <strong>{venta.folio}</strong>
                          </td>

                          <td>
                            <span>{venta.nombre_cliente}</span>
                            <small>{venta.whatsapp}</small>
                          </td>

                          <td>
                            <mark className={`admin-status-pill status-${venta.estado}`}>
                              {getVentaStatusLabel(venta.estado)}
                            </mark>
                          </td>

                          <td>{formatMoney(venta.total)}</td>
                          <td>{formatDate(venta.updated_at)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5}>No hay pedidos pendientes de acción.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="admin-panel">
              <div className="admin-panel-head">
                <div>
                  <span>Cotizaciones</span>
                  <h2>Solicitudes abiertas</h2>
                  <p>
                    Solicitudes comerciales que podrían convertirse en venta o chat.
                  </p>
                </div>

                <Link href="/admin/cotizaciones">
                  Ver cotizaciones
                  <ArrowRight size={15} />
                </Link>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Folio</th>
                      <th>Cliente</th>
                      <th>Vehículo</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>

                  <tbody>
                    {data?.cotizaciones?.recientes?.length > 0 ? (
                      data.cotizaciones.recientes.map((cotizacion) => (
                        <tr key={cotizacion.id || cotizacion.folio}>
                          <td>
                            <strong>{cotizacion.folio}</strong>
                          </td>

                          <td>
                            <span>{cotizacion.nombre_cliente}</span>
                            <small>{cotizacion.whatsapp}</small>
                          </td>

                          <td>
                            {[
                              cotizacion.marca_vehiculo,
                              cotizacion.modelo_vehiculo,
                              cotizacion.anio_vehiculo,
                              cotizacion.motor_vehiculo,
                            ]
                              .filter(Boolean)
                              .join(" ") || "—"}
                          </td>

                          <td>
                            <mark
                              className={`admin-status-pill status-${cotizacion.estado}`}
                            >
                              {getQuoteStatusLabel(cotizacion.estado)}
                            </mark>
                          </td>

                          <td>{formatDate(cotizacion.updated_at)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5}>No hay cotizaciones abiertas.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-head">
              <div>
                <span>Ecommerce</span>
                <h2>Stock bajo</h2>
                <p>
                  Productos ecommerce vendibles con existencia baja o por revisar.
                </p>
              </div>

              <Link href="/admin/ecommerce">
                Actualizar inventario
                <ArrowRight size={15} />
              </Link>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Stock</th>
                    <th>Precio web</th>
                  </tr>
                </thead>

                <tbody>
                  {data?.ecommerce?.stock_bajo?.length > 0 ? (
                    data.ecommerce.stock_bajo.map((item) => (
                      <tr key={item.producto_id}>
                        <td>
                          <strong>
                            {item.codigo_andyfers || item.codigo_importacion}
                          </strong>
                        </td>

                        <td>{item.descripcion}</td>
                        <td>{item.categoria}</td>
                        <td>{formatNumber(item.stock)}</td>
                        <td>{formatMoney(item.precio_web)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5}>No hay productos con stock bajo.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </section>
  );
}