"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import {
  deleteAdminProducto,
  getAdminProducto,
  getAdminProductoCategorias,
  getAdminUser,
  updateAdminProducto,
} from "../app/lib/adminApi";
import AdminModuleNav from "@/components/AdminModuleNav";
import AdminProductMediaManager from "@/components/AdminProductMediaManager";
import AdminProductOpsManager from "./AdminProductOpsManager";
import AdminProductoFormFields, {
  buildProductoPayload,
  normalizeProductoToForm,
} from "@/components/AdminProductoFormFields";

export default function AdminProductoDetailClient({ id }) {
  const router = useRouter();

  const [producto, setProducto] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [form, setForm] = useState(normalizeProductoToForm({}));

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

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
    const user = getAdminUser();

    if (!user) {
      router.push("/admin/login");
      return;
    }

    loadProduct();
  }, [id, router]);

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

      window.dispatchEvent(
        new CustomEvent("andyfers_toast", {
          detail: {
            message: "Producto actualizado correctamente.",
          },
        })
      );

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

      window.dispatchEvent(
        new CustomEvent("andyfers_toast", {
          detail: {
            message: "Producto desactivado correctamente.",
          },
        })
      );

      router.push("/admin/productos");
    } catch (err) {
      setError(err.message || "No se pudo desactivar el producto.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <section className="admin-page">
        <div className="container">
          <div className="admin-empty">Cargando producto...</div>
        </div>
      </section>
    );
  }

  if (error && !producto) {
    return (
      <section className="admin-page">
        <div className="container">
          <div className="admin-empty">
            <h1>No se pudo cargar</h1>
            <p>{error}</p>
            <Link href="/admin/productos" className="btn-primary">
              Volver
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <div className="container">
        <AdminModuleNav />

        <Link href="/admin/productos" className="admin-back">
          <ArrowLeft size={17} />
          Volver a productos
        </Link>

        <div className="admin-detail-header">
          <div>
            <span className="eyebrow">Editar producto</span>
            <h1>
              {producto.codigo_andyfers ||
                producto.codigo_importacion ||
                `Producto #${producto.id}`}
            </h1>
            <p>
              {producto.categoria_nombre || "Sin categoría"} ·{" "}
              {producto.estado_revision || "SIN_REVISION"}
            </p>
          </div>

          <div className="admin-detail-status-stack">
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
        </div>

        {error && <div className="alert-error">{error}</div>}

        <div className="admin-product-edit-layout">
          <form className="admin-panel admin-product-form" onSubmit={saveProduct}>
            <div className="admin-panel-title-row">
              <div>
                <span className="eyebrow">Mantenimiento</span>
                <h2>Datos principales</h2>
              </div>

              <button
                type="button"
                className="admin-small-action danger"
                onClick={handleDeleteProduct}
                disabled={deleting}
              >
                <Trash2 size={16} />
                {deleting ? "Desactivando..." : "Desactivar"}
              </button>
            </div>

            <AdminProductoFormFields
              form={form}
              categorias={categorias}
              updateForm={updateForm}
            />

            <button className="btn-primary full" disabled={saving}>
              <Save size={17} />
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>

          <aside className="admin-detail-side">
            <article className="admin-panel">
              <h2>Resumen operativo</h2>

              <div className="admin-mini-list">
                <div>
                  <strong>{producto.atributos?.length || 0}</strong>
                  <span>Atributos registrados</span>
                </div>

                <div>
                  <strong>{producto.cruces?.length || 0}</strong>
                  <span>Cruces registrados</span>
                </div>

                <div>
                  <strong>{producto.aplicaciones?.length || 0}</strong>
                  <span>Aplicaciones vehiculares</span>
                </div>

                <div>
                  <strong>{producto.multimedia?.length || 0}</strong>
                  <span>Multimedia registrada</span>
                </div>
              </div>
            </article>

            <article className="admin-panel">
              <h2>Visibilidad pública</h2>

              <div className="admin-mini-list">
                <div>
                  <strong>
                    {Number(producto.visible_publico) === 1 ? "Visible" : "No visible"}
                  </strong>
                  <span>{producto.motivo_visibilidad || "SIN_ESTADO"}</span>
                </div>

                <div>
                  <strong>{producto.estado_revision || "SIN_REVISION"}</strong>
                  <span>Estado de revisión</span>
                </div>
              </div>
            </article>
          </aside>
        </div>

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
      </div>
    </section>
  );
}