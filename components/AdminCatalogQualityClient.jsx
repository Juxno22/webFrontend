"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileWarning,
  ImageOff,
  Loader2,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Target,
  Wrench,
  XCircle,
} from "lucide-react";
import AdminModuleNav from "@/components/AdminModuleNav";
import AdminExportMenu from "@/components/AdminExportMenu";
import { getAdminUser } from "@/app/lib/adminApi";
import {
  getAdminCatalogQualityOpciones,
  getAdminCatalogQualityOportunidades,
  getAdminCatalogQualityProductos,
  getAdminCatalogQualityResumen,
} from "@/app/lib/adminCatalogQualityApi";

const ISSUE_OPTIONS = [
  { value: "", label: "Todos los productos" },
  { value: "SIN_IMAGEN", label: "Sin imagen" },
  { value: "SIN_DESCRIPCION_WEB", label: "Sin descripción web" },
  { value: "SIN_CRUCES", label: "Sin cruces" },
  { value: "SIN_APLICACIONES", label: "Sin aplicaciones" },
  { value: "SIN_STOCK", label: "Sin stock web" },
  { value: "SIN_PRECIO", label: "Sin precio web" },
  { value: "CODIGO_SOSPECHOSO", label: "Código sospechoso" },
  { value: "VISIBLE_INCOMPLETO", label: "Visible incompleto" },
  { value: "CONSULTADO_SIN_IMAGEN", label: "Consultado sin imagen" },
  { value: "COTIZADO_SIN_IMAGEN", label: "Cotizado sin imagen" },
];

const ORDER_OPTIONS = [
  { value: "PRIORIDAD", label: "Mayor prioridad" },
  { value: "CONSULTAS", label: "Más consultados" },
  { value: "COTIZACIONES", label: "Más cotizados" },
  { value: "CATEGORIA", label: "Categoría" },
  { value: "CODIGO", label: "Código" },
  { value: "RECIENTES", label: "Actualizados reciente" },
];

const BOOLEAN_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "1", label: "Sí" },
  { value: "0", label: "No" },
];

function formatNumber(value) {
  const number = Number(value || 0);

  return new Intl.NumberFormat("es-MX").format(Number.isFinite(number) ? number : 0);
}

function formatDate(value) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "—";
  }
}

function valueOrDash(value) {
  if (value === null || value === undefined || value === "") return "—";

  return value;
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function defaultDateRange() {
  const hasta = new Date();
  const desde = new Date();
  desde.setDate(hasta.getDate() - 30);

  return {
    desde: toIsoDate(desde),
    hasta: toIsoDate(hasta),
  };
}

function emptyResumen() {
  return {
    kpis: {},
    por_categoria: [],
    familias_criticas: [],
    issues_disponibles: [],
  };
}

function emptyOportunidades() {
  return {
    rango: defaultDateRange(),
    productos_sin_imagen_con_demanda: [],
    productos_incompletos_con_demanda: [],
    busquedas_sin_resultado: [],
  };
}

function getIssueLabel(value) {
  return ISSUE_OPTIONS.find((item) => item.value === value)?.label || value || "Todos";
}

function getKpiCards(kpis = {}) {
  return [
    {
      key: "total_productos_activos",
      label: "Productos activos",
      value: kpis.total_productos_activos,
      icon: Boxes,
      tone: "default",
      issue: "",
    },
    {
      key: "publicados_web",
      label: "Publicados web",
      value: kpis.publicados_web,
      icon: PackageCheck,
      tone: "success",
      issue: "",
    },
    {
      key: "sin_imagen",
      label: "Sin imagen",
      value: kpis.sin_imagen,
      icon: ImageOff,
      tone: "danger",
      issue: "SIN_IMAGEN",
    },
    {
      key: "sin_descripcion_web",
      label: "Sin descripción web",
      value: kpis.sin_descripcion_web,
      icon: FileWarning,
      tone: "warning",
      issue: "SIN_DESCRIPCION_WEB",
    },
    {
      key: "sin_cruces",
      label: "Sin cruces",
      value: kpis.sin_cruces,
      icon: Wrench,
      tone: "accent",
      issue: "SIN_CRUCES",
    },
    {
      key: "sin_aplicaciones",
      label: "Sin aplicaciones",
      value: kpis.sin_aplicaciones,
      icon: Target,
      tone: "accent",
      issue: "SIN_APLICACIONES",
    },
    {
      key: "visibles_incompletos",
      label: "Visibles incompletos",
      value: kpis.visibles_incompletos,
      icon: AlertTriangle,
      tone: "danger",
      issue: "VISIBLE_INCOMPLETO",
    },
    {
      key: "cotizados_sin_imagen",
      label: "Cotizados sin imagen",
      value: kpis.cotizados_sin_imagen,
      icon: ShoppingCart,
      tone: "priority",
      issue: "COTIZADO_SIN_IMAGEN",
    },
  ];
}

function issueBadges(producto) {
  const badges = [];

  if (Number(producto.sin_imagen) === 1) badges.push(["Sin imagen", "danger"]);
  if (Number(producto.sin_descripcion_web) === 1) badges.push(["Sin descripción", "warning"]);
  if (Number(producto.sin_cruces) === 1) badges.push(["Sin cruces", "accent"]);
  if (Number(producto.sin_aplicaciones) === 1) badges.push(["Sin aplicaciones", "accent"]);
  if (Number(producto.sin_stock) === 1) badges.push(["Sin stock", "muted"]);
  if (Number(producto.sin_precio) === 1) badges.push(["Sin precio", "muted"]);
  if (Number(producto.codigo_sospechoso) === 1) badges.push(["Código sospechoso", "danger"]);

  return badges;
}

function buildProductUrl(producto) {
  const code = producto?.codigo_andyfers || producto?.codigo_importacion;

  if (!code) return "";

  return `/producto/${encodeURIComponent(code)}`;
}

export default function AdminCatalogQualityClient() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("resumen");
  const [resumen, setResumen] = useState(emptyResumen());
  const [productos, setProductos] = useState([]);
  const [oportunidades, setOportunidades] = useState(emptyOportunidades());
  const [opciones, setOpciones] = useState({ categorias: [], familias: [], armadoras: [] });
  const [filters, setFilters] = useState({
    q: "",
    categoria_id: "",
    familia: "",
    armadora: "",
    issue: "VISIBLE_INCOMPLETO",
    activo_web: "",
    visible_catalogo: "",
    destacado: "",
    nuevo_web: "",
    order: "PRIORIDAD",
    limit: "100",
  });
  const [range, setRange] = useState(defaultDateRange());
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [opportunitiesLoading, setOpportunitiesLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const kpiCards = useMemo(() => getKpiCards(resumen?.kpis || {}), [resumen]);

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

    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadInitialData() {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const [resumenResponse, opcionesResponse, productosResponse, oportunidadesResponse] =
        await Promise.all([
          getAdminCatalogQualityResumen(),
          getAdminCatalogQualityOpciones(),
          getAdminCatalogQualityProductos(filters),
          getAdminCatalogQualityOportunidades({ ...range, limit: 50 }),
        ]);

      setResumen(resumenResponse?.data || emptyResumen());
      setOpciones(opcionesResponse?.data || { categorias: [], familias: [], armadoras: [] });
      setProductos(productosResponse?.data || []);
      setOportunidades(oportunidadesResponse?.data || emptyOportunidades());
    } catch (err) {
      setError(err.message || "No se pudo cargar la auditoría de catálogo.");
    } finally {
      setLoading(false);
    }
  }

  async function loadResumen() {
    try {
      const response = await getAdminCatalogQualityResumen();
      setResumen(response?.data || emptyResumen());
    } catch (err) {
      setError(err.message || "No se pudo actualizar el resumen.");
    }
  }

  async function loadProductos(nextFilters = filters) {
    try {
      setProductsLoading(true);
      setError("");
      setMessage("");

      const response = await getAdminCatalogQualityProductos(nextFilters);
      setProductos(response?.data || []);
    } catch (err) {
      setError(err.message || "No se pudo cargar el listado de productos.");
      setProductos([]);
    } finally {
      setProductsLoading(false);
    }
  }

  async function loadOportunidades(nextRange = range) {
    try {
      setOpportunitiesLoading(true);
      setError("");

      const response = await getAdminCatalogQualityOportunidades({ ...nextRange, limit: 75 });
      setOportunidades(response?.data || emptyOportunidades());
    } catch (err) {
      setError(err.message || "No se pudieron cargar las oportunidades.");
      setOportunidades(emptyOportunidades());
    } finally {
      setOpportunitiesLoading(false);
    }
  }

  async function refreshAll() {
    await Promise.all([loadResumen(), loadProductos(), loadOportunidades()]);
    setMessage("Auditoría actualizada correctamente.");
  }

  function updateFilter(name, value) {
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function updateRange(name, value) {
    setRange((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function submitFilters(event) {
    event.preventDefault();
    setActiveTab("productos");
    await loadProductos(filters);
  }

  async function applyIssue(issue) {
    const nextFilters = {
      ...filters,
      issue,
      order: issue ? "PRIORIDAD" : filters.order,
    };

    setFilters(nextFilters);
    setActiveTab("productos");
    await loadProductos(nextFilters);
  }

  async function clearFilters() {
    const nextFilters = {
      q: "",
      categoria_id: "",
      familia: "",
      armadora: "",
      issue: "",
      activo_web: "",
      visible_catalogo: "",
      destacado: "",
      nuevo_web: "",
      order: "PRIORIDAD",
      limit: "100",
    };

    setFilters(nextFilters);
    await loadProductos(nextFilters);
  }

  async function submitRange(event) {
    event.preventDefault();
    setActiveTab("oportunidades");
    await loadOportunidades(range);
  }

  return (
    <section className="admin-page admin-quality-page">
      <div className="container">
        <div className="admin-topbar">
          <div>
            <span className="eyebrow">Centro de Calidad Comercial</span>
            <h1>Calidad del catálogo</h1>
            <p>
              Detecta productos sin imagen, cruces, aplicaciones, stock, precio
              o datos comerciales incompletos antes de que afecten ventas.
            </p>
          </div>

          <div className="admin-quality-topbar-actions">
            <AdminExportMenu
              context="catalogQuality"
              filters={{ ...filters, ...range }}
              onError={setError}
            />

            <button
              className="admin-logout"
              type="button"
              onClick={refreshAll}
              disabled={loading || productsLoading || opportunitiesLoading}
            >
              <RefreshCw size={17} />
              Recargar
            </button>
          </div>
        </div>

        <AdminModuleNav />

        {error && <div className="alert-error admin-feedback">{error}</div>}
        {message && <div className="alert-success admin-feedback">{message}</div>}

        {loading ? (
          <div className="admin-quality-loading">
            <Loader2 size={24} className="spin-icon" />
            Cargando auditoría comercial...
          </div>
        ) : (
          <>
            <div className="admin-quality-tabs">
              <button
                type="button"
                className={activeTab === "resumen" ? "active" : ""}
                onClick={() => setActiveTab("resumen")}
              >
                <ShieldCheck size={17} />
                Resumen
              </button>
              <button
                type="button"
                className={activeTab === "productos" ? "active" : ""}
                onClick={() => setActiveTab("productos")}
              >
                <Boxes size={17} />
                Productos
              </button>
              <button
                type="button"
                className={activeTab === "oportunidades" ? "active" : ""}
                onClick={() => setActiveTab("oportunidades")}
              >
                <Sparkles size={17} />
                Oportunidades
              </button>
            </div>

            {activeTab === "resumen" && (
              <div className="admin-quality-section-stack">
                <div className="admin-quality-kpis">
                  {kpiCards.map((card) => {
                    const Icon = card.icon;

                    return (
                      <button
                        type="button"
                        className={`admin-quality-kpi ${card.tone}`}
                        key={card.key}
                        onClick={() => applyIssue(card.issue)}
                      >
                        <div>
                          <span>{card.label}</span>
                          <strong>{formatNumber(card.value)}</strong>
                        </div>
                        <Icon size={25} />
                      </button>
                    );
                  })}
                </div>

                <div className="admin-quality-grid-two">
                  <article className="admin-panel">
                    <div className="admin-panel-title-row">
                      <div>
                        <span className="eyebrow">Categorías</span>
                        <h2>Salud comercial por categoría</h2>
                      </div>
                    </div>

                    <div className="admin-quality-table-wrap compact">
                      <table className="admin-quality-table">
                        <thead>
                          <tr>
                            <th>Categoría</th>
                            <th>Total</th>
                            <th>Publicados</th>
                            <th>Sin imagen</th>
                            <th>Incompletos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(resumen?.por_categoria || []).map((row) => (
                            <tr key={row.categoria_id || row.categoria}>
                              <td>{row.categoria}</td>
                              <td>{formatNumber(row.total_productos)}</td>
                              <td>{formatNumber(row.publicados_web)}</td>
                              <td>{formatNumber(row.sin_imagen)}</td>
                              <td>{formatNumber(row.visibles_incompletos)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </article>

                  <article className="admin-panel">
                    <div className="admin-panel-title-row">
                      <div>
                        <span className="eyebrow">Familias críticas</span>
                        <h2>Prioridad por familia</h2>
                      </div>
                    </div>

                    <div className="admin-quality-family-list">
                      {(resumen?.familias_criticas || []).map((row) => (
                        <button
                          type="button"
                          key={row.familia}
                          onClick={() => {
                            const nextFilters = {
                              ...filters,
                              familia: row.familia === "SIN_FAMILIA" ? "" : row.familia,
                              issue: "VISIBLE_INCOMPLETO",
                            };
                            setFilters(nextFilters);
                            setActiveTab("productos");
                            loadProductos(nextFilters);
                          }}
                        >
                          <strong>{row.familia}</strong>
                          <span>{formatNumber(row.visibles_incompletos)} incompletos</span>
                          <small>
                            {formatNumber(row.sin_imagen)} sin imagen · {formatNumber(row.sin_cruces)} sin cruces
                          </small>
                        </button>
                      ))}
                    </div>
                  </article>
                </div>
              </div>
            )}

            {activeTab === "productos" && (
              <div className="admin-quality-section-stack">
                <form className="admin-quality-toolbar" onSubmit={submitFilters}>
                  <div className="admin-search">
                    <Search size={17} />
                    <input
                      value={filters.q}
                      onChange={(event) => updateFilter("q", event.target.value)}
                      placeholder="Buscar código, familia, armadora o descripción..."
                    />
                  </div>

                  <select
                    value={filters.issue}
                    onChange={(event) => updateFilter("issue", event.target.value)}
                  >
                    {ISSUE_OPTIONS.map((option) => (
                      <option value={option.value} key={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filters.categoria_id}
                    onChange={(event) => updateFilter("categoria_id", event.target.value)}
                  >
                    <option value="">Todas las categorías</option>
                    {(opciones.categorias || []).map((categoria) => (
                      <option value={categoria.id} key={categoria.id}>
                        {categoria.nombre}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filters.familia}
                    onChange={(event) => updateFilter("familia", event.target.value)}
                  >
                    <option value="">Todas las familias</option>
                    {(opciones.familias || []).map((familia) => (
                      <option value={familia} key={familia}>
                        {familia}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filters.armadora}
                    onChange={(event) => updateFilter("armadora", event.target.value)}
                  >
                    <option value="">Todas las armadoras</option>
                    {(opciones.armadoras || []).map((armadora) => (
                      <option value={armadora} key={armadora}>
                        {armadora}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filters.visible_catalogo}
                    onChange={(event) => updateFilter("visible_catalogo", event.target.value)}
                  >
                    <option value="">Visible catálogo</option>
                    {BOOLEAN_OPTIONS.slice(1).map((option) => (
                      <option value={option.value} key={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filters.order}
                    onChange={(event) => updateFilter("order", event.target.value)}
                  >
                    {ORDER_OPTIONS.map((option) => (
                      <option value={option.value} key={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filters.limit}
                    onChange={(event) => updateFilter("limit", event.target.value)}
                  >
                    <option value="50">50</option>
                    <option value="100">100</option>
                    <option value="200">200</option>
                    <option value="500">500</option>
                  </select>

                  <button className="admin-clean-button" type="submit" disabled={productsLoading}>
                    {productsLoading ? <Loader2 size={16} className="spin-icon" /> : "Buscar"}
                  </button>

                  <button className="admin-primary-link" type="button" onClick={clearFilters}>
                    Limpiar
                  </button>
                </form>

                <article className="admin-panel">
                  <div className="admin-panel-title-row">
                    <div>
                      <span className="eyebrow">Listado de revisión</span>
                      <h2>{getIssueLabel(filters.issue)}</h2>
                    </div>
                    <span className="admin-quality-count">
                      {formatNumber(productos.length)} productos
                    </span>
                  </div>

                  <ProductQualityTable productos={productos} loading={productsLoading} />
                </article>
              </div>
            )}

            {activeTab === "oportunidades" && (
              <div className="admin-quality-section-stack">
                <form className="admin-quality-range" onSubmit={submitRange}>
                  <label>
                    Desde
                    <input
                      type="date"
                      value={range.desde}
                      onChange={(event) => updateRange("desde", event.target.value)}
                    />
                  </label>

                  <label>
                    Hasta
                    <input
                      type="date"
                      value={range.hasta}
                      onChange={(event) => updateRange("hasta", event.target.value)}
                    />
                  </label>

                  <button className="admin-primary-link" type="submit" disabled={opportunitiesLoading}>
                    {opportunitiesLoading ? <Loader2 size={16} className="spin-icon" /> : "Actualizar oportunidades"}
                  </button>
                </form>

                <div className="admin-quality-grid-two">
                  <OpportunityList
                    title="Productos sin imagen con demanda"
                    eyebrow="Acción sugerida: pedir/subir imagen"
                    icon={ImageOff}
                    rows={oportunidades.productos_sin_imagen_con_demanda || []}
                    type="producto"
                  />

                  <OpportunityList
                    title="Productos incompletos con demanda"
                    eyebrow="Acción sugerida: completar cruces/aplicaciones"
                    icon={AlertTriangle}
                    rows={oportunidades.productos_incompletos_con_demanda || []}
                    type="producto"
                  />
                </div>

                <article className="admin-panel">
                  <div className="admin-panel-title-row">
                    <div>
                      <span className="eyebrow">Mercado</span>
                      <h2>Búsquedas sin resultado</h2>
                    </div>
                  </div>

                  <div className="admin-quality-opportunity-list full">
                    {(oportunidades.busquedas_sin_resultado || []).length ? (
                      oportunidades.busquedas_sin_resultado.map((row) => (
                        <div className="admin-quality-opportunity-card" key={row.busqueda_normalizada}>
                          <div>
                            <strong>{row.busqueda_normalizada}</strong>
                            <span>{valueOrDash(row.ejemplo_busqueda)}</span>
                            <small>
                              {valueOrDash(row.marca_vehiculo)} · {valueOrDash(row.modelo_vehiculo)} · {valueOrDash(row.anio_vehiculo)} · {valueOrDash(row.motor_vehiculo)}
                            </small>
                          </div>

                          <div className="admin-quality-opportunity-metrics">
                            <span>{formatNumber(row.total_busquedas)} búsquedas</span>
                            <span>{formatNumber(row.sesiones)} sesiones</span>
                            <small>Última: {formatDate(row.ultima_busqueda)}</small>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="admin-empty">No hay búsquedas sin resultado en este periodo.</div>
                    )}
                  </div>
                </article>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function ProductQualityTable({ productos = [], loading = false }) {
  if (loading) {
    return (
      <div className="admin-quality-loading small">
        <Loader2 size={20} className="spin-icon" />
        Cargando productos...
      </div>
    );
  }

  if (!productos.length) {
    return <div className="admin-empty">No hay productos con los filtros seleccionados.</div>;
  }

  return (
    <div className="admin-quality-table-wrap">
      <table className="admin-quality-table products">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Categoría / familia</th>
            <th>Calidad</th>
            <th>Demanda</th>
            <th>Estado web</th>
            <th>Prioridad</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((producto) => {
            const url = buildProductUrl(producto);

            return (
              <tr key={producto.id}>
                <td>
                  <div className="admin-quality-product-cell">
                    <strong>{valueOrDash(producto.codigo_andyfers)}</strong>
                    <span>{valueOrDash(producto.codigo_importacion)}</span>
                    <small>{valueOrDash(producto.descripcion)}</small>
                    {url && (
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        Ver público
                      </a>
                    )}
                  </div>
                </td>

                <td>
                  <div className="admin-quality-product-cell muted">
                    <strong>{valueOrDash(producto.categoria)}</strong>
                    <span>{valueOrDash(producto.familia)}</span>
                    <small>{valueOrDash(producto.armadora)}</small>
                  </div>
                </td>

                <td>
                  <div className="admin-quality-badges">
                    {issueBadges(producto).length ? (
                      issueBadges(producto).map(([label, tone]) => (
                        <span className={`admin-quality-badge ${tone}`} key={label}>
                          {label}
                        </span>
                      ))
                    ) : (
                      <span className="admin-quality-badge success">OK</span>
                    )}
                  </div>
                </td>

                <td>
                  <div className="admin-quality-demand-cell">
                    <span>
                      <Eye size={14} /> {formatNumber(producto.total_consultas)} consultas
                    </span>
                    <span>
                      <ShoppingCart size={14} /> {formatNumber(producto.total_agregados_cotizacion)} agregados
                    </span>
                    <small>{formatNumber(producto.total_cotizaciones)} cotizaciones</small>
                  </div>
                </td>

                <td>
                  <div className="admin-quality-status-stack">
                    <span className={Number(producto.activo_web) === 1 ? "ok" : "bad"}>
                      {Number(producto.activo_web) === 1 ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      Activo web
                    </span>
                    <span className={Number(producto.visible_catalogo) === 1 ? "ok" : "bad"}>
                      {Number(producto.visible_catalogo) === 1 ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      Visible
                    </span>
                  </div>
                </td>

                <td>
                  <strong className="admin-quality-priority">
                    {formatNumber(producto.prioridad_calidad)}
                  </strong>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function OpportunityList({ title, eyebrow, icon: Icon, rows = [], type = "producto" }) {
  return (
    <article className="admin-panel">
      <div className="admin-panel-title-row">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        <Icon size={23} />
      </div>

      <div className="admin-quality-opportunity-list">
        {rows.length ? (
          rows.map((row) => {
            const url = type === "producto" ? buildProductUrl(row) : "";

            return (
              <div className="admin-quality-opportunity-card" key={`${row.id || row.codigo_andyfers}-${row.codigo_importacion}`}>
                <div>
                  <strong>{valueOrDash(row.codigo_andyfers || row.busqueda_normalizada)}</strong>
                  <span>{valueOrDash(row.codigo_importacion || row.ejemplo_busqueda)}</span>
                  <small>{valueOrDash(row.descripcion || row.familia)}</small>
                  {url && (
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      Ver producto
                    </a>
                  )}
                </div>

                <div className="admin-quality-opportunity-metrics">
                  <span>
                    <BarChart3 size={14} /> Score {formatNumber(row.score)}
                  </span>
                  <span>{formatNumber(row.total_consultas)} consultas</span>
                  <span>{formatNumber(row.total_agregados_cotizacion)} agregados</span>
                  <small>Último: {formatDate(row.ultimo_evento)}</small>
                </div>
              </div>
            );
          })
        ) : (
          <div className="admin-empty">No hay oportunidades para este criterio.</div>
        )}
      </div>
    </article>
  );
}
