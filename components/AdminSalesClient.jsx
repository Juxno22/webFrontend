"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  Loader2,
  PackageCheck,
  RefreshCw,
  Search,
  Truck,
  X,
  XCircle,
} from "lucide-react";
import AdminModuleNav from "@/components/AdminModuleNav";
import { useAdminAuth } from "@/app/hooks/useAdminAuth";
import {
  addAdminVentaNota,
  getAdminVenta,
  getAdminVentas,
  getAdminVentasResumen,
  updateAdminVentaEstado,
} from "@/app/lib/adminApi";

const ESTADOS = [
  { value: "", label: "Todos" },
  { value: "PENDIENTE_PAGO", label: "Pendiente pago" },
  { value: "PAGADA", label: "Pagada" },
  { value: "EN_PREPARACION", label: "En preparación" },
  { value: "LISTA_ENTREGA", label: "Lista entrega" },
  { value: "ENTREGADA", label: "Entregada" },
  { value: "PAGO_RECHAZADO", label: "Pago rechazado" },
  { value: "CANCELADA", label: "Cancelada" },
  { value: "REEMBOLSADA", label: "Reembolsada" },
];

function formatMoney(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(value || 0));
}

function formatNumber(value) {
  return new Intl.NumberFormat("es-MX").format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getEstadoLabel(estado) {
  const found = ESTADOS.find((item) => item.value === estado);

  return found?.label || estado || "—";
}

function getStatusClass(estado) {
  return `status-${String(estado || "").toLowerCase()}`;
}

function getPrimaryIcon(estado) {
  if (estado === "PAGADA") return CheckCircle2;
  if (estado === "PENDIENTE_PAGO") return Clock3;
  if (estado === "PAGO_RECHAZADO" || estado === "CANCELADA") return XCircle;
  if (estado === "EN_PREPARACION") return PackageCheck;
  if (estado === "LISTA_ENTREGA" || estado === "ENTREGADA") return Truck;

  return CreditCard;
}

export default function AdminSalesClient() {
  const { checking } = useAdminAuth();

  const [filters, setFilters] = useState({
    q: "",
    estado: "",
    desde: "",
    hasta: "",
    page: 1,
    limit: 20,
  });

  const [summary, setSummary] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [selected, setSelected] = useState(null);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [nextStatus, setNextStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState("");

  const activeFilters = useMemo(() => {
    return {
      q: filters.q,
      estado: filters.estado,
      desde: filters.desde,
      hasta: filters.hasta,
      page: filters.page,
      limit: filters.limit,
    };
  }, [filters]);

  async function loadData(nextFilters = activeFilters) {
    try {
      setLoading(true);
      setError("");

      const [summaryResponse, ventasResponse] = await Promise.all([
        getAdminVentasResumen(nextFilters),
        getAdminVentas(nextFilters),
      ]);

      setSummary(summaryResponse.data);
      setVentas(ventasResponse.data || []);
      setPagination(ventasResponse.pagination || null);
    } catch (err) {
      setError(err.message || "No se pudieron cargar las ventas.");
    } finally {
      setLoading(false);
    }
  }

  async function loadVenta(folio) {
    try {
      setSelectedLoading(true);
      setError("");

      const response = await getAdminVenta(folio);

      setSelected(response.data);
      setNextStatus(response.data?.allowed_next_statuses?.[0] || "");
      setStatusNote("");
      setNewNote("");
    } catch (err) {
      setError(err.message || "No se pudo cargar el detalle.");
    } finally {
      setSelectedLoading(false);
    }
  }

  useEffect(() => {
    if (!checking) {
      loadData();
    }
  }, [checking]);

  function updateFilter(name, value) {
    setFilters((current) => ({
      ...current,
      [name]: value,
      page: name === "page" ? value : 1,
    }));
  }

  function submitFilters(event) {
    event.preventDefault();

    loadData({
      ...filters,
      page: 1,
    });
  }

  async function changeStatus(event) {
    event.preventDefault();

    if (!selected || !nextStatus) return;

    try {
      setUpdatingStatus(true);
      setError("");

      await updateAdminVentaEstado(selected.folio, {
        estado: nextStatus,
        nota: statusNote,
      });

      await loadVenta(selected.folio);
      await loadData(activeFilters);
    } catch (err) {
      setError(err.message || "No se pudo actualizar el estado.");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function addNote(event) {
    event.preventDefault();

    if (!selected || !newNote.trim()) return;

    try {
      setUpdatingStatus(true);
      setError("");

      await addAdminVentaNota(selected.folio, {
        nota: newNote,
      });

      await loadVenta(selected.folio);
      setNewNote("");
    } catch (err) {
      setError(err.message || "No se pudo agregar la nota.");
    } finally {
      setUpdatingStatus(false);
    }
  }

  if (checking) return null;

  return (
    <section className="admin-page admin-sales-page">
      <div className="container">
        <div className="admin-topbar">
          <div>
            <span className="eyebrow">Ventas web</span>
            <h1>Ventas entrantes</h1>
            <p>
              Monitorea pagos de Mercado Pago, pedidos pagados y preparación de
              entregas.
            </p>
          </div>

          <button
            className="admin-logout"
            type="button"
            onClick={() => loadData()}
            disabled={loading}
          >
            <RefreshCw size={17} />
            Actualizar
          </button>
        </div>

        <AdminModuleNav />

        {error && (
          <div className="admin-sales-alert">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        <div className="admin-sales-kpis">
          <article>
            <CreditCard size={22} />
            <span>Total ventas</span>
            <strong>{formatNumber(summary?.total)}</strong>
          </article>

          <article>
            <Clock3 size={22} />
            <span>Pendientes pago</span>
            <strong>{formatNumber(summary?.pendiente_pago)}</strong>
          </article>

          <article>
            <CheckCircle2 size={22} />
            <span>Pagadas</span>
            <strong>{formatNumber(summary?.pagadas)}</strong>
          </article>

          <article>
            <PackageCheck size={22} />
            <span>Requieren atención</span>
            <strong>{formatNumber(summary?.requieren_atencion)}</strong>
          </article>

          <article>
            <Truck size={22} />
            <span>Entregadas</span>
            <strong>{formatNumber(summary?.entregadas)}</strong>
          </article>

          <article>
            <CreditCard size={22} />
            <span>Importe confirmado</span>
            <strong>{formatMoney(summary?.importe_confirmado)}</strong>
          </article>
        </div>

        <form className="admin-sales-filters" onSubmit={submitFilters}>
          <label>
            Buscar
            <div>
              <Search size={16} />
              <input
                type="search"
                value={filters.q}
                onChange={(event) => updateFilter("q", event.target.value)}
                placeholder="Folio, cliente, WhatsApp, pago o producto"
              />
            </div>
          </label>

          <label>
            Estado
            <select
              value={filters.estado}
              onChange={(event) => updateFilter("estado", event.target.value)}
            >
              {ESTADOS.map((item) => (
                <option key={item.value || "todos"} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

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

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? <Loader2 size={17} className="admin-sales-spin" /> : null}
            Filtrar
          </button>
        </form>

        <div className="admin-sales-layout">
          <article className="admin-sales-card">
            <div className="admin-sales-card-head">
              <div>
                <span>Ventas</span>
                <h2>Pedidos recientes</h2>
              </div>
            </div>

            <div className="admin-sales-table-wrap">
              <table className="admin-sales-table">
                <thead>
                  <tr>
                    <th>Folio</th>
                    <th>Cliente</th>
                    <th>Estado</th>
                    <th>Total</th>
                    <th>Piezas</th>
                    <th>Pago</th>
                    <th>Fecha</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {ventas.map((venta) => {
                    const Icon = getPrimaryIcon(venta.estado);

                    return (
                      <tr key={venta.id}>
                        <td>
                          <strong>{venta.folio}</strong>
                        </td>
                        <td>
                          <span>{venta.nombre_cliente}</span>
                          <small>{venta.whatsapp}</small>
                        </td>
                        <td>
                          <span
                            className={`admin-sale-status ${getStatusClass(
                              venta.estado
                            )}`}
                          >
                            <Icon size={14} />
                            {getEstadoLabel(venta.estado)}
                          </span>
                        </td>
                        <td>{formatMoney(venta.total)}</td>
                        <td>{formatNumber(venta.total_piezas)}</td>
                        <td>
                          <span>{venta.mp_payment_status || "—"}</span>
                          <small>{venta.mp_payment_id || "sin pago"}</small>
                        </td>
                        <td>{formatDate(venta.created_at)}</td>
                        <td>
                          <button
                            className="admin-sales-view"
                            type="button"
                            onClick={() => loadVenta(venta.folio)}
                          >
                            <Eye size={15} />
                            Ver
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {!ventas.length && (
                    <tr>
                      <td colSpan={8}>No hay ventas con esos filtros.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {pagination && pagination.total_pages > 1 && (
              <div className="admin-sales-pagination">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => {
                    const next = { ...filters, page: pagination.page - 1 };
                    setFilters(next);
                    loadData(next);
                  }}
                >
                  Anterior
                </button>

                <span>
                  Página {pagination.page} de {pagination.total_pages}
                </span>

                <button
                  type="button"
                  disabled={pagination.page >= pagination.total_pages}
                  onClick={() => {
                    const next = { ...filters, page: pagination.page + 1 };
                    setFilters(next);
                    loadData(next);
                  }}
                >
                  Siguiente
                </button>
              </div>
            )}
          </article>

          <article className="admin-sales-card">
            <div className="admin-sales-card-head">
              <div>
                <span>Ranking</span>
                <h2>Productos vendidos</h2>
              </div>
            </div>

            <div className="admin-sales-top-products">
              {(summary?.top_productos || []).map((item, index) => (
                <div key={`${item.codigo_andyfers}-${index}`}>
                  <strong>{item.codigo_andyfers || item.codigo_importacion}</strong>
                  <p>{item.descripcion_producto}</p>
                  <span>
                    {formatNumber(item.piezas)} pzas · {formatMoney(item.importe)}
                  </span>
                </div>
              ))}

              {!summary?.top_productos?.length && (
                <p className="admin-sales-empty-small">
                  Todavía no hay productos pagados.
                </p>
              )}
            </div>
          </article>
        </div>
      </div>

      {selected && (
        <div className="admin-sale-modal-layer">
          <button
            type="button"
            className="admin-sale-modal-backdrop"
            aria-label="Cerrar detalle"
            onClick={() => setSelected(null)}
          />

          <aside className="admin-sale-modal">
            <div className="admin-sale-modal-head">
              <div>
                <span>Detalle de venta</span>
                <h2>{selected.folio}</h2>
              </div>

              <button type="button" onClick={() => setSelected(null)}>
                <X size={20} />
              </button>
            </div>

            {selectedLoading ? (
              <div className="admin-sale-modal-loading">
                <Loader2 size={28} className="admin-sales-spin" />
                Cargando venta...
              </div>
            ) : (
              <>
                <div className="admin-sale-detail-grid">
                  <div>
                    <span>Estado</span>
                    <strong>{getEstadoLabel(selected.estado)}</strong>
                  </div>

                  <div>
                    <span>Total</span>
                    <strong>{formatMoney(selected.total)}</strong>
                  </div>

                  <div>
                    <span>Cliente</span>
                    <strong>{selected.nombre_cliente}</strong>
                    <p>{selected.whatsapp}</p>
                  </div>

                  <div>
                    <span>Pago Mercado Pago</span>
                    <strong>{selected.mp_payment_status || "—"}</strong>
                    <p>{selected.mp_payment_id || "sin payment id"}</p>
                  </div>
                </div>

                <div className="admin-sale-address">
                  <span>Dirección de envío</span>
                  <p>{selected.direccion_envio}</p>

                  {selected.comentarios_cliente && (
                    <>
                      <span>Comentarios cliente</span>
                      <p>{selected.comentarios_cliente}</p>
                    </>
                  )}
                </div>

                <div className="admin-sale-section">
                  <h3>Productos</h3>

                  <div className="admin-sale-items">
                    {selected.items?.map((item) => (
                      <div key={item.id}>
                        <strong>
                          {item.codigo_andyfers || item.codigo_importacion}
                        </strong>
                        <p>{item.descripcion_producto}</p>
                        <span>
                          {formatNumber(item.cantidad)} pza(s) ·{" "}
                          {formatMoney(item.precio_unitario)} ·{" "}
                          {formatMoney(item.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {selected.allowed_next_statuses?.length > 0 && (
                  <form className="admin-sale-status-form" onSubmit={changeStatus}>
                    <h3>Cambiar estado operativo</h3>

                    <select
                      value={nextStatus}
                      onChange={(event) => setNextStatus(event.target.value)}
                    >
                      {selected.allowed_next_statuses.map((estado) => (
                        <option key={estado} value={estado}>
                          {getEstadoLabel(estado)}
                        </option>
                      ))}
                    </select>

                    <textarea
                      value={statusNote}
                      onChange={(event) => setStatusNote(event.target.value)}
                      rows={3}
                      placeholder="Nota opcional del cambio"
                    />

                    <button
                      className="btn-primary"
                      type="submit"
                      disabled={updatingStatus || !nextStatus}
                    >
                      {updatingStatus ? (
                        <Loader2 size={17} className="admin-sales-spin" />
                      ) : null}
                      Actualizar estado
                    </button>
                  </form>
                )}

                <form className="admin-sale-status-form" onSubmit={addNote}>
                  <h3>Nota interna</h3>

                  <textarea
                    value={newNote}
                    onChange={(event) => setNewNote(event.target.value)}
                    rows={3}
                    placeholder="Agregar nota interna para operación"
                  />

                  <button
                    className="btn-secondary"
                    type="submit"
                    disabled={updatingStatus || !newNote.trim()}
                  >
                    Agregar nota
                  </button>
                </form>

                <div className="admin-sale-section">
                  <h3>Historial</h3>

                  <div className="admin-sale-history">
                    {selected.historial?.map((item) => (
                      <div key={item.id}>
                        <strong>
                          {item.estado_anterior || "—"} → {item.estado_nuevo}
                        </strong>
                        <p>{item.nota || "Sin nota"}</p>
                        <span>
                          {item.origen} · {item.admin_correo || "sistema"} ·{" "}
                          {formatDate(item.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="admin-sale-section">
                  <h3>Webhooks Mercado Pago</h3>

                  <div className="admin-sale-history">
                    {selected.webhooks?.length ? (
                      selected.webhooks.map((item) => (
                        <div key={item.id}>
                          <strong>
                            {item.tipo || "evento"} ·{" "}
                            {Number(item.procesado) === 1
                              ? "procesado"
                              : "pendiente"}
                          </strong>
                          <p>{item.error_proceso || item.mp_payment_id || "Sin error"}</p>
                          <span>{formatDate(item.created_at)}</span>
                        </div>
                      ))
                    ) : (
                      <p>No hay webhooks vinculados todavía.</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}