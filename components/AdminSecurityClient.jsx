"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Filter,
  LockKeyhole,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import AdminModuleNav from "./AdminModuleNav";
import {
  createAdminSecurityManualEvent,
  getAdminAuditLogs,
  getAdminCriticalActionLogs,
  getAdminCriticalActionSummary,
  getAdminSecurityEvents,
  getAdminSecuritySummary,
  updateAdminSecurityEventStatus,
} from "@/app/lib/adminSecurityApi";

const STATUS_OPTIONS = ["NUEVO", "EN_REVISION", "RESUELTO", "DESCARTADO"];
const SEVERITY_OPTIONS = ["BAJA", "MEDIA", "ALTA", "CRITICA"];
const METHOD_OPTIONS = ["POST", "PUT", "PATCH", "DELETE"];
const CRITICAL_STATUS_OPTIONS = ["APLICADA", "BLOQUEADA", "ERROR"];

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
}

function normalizeData(payload) {
  return payload?.data || payload || {};
}

function formatDate(value) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function numberValue(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function normalizeLabel(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w|\s\w/g, (letter) => letter.toUpperCase());
}

function downloadCsv(filename, rows) {
  const safeRows = Array.isArray(rows) ? rows : [];
  if (!safeRows.length) return;

  const headers = Array.from(
    safeRows.reduce((set, row) => {
      Object.keys(row || {}).forEach((key) => set.add(key));
      return set;
    }, new Set())
  );

  const escapeCell = (value) => {
    if (value === undefined || value === null) return "";
    const text = typeof value === "object" ? JSON.stringify(value) : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };

  const csv = [
    headers.join(","),
    ...safeRows.map((row) => headers.map((header) => escapeCell(row?.[header])).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminSecurityClient() {
  const [activeTab, setActiveTab] = useState("eventos");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);
  const [criticalSummary, setCriticalSummary] = useState(null);
  const [events, setEvents] = useState([]);
  const [audit, setAudit] = useState([]);
  const [criticalActions, setCriticalActions] = useState([]);
  const [filters, setFilters] = useState({
    days: "30",
    estado: "",
    severidad: "",
    method: "",
    success: "",
    critical_status: "",
    q: "",
  });
  const [manualEvent, setManualEvent] = useState({
    tipo: "REVISION_MANUAL",
    severidad: "MEDIA",
    detalle: "",
  });

  const totals = useMemo(() => {
    const auditSummary = summary?.audit || {};
    const securitySummary = summary?.security || {};
    const critical = criticalSummary?.resumen || {};

    return {
      totalAcciones: numberValue(auditSummary.total_acciones),
      accionesFallidas: numberValue(auditSummary.acciones_fallidas),
      adminsActivos: numberValue(auditSummary.admins_activos),
      ipsDetectadas: numberValue(auditSummary.ips_detectadas),
      totalEventos: numberValue(securitySummary.total_eventos),
      eventosNuevos: numberValue(securitySummary.eventos_nuevos),
      eventosAltos: numberValue(securitySummary.eventos_altos),
      criticas: numberValue(critical.total_acciones_criticas),
      criticasAplicadas: numberValue(critical.aplicadas),
      criticasBloqueadas: numberValue(critical.bloqueadas),
      productosAfectados: numberValue(critical.productos_afectados),
    };
  }, [summary, criticalSummary]);

  async function loadData(nextFilters = filters) {
    setLoading(true);
    setError("");

    try {
      const baseParams = {
        days: nextFilters.days || "30",
        q: nextFilters.q || "",
      };

      const [summaryPayload, eventsPayload, auditPayload, criticalSummaryPayload, criticalPayload] = await Promise.all([
        getAdminSecuritySummary({ days: nextFilters.days || "30" }),
        getAdminSecurityEvents({
          ...baseParams,
          estado: nextFilters.estado,
          severidad: nextFilters.severidad,
          limit: 120,
        }),
        getAdminAuditLogs({
          ...baseParams,
          method: nextFilters.method,
          success: nextFilters.success,
          limit: 120,
        }),
        getAdminCriticalActionSummary({ days: nextFilters.days || "30" }),
        getAdminCriticalActionLogs({
          ...baseParams,
          status: nextFilters.critical_status,
          severidad: nextFilters.severidad,
          limit: 120,
        }),
      ]);

      setSummary(normalizeData(summaryPayload));
      setEvents(normalizeList(eventsPayload));
      setAudit(normalizeList(auditPayload));
      setCriticalSummary(normalizeData(criticalSummaryPayload));
      setCriticalActions(normalizeList(criticalPayload));
    } catch (err) {
      setError(err?.message || "No se pudo cargar la seguridad admin.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFilterSubmit(event) {
    event.preventDefault();
    await loadData(filters);
  }

  async function handleStatusChange(id, estado) {
    setSaving(true);
    setError("");

    try {
      await updateAdminSecurityEventStatus(id, estado);
      await loadData(filters);
    } catch (err) {
      setError(err?.message || "No se pudo actualizar el evento.");
    } finally {
      setSaving(false);
    }
  }

  async function handleManualSubmit(event) {
    event.preventDefault();

    if (!manualEvent.detalle.trim()) {
      setError("Escribe el detalle del evento manual.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await createAdminSecurityManualEvent(manualEvent);
      setManualEvent({ tipo: "REVISION_MANUAL", severidad: "MEDIA", detalle: "" });
      await loadData(filters);
      setActiveTab("eventos");
    } catch (err) {
      setError(err?.message || "No se pudo crear el evento manual.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="admin-security-page">
      <AdminModuleNav />

      <section className="admin-security-hero">
        <div>
          <span className="admin-security-eyebrow">M11.1B</span>
          <h1>Seguridad y auditoría admin</h1>
          <p>
            Revisa eventos de seguridad, rate limits, acciones administrativas y acciones críticas con confirmación fuerte.
          </p>
        </div>

        <button type="button" className="admin-security-refresh" onClick={() => loadData(filters)} disabled={loading}>
          <RefreshCw size={17} />
          Actualizar
        </button>
      </section>

      {error ? <div className="admin-security-alert"><AlertTriangle size={18} /> {error}</div> : null}

      <section className="admin-security-kpis">
        <article>
          <ShieldAlert size={24} />
          <span>Eventos seguridad</span>
          <strong>{totals.totalEventos}</strong>
          <small>{totals.eventosNuevos} nuevos</small>
        </article>

        <article>
          <AlertTriangle size={24} />
          <span>Alta prioridad</span>
          <strong>{totals.eventosAltos}</strong>
          <small>Alta / crítica</small>
        </article>

        <article>
          <UserCog size={24} />
          <span>Acciones admin</span>
          <strong>{totals.totalAcciones}</strong>
          <small>{totals.accionesFallidas} fallidas</small>
        </article>

        <article>
          <LockKeyhole size={24} />
          <span>Acciones críticas</span>
          <strong>{totals.criticas}</strong>
          <small>{totals.criticasBloqueadas} bloqueadas</small>
        </article>

        <article>
          <ShieldCheck size={24} />
          <span>Críticas aplicadas</span>
          <strong>{totals.criticasAplicadas}</strong>
          <small>{totals.productosAfectados} productos</small>
        </article>
      </section>

      <form className="admin-security-filters" onSubmit={handleFilterSubmit}>
        <label>
          Días
          <input
            type="number"
            min="1"
            max="180"
            value={filters.days}
            onChange={(event) => setFilters((prev) => ({ ...prev, days: event.target.value }))}
          />
        </label>

        <label>
          Estado evento
          <select value={filters.estado} onChange={(event) => setFilters((prev) => ({ ...prev, estado: event.target.value }))}>
            <option value="">Todos</option>
            {STATUS_OPTIONS.map((estado) => <option key={estado} value={estado}>{normalizeLabel(estado)}</option>)}
          </select>
        </label>

        <label>
          Severidad
          <select value={filters.severidad} onChange={(event) => setFilters((prev) => ({ ...prev, severidad: event.target.value }))}>
            <option value="">Todas</option>
            {SEVERITY_OPTIONS.map((severity) => <option key={severity} value={severity}>{normalizeLabel(severity)}</option>)}
          </select>
        </label>

        <label>
          Método
          <select value={filters.method} onChange={(event) => setFilters((prev) => ({ ...prev, method: event.target.value }))}>
            <option value="">Todos</option>
            {METHOD_OPTIONS.map((method) => <option key={method} value={method}>{method}</option>)}
          </select>
        </label>

        <label>
          Estado crítico
          <select value={filters.critical_status} onChange={(event) => setFilters((prev) => ({ ...prev, critical_status: event.target.value }))}>
            <option value="">Todos</option>
            {CRITICAL_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{normalizeLabel(status)}</option>)}
          </select>
        </label>

        <label>
          Buscar
          <input
            value={filters.q}
            onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
            placeholder="correo, acción, ruta, producto..."
          />
        </label>

        <button type="submit" disabled={loading}>
          <Filter size={16} />
          Filtrar
        </button>
      </form>

      <nav className="admin-security-tabs">
        <button type="button" className={activeTab === "eventos" ? "active" : ""} onClick={() => setActiveTab("eventos")}>
          Eventos
        </button>
        <button type="button" className={activeTab === "auditoria" ? "active" : ""} onClick={() => setActiveTab("auditoria")}>
          Auditoría
        </button>
        <button type="button" className={activeTab === "criticas" ? "active" : ""} onClick={() => setActiveTab("criticas")}>
          Acciones críticas
        </button>
        <button type="button" className={activeTab === "resumen" ? "active" : ""} onClick={() => setActiveTab("resumen")}>
          Resumen
        </button>
        <button type="button" className={activeTab === "manual" ? "active" : ""} onClick={() => setActiveTab("manual")}>
          Evento manual
        </button>
      </nav>

      {loading ? <div className="admin-security-loading">Cargando seguridad admin...</div> : null}

      {!loading && activeTab === "eventos" ? (
        <section className="admin-security-card">
          <div className="admin-security-card-head">
            <h2>Eventos de seguridad</h2>
            <button type="button" onClick={() => downloadCsv("eventos_seguridad.csv", events)}>
              <Download size={15} /> CSV
            </button>
          </div>

          <div className="admin-security-table-wrap">
            <table className="admin-security-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Severidad</th>
                  <th>Estado</th>
                  <th>Admin</th>
                  <th>Ruta</th>
                  <th>Detalle</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>{formatDate(event.created_at)}</td>
                    <td>{normalizeLabel(event.tipo)}</td>
                    <td><span className={`security-pill severity-${String(event.severidad || "").toLowerCase()}`}>{event.severidad}</span></td>
                    <td>{normalizeLabel(event.estado)}</td>
                    <td>{event.admin_email || "—"}</td>
                    <td>{event.path || "—"}</td>
                    <td>{event.detalle || "—"}</td>
                    <td>
                      <select disabled={saving} value={event.estado || "NUEVO"} onChange={(e) => handleStatusChange(event.id, e.target.value)}>
                        {STATUS_OPTIONS.map((estado) => <option key={estado} value={estado}>{normalizeLabel(estado)}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
                {!events.length ? <tr><td colSpan="8">Sin eventos en el rango seleccionado.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {!loading && activeTab === "auditoria" ? (
        <section className="admin-security-card">
          <div className="admin-security-card-head">
            <h2>Auditoría administrativa</h2>
            <button type="button" onClick={() => downloadCsv("auditoria_admin.csv", audit)}>
              <Download size={15} /> CSV
            </button>
          </div>

          <div className="admin-security-table-wrap">
            <table className="admin-security-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Admin</th>
                  <th>Acción</th>
                  <th>Método</th>
                  <th>Ruta</th>
                  <th>Estado</th>
                  <th>Recurso</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDate(log.created_at)}</td>
                    <td>{log.admin_email || "—"}</td>
                    <td>{normalizeLabel(log.action)}</td>
                    <td><span className="security-pill method">{log.method}</span></td>
                    <td>{log.path || "—"}</td>
                    <td>{Number(log.success) ? <span className="audit-ok"><CheckCircle2 size={15} /> OK</span> : <span className="audit-bad"><AlertTriangle size={15} /> Falló</span>}</td>
                    <td>{log.resource_type || "—"} {log.resource_id ? `#${log.resource_id}` : ""}</td>
                  </tr>
                ))}
                {!audit.length ? <tr><td colSpan="7">Sin acciones en el rango seleccionado.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {!loading && activeTab === "criticas" ? (
        <section className="admin-security-card">
          <div className="admin-security-card-head">
            <h2>Acciones críticas</h2>
            <button type="button" onClick={() => downloadCsv("acciones_criticas_admin.csv", criticalActions)}>
              <Download size={15} /> CSV
            </button>
          </div>

          <div className="admin-security-critical-note">
            Estas acciones requieren confirmación exacta y motivo antes de afectar visibilidad, destacado, nuevo o descarte operativo.
          </div>

          <div className="admin-security-table-wrap">
            <table className="admin-security-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Admin</th>
                  <th>Acción</th>
                  <th>Estado</th>
                  <th>Producto</th>
                  <th>Pendiente</th>
                  <th>Motivo</th>
                  <th>Ruta</th>
                </tr>
              </thead>
              <tbody>
                {criticalActions.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.created_at)}</td>
                    <td>{item.admin_email || "—"}</td>
                    <td>{item.label || normalizeLabel(item.action)}</td>
                    <td><span className={`security-pill critical-${String(item.status || "").toLowerCase()}`}>{normalizeLabel(item.status)}</span></td>
                    <td>{item.codigo_andyfers_cache || item.producto_id || "—"}</td>
                    <td>{item.pendiente_id || "—"}</td>
                    <td>{item.motivo || item.error_message || "—"}</td>
                    <td>{item.path || "—"}</td>
                  </tr>
                ))}
                {!criticalActions.length ? <tr><td colSpan="8">Sin acciones críticas en el rango seleccionado.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {!loading && activeTab === "resumen" ? (
        <section className="admin-security-grid">
          <article className="admin-security-card">
            <h2>Top acciones admin</h2>
            {(summary?.top_actions || []).map((row) => (
              <div className="security-summary-row" key={row.action}>
                <span>{normalizeLabel(row.action)}</span>
                <strong>{row.total}</strong>
              </div>
            ))}
          </article>

          <article className="admin-security-card">
            <h2>Top eventos seguridad</h2>
            {(summary?.top_security || []).map((row) => (
              <div className="security-summary-row" key={`${row.tipo}-${row.severidad}-${row.estado}`}>
                <span>{normalizeLabel(row.tipo)} · {row.severidad} · {normalizeLabel(row.estado)}</span>
                <strong>{row.total}</strong>
              </div>
            ))}
          </article>

          <article className="admin-security-card">
            <h2>Top acciones críticas</h2>
            {(criticalSummary?.top_actions || []).map((row) => (
              <div className="security-summary-row" key={`${row.action}-${row.status}`}>
                <span>{normalizeLabel(row.action)} · {normalizeLabel(row.status)}</span>
                <strong>{row.total}</strong>
              </div>
            ))}
          </article>
        </section>
      ) : null}

      {!loading && activeTab === "manual" ? (
        <section className="admin-security-card">
          <h2>Registrar evento manual</h2>
          <form className="admin-security-manual-form" onSubmit={handleManualSubmit}>
            <label>
              Tipo
              <input value={manualEvent.tipo} onChange={(event) => setManualEvent((prev) => ({ ...prev, tipo: event.target.value }))} />
            </label>

            <label>
              Severidad
              <select value={manualEvent.severidad} onChange={(event) => setManualEvent((prev) => ({ ...prev, severidad: event.target.value }))}>
                {SEVERITY_OPTIONS.map((severity) => <option key={severity} value={severity}>{normalizeLabel(severity)}</option>)}
              </select>
            </label>

            <label className="full">
              Detalle
              <textarea value={manualEvent.detalle} onChange={(event) => setManualEvent((prev) => ({ ...prev, detalle: event.target.value }))} rows={5} />
            </label>

            <button type="submit" disabled={saving}>
              <ShieldAlert size={16} />
              Guardar evento
            </button>
          </form>
        </section>
      ) : null}
    </main>
  );
}
