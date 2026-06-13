"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  ClipboardList,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  getAdminProductos,
  getAdminProductosResumen,
  getAdminUser,
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

function formatDate(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AdminProductosClient() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [productos, setProductos] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [resumen, setResumen] = useState(null);

  const [filters, setFilters] = useState({
    q: "",
    estado_revision: "",
    visibilidad_publica: "",
    page: 1,
  });

  const [loading, setLoading] = useState(true);
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
    async function loadData() {
      if (!user) return;

      try {
        setLoading(true);
        setError("");

        const [productosRes, resumenRes] = await Promise.all([
          getAdminProductos({
            q: filters.q,
            estado_revision: filters.estado_revision,
            visibilidad_publica: filters.visibilidad_publica,
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

    loadData();
  }, [user, filters]);

  function updateFilter(name, value) {
    setFilters((current) => ({
      ...current,
      [name]: value,
      page: 1,
    }));
  }

  function clearFilters() {
    setFilters({
      q: "",
      estado_revision: "",
      visibilidad_publica: "",
      page: 1,
    });
  }

  function goToPage(page) {
    setFilters((current) => ({
      ...current,
      page,
    }));
  }

  return (
    <section className="admin-page">
      <div className="container">
        <div className="admin-topbar">
          <div>
            <span className="eyebrow">Mantenimiento de catálogo</span>
            <h1>Productos</h1>
            <p>{user ? `${user.nombre} · ${user.rol}` : "Cargando usuario..."}</p>
          </div>
        </div>

        <AdminModuleNav />

        <div className="admin-kpi-grid">
          <div className="admin-kpi-card">
            <div>
              <span>Total productos</span>
              <strong>{resumen?.total ?? 0}</strong>
            </div>
            <Box size={24} />
          </div>

          <div className="admin-kpi-card success">
            <div>
              <span>Correctos</span>
              <strong>{resumen?.ok ?? 0}</strong>
            </div>
            <CheckCircle2 size={24} />
          </div>

          <div className="admin-kpi-card warning">
            <div>
              <span>Sin código</span>
              <strong>{resumen?.sin_codigo_valido ?? 0}</strong>
            </div>
            <AlertTriangle size={24} />
          </div>

          <div className="admin-kpi-card accent">
            <div>
              <span>Sin datos base</span>
              <strong>
                {(resumen?.sin_descripcion ?? 0) +
                  (resumen?.sin_familia ?? 0) +
                  (resumen?.sin_armadora ?? 0)}
              </strong>
            </div>
            <ClipboardList size={24} />
          </div>
        </div>

        <div className="admin-toolbar admin-products-toolbar">
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
            onChange={(event) => updateFilter("visibilidad_publica", event.target.value)}
          >
            <option value="">Elige una opcion</option>
            <option value="VISIBLE">Visible en página pública</option>
            <option value="OCULTO">No visible en página pública</option>
          </select>

          <button type="button" className="admin-clean-button" onClick={clearFilters}>
            <RefreshCw size={15} />
            Limpiar
          </button>

          <strong>{totalText}</strong>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <div className="admin-products-list">
          {loading ? (
            <div className="admin-empty">Cargando productos...</div>
          ) : productos.length > 0 ? (
            productos.map((producto) => (
              <Link
                href={`/admin/productos/${producto.id}`}
                className="admin-product-card"
                key={producto.id}
              >
                <div className="admin-product-main">
                  <div className="admin-product-head">
                    <strong>
                      {producto.codigo_andyfers ||
                        producto.codigo_importacion ||
                        "SIN CÓDIGO"}
                    </strong>

                    <span
                      className={`admin-product-status status-${producto.estado_revision}`}
                    >
                      {producto.estado_revision}
                    </span>

                    <span
                      className={`admin-product-web ${Number(producto.visible_publico) === 1 ? "visible" : "hidden"
                        }`}
                    >
                      {Number(producto.visible_publico) === 1
                        ? "Visible público"
                        : `No visible: ${producto.motivo_visibilidad || "NO_VISIBLE"}`}
                    </span>
                  </div>

                  <h3>{producto.descripcion || "Producto sin descripción"}</h3>

                  <p>
                    {producto.familia || "Sin familia"} ·{" "}
                    {producto.armadora || "Sin armadora"} ·{" "}
                    {producto.categoria_nombre || "Sin categoría"}
                  </p>
                </div>

                <div className="admin-product-date">
                  {formatDate(producto.updated_at)}
                </div>
              </Link>
            ))
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