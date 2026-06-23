"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Download,
  Eye,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";
import AdminModuleNav from "@/components/AdminModuleNav";
import AdminExportMenu from "@/components/AdminExportMenu";
import { getAdminUser } from "@/app/lib/adminApi";
import {
  createAdminCommercialTask,
  deleteAdminCommercialTask,
  getAdminCommercialTasks,
  getAdminCommercialTasksOpciones,
  getAdminCommercialTasksResumen,
  applyAdminCommercialTaskAction,
  getAdminCommercialTaskProductContext,
  syncAdminCommercialAnalyticsTasks,
  syncAdminCommercialQualityTasks,
  updateAdminCommercialTask,
} from "@/app/lib/adminCommercialTasksApi";

const DEFAULT_FILTERS = {
  q: "",
  estado: "",
  prioridad: "",
  tipo_pendiente: "",
  categoria: "",
  familia: "",
  origen: "",
  abiertos: "1",
  limit: "100",
};

const EMPTY_FORM = {
  tipo_pendiente: "MANUAL",
  origen: "MANUAL",
  referencia_tipo: "MANUAL",
  referencia_key: "",
  producto_id: "",
  codigo_andyfers: "",
  codigo_importacion: "",
  categoria_nombre: "",
  familia: "",
  armadora: "",
  titulo: "",
  descripcion: "",
  accion_sugerida: "",
  prioridad: "MEDIA",
  estado: "NUEVO",
  responsable: "",
  nota: "",
  fecha_limite: "",
};

const ESTADOS = [
  "NUEVO",
  "EN_REVISION",
  "SOLICITAR_IMAGEN",
  "SOLICITAR_CRUCE",
  "COMPLETADO",
  "DESCARTADO",
];

const PRIORIDADES = ["CRITICA", "ALTA", "MEDIA", "BAJA"];

function formatNumber(value) {
  return new Intl.NumberFormat("es-MX").format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "Sin fecha";

  try {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "Sin fecha";
  }
}

function normalizeLabel(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w|\s\w/g, (letter) => letter.toUpperCase());
}

function prioridadClass(value) {
  const clean = String(value || "MEDIA").toLowerCase();

  return `priority-${clean}`;
}

function estadoClass(value) {
  const clean = String(value || "NUEVO").toLowerCase();

  return `status-${clean}`;
}

function buildCsv(rows = []) {
  const headers = [
    "id",
    "estado",
    "prioridad",
    "tipo_pendiente",
    "codigo_andyfers",
    "codigo_importacion",
    "categoria_nombre",
    "familia",
    "armadora",
    "titulo",
    "accion_sugerida",
    "responsable",
    "score",
    "updated_at",
  ];

  const lines = [headers.join(",")];

  rows.forEach((row) => {
    lines.push(
      headers
        .map((header) => {
          const value = row?.[header] ?? "";
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(",")
    );
  });

  return lines.join("\n");
}

function downloadCsv(rows = []) {
  if (typeof window === "undefined") return;

  const csv = buildCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `pendientes_comerciales_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function AdminCommercialTasksClient() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncingAnalytics, setSyncingAnalytics] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [summary, setSummary] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [options, setOptions] = useState({ familias: [], categorias: [], tipos: [], origenes: [] });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [productContext, setProductContext] = useState(null);
  const [actionLoading, setActionLoading] = useState("");

  const kpis = summary?.kpis || {};

  const selectedOpen = useMemo(() => {
    if (!selected) return false;

    return !["COMPLETADO", "DESCARTADO"].includes(selected.estado);
  }, [selected]);

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

    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!selected?.id) {
      setProductContext(null);
      return;
    }

    loadProductContext(selected.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  async function loadAll(customFilters = filters) {
    try {
      setLoading(true);
      setError("");

      const [summaryResponse, tasksResponse, optionsResponse] = await Promise.all([
        getAdminCommercialTasksResumen(),
        getAdminCommercialTasks(customFilters),
        getAdminCommercialTasksOpciones(),
      ]);

      setSummary(summaryResponse.data || null);
      setTasks(tasksResponse.data || []);
      setOptions(optionsResponse.data || { familias: [], categorias: [], tipos: [], origenes: [] });

      if (selected) {
        const updatedSelected = (tasksResponse.data || []).find((item) => item.id === selected.id);
        setSelected(updatedSelected || null);
        if (updatedSelected) setForm(taskToForm(updatedSelected));
      }
    } catch (err) {
      setError(err.message || "No se pudo cargar la cola de pendientes.");
    } finally {
      setLoading(false);
    }
  }

  function taskToForm(task) {
    return {
      ...EMPTY_FORM,
      ...task,
      producto_id: task?.producto_id || "",
      fecha_limite: task?.fecha_limite ? String(task.fecha_limite).slice(0, 10) : "",
    };
  }

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function updateForm(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function startCreate() {
    setSelected(null);
    setProductContext(null);
    setForm(EMPTY_FORM);
    setMessage("");
    setError("");
  }

  function startEdit(task) {
    setSelected(task);
    setForm(taskToForm(task));
    setMessage("");
    setError("");
  }

  async function submitFilters(event) {
    event.preventDefault();
    await loadAll(filters);
  }

  async function handleSyncQuality() {
    const confirmed = window.confirm(
      "¿Generar/sincronizar pendientes desde calidad del catálogo? No duplica pendientes existentes."
    );

    if (!confirmed) return;

    try {
      setSyncing(true);
      setError("");
      setMessage("");

      const response = await syncAdminCommercialQualityTasks({ limit: 2000 });

      setMessage(
        `Pendientes sincronizados. Filas afectadas: ${formatNumber(response?.data?.affected_rows || 0)}.`
      );

      await loadAll(filters);
    } catch (err) {
      setError(err.message || "No se pudieron sincronizar pendientes.");
    } finally {
      setSyncing(false);
    }
  }

  async function handleSyncAnalytics() {
    const confirmed = window.confirm(
      "¿Generar/sincronizar pendientes desde analítica comercial? No duplica pendientes existentes."
    );

    if (!confirmed) return;

    try {
      setSyncingAnalytics(true);
      setError("");
      setMessage("");

      const response = await syncAdminCommercialAnalyticsTasks({
        days: 90,
        min_eventos: 2,
        limit: 2000,
      });

      setMessage(
        `Pendientes desde analítica sincronizados. Filas afectadas: ${formatNumber(response?.data?.affected_rows || 0)}.`
      );

      const nextFilters = { ...filters, origen: "ANALYTICS" };
      setFilters(nextFilters);
      await loadAll(nextFilters);
    } catch (err) {
      setError(err.message || "No se pudieron sincronizar oportunidades desde analítica.");
    } finally {
      setSyncingAnalytics(false);
    }
  }

  async function saveTask(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = {
        ...form,
        producto_id: form.producto_id || null,
      };

      if (selected?.id) {
        await updateAdminCommercialTask(selected.id, payload);
        setMessage("Pendiente actualizado correctamente.");
      } else {
        await createAdminCommercialTask(payload);
        setMessage("Pendiente creado correctamente.");
        setForm(EMPTY_FORM);
      }

      await loadAll(filters);
    } catch (err) {
      setError(err.message || "No se pudo guardar el pendiente.");
    } finally {
      setSaving(false);
    }
  }

  async function quickUpdate(task, patch) {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      await updateAdminCommercialTask(task.id, patch);
      setMessage("Pendiente actualizado correctamente.");
      await loadAll(filters);
    } catch (err) {
      setError(err.message || "No se pudo actualizar el pendiente.");
    } finally {
      setSaving(false);
    }
  }

  async function discardTask(task) {
    const confirmed = window.confirm("¿Descartar este pendiente comercial?");

    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await deleteAdminCommercialTask(task.id);
      setMessage("Pendiente descartado correctamente.");
      await loadAll(filters);
    } catch (err) {
      setError(err.message || "No se pudo descartar el pendiente.");
    } finally {
      setSaving(false);
    }
  }

  async function loadProductContext(taskId) {
    try {
      const response = await getAdminCommercialTaskProductContext(taskId);
      setProductContext(response.data || null);
    } catch {
      setProductContext(null);
    }
  }

  async function applyOperationalAction(action, confirmMessage, extraNote = "") {
    if (!selected?.id) return;

    if (confirmMessage && !window.confirm(confirmMessage)) return;

    try {
      setActionLoading(action);
      setSaving(true);
      setError("");
      setMessage("");

      const response = await applyAdminCommercialTaskAction(selected.id, {
        accion: action,
        nota: extraNote,
      });

      setMessage(response.message || "Acción aplicada correctamente.");
      await loadAll(filters);

      if (response?.data?.pendiente) {
        setSelected(response.data.pendiente);
        setForm(taskToForm(response.data.pendiente));
      }

      setProductContext(response?.data || null);
    } catch (err) {
      setError(err.message || "No se pudo aplicar la acción operativa.");
    } finally {
      setSaving(false);
      setActionLoading("");
    }
  }

  function renderProductContext() {
    if (!selected?.producto_id) {
      return (
        <div className="admin-commercial-product-context muted">
          Este pendiente no está vinculado a un producto del catálogo.
        </div>
      );
    }

    const producto = productContext?.producto;

    if (!producto) {
      return (
        <div className="admin-commercial-product-context muted">
          Sin contexto de producto disponible.
        </div>
      );
    }

    return (
      <div className="admin-commercial-product-context">
        <div>
          <span>Producto</span>
          <strong>{producto.codigo_andyfers || producto.codigo_importacion || `ID ${producto.id}`}</strong>
        </div>
        <div>
          <span>Imagenes</span>
          <strong>{formatNumber(producto.total_imagenes)}</strong>
        </div>
        <div>
          <span>Cruces</span>
          <strong>{formatNumber(producto.total_cruces)}</strong>
        </div>
        <div>
          <span>Aplicaciones</span>
          <strong>{formatNumber(producto.total_aplicaciones)}</strong>
        </div>
        <div>
          <span>Visible</span>
          <strong>{Number(producto.visible_catalogo) === 1 ? "Sí" : "No"}</strong>
        </div>
        <div>
          <span>Activo web</span>
          <strong>{Number(producto.activo_web) === 1 ? "Sí" : "No"}</strong>
        </div>
      </div>
    );
  }

  function operationalDisabled(action) {
    return saving || Boolean(actionLoading) || (action !== "COMPLETAR_PENDIENTE" && action !== "DESCARTAR_PENDIENTE" && !selectedOpen);
  }

  return (
    <section className="admin-page admin-commercial-tasks-page">
      <div className="container">
        <div className="admin-topbar">
          <div>
            <span className="eyebrow">Centro de calidad comercial</span>
            <h1>Pendientes comerciales</h1>
            <p>
              Cola operativa para pedir imágenes, cruces, aplicaciones, stock,
              descripción y seguimiento de calidad del catálogo.
            </p>
          </div>

          <div className="admin-commercial-actions">
            <button
              className="admin-clean-button"
              type="button"
              onClick={() => downloadCsv(tasks)}
              disabled={!tasks.length}
            >
              <Download size={17} />
              CSV
            </button>

            <AdminExportMenu
              context="commercialTasks"
              filters={filters}
              onError={setError}
            />

            <button
              className="admin-clean-button"
              type="button"
              onClick={() => loadAll(filters)}
              disabled={loading}
            >
              <RefreshCw size={17} />
              Recargar
            </button>

            <button
              className="admin-clean-button"
              type="button"
              onClick={handleSyncAnalytics}
              disabled={syncingAnalytics}
            >
              {syncingAnalytics ? <Loader2 size={17} className="spin-icon" /> : <BarChart3 size={17} />}
              Generar desde analítica
            </button>

            <button
              className="admin-primary-link"
              type="button"
              onClick={handleSyncQuality}
              disabled={syncing}
            >
              {syncing ? <Loader2 size={17} className="spin-icon" /> : <Sparkles size={17} />}
              Generar desde calidad
            </button>
          </div>
        </div>

        <AdminModuleNav />

        {error && <div className="alert-error admin-feedback">{error}</div>}
        {message && <div className="alert-success admin-feedback">{message}</div>}

        <div className="admin-commercial-kpis">
          <div className="admin-commercial-kpi">
            <span>Abiertos</span>
            <strong>{formatNumber(kpis.abiertos)}</strong>
            <Clock3 size={22} />
          </div>
          <div className="admin-commercial-kpi analytics">
            <span>Desde analítica</span>
            <strong>{formatNumber(kpis.analytics_abiertos)}</strong>
            <BarChart3 size={22} />
          </div>
          <div className="admin-commercial-kpi danger">
            <span>Alta prioridad</span>
            <strong>{formatNumber(kpis.alta_prioridad)}</strong>
            <ShieldAlert size={22} />
          </div>
          <div className="admin-commercial-kpi warning">
            <span>Solicitar imagen</span>
            <strong>{formatNumber(kpis.solicitar_imagen)}</strong>
            <AlertTriangle size={22} />
          </div>
          <div className="admin-commercial-kpi info">
            <span>En revisión</span>
            <strong>{formatNumber(kpis.en_revision)}</strong>
            <Eye size={22} />
          </div>
          <div className="admin-commercial-kpi success">
            <span>Completados</span>
            <strong>{formatNumber(kpis.completados)}</strong>
            <CheckCircle2 size={22} />
          </div>
        </div>

        <form className="admin-commercial-toolbar" onSubmit={submitFilters}>
          <div className="admin-search">
            <Search size={17} />
            <input
              value={filters.q}
              onChange={(event) => updateFilter("q", event.target.value)}
              placeholder="Buscar código, título, familia, nota..."
            />
          </div>

          <select value={filters.estado} onChange={(event) => updateFilter("estado", event.target.value)}>
            <option value="">Todos los estados</option>
            {ESTADOS.map((estado) => <option key={estado} value={estado}>{normalizeLabel(estado)}</option>)}
          </select>

          <select value={filters.prioridad} onChange={(event) => updateFilter("prioridad", event.target.value)}>
            <option value="">Todas las prioridades</option>
            {PRIORIDADES.map((prioridad) => <option key={prioridad} value={prioridad}>{normalizeLabel(prioridad)}</option>)}
          </select>

          <select value={filters.tipo_pendiente} onChange={(event) => updateFilter("tipo_pendiente", event.target.value)}>
            <option value="">Todos los tipos</option>
            {(options.tipos || []).map((tipo) => <option key={tipo} value={tipo}>{normalizeLabel(tipo)}</option>)}
          </select>

          <select value={filters.categoria} onChange={(event) => updateFilter("categoria", event.target.value)}>
            <option value="">Todas las categorías</option>
            {(options.categorias || []).map((categoria) => <option key={categoria} value={categoria}>{categoria}</option>)}
          </select>

          <select value={filters.familia} onChange={(event) => updateFilter("familia", event.target.value)}>
            <option value="">Todas las familias</option>
            {(options.familias || []).map((familia) => <option key={familia} value={familia}>{familia}</option>)}
          </select>

          <select value={filters.origen} onChange={(event) => updateFilter("origen", event.target.value)}>
            <option value="">Todos los orígenes</option>
            {(options.origenes || []).map((origen) => <option key={origen} value={origen}>{normalizeLabel(origen)}</option>)}
            {!((options.origenes || []).includes("ANALYTICS")) && <option value="ANALYTICS">Analytics</option>}
            {!((options.origenes || []).includes("CATALOGO_CALIDAD")) && <option value="CATALOGO_CALIDAD">Catálogo Calidad</option>}
          </select>

          <select value={filters.abiertos} onChange={(event) => updateFilter("abiertos", event.target.value)}>
            <option value="1">Solo abiertos</option>
            <option value="">Todos</option>
          </select>

          <button className="admin-clean-button" type="submit">
            Buscar
          </button>

          <button className="admin-primary-link" type="button" onClick={startCreate}>
            <Plus size={17} />
            Manual
          </button>
        </form>

        <div className="admin-commercial-layout">
          <article className="admin-panel admin-commercial-list-panel">
            <div className="admin-panel-title-row">
              <div>
                <span className="eyebrow">Cola de trabajo</span>
                <h2>{loading ? "Cargando..." : `${formatNumber(tasks.length)} pendientes`}</h2>
              </div>
            </div>

            <div className="admin-commercial-list">
              {!loading && !tasks.length && (
                <div className="admin-empty">No hay pendientes con los filtros actuales.</div>
              )}

              {tasks.map((task) => (
                <button
                  className={`admin-commercial-card ${selected?.id === task.id ? "active" : ""}`}
                  type="button"
                  key={task.id}
                  onClick={() => startEdit(task)}
                >
                  <div className="admin-commercial-card-head">
                    <span className={`admin-commercial-priority ${prioridadClass(task.prioridad)}`}>
                      {normalizeLabel(task.prioridad)}
                    </span>
                    <span className={`admin-commercial-status ${estadoClass(task.estado)}`}>
                      {normalizeLabel(task.estado)}
                    </span>
                  </div>

                  <strong>{task.titulo}</strong>

                  <p>{task.descripcion || "Sin descripción."}</p>

                  <div className="admin-commercial-card-meta">
                    <span>{task.codigo_andyfers || task.codigo_importacion || `ID ${task.producto_id || task.id}`}</span>
                    <span>{task.familia || "Sin familia"}</span>
                    <span>{normalizeLabel(task.origen || "SIN_ORIGEN")}</span>
                    <span>Score {Number(task.score || 0)}</span>
                  </div>

                  <small>Actualizado {formatDate(task.updated_at)}</small>
                </button>
              ))}
            </div>
          </article>

          <article className="admin-panel admin-commercial-detail-panel">
            <div className="admin-panel-title-row">
              <div>
                <span className="eyebrow">Mantenimiento</span>
                <h2>{selected ? "Editar pendiente" : "Nuevo pendiente manual"}</h2>
              </div>

              {selected && (
                <button className="admin-small-action" type="button" onClick={startCreate}>
                  <Plus size={16} />
                  Nuevo
                </button>
              )}
            </div>

            {selected && (
              <>
                <div className="admin-commercial-quick-actions">
                  <button type="button" onClick={() => quickUpdate(selected, { estado: "EN_REVISION" })} disabled={saving || !selectedOpen}>
                    <Eye size={15} />
                    En revisión
                  </button>
                  <button type="button" onClick={() => quickUpdate(selected, { estado: "SOLICITAR_IMAGEN" })} disabled={saving || !selectedOpen}>
                    <AlertTriangle size={15} />
                    Pedir imagen
                  </button>
                  <button type="button" onClick={() => quickUpdate(selected, { estado: "SOLICITAR_CRUCE" })} disabled={saving || !selectedOpen}>
                    <ClipboardCheck size={15} />
                    Pedir cruce
                  </button>
                  <button type="button" className="success" onClick={() => quickUpdate(selected, { estado: "COMPLETADO" })} disabled={saving}>
                    <CheckCircle2 size={15} />
                    Completar
                  </button>
                  <button type="button" className="danger" onClick={() => discardTask(selected)} disabled={saving}>
                    <Trash2 size={15} />
                    Descartar
                  </button>
                </div>

                <div className="admin-commercial-operational-panel">
                  <div className="admin-panel-title-row compact">
                    <div>
                      <span className="eyebrow">Acciones operativas</span>
                      <h3>Aplicar sobre catálogo</h3>
                    </div>
                  </div>

                  {renderProductContext()}

                  <div className="admin-commercial-operational-actions">
                    <button
                      type="button"
                      onClick={() => applyOperationalAction("COPIAR_DESCRIPCION_WEB", "¿Copiar la descripción base a descripción web y completar el pendiente?")}
                      disabled={operationalDisabled("COPIAR_DESCRIPCION_WEB") || !selected.producto_id}
                    >
                      {actionLoading === "COPIAR_DESCRIPCION_WEB" ? <Loader2 size={15} className="spin-icon" /> : <Save size={15} />}
                      Completar descripción web
                    </button>

                    <button
                      type="button"
                      onClick={() => applyOperationalAction("OCULTAR_CATALOGO", "¿Ocultar este producto del catálogo público y completar el pendiente?")}
                      disabled={operationalDisabled("OCULTAR_CATALOGO") || !selected.producto_id}
                    >
                      {actionLoading === "OCULTAR_CATALOGO" ? <Loader2 size={15} className="spin-icon" /> : <XCircle size={15} />}
                      Ocultar catálogo
                    </button>

                    <button
                      type="button"
                      onClick={() => applyOperationalAction("ACTIVAR_CATALOGO", "¿Activar este producto como visible en catálogo público?")}
                      disabled={operationalDisabled("ACTIVAR_CATALOGO") || !selected.producto_id}
                    >
                      {actionLoading === "ACTIVAR_CATALOGO" ? <Loader2 size={15} className="spin-icon" /> : <CheckCircle2 size={15} />}
                      Activar catálogo
                    </button>

                    <button
                      type="button"
                      onClick={() => applyOperationalAction("DESMARCAR_NUEVO", "¿Quitar marca de producto nuevo y completar el pendiente?")}
                      disabled={operationalDisabled("DESMARCAR_NUEVO") || !selected.producto_id}
                    >
                      {actionLoading === "DESMARCAR_NUEVO" ? <Loader2 size={15} className="spin-icon" /> : <Clock3 size={15} />}
                      Quitar nuevo
                    </button>

                    <button
                      type="button"
                      onClick={() => applyOperationalAction("DESMARCAR_DESTACADO", "¿Quitar marca de producto destacado y completar el pendiente?")}
                      disabled={operationalDisabled("DESMARCAR_DESTACADO") || !selected.producto_id}
                    >
                      {actionLoading === "DESMARCAR_DESTACADO" ? <Loader2 size={15} className="spin-icon" /> : <Sparkles size={15} />}
                      Quitar destacado
                    </button>
                  </div>
                </div>
              </>
            )}

            <form className="admin-commercial-form" onSubmit={saveTask}>
              <div className="admin-commercial-fields">
                <label className="admin-field admin-commercial-wide">
                  Título
                  <input value={form.titulo || ""} onChange={(event) => updateForm("titulo", event.target.value)} />
                </label>

                <label className="admin-field">
                  Tipo pendiente
                  <input value={form.tipo_pendiente || ""} onChange={(event) => updateForm("tipo_pendiente", event.target.value)} />
                </label>

                <label className="admin-field">
                  Origen
                  <input value={form.origen || ""} onChange={(event) => updateForm("origen", event.target.value)} />
                </label>

                <label className="admin-field">
                  Estado
                  <select value={form.estado || "NUEVO"} onChange={(event) => updateForm("estado", event.target.value)}>
                    {ESTADOS.map((estado) => <option key={estado} value={estado}>{normalizeLabel(estado)}</option>)}
                  </select>
                </label>

                <label className="admin-field">
                  Prioridad
                  <select value={form.prioridad || "MEDIA"} onChange={(event) => updateForm("prioridad", event.target.value)}>
                    {PRIORIDADES.map((prioridad) => <option key={prioridad} value={prioridad}>{normalizeLabel(prioridad)}</option>)}
                  </select>
                </label>

                <label className="admin-field">
                  Código Andyfers
                  <input value={form.codigo_andyfers || ""} onChange={(event) => updateForm("codigo_andyfers", event.target.value)} />
                </label>

                <label className="admin-field">
                  Código importación
                  <input value={form.codigo_importacion || ""} onChange={(event) => updateForm("codigo_importacion", event.target.value)} />
                </label>

                <label className="admin-field">
                  Familia
                  <input value={form.familia || ""} onChange={(event) => updateForm("familia", event.target.value)} />
                </label>

                <label className="admin-field">
                  Categoría
                  <input value={form.categoria_nombre || ""} onChange={(event) => updateForm("categoria_nombre", event.target.value)} />
                </label>

                <label className="admin-field">
                  Responsable
                  <input value={form.responsable || ""} onChange={(event) => updateForm("responsable", event.target.value)} />
                </label>

                <label className="admin-field">
                  Fecha límite
                  <input type="date" value={form.fecha_limite || ""} onChange={(event) => updateForm("fecha_limite", event.target.value)} />
                </label>

                <label className="admin-field admin-commercial-wide">
                  Descripción
                  <textarea rows={4} value={form.descripcion || ""} onChange={(event) => updateForm("descripcion", event.target.value)} />
                </label>

                <label className="admin-field admin-commercial-wide">
                  Acción sugerida
                  <input value={form.accion_sugerida || ""} onChange={(event) => updateForm("accion_sugerida", event.target.value)} />
                </label>

                <label className="admin-field admin-commercial-wide">
                  Nota interna
                  <textarea rows={4} value={form.nota || ""} onChange={(event) => updateForm("nota", event.target.value)} />
                </label>
              </div>

              <button className="btn-primary full" type="submit" disabled={saving}>
                {saving ? <Loader2 size={17} className="spin-icon" /> : <Save size={17} />}
                {selected ? "Guardar cambios" : "Crear pendiente"}
              </button>
            </form>
          </article>
        </div>
      </div>
    </section>
  );
}
