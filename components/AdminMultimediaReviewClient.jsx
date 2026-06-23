"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  ListChecks,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
  XCircle,
} from "lucide-react";
import AdminModuleNav from "@/components/AdminModuleNav";
import { getAdminUser } from "@/app/lib/adminApi";
import {
  deleteAdminMultimediaMacheoReporte,
  downloadAdminMultimediaMacheoReporte,
  generateAdminMultimediaMacheoPendientes,
  getAdminMultimediaMacheoReporte,
  getAdminMultimediaMacheoReportes,
  getAdminMultimediaMacheoResumen,
  updateAdminMultimediaMacheoItem,
  uploadAdminMultimediaMacheoReporte,
} from "@/app/lib/adminMultimediaReviewApi";

const ESTADOS = ["", "MATCH_UNICO", "NO_ENCONTRADO", "AMBIGUO", "SUBIDO", "ERROR"];
const REVISIONES = [
  "",
  "PENDIENTE",
  "REVISAR",
  "CREAR_PRODUCTO",
  "SOLICITAR_IMAGEN",
  "SOLICITAR_CRUCE",
  "DESCARTADO",
  "RESUELTO",
  "PENDIENTE_GENERADO",
];
const PREFIXES = ["", "AP", "AF", "AT", "AD", "MGA", "ATT"];

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

function numberValue(value) {
  return Number(value || 0).toLocaleString("es-MX");
}

function getEstadoClass(value) {
  const estado = String(value || "").toUpperCase();

  if (estado === "MATCH_UNICO" || estado === "SUBIDO") return "success";
  if (estado === "NO_ENCONTRADO" || estado === "ERROR") return "danger";
  if (estado === "AMBIGUO") return "warning";

  return "neutral";
}

export default function AdminMultimediaReviewClient() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [resumen, setResumen] = useState({});
  const [reportes, setReportes] = useState([]);
  const [selectedReporteId, setSelectedReporteId] = useState(null);
  const [selectedData, setSelectedData] = useState(null);
  const [filters, setFilters] = useState({ q: "", estado: "", revision_estado: "", folder_prefix: "" });
  const [uploadForm, setUploadForm] = useState({ nombre: "", notas: "" });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedReporte = selectedData?.reporte || null;
  const items = selectedData?.items || [];

  const reportesPorEstado = useMemo(() => {
    return selectedData?.resumen_estados || [];
  }, [selectedData]);

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
    loadBase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!selectedReporteId) return;
    loadReporte(selectedReporteId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReporteId]);

  async function loadBase() {
    try {
      setLoading(true);
      setError("");

      const [resumenResponse, reportesResponse] = await Promise.all([
        getAdminMultimediaMacheoResumen(),
        getAdminMultimediaMacheoReportes({ limit: 50 }),
      ]);

      setResumen(resumenResponse.data || {});
      setReportes(reportesResponse.data || []);

      if (!selectedReporteId && reportesResponse.data?.[0]?.id) {
        setSelectedReporteId(reportesResponse.data[0].id);
      }
    } catch (err) {
      setError(err.message || "No se pudo cargar la revisión multimedia.");
    } finally {
      setLoading(false);
    }
  }

  async function loadReporte(id, customFilters = filters) {
    try {
      setDetailLoading(true);
      setError("");

      const response = await getAdminMultimediaMacheoReporte(id, {
        ...customFilters,
        limit: 300,
      });

      setSelectedData(response.data || null);
    } catch (err) {
      setError(err.message || "No se pudo cargar el detalle del reporte.");
      setSelectedData(null);
    } finally {
      setDetailLoading(false);
    }
  }

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  async function handleSearch(event) {
    event.preventDefault();
    if (selectedReporteId) await loadReporte(selectedReporteId, filters);
  }

  async function handleUpload(event) {
    event.preventDefault();

    if (!file) {
      setError("Selecciona el CSV generado por import_multimedia.py.");
      return;
    }

    try {
      setWorking(true);
      setError("");
      setMessage("");

      const response = await uploadAdminMultimediaMacheoReporte(file, uploadForm);

      setMessage(`Reporte cargado: ${numberValue(response.data?.total_items)} imágenes revisadas.`);
      setFile(null);
      setUploadForm({ nombre: "", notas: "" });
      await loadBase();
      setSelectedReporteId(response.data?.id);
    } catch (err) {
      setError(err.message || "No se pudo cargar el reporte.");
    } finally {
      setWorking(false);
    }
  }

  async function handleGenerateTasks() {
    if (!selectedReporteId) return;

    const confirmed = window.confirm(
      "¿Generar pendientes comerciales desde los NO_ENCONTRADO / AMBIGUO / ERROR de este reporte?"
    );

    if (!confirmed) return;

    try {
      setWorking(true);
      setError("");
      setMessage("");

      const response = await generateAdminMultimediaMacheoPendientes(selectedReporteId);

      setMessage(`Pendientes generados o actualizados: ${numberValue(response.data?.affected_rows)}.`);
      await loadReporte(selectedReporteId);
      await loadBase();
    } catch (err) {
      setError(err.message || "No se pudieron generar pendientes.");
    } finally {
      setWorking(false);
    }
  }

  async function handleUpdateItem(item, revision_estado) {
    try {
      setWorking(true);
      setError("");
      setMessage("");

      await updateAdminMultimediaMacheoItem(item.id, { revision_estado });
      setMessage("Estado actualizado correctamente.");
      await loadReporte(selectedReporteId);
    } catch (err) {
      setError(err.message || "No se pudo actualizar el item.");
    } finally {
      setWorking(false);
    }
  }

  async function handleDeleteReport() {
    if (!selectedReporteId) return;

    const confirmed = window.confirm("¿Eliminar este reporte y todos sus items de revisión?");

    if (!confirmed) return;

    try {
      setWorking(true);
      setError("");
      setMessage("");

      await deleteAdminMultimediaMacheoReporte(selectedReporteId);
      setMessage("Reporte eliminado correctamente.");
      setSelectedReporteId(null);
      setSelectedData(null);
      await loadBase();
    } catch (err) {
      setError(err.message || "No se pudo eliminar el reporte.");
    } finally {
      setWorking(false);
    }
  }

  async function handleDownload() {
    if (!selectedReporteId) return;

    try {
      setError("");
      await downloadAdminMultimediaMacheoReporte(selectedReporteId, filters);
    } catch (err) {
      setError(err.message || "No se pudo exportar el reporte.");
    }
  }

  return (
    <section className="admin-page admin-multimedia-review-page">
      <div className="container">
        <div className="admin-topbar">
          <div>
            <span className="eyebrow">Multimedia / Cloudinary</span>
            <h1>Revisión de macheo multimedia</h1>
            <p>
              Sube el CSV generado por el importador, revisa MATCH_UNICO,
              NO_ENCONTRADO y AMBIGUO, y genera pendientes comerciales.
            </p>
          </div>

          <button className="admin-logout" type="button" onClick={loadBase} disabled={loading}>
            <RefreshCw size={17} />
            Recargar
          </button>
        </div>

        <AdminModuleNav />

        {error && <div className="alert-error admin-feedback">{error}</div>}
        {message && <div className="alert-success admin-feedback">{message}</div>}

        <div className="admin-kpi-grid multimedia-review-kpis">
          <div className="admin-kpi-card">
            <div><span>Reportes</span><strong>{numberValue(resumen.total_reportes)}</strong></div>
            <FileSpreadsheet size={24} />
          </div>
          <div className="admin-kpi-card success">
            <div><span>Match único</span><strong>{numberValue(resumen.total_match_unico)}</strong></div>
            <CheckCircle2 size={24} />
          </div>
          <div className="admin-kpi-card accent">
            <div><span>No encontrados</span><strong>{numberValue(resumen.total_no_encontrado)}</strong></div>
            <XCircle size={24} />
          </div>
          <div className="admin-kpi-card danger">
            <div><span>Requieren revisión</span><strong>{numberValue(resumen.requieren_revision)}</strong></div>
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="multimedia-review-layout">
          <aside className="admin-panel multimedia-review-side">
            <div className="admin-panel-title-row">
              <div>
                <span className="eyebrow">Carga</span>
                <h2>Nuevo reporte CSV</h2>
              </div>
            </div>

            <form className="multimedia-upload-form" onSubmit={handleUpload}>
              <label className="admin-field">
                Nombre del reporte
                <input
                  value={uploadForm.nombre}
                  onChange={(event) => setUploadForm((current) => ({ ...current, nombre: event.target.value }))}
                  placeholder="Ej. Ventas AP/AF junio"
                />
              </label>

              <label className="admin-field">
                Notas
                <textarea
                  rows={3}
                  value={uploadForm.notas}
                  onChange={(event) => setUploadForm((current) => ({ ...current, notas: event.target.value }))}
                  placeholder="Contexto del reporte o carpeta procesada"
                />
              </label>

              <label className="multimedia-upload-drop">
                <UploadCloud size={28} />
                <strong>{file ? file.name : "Seleccionar CSV"}</strong>
                <span>Reporte generado por import_multimedia.py</span>
                <input
                  type="file"
                  accept=".csv,.tsv,text/csv,text/tab-separated-values"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                />
              </label>

              <button className="btn-primary full" type="submit" disabled={working}>
                {working ? <Loader2 size={17} className="spin-icon" /> : <UploadCloud size={17} />}
                Cargar reporte
              </button>
            </form>

            <div className="multimedia-report-list">
              <div className="admin-panel-title-row compact">
                <div>
                  <span className="eyebrow">Historial</span>
                  <h2>Reportes</h2>
                </div>
              </div>

              {loading ? (
                <div className="admin-empty">Cargando reportes...</div>
              ) : reportes.length ? (
                reportes.map((reporte) => (
                  <button
                    type="button"
                    className={`multimedia-report-card ${selectedReporteId === reporte.id ? "active" : ""}`}
                    key={reporte.id}
                    onClick={() => setSelectedReporteId(reporte.id)}
                  >
                    <strong>{reporte.nombre}</strong>
                    <span>{reporte.archivo_nombre || "Sin archivo"}</span>
                    <small>
                      {numberValue(reporte.total_match_unico)} match · {numberValue(reporte.total_no_encontrado)} no encontrados · {formatDate(reporte.created_at)}
                    </small>
                  </button>
                ))
              ) : (
                <div className="admin-empty">No hay reportes cargados.</div>
              )}
            </div>
          </aside>

          <main className="admin-panel multimedia-review-detail">
            <div className="admin-panel-title-row">
              <div>
                <span className="eyebrow">Detalle</span>
                <h2>{selectedReporte?.nombre || "Selecciona un reporte"}</h2>
                {selectedReporte && <p>{selectedReporte.archivo_nombre} · {formatDate(selectedReporte.created_at)}</p>}
              </div>

              {selectedReporte && (
                <div className="multimedia-detail-actions">
                  <button className="admin-small-action" type="button" onClick={handleDownload}>
                    <Download size={16} />
                    Exportar
                  </button>
                  <button className="admin-small-action" type="button" onClick={handleGenerateTasks} disabled={working}>
                    <ListChecks size={16} />
                    Generar pendientes
                  </button>
                  <button className="admin-small-action danger" type="button" onClick={handleDeleteReport} disabled={working}>
                    <Trash2 size={16} />
                    Eliminar
                  </button>
                </div>
              )}
            </div>

            {selectedReporte && (
              <>
                <div className="multimedia-state-chips">
                  {reportesPorEstado.map((row) => (
                    <span className={getEstadoClass(row.estado)} key={row.estado}>
                      {row.estado}: {numberValue(row.total)}
                    </span>
                  ))}
                </div>

                <form className="multimedia-filter-bar" onSubmit={handleSearch}>
                  <div className="admin-search">
                    <Search size={17} />
                    <input
                      value={filters.q}
                      onChange={(event) => updateFilter("q", event.target.value)}
                      placeholder="Buscar archivo, código, descripción..."
                    />
                  </div>

                  <select value={filters.estado} onChange={(event) => updateFilter("estado", event.target.value)}>
                    {ESTADOS.map((estado) => <option value={estado} key={estado}>{estado || "Todos los estados"}</option>)}
                  </select>

                  <select value={filters.revision_estado} onChange={(event) => updateFilter("revision_estado", event.target.value)}>
                    {REVISIONES.map((estado) => <option value={estado} key={estado}>{estado || "Todas las revisiones"}</option>)}
                  </select>

                  <select value={filters.folder_prefix} onChange={(event) => updateFilter("folder_prefix", event.target.value)}>
                    {PREFIXES.map((prefix) => <option value={prefix} key={prefix}>{prefix || "Todos los prefijos"}</option>)}
                  </select>

                  <button className="admin-clean-button" type="submit">Filtrar</button>
                </form>
              </>
            )}

            {detailLoading ? (
              <div className="admin-empty">Cargando detalle...</div>
            ) : selectedReporte ? (
              <div className="multimedia-items-table-wrap">
                <table className="admin-table multimedia-items-table">
                  <thead>
                    <tr>
                      <th>Archivo</th>
                      <th>Estado</th>
                      <th>Código</th>
                      <th>Producto</th>
                      <th>Mensaje</th>
                      <th>Revisión</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.archivo}</strong>
                          <span>{item.folder_prefix || "-"} · orden {item.orden || 1} · {item.rol || "-"}</span>
                        </td>
                        <td><span className={`status-pill ${getEstadoClass(item.estado)}`}>{item.estado}</span></td>
                        <td>
                          <strong>{item.codigo_archivo || "-"}</strong>
                          <span>{item.codigo_archivo_original || item.codigo_catalogo || ""}</span>
                        </td>
                        <td>
                          <strong>{item.codigo_andyfers || item.codigo_importacion || "Sin producto"}</strong>
                          <span>{item.familia || "-"}</span>
                          <small>{item.descripcion || ""}</small>
                        </td>
                        <td>
                          <span>{item.mensaje || item.candidatos || "-"}</span>
                        </td>
                        <td>
                          <select
                            value={item.revision_estado || "PENDIENTE"}
                            onChange={(event) => handleUpdateItem(item, event.target.value)}
                            disabled={working}
                          >
                            {REVISIONES.filter(Boolean).map((estado) => (
                              <option value={estado} key={estado}>{estado}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {!items.length && <div className="admin-empty">No hay items con estos filtros.</div>}
              </div>
            ) : (
              <div className="admin-empty">Carga o selecciona un reporte de macheo multimedia.</div>
            )}
          </main>
        </div>
      </div>
    </section>
  );
}
