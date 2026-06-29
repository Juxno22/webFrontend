"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Loader2,
  RefreshCw,
  SearchX,
  ShoppingCart,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import AdminModuleNav from "@/components/AdminModuleNav";
import AdminExportMenu from "@/components/AdminExportMenu";
import { getAdminUser } from "@/app/lib/adminApi";
import {
  getAdminAnalyticsDashboard,
  getAdminAnalyticsEventos,
  getAdminAnalyticsOportunidades,
  syncAdminAnalyticsOportunidades,
  updateAdminAnalyticsOportunidad,
} from "@/app/lib/adminAnalyticsApi";

const EVENT_FILTERS = [
  { value: "", label: "Todos los eventos" },
  { value: "BUSQUEDA_CATALOGO", label: "Búsqueda catálogo" },
  { value: "BUSQUEDA_CATALOGO_SIN_RESULTADO", label: "Catálogo sin resultado" },
  { value: "BUSQUEDA_IA", label: "Búsqueda IA" },
  { value: "BUSQUEDA_IA_SIN_RESULTADO", label: "IA sin resultado" },
  { value: "PRODUCTO_CONSULTADO", label: "Producto consultado" },
  { value: "PRODUCTO_AGREGADO_COTIZACION", label: "Agregado a cotización" },
  {
    value: "PRODUCTO_AGREGADO_CARRITO_VENTA",
    label: "Agregado a carrito venta",
  },
  { value: "VENTA_CHECKOUT_CREADO", label: "Checkout venta creado" },
  { value: "VENTA_PAGO_APROBADO", label: "Pago aprobado" },
  { value: "VENTA_PAGO_RECHAZADO", label: "Pago rechazado" },
  { value: "VENTA_ENTREGADA", label: "Venta entregada" },
  { value: "COTIZACION_GENERADA", label: "Cotización generada" },
  { value: "WHATSAPP_CLICK", label: "Click WhatsApp" },
  { value: "CONTACTO_FORMULARIO", label: "Formulario contacto" },
];

const OPPORTUNITY_STATES = [
  "NUEVA",
  "EN_REVISION",
  "SOLICITAR_IMAGEN",
  "CREAR_PRODUCTO",
  "COMPRAR_STOCK",
  "DESCARTADA",
  "RESUELTA",
];

function formatNumber(value) {
  const number = Number(value || 0);

  return new Intl.NumberFormat("es-MX").format(Number.isFinite(number) ? number : 0);
}

function formatMoney(value) {
  const number = Number(value || 0);

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(number) ? number : 0);
}

function formatDate(value) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "—";
  }
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function defaultDateRange() {
  const hasta = new Date();
  const desde = new Date();
  desde.setDate(hasta.getDate() - 30);

  return {
    desde: toIsoDate(desde),
    hasta: toIsoDate(hasta),
  };
}

function emptyDashboard() {
  return {
    rango: defaultDateRange(),
    kpis: {},
    ventas_kpis: {},
    busquedas_sin_resultado: [],
    productos_mas_consultados: [],
    productos_mas_cotizados: [],
    productos_mas_vendidos: [],
    consultas_vehiculo: [],
    embudo_ventas: [],
  };
}

function normalizeDashboardPayload(response) {
  return response?.data || emptyDashboard();
}

function getKpis(dashboard) {
  const kpis = dashboard?.kpis || {};
  const ventas = dashboard?.ventas_kpis || {};

  return [
    {
      label: "Importe confirmado",
      value: formatMoney(ventas.importe_confirmado),
      icon: TrendingUp,
      tone: "success",
      isFormatted: true,
    },
    {
      label: "Ventas pagadas",
      value: ventas.ventas_pagadas,
      icon: CheckCircle2,
      tone: "success",
    },
    {
      label: "Pendientes pago",
      value: ventas.ventas_pendientes_pago,
      icon: CreditCard,
      tone: "accent",
    },
    {
      label: "Piezas vendidas",
      value: ventas.piezas_confirmadas,
      icon: ShoppingCart,
      tone: "info",
    },
    {
      label: "Ticket promedio",
      value: formatMoney(ventas.ticket_promedio_confirmado),
      icon: Target,
      tone: "default",
      isFormatted: true,
    },
    {
      label: "Cotizaciones",
      value: kpis.cotizaciones_generadas,
      icon: ClipboardList,
      tone: "default",
    },
    {
      label: "Sin resultado",
      value: kpis.busquedas_sin_resultado,
      icon: SearchX,
      tone: "danger",
    },
  ];
}

function valueOrDash(value) {
  if (value === null || value === undefined || value === "") return "—";

  return value;
}

function opportunityTone(priority) {
  const value = String(priority || "").toUpperCase();

  if (value === "ALTA") return "high";
  if (value === "MEDIA") return "medium";
  if (value === "BAJA") return "low";

  return "neutral";
}

function EventBadge({ evento }) {
  return <span className="admin-analytics-event-badge">{evento || "—"}</span>;
}

function AnalyticsTable({ title, icon: Icon, children, empty, subtitle }) {
  return (
    <article className="admin-analytics-panel">
      <div className="admin-analytics-panel-head">
        <div>
          <span className="eyebrow">Analítica</span>
          <h2>
            {Icon && <Icon size={20} />}
            {title}
          </h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>

      {empty ? <div className="admin-empty">Sin datos en el periodo.</div> : children}
    </article>
  );
}

export default function AdminAnalyticsClient() {
  const router = useRouter();
  const initialRange = useMemo(() => defaultDateRange(), []);

  const [user, setUser] = useState(null);
  const [filters, setFilters] = useState({
    desde: initialRange.desde,
    hasta: initialRange.hasta,
    limit: 10,
    evento: "",
    q: "",
  });
  const [dashboard, setDashboard] = useState(emptyDashboard());
  const [events, setEvents] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const kpis = useMemo(() => getKpis(dashboard), [dashboard]);

  useEffect(() => {
    const currentUser = getAdminUser();

    if (!currentUser) {
      router.push("/admin/login");
      return;
    }

    setUser(currentUser);
  }, [router]);

  useEffect(() => {
    if (!user) return;

    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function updateFilter(name, value) {
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function buildRequestParams() {
    return {
      desde: filters.desde,
      hasta: filters.hasta,
      limit: filters.limit,
    };
  }

  async function loadAnalytics(nextFilters = filters) {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const baseParams = {
        desde: nextFilters.desde,
        hasta: nextFilters.hasta,
        limit: nextFilters.limit,
      };

      const eventsParams = {
        ...baseParams,
        evento: nextFilters.evento,
        q: nextFilters.q,
        limit: 80,
      };

      const [dashboardResponse, eventsResponse, opportunitiesResponse] =
        await Promise.all([
          getAdminAnalyticsDashboard(baseParams),
          getAdminAnalyticsEventos(eventsParams),
          getAdminAnalyticsOportunidades({ limit: 80 }),
        ]);

      setDashboard(normalizeDashboardPayload(dashboardResponse));
      setEvents(eventsResponse?.data || []);
      setOpportunities(opportunitiesResponse?.data || []);
    } catch (err) {
      setError(err.message || "No se pudo cargar la analítica comercial.");
      setDashboard(emptyDashboard());
      setEvents([]);
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await loadAnalytics(filters);
  }

  async function handleSyncOpportunities() {
    try {
      setSyncing(true);
      setError("");
      setMessage("");

      const response = await syncAdminAnalyticsOportunidades(buildRequestParams());

      setMessage(
        response?.message || "Oportunidades sincronizadas correctamente."
      );

      const opportunitiesResponse = await getAdminAnalyticsOportunidades({
        limit: 80,
      });

      setOpportunities(opportunitiesResponse?.data || []);
    } catch (err) {
      setError(err.message || "No se pudieron sincronizar oportunidades.");
    } finally {
      setSyncing(false);
    }
  }

  async function changeOpportunityState(item, estado) {
    if (!item?.id) return;

    try {
      setUpdatingId(item.id);
      setError("");
      setMessage("");

      await updateAdminAnalyticsOportunidad(item.id, { estado });

      setOpportunities((current) =>
        current.map((opportunity) =>
          opportunity.id === item.id ? { ...opportunity, estado } : opportunity
        )
      );

      setMessage("Oportunidad actualizada correctamente.");
    } catch (err) {
      setError(err.message || "No se pudo actualizar la oportunidad.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section className="admin-page">
      <div className="container">
        <div className="admin-topbar">
          <div>
            <span className="eyebrow">Inteligencia comercial</span>
            <h1>Analítica comercial</h1>
            <p>
              Ventas web, pagos confirmados, productos vendidos, embudo de compra,
              cotizaciones y búsquedas sin resultado.
            </p>
          </div>

          <div className="admin-analytics-topbar-actions">
            <AdminExportMenu
              context="analytics"
              filters={filters}
              onError={setError}
            />

            <button
              className="admin-logout"
              type="button"
              onClick={() => loadAnalytics(filters)}
              disabled={loading}
            >
              {loading ? <Loader2 size={17} className="spin-icon" /> : <RefreshCw size={17} />}
              Recargar
            </button>
          </div>
        </div>

        <AdminModuleNav />

        {error && <div className="alert-error admin-feedback">{error}</div>}
        {message && <div className="alert-success admin-feedback">{message}</div>}

        <form className="admin-analytics-toolbar" onSubmit={handleSubmit}>
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
            Top
            <select
              value={filters.limit}
              onChange={(event) => updateFilter("limit", event.target.value)}
            >
              <option value="10">Top 10</option>
              <option value="25">Top 25</option>
              <option value="50">Top 50</option>
              <option value="100">Top 100</option>
            </select>
          </label>

          <label>
            Evento reciente
            <select
              value={filters.evento}
              onChange={(event) => updateFilter("evento", event.target.value)}
            >
              {EVENT_FILTERS.map((item) => (
                <option value={item.value} key={item.value || "all"}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-analytics-search-field">
            Buscar en eventos
            <input
              value={filters.q}
              placeholder="Código, búsqueda, familia, vehículo..."
              onChange={(event) => updateFilter("q", event.target.value)}
            />
          </label>

          <button className="admin-clean-button" type="submit" disabled={loading}>
            Consultar
          </button>
        </form>

        {loading ? (
          <div className="admin-analytics-loading">
            <Loader2 size={24} className="spin-icon" />
            Cargando analítica comercial...
          </div>
        ) : (
          <>
            <div className="admin-analytics-kpi-grid">
              {kpis.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    className={`admin-analytics-kpi-card tone-${item.tone}`}
                    key={item.label}
                  >
                    <div>
                      <span>{item.label}</span>
                      <strong>{item.isFormatted ? item.value : formatNumber(item.value)}</strong>
                    </div>
                    <Icon size={25} />
                  </div>
                );
              })}
            </div>

            <div className="admin-analytics-grid-two">
              <AnalyticsTable
                title="Productos más vendidos"
                icon={TrendingUp}
                subtitle="Ranking real de productos con venta confirmada."
                empty={!dashboard.productos_mas_vendidos?.length}
              >
                <div className="admin-analytics-table-wrap">
                  <table className="admin-analytics-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Familia</th>
                        <th>Piezas</th>
                        <th>Importe</th>
                        <th>Última venta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.productos_mas_vendidos.map((row) => (
                        <tr key={`${row.producto_id}-${row.codigo_andyfers}-vendido`}>
                          <td>
                            <strong>{valueOrDash(row.codigo_andyfers)}</strong>
                            <small>{valueOrDash(row.codigo_importacion)}</small>
                          </td>
                          <td>{valueOrDash(row.familia || row.categoria)}</td>
                          <td>{formatNumber(row.piezas_vendidas)}</td>
                          <td>{formatMoney(row.importe_vendido)}</td>
                          <td>{formatDate(row.ultima_venta)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AnalyticsTable>

              <AnalyticsTable
                title="Embudo de venta"
                icon={Target}
                subtitle="Carrito, checkout, pago aprobado y entrega."
                empty={!dashboard.embudo_ventas?.length}
              >
                <div className="admin-analytics-funnel">
                  {dashboard.embudo_ventas.map((row) => (
                    <div key={row.etapa}>
                      <strong>{row.etapa}</strong>
                      <span>{formatNumber(row.total_eventos)} eventos</span>
                      <small>
                        {formatNumber(row.sesiones)} sesiones ·{" "}
                        {formatNumber(row.piezas)} piezas · {formatMoney(row.importe)}
                      </small>
                    </div>
                  ))}
                </div>
              </AnalyticsTable>
            </div>

            <div className="admin-analytics-grid-two">
              <AnalyticsTable
                title="Búsquedas sin resultado"
                icon={SearchX}
                subtitle="Lo que el cliente pide y el catálogo no está resolviendo."
                empty={!dashboard.busquedas_sin_resultado?.length}
              >
                <div className="admin-analytics-table-wrap">
                  <table className="admin-analytics-table">
                    <thead>
                      <tr>
                        <th>Búsqueda</th>
                        <th>Veces</th>
                        <th>Sesiones</th>
                        <th>Última</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.busquedas_sin_resultado.map((row) => (
                        <tr key={row.busqueda_normalizada}>
                          <td>
                            <strong>{row.busqueda_normalizada}</strong>
                            <small>{valueOrDash(row.ejemplo_busqueda)}</small>
                          </td>
                          <td>{formatNumber(row.total_busquedas)}</td>
                          <td>{formatNumber(row.sesiones)}</td>
                          <td>{formatDate(row.ultima_busqueda)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AnalyticsTable>

              <AnalyticsTable
                title="Productos más consultados"
                icon={TrendingUp}
                subtitle="Demanda real por detalle de producto."
                empty={!dashboard.productos_mas_consultados?.length}
              >
                <div className="admin-analytics-table-wrap">
                  <table className="admin-analytics-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Familia</th>
                        <th>Consultas</th>
                        <th>Última</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.productos_mas_consultados.map((row) => (
                        <tr key={`${row.producto_id}-${row.codigo_andyfers}`}>
                          <td>
                            <strong>{valueOrDash(row.codigo_andyfers)}</strong>
                            <small>{valueOrDash(row.codigo_importacion)}</small>
                          </td>
                          <td>{valueOrDash(row.familia)}</td>
                          <td>{formatNumber(row.total_consultas)}</td>
                          <td>{formatDate(row.ultima_consulta)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AnalyticsTable>
            </div>

            <div className="admin-analytics-grid-two">
              <AnalyticsTable
                title="Productos más cotizados"
                icon={ShoppingCart}
                subtitle="Productos con intención comercial por cotizacion."
                empty={!dashboard.productos_mas_cotizados?.length}
              >
                <div className="admin-analytics-table-wrap">
                  <table className="admin-analytics-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Familia</th>
                        <th>Veces</th>
                        <th>Cantidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.productos_mas_cotizados.map((row) => (
                        <tr key={`${row.producto_id}-${row.codigo_andyfers}-cotizado`}>
                          <td>
                            <strong>{valueOrDash(row.codigo_andyfers)}</strong>
                            <small>{valueOrDash(row.codigo_importacion)}</small>
                          </td>
                          <td>{valueOrDash(row.familia)}</td>
                          <td>{formatNumber(row.veces_agregado)}</td>
                          <td>{formatNumber(row.cantidad_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AnalyticsTable>

              <AnalyticsTable
                title="Consultas por vehículo"
                icon={Target}
                subtitle="Marca, modelo, año y motor más buscados."
                empty={!dashboard.consultas_vehiculo?.length}
              >
                <div className="admin-analytics-table-wrap">
                  <table className="admin-analytics-table">
                    <thead>
                      <tr>
                        <th>Vehículo</th>
                        <th>Consultas</th>
                        <th>Sin resultado</th>
                        <th>Última</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.consultas_vehiculo.map((row) => (
                        <tr
                          key={`${row.marca_vehiculo}-${row.modelo_vehiculo}-${row.anio_vehiculo}-${row.motor_vehiculo}`}
                        >
                          <td>
                            <strong>
                              {row.marca_vehiculo} {row.modelo_vehiculo}
                            </strong>
                            <small>
                              {row.anio_vehiculo} · {row.motor_vehiculo}
                            </small>
                          </td>
                          <td>{formatNumber(row.total_consultas)}</td>
                          <td>{formatNumber(row.consultas_sin_resultado)}</td>
                          <td>{formatDate(row.ultima_consulta)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AnalyticsTable>
            </div>

            <article className="admin-analytics-panel">
              <div className="admin-analytics-panel-head with-action">
                <div>
                  <span className="eyebrow">Compras y ventas</span>
                  <h2>
                    <Sparkles size={20} />
                    Oportunidades de mercado
                  </h2>
                  <p>
                    Sincroniza búsquedas repetidas sin resultado para decidir si se
                    crea producto, se pide imagen o se revisa inventario.
                  </p>
                </div>

                <button
                  className="admin-primary-link"
                  type="button"
                  onClick={handleSyncOpportunities}
                  disabled={syncing}
                >
                  {syncing ? <Loader2 size={17} className="spin-icon" /> : <RefreshCw size={17} />}
                  Sincronizar
                </button>
              </div>

              {!opportunities.length ? (
                <div className="admin-empty">No hay oportunidades registradas.</div>
              ) : (
                <div className="admin-analytics-opportunities">
                  {opportunities.map((item) => (
                    <div className="admin-analytics-opportunity" key={item.id}>
                      <div>
                        <div className="admin-analytics-opportunity-headline">
                          <span
                            className={`admin-analytics-priority ${opportunityTone(item.prioridad)}`}
                          >
                            {item.prioridad || "MEDIA"}
                          </span>
                          <strong>{item.titulo}</strong>
                        </div>

                        <p>{item.descripcion}</p>

                        <small>
                          {formatNumber(item.total_eventos)} eventos · Score {formatNumber(item.score)} · Último {formatDate(item.ultimo_evento)}
                        </small>
                      </div>

                      <label>
                        Estado
                        <select
                          value={item.estado || "NUEVA"}
                          disabled={updatingId === item.id}
                          onChange={(event) =>
                            changeOpportunityState(item, event.target.value)
                          }
                        >
                          {OPPORTUNITY_STATES.map((state) => (
                            <option value={state} key={state}>
                              {state}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <AnalyticsTable
              title="Eventos recientes"
              icon={CheckCircle2}
              subtitle="Bitácora operativa de los eventos comerciales registrados."
              empty={!events.length}
            >
              <div className="admin-analytics-table-wrap">
                <table className="admin-analytics-table recent-events">
                  <thead>
                    <tr>
                      <th>Evento</th>
                      <th>Búsqueda / Producto</th>
                      <th>Resultado</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((row) => (
                      <tr key={row.id}>
                        <td><EventBadge evento={row.evento} /></td>
                        <td>
                          <strong>
                            {valueOrDash(
                              row.busqueda_original ||
                              row.codigo_andyfers ||
                              row.cotizacion_folio
                            )}
                          </strong>
                          <small>
                            {valueOrDash(
                              row.codigo_importacion ||
                              row.familia ||
                              row.marca_vehiculo
                            )}
                          </small>
                        </td>
                        <td>{valueOrDash(row.resultado_estado)}</td>
                        <td>{formatDate(row.fecha_evento)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AnalyticsTable>
          </>
        )}
      </div>
    </section>
  );
}
