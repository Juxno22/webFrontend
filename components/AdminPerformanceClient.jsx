"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Gauge,
  MonitorSmartphone,
  RefreshCw,
  MessageCircle,
  ShoppingCart,
  Loader2,
  Timer,
  TrendingDown,
} from "lucide-react";
import { clearAdminSession, getAdminUser } from "@/app/lib/adminApi";
import {
  getAdminPerformanceEventos,
  getAdminPerformanceResumen,
} from "@/app/lib/adminPerformanceApi";

const METRIC_LABELS = {
  LCP: "Carga principal",
  CLS: "Estabilidad visual",
  INP: "Interacción",
  FID: "Primera interacción",
  FCP: "Primer contenido",
  TTFB: "Respuesta servidor",
  LOAD: "Carga total",
  DOM_READY: "DOM listo",
  NAVIGATION: "Navegación",
};

const RATING_LABELS = {
  GOOD: "Bueno",
  NEEDS_IMPROVEMENT: "Mejorable",
  POOR: "Malo",
};

function fmtNumber(value, decimals = 0) {
  const number = Number(value || 0);
  return number.toLocaleString("es-MX", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  });
}

function fmtMetric(metric, value) {
  const number = Number(value || 0);
  if (metric === "CLS") return fmtNumber(number, 3);
  return `${fmtNumber(number, 0)} ms`;
}

function ratingClass(rating) {
  if (rating === "GOOD") return "is-good";
  if (rating === "NEEDS_IMPROVEMENT") return "is-warning";
  if (rating === "POOR") return "is-danger";
  return "is-neutral";
}

function buildCsv(rows = []) {
  const headers = [
    "id",
    "fecha",
    "pagina",
    "metrica",
    "valor",
    "rating",
    "dispositivo",
    "conexion",
    "viewport",
    "url",
  ];

  const lines = rows.map((row) => [
    row.id,
    row.created_at,
    row.pathname,
    row.metric_name,
    row.metric_value,
    row.metric_rating,
    row.device_type,
    row.connection_type,
    `${row.viewport_width || ""}x${row.viewport_height || ""}`,
    row.url,
  ]);

  return [headers, ...lines]
    .map((line) => line.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

export default function AdminPerformanceClient() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [days, setDays] = useState("30");
  const [metricFilter, setMetricFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [pathnameFilter, setPathnameFilter] = useState("");
  const [summary, setSummary] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const currentUser = getAdminUser();
    if (!currentUser) {
      router.push("/admin/login");
      return;
    }
    setUser(currentUser);
  }, [router]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [summaryRes, eventsRes] = await Promise.all([
        getAdminPerformanceResumen({ days }),
        getAdminPerformanceEventos({
          days,
          metric: metricFilter,
          rating: ratingFilter,
          pathname: pathnameFilter,
          limit: 120,
        }),
      ]);

      setSummary(summaryRes.data || null);
      setEvents(eventsRes.data || []);
    } catch (err) {
      setError(err.message || "No se pudo cargar performance pública.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, days, metricFilter, ratingFilter]);

  const kpis = summary?.kpis || {};
  const metricas = summary?.metricas || [];
  const paginasLentas = summary?.paginas_lentas || [];

  const worstMetric = useMemo(() => {
    return [...metricas]
      .sort((a, b) => Number(b.malas || 0) - Number(a.malas || 0))
      .find((item) => Number(item.malas || 0) > 0);
  }, [metricas]);

  function logout() {
    clearAdminSession();
    router.push("/admin/login");
  }

  function exportEventsCsv() {
    const csv = buildCsv(events);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `andyfers_performance_${days}d.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="admin-page admin-performance-page">
      <div className="container">
        <div className="admin-topbar">
          <div>
            <span className="eyebrow">Performance pública</span>
            <h1>Velocidad y Core Web Vitals</h1>
            <p>
              {user ? `${user.nombre} · ${user.rol}` : "Cargando usuario..."}
            </p>
          </div>

          <button className="admin-logout" onClick={logout}>
            Salir
          </button>
        </div>

        <div className="admin-page-hero admin-surgical-hero admin-surgical-performance">
          <div>
            <span>Experiencia pública</span>
            <h1>Performance pública</h1>
            <p>
              Monitorea velocidad, Core Web Vitals, páginas lentas, dispositivos,
              navegación pública y puntos que afectan conversión ecommerce.
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

        <div className="admin-performance-toolbar">
          <div className="admin-filter-group">
            <label>Rango</label>
            <select value={days} onChange={(event) => setDays(event.target.value)}>
              <option value="7">Últimos 7 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="60">Últimos 60 días</option>
              <option value="90">Últimos 90 días</option>
            </select>
          </div>

          <div className="admin-filter-group">
            <label>Métrica</label>
            <select value={metricFilter} onChange={(event) => setMetricFilter(event.target.value)}>
              <option value="">Todas</option>
              {Object.keys(METRIC_LABELS).map((metric) => (
                <option value={metric} key={metric}>{metric}</option>
              ))}
            </select>
          </div>

          <div className="admin-filter-group">
            <label>Estado</label>
            <select value={ratingFilter} onChange={(event) => setRatingFilter(event.target.value)}>
              <option value="">Todos</option>
              <option value="GOOD">Bueno</option>
              <option value="NEEDS_IMPROVEMENT">Mejorable</option>
              <option value="POOR">Malo</option>
            </select>
          </div>

          <div className="admin-filter-group is-wide">
            <label>Buscar página</label>
            <input
              value={pathnameFilter}
              onChange={(event) => setPathnameFilter(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") loadData();
              }}
              placeholder="/catalogo, /producto, /catalogo/familia..."
            />
          </div>

          <button className="admin-soft-btn" onClick={loadData} disabled={loading}>
            <RefreshCw size={16} />
            Actualizar
          </button>

          <button className="admin-soft-btn" onClick={exportEventsCsv} disabled={!events.length}>
            Exportar CSV
          </button>
        </div>

        {error && <div className="admin-alert danger">{error}</div>}

        <div className="admin-performance-kpis">
          <article>
            <Activity size={24} />
            <span>Mediciones</span>
            <strong>{fmtNumber(kpis.total_mediciones)}</strong>
          </article>

          <article>
            <MonitorSmartphone size={24} />
            <span>Sesiones medidas</span>
            <strong>{fmtNumber(kpis.sesiones)}</strong>
          </article>

          <article>
            <Gauge size={24} />
            <span>Buenas</span>
            <strong>{fmtNumber(kpis.buenas)}</strong>
          </article>

          <article>
            <AlertTriangle size={24} />
            <span>Malas</span>
            <strong>{fmtNumber(kpis.malas)}</strong>
          </article>

          <article>
            <TrendingDown size={24} />
            <span>Peor métrica</span>
            <strong>{worstMetric?.metric_name || "-"}</strong>
          </article>
        </div>

        <div className="admin-performance-grid">
          <section className="admin-panel admin-performance-panel">
            <div className="admin-panel-title">
              <div>
                <span>Core Web Vitals</span>
                <h2>Resumen por métrica</h2>
              </div>
              <BarChart3 size={22} />
            </div>

            <div className="admin-performance-metrics">
              {metricas.length ? metricas.map((metric) => (
                <article key={metric.metric_name}>
                  <div>
                    <strong>{metric.metric_name}</strong>
                    <span>{METRIC_LABELS[metric.metric_name] || metric.metric_name}</span>
                  </div>

                  <div className="metric-value">
                    {fmtMetric(metric.metric_name, metric.promedio)}
                  </div>

                  <div className="metric-bars">
                    <span className="good" style={{ flex: Number(metric.buenas || 0) + 1 }} />
                    <span className="warning" style={{ flex: Number(metric.mejora || 0) + 1 }} />
                    <span className="danger" style={{ flex: Number(metric.malas || 0) + 1 }} />
                  </div>

                  <small>
                    {fmtNumber(metric.mediciones)} mediciones · {fmtNumber(metric.malas)} malas
                  </small>
                </article>
              )) : (
                <div className="empty-state small">
                  {loading ? "Cargando métricas..." : "Todavía no hay mediciones públicas."}
                </div>
              )}
            </div>
          </section>

          <section className="admin-panel admin-performance-panel">
            <div className="admin-panel-title">
              <div>
                <span>Prioridad técnica</span>
                <h2>Páginas lentas</h2>
              </div>
              <Timer size={22} />
            </div>

            <div className="admin-performance-slow-list">
              {paginasLentas.length ? paginasLentas.map((item) => (
                <article key={`${item.pathname}-${item.metric_name}`}>
                  <div>
                    <Link href={item.pathname || "/"} target="_blank">
                      {item.pathname || "/"}
                    </Link>
                    <span>{item.metric_name} · {fmtMetric(item.metric_name, item.promedio)}</span>
                  </div>
                  <strong>{fmtNumber(item.malas)} malas</strong>
                </article>
              )) : (
                <div className="empty-state small">
                  {loading ? "Cargando páginas..." : "No hay páginas lentas registradas en este rango."}
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="admin-panel admin-performance-table-panel">
          <div className="admin-panel-title">
            <div>
              <span>Detalle técnico</span>
              <h2>Eventos recientes</h2>
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Página</th>
                  <th>Métrica</th>
                  <th>Valor</th>
                  <th>Estado</th>
                  <th>Dispositivo</th>
                  <th>Conexión</th>
                </tr>
              </thead>
              <tbody>
                {events.length ? events.map((event) => (
                  <tr key={event.id}>
                    <td>{event.created_at ? new Date(event.created_at).toLocaleString("es-MX") : "-"}</td>
                    <td className="admin-performance-path">{event.pathname || "-"}</td>
                    <td>{event.metric_name}</td>
                    <td>{fmtMetric(event.metric_name, event.metric_value)}</td>
                    <td>
                      <span className={`performance-rating ${ratingClass(event.metric_rating)}`}>
                        {RATING_LABELS[event.metric_rating] || event.metric_rating || "-"}
                      </span>
                    </td>
                    <td>{event.device_type || "-"}</td>
                    <td>{event.connection_type || "-"}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="empty-state small">
                      {loading ? "Cargando eventos..." : "No hay eventos en este rango."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
}
