"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Car,
  ClipboardList,
  Clock3,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  ShoppingCart,
} from "lucide-react";
import {
  getAdminCotizaciones,
  getAdminCotizacionesResumen,
} from "@/app/lib/adminApi";
import { useAdminAuth } from "@/app/hooks/useAdminAuth";

const ESTADOS = [
  { value: "", label: "Todos" },
  { value: "NUEVA", label: "Nueva" },
  { value: "EN_REVISION", label: "En revisión" },
  { value: "CONTACTADO", label: "Contactado" },
  { value: "COTIZADO", label: "Cotizado" },
  { value: "EN_PROCESO", label: "En proceso" },
  { value: "REQUIERE_DATOS", label: "Requiere datos" },
  { value: "CERRADO", label: "Cerrado" },
  { value: "CANCELADO", label: "Cancelado" },
];

function formatDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatNumber(value) {
  return new Intl.NumberFormat("es-MX").format(Number(value || 0));
}

function getEstadoLabel(estado) {
  return ESTADOS.find((item) => item.value === estado)?.label || estado || "—";
}

function getVehicleLabel(item = {}) {
  return [
    item.marca_vehiculo,
    item.modelo_vehiculo,
    item.anio_vehiculo,
    item.motor_vehiculo,
  ]
    .filter(Boolean)
    .join(" ");
}

function getLocationLabel(item = {}) {
  return [item.ciudad, item.estado_cliente].filter(Boolean).join(", ");
}

export default function AdminCotizacionesClient() {
  const { checking } = useAdminAuth();

  const [cotizaciones, setCotizaciones] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState(null);

  const [filters, setFilters] = useState({
    q: "",
    estado: "",
    page: 1,
    limit: 20,
  });

  const [loading, setLoading] = useState(true);
  const [silentLoading, setSilentLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const totalText = useMemo(() => {
    if (!pagination) return "0 cotizaciones";

    return `${formatNumber(pagination.total)} cotización${
      Number(pagination.total) === 1 ? "" : "es"
    }`;
  }, [pagination]);

  const lastUpdatedText = useMemo(() => {
    if (!lastUpdatedAt) return "";

    const seconds = Math.max(
      0,
      Math.floor((Date.now() - lastUpdatedAt.getTime()) / 1000)
    );

    return `Actualizado hace ${seconds} seg`;
  }, [lastUpdatedAt, cotizaciones]);

  const loadData = useCallback(
    async ({ silent = false, nextFilters = filters } = {}) => {
      try {
        if (silent) {
          setSilentLoading(true);
        } else {
          setLoading(true);
        }

        setError("");

        const [listResponse, summaryResponse] = await Promise.all([
          getAdminCotizaciones(nextFilters),
          getAdminCotizacionesResumen(nextFilters),
        ]);

        setCotizaciones(listResponse.data || []);
        setPagination(listResponse.pagination || null);
        setSummary(summaryResponse.data || null);
        setLastUpdatedAt(new Date());
      } catch (err) {
        setError(err.message || "No se pudieron cargar cotizaciones.");
      } finally {
        setLoading(false);
        setSilentLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    if (!checking) {
      loadData();
    }
  }, [checking, loadData]);

  useEffect(() => {
    if (checking) return;

    const interval = window.setInterval(() => {
      if (!document.hidden) {
        loadData({ silent: true });
      }
    }, 60_000);

    return () => window.clearInterval(interval);
  }, [checking, loadData]);

  function updateFilter(name, value) {
    setFilters((current) => ({
      ...current,
      [name]: value,
      page: 1,
    }));
  }

  function submitFilters(event) {
    event.preventDefault();

    const nextFilters = {
      ...filters,
      page: 1,
    };

    setFilters(nextFilters);
    loadData({ nextFilters });
  }

  function goToPage(page) {
    const nextFilters = {
      ...filters,
      page,
    };

    setFilters(nextFilters);
    loadData({ nextFilters });
  }

  if (checking) return null;

  return (
    <section className="admin-workspace admin-quotes-os">
      <div className="admin-page-hero">
        <div>
          <span>Atención comercial</span>
          <h1>Cotizaciones</h1>
          <p>
            Bandeja de solicitudes comerciales. Revisa clientes, productos,
            vehículo, estado y prepara el flujo que después conectaremos con el
            chat en tiempo real.
          </p>
        </div>

        <div className="admin-page-hero-actions">
          <Link href="/admin/chat" className="admin-primary-button">
            <MessageCircle size={18} />
            Chat clientes
          </Link>

          <Link href="/admin/ventas" className="admin-secondary-button">
            <ShoppingCart size={18} />
            Ventas ecommerce
          </Link>

          <button
            type="button"
            className="admin-refresh-button"
            onClick={() => loadData()}
            disabled={loading || silentLoading}
          >
            {loading || silentLoading ? (
              <Loader2 size={18} className="admin-spin" />
            ) : (
              <RefreshCw size={18} />
            )}
            Actualizar
          </button>
        </div>
      </div>

      <div className="admin-kpi-grid admin-quotes-kpi-grid">
        <article className="admin-kpi-card">
          <ClipboardList size={22} />
          <span>Total</span>
          <strong>{formatNumber(summary?.total)}</strong>
          <small>{totalText}</small>
        </article>

        <article className="admin-kpi-card">
          <AlertTriangle size={22} />
          <span>Nuevas</span>
          <strong>{formatNumber(summary?.nuevas)}</strong>
          <small>Sin revisar</small>
        </article>

        <article className="admin-kpi-card">
          <Clock3 size={22} />
          <span>Pendientes</span>
          <strong>{formatNumber(summary?.pendientes)}</strong>
          <small>Requieren seguimiento</small>
        </article>

        <article className="admin-kpi-card">
          <MessageCircle size={22} />
          <span>Nuevas hoy</span>
          <strong>{formatNumber(summary?.nuevas_hoy)}</strong>
          <small>Entrantes del día</small>
        </article>

        <article className="admin-kpi-card">
          <ClipboardList size={22} />
          <span>Cotizadas</span>
          <strong>{formatNumber(summary?.cotizado)}</strong>
          <small>Con respuesta comercial</small>
        </article>

        <article className="admin-kpi-card">
          <ArrowRight size={22} />
          <span>En proceso</span>
          <strong>{formatNumber(summary?.en_proceso)}</strong>
          <small>Seguimiento activo</small>
        </article>
      </div>

      <form className="admin-quotes-filters" onSubmit={submitFilters}>
        <label>
          Buscar
          <div>
            <Search size={16} />
            <input
              type="search"
              value={filters.q}
              onChange={(event) => updateFilter("q", event.target.value)}
              placeholder="Folio, cliente, WhatsApp, correo o vehículo"
            />
          </div>
        </label>

        <label>
          Estado
          <select
            value={filters.estado}
            onChange={(event) => updateFilter("estado", event.target.value)}
          >
            {ESTADOS.map((estado) => (
              <option key={estado.value || "TODOS"} value={estado.value}>
                {estado.label}
              </option>
            ))}
          </select>
        </label>

        <button className="admin-primary-button" type="submit" disabled={loading}>
          {loading ? <Loader2 size={17} className="admin-spin" /> : null}
          Filtrar
        </button>

        <div className="admin-quotes-filter-summary">
          <strong>{totalText}</strong>
          {lastUpdatedText && <small>{lastUpdatedText}</small>}
        </div>
      </form>

      {error && (
        <div className="admin-alert">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <span>Bandeja comercial</span>
            <h2>Solicitudes de cotización</h2>
            <p>
              Las cotizaciones nuevas se destacan visualmente para que ventas las
              atienda primero.
            </p>
          </div>

          <Link href="/admin/chat">
            Ir al chat
            <ArrowRight size={15} />
          </Link>
        </div>

        {loading ? (
          <div className="admin-loading-panel">
            <Loader2 size={34} className="admin-spin" />
            <strong>Cargando cotizaciones...</strong>
          </div>
        ) : cotizaciones.length > 0 ? (
          <div className="admin-quotes-list">
            {cotizaciones.map((item) => {
              const vehicle = getVehicleLabel(item);
              const location = getLocationLabel(item);
              const isNueva = item.estado === "NUEVA";

              return (
                <Link
                  href={`/admin/cotizaciones/${encodeURIComponent(item.folio)}`}
                  className={`admin-quote-card-os ${
                    isNueva ? "is-nueva" : ""
                  }`}
                  key={item.id}
                >
                  <div className="admin-quote-card-icon">
                    <ClipboardList size={24} />
                  </div>

                  <div className="admin-quote-card-main">
                    <div className="admin-quote-card-head">
                      <div>
                        <strong>{item.folio}</strong>
                        <small>{formatDate(item.created_at)}</small>
                      </div>

                      <mark
                        className={`admin-status-pill status-${item.estado}`}
                      >
                        {getEstadoLabel(item.estado)}
                      </mark>
                    </div>

                    <h3>{item.nombre_cliente}</h3>

                    <div className="admin-quote-card-meta">
                      <span>
                        <Phone size={15} />
                        {item.whatsapp || "Sin WhatsApp"}
                      </span>

                      <span>
                        <ClipboardList size={15} />
                        {formatNumber(item.total_items)} producto
                        {Number(item.total_items) === 1 ? "" : "s"} ·{" "}
                        {formatNumber(item.total_piezas)} pieza
                        {Number(item.total_piezas) === 1 ? "" : "s"}
                      </span>

                      {item.correo && (
                        <span>
                          <Mail size={15} />
                          {item.correo}
                        </span>
                      )}

                      {location && (
                        <span>
                          <MapPin size={15} />
                          {location}
                        </span>
                      )}

                      {vehicle && (
                        <span className="admin-quote-vehicle">
                          <Car size={15} />
                          {vehicle}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="admin-quote-card-side">
                    {isNueva && <span className="admin-quote-new-dot" />}
                    <strong>Ver detalle</strong>
                    <ArrowRight size={17} />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="admin-loading-panel">
            <ClipboardList size={34} />
            <strong>No hay cotizaciones con esos filtros.</strong>
          </div>
        )}

        {pagination && pagination.total_pages > 1 && (
          <div className="admin-sales-pagination">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => goToPage(pagination.page - 1)}
            >
              Anterior
            </button>

            <span>
              Página {pagination.page} de {pagination.total_pages}
            </span>

            <button
              type="button"
              disabled={pagination.page >= pagination.total_pages}
              onClick={() => goToPage(pagination.page + 1)}
            >
              Siguiente
            </button>
          </div>
        )}
      </section>
    </section>
  );
}