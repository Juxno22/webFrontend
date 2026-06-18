"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Boxes, Filter, Plus, Wrench, X, SlidersHorizontal } from "lucide-react";
import {
  getArmadoras,
  getCategorias,
  getFamilias,
  getProductos,
} from "../app/lib/api";
import Link from "next/link";
import { addToQuoteCart } from "@/app/lib/quoteCart";

const defaultFilters = {
  q: "",
  categoria: "",
  familia: "",
  armadora: "",
  anio: "",
  marca_auto: "",
  modelo_auto: "",
  motor: "",
  linea: "",
  page: 1,
  limit: 12,
};

function getFiltersFromSearchParams(searchParams) {
  return {
    q: searchParams.get("q") || "",
    categoria: searchParams.get("categoria") || "",
    familia: searchParams.get("familia") || "",
    armadora: searchParams.get("armadora") || "",
    anio: searchParams.get("anio") || "",
    marca_auto: searchParams.get("marca_auto") || "",
    modelo_auto: searchParams.get("modelo_auto") || "",
    motor: searchParams.get("motor") || "",
    linea: searchParams.get("linea") || "",
    page: Number(searchParams.get("page") || 1),
    limit: 12,
  };
}

function isValidCode(value) {
  if (!value) return false;

  const clean = String(value).trim().toUpperCase();

  return ![
    "#N/A",
    "N/A",
    "NA",
    "ND",
    "N.D.",
    "SIN CODIGO",
    "SIN CÓDIGO",
    "NULL",
    "0",
  ].includes(clean);
}

function getProductCode(producto) {
  if (isValidCode(producto.codigo_andyfers)) return producto.codigo_andyfers;
  if (isValidCode(producto.codigo_importacion)) return producto.codigo_importacion;

  return null;
}

export default function CatalogClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialFilters = useMemo(
    () => getFiltersFromSearchParams(searchParams),
    [searchParams]
  );

  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  const [categorias, setCategorias] = useState([]);
  const [familias, setFamilias] = useState([]);
  const [armadoras, setArmadoras] = useState([]);

  const [productos, setProductos] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [filtersOpen, setFiltersOpen] = useState(false);

  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState("");

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      appliedFilters.q ||
      appliedFilters.categoria ||
      appliedFilters.familia ||
      appliedFilters.armadora ||
      appliedFilters.anio ||
      appliedFilters.marca_auto ||
      appliedFilters.modelo_auto ||
      appliedFilters.motor ||
      appliedFilters.linea
    );
  }, [appliedFilters]);

  useEffect(() => {
    const nextFilters = getFiltersFromSearchParams(searchParams);
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
  }, [searchParams]);

  useEffect(() => {
    async function loadFilters() {
      try {
        setLoadingFilters(true);

        const [categoriasRes, familiasRes, armadorasRes] = await Promise.all([
          getCategorias(),
          getFamilias(),
          getArmadoras(),
        ]);

        setCategorias(categoriasRes.data || []);
        setFamilias(familiasRes.data || []);
        setArmadoras(armadorasRes.data || []);
      } catch (err) {
        setError(err.message || "No se pudieron cargar los filtros.");
      } finally {
        setLoadingFilters(false);
      }
    }

    loadFilters();
  }, []);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoadingProducts(true);
        setError("");

        const response = await getProductos(appliedFilters);

        setProductos(response.data || []);
        setPagination(response.pagination || null);
      } catch (err) {
        setError(err.message || "No se pudieron cargar productos.");
      } finally {
        setLoadingProducts(false);
      }
    }

    loadProducts();
  }, [appliedFilters]);

  function updateFilter(name, value) {
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function buildCatalogUrl(nextFilters) {
    const params = new URLSearchParams();

    if (nextFilters.q) params.set("q", nextFilters.q);
    if (nextFilters.categoria) params.set("categoria", nextFilters.categoria);
    if (nextFilters.familia) params.set("familia", nextFilters.familia);
    if (nextFilters.armadora) params.set("armadora", nextFilters.armadora);
    if (nextFilters.anio) params.set("anio", nextFilters.anio);
    if (nextFilters.marca_auto) params.set("marca_auto", nextFilters.marca_auto);
    if (nextFilters.modelo_auto) params.set("modelo_auto", nextFilters.modelo_auto);
    if (nextFilters.motor) params.set("motor", nextFilters.motor);
    if (nextFilters.linea) params.set("linea", nextFilters.linea);

    if (nextFilters.page && Number(nextFilters.page) > 1) {
      params.set("page", String(nextFilters.page));
    }

    const query = params.toString();

    return query ? `/catalogo?${query}` : "/catalogo";
  }

  function applyFilters(event) {
    event?.preventDefault();

    const nextFilters = {
      ...filters,
      page: 1,
    };

    router.push(buildCatalogUrl(nextFilters));
    setFiltersOpen(false);
  }

  function clearFilters() {
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setFiltersOpen(false);
    router.push("/catalogo");
  }

  function goToPage(nextPage) {
    const nextFilters = {
      ...appliedFilters,
      page: nextPage,
    };

    router.push(buildCatalogUrl(nextFilters));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function addProduct(producto) {
    const codigoVisible = getProductCode(producto) || "Producto";

    addToQuoteCart(producto);

    window.dispatchEvent(
      new CustomEvent("andyfers_toast", {
        detail: {
          message: `${codigoVisible} agregado a cotización`,
        },
      })
    );
  }

  return (
    <section className="catalog-results">
      <div className="catalog-results-toolbar">
        <div className="catalog-results-heading">
          <h2>
            {hasActiveFilters ? "Resultados encontrados" : "Productos disponibles"}
          </h2>

          <div className="active-filter-chips">
            {appliedFilters.q && <span>“{appliedFilters.q}”</span>}
            {appliedFilters.anio && <span>Año: {appliedFilters.anio}</span>}
            {appliedFilters.marca_auto && <span>Marca: {appliedFilters.marca_auto}</span>}
            {appliedFilters.modelo_auto && <span>Modelo: {appliedFilters.modelo_auto}</span>}
            {appliedFilters.motor && <span>Motor: {appliedFilters.motor}</span>}
            {appliedFilters.linea && <span>Línea: {appliedFilters.linea}</span>}
            {appliedFilters.categoria && <span>Categoría: {appliedFilters.categoria}</span>}
            {appliedFilters.familia && <span>Familia: {appliedFilters.familia}</span>}
            {appliedFilters.armadora && <span>Armadora: {appliedFilters.armadora}</span>}
          </div>
        </div>

        <div className="catalog-toolbar-actions">
          {pagination && (
            <p>
              {pagination.total} producto{pagination.total === 1 ? "" : "s"}
            </p>
          )}

          <div className="filters-dropdown-wrap">
            <button
              type="button"
              className="filters-dropdown-button"
              onClick={() => setFiltersOpen((current) => !current)}
            >
              <SlidersHorizontal size={17} />
              Filtros
            </button>

            {filtersOpen && (
              <form className="filters-dropdown-panel" onSubmit={applyFilters}>
                <div className="filters-dropdown-title">
                  <Filter size={17} />
                  <strong>Refinar resultados</strong>
                </div>

                <label>
                  Categoría
                  <select
                    value={filters.categoria}
                    onChange={(event) =>
                      updateFilter("categoria", event.target.value)
                    }
                    disabled={loadingFilters}
                  >
                    <option value="">Todas</option>
                    {categorias.map((categoria) => (
                      <option key={categoria.id} value={categoria.nombre}>
                        {categoria.nombre} ({categoria.total_productos})
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Familia
                  <select
                    value={filters.familia}
                    onChange={(event) =>
                      updateFilter("familia", event.target.value)
                    }
                    disabled={loadingFilters}
                  >
                    <option value="">Todas</option>
                    {familias.map((familia) => (
                      <option key={familia.familia} value={familia.familia}>
                        {familia.familia} ({familia.total_productos})
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Armadora
                  <select
                    value={filters.armadora}
                    onChange={(event) =>
                      updateFilter("armadora", event.target.value)
                    }
                    disabled={loadingFilters}
                  >
                    <option value="">Todas</option>
                    {armadoras.map((armadora) => (
                      <option key={armadora.armadora} value={armadora.armadora}>
                        {armadora.armadora} ({armadora.total_productos})
                      </option>
                    ))}
                  </select>
                </label>

                <button className="btn-primary full" type="submit">
                  Aplicar filtros
                </button>

                {hasActiveFilters && (
                  <button className="btn-clear" type="button" onClick={clearFilters}>
                    <X size={16} />
                    Limpiar todo
                  </button>
                )}
              </form>
            )}
          </div>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {loadingProducts ? (
        <div className="loading-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="product-skeleton" key={index} />
          ))}
        </div>
      ) : productos.length > 0 ? (
        <>
          <div className="catalog-product-grid">
            {productos.map((producto) => {
              const codigoDetalle = getProductCode(producto);
              const codigoVisible = codigoDetalle || "Sin código";

              return (
                <article className="catalog-product-card" key={producto.id}>
                  <div className="catalog-product-media">
                    <span className="catalog-product-code">{codigoVisible}</span>

                    <div className="catalog-product-image-placeholder">
                      <Wrench size={46} />
                    </div>
                  </div>

                  <div className="catalog-product-body">
                    <div className="catalog-product-tags">
                      {producto.familia && <span>{producto.familia}</span>}
                      {producto.categoria && <span>{producto.categoria}</span>}
                    </div>

                    <h3>{producto.descripcion}</h3>

                    <div className="catalog-product-crosses">
                      <Boxes size={16} />
                      <span>{Number(producto.total_cruces || 0)} cruces</span>
                    </div>

                    <div className="product-warning">
                      Compatibilidad y disponibilidad sujetas a validación.
                    </div>

                    <div className="catalog-product-actions">
                      {codigoDetalle ? (
                        <Link
                          href={`/producto/${encodeURIComponent(codigoDetalle)}`}
                          className="btn-card-secondary"
                        >
                          Ver detalle
                        </Link>
                      ) : (
                        <button className="btn-card-secondary" type="button" disabled>
                          Sin código
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn-card-primary"
                        onClick={() => addProduct(producto)}
                      >
                        <Plus size={16} />
                        Cotizar
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {pagination && pagination.total_pages > 1 && (
            <div className="pagination">
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
        </>
      ) : (
        <div className="empty-state">
          <h3>No encontramos productos con esos filtros.</h3>
          <p>
            Prueba buscando por código, familia, armadora, vehículo o número de
            cruce.
          </p>
          <button className="btn-primary" onClick={clearFilters}>
            Ver todos los productos
          </button>
        </div>
      )}
    </section>
  );
}