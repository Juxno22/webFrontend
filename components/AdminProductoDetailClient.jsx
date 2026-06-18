"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import {
    getAdminProducto,
    getAdminUser,
    updateAdminProducto,
} from "../app/lib/adminApi";
import AdminModuleNav from "@/components/AdminModuleNav";

export default function AdminProductoDetailClient({ id }) {
    const router = useRouter();

    const [producto, setProducto] = useState(null);
    const [form, setForm] = useState({
        codigo_andyfers: "",
        codigo_importacion: "",
        familia: "",
        armadora: "",
        descripcion: "",
        unidad_medida: "PZA",
        prioridad_ia: 50,
        activo_web: 1,
        activo: 1,
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    async function loadProduct() {
        try {
            setLoading(true);
            setError("");

            const response = await getAdminProducto(id);
            const data = response.data;

            setProducto(data);
            setForm({
                codigo_andyfers: data.codigo_andyfers || "",
                codigo_importacion: data.codigo_importacion || "",
                familia: data.familia || "",
                armadora: data.armadora || "",
                descripcion: data.descripcion || "",
                unidad_medida: data.unidad_medida || "PZA",
                prioridad_ia: data.prioridad_ia || 50,
                activo_web: Number(data.activo_web) === 1 ? 1 : 0,
                activo: Number(data.activo) === 1 ? 1 : 0,
            });
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

            await updateAdminProducto(id, form);

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
                        <p>{producto.estado_revision}</p>
                    </div>

                    <span className={`admin-product-status status-${producto.estado_revision}`}>
                        {producto.estado_revision}
                    </span>
                </div>

                {error && <div className="alert-error">{error}</div>}

                <div className="admin-product-edit-layout">
                    <form className="admin-panel admin-product-form" onSubmit={saveProduct}>
                        <h2>Datos principales</h2>

                        <div className="admin-form-grid">
                            <label>
                                Código Andyfers
                                <input
                                    value={form.codigo_andyfers}
                                    onChange={(event) =>
                                        updateForm("codigo_andyfers", event.target.value)
                                    }
                                    placeholder="Ej. AP131114"
                                />
                            </label>

                            <label>
                                Código importación
                                <input
                                    value={form.codigo_importacion}
                                    onChange={(event) =>
                                        updateForm("codigo_importacion", event.target.value)
                                    }
                                    placeholder="Ej. 4KAR-002"
                                />
                            </label>

                            <label>
                                Familia
                                <input
                                    value={form.familia}
                                    onChange={(event) => updateForm("familia", event.target.value)}
                                    placeholder="Ej. POLEAS"
                                />
                            </label>

                            <label>
                                Armadora
                                <input
                                    value={form.armadora}
                                    onChange={(event) => updateForm("armadora", event.target.value)}
                                    placeholder="Ej. CHEVROLET"
                                />
                            </label>

                            <label>
                                Unidad medida
                                <input
                                    value={form.unidad_medida}
                                    onChange={(event) =>
                                        updateForm("unidad_medida", event.target.value)
                                    }
                                    placeholder="PZA"
                                />
                            </label>

                            <label>
                                Prioridad IA
                                <input
                                    type="number"
                                    value={form.prioridad_ia}
                                    onChange={(event) =>
                                        updateForm("prioridad_ia", event.target.value)
                                    }
                                    min="0"
                                    max="100"
                                />
                            </label>
                        </div>

                        <label>
                            Descripción
                            <textarea
                                value={form.descripcion}
                                onChange={(event) => updateForm("descripcion", event.target.value)}
                                rows={5}
                            />
                        </label>

                        <div className="admin-check-grid">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={Number(form.activo_web) === 1}
                                    onChange={(event) =>
                                        updateForm("activo_web", event.target.checked ? 1 : 0)
                                    }
                                />
                                Mostrar en página pública
                            </label>

                            <label>
                                <input
                                    type="checkbox"
                                    checked={Number(form.activo) === 1}
                                    onChange={(event) =>
                                        updateForm("activo", event.target.checked ? 1 : 0)
                                    }
                                />
                                Producto activo internamente
                            </label>
                        </div>

                        <div className="admin-field-note">
                            Para aparecer en catálogo público, el producto debe estar activo, visible en
                            página pública y tener código válido.
                        </div>

                        <button className="btn-primary full" disabled={saving}>
                            <Save size={17} />
                            {saving ? "Guardando..." : "Guardar cambios"}
                        </button>
                    </form>

                    <aside className="admin-detail-side">
                        <article className="admin-panel">
                            <h2>Multimedia</h2>

                            {producto.multimedia?.length > 0 ? (
                                <div className="admin-multimedia-grid">
                                    {producto.multimedia.map((item) => (
                                        <div
                                            className={`admin-multimedia-item ${Number(item.activo) === 1 ? "is-active" : "is-inactive"
                                                }`}
                                            key={item.id}
                                        >
                                            {item.tipo === "IMAGEN" ? (
                                                <img
                                                    src={item.thumbnail_url || item.secure_url}
                                                    alt={item.nombre_archivo_original || "Imagen de producto"}
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="admin-multimedia-video">VIDEO</div>
                                            )}

                                            <div>
                                                <strong>{item.rol}</strong>
                                                <span>{item.nombre_archivo_original}</span>
                                                <small>Orden {item.orden}</small>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="admin-empty-mini">
                                    Sin multimedia cargada.
                                </div>
                            )}
                        </article>
                        <article className="admin-panel">
                            <h2>Atributos</h2>

                            {producto.atributos?.length > 0 ? (
                                <div className="admin-mini-list">
                                    {producto.atributos.map((item) => (
                                        <div key={item.id}>
                                            <strong>{item.atributo}</strong>
                                            <span>{item.valor_texto}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="admin-empty-mini">Sin atributos registrados.</div>
                            )}
                        </article>

                        <article className="admin-panel">
                            <h2>Cruces</h2>

                            {producto.cruces?.length > 0 ? (
                                <div className="admin-mini-list">
                                    {producto.cruces.map((item) => (
                                        <div key={item.id}>
                                            <strong>{item.marca}</strong>
                                            <span>{item.numero_parte}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="admin-empty-mini">Sin cruces registrados.</div>
                            )}
                        </article>
                    </aside>
                </div>
            </div>
        </section>
    );
}