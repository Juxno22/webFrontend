"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  ClipboardList,
  Eye,
  EyeOff,
  Globe2,
  ImageOff,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import {
  getAdminProductos,
  getAdminProductosResumen,
  getAdminUser,
  updateAdminProductoAccionesRapidas,
} from "../app/lib/adminApi";
import AdminModuleNav from "@/components/AdminModuleNav";

const ESTADOS_REVISION = [
  "",
  "SIN_CODIGO_VALIDO",
  "SIN_DESCRIPCION",
  "SIN_FAMILIA",
  "SIN_ARMADORA",
  "OK",
];

const initialFilters = {
  q: "",
  estado_revision: "",
  visibilidad_publica: "",
  multimedia: "",
  activo_web: "",
  visible_catalogo: "",
  destacado: "",
  nuevo_web: "",
  page: 1,
};

function formatDate(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function boolNumber(value) {
  return Number(value) === 1;
}

function showToast(message) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("andyfers_toast", {
      detail: {
        message,
      },
    })
  );
}

export default function AdminProductosClient() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [productos, setProductos] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [resumen, setResumen] = useState(null);

  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [quickSaving, setQuickSaving] = useState("");
  const [error, setError] = useState("");

  const totalText = useMemo(() => {
    if (!pagination) return "";

    return `${pagination.total} producto${pagination.total === 1 ? "" : "s"}`;
  }, [pagination]);

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

    loadData();
  }, [user, filters]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [productosRes, resumenRes] = await Promise.all([
        getAdminProductos({
          q: filters.q,
          estado_revision: filters.estado_revision,
          visibilidad_publica: filters.visibilidad_publica,
          multimedia: filters.multimedia,
          activo_web: filters.activo_web,
          visible_catalogo: filters.visible_catalogo,
          destacado: filters.destacado,
          nuevo_web: filters.nuevo_web,
          page: filters.page,
          limit: 20,
        }),
        getAdminProductosResumen(),
      ]);

      setProductos(productosRes.data || []);
      setPagination(productosRes.pagination || null);
      setResumen(resumenRes.data || null);
    } catch (err) {
      setError(err.message || "No se pudieron cargar productos.");
    } finally {
      setLoading(false);
    }
  }

  function updateFilter(name, value) {
    setFilters((current) => ({
      ...current,
      [name]: value,
      page: 1,
    }));
  }

  function applyQuickFilter(patch) {
    setFilters((current) => ({
      ...current,
      ...patch,
      page: 1,
    }));
  }

  function clearFilters() {
    setFilters(initialFilters);
  }

  function goToPage(page) {
    setFilters((current) => ({
      ...current,
      page,
    }));
  }

  async function applyQuickAction(producto, patch, label) {
    const actionKey = `${producto.id}-${Object.keys(patch).join("-")}`;

    try {
      setQuickSaving(actionKey);
      setError("");

      await updateAdminProductoAccionesRapidas(producto.id, patch);

      showToast(label || "Acción aplicada correctamente.");
      await loadData();
    } catch (err) {
      setError(err.message || "No se pudo aplicar la acción rápida.");
    } finally {
      setQuickSaving("");
    }
  }

  function renderQuickButton(producto, field, activeLabel, inactiveLabel, Icon) {
    const isActive = boolNumber(producto[field]);
    const nextValue = isActive ? 0 : 1;
    const actionKey = `${producto.id}-${field}`;
    const loadingAction = quickSaving === actionKey;

    return (
      <button
        type="button"
        className={`admin-product-quick-btn ${isActive ? "is-on" : "is-off"}`}
        onClick={() =>
          applyQuickAction(
            producto,
            {
              [field]: nextValue,
            },
            nextValue === 1 ? activeLabel : inactiveLabel
          )
        }
        disabled={Boolean(quickSaving)}
      >
        {loadingAction ? (
          <Loader2 size={14} className="spin-icon" />
        ) : (
          <Icon size={14} />
        )}
        {isActive ? inactiveLabel : activeLabel}
      </button>
    );
  }

  return (
    <section className="admin-page">
      <div className="container">
        <div className="admin-topbar">
          <div>
            <span className="eyebrow">Mantenimiento de catálogo</span>
            <h1>Productos</h1>
            <p>
              {user ? `${user.nombre} · ${user.rol}` : "Cargando usuario..."}
            </p>
          </div>

          <Link href="/admin/productos/nuevo" className="admin-primary-link">
            <Plus size={17} />
            Nuevo producto
          </Link>
        </div>

        <AdminModuleNav />

        <div className="admin-kpi-grid admin-kpi-grid-maintenance">
          <button
            type="button"
            className="admin-kpi-card admin-kpi-button"
            onClick={clearFilters}
          >
            <div>
              <span>Total productos</span>
              <strong>{resumen?.total ?? 0}</strong>
            </div>
            <Box size={24} />
          </button>

          <button
            type="button"
            className="admin-kpi-card success admin-kpi-button"
            onClick={() => applyQuickFilter({ estado_revision: "OK" })}
          >
            <div>
              <span>Correctos</span>
              <strong>{resumen?.ok ?? 0}</strong>
            </div>
            <CheckCircle2 size={24} />
          </button>

          <button
            type="button"
            className="admin-kpi-card warning admin-kpi-button"
            onClick={() =>
              applyQuickFilter({ estado_revision: "SIN_CODIGO_VALIDO" })
            }
          >
            <div>
              <span>Sin código</span>
              <strong>{resumen?.sin_codigo_valido ?? 0}</strong>
            </div>
            <AlertTriangle size={24} />
          </button>

          <button
            type="button"
            className="admin-kpi-card accent admin-kpi-button"
            onClick={() => applyQuickFilter({ multimedia: "SIN_MULTIMEDIA" })}
          >
            <div>
              <span>Sin multimedia</span>
              <strong>{resumen?.sin_multimedia ?? 0}</strong>
            </div>
            <ImageOff size={24} />
          </button>

          <button
            type="button"
            className="admin-kpi-card danger admin-kpi-button"
            onClick={() => applyQuickFilter({ visibilidad_publica: "OCULTO" })}
          >
            <div>
              <span>No visibles público</span>
              <strong>{resumen?.no_visibles_publico ?? 0}</strong>
            </div>
            <EyeOff size={24} />
          </button>

          <button
            type="button"
            className="admin-kpi-card admin-kpi-button"
            onClick={() => applyQuickFilter({ nuevo_web: "1" })}
          >
            <div>
              <span>Productos nuevos</span>
              <strong>{resumen?.nuevos_web ?? 0}</strong>
            </div>
            <Sparkles size={24} />
          </button>
        </div>

        <div className="admin-toolbar admin-products-toolbar admin-products-maintenance-toolbar">
          <div className="admin-search">
            <Search size={18} />
            <input
              type="search"
              value={filters.q}
              onChange={(event) => updateFilter("q", event.target.value)}
              placeholder="Buscar por código, descripción, familia, armadora..."
            />
          </div>

          <select
            value={filters.estado_revision}
            onChange={(event) =>
              updateFilter("estado_revision", event.target.value)
            }
          >
            {ESTADOS_REVISION.map((estado) => (
              <option key={estado || "TODOS"} value={estado}>
                {estado || "Todos los estados"}
              </option>
            ))}
          </select>

          <select
            value={filters.visibilidad_publica}
            onChange={(event) =>
              updateFilter("visibilidad_publica", event.target.value)
            }
          >
            <option value="">Visibilidad pública</option>
            <option value="VISIBLE">Visible público</option>
            <option value="OCULTO">No visible público</option>
          </select>

          <select
            value={filters.multimedia}
            onChange={(event) => updateFilter("multimedia", event.target.value)}
          >
            <option value="">Multimedia</option>
            <option value="CON_MULTIMEDIA">Con multimedia</option>
            <option value="SIN_MULTIMEDIA">Sin multimedia</option>
          </select>

          <select
            value={filters.activo_web}
            onChange={(event) => updateFilter("activo_web", event.target.value)}
          >
            <option value="">Activo web</option>
            <option value="1">Activo web: sí</option>
            <option value="0">Activo web: no</option>
          </select>

          <select
            value={filters.visible_catalogo}
            onChange={(event) =>
              updateFilter("visible_catalogo", event.target.value)
            }
          >
            <option value="">Visible catálogo</option>
            <option value="1">Visible catálogo: sí</option>
            <option value="0">Visible catálogo: no</option>
          </select>

          <select
            value={filters.destacado}
            onChange={(event) => updateFilter("destacado", event.target.value)}
          >
            <option value="">Destacado</option>
            <option value="1">Destacado: sí</option>
            <option value="0">Destacado: no</option>
          </select>

          <select
            value={filters.nuevo_web}
            onChange={(event) => updateFilter("nuevo_web", event.target.value)}
          >
            <option value="">Nuevo</option>
            <option value="1">Nuevo: sí</option>
            <option value="0">Nuevo: no</option>
          </select>

          <button
            type="button"
            className="admin-clean-button"
            onClick={clearFilters}
          >
            <RefreshCw size={15} />
            Limpiar
          </button>

          <strong>{totalText}</strong>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <div className="admin-products-list admin-products-maintenance-list">
          {loading ? (
            <div className="admin-empty">Cargando productos...</div>
          ) : productos.length > 0 ? (
            productos.map((producto) => {
              const code =
                producto.codigo_andyfers ||
                producto.codigo_importacion ||
                "SIN CÓDIGO";

              return (
                <article
                  className="admin-product-card admin-product-maintenance-card"
                  key={producto.id}
                >
                  <Link
                    href={`/admin/productos/${producto.id}`}
                    className="admin-product-main admin-product-main-link"
                  >
                    <div className="admin-product-head">
                      <strong>{code}</strong>

                      <span
                        className={`admin-product-status status-${producto.estado_revision}`}
                      >
                        {producto.estado_revision}
                      </span>

                      <span
                        className={`admin-product-web ${
                          Number(producto.visible_publico) === 1
                            ? "visible"
                            : "hidden"
                        }`}
                      >
                        {Number(producto.visible_publico) === 1
                          ? "Visible público"
                          : `No visible: ${
                              producto.motivo_visibilidad || "NO_VISIBLE"
                            }`}
                      </span>
                    </div>

                    <h3>{producto.descripcion || "Producto sin descripción"}</h3>

                    <p>
                      {producto.familia || "Sin familia"} ·{" "}
                      {producto.armadora || "Sin armadora"} ·{" "}
                      {producto.categoria_nombre || "Sin categoría"}
                    </p>

                    <div className="admin-product-maintenance-badges">
                      <span
                        className={
                          boolNumber(producto.tiene_multimedia) ? "ok" : "bad"
                        }
                      >
                        {boolNumber(producto.tiene_multimedia)
                          ? `${producto.total_multimedia || 0} imagen(es)`
                          : "Sin multimedia"}
                      </span>

                      <span
                        className={boolNumber(producto.activo_web) ? "ok" : "bad"}
                      >
                        {boolNumber(producto.activo_web)
                          ? "Activo web"
                          : "Web apagado"}
                      </span>

                      <span
                        className={
                          boolNumber(producto.visible_catalogo) ? "ok" : "bad"
                        }
                      >
                        {boolNumber(producto.visible_catalogo)
                          ? "Visible catálogo"
                          : "Oculto catálogo"}
                      </span>

                      {boolNumber(producto.destacado) && (
                        <span className="info">Destacado</span>
                      )}

                      {boolNumber(producto.nuevo_web) && (
                        <span className="info">Nuevo</span>
                      )}
                    </div>
                  </Link>

                  <div className="admin-product-maintenance-side">
                    <div className="admin-product-date">
                      {formatDate(producto.updated_at)}
                    </div>

                    <div className="admin-product-quick-actions">
                      {renderQuickButton(
                        producto,
                        "activo_web",
                        "Activar web",
                        "Apagar web",
                        Globe2
                      )}

                      {renderQuickButton(
                        producto,
                        "visible_catalogo",
                        "Mostrar catálogo",
                        "Ocultar catálogo",
                        boolNumber(producto.visible_catalogo) ? EyeOff : Eye
                      )}

                      {renderQuickButton(
                        producto,
                        "destacado",
                        "Destacar",
                        "Quitar destacado",
                        Star
                      )}

                      {renderQuickButton(
                        producto,
                        "nuevo_web",
                        "Marcar nuevo",
                        "Quitar nuevo",
                        Sparkles
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="admin-empty">No hay productos con esos filtros.</div>
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