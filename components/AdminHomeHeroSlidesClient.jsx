"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Eye,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  XCircle,
} from "lucide-react";
import AdminModuleNav from "@/components/AdminModuleNav";
import {
  createAdminHomeHeroSlide,
  deleteAdminHomeHeroSlide,
  getAdminHomeHeroSlides,
  getAdminUser,
  updateAdminHomeHeroSlide,
} from "@/app/lib/adminApi";

const emptyForm = {
  id: null,
  titulo: "",
  subtitulo: "",
  etiqueta: "Promoción",
  texto_boton: "Ver catálogo",
  url_boton: "/catalogo",
  cloudinary_public_id: "",
  secure_url: "",
  thumbnail_url: "",
  orden: 0,
  activo: 1,
  fecha_inicio: "",
  fecha_fin: "",
};

function toDatetimeLocal(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
}

function normalizeSlideToForm(slide) {
  return {
    id: slide.id,
    titulo: slide.titulo || "",
    subtitulo: slide.subtitulo || "",
    etiqueta: slide.etiqueta || "",
    texto_boton: slide.texto_boton || "",
    url_boton: slide.url_boton || "",
    cloudinary_public_id: slide.cloudinary_public_id || "",
    secure_url: slide.secure_url || "",
    thumbnail_url: slide.thumbnail_url || "",
    orden: Number(slide.orden || 0),
    activo: Number(slide.activo) === 1 ? 1 : 0,
    fecha_inicio: toDatetimeLocal(slide.fecha_inicio),
    fecha_fin: toDatetimeLocal(slide.fecha_fin),
  };
}

function buildPayload(form) {
  return {
    titulo: form.titulo,
    subtitulo: form.subtitulo,
    etiqueta: form.etiqueta,
    texto_boton: form.texto_boton,
    url_boton: form.url_boton,
    cloudinary_public_id: form.cloudinary_public_id,
    secure_url: form.secure_url,
    thumbnail_url: form.thumbnail_url,
    orden: Number(form.orden || 0),
    activo: Number(form.activo) === 1 ? 1 : 0,
    fecha_inicio: form.fecha_inicio || null,
    fecha_fin: form.fecha_fin || null,
  };
}

function formatDate(value) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AdminHomeHeroSlidesClient() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [slides, setSlides] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const activeCount = useMemo(() => {
    return slides.filter((slide) => Number(slide.activo) === 1).length;
  }, [slides]);

  const isEditing = Boolean(form.id);

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

    loadSlides();
  }, [user]);

  async function loadSlides() {
    try {
      setLoading(true);
      setError("");

      const response = await getAdminHomeHeroSlides();

      setSlides(response.data || []);
    } catch (err) {
      setError(err.message || "No se pudieron cargar los flyers.");
    } finally {
      setLoading(false);
    }
  }

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function startCreate() {
    setForm({
      ...emptyForm,
      orden: slides.length + 1,
    });
    setMessage("");
    setError("");
  }

  function startEdit(slide) {
    setForm(normalizeSlideToForm(slide));
    setMessage("");
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = buildPayload(form);

      if (isEditing) {
        await updateAdminHomeHeroSlide(form.id, payload);
        setMessage("Flyer actualizado correctamente.");
      } else {
        await createAdminHomeHeroSlide(payload);
        setMessage("Flyer creado correctamente.");
      }

      await loadSlides();
      setForm(emptyForm);
    } catch (err) {
      setError(err.message || "No se pudo guardar el flyer.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleSlide(slide) {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      await updateAdminHomeHeroSlide(slide.id, {
        ...normalizeSlideToForm(slide),
        activo: Number(slide.activo) === 1 ? 0 : 1,
      });

      setMessage(
        Number(slide.activo) === 1
          ? "Flyer desactivado correctamente."
          : "Flyer activado correctamente."
      );

      await loadSlides();
    } catch (err) {
      setError(err.message || "No se pudo cambiar el estado del flyer.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(slide) {
    const confirmDelete = window.confirm(
      "¿Seguro que quieres desactivar este flyer del home?"
    );

    if (!confirmDelete) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await deleteAdminHomeHeroSlide(slide.id);
      setMessage("Flyer desactivado correctamente.");
      await loadSlides();
    } catch (err) {
      setError(err.message || "No se pudo desactivar el flyer.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-page">
      <div className="container">
        <div className="admin-topbar">
          <div>
            <span className="eyebrow">Contenido público</span>
            <h1>Flyers del home</h1>
            <p>
              Administra los flyers promocionales que aparecen en el carrusel
              principal de la página pública.
            </p>
          </div>

          <button className="admin-logout" onClick={loadSlides} disabled={loading}>
            <RefreshCw size={17} />
            Recargar
          </button>
        </div>

        <AdminModuleNav />

        <div className="admin-kpi-grid admin-kpi-grid-three">
          <div className="admin-kpi-card">
            <div>
              <span>Total flyers</span>
              <strong>{slides.length}</strong>
            </div>
            <ImagePlus size={24} />
          </div>

          <div className="admin-kpi-card success">
            <div>
              <span>Activos</span>
              <strong>{activeCount}</strong>
            </div>
            <CheckCircle2 size={24} />
          </div>

          <div className="admin-kpi-card accent">
            <div>
              <span>Inactivos</span>
              <strong>{slides.length - activeCount}</strong>
            </div>
            <XCircle size={24} />
          </div>
        </div>

        {error && <div className="alert-error admin-feedback">{error}</div>}
        {message && <div className="alert-success admin-feedback">{message}</div>}

        <div className="admin-home-hero-layout">
          <article className="admin-panel admin-home-hero-form-panel">
            <div className="admin-panel-title-row">
              <div>
                <span className="eyebrow">Mantenimiento</span>
                <h2>{isEditing ? "Editar flyer" : "Nuevo flyer"}</h2>
              </div>

              <button className="admin-small-action" type="button" onClick={startCreate}>
                <Plus size={16} />
                Nuevo
              </button>
            </div>

            <form className="admin-home-hero-form" onSubmit={handleSubmit}>
              <div className="admin-form-grid two-cols">
                <label className="admin-field">
                  Título
                  <input
                    value={form.titulo}
                    onChange={(event) => updateField("titulo", event.target.value)}
                    placeholder="Ej. Promoción Andyfers"
                  />
                </label>

                <label className="admin-field">
                  Etiqueta
                  <input
                    value={form.etiqueta}
                    onChange={(event) => updateField("etiqueta", event.target.value)}
                    placeholder="Ej. Promoción"
                  />
                </label>
              </div>

              <label className="admin-field">
                Subtítulo / descripción interna
                <textarea
                  rows={3}
                  value={form.subtitulo}
                  onChange={(event) => updateField("subtitulo", event.target.value)}
                  placeholder="Texto descriptivo opcional del flyer"
                />
              </label>

              <div className="admin-form-grid two-cols">
                <label className="admin-field">
                  Texto botón
                  <input
                    value={form.texto_boton}
                    onChange={(event) => updateField("texto_boton", event.target.value)}
                    placeholder="Ej. Ver catálogo"
                  />
                </label>

                <label className="admin-field">
                  URL botón
                  <input
                    value={form.url_boton}
                    onChange={(event) => updateField("url_boton", event.target.value)}
                    placeholder="Ej. /catalogo"
                  />
                </label>
              </div>

              <label className="admin-field">
                Secure URL de Cloudinary *
                <input
                  value={form.secure_url}
                  onChange={(event) => updateField("secure_url", event.target.value)}
                  placeholder="https://res.cloudinary.com/.../flayer.png"
                  required
                />
              </label>

              <div className="admin-form-grid two-cols">
                <label className="admin-field">
                  Public ID
                  <input
                    value={form.cloudinary_public_id}
                    onChange={(event) =>
                      updateField("cloudinary_public_id", event.target.value)
                    }
                    placeholder="flayer1_im2yqc"
                  />
                </label>

                <label className="admin-field">
                  Thumbnail URL
                  <input
                    value={form.thumbnail_url}
                    onChange={(event) => updateField("thumbnail_url", event.target.value)}
                    placeholder="Opcional"
                  />
                </label>
              </div>

              <div className="admin-form-grid three-cols">
                <label className="admin-field">
                  Orden
                  <input
                    type="number"
                    value={form.orden}
                    onChange={(event) => updateField("orden", event.target.value)}
                  />
                </label>

                <label className="admin-field">
                  Estado
                  <select
                    value={form.activo}
                    onChange={(event) => updateField("activo", Number(event.target.value))}
                  >
                    <option value={1}>Activo</option>
                    <option value={0}>Inactivo</option>
                  </select>
                </label>

                <label className="admin-field">
                  Inicio campaña
                  <input
                    type="datetime-local"
                    value={form.fecha_inicio}
                    onChange={(event) => updateField("fecha_inicio", event.target.value)}
                  />
                </label>
              </div>

              <label className="admin-field">
                Fin campaña
                <input
                  type="datetime-local"
                  value={form.fecha_fin}
                  onChange={(event) => updateField("fecha_fin", event.target.value)}
                />
              </label>

              {form.secure_url && (
                <div className="admin-home-hero-preview">
                  <img src={form.secure_url} alt="Vista previa del flyer" />
                </div>
              )}

              <button className="btn-primary full" type="submit" disabled={saving}>
                {saving ? <Loader2 size={17} className="spin-icon" /> : <Save size={17} />}
                {isEditing ? "Guardar cambios" : "Crear flyer"}
              </button>
            </form>
          </article>

          <article className="admin-panel">
            <div className="admin-panel-title-row">
              <div>
                <span className="eyebrow">Publicados</span>
                <h2>Flyers registrados</h2>
              </div>
            </div>

            {loading ? (
              <div className="admin-empty">Cargando flyers...</div>
            ) : slides.length ? (
              <div className="admin-home-hero-list">
                {slides.map((slide) => (
                  <div className="admin-home-hero-card" key={slide.id}>
                    <div className="admin-home-hero-thumb">
                      <img src={slide.thumbnail_url || slide.secure_url} alt={slide.titulo || "Flyer"} />
                    </div>

                    <div className="admin-home-hero-info">
                      <div className="admin-quote-head">
                        <strong>{slide.titulo || "Sin título"}</strong>
                        <span className={`quote-status ${Number(slide.activo) === 1 ? "status-CERRADO" : "status-CANCELADO"}`}>
                          {Number(slide.activo) === 1 ? "Activo" : "Inactivo"}
                        </span>
                      </div>

                      <p>{slide.subtitulo || "Sin descripción"}</p>
                      <small>
                        Orden {slide.orden} · Actualizado {formatDate(slide.updated_at)}
                      </small>
                    </div>

                    <div className="admin-home-hero-actions">
                      <a href={slide.secure_url} target="_blank" rel="noreferrer">
                        <Eye size={15} />
                        Ver
                      </a>

                      <button type="button" onClick={() => startEdit(slide)}>
                        <Pencil size={15} />
                        Editar
                      </button>

                      <button type="button" onClick={() => toggleSlide(slide)}>
                        {Number(slide.activo) === 1 ? <XCircle size={15} /> : <CheckCircle2 size={15} />}
                        {Number(slide.activo) === 1 ? "Ocultar" : "Activar"}
                      </button>

                      <button type="button" className="danger" onClick={() => handleDelete(slide)}>
                        <Trash2 size={15} />
                        Desactivar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="admin-empty">
                Todavía no hay flyers registrados. Agrega el primer flyer con una URL de Cloudinary.
              </div>
            )}
          </article>
        </div>
      </div>
    </section>
  );
}
