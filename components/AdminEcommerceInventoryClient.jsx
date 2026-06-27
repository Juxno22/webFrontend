"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  PackageCheck,
  RefreshCw,
  UploadCloud,
  XCircle,
} from "lucide-react";
import AdminModuleNav from "@/components/AdminModuleNav";
import { useAdminAuth } from "@/app/hooks/useAdminAuth";
import {
  getAdminEcommerceInventarioResumen,
  uploadAdminEcommerceInventario,
} from "@/app/lib/adminApi";

function formatNumber(value) {
  const number = Number(value || 0);

  return new Intl.NumberFormat("es-MX").format(number);
}

function formatDate(value) {
  if (!value) return "Sin datos";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function downloadTemplate() {
  const csv = [
    "codigo_andyfers,codigo_importacion,existencia,multiplo_venta,precio",
    "ATT1000,,10,1,250.00",
    ",CODIGO-IMPORTACION-123,5,1,180.00",
  ].join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "plantilla_inventario_ecommerce_andyfers.csv";
  link.click();

  URL.revokeObjectURL(url);
}

export default function AdminEcommerceInventoryClient() {
  const { user, checking } = useAdminAuth();

  const [summary, setSummary] = useState(null);
  const [file, setFile] = useState(null);
  const [dryRun, setDryRun] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const resumen = summary?.resumen || {};
  const importaciones = summary?.importaciones || [];

  const canApply = useMemo(() => {
    return file && !uploading;
  }, [file, uploading]);

  async function loadSummary() {
    try {
      setLoadingSummary(true);
      setError("");

      const response = await getAdminEcommerceInventarioResumen();
      setSummary(response.data);
    } catch (err) {
      setError(err.message || "No se pudo cargar el resumen.");
    } finally {
      setLoadingSummary(false);
    }
  }

  useEffect(() => {
    if (!checking) {
      loadSummary();
    }
  }, [checking]);

  async function handleUpload(event) {
    event.preventDefault();

    if (!file) {
      setError("Selecciona un archivo Excel o CSV.");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setResult(null);

      const response = await uploadAdminEcommerceInventario(file, {
        dryRun,
      });

      setResult(response.data);
      await loadSummary();
    } catch (err) {
      setError(err.message || "No se pudo importar el archivo.");
    } finally {
      setUploading(false);
    }
  }

  if (checking) return null;

  return (
    <section className="admin-page admin-ecommerce-page">
      <div className="container">
        <div className="admin-topbar">
          <div>
            <span className="eyebrow">Ecommerce</span>
            <h1>Inventario y precios web</h1>
            <p>
              Actualiza existencia, precio y múltiplo del almacén ecommerce por
              carga masiva.
            </p>
          </div>

          <button
            className="admin-logout"
            type="button"
            onClick={loadSummary}
            disabled={loadingSummary}
          >
            <RefreshCw size={17} />
            Actualizar
          </button>
        </div>

        <AdminModuleNav />

        <div className="admin-ecommerce-grid">
          <article className="admin-ecommerce-card">
            <div className="admin-ecommerce-card-head">
              <PackageCheck size={24} />
              <div>
                <span>Almacén</span>
                <h2>{summary?.almacen || "ECOMMERCE"}</h2>
              </div>
            </div>

            <div className="admin-ecommerce-kpis">
              <div>
                <span>Vendibles</span>
                <strong>{formatNumber(resumen.vendibles)}</strong>
              </div>

              <div>
                <span>Con inventario</span>
                <strong>{formatNumber(resumen.productos_con_inventario)}</strong>
              </div>

              <div>
                <span>Piezas totales</span>
                <strong>{formatNumber(resumen.piezas_totales)}</strong>
              </div>

              <div>
                <span>Sin existencia</span>
                <strong>{formatNumber(resumen.sin_existencia)}</strong>
              </div>

              <div>
                <span>Sin precio</span>
                <strong>{formatNumber(resumen.sin_precio)}</strong>
              </div>

              <div>
                <span>Última actualización</span>
                <strong className="admin-ecommerce-date">
                  {formatDate(resumen.ultima_actualizacion)}
                </strong>
              </div>
            </div>
          </article>

          <article className="admin-ecommerce-card">
            <div className="admin-ecommerce-card-head">
              <UploadCloud size={24} />
              <div>
                <span>Carga masiva</span>
                <h2>Excel de inventario</h2>
              </div>
            </div>

            <form className="admin-ecommerce-upload" onSubmit={handleUpload}>
              <label className="admin-ecommerce-file">
                <FileSpreadsheet size={24} />
                <span>
                  {file ? file.name : "Seleccionar archivo .xlsx, .xls o .csv"}
                </span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(event) =>
                    setFile(event.target.files?.[0] || null)
                  }
                />
              </label>

              <label className="admin-ecommerce-check">
                <input
                  type="checkbox"
                  checked={dryRun}
                  onChange={(event) => setDryRun(event.target.checked)}
                />
                <span>
                  Solo validar, no aplicar cambios. Recomendado para primera
                  revisión.
                </span>
              </label>

              {error && (
                <div className="admin-ecommerce-alert is-error">
                  <XCircle size={18} />
                  {error}
                </div>
              )}

              <div className="admin-ecommerce-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={downloadTemplate}
                >
                  <Download size={17} />
                  Descargar plantilla
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!canApply}
                >
                  {uploading ? (
                    <>
                      <Loader2 size={17} className="admin-spin" />
                      Procesando...
                    </>
                  ) : dryRun ? (
                    <>
                      <AlertTriangle size={17} />
                      Validar archivo
                    </>
                  ) : (
                    <>
                      <UploadCloud size={17} />
                      Aplicar cambios
                    </>
                  )}
                </button>
              </div>
            </form>
          </article>
        </div>

        {result && (
          <article className="admin-ecommerce-card admin-ecommerce-result">
            <div className="admin-ecommerce-card-head">
              <CheckCircle2 size={24} />
              <div>
                <span>{result.dry_run ? "Validación" : "Importación"}</span>
                <h2>
                  {result.dry_run
                    ? "Resultado de validación"
                    : "Cambios aplicados"}
                </h2>
              </div>
            </div>

            <div className="admin-ecommerce-result-grid">
              <div>
                <span>Filas</span>
                <strong>{formatNumber(result.total_filas)}</strong>
              </div>

              <div>
                <span>Válidas</span>
                <strong>{formatNumber(result.filas_validas)}</strong>
              </div>

              <div>
                <span>Creados</span>
                <strong>{formatNumber(result.creados)}</strong>
              </div>

              <div>
                <span>Actualizados</span>
                <strong>{formatNumber(result.actualizados)}</strong>
              </div>

              <div>
                <span>Sin cambios</span>
                <strong>{formatNumber(result.sin_cambios)}</strong>
              </div>

              <div>
                <span>Errores</span>
                <strong>{formatNumber(result.errores)}</strong>
              </div>
            </div>

            {result.detalles?.length > 0 && (
              <div className="admin-ecommerce-table-wrap">
                <table className="admin-ecommerce-table">
                  <thead>
                    <tr>
                      <th>Fila</th>
                      <th>Código Andyfers</th>
                      <th>Código importación</th>
                      <th>Estado</th>
                      <th>Existencia</th>
                      <th>Precio</th>
                      <th>Mensaje</th>
                    </tr>
                  </thead>

                  <tbody>
                    {result.detalles.map((item, index) => (
                      <tr key={`${item.row_number}-${index}`}>
                        <td>{item.row_number}</td>
                        <td>{item.codigo_andyfers || "—"}</td>
                        <td>{item.codigo_importacion || "—"}</td>
                        <td>
                          <span
                            className={`admin-ecommerce-status status-${String(
                              item.estado || ""
                            ).toLowerCase()}`}
                          >
                            {item.estado}
                          </span>
                        </td>
                        <td>{item.existencia ?? "—"}</td>
                        <td>{item.precio ?? "—"}</td>
                        <td>{item.mensaje || item.matched_by || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {result.detalles_truncados && (
              <p className="admin-ecommerce-note">
                Se muestran solo los primeros 200 detalles.
              </p>
            )}
          </article>
        )}

        <article className="admin-ecommerce-card">
          <div className="admin-ecommerce-card-head">
            <FileSpreadsheet size={24} />
            <div>
              <span>Historial</span>
              <h2>Últimas cargas</h2>
            </div>
          </div>

          <div className="admin-ecommerce-table-wrap">
            <table className="admin-ecommerce-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Archivo</th>
                  <th>Modo</th>
                  <th>Filas</th>
                  <th>Válidas</th>
                  <th>Creados</th>
                  <th>Actualizados</th>
                  <th>Errores</th>
                  <th>Usuario</th>
                </tr>
              </thead>

              <tbody>
                {importaciones.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.created_at)}</td>
                    <td>{item.archivo_nombre || "—"}</td>
                    <td>{Number(item.dry_run) === 1 ? "Validación" : "Aplicado"}</td>
                    <td>{formatNumber(item.total_filas)}</td>
                    <td>{formatNumber(item.filas_validas)}</td>
                    <td>{formatNumber(item.creados)}</td>
                    <td>{formatNumber(item.actualizados)}</td>
                    <td>{formatNumber(item.errores)}</td>
                    <td>{item.usuario_admin_correo || "—"}</td>
                  </tr>
                ))}

                {importaciones.length === 0 && (
                  <tr>
                    <td colSpan={9}>Todavía no hay cargas registradas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
}