"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  Loader2,
  Save,
  ShieldCheck,
  ShoppingCart,
  WandSparkles,
} from "lucide-react";
import {
  createAdminProducto,
  getAdminProductoCategorias,
} from "@/app/lib/adminApi";
import { useAdminAuth } from "@/app/hooks/useAdminAuth";
import AdminProductoFormFields, {
  buildProductoPayload,
  emptyProductForm,
} from "@/components/AdminProductoFormFields";

function showToast(message) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("andyfers_toast", {
      detail: { message },
    })
  );
}

export default function AdminProductoCreateClient() {
  const router = useRouter();
  const { checking } = useAdminAuth();

  const [form, setForm] = useState(emptyProductForm);
  const [categorias, setCategorias] = useState([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadCatalogs() {
    try {
      setLoadingCatalogs(true);
      setError("");

      const response = await getAdminProductoCategorias();

      setCategorias(response.data || []);
    } catch (err) {
      setError(err.message || "No se pudieron cargar los catálogos.");
    } finally {
      setLoadingCatalogs(false);
    }
  }

  useEffect(() => {
    if (!checking) {
      loadCatalogs();
    }
  }, [checking]);

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
      const response = await createAdminProducto(payload);
      const newId = response.data?.id;

      showToast("Producto creado correctamente.");

      if (newId) {
        router.push(`/admin/productos/${newId}`);
      } else {
        router.push("/admin/productos");
      }
    } catch (err) {
      setError(err.message || "No se pudo crear el producto.");
    } finally {
      setSaving(false);
    }
  }

  if (checking) return null;

  return (
    <section className="admin-workspace admin-product-create-os">
      <div className="admin-page-hero">
        <div>
          <span>Alta manual</span>
          <h1>Nuevo producto</h1>
          <p>
            Captura un producto nuevo para catálogo público, cotizaciones y
            futura venta ecommerce. Después podrás agregar multimedia, cruces,
            atributos, aplicaciones e inventario web.
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
        </div>
      </div>

      {error && (
        <div className="admin-alert">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      <section className="admin-kpi-grid admin-product-create-kpis">
        <article className="admin-kpi-card">
          <Boxes size={22} />
          <span>Paso 1</span>
          <strong>Datos base</strong>
          <small>Código, descripción, familia y categoría</small>
        </article>

        <article className="admin-kpi-card">
          <ShieldCheck size={22} />
          <span>Paso 2</span>
          <strong>Visibilidad</strong>
          <small>Activo web, catálogo, destacado y nuevo</small>
        </article>

        <article className="admin-kpi-card">
          <WandSparkles size={22} />
          <span>Paso 3</span>
          <strong>Enriquecer</strong>
          <small>Multimedia, cruces y aplicaciones</small>
        </article>
      </section>

      <div className="admin-product-create-layout-os">
        <form
          className="admin-panel admin-product-edit-form-os"
          onSubmit={saveProduct}
        >
          <div className="admin-panel-head">
            <div>
              <span>Producto</span>
              <h2>Datos principales</h2>
              <p>
                Esta información alimenta catálogo público, buscador,
                cotizaciones y módulos ecommerce.
              </p>
            </div>
          </div>

          {loadingCatalogs ? (
            <div className="admin-loading-panel">
              <Loader2 size={34} className="admin-spin" />
              <strong>Cargando catálogos...</strong>
            </div>
          ) : (
            <AdminProductoFormFields
              form={form}
              categorias={categorias}
              updateForm={updateForm}
            />
          )}

          <button
            className="admin-primary-button admin-product-save-os"
            disabled={saving || loadingCatalogs}
          >
            {saving ? (
              <Loader2 size={17} className="admin-spin" />
            ) : (
              <Save size={17} />
            )}
            {saving ? "Creando..." : "Crear producto"}
          </button>
        </form>

        <aside className="admin-panel admin-product-help-os">
          <WandSparkles size={26} />
          <span>Flujo recomendado</span>
          <h2>Después de crearlo</h2>
          <p>
            Primero guarda el producto. Luego entra al detalle para agregar
            imágenes, aplicaciones, cruces y atributos. Finalmente carga stock y
            precio web desde Inventario ecommerce.
          </p>

          <Link href="/admin/productos" className="admin-secondary-button">
            Ver productos
          </Link>
        </aside>
      </div>
    </section>
  );
}