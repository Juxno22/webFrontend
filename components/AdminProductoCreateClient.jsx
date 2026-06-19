"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import AdminModuleNav from "@/components/AdminModuleNav";
import AdminProductoFormFields, {
  buildProductoPayload,
  emptyProductForm,
} from "@/components/AdminProductoFormFields";
import {
  createAdminProducto,
  getAdminProductoCategorias,
  getAdminUser,
} from "@/app/lib/adminApi";

export default function AdminProductoCreateClient() {
  const router = useRouter();

  const [form, setForm] = useState(emptyProductForm);
  const [categorias, setCategorias] = useState([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = getAdminUser();

    if (!user) {
      router.push("/admin/login");
      return;
    }

    loadCatalogs();
  }, [router]);

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

      window.dispatchEvent(
        new CustomEvent("andyfers_toast", {
          detail: {
            message: "Producto creado correctamente.",
          },
        })
      );

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
            <span className="eyebrow">Nuevo producto</span>
            <h1>Alta manual de producto</h1>
            <p>
              Captura datos base, visibilidad pública y configuración comercial.
            </p>
          </div>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <form className="admin-panel admin-product-form" onSubmit={saveProduct}>
          <h2>Datos principales</h2>

          {loadingCatalogs ? (
            <div className="admin-empty-mini">Cargando catálogos...</div>
          ) : (
            <AdminProductoFormFields
              form={form}
              categorias={categorias}
              updateForm={updateForm}
            />
          )}

          <button className="btn-primary full" disabled={saving || loadingCatalogs}>
            <Save size={17} />
            {saving ? "Creando..." : "Crear producto"}
          </button>
        </form>
      </div>
    </section>
  );
}