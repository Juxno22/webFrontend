"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Star,
  Trash2,
  UploadCloud,
} from "lucide-react";
import {
  createProductMedia,
  deleteProductMedia,
  updateProductMedia,
  uploadProductMedia,
} from "@/app/lib/adminMultimediaApi";

function getMediaImageUrl(media) {
  return media?.thumbnail_url || media?.secure_url || "";
}

function normalizeMediaList(multimedia = []) {
  return [...multimedia].sort((a, b) => {
    const rolA = a.rol === "PRINCIPAL" ? 0 : a.rol === "GALERIA" ? 1 : 2;
    const rolB = b.rol === "PRINCIPAL" ? 0 : b.rol === "GALERIA" ? 1 : 2;

    if (rolA !== rolB) return rolA - rolB;

    return Number(a.orden || 0) - Number(b.orden || 0);
  });
}

function showAdminToast(message) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("andyfers_toast", {
      detail: { message },
    })
  );
}

export default function AdminProductMediaManager({
  productoId,
  multimedia = [],
  onRefresh,
}) {
  const [items, setItems] = useState(() => normalizeMediaList(multimedia));
  const [savingId, setSavingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [creatingUrl, setCreatingUrl] = useState(false);
  const [error, setError] = useState("");

  const [uploadForm, setUploadForm] = useState({
    file: null,
    rol: "GALERIA",
    orden: 1,
    codigo_archivo_original: "",
  });

  const [urlForm, setUrlForm] = useState({
    tipo: "IMAGEN",
    rol: "GALERIA",
    secure_url: "",
    cloudinary_public_id: "",
    thumbnail_url: "",
    orden: 1,
    activo: 1,
    codigo_archivo_original: "",
    nombre_archivo_original: "",
  });

  const activeItems = useMemo(
    () => items.filter((item) => Number(item.activo) === 1),
    [items]
  );

  const inactiveItems = useMemo(
    () => items.filter((item) => Number(item.activo) !== 1),
    [items]
  );

  function syncItem(mediaId, patch) {
    setItems((current) =>
      normalizeMediaList(
        current.map((item) =>
          Number(item.id) === Number(mediaId)
            ? {
                ...item,
                ...patch,
              }
            : item
        )
      )
    );
  }

  function addLocalItem(item) {
    setItems((current) => normalizeMediaList([item, ...current]));
  }

  async function reloadParent() {
    if (typeof onRefresh === "function") {
      await onRefresh();
    }
  }

  async function handleUpload(event) {
    event.preventDefault();
    setError("");

    if (!productoId) {
      setError("No hay producto seleccionado.");
      return;
    }

    if (!uploadForm.file) {
      setError("Selecciona una imagen.");
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadForm.file);
    formData.append("rol", uploadForm.rol);
    formData.append("orden", String(uploadForm.orden || 1));

    if (uploadForm.codigo_archivo_original) {
      formData.append(
        "codigo_archivo_original",
        uploadForm.codigo_archivo_original
      );
    }

    setUploading(true);

    try {
      const response = await uploadProductMedia(productoId, formData);

      if (response.data) {
        if (response.data.rol === "PRINCIPAL") {
          setItems((current) =>
            current.map((item) =>
              item.rol === "PRINCIPAL"
                ? {
                    ...item,
                    rol: "GALERIA",
                  }
                : item
            )
          );
        }

        addLocalItem(response.data);
      }

      setUploadForm({
        file: null,
        rol: "GALERIA",
        orden: 1,
        codigo_archivo_original: "",
      });

      const fileInput = document.querySelector("#admin-media-upload-file");
      if (fileInput) fileInput.value = "";

      showAdminToast("Imagen subida correctamente.");
      await reloadParent();
    } catch (err) {
      setError(err.message || "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
    }
  }

  async function handleCreateFromUrl(event) {
    event.preventDefault();
    setError("");

    if (!urlForm.secure_url) {
      setError("La URL segura de Cloudinary es obligatoria.");
      return;
    }

    setCreatingUrl(true);

    try {
      const response = await createProductMedia(productoId, urlForm);

      if (response.data) {
        if (response.data.rol === "PRINCIPAL") {
          setItems((current) =>
            current.map((item) =>
              item.rol === "PRINCIPAL"
                ? {
                    ...item,
                    rol: "GALERIA",
                  }
                : item
            )
          );
        }

        addLocalItem(response.data);
      }

      setUrlForm({
        tipo: "IMAGEN",
        rol: "GALERIA",
        secure_url: "",
        cloudinary_public_id: "",
        thumbnail_url: "",
        orden: 1,
        activo: 1,
        codigo_archivo_original: "",
        nombre_archivo_original: "",
      });

      showAdminToast("Multimedia agregada correctamente.");
      await reloadParent();
    } catch (err) {
      setError(err.message || "No se pudo agregar la multimedia.");
    } finally {
      setCreatingUrl(false);
    }
  }

  async function handleSaveMedia(media) {
    setError("");
    setSavingId(media.id);

    try {
      await updateProductMedia(productoId, media.id, {
        tipo: media.tipo || "IMAGEN",
        rol: media.rol || "GALERIA",
        cloudinary_public_id: media.cloudinary_public_id || "",
        secure_url: media.secure_url || "",
        thumbnail_url: media.thumbnail_url || "",
        codigo_archivo_original: media.codigo_archivo_original || "",
        nombre_archivo_original: media.nombre_archivo_original || "",
        orden: media.orden || 1,
        activo: Number(media.activo) === 1 ? 1 : 0,
      });

      if (media.rol === "PRINCIPAL" && Number(media.activo) === 1) {
        setItems((current) =>
          normalizeMediaList(
            current.map((item) =>
              Number(item.id) === Number(media.id)
                ? {
                    ...item,
                    rol: "PRINCIPAL",
                    activo: 1,
                  }
                : item.rol === "PRINCIPAL"
                  ? {
                      ...item,
                      rol: "GALERIA",
                    }
                  : item
            )
          )
        );
      }

      showAdminToast("Multimedia actualizada.");
      await reloadParent();
    } catch (err) {
      setError(err.message || "No se pudo actualizar la multimedia.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleSetPrincipal(media) {
    const nextMedia = {
      ...media,
      tipo: "IMAGEN",
      rol: "PRINCIPAL",
      activo: 1,
      orden: 1,
    };

    syncItem(media.id, nextMedia);
    await handleSaveMedia(nextMedia);
  }

  async function handleToggleActive(media) {
    const nextMedia = {
      ...media,
      activo: Number(media.activo) === 1 ? 0 : 1,
    };

    syncItem(media.id, nextMedia);
    await handleSaveMedia(nextMedia);
  }

  async function handleDelete(media) {
    const confirmed = window.confirm(
      "¿Seguro que quieres desactivar esta multimedia? No se borrará de Cloudinary."
    );

    if (!confirmed) return;

    setError("");
    setSavingId(media.id);

    try {
      await deleteProductMedia(productoId, media.id);

      syncItem(media.id, {
        activo: 0,
      });

      showAdminToast("Multimedia desactivada.");
      await reloadParent();
    } catch (err) {
      setError(err.message || "No se pudo desactivar la multimedia.");
    } finally {
      setSavingId(null);
    }
  }

  function updateMediaDraft(mediaId, field, value) {
    setItems((current) =>
      current.map((item) =>
        Number(item.id) === Number(mediaId)
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  }

  function renderMediaCard(media) {
    const imageUrl = getMediaImageUrl(media);
    const isSaving = savingId === media.id;
    const isActive = Number(media.activo) === 1;
    const isPrincipal = media.rol === "PRINCIPAL";

    return (
      <article
        className={`admin-media-card ${!isActive ? "is-inactive" : ""} ${
          isPrincipal ? "is-principal" : ""
        }`}
        key={media.id}
      >
        <div className="admin-media-preview">
          {imageUrl ? (
            <img src={imageUrl} alt={media.nombre_archivo_original || ""} />
          ) : (
            <div className="admin-media-empty-preview">
              <ImagePlus size={32} />
            </div>
          )}

          {isPrincipal && (
            <span className="admin-media-principal-badge">
              <Star size={13} />
              Principal
            </span>
          )}

          {!isActive && <span className="admin-media-off-badge">Inactiva</span>}
        </div>

        <div className="admin-media-fields">
          <label>
            Rol
            <select
              value={media.rol || "GALERIA"}
              onChange={(event) =>
                updateMediaDraft(media.id, "rol", event.target.value)
              }
            >
              <option value="PRINCIPAL">Principal</option>
              <option value="GALERIA">Galería</option>
              <option value="VIDEO">Video</option>
            </select>
          </label>

          <label>
            Orden
            <input
              type="number"
              min="1"
              value={media.orden || 1}
              onChange={(event) =>
                updateMediaDraft(media.id, "orden", event.target.value)
              }
            />
          </label>

          <label className="admin-media-field-full">
            Secure URL
            <input
              value={media.secure_url || ""}
              onChange={(event) =>
                updateMediaDraft(media.id, "secure_url", event.target.value)
              }
            />
          </label>

          <label className="admin-media-field-full">
            Public ID
            <input
              value={media.cloudinary_public_id || ""}
              onChange={(event) =>
                updateMediaDraft(
                  media.id,
                  "cloudinary_public_id",
                  event.target.value
                )
              }
            />
          </label>

          <label>
            Código archivo
            <input
              value={media.codigo_archivo_original || ""}
              onChange={(event) =>
                updateMediaDraft(
                  media.id,
                  "codigo_archivo_original",
                  event.target.value
                )
              }
            />
          </label>

          <label>
            Nombre archivo
            <input
              value={media.nombre_archivo_original || ""}
              onChange={(event) =>
                updateMediaDraft(
                  media.id,
                  "nombre_archivo_original",
                  event.target.value
                )
              }
            />
          </label>
        </div>

        <div className="admin-media-actions">
          <button
            type="button"
            className="admin-op-btn admin-op-btn-primary"
            onClick={() => handleSaveMedia(media)}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 size={15} className="spin-icon" /> : <Save size={15} />}
            Guardar
          </button>

          <button
            type="button"
            className="admin-op-btn"
            onClick={() => handleSetPrincipal(media)}
            disabled={isSaving || isPrincipal}
          >
            <Star size={15} />
            Principal
          </button>

          <button
            type="button"
            className="admin-op-btn"
            onClick={() => handleToggleActive(media)}
            disabled={isSaving}
          >
            {isActive ? <EyeOff size={15} /> : <Eye size={15} />}
            {isActive ? "Ocultar" : "Activar"}
          </button>

          <button
            type="button"
            className="admin-op-btn admin-op-btn-danger"
            onClick={() => handleDelete(media)}
            disabled={isSaving || !isActive}
          >
            <Trash2 size={15} />
            Desactivar
          </button>
        </div>
      </article>
    );
  }

  return (
    <section className="admin-product-media-panel">
      <div className="admin-op-section-head">
        <div>
          <span>Multimedia</span>
          <h2>Imágenes del producto</h2>
          <p>
            Administra imagen principal, galería y multimedia vinculada al
            producto.
          </p>
        </div>
      </div>

      {error && <div className="admin-op-error">{error}</div>}

      <div className="admin-media-create-grid">
        <form className="admin-media-upload-card" onSubmit={handleUpload}>
          <div className="admin-media-form-title">
            <UploadCloud size={19} />
            <strong>Subir imagen</strong>
          </div>

          <label>
            Archivo
            <input
              id="admin-media-upload-file"
              type="file"
              accept="image/*"
              onChange={(event) =>
                setUploadForm((current) => ({
                  ...current,
                  file: event.target.files?.[0] || null,
                }))
              }
            />
          </label>

          <div className="admin-media-form-row">
            <label>
              Rol
              <select
                value={uploadForm.rol}
                onChange={(event) =>
                  setUploadForm((current) => ({
                    ...current,
                    rol: event.target.value,
                  }))
                }
              >
                <option value="PRINCIPAL">Principal</option>
                <option value="GALERIA">Galería</option>
              </select>
            </label>

            <label>
              Orden
              <input
                type="number"
                min="1"
                value={uploadForm.orden}
                onChange={(event) =>
                  setUploadForm((current) => ({
                    ...current,
                    orden: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <label>
            Código archivo original
            <input
              value={uploadForm.codigo_archivo_original}
              placeholder="Ej. BA1191"
              onChange={(event) =>
                setUploadForm((current) => ({
                  ...current,
                  codigo_archivo_original: event.target.value,
                }))
              }
            />
          </label>

          <button
            type="submit"
            className="admin-op-btn admin-op-btn-primary admin-op-btn-full"
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 size={16} className="spin-icon" />
            ) : (
              <UploadCloud size={16} />
            )}
            Subir a Cloudinary
          </button>
        </form>

        <form className="admin-media-upload-card" onSubmit={handleCreateFromUrl}>
          <div className="admin-media-form-title">
            <Plus size={19} />
            <strong>Agregar por URL</strong>
          </div>

          <label>
            Secure URL *
            <input
              value={urlForm.secure_url}
              placeholder="https://res.cloudinary.com/..."
              onChange={(event) =>
                setUrlForm((current) => ({
                  ...current,
                  secure_url: event.target.value,
                }))
              }
            />
          </label>

          <label>
            Public ID
            <input
              value={urlForm.cloudinary_public_id}
              placeholder="andyfers/productos/..."
              onChange={(event) =>
                setUrlForm((current) => ({
                  ...current,
                  cloudinary_public_id: event.target.value,
                }))
              }
            />
          </label>

          <div className="admin-media-form-row">
            <label>
              Rol
              <select
                value={urlForm.rol}
                onChange={(event) =>
                  setUrlForm((current) => ({
                    ...current,
                    rol: event.target.value,
                  }))
                }
              >
                <option value="PRINCIPAL">Principal</option>
                <option value="GALERIA">Galería</option>
                <option value="VIDEO">Video</option>
              </select>
            </label>

            <label>
              Orden
              <input
                type="number"
                min="1"
                value={urlForm.orden}
                onChange={(event) =>
                  setUrlForm((current) => ({
                    ...current,
                    orden: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <button
            type="submit"
            className="admin-op-btn admin-op-btn-primary admin-op-btn-full"
            disabled={creatingUrl}
          >
            {creatingUrl ? (
              <Loader2 size={16} className="spin-icon" />
            ) : (
              <Plus size={16} />
            )}
            Agregar multimedia
          </button>
        </form>
      </div>

      <div className="admin-media-list-head">
        <div>
          <strong>Activas</strong>
          <span>{activeItems.length} multimedia activa</span>
        </div>
      </div>

      {activeItems.length > 0 ? (
        <div className="admin-media-grid">
          {activeItems.map((media) => renderMediaCard(media))}
        </div>
      ) : (
        <div className="admin-op-empty">
          Este producto todavía no tiene imágenes activas.
        </div>
      )}

      {inactiveItems.length > 0 && (
        <>
          <div className="admin-media-list-head is-muted">
            <div>
              <strong>Inactivas</strong>
              <span>{inactiveItems.length} multimedia oculta</span>
            </div>
          </div>

          <div className="admin-media-grid">
            {inactiveItems.map((media) => renderMediaCard(media))}
          </div>
        </>
      )}
    </section>
  );
}