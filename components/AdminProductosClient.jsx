"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Box,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe2,
  ImageOff,
  Loader2,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Sparkles,
  Star,
} from "lucide-react";
import {
  getAdminProductos,
  getAdminProductosResumen,
  updateAdminProductoAccionesRapidas,
} from "@/app/lib/adminApi";
import { useAdminAuth } from "@/app/hooks/useAdminAuth";

const ESTADOS_REVISION = [
  { value: "", label: "Todos los estados" },
  { value: "SIN_CODIGO_VALIDO", label: "Sin código válido" },
  { value: "SIN_DESCRIPCION", label: "Sin descripción" },
  { value: "SIN_FAMILIA", label: "Sin familia" },
  { value: "SIN_ARMADORA", label: "Sin armadora" },
  { value: "OK", label: "Correctos" },
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

function boolNumber(value) {
  return Number(value) === 1;
}

function showToast(message) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("andyfers_toast", {
      detail: { message },
    })
  );
}

function getRevisionLabel(value) {
  const found = ESTADOS_REVISION.find((item) => item.value === value);
  return found?.label || value || "Sin estado";
}

export default function AdminProductosClient() {
  const { checking } = useAdminAuth();

  const [productos, setProductos] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const [loading, setLoading] = useState(true);
  const [quickSaving, setQuickSaving] = useState("");
  const [error, setError] = useState("");

  const totalText = useMemo(() => {
    if (!pagination) return "0 productos";

    return `${formatNumber(pagination.total)} producto${
      Number(pagination.total) === 1 ? "" : "s"
    }`;
  }, [pagination]);

  async function loadData(nextFilters = filters) {
    try {
      setLoading(true);
      setError("");

      const [productosRes, resumenRes] = await Promise.all([
        getAdminProductos({
          q: nextFilters.q,
          estado_revision: nextFilters.estado_revision,
          visibilidad_publica: nextFilters.visibilidad_publica,
          multimedia: nextFilters.multimedia,
          activo_web: nextFilters.activo_web,
          visible_catalogo: nextFilters.visible_catalogo,
          destacado: nextFilters.destacado,
          nuevo_web: nextFilters.nuevo_web,
          page: nextFilters.page,
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

  useEffect(() => {
    if (!checking) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking]);

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
    loadData(nextFilters);
  }

  function applyQuickFilter(patch) {
    const nextFilters = {
      ...filters,
      ...patch,
      page: 1,
    };

    setFilters(nextFilters);
    loadData(nextFilters);
  }

  function clearFilters() {
    setFilters(initialFilters);
    loadData(initialFilters);
  }

  function goToPage(page) {
    const nextFilters = {
      ...filters,
      page,
    };

    setFilters(nextFilters);
    loadData(nextFilters);
  }

  async function applyQuickAction(producto, patch, label) {
    const actionKey = `${producto.id}-${Object.keys(patch).join("-")}`;

    try {
      setQuickSaving(actionKey);
      setError("");

      await updateAdminProductoAccionesRapidas(producto.id, patch);

      showToast(label || "Acción aplicada correctamente.");
      await loadData(filters);
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
        className={`admin-product-quick-os ${isActive ? "is-on" : "is-off"}`}
        onClick={() =>
          applyQuickAction(
            producto,
            { [field]: nextValue },
            nextValue === 1 ? activeLabel : inactiveLabel
          )
        }
        disabled={Boolean(quickSaving)}
      >
        {loadingAction ? (
          <Loader2 size={14} className="admin-spin" />
        ) : (
          <Icon size={14} />
        )}
        {isActive ? inactiveLabel : activeLabel}
      </button>
    );
  }

  if (checking) return null;

  return (
    <section className="admin-workspace admin-products-os">
      <div className="admin-page-hero">
        <div>
          <span>Mantenimiento de catálogo</span>
          <h1>Productos</h1>
          <p>
            Administra el catálogo público: códigos, descripción, familia,
            visibilidad, multimedia, productos nuevos y destacados para ecommerce.
          </p>
        </div>

        <div className="admin-page-hero-actions">
          <Link href="/admin/productos/nuevo" className="admin-primary-button">
            <Plus size={18} />
            Nuevo producto
          </Link>

          <Link href="/admin/ecommerce" className="admin-secondary-button">
            <ShoppingCart size={18} />
            Inventario web
          </Link>

          <Link href="/admin/chat" className="admin-secondary-button">
            <MessageCircle size={18} />
            Chat clientes
          </Link>

          <button
            type="button"
            className="admin-refresh-button"
            onClick={() => loadData()}
            disabled={loading}
          >
            {loading ? (
              <Loader2 size={18} className="admin-spin" />
            ) : (
              <RefreshCw size={18} />
            )}
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

      <section className="admin-kpi-grid admin-products-kpi-grid">
        <button
          type="button"
          className="admin-kpi-card admin-product-kpi-button"
          onClick={clearFilters}
        >
          <Box size={22} />
          <span>Total productos</span>
          <strong>{formatNumber(resumen?.total)}</strong>
          <small>Catálogo completo</small>
        </button>

        <button
          type="button"
          className="admin-kpi-card admin-product-kpi-button tone-ok"
          onClick={() => applyQuickFilter({ estado_revision: "OK" })}
        >
          <CheckCircle2 size={22} />
          <span>Correctos</span>
          <strong>{formatNumber(resumen?.ok)}</strong>
          <small>Listos para catálogo</small>
        </button>

        <button
          type="button"
          className="admin-kpi-card admin-product-kpi-button tone-warning"
          onClick={() => applyQuickFilter({ estado_revision: "SIN_CODIGO_VALIDO" })}
        >
          <AlertTriangle size={22} />
          <span>Sin código</span>
          <strong>{formatNumber(resumen?.sin_codigo_valido)}</strong>
          <small>Requieren revisión</small>
        </button>

        <button
          type="button"
          className="admin-kpi-card admin-product-kpi-button tone-danger"
          onClick={() => applyQuickFilter({ multimedia: "SIN_MULTIMEDIA" })}
        >
          <ImageOff size={22} />
          <span>Sin multimedia</span>
          <strong>{formatNumber(resumen?.sin_multimedia)}</strong>
          <small>Sin imagen pública</small>
        </button>

        <button
          type="button"
          className="admin-kpi-card admin-product-kpi-button tone-danger"
          onClick={() => applyQuickFilter({ visibilidad_publica: "OCULTO" })}
        >
          <EyeOff size={22} />
          <span>No visibles público</span>
          <strong>{formatNumber(resumen?.no_visibles_publico)}</strong>
          <small>Ocultos o incompletos</small>
        </button>

        <button
          type="button"
          className="admin-kpi-card admin-product-kpi-button tone-active"
          onClick={() => applyQuickFilter({ nuevo_web: "1" })}
        >
          <Sparkles size={22} />
          <span>Productos nuevos</span>
          <strong>{formatNumber(resumen?.nuevos_web)}</strong>
          <small>Marcados como nuevos</small>
        </button>
      </section>

      <form className="admin-products-filters-os" onSubmit={submitFilters}>
        <label className="admin-products-search-os">
          Buscar
          <div>
            <Search size={16} />
            <input
              type="search"
              value={filters.q}
              onChange={(event) => updateFilter("q", event.target.value)}
              placeholder="Código, descripción, familia, armadora..."
            />
          </div>
        </label>

        <label>
          Estado revisión
          <select
            value={filters.estado_revision}
            onChange={(event) => updateFilter("estado_revision", event.target.value)}
          >
            {ESTADOS_REVISION.map((estado) => (
              <option key={estado.value || "TODOS"} value={estado.value}>
                {estado.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Visibilidad
          <select
            value={filters.visibilidad_publica}
            onChange={(event) => updateFilter("visibilidad_publica", event.target.value)}
          >
            <option value="">Todas</option>
            <option value="VISIBLE">Visible público</option>
            <option value="OCULTO">No visible público</option>
          </select>
        </label>

        <label>
          Multimedia
          <select
            value={filters.multimedia}
            onChange={(event) => updateFilter("multimedia", event.target.value)}
          >
            <option value="">Todas</option>
            <option value="CON_MULTIMEDIA">Con multimedia</option>
            <option value="SIN_MULTIMEDIA">Sin multimedia</option>
          </select>
        </label>

        <label>
          Activo web
          <select
            value={filters.activo_web}
            onChange={(event) => updateFilter("activo_web", event.target.value)}
          >
            <option value="">Todos</option>
            <option value="1">Activo web: sí</option>
            <option value="0">Activo web: no</option>
          </select>
        </label>

        <label>
          Visible catálogo
          <select
            value={filters.visible_catalogo}
            onChange={(event) => updateFilter("visible_catalogo", event.target.value)}
          >
            <option value="">Todos</option>
            <option value="1">Visible catálogo: sí</option>
            <option value="0">Visible catálogo: no</option>
          </select>
        </label>

        <label>
          Destacado
          <select
            value={filters.destacado}
            onChange={(event) => updateFilter("destacado", event.target.value)}
          >
            <option value="">Todos</option>
            <option value="1">Destacado: sí</option>
            <option value="0">Destacado: no</option>
          </select>
        </label>

        <label>
          Nuevo
          <select
            value={filters.nuevo_web}
            onChange={(event) => updateFilter("nuevo_web", event.target.value)}
          >
            <option value="">Todos</option>
            <option value="1">Nuevo: sí</option>
            <option value="0">Nuevo: no</option>
          </select>
        </label>

        <button className="admin-primary-button" type="submit" disabled={loading}>
          {loading ? <Loader2 size={17} className="admin-spin" /> : <Search size={17} />}
          Filtrar
        </button>

        <button
          type="button"
          className="admin-secondary-button"
          onClick={clearFilters}
        >
          <RefreshCw size={15} />
          Limpiar
        </button>

        <div className="admin-products-total-os">
          <strong>{totalText}</strong>
          <small>Resultado actual</small>
        </div>
      </form>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <span>Catálogo</span>
            <h2>Listado de productos</h2>
            <p>
              Usa acciones rápidas para activar web, mostrar en catálogo,
              destacar o marcar productos nuevos.
            </p>
          </div>

          <Link href="/admin/catalogo-calidad">
            Calidad catálogo
            <ArrowRight size={15} />
          </Link>
        </div>

        {loading ? (
          <div className="admin-loading-panel">
            <Loader2 size={34} className="admin-spin" />
            <strong>Cargando productos...</strong>
          </div>
        ) : productos.length > 0 ? (
          <div className="admin-products-list-os">
            {productos.map((producto) => {
              const code =
                producto.codigo_andyfers ||
                producto.codigo_importacion ||
                "SIN CÓDIGO";

              const visiblePublico = Number(producto.visible_publico) === 1;

              return (
                <article className="admin-product-card-os" key={producto.id}>
                  <Link
                    href={`/admin/productos/${producto.id}`}
                    className="admin-product-main-os"
                  >
                    <div className="admin-product-card-head-os">
                      <strong>{code}</strong>

                      <mark
                        className={`admin-status-pill status-${producto.estado_revision}`}
                      >
                        {getRevisionLabel(producto.estado_revision)}
                      </mark>

                      <span
                        className={`admin-product-public-pill-os ${
                          visiblePublico ? "is-visible" : "is-hidden"
                        }`}
                      >
                        {visiblePublico
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

                    <div className="admin-product-badges-os">
                      <span className={boolNumber(producto.tiene_multimedia) ? "ok" : "bad"}>
                        {boolNumber(producto.tiene_multimedia)
                          ? `${producto.total_multimedia || 0} imagen(es)`
                          : "Sin multimedia"}
                      </span>

                      <span className={boolNumber(producto.activo_web) ? "ok" : "bad"}>
                        {boolNumber(producto.activo_web) ? "Activo web" : "Web apagado"}
                      </span>

                      <span className={boolNumber(producto.visible_catalogo) ? "ok" : "bad"}>
                        {boolNumber(producto.visible_catalogo)
                          ? "Visible catálogo"
                          : "Oculto catálogo"}
                      </span>

                      {boolNumber(producto.destacado) && <span className="info">Destacado</span>}

                      {boolNumber(producto.nuevo_web) && <span className="info">Nuevo</span>}
                    </div>
                  </Link>

                  <aside className="admin-product-side-os">
                    <span>Actualizado</span>
                    <strong>{formatDate(producto.updated_at)}</strong>

                    <div className="admin-product-actions-os">
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
                  </aside>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="admin-loading-panel">
            <Box size={34} />
            <strong>No hay productos con esos filtros.</strong>
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