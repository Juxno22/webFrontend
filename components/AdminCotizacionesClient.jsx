"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut, Search, ClipboardList, ArrowRight,
  Car,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import AdminModuleNav from "@/components/AdminModuleNav";
import {
  clearAdminSession,
  getAdminCotizaciones,
  getAdminUser,
} from "../app/lib/adminApi";
import { useAdminAuth } from "../app/hooks/useAdminAuth";

const ESTADOS = [
  "",
  "NUEVA",
  "EN_REVISION",
  "CONTACTADO",
  "COTIZADO",
  "EN_PROCESO",
  "CERRADO",
  "CANCELADO",
  "REQUIERE_DATOS",
];

function formatDate(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AdminCotizacionesClient() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [filters, setFilters] = useState({
    q: "",
    estado: "",
    page: 1,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const totalText = useMemo(() => {
    if (!pagination) return "";

    return `${pagination.total} cotización${pagination.total === 1 ? "" : "es"}`;
  }, [pagination]);

  const lastUpdatedText = useMemo(() => {
    if (!lastUpdatedAt) return "";

    const seconds = Math.max(0, Math.floor((Date.now() - lastUpdatedAt.getTime()) / 1000));

    return `Actualizado hace ${seconds} seg`;
  }, [lastUpdatedAt, cotizaciones]);

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

    async function loadData({ silent = false } = {}) {
      try {
        if (!silent) setLoading(true);
        setError("");

        const response = await getAdminCotizaciones({
          q: filters.q,
          estado: filters.estado,
          page: filters.page,
          limit: 20,
        });

        setCotizaciones(response.data || []);
        setPagination(response.pagination || null);
        setLastUpdatedAt(new Date());
      } catch (err) {
        setError(err.message || "No se pudieron cargar cotizaciones.");
      } finally {
        if (!silent) setLoading(false);
      }
    }

    loadData();

    const interval = window.setInterval(() => {
      if (!document.hidden) {
        loadData({ silent: true });
      }
    }, 60_000);

    return () => window.clearInterval(interval);
  }, [user, filters]);

  function logout() {
    clearAdminSession();
    router.push("/admin/login");
  }

  function updateFilter(name, value) {
    setFilters((current) => ({
      ...current,
      [name]: value,
      page: 1,
    }));
  }

  function goToPage(page) {
    setFilters((current) => ({
      ...current,
      page,
    }));
  }

  return (
    <section className="admin-page">
      <div className="container">
        <div className="admin-topbar">
          <div>
            <span className="eyebrow">Panel de ventas</span>
            <h1>Cotizaciones</h1>
            <p>{user ? `${user.nombre} · ${user.rol}` : "Cargando usuario..."}</p>
          </div>

          <button className="admin-logout" onClick={logout}>
            <LogOut size={17} />
            Salir
          </button>
        </div>
        <AdminModuleNav />

        <div className="admin-toolbar">
          <div className="admin-search">
            <Search size={18} />
            <input
              type="search"
              value={filters.q}
              onChange={(event) => updateFilter("q", event.target.value)}
              placeholder="Buscar por folio, cliente, WhatsApp..."
            />
          </div>

          <select
            value={filters.estado}
            onChange={(event) => updateFilter("estado", event.target.value)}
          >
            {ESTADOS.map((estado) => (
              <option key={estado || "TODOS"} value={estado}>
                {estado || "Todos los estados"}
              </option>
            ))}
          </select>

          <div className="admin-toolbar-summary">
            <strong>{totalText}</strong>
            {lastUpdatedText && <small>{lastUpdatedText}</small>}
          </div>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <div className="admin-list">
          {loading ? (
            <div className="admin-empty">Cargando cotizaciones...</div>
          ) : cotizaciones.length > 0 ? (
            cotizaciones.map((item) => (
              <Link
                href={`/admin/cotizaciones/${encodeURIComponent(item.folio)}`}
                className={`admin-quote-card admin-quote-card-expanded ${item.estado === "NUEVA" ? "is-nueva" : ""}`}
                key={item.id}
              >
                <div className="admin-quote-icon">
                  <ClipboardList size={28} />
                </div>

                <div className="admin-quote-main">
                  <div className="admin-quote-head">
                    <strong>{item.folio}</strong>

                    <span className={`quote-status status-${item.estado}`}>
                      {item.estado}
                    </span>
                  </div>

                  <h3>{item.nombre_cliente}</h3>

                  <div className="admin-quote-detail-grid">
                    <span>
                      <Phone size={15} />
                      {item.whatsapp || "Sin WhatsApp"}
                    </span>

                    <span>
                      <ClipboardList size={15} />
                      {item.total_items} producto
                      {Number(item.total_items) === 1 ? "" : "s"} · {item.total_piezas} pieza
                      {Number(item.total_piezas) === 1 ? "" : "s"}
                    </span>

                    {item.correo && (
                      <span>
                        <Mail size={15} />
                        {item.correo}
                      </span>
                    )}

                    {(item.ciudad || item.estado_cliente) && (
                      <span>
                        <MapPin size={15} />
                        {[item.ciudad, item.estado_cliente].filter(Boolean).join(", ")}
                      </span>
                    )}

                    {(item.marca_vehiculo ||
                      item.modelo_vehiculo ||
                      item.anio_vehiculo ||
                      item.motor_vehiculo) && (
                        <span className="admin-quote-vehicle">
                          <Car size={15} />
                          {[item.marca_vehiculo, item.modelo_vehiculo, item.anio_vehiculo, item.motor_vehiculo]
                            .filter(Boolean)
                            .join(" ")}
                        </span>
                      )}
                  </div>
                </div>

                <div className="admin-quote-side">
                  <div className="admin-quote-date">{formatDate(item.created_at)}</div>

                  <div className="admin-quote-view">
                    Ver detalle
                    <ArrowRight size={16} />
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="admin-empty">No hay cotizaciones con esos filtros.</div>
          )}
        </div>

        {pagination && pagination.total_pages > 1 && (
          <div className="pagination">
            <button
              disabled={pagination.page <= 1}
              onClick={() => goToPage(pagination.page - 1)}
            >
              Anterior
            </button>

            <span>
              Página {pagination.page} de {pagination.total_pages}
            </span>

            <button
              disabled={pagination.page >= pagination.total_pages}
              onClick={() => goToPage(pagination.page + 1)}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </section>
  );
}