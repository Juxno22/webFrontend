"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  Eye,
  Loader2,
  MessageCircle,
  PackageSearch,
  RefreshCw,
  Search,
  SearchX,
  ShoppingCart,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { adminFetch } from "@/app/lib/adminApi";
import { useAdminAuth } from "@/app/hooks/useAdminAuth";

const EVENT_FILTERS = [
  { value: "", label: "Todos" },
  { value: "BUSQUEDA_CATALOGO", label: "Búsqueda catálogo" },
  { value: "BUSQUEDA_CATALOGO_SIN_RESULTADO", label: "Búsqueda sin resultado" },
  { value: "BUSQUEDA_IA", label: "Búsqueda IA" },
  { value: "BUSQUEDA_IA_SIN_RESULTADO", label: "IA sin resultado" },
  { value: "PRODUCTO_CONSULTADO", label: "Producto consultado" },
  { value: "PRODUCTO_AGREGADO_COTIZACION", label: "Agregado a cotización" },
  { value: "COTIZACION_GENERADA", label: "Cotización generada" },
  { value: "PRODUCTO_AGREGADO_CARRITO_VENTA", label: "Agregado a carrito venta" },
  { value: "VENTA_CHECKOUT_CREADO", label: "Checkout creado" },
  { value: "VENTA_PAGO_APROBADO", label: "Pago aprobado" },
  { value: "VENTA_PAGO_RECHAZADO", label: "Pago rechazado" },
  { value: "VENTA_ENTREGADA", label: "Venta entregada" },
  { value: "WHATSAPP_CLICK", label: "Click WhatsApp" },
];

function toDateInput(date) {
  return date.toISOString().slice(0, 10);
}

function getDefaultDates() {
  const hasta = new Date();
  const desde = new Date();

  desde.setDate(hasta.getDate() - 30);

  return {
    desde: toDateInput(desde),
    hasta: toDateInput(hasta),
  };
}

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      searchParams.set(key, String(value).trim());
    }
  });

  return searchParams.toString();
}

async function getAnalyticsDashboard(params = {}) {
  const query = buildQuery(params);

  return adminFetch(`/api/admin/analytics/dashboard${query ? `?${query}` : ""}`);
}

async function syncAnalyticsOportunidades(params = {}) {
  const query = buildQuery(params);

  return adminFetch(
    `/api/admin/analytics/oportunidades/sync${query ? `?${query}` : ""}`,
    {
      method: "POST",
    }
  );
}

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

function getNumber(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function pickArray(data, keys = []) {
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  return [];
}

function pickObject(data, keys = []) {
  for (const key of keys) {
    if (data?.[key] && typeof data[key] === "object") return data[key];
  }

  return {};
}

function getProductCode(item = {}) {
  return item.codigo_andyfers || item.codigo_importacion || item.codigo || "—";
}

function getProductDescription(item = {}) {
  return (
    item.descripcion_producto ||
    item.descripcion ||
    item.familia ||
    item.categoria_nombre ||
    "Producto sin descripción"
  );
}

function getSearchText(item = {}) {
  return item.query_text || item.busqueda || item.texto_busqueda || item.termino || "—";
}

function getDailyLabel(item = {}) {
  return item.fecha || item.dia || item.date || "—";
}

export default function AdminAnalyticsClient() {
  const { checking } = useAdminAuth();

  const defaults = useMemo(() => getDefaultDates(), []);

  const [filters, setFilters] = useState({
    desde: defaults.desde,
    hasta: defaults.hasta,
    evento: "",
    limit: 10,
  });

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const dashboard = data?.data || data || {};

  const ventasKpis = pickObject(dashboard, ["ventas_kpis", "ventas", "sales"]);
  const kpis = pickObject(dashboard, ["kpis", "resumen", "summary"]);

  const productosVendidos = pickArray(dashboard, [
    "productos_mas_vendidos",
    "top_productos_vendidos",
    "productos_vendidos",
  ]);

  const productosConsultados = pickArray(dashboard, [
    "productos_mas_consultados",
    "top_productos_consultados",
    "consultados",
  ]);

  const productosCotizados = pickArray(dashboard, [
    "productos_mas_cotizados",
    "top_productos_cotizados",
    "cotizados",
  ]);

  const busquedasSinResultado = pickArray(dashboard, [
    "busquedas_sin_resultado",
    "sin_resultado",
    "searches_without_results",
  ]);

  const oportunidades = pickArray(dashboard, [
    "oportunidades",
    "oportunidades_comerciales",
    "commercial_tasks",
  ]);

  const embudoVentas = pickArray(dashboard, [
    "embudo_ventas",
    "funnel",
    "ventas_embudo",
  ]);

  const resumenDiario = pickArray(dashboard, [
    "resumen_diario",
    "daily",
    "serie_diaria",
  ]);

  const metricas = useMemo(() => {
    const importeConfirmado =
      getNumber(ventasKpis.importe_confirmado) ||
      getNumber(ventasKpis.importe_pagado) ||
      getNumber(ventasKpis.total_pagado);

    const ventasPagadas =
      getNumber(ventasKpis.ventas_pagadas) ||
      getNumber(ventasKpis.pagadas) ||
      getNumber(ventasKpis.pagos_aprobados);

    const pendientesPago =
      getNumber(ventasKpis.pendientes_pago) ||
      getNumber(ventasKpis.pendiente_pago);

    const piezasVendidas =
      getNumber(ventasKpis.piezas_vendidas) ||
      getNumber(ventasKpis.cantidad_vendida) ||
      getNumber(ventasKpis.total_piezas);

    const ticketPromedio =
      getNumber(ventasKpis.ticket_promedio) ||
      (ventasPagadas > 0 ? importeConfirmado / ventasPagadas : 0);

    return [
      {
        label: "Importe confirmado",
        value: formatMoney(importeConfirmado),
        hint: "Pagos aprobados",
        icon: CreditCard,
        formatted: true,
      },
      {
        label: "Ventas pagadas",
        value: ventasPagadas,
        hint: "Pedidos con pago aprobado",
        icon: ShoppingCart,
      },
      {
        label: "Pendientes pago",
        value: pendientesPago,
        hint: "Checkouts sin confirmar",
        icon: Clock3,
      },
      {
        label: "Piezas vendidas",
        value: piezasVendidas,
        hint: "Cantidad vendida",
        icon: PackageSearch,
      },
      {
        label: "Ticket promedio",
        value: formatMoney(ticketPromedio),
        hint: "Promedio por venta pagada",
        icon: TrendingUp,
        formatted: true,
      },
      {
        label: "Cotizaciones",
        value: getNumber(kpis.cotizaciones_generadas || kpis.cotizaciones),
        hint: "Solicitudes generadas",
        icon: Target,
      },
    ];
  }, [ventasKpis, kpis]);

  async function loadData(nextFilters = filters) {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await getAnalyticsDashboard(nextFilters);

      setData(response.data || response);
      setLastUpdatedAt(new Date());
    } catch (err) {
      setError(err.message || "No se pudo cargar analítica comercial.");
    } finally {
      setLoading(false);
    }
  }

  async function syncOportunidades() {
    try {
      setSyncing(true);
      setError("");
      setMessage("");

      const response = await syncAnalyticsOportunidades({
        desde: filters.desde,
        hasta: filters.hasta,
        limit: filters.limit,
      });

      const total =
        response?.data?.creadas ||
        response?.data?.procesadas ||
        response?.creadas ||
        response?.procesadas ||
        0;

      setMessage(`Oportunidades sincronizadas: ${formatNumber(total)}.`);

      await loadData(filters);
    } catch (err) {
      setError(err.message || "No se pudieron sincronizar oportunidades.");
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    if (!checking) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking]);

  function updateFilter(name, value) {
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function submitFilters(event) {
    event.preventDefault();
    loadData(filters);
  }

  if (checking) return null;

  return (
    <section className="admin-workspace admin-analytics-os">
      <div className="admin-page-hero">
        <div>
          <h1>Analítica comercial</h1>
          <p>
            Mide búsquedas, productos consultados, cotizaciones, carrito,
            ventas ecommerce y oportunidades comerciales para mejorar catálogo,
            inventario y atención.
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
            className="admin-secondary-button"
            onClick={syncOportunidades}
            disabled={syncing}
          >
            {syncing ? <Loader2 size={18} className="admin-spin" /> : <Sparkles size={18} />}
            Sincronizar
          </button>

          <button
            type="button"
            className="admin-refresh-button"
            onClick={() => loadData()}
            disabled={loading}
          >
            {loading ? <Loader2 size={18} className="admin-spin" /> : <RefreshCw size={18} />}
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

      {message && (
        <div className="admin-analytics-success">
          <CheckCircle2 size={18} />
          {message}
        </div>
      )}

      <form className="admin-analytics-filters" onSubmit={submitFilters}>
        <label>
          Desde
          <input
            type="date"
            value={filters.desde}
            onChange={(event) => updateFilter("desde", event.target.value)}
          />
        </label>

        <label>
          Hasta
          <input
            type="date"
            value={filters.hasta}
            onChange={(event) => updateFilter("hasta", event.target.value)}
          />
        </label>

        <label>
          Evento
          <select
            value={filters.evento}
            onChange={(event) => updateFilter("evento", event.target.value)}
          >
            {EVENT_FILTERS.map((event) => (
              <option key={event.value || "todos"} value={event.value}>
                {event.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Límite
          <select
            value={filters.limit}
            onChange={(event) => updateFilter("limit", event.target.value)}
          >
            <option value="10">10 registros</option>
            <option value="20">20 registros</option>
            <option value="50">50 registros</option>
          </select>
        </label>

        <button className="admin-primary-button" type="submit" disabled={loading}>
          {loading ? <Loader2 size={17} className="admin-spin" /> : <Search size={17} />}
          Aplicar
        </button>
      </form>

      {loading && !data ? (
        <div className="admin-loading-panel">
          <Loader2 size={34} className="admin-spin" />
          <strong>Cargando analítica comercial...</strong>
        </div>
      ) : (
        <>
          <section className="admin-kpi-grid admin-analytics-kpi-grid">
            {metricas.map((metric) => {
              const Icon = metric.icon;

              return (
                <article className="admin-kpi-card" key={metric.label}>
                  <Icon size={22} />
                  <span>{metric.label}</span>
                  <strong>
                    {metric.formatted ? metric.value : formatNumber(metric.value)}
                  </strong>
                  <small>{metric.hint}</small>
                </article>
              );
            })}
          </section>

          <section className="admin-home-priority-grid">
            <article className="admin-home-priority-card sales">
              <div>
                <ShoppingCart size={34} />
                <h2>Ventas web</h2>
                <p>
                  Sigue el camino desde carrito y checkout hasta pago aprobado,
                  entrega y oportunidades de recuperación.
                </p>
              </div>

              <Link href="/admin/ventas">
                <strong>
                  Abrir ventas
                  <ArrowRight size={17} />
                </strong>
              </Link>
            </article>

            <article className="admin-home-priority-card chat">
              <div>
                <MessageCircle size={34} />
                <h2>Chat y cotización</h2>
                <p>
                  Detecta productos buscados, cotizados o sin resultado para
                  alimentar el chat y mejorar conversión.
                </p>
              </div>

              <Link href="/admin/chat">
                <strong>
                  Abrir chat
                  <ArrowRight size={17} />
                </strong>
              </Link>
            </article>
          </section>

          <section className="admin-panels-grid">
            <article className="admin-panel">
              <div className="admin-panel-head">
                <div>
                  <span>Ventas</span>
                  <h2>Embudo de venta</h2>
                  <p>Eventos principales del flujo ecommerce.</p>
                </div>
              </div>

              <div className="admin-analytics-funnel">
                {embudoVentas.length > 0 ? (
                  embudoVentas.map((item, index) => (
                    <div key={`${item.evento || item.estado || index}`}>
                      <span>{item.label || item.evento || item.estado || `Paso ${index + 1}`}</span>
                      <strong>
                        {formatNumber(item.total || item.cantidad || item.valor)}
                      </strong>
                    </div>
                  ))
                ) : (
                  <div className="admin-empty-mini-os">
                    No hay embudo disponible todavía.
                  </div>
                )}
              </div>
            </article>

            <article className="admin-panel">
              <div className="admin-panel-head">
                <div>
                  <span>Ecommerce</span>
                  <h2>Productos más vendidos</h2>
                  <p>Productos con pago confirmado.</p>
                </div>
              </div>

              <div className="admin-analytics-list">
                {productosVendidos.length > 0 ? (
                  productosVendidos.map((item, index) => (
                    <div key={`${getProductCode(item)}-${index}`}>
                      <strong>{getProductCode(item)}</strong>
                      <p>{getProductDescription(item)}</p>
                      <span>
                        {formatNumber(item.piezas || item.cantidad || item.total_piezas)} pzas ·{" "}
                        {formatMoney(item.importe || item.total || item.venta_total)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="admin-empty-mini-os">
                    Todavía no hay productos vendidos.
                  </div>
                )}
              </div>
            </article>
          </section>

          <section className="admin-panels-grid">
            <article className="admin-panel">
              <div className="admin-panel-head">
                <div>
                  <span>Interés catálogo</span>
                  <h2>Productos más consultados</h2>
                  <p>Lo que más revisan los clientes.</p>
                </div>
              </div>

              <div className="admin-analytics-list">
                {productosConsultados.length > 0 ? (
                  productosConsultados.map((item, index) => (
                    <div key={`${getProductCode(item)}-${index}`}>
                      <strong>{getProductCode(item)}</strong>
                      <p>{getProductDescription(item)}</p>
                      <span>
                        {formatNumber(
                          item.total_consultas ||
                            item.consultas ||
                            item.total ||
                            item.eventos
                        )}{" "}
                        consultas
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="admin-empty-mini-os">
                    Sin productos consultados en este periodo.
                  </div>
                )}
              </div>
            </article>

            <article className="admin-panel">
              <div className="admin-panel-head">
                <div>
                  <span>Cotización</span>
                  <h2>Productos más cotizados</h2>
                  <p>Productos que pasan a intención comercial.</p>
                </div>
              </div>

              <div className="admin-analytics-list">
                {productosCotizados.length > 0 ? (
                  productosCotizados.map((item, index) => (
                    <div key={`${getProductCode(item)}-${index}`}>
                      <strong>{getProductCode(item)}</strong>
                      <p>{getProductDescription(item)}</p>
                      <span>
                        {formatNumber(
                          item.cotizaciones ||
                            item.total_cotizaciones ||
                            item.total ||
                            item.eventos
                        )}{" "}
                        cotizaciones
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="admin-empty-mini-os">
                    Sin productos cotizados en este periodo.
                  </div>
                )}
              </div>
            </article>
          </section>

          <section className="admin-panels-grid">
            <article className="admin-panel">
              <div className="admin-panel-head">
                <div>
                  <span>Oportunidades</span>
                  <h2>Oportunidades comerciales</h2>
                  <p>Productos o búsquedas que requieren revisión.</p>
                </div>

                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={syncOportunidades}
                  disabled={syncing}
                >
                  {syncing ? <Loader2 size={15} className="admin-spin" /> : <Sparkles size={15} />}
                  Sync
                </button>
              </div>

              <div className="admin-analytics-list">
                {oportunidades.length > 0 ? (
                  oportunidades.map((item, index) => (
                    <div key={`${item.id || item.clave || index}`}>
                      <strong>{item.titulo || item.codigo_andyfers || item.tipo || "Oportunidad"}</strong>
                      <p>{item.descripcion || item.detalle || item.mensaje || "Sin descripción"}</p>
                      <span>
                        {item.prioridad || "MEDIA"} · {item.estado || "NUEVO"}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="admin-empty-mini-os">
                    No hay oportunidades pendientes en este periodo.
                  </div>
                )}
              </div>
            </article>

            <article className="admin-panel">
              <div className="admin-panel-head">
                <div>
                  <span>Catálogo</span>
                  <h2>Búsquedas sin resultado</h2>
                  <p>Qué está buscando el cliente y no encuentra.</p>
                </div>
              </div>

              <div className="admin-analytics-list">
                {busquedasSinResultado.length > 0 ? (
                  busquedasSinResultado.map((item, index) => (
                    <div key={`${getSearchText(item)}-${index}`}>
                      <strong>{getSearchText(item)}</strong>
                      <p>
                        {item.origen || item.canal || "Búsqueda"} ·{" "}
                        {formatDate(item.ultima_vez || item.fecha_evento || item.created_at)}
                      </p>
                      <span>
                        {formatNumber(item.total || item.veces || item.eventos || 1)} intento(s)
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="admin-empty-mini-os">
                    No hay búsquedas sin resultado.
                  </div>
                )}
              </div>
            </article>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-head">
              <div>
                <span>Serie diaria</span>
                <h2>Resumen por día</h2>
                <p>Búsquedas, productos, cotizaciones y ventas por fecha.</p>
              </div>

              <button type="button" className="admin-secondary-button">
                <Download size={15} />
                Exportar próximamente
              </button>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table admin-analytics-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Búsquedas</th>
                    <th>Sin resultado</th>
                    <th>Consultados</th>
                    <th>Cotizaciones</th>
                    <th>Ventas</th>
                    <th>Importe</th>
                  </tr>
                </thead>

                <tbody>
                  {resumenDiario.length > 0 ? (
                    resumenDiario.map((item, index) => (
                      <tr key={`${getDailyLabel(item)}-${index}`}>
                        <td>
                          <strong>{getDailyLabel(item)}</strong>
                        </td>
                        <td>
                          {formatNumber(
                            item.busquedas ||
                              item.busquedas_con_resultado ||
                              item.total_busquedas
                          )}
                        </td>
                        <td>
                          {formatNumber(
                            item.busquedas_sin_resultado || item.sin_resultado
                          )}
                        </td>
                        <td>
                          {formatNumber(
                            item.productos_consultados || item.consultados
                          )}
                        </td>
                        <td>
                          {formatNumber(
                            item.cotizaciones_generadas || item.cotizaciones
                          )}
                        </td>
                        <td>
                          {formatNumber(item.ventas_pagadas || item.ventas || item.pagadas)}
                        </td>
                        <td>
                          {formatMoney(item.importe_confirmado || item.importe || item.total)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7}>No hay resumen diario para este periodo.</td>
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