"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  ShoppingCart,
  UploadCloud,
  XCircle,
} from "lucide-react";
import {
  getAdminEcommerceInventarioResumen,
  uploadAdminEcommerceInventario,
} from "@/app/lib/adminApi";

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

function downloadTemplate() {
  const csv = [
    "codigo_andyfers,codigo_importacion,descripcion,existencia,precio_interno,precio_web,multiplo_venta,mostrar_precio,disponible_web",
    "AT1067,,TENSOR,25,380.00,459.00,1,1,1",
    "AT1068,,TENSOR,18,410.00,499.00,1,1,1",
    ",CODIGO-IMPORTACION-123,PRODUCTO EJEMPLO,5,180.00,229.00,1,1,1",
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

function getResultTotals(result) {
  const resumen = result?.resumen || result?.summary || result || {};

  return {
    total: resumen.total || resumen.total_filas || result?.total || 0,
    validos: resumen.validos || resumen.procesados || result?.validos || 0,
    actualizados: resumen.actualizados || result?.actualizados || 0,
    creados: resumen.creados || result?.creados || 0,
    sinCambios: resumen.sin_cambios || result?.sin_cambios || 0,
    errores: resumen.errores || result?.errores || 0,
  };
}

export default function AdminEcommerceInventoryClient() {
  const fileInputRef = useRef(null);

  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const resultTotals = useMemo(() => getResultTotals(result), [result]);

  async function loadResumen() {
    try {
      setLoading(true);
      setError("");

      const response = await getAdminEcommerceInventarioResumen();

      setResumen(response.data);
    } catch (err) {
      setError(err.message || "No se pudo cargar el resumen ecommerce.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResumen();
  }, []);

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

      if (!dryRun) {
        await loadResumen();
      }
    } catch (err) {
      setError(err.message || "No se pudo procesar el archivo.");
    } finally {
      setUploading(false);
    }
  }

  function clearSelectedFile() {
    setFile(null);
    setResult(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <section className="admin-workspace admin-ecommerce-os">
      <div className="admin-page-hero">
        <div>
          <span>Inventario web</span>
          <h1>Ecommerce</h1>
          <p>
            Controla existencias, precio interno, precio web y disponibilidad de
            productos vendibles en la tienda. El precio web es el que se cobra en
            carrito y Mercado Pago.
          </p>
        </div>

        <div className="admin-page-hero-actions">
          <button type="button" className="admin-secondary-button" onClick={downloadTemplate}>
            <Download size={18} />
            Plantilla Excel
          </button>

          <Link href="/admin/ventas" className="admin-primary-button">
            <ShoppingCart size={18} />
            Ventas ecommerce
          </Link>

          <button
            type="button"
            className="admin-refresh-button"
            onClick={loadResumen}
            disabled={loading}
          >
            {loading ? <Loader2 size={18} className="admin-spin" /> : <RefreshCw size={18} />}
            Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-alert">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      <section className="admin-kpi-grid admin-ecommerce-kpi-grid">
        <article className="admin-kpi-card">
          <Boxes size={22} />
          <span>Productos ecommerce</span>
          <strong>{formatNumber(resumen?.productos_con_inventario)}</strong>
          <small>Con registro en almacén web</small>
        </article>

        <article className="admin-kpi-card">
          <CheckCircle2 size={22} />
          <span>Vendibles web</span>
          <strong>{formatNumber(resumen?.vendibles)}</strong>
          <small>Stock y precio web válidos</small>
        </article>

        <article className="admin-kpi-card">
          <AlertTriangle size={22} />
          <span>Sin existencia</span>
          <strong>{formatNumber(resumen?.sin_existencia)}</strong>
          <small>No se pueden vender</small>
        </article>

        <article className="admin-kpi-card">
          <XCircle size={22} />
          <span>Sin precio web</span>
          <strong>{formatNumber(resumen?.sin_precio_web ?? resumen?.sin_precio)}</strong>
          <small>Bloquean venta web</small>
        </article>

        <article className="admin-kpi-card">
          <FileSpreadsheet size={22} />
          <span>Sin precio interno</span>
          <strong>{formatNumber(resumen?.sin_precio_interno)}</strong>
          <small>Revisar precio mostrador</small>
        </article>

        <article className="admin-kpi-card">
          <ShoppingCart size={22} />
          <span>Piezas totales</span>
          <strong>{formatNumber(resumen?.piezas_totales)}</strong>
          <small>Stock asignado a ecommerce</small>
        </article>
      </section>

      <div className="admin-ecommerce-layout-os">
        <main className="admin-ecommerce-main-os">
          <article className="admin-panel">
            <div className="admin-panel-head">
              <div>
                <span>Carga masiva</span>
                <h2>Actualizar inventario desde Excel</h2>
                <p>
                  Primero ejecuta una simulación. Si todo se ve correcto, cambia
                  a aplicar cambios y vuelve a subir el mismo archivo.
                </p>
              </div>
            </div>

            <form className="admin-ecommerce-upload-os" onSubmit={handleUpload}>
              <div className="admin-ecommerce-drop-os">
                <UploadCloud size={36} />

                <div>
                  <strong>
                    {file ? file.name : "Selecciona archivo Excel o CSV"}
                  </strong>

                  <span>
                    Compatible con .xlsx, .xls o .csv usando las columnas
                    oficiales.
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(event) => {
                    setFile(event.target.files?.[0] || null);
                    setResult(null);
                  }}
                />
              </div>

              {file && (
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={clearSelectedFile}
                >
                  Limpiar archivo
                </button>
              )}

              <label className="admin-ecommerce-mode-os">
                <input
                  type="checkbox"
                  checked={dryRun}
                  onChange={(event) => setDryRun(event.target.checked)}
                />

                <div>
                  <strong>Modo simulación</strong>
                  <span>
                    {dryRun
                      ? "No modifica la base. Solo valida el archivo."
                      : "Aplicará cambios reales al inventario ecommerce."}
                  </span>
                </div>
              </label>

              <button
                type="submit"
                className={dryRun ? "admin-secondary-button" : "admin-primary-button"}
                disabled={uploading || !file}
              >
                {uploading ? <Loader2 size={18} className="admin-spin" /> : <FileSpreadsheet size={18} />}
                {dryRun ? "Simular carga" : "Aplicar cambios"}
              </button>
            </form>
          </article>

          {result && (
            <article className="admin-panel">
              <div className="admin-panel-head">
                <div>
                  <span>{dryRun ? "Resultado simulación" : "Resultado importación"}</span>
                  <h2>Resumen del archivo</h2>
                  <p>
                    Revisa errores y cambios detectados antes de aplicar en real.
                  </p>
                </div>
              </div>

              <div className="admin-ecommerce-result-kpis-os">
                <div>
                  <span>Total filas</span>
                  <strong>{formatNumber(resultTotals.total)}</strong>
                </div>

                <div>
                  <span>Válidos</span>
                  <strong>{formatNumber(resultTotals.validos)}</strong>
                </div>

                <div>
                  <span>Actualizados</span>
                  <strong>{formatNumber(resultTotals.actualizados)}</strong>
                </div>

                <div>
                  <span>Creados</span>
                  <strong>{formatNumber(resultTotals.creados)}</strong>
                </div>

                <div>
                  <span>Sin cambios</span>
                  <strong>{formatNumber(resultTotals.sinCambios)}</strong>
                </div>

                <div>
                  <span>Errores</span>
                  <strong>{formatNumber(resultTotals.errores)}</strong>
                </div>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table admin-ecommerce-result-table-os">
                  <thead>
                    <tr>
                      <th>Fila</th>
                      <th>Código</th>
                      <th>Existencia</th>
                      <th>Precio interno</th>
                      <th>Precio web</th>
                      <th>Resultado</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(result.detalle || result.resultados || result.items || []).slice(0, 80).map((item, index) => (
                      <tr key={`${item.row_number || index}-${item.codigo_andyfers || item.codigo_importacion || index}`}>
                        <td>{item.row_number || index + 1}</td>

                        <td>
                          <strong>
                            {item.codigo_andyfers || item.codigo_importacion || "—"}
                          </strong>
                        </td>

                        <td>{item.existencia ?? "—"}</td>
                        <td>{item.precio_interno ?? "—"}</td>
                        <td>{item.precio_web ?? "—"}</td>

                        <td>
                          <span
                            className={`admin-status-pill ${
                              item.ok === false || item.estado === "ERROR"
                                ? "status-CANCELADA"
                                : "status-ENTREGADA"
                            }`}
                          >
                            {item.mensaje ||
                              item.error ||
                              item.estado ||
                              item.matched_by ||
                              "Procesado"}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {!(result.detalle || result.resultados || result.items || []).length && (
                      <tr>
                        <td colSpan={6}>Sin detalle de filas.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>
          )}
        </main>

        <aside className="admin-ecommerce-side-os">
          <article className="admin-panel admin-ecommerce-rules-os">
            <div className="admin-panel-head">
              <div>
                <span>Formato oficial</span>
                <h2>Columnas del Excel</h2>
                <p>Estas son las columnas compatibles con la carga masiva.</p>
              </div>
            </div>

            <div className="admin-ecommerce-columns-os">
              <strong>Obligatorias</strong>
              <code>codigo_andyfers</code>
              <code>existencia</code>
              <code>precio_interno</code>
              <code>precio_web</code>

              <strong>Recomendadas</strong>
              <code>codigo_importacion</code>
              <code>descripcion</code>
              <code>multiplo_venta</code>
              <code>mostrar_precio</code>
              <code>disponible_web</code>
            </div>
          </article>

          <article className="admin-panel admin-ecommerce-rules-os">
            <div className="admin-panel-head">
              <div>
                <span>Reglas ecommerce</span>
                <h2>Cómo se interpretan los precios</h2>
              </div>
            </div>

            <div className="admin-ecommerce-rules-list-os">
              <div>
                <strong>Precio interno</strong>
                <p>
                  Precio de mostrador o precio base interno. Se guarda en{" "}
                  <code>inventario.precio</code>.
                </p>
              </div>

              <div>
                <strong>Precio web</strong>
                <p>
                  Precio final que se cobra en carrito y Mercado Pago. Se guarda
                  en <code>inventario.precio_publico</code>.
                </p>
              </div>

              <div>
                <strong>Vendible web</strong>
                <p>
                  Un producto se puede vender si tiene existencia mayor a cero,
                  precio web mayor a cero y disponible_web activo.
                </p>
              </div>

              <div>
                <strong>Envío integrado</strong>
                <p>
                  El precio web puede incluir el costo de envío para manejarlo
                  comercialmente como envío gratuito.
                </p>
              </div>
            </div>
          </article>

          <article className="admin-panel admin-ecommerce-last-os">
            <div className="admin-panel-head">
              <div>
                <span>Última actualización</span>
                <h2>{formatDate(resumen?.ultima_actualizacion)}</h2>
                <p>
                  Fecha más reciente detectada en inventario ecommerce.
                </p>
              </div>
            </div>

            <Link href="/admin/operacion" className="admin-secondary-button">
              Ver operación diaria
              <ArrowRight size={16} />
            </Link>
          </article>
        </aside>
      </div>
    </section>
  );
}