"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Cloud,
  DatabaseBackup,
  FileCheck2,
  Globe2,
  HardDrive,
  KeyRound,
  Loader2,
  PlayCircle,
  RefreshCw,
  Rocket,
  MessageCircle,
  ShoppingCart,
  Server,
  ShieldAlert,
  Trash2,
  XCircle,
} from "lucide-react";
import {
  cleanAdminProductionBackups,
  createAdminProductionBackup,
  createAdminProductionDeploy,
  getAdminProductionEnv,
  getAdminProductionSummary,
  updateAdminProductionDeployItem,
  updateAdminProductionDeployStatus,
  validateAdminProductionBackup,
  markAdminProductionBackupRestoreTested,
  recalculateAdminProductionChecks,
} from "@/app/lib/adminProductionApi";

function formatDate(value) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function formatBytes(value) {
  const size = Number(value || 0);
  if (!size) return "—";

  const units = ["B", "KB", "MB", "GB"];
  let current = size;
  let index = 0;

  while (current >= 1024 && index < units.length - 1) {
    current /= 1024;
    index += 1;
  }

  return `${current.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function statusLabel(status) {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "OK") return "Correcto";
  if (normalized === "WARNING") return "Advertencia";
  if (normalized === "CRITICAL") return "Crítico";
  if (normalized === "ERROR") return "Error";
  if (normalized === "BORRADOR") return "Borrador";
  if (normalized === "EN_PROCESO") return "En proceso";
  if (normalized === "LISTO") return "Listo";
  if (normalized === "DESPLEGADO") return "Desplegado";
  if (normalized === "BLOQUEADO") return "Bloqueado";
  if (normalized === "CANCELADO") return "Cancelado";
  if (normalized === "PENDIENTE") return "Pendiente";
  if (normalized === "NO_APLICA") return "No aplica";
  return status || "—";
}

function StatusIcon({ status }) {
  const normalized = String(status || "").toUpperCase();

  if (["OK", "LISTO", "DESPLEGADO", "NO_APLICA"].includes(normalized)) return <CheckCircle2 size={18} />;
  if (["WARNING", "EN_PROCESO", "PENDIENTE"].includes(normalized)) return <AlertTriangle size={18} />;
  return <XCircle size={18} />;
}

function DeployProgress({ deploy }) {
  const total = Number(deploy?.total_items || 0);
  const ok = Number(deploy?.items_ok || 0);
  const percent = total ? Math.round((ok / total) * 100) : 0;

  return (
    <div className="admin-deploy-progress">
      <div>
        <strong>{percent}%</strong>
        <span>{ok}/{total} puntos cerrados</span>
      </div>
      <div className="admin-deploy-progress-bar">
        <i style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default function AdminProductionClient() {
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState(null);
  const [checks, setChecks] = useState([]);
  const [backups, setBackups] = useState([]);
  const [env, setEnv] = useState(null);
  const [deploys, setDeploys] = useState([]);
  const [deployReadiness, setDeployReadiness] = useState(null);
  const [selectedDeployId, setSelectedDeployId] = useState("");
  const [backupConfirm, setBackupConfirm] = useState("");
  const [cleanConfirm, setCleanConfirm] = useState("");
  const [keepBackups, setKeepBackups] = useState(15);
  const [restoreBackupId, setRestoreBackupId] = useState("");
  const [restoreConfirm, setRestoreConfirm] = useState("");
  const [restoreNotes, setRestoreNotes] = useState("");
  const [deployForm, setDeployForm] = useState({
    titulo: "",
    version_label: "",
    ambiente: "PRODUCCION",
    resumen: "",
  });

  const productionConfig = env?.production_config || null;
  const backupPolicy = env?.backup_policy || null;

  const groupedChecks = useMemo(() => {
    return checks.reduce((acc, item) => {
      const area = item.area || "SISTEMA";
      if (!acc[area]) acc[area] = [];
      acc[area].push(item);
      return acc;
    }, {});
  }, [checks]);

  const selectedDeploy = useMemo(() => {
    if (!deploys.length) return null;
    return deploys.find((deploy) => String(deploy.id) === String(selectedDeployId)) || deploys[0];
  }, [deploys, selectedDeployId]);

  const groupedDeployItems = useMemo(() => {
    const items = selectedDeploy?.items || [];
    return items.reduce((acc, item) => {
      const group = item.grupo || "GENERAL";
      if (!acc[group]) acc[group] = [];
      acc[group].push(item);
      return acc;
    }, {});
  }, [selectedDeploy]);

  async function loadData({ quiet = false } = {}) {
    try {
      if (!quiet) setLoading(true);
      setError("");
      const [summaryData, envData] = await Promise.all([
        getAdminProductionSummary(),
        getAdminProductionEnv(),
      ]);

      setSummary(summaryData?.resumen || null);
      setChecks(summaryData?.checks || []);
      setBackups(summaryData?.backups || []);
      setEnv(envData?.env || null);
      setDeploys(summaryData?.deploys || []);
      setDeployReadiness(summaryData?.deploy_readiness || null);
      if (!selectedDeployId && summaryData?.deploys?.[0]?.id) {
        setSelectedDeployId(String(summaryData.deploys[0].id));
      }
    } catch (loadError) {
      setError(loadError?.message || "No se pudo cargar producción.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleRecalculate() {
    try {
      setBusyAction("checks");
      setError("");
      setMessage("");
      const result = await recalculateAdminProductionChecks();
      setSummary((current) => ({
        ...(current || {}),
        status: result.status,
        total_checks: result.total_checks,
        ok_checks: result.ok_checks,
        warning_checks: result.warning_checks,
        critical_checks: result.critical_checks,
        generated_at: result.generated_at,
      }));
      setChecks(result.checks || []);
      setMessage("Checklist recalculado y guardado.");
    } catch (actionError) {
      setError(actionError?.message || "No se pudo recalcular el checklist.");
    } finally {
      setBusyAction("");
    }
  }

  async function handleCreateBackup(event) {
    event.preventDefault();

    try {
      setBusyAction("backup");
      setError("");
      setMessage("");
      await createAdminProductionBackup({ confirmacion: backupConfirm });
      setBackupConfirm("");
      setMessage("Respaldo generado correctamente.");
      await loadData({ quiet: true });
    } catch (actionError) {
      setError(actionError?.message || "No se pudo generar el respaldo.");
    } finally {
      setBusyAction("");
    }
  }

  async function handleCleanBackups(event) {
    event.preventDefault();

    try {
      setBusyAction("clean");
      setError("");
      setMessage("");
      await cleanAdminProductionBackups({
        confirmacion: cleanConfirm,
        keep: keepBackups,
      });
      setCleanConfirm("");
      setMessage("Limpieza de respaldos finalizada.");
      await loadData({ quiet: true });
    } catch (actionError) {
      setError(actionError?.message || "No se pudieron limpiar respaldos.");
    } finally {
      setBusyAction("");
    }
  }

  async function handleValidateBackup(backup) {
    if (!backup?.id) return;

    try {
      setBusyAction(`validate-backup-${backup.id}`);
      setError("");
      setMessage("");
      const result = await validateAdminProductionBackup({ id: backup.id });
      const validation = result?.validation;
      setMessage(
        validation?.ok
          ? "Integridad del respaldo validada correctamente."
          : validation?.message || "Validación finalizada con advertencias."
      );
      await loadData({ quiet: true });
    } catch (actionError) {
      setError(actionError?.message || "No se pudo validar el respaldo.");
    } finally {
      setBusyAction("");
    }
  }

  async function handleRestoreTested(event) {
    event.preventDefault();
    if (!restoreBackupId) return;

    try {
      setBusyAction("restore-tested");
      setError("");
      setMessage("");
      await markAdminProductionBackupRestoreTested(restoreBackupId, {
        confirmacion: restoreConfirm,
        notas: restoreNotes,
      });
      setRestoreConfirm("");
      setRestoreNotes("");
      setMessage("Prueba de restauración registrada para el respaldo seleccionado.");
      await loadData({ quiet: true });
    } catch (actionError) {
      setError(actionError?.message || "No se pudo registrar la prueba de restauración.");
    } finally {
      setBusyAction("");
    }
  }

  async function handleCreateDeploy(event) {
    event.preventDefault();

    try {
      setBusyAction("deploy-create");
      setError("");
      setMessage("");
      const result = await createAdminProductionDeploy(deployForm);
      setDeployForm({ titulo: "", version_label: "", ambiente: "PRODUCCION", resumen: "" });
      setMessage("Checklist de despliegue creado.");
      await loadData({ quiet: true });
      if (result?.deploy?.id) setSelectedDeployId(String(result.deploy.id));
    } catch (actionError) {
      setError(actionError?.message || "No se pudo crear el despliegue.");
    } finally {
      setBusyAction("");
    }
  }

  async function handleDeployStatus(status) {
    if (!selectedDeploy?.id) return;

    try {
      setBusyAction(`deploy-status-${status}`);
      setError("");
      setMessage("");
      await updateAdminProductionDeployStatus(selectedDeploy.id, { estado: status });
      setMessage("Estado de despliegue actualizado.");
      await loadData({ quiet: true });
    } catch (actionError) {
      setError(actionError?.message || "No se pudo actualizar el despliegue.");
    } finally {
      setBusyAction("");
    }
  }

  async function handleDeployItem(item, status) {
    if (!selectedDeploy?.id || !item?.id) return;

    try {
      setBusyAction(`deploy-item-${item.id}-${status}`);
      setError("");
      setMessage("");
      await updateAdminProductionDeployItem(selectedDeploy.id, item.id, {
        estado: status,
        notas: item.notas || "",
      });
      await loadData({ quiet: true });
    } catch (actionError) {
      setError(actionError?.message || "No se pudo actualizar el punto del checklist.");
    } finally {
      setBusyAction("");
    }
  }

  return (
    <section className="admin-page admin-production-page">
      <div className="container">
        <div className="admin-page-hero admin-surgical-hero admin-surgical-production">
          <div>
            <span>Producción</span>
            <h1>Producción, respaldos y despliegues</h1>
            <p>
              Valida variables, base de datos, tablas críticas, respaldos y checklist
              operativo antes de publicar cambios o mover la app a producción.
            </p>
          </div>

          <div className="admin-page-hero-actions">
            <div className={`admin-production-status ${summary?.status || "LOADING"}`}>
              <Server size={22} />
              <span>{loading ? "Cargando" : statusLabel(summary?.status)}</span>
            </div>

            <Link href="/admin/ventas" className="admin-primary-button">
              <ShoppingCart size={18} />
              Ventas ecommerce
            </Link>

            <Link href="/admin/chat" className="admin-secondary-button">
              <MessageCircle size={18} />
              Chat clientes
            </Link>

            <button
              className="admin-refresh-button"
              type="button"
              onClick={() => loadData()}
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={17} className="admin-spin" />
              ) : (
                <RefreshCw size={17} />
              )}
              Recargar
            </button>
          </div>
        </div>

        {error ? <div className="admin-alert danger">{error}</div> : null}
        {message ? <div className="admin-alert success">{message}</div> : null}

        <div className="admin-production-actions">
          <button className="admin-secondary-button" onClick={() => loadData()} disabled={loading}>
            {loading ? <Loader2 size={17} className="spin" /> : <RefreshCw size={17} />}
            Recargar
          </button>

          <button className="admin-primary-button" onClick={handleRecalculate} disabled={busyAction === "checks"}>
            {busyAction === "checks" ? <Loader2 size={17} className="spin" /> : <ShieldAlert size={17} />}
            Recalcular checklist
          </button>
        </div>

        <div className="admin-kpi-grid admin-production-kpis">
          <article className="admin-kpi-card accent">
            <span>Status</span>
            <strong>{statusLabel(summary?.status)}</strong>
            <Server size={22} />
          </article>
          <article className="admin-kpi-card success">
            <span>Correctos</span>
            <strong>{summary?.ok_checks ?? 0}</strong>
            <CheckCircle2 size={22} />
          </article>
          <article className="admin-kpi-card warning">
            <span>Advertencias</span>
            <strong>{summary?.warning_checks ?? 0}</strong>
            <AlertTriangle size={22} />
          </article>
          <article className="admin-kpi-card danger">
            <span>Críticos</span>
            <strong>{summary?.critical_checks ?? 0}</strong>
            <XCircle size={22} />
          </article>
        </div>

        <section className="admin-panel admin-production-panel admin-deploy-main-panel">
          <div className="admin-panel-title-row">
            <div>
              <span className="eyebrow">Despliegues</span>
              <h2>Checklist de publicación</h2>
            </div>
            <Rocket size={25} />
          </div>

          <div className={`admin-deploy-readiness ${deployReadiness?.ready ? "ready" : "blocked"}`}>
            <div>
              <strong>{deployReadiness?.ready ? "Listo para preparar despliegue" : "Requiere revisión antes de desplegar"}</strong>
              <span>
                {deployReadiness?.generated_at ? `Diagnóstico: ${formatDate(deployReadiness.generated_at)}` : "Sin diagnóstico reciente"}
              </span>
            </div>
            {deployReadiness?.blockers?.length ? (
              <ul>
                {deployReadiness.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
              </ul>
            ) : null}
          </div>

          <div className="admin-deploy-layout">
            <form className="admin-production-form admin-deploy-form" onSubmit={handleCreateDeploy}>
              <h3>Nuevo checklist</h3>
              <div className="admin-production-form-row">
                <label>
                  Título
                  <input
                    value={deployForm.titulo}
                    onChange={(event) => setDeployForm((current) => ({ ...current, titulo: event.target.value }))}
                    placeholder="Ej. Publicación M12 producción"
                  />
                </label>
                <label>
                  Versión
                  <input
                    value={deployForm.version_label}
                    onChange={(event) => setDeployForm((current) => ({ ...current, version_label: event.target.value }))}
                    placeholder="Ej. 2026.06.23"
                  />
                </label>
              </div>
              <label>
                Resumen
                <textarea
                  value={deployForm.resumen}
                  onChange={(event) => setDeployForm((current) => ({ ...current, resumen: event.target.value }))}
                  placeholder="Cambios que se van a publicar..."
                />
              </label>
              <button className="admin-primary-button" disabled={busyAction === "deploy-create"}>
                {busyAction === "deploy-create" ? <Loader2 size={17} className="spin" /> : <ClipboardCheck size={17} />}
                Crear checklist
              </button>
            </form>

            <div className="admin-deploy-selector-card">
              <h3>Corridas recientes</h3>
              <select value={selectedDeploy?.id || ""} onChange={(event) => setSelectedDeployId(event.target.value)}>
                {deploys.length ? deploys.map((deploy) => (
                  <option key={deploy.id} value={deploy.id}>
                    #{deploy.id} · {deploy.titulo} · {statusLabel(deploy.estado)}
                  </option>
                )) : <option value="">Sin despliegues</option>}
              </select>

              {selectedDeploy ? (
                <div className="admin-deploy-summary-card">
                  <div className="admin-deploy-summary-top">
                    <div>
                      <strong>{selectedDeploy.titulo}</strong>
                      <span>{selectedDeploy.version_label || "Sin versión"} · {selectedDeploy.ambiente}</span>
                    </div>
                    <em className={`admin-production-badge ${selectedDeploy.estado}`}>{statusLabel(selectedDeploy.estado)}</em>
                  </div>
                  <DeployProgress deploy={selectedDeploy} />
                  <div className="admin-deploy-status-actions">
                    <button type="button" onClick={() => handleDeployStatus("EN_PROCESO")} disabled={busyAction.startsWith("deploy-status")}>En proceso</button>
                    <button type="button" onClick={() => handleDeployStatus("LISTO")} disabled={busyAction.startsWith("deploy-status")}>Listo</button>
                    <button type="button" onClick={() => handleDeployStatus("DESPLEGADO")} disabled={busyAction.startsWith("deploy-status")}>Desplegado</button>
                    <button type="button" className="danger" onClick={() => handleDeployStatus("BLOQUEADO")} disabled={busyAction.startsWith("deploy-status")}>Bloquear</button>
                  </div>
                </div>
              ) : (
                <p className="admin-empty-text">Crea un checklist para iniciar control de despliegue.</p>
              )}
            </div>
          </div>

          {selectedDeploy ? (
            <div className="admin-deploy-checklist">
              {Object.entries(groupedDeployItems).map(([group, items]) => (
                <div className="admin-deploy-group" key={group}>
                  <h3>{group.replaceAll("_", " ")}</h3>
                  <div className="admin-deploy-items">
                    {items.map((item) => (
                      <article className={`admin-deploy-item ${item.estado}`} key={item.id}>
                        <div className="admin-deploy-item-icon">
                          <StatusIcon status={item.estado} />
                        </div>
                        <div>
                          <div className="admin-deploy-item-head">
                            <strong>{item.titulo}</strong>
                            <span>{statusLabel(item.estado)}</span>
                          </div>
                          <p>{item.descripcion}</p>
                          <div className="admin-deploy-item-meta">
                            <em>{item.obligatorio ? "Obligatorio" : "Opcional"}</em>
                            {item.checked_by_nombre ? <em>{item.checked_by_nombre}</em> : null}
                            {item.checked_at ? <em>{formatDate(item.checked_at)}</em> : null}
                          </div>
                          <div className="admin-deploy-item-actions">
                            <button type="button" onClick={() => handleDeployItem(item, "OK")}>OK</button>
                            <button type="button" onClick={() => handleDeployItem(item, "PENDIENTE")}>Pendiente</button>
                            <button type="button" onClick={() => handleDeployItem(item, "NO_APLICA")}>N/A</button>
                            <button type="button" className="danger" onClick={() => handleDeployItem(item, "BLOQUEADO")}>Bloquear</button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <div className="admin-production-grid">
          <section className="admin-panel admin-production-panel">
            <div className="admin-panel-title-row">
              <div>
                <span className="eyebrow">Checklist</span>
                <h2>Revisión técnica</h2>
              </div>
              <small>{summary?.generated_at ? `Última revisión: ${formatDate(summary.generated_at)}` : "—"}</small>
            </div>

            {loading ? (
              <div className="admin-loading-card">Cargando checklist...</div>
            ) : (
              <div className="admin-check-groups">
                {Object.entries(groupedChecks).map(([area, items]) => (
                  <div className="admin-check-group" key={area}>
                    <h3>{area.replaceAll("_", " ")}</h3>
                    <div className="admin-check-list">
                      {items.map((item) => (
                        <article className={`admin-check-item ${item.status}`} key={item.key}>
                          <div className="admin-check-icon">
                            <StatusIcon status={item.status} />
                          </div>
                          <div>
                            <div className="admin-check-heading">
                              <strong>{item.label}</strong>
                              <span>{statusLabel(item.status)}</span>
                            </div>
                            <p>{item.message}</p>
                            {item.details?.missing?.length ? (
                              <div className="admin-check-tags">
                                {item.details.missing.map((tag) => (
                                  <em key={tag}>{tag}</em>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside className="admin-panel admin-production-panel">
            <div className="admin-panel-title-row">
              <div>
                <span className="eyebrow">Ambiente</span>
                <h2>Variables detectadas</h2>
              </div>
            </div>

            <div className="admin-env-summary">
              <div>
                <span>NODE_ENV</span>
                <strong>{env?.node_env || "—"}</strong>
              </div>
              <div>
                <span>Base de datos</span>
                <strong>{env?.db_name || "—"}</strong>
              </div>
              <div>
                <span>Puerto DB</span>
                <strong>{env?.db_port || "—"}</strong>
              </div>
              <div>
                <span>Respaldos</span>
                <strong title={env?.backup_dir || ""}>{env?.backup_dir || "—"}</strong>
              </div>
            </div>

            {backupPolicy ? (
              <div className="admin-backup-policy-card">
                <div>
                  <span>Política de respaldos</span>
                  <strong>{backupPolicy.automatic_enabled ? "Automática configurada" : "Modo manual"}</strong>
                </div>
                <ul>
                  <li>Retención: {backupPolicy.keep} respaldo(s)</li>
                  <li>Tamaño mínimo: {formatBytes(backupPolicy.min_bytes)}</li>
                  <li>Programación: {backupPolicy.schedule || "manual"}</li>
                  <li>Restauración: prueba manual documentada</li>
                </ul>
              </div>
            ) : null}

            {productionConfig ? (
              <div className="admin-production-config-panel">
                <article>
                  <Globe2 size={18} />
                  <div>
                    <span>Dominios CORS</span>
                    <strong>{productionConfig.allowed_cors_origins?.length || 0}</strong>
                    <small>
                      {productionConfig.allowed_cors_origins?.length
                        ? productionConfig.allowed_cors_origins.join(", ")
                        : "Sin dominios configurados"}
                    </small>
                  </div>
                </article>

                <article>
                  <KeyRound size={18} />
                  <div>
                    <span>JWT_SECRET</span>
                    <strong>{productionConfig.jwt_secret?.strong ? "Fuerte" : "Revisar"}</strong>
                    <small>{productionConfig.jwt_secret?.length || 0} caracteres detectados</small>
                  </div>
                </article>

                <article>
                  <Cloud size={18} />
                  <div>
                    <span>Cloudinary</span>
                    <strong>{productionConfig.cloudinary?.fully_configured ? "Completo" : "Incompleto"}</strong>
                    <small>Cloud name, API key y API secret</small>
                  </div>
                </article>

                <article>
                  <Server size={18} />
                  <div>
                    <span>Proveedor IA</span>
                    <strong>{productionConfig.ai_provider_count || 0}</strong>
                    <small>Proveedor(es) con API key detectada</small>
                  </div>
                </article>
              </div>
            ) : null}

            {productionConfig?.public_urls ? (
              <div className="admin-production-url-list">
                <h3>URLs públicas</h3>
                {Object.entries(productionConfig.public_urls).map(([key, value]) => (
                  <div key={key}>
                    <span>{key}</span>
                    <strong title={value || ""}>{value || "No configurada"}</strong>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="admin-env-list">
              {[...(env?.required || []), ...(env?.optional || [])].map((item) => (
                <div className="admin-env-item" key={item.key}>
                  <div>
                    <strong>{item.label}</strong>
                    <span>{item.required ? "Requerida" : "Opcional"}</span>
                  </div>
                  <em className={item.configured ? "ok" : item.required ? "missing" : "optional"}>
                    {item.configured ? item.value_masked || "Configurada" : "No configurada"}
                  </em>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <div className="admin-production-grid two-columns">
          <section className="admin-panel admin-production-panel">
            <div className="admin-panel-title-row">
              <div>
                <span className="eyebrow">Respaldos</span>
                <h2>Generar respaldo manual</h2>
              </div>
              <DatabaseBackup size={24} />
            </div>

            <form className="admin-production-form" onSubmit={handleCreateBackup}>
              <p>
                Escribe <strong>RESPALDAR</strong> para crear un archivo SQL con mysqldump.
                Usa esto antes de cambios fuertes en base de datos o despliegues.
              </p>
              <input
                value={backupConfirm}
                onChange={(event) => setBackupConfirm(event.target.value)}
                placeholder="RESPALDAR"
              />
              <button className="admin-primary-button" disabled={busyAction === "backup"}>
                {busyAction === "backup" ? <Loader2 size={17} className="spin" /> : <DatabaseBackup size={17} />}
                Generar respaldo
              </button>
            </form>
          </section>

          <section className="admin-panel admin-production-panel">
            <div className="admin-panel-title-row">
              <div>
                <span className="eyebrow">Mantenimiento</span>
                <h2>Limpiar respaldos antiguos</h2>
              </div>
              <Trash2 size={24} />
            </div>

            <form className="admin-production-form" onSubmit={handleCleanBackups}>
              <p>
                Conserva los respaldos más recientes y elimina archivos SQL viejos del directorio configurado.
              </p>
              <div className="admin-production-form-row">
                <label>
                  Mantener
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={keepBackups}
                    onChange={(event) => setKeepBackups(event.target.value)}
                  />
                </label>
                <label>
                  Confirmar
                  <input
                    value={cleanConfirm}
                    onChange={(event) => setCleanConfirm(event.target.value)}
                    placeholder="LIMPIAR"
                  />
                </label>
              </div>
              <button className="admin-secondary-button danger" disabled={busyAction === "clean"}>
                {busyAction === "clean" ? <Loader2 size={17} className="spin" /> : <Trash2 size={17} />}
                Limpiar respaldos
              </button>
            </form>
          </section>

          <section className="admin-panel admin-production-panel admin-restore-test-panel">
            <div className="admin-panel-title-row">
              <div>
                <span className="eyebrow">Restauración</span>
                <h2>Registrar prueba manual</h2>
              </div>
              <FileCheck2 size={24} />
            </div>

            <form className="admin-production-form" onSubmit={handleRestoreTested}>
              <p>
                Primero restaura el SQL en una base alterna. Después registra la evidencia aquí.
                Este panel no restaura ni modifica producción.
              </p>
              <div className="admin-production-form-row">
                <label>
                  Respaldo
                  <select value={restoreBackupId} onChange={(event) => setRestoreBackupId(event.target.value)}>
                    <option value="">Selecciona un respaldo</option>
                    {backups.map((backup) => (
                      <option key={backup.id} value={backup.id}>
                        #{backup.id} · {backup.filename || "Sin archivo"}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Confirmar
                  <input
                    value={restoreConfirm}
                    onChange={(event) => setRestoreConfirm(event.target.value)}
                    placeholder="RESTAURACION PROBADA"
                  />
                </label>
              </div>
              <label>
                Notas de evidencia
                <textarea
                  value={restoreNotes}
                  onChange={(event) => setRestoreNotes(event.target.value)}
                  placeholder="Ej. Restaurado en andyfers_restore_test, tablas críticas revisadas, conteos OK."
                />
              </label>
              <button className="admin-secondary-button" disabled={busyAction === "restore-tested" || !restoreBackupId}>
                {busyAction === "restore-tested" ? <Loader2 size={17} className="spin" /> : <FileCheck2 size={17} />}
                Registrar prueba
              </button>
            </form>
          </section>
        </div>

        <section className="admin-panel admin-production-panel">
          <div className="admin-panel-title-row">
            <div>
              <span className="eyebrow">Historial</span>
              <h2>Respaldos registrados</h2>
            </div>
            <HardDrive size={24} />
          </div>

          <div className="admin-production-table-wrap">
            <table className="admin-production-table">
              <thead>
                <tr>
                  <th>Archivo</th>
                  <th>Estado</th>
                  <th>Integridad</th>
                  <th>Tamaño</th>
                  <th>Base</th>
                  <th>Duración</th>
                  <th>Fecha</th>
                  <th>Restauración</th>
                  <th>Usuario</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {backups.length ? (
                  backups.map((backup) => (
                    <tr key={backup.id || backup.filename}>
                      <td>
                        <strong>{backup.filename || "—"}</strong>
                        <small>{backup.filepath || ""}</small>
                      </td>
                      <td>
                        <span className={`admin-production-badge ${backup.status || ""}`}>
                          {backup.status || "—"}
                        </span>
                      </td>
                      <td>
                        <div className="admin-backup-integrity-cell">
                          <span className={`admin-production-badge ${backup.integrity_status || backup.status || ""}`}>
                            {backup.integrity_status || backup.status || "—"}
                          </span>
                          {backup.checksum_sha256 ? <small title={backup.checksum_sha256}>SHA256: {backup.checksum_sha256.slice(0, 12)}…</small> : null}
                        </div>
                      </td>
                      <td>{formatBytes(backup.size_bytes)}</td>
                      <td>{backup.db_name || "—"}</td>
                      <td>{backup.duration_ms ? `${backup.duration_ms} ms` : "—"}</td>
                      <td>{formatDate(backup.created_at || backup.finished_at)}</td>
                      <td>
                        {backup.restore_tested_at ? (
                          <div className="admin-backup-integrity-cell">
                            <strong>Probada</strong>
                            <small>{formatDate(backup.restore_tested_at)}</small>
                          </div>
                        ) : (
                          <span className="admin-muted-text">Pendiente</span>
                        )}
                      </td>
                      <td>{backup.created_by_nombre || "—"}</td>
                      <td>
                        <button
                          type="button"
                          className="admin-table-action"
                          onClick={() => handleValidateBackup(backup)}
                          disabled={busyAction === `validate-backup-${backup.id}`}
                        >
                          {busyAction === `validate-backup-${backup.id}` ? "Validando..." : "Validar"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10">Todavía no hay respaldos registrados.</td>
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
