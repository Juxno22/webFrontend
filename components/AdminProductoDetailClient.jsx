"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  Car,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe2,
  Image,
  Loader2,
  PackageSearch,
  Save,
  ShieldCheck,
  ShoppingCart,
  Star,
  Trash2,
  WandSparkles,
} from "lucide-react";
import {
  deleteAdminProducto,
  getAdminProducto,
  getAdminProductoCategorias,
  updateAdminProducto,
} from "@/app/lib/adminApi";
import { useAdminAuth } from "@/app/hooks/useAdminAuth";
import AdminProductMediaManager from "@/components/AdminProductMediaManager";
import AdminProductOpsManager from "@/components/AdminProductOpsManager";
import AdminProductoFormFields, {
  buildProductoPayload,
  normalizeProductoToForm,
} from "@/components/AdminProductoFormFields";

function formatNumber(value) {
  return new Intl.NumberFormat("es-MX").format(Number(value || 0));
}

function boolNumber(value) {
  return Number(value) === 1;
}

function getProductCode(producto = {}) {
  return (
    producto.codigo_andyfers ||
    producto.codigo_importacion ||
    `Producto #${producto.id}`
  );
}

function getRevisionLabel(value) {
  switch (value) {
    case "OK":
      return "Correcto";
    case "SIN_CODIGO_VALIDO":
      return "Sin código válido";
    case "SIN_DESCRIPCION":
      return "Sin descripción";
    case "SIN_FAMILIA":
      return "Sin familia";
    case "SIN_ARMADORA":
      return "Sin armadora";
    default:
      return value || "Sin revisión";
  }
}

function showToast(message) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("andyfers_toast", {
      detail: { message },
    })
  );
}

export default function AdminProductoDetailClient({ id }) {
  const { checking } = useAdminAuth();

  const [producto, setProducto] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [form, setForm] = useState(normalizeProductoToForm({}));

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const productCode = useMemo(() => getProductCode(producto || {}), [producto]);

  const publicProductHref = useMemo(() => {
    if (!producto) return null;

    const code = producto.codigo_andyfers || producto.codigo_importacion;

    if (!code) return null;

    return `/producto/${encodeURIComponent(code)}`;
  }, [producto]);

  async function loadProduct() {
    try {
      setLoading(true);
      setError("");

      const [productoRes, categoriasRes] = await Promise.all([
        getAdminProducto(id),
        getAdminProductoCategorias(),
      ]);

      const data = productoRes.data;

      setProducto(data);
      setCategorias(categoriasRes.data || []);
      setForm(normalizeProductoToForm(data));
    } catch (err) {
      setError(err.message || "No se pudo cargar el producto.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!checking) {
      loadProduct();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking, id]);

  function updateForm(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function saveProduct(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = buildProductoPayload(form);

      await updateAdminProducto(id, payload);

      showToast("Producto actualizado correctamente.");

      await loadProduct();
    } catch (err) {
      setError(err.message || "No se pudo actualizar el producto.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProduct() {
    const confirmed = window.confirm(
      "¿Seguro que quieres desactivar este producto? No se borrará de la base, pero dejará de mostrarse en web."
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError("");

      await deleteAdminProducto(id);

      showToast("Producto desactivado correctamente.");

      window.location.href = "/admin/productos";
    } catch (err) {
      setError(err.message || "No se pudo desactivar el producto.");
    } finally {
      setDeleting(false);
    }
  }

  if (checking || loading) {
    return (
      <section className="admin-workspace">
        <div className="admin-loading-panel">
          <Loader2 size={34} className="admin-spin" />
          <strong>Cargando producto...</strong>
        </div>
      </section>
    );
  }

  if (error && !producto) {
    return (
      <section className="admin-workspace">
        <div className="admin-loading-panel">
          <AlertTriangle size={34} />
          <strong>No se pudo cargar el producto.</strong>
          <p>{error}</p>

          <Link href="/admin/productos" className="admin-primary-button">
            Volver a productos
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-workspace admin-product-detail-os">
      <div className="admin-page-hero">
        <div>
          <span>Edición de producto</span>
          <h1>{productCode}</h1>
          <p>
            Mantén datos comerciales, visibilidad web, multimedia, cruces,
            atributos y aplicaciones vehiculares desde una sola pantalla.
          </p>
        </div>

        <div className="admin-page-hero-actions">
          <Link href="/admin/productos" className="admin-secondary-button">
            <ArrowLeft size={18} />
            Volver
          </Link>

          <Link href="/admin/ecommerce" className="admin-secondary-button">
            <ShoppingCart size={18} />
            Inventario web
          </Link>

          {publicProductHref && (
            <Link
              href={publicProductHref}
              target="_blank"
              className="admin-primary-button"
            >
              <Eye size={18} />
              Ver público
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="admin-alert">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      <section className="admin-product-detail-summary">
        <article className="admin-kpi-card">
          <ShieldCheck size={22} />
          <span>Revisión</span>
          <strong>{getRevisionLabel(producto.estado_revision)}</strong>
          <small>{producto.estado_revision || "SIN_REVISION"}</small>
        </article>

        <article className="admin-kpi-card">
          {boolNumber(producto.visible_publico) ? (
            <Eye size={22} />
          ) : (
            <EyeOff size={22} />
          )}
          <span>Visibilidad pública</span>
          <strong>
            {boolNumber(producto.visible_publico) ? "Visible" : "No visible"}
          </strong>
          <small>{producto.motivo_visibilidad || "SIN_ESTADO"}</small>
        </article>

        <article className="admin-kpi-card">
          <Image size={22} />
          <span>Multimedia</span>
          <strong>{formatNumber(producto.multimedia?.length)}</strong>
          <small>Imágenes registradas</small>
        </article>

        <article className="admin-kpi-card">
          <Car size={22} />
          <span>Aplicaciones</span>
          <strong>{formatNumber(producto.aplicaciones?.length)}</strong>
          <small>Vehículos relacionados</small>
        </article>

        <article className="admin-kpi-card">
          <PackageSearch size={22} />
          <span>Cruces</span>
          <strong>{formatNumber(producto.cruces?.length)}</strong>
          <small>Equivalencias</small>
        </article>

        <article className="admin-kpi-card">
          <Boxes size={22} />
          <span>Atributos</span>
          <strong>{formatNumber(producto.atributos?.length)}</strong>
          <small>Datos técnicos</small>
        </article>
      </section>

      <div className="admin-product-detail-layout-os">
        <main className="admin-product-detail-main-os">
          <form className="admin-panel admin-product-edit-form-os" onSubmit={saveProduct}>
            <div className="admin-panel-head">
              <div>
                <span>Mantenimiento</span>
                <h2>Datos principales</h2>
                <p>
                  Información base que se usa en catálogo público, búsquedas,
                  cotizaciones y ecommerce.
                </p>
              </div>

              <button
                type="button"
                className="admin-danger-button"
                onClick={handleDeleteProduct}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 size={16} className="admin-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                {deleting ? "Desactivando..." : "Desactivar"}
              </button>
            </div>

            <AdminProductoFormFields
              form={form}
              categorias={categorias}
              updateForm={updateForm}
            />

            <button className="admin-primary-button admin-product-save-os" disabled={saving}>
              {saving ? (
                <Loader2 size={17} className="admin-spin" />
              ) : (
                <Save size={17} />
              )}
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>

          <AdminProductOpsManager
            productoId={producto.id}
            atributos={producto.atributos || []}
            cruces={producto.cruces || []}
            aplicaciones={producto.aplicaciones || []}
            onRefresh={loadProduct}
          />

          <AdminProductMediaManager
            productoId={producto.id}
            multimedia={producto.multimedia || []}
            onRefresh={loadProduct}
          />
        </main>

        <aside className="admin-product-detail-side-os">
          <article className="admin-panel">
            <div className="admin-panel-head">
              <div>
                <span>Estado web</span>
                <h2>Publicación</h2>
                <p>Resumen rápido de cómo se comporta este producto en web.</p>
              </div>
            </div>

            <div className="admin-product-state-list-os">
              <div>
                <Globe2 size={18} />
                <span>Activo web</span>
                <strong>{boolNumber(producto.activo_web) ? "Sí" : "No"}</strong>
              </div>

              <div>
                <Eye size={18} />
                <span>Visible catálogo</span>
                <strong>
                  {boolNumber(producto.visible_catalogo) ? "Sí" : "No"}
                </strong>
              </div>

              <div>
                <Star size={18} />
                <span>Destacado</span>
                <strong>{boolNumber(producto.destacado) ? "Sí" : "No"}</strong>
              </div>

              <div>
                <WandSparkles size={18} />
                <span>Nuevo web</span>
                <strong>{boolNumber(producto.nuevo_web) ? "Sí" : "No"}</strong>
              </div>

              <div>
                <CheckCircle2 size={18} />
                <span>Activo interno</span>
                <strong>{boolNumber(producto.activo) ? "Sí" : "No"}</strong>
              </div>
            </div>
          </article>

          <article className="admin-panel">
            <div className="admin-panel-head">
              <div>
                <span>Producto</span>
                <h2>Resumen comercial</h2>
              </div>
            </div>

            <div className="admin-product-commercial-os">
              <div>
                <span>Código Andyfers</span>
                <strong>{producto.codigo_andyfers || "—"}</strong>
              </div>

              <div>
                <span>Código importación</span>
                <strong>{producto.codigo_importacion || "—"}</strong>
              </div>

              <div>
                <span>Categoría</span>
                <strong>{producto.categoria_nombre || "—"}</strong>
              </div>

              <div>
                <span>Familia</span>
                <strong>{producto.familia || "—"}</strong>
              </div>

              <div>
                <span>Armadora</span>
                <strong>{producto.armadora || "—"}</strong>
              </div>

              <div>
                <span>Marca producto</span>
                <strong>{producto.marca_producto || "—"}</strong>
              </div>
            </div>
          </article>

          <article className="admin-panel admin-product-help-os">
            <WandSparkles size={26} />
            <span>Flujo recomendado</span>
            <h2>Antes de venderlo</h2>
            <p>
              Confirma código, descripción, multimedia, activo web, visible en
              catálogo y después carga existencia/precio web desde Inventario
              ecommerce.
            </p>

            <Link href="/admin/ecommerce" className="admin-secondary-button">
              Ir a inventario web
            </Link>
          </article>
        </aside>
      </div>
    </section>
  );
}