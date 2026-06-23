"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    CheckCircle2,
    Edit3,
    FileText,
    ImagePlus,
    LayoutGrid,
    Loader2,
    Megaphone,
    Phone,
    Plus,
    RefreshCw,
    Save,
    Search,
    Trash2,
    XCircle,
} from "lucide-react";
import AdminModuleNav from "@/components/AdminModuleNav";
import {
    createAdminSiteBanner,
    createAdminSiteContacto,
    createAdminSiteContentBlock,
    createAdminSiteLineaComercial,
    createAdminSiteSeccionDestacada,
    deleteAdminSiteBanner,
    deleteAdminSiteContacto,
    deleteAdminSiteContentBlock,
    deleteAdminSiteLineaComercial,
    deleteAdminSiteSeccionDestacada,
    getAdminSiteBanners,
    getAdminSiteContacto,
    getAdminSiteContentBlocks,
    getAdminSiteLineasComerciales,
    getAdminSiteSeccionesDestacadas,
    getAdminUser,
    updateAdminSiteBanner,
    updateAdminSiteContacto,
    updateAdminSiteContentBlock,
    updateAdminSiteLineaComercial,
    updateAdminSiteSeccionDestacada,
    uploadAdminSiteMedia,
} from "@/app/lib/adminApi";

const TABS = {
    textos: {
        label: "Textos",
        icon: FileText,
        get: getAdminSiteContentBlocks,
        create: createAdminSiteContentBlock,
        update: updateAdminSiteContentBlock,
        remove: deleteAdminSiteContentBlock,
        emptyLabel: "Nuevo bloque",
        titleField: "titulo",
        keyField: "content_key",
        initial: {
            content_key: "",
            pagina: "HOME",
            bloque: "GENERAL",
            tipo: "TEXTO",
            etiqueta: "",
            titulo: "",
            subtitulo: "",
            contenido: "",
            cta_texto: "",
            cta_url: "",
            media_tipo: "",
            media_url: "",
            media_public_id: "",
            metadata_json: "",
            orden: 0,
            activo: 1,
        },
        fields: [
            ["content_key", "Clave única", "text"],
            ["pagina", "Página", "select", ["GLOBAL", "HOME", "CONTACTO"]],
            ["bloque", "Bloque", "text"],
            ["tipo", "Tipo", "select", ["TEXTO", "HTML", "CTA", "MEDIA"]],
            ["etiqueta", "Etiqueta", "text"],
            ["titulo", "Título", "text"],
            ["subtitulo", "Subtítulo", "textarea"],
            ["contenido", "Contenido", "textarea", null, true],
            ["cta_texto", "Texto botón", "text"],
            ["cta_url", "URL botón", "text"],
            ["media_tipo", "Tipo media", "text"],
            ["media_url", "URL media", "uploadImage"],
            ["media_public_id", "Public ID media", "text"],
            ["metadata_json", "Metadata JSON", "textarea", null, true],
            ["orden", "Orden", "number"],
            ["activo", "Estado", "active"],
        ],
    },

    banners: {
        label: "Banners",
        icon: Megaphone,
        get: getAdminSiteBanners,
        create: createAdminSiteBanner,
        update: updateAdminSiteBanner,
        remove: deleteAdminSiteBanner,
        emptyLabel: "Nuevo banner",
        titleField: "titulo",
        keyField: "banner_key",
        initial: {
            banner_key: "",
            pagina: "HOME",
            posicion: "GENERAL",
            titulo: "",
            subtitulo: "",
            descripcion: "",
            texto_boton: "",
            url_boton: "",
            media_tipo: "IMAGEN",
            media_url: "",
            thumbnail_url: "",
            cloudinary_public_id: "",
            color_fondo: "",
            color_texto: "",
            fecha_inicio: "",
            fecha_fin: "",
            orden: 0,
            activo: 1,
        },
        fields: [
            ["banner_key", "Clave única", "text"],
            ["pagina", "Página", "select", ["GLOBAL", "HOME", "CONTACTO"]],
            ["posicion", "Posición", "text"],
            ["titulo", "Título", "text"],
            ["subtitulo", "Subtítulo", "textarea"],
            ["descripcion", "Descripción", "textarea", null, true],
            ["texto_boton", "Texto botón", "text"],
            ["url_boton", "URL botón", "text"],
            ["media_tipo", "Tipo media", "select", ["IMAGEN", "VIDEO"]],
            ["media_url", "URL media", "uploadImage"],
            ["thumbnail_url", "Thumbnail URL", "text"],
            ["cloudinary_public_id", "Public ID Cloudinary", "text"],
            ["color_fondo", "Color fondo", "colorText"],
            ["color_texto", "Color texto", "colorText"],
            ["fecha_inicio", "Inicio campaña", "datetime"],
            ["fecha_fin", "Fin campaña", "datetime"],
            ["orden", "Orden", "number"],
            ["activo", "Estado", "active"],
        ],
    },

    lineas: {
        label: "Líneas comerciales",
        icon: LayoutGrid,
        get: getAdminSiteLineasComerciales,
        create: createAdminSiteLineaComercial,
        update: updateAdminSiteLineaComercial,
        remove: deleteAdminSiteLineaComercial,
        emptyLabel: "Nueva línea",
        titleField: "nombre",
        keyField: "line_key",
        initial: {
            line_key: "",
            nombre: "",
            slug: "",
            descripcion_corta: "",
            descripcion_larga: "",
            icono: "boxes",
            color: "#FF192F",
            imagen_url: "",
            thumbnail_url: "",
            cloudinary_public_id: "",
            url_destino: "/catalogo",
            visible_home: 1,
            orden: 0,
            activo: 1,
        },
        fields: [
            ["line_key", "Clave única", "text"],
            ["nombre", "Nombre", "text"],
            ["slug", "Slug", "text"],
            ["descripcion_corta", "Descripción corta", "textarea"],
            ["descripcion_larga", "Descripción larga", "textarea", null, true],
            ["icono", "Icono", "select", ["radiator", "droplets", "gauge", "package", "boxes", "wrench"]],
            ["color", "Color", "colorText"],
            ["imagen_url", "URL imagen", "uploadImage"],
            ["thumbnail_url", "Thumbnail URL", "text"],
            ["cloudinary_public_id", "Public ID Cloudinary", "text"],
            ["url_destino", "URL destino", "text"],
            ["visible_home", "Visible en home", "boolean"],
            ["orden", "Orden", "number"],
            ["activo", "Estado", "active"],
        ],
    },

    secciones: {
        label: "Secciones",
        icon: ImagePlus,
        get: getAdminSiteSeccionesDestacadas,
        create: createAdminSiteSeccionDestacada,
        update: updateAdminSiteSeccionDestacada,
        remove: deleteAdminSiteSeccionDestacada,
        emptyLabel: "Nueva sección",
        titleField: "titulo",
        keyField: "section_key",
        initial: {
            section_key: "",
            pagina: "HOME",
            titulo: "",
            subtitulo: "",
            descripcion: "",
            layout: "GRID",
            source_type: "MANUAL",
            filtro_familia: "",
            filtro_categoria_id: "",
            limite_productos: 8,
            cta_texto: "",
            cta_url: "",
            metadata_json: "",
            orden: 0,
            activo: 1,
        },
        fields: [
            ["section_key", "Clave única", "text"],
            ["pagina", "Página", "select", ["HOME", "CONTACTO"]],
            ["titulo", "Título", "text"],
            ["subtitulo", "Subtítulo", "textarea"],
            ["descripcion", "Descripción", "textarea", null, true],
            ["layout", "Layout", "select", ["GRID", "CAROUSEL", "LIST", "CTA"]],
            ["source_type", "Fuente", "select", ["MANUAL", "PRODUCTOS_NUEVOS", "PRODUCTOS_DESTACADOS", "LINEAS_COMERCIALES"]],
            ["filtro_familia", "Filtro familia", "text"],
            ["filtro_categoria_id", "Filtro categoría ID", "number"],
            ["limite_productos", "Límite productos", "number"],
            ["cta_texto", "Texto botón", "text"],
            ["cta_url", "URL botón", "text"],
            ["metadata_json", "Metadata JSON", "textarea", null, true],
            ["orden", "Orden", "number"],
            ["activo", "Estado", "active"],
        ],
    },

    contacto: {
        label: "Contacto",
        icon: Phone,
        get: getAdminSiteContacto,
        create: createAdminSiteContacto,
        update: updateAdminSiteContacto,
        remove: deleteAdminSiteContacto,
        emptyLabel: "Nuevo canal",
        titleField: "etiqueta",
        keyField: "channel_key",
        initial: {
            channel_key: "",
            tipo: "WHATSAPP",
            etiqueta: "",
            valor: "",
            url: "",
            icono: "phone",
            descripcion: "",
            metadata_json: "",
            orden: 0,
            activo: 1,
        },
        fields: [
            ["channel_key", "Clave única", "text"],
            ["tipo", "Tipo", "select", ["WHATSAPP", "TELEFONO", "EMAIL", "HORARIO", "UBICACION", "RED_SOCIAL"]],
            ["etiqueta", "Etiqueta", "text"],
            ["valor", "Valor", "text"],
            ["url", "URL", "text"],
            ["icono", "Icono", "text"],
            ["descripcion", "Descripción", "textarea", null, true],
            ["metadata_json", "Metadata JSON", "textarea", null, true],
            ["orden", "Orden", "number"],
            ["activo", "Estado", "active"],
        ],
    },
};

function formatDate(value) {
    if (!value) return "Sin fecha";

    try {
        return new Intl.DateTimeFormat("es-MX", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(value));
    } catch {
        return "Sin fecha";
    }
}

function toDatetimeLocal(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);

    return localDate.toISOString().slice(0, 16);
}

function normalizeItemToForm(item, tab) {
    const form = {
        ...tab.initial,
        ...item,
    };

    if (form.metadata && !form.metadata_json) {
        form.metadata_json = JSON.stringify(form.metadata, null, 2);
    }

    if (form.fecha_inicio) {
        form.fecha_inicio = toDatetimeLocal(form.fecha_inicio);
    }

    if (form.fecha_fin) {
        form.fecha_fin = toDatetimeLocal(form.fecha_fin);
    }

    form.activo = Number(form.activo) === 1 ? 1 : 0;

    if ("visible_home" in form) {
        form.visible_home = Number(form.visible_home) === 1 ? 1 : 0;
    }

    return form;
}

function cleanPayload(form) {
    const payload = { ...form };

    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;
    delete payload.metadata;

    Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) {
            payload[key] = "";
        }
    });

    if ("activo" in payload) {
        payload.activo = Number(payload.activo) === 1 ? 1 : 0;
    }

    if ("visible_home" in payload) {
        payload.visible_home = Number(payload.visible_home) === 1 ? 1 : 0;
    }

    if ("orden" in payload) {
        payload.orden = Number(payload.orden || 0);
    }

    if ("limite_productos" in payload) {
        payload.limite_productos = Number(payload.limite_productos || 8);
    }

    if ("filtro_categoria_id" in payload && payload.filtro_categoria_id === "") {
        payload.filtro_categoria_id = null;
    }

    return payload;
}

export default function AdminSiteContentClient() {
    const router = useRouter();

    const [user, setUser] = useState(null);
    const [activeTabKey, setActiveTabKey] = useState("textos");
    const [items, setItems] = useState([]);
    const [form, setForm] = useState(TABS.textos.initial);
    const [filters, setFilters] = useState({
        q: "",
        pagina: "",
        activo: "",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingField, setUploadingField] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const activeTab = TABS[activeTabKey];
    const isEditing = Boolean(form?.id);

    const activeCount = useMemo(() => {
        return items.filter((item) => Number(item.activo) === 1).length;
    }, [items]);

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

        setForm(activeTab.initial);
        setMessage("");
        setError("");
        loadItems();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, activeTabKey]);

    async function loadItems(customFilters = filters) {
        try {
            setLoading(true);
            setError("");

            const response = await activeTab.get(customFilters);

            setItems(response.data || []);
        } catch (err) {
            setError(err.message || "No se pudo cargar el contenido.");
            setItems([]);
        } finally {
            setLoading(false);
        }
    }

    function updateFilter(name, value) {
        setFilters((current) => ({
            ...current,
            [name]: value,
        }));
    }

    function updateField(name, value) {
        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    }

    function startCreate() {
        setForm({
            ...activeTab.initial,
            orden: items.length + 1,
        });
        setMessage("");
        setError("");
    }

    function startEdit(item) {
        setForm(normalizeItemToForm(item, activeTab));
        setMessage("");
        setError("");
    }

    async function handleSearch(event) {
        event.preventDefault();
        await loadItems(filters);
    }

    async function handleSubmit(event) {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");
            setMessage("");

            const payload = cleanPayload(form);

            if (isEditing) {
                await activeTab.update(form.id, payload);
                setMessage("Contenido actualizado correctamente.");
            } else {
                await activeTab.create(payload);
                setMessage("Contenido creado correctamente.");
            }

            await loadItems();
            setForm(activeTab.initial);
        } catch (err) {
            setError(err.message || "No se pudo guardar el contenido.");
        } finally {
            setSaving(false);
        }
    }

    async function toggleActive(item) {
        try {
            setSaving(true);
            setError("");
            setMessage("");

            await activeTab.update(item.id, {
                activo: Number(item.activo) === 1 ? 0 : 1,
            });

            setMessage(
                Number(item.activo) === 1
                    ? "Registro desactivado correctamente."
                    : "Registro activado correctamente."
            );

            await loadItems();
        } catch (err) {
            setError(err.message || "No se pudo cambiar el estado.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(item) {
        const confirmDelete = window.confirm(
            "¿Seguro que quieres desactivar este registro?"
        );

        if (!confirmDelete) return;

        try {
            setSaving(true);
            setError("");
            setMessage("");

            await activeTab.remove(item.id);

            setMessage("Registro desactivado correctamente.");
            await loadItems();

            if (form.id === item.id) {
                setForm(activeTab.initial);
            }
        } catch (err) {
            setError(err.message || "No se pudo desactivar el registro.");
        } finally {
            setSaving(false);
        }
    }

    async function handleUploadField(name, file) {
        if (!file) return;

        try {
            setUploadingField(name);
            setError("");
            setMessage("");

            const keyValue =
                form?.[activeTab.keyField] ||
                form?.titulo ||
                form?.nombre ||
                form?.etiqueta ||
                activeTabKey;

            const response = await uploadAdminSiteMedia(file, {
                target: activeTabKey,
                key: keyValue,
                field: name,
            });

            const media = response.data || {};

            setForm((current) => {
                const next = {
                    ...current,
                    [name]: media.secure_url || "",
                };

                if (
                    (name === "media_url" || name === "imagen_url") &&
                    Object.prototype.hasOwnProperty.call(next, "thumbnail_url")
                ) {
                    next.thumbnail_url = media.thumbnail_url || media.secure_url || "";
                }

                if (Object.prototype.hasOwnProperty.call(next, "cloudinary_public_id")) {
                    next.cloudinary_public_id = media.cloudinary_public_id || "";
                }

                if (Object.prototype.hasOwnProperty.call(next, "media_public_id")) {
                    next.media_public_id = media.cloudinary_public_id || "";
                }

                if (Object.prototype.hasOwnProperty.call(next, "media_tipo")) {
                    next.media_tipo = "IMAGEN";
                }

                return next;
            });

            setMessage("Imagen subida correctamente. Guarda el registro para conservar el cambio.");
        } catch (err) {
            setError(err.message || "No se pudo subir la imagen.");
        } finally {
            setUploadingField("");
        }
    }

    function renderField(field) {
        const [name, label, type, options, wide] = field;
        const value = form?.[name] ?? "";

        const fieldClass = wide ? "admin-field admin-site-field-wide" : "admin-field";

        if (type === "textarea") {
            return (
                <label className={fieldClass} key={name}>
                    {label}
                    <textarea
                        rows={wide ? 5 : 3}
                        value={value}
                        onChange={(event) => updateField(name, event.target.value)}
                    />
                </label>
            );
        }

        if (type === "select") {
            return (
                <label className={fieldClass} key={name}>
                    {label}
                    <select
                        value={value}
                        onChange={(event) => updateField(name, event.target.value)}
                    >
                        {options.map((option) => (
                            <option value={option} key={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </label>
            );
        }

        if (type === "active") {
            return (
                <label className={fieldClass} key={name}>
                    {label}
                    <select
                        value={Number(value) === 1 ? 1 : 0}
                        onChange={(event) => updateField(name, Number(event.target.value))}
                    >
                        <option value={1}>Activo</option>
                        <option value={0}>Inactivo</option>
                    </select>
                </label>
            );
        }

        if (type === "boolean") {
            return (
                <label className={fieldClass} key={name}>
                    {label}
                    <select
                        value={Number(value) === 1 ? 1 : 0}
                        onChange={(event) => updateField(name, Number(event.target.value))}
                    >
                        <option value={1}>Sí</option>
                        <option value={0}>No</option>
                    </select>
                </label>
            );
        }

        if (type === "datetime") {
            return (
                <label className={fieldClass} key={name}>
                    {label}
                    <input
                        type="datetime-local"
                        value={value || ""}
                        onChange={(event) => updateField(name, event.target.value)}
                    />
                </label>
            );
        }

        if (type === "colorText") {
            return (
                <label className={fieldClass} key={name}>
                    {label}
                    <input
                        value={value || ""}
                        onChange={(event) => updateField(name, event.target.value)}
                        placeholder="#FF192F"
                    />
                </label>
            );
        }

        if (type === "uploadImage") {
            return (
                <div className={`${fieldClass} admin-site-upload-field`} key={name}>
                    <label>
                        {label}
                        <input
                            value={value || ""}
                            onChange={(event) => updateField(name, event.target.value)}
                            placeholder="URL de imagen o sube archivo"
                        />
                    </label>

                    <div className="admin-site-upload-row">
                        <label className="admin-site-upload-button">
                            {uploadingField === name ? "Subiendo..." : "Subir imagen"}
                            <input
                                type="file"
                                accept="image/*"
                                disabled={Boolean(uploadingField)}
                                onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    handleUploadField(name, file);
                                    event.target.value = "";
                                }}
                            />
                        </label>

                        {value && (
                            <a
                                href={value}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="admin-site-upload-preview-link"
                            >
                                Ver imagen
                            </a>
                        )}
                    </div>

                    {value && (
                        <div className="admin-site-upload-preview">
                            <img src={value} alt="Vista previa contenido editable" />
                        </div>
                    )}
                </div>
            );
        }

        return (
            <label className={fieldClass} key={name}>
                {label}
                <input
                    type={type || "text"}
                    value={value || ""}
                    onChange={(event) => updateField(name, event.target.value)}
                />
            </label>
        );
    }

    return (
        <section className="admin-page admin-site-content-page">
            <div className="container">
                <div className="admin-topbar">
                    <div>
                        <span className="eyebrow">Contenido público</span>
                        <h1>Contenido editable</h1>
                        <p>
                            Mantén textos, banners, líneas comerciales, secciones y datos de
                            contacto sin tocar código.
                        </p>
                    </div>

                    <button
                        className="admin-logout"
                        type="button"
                        onClick={() => loadItems()}
                        disabled={loading}
                    >
                        <RefreshCw size={17} />
                        Recargar
                    </button>
                </div>

                <AdminModuleNav />

                <div className="admin-site-tabs">
                    {Object.entries(TABS).map(([key, tab]) => {
                        const Icon = tab.icon;

                        return (
                            <button
                                type="button"
                                className={activeTabKey === key ? "active" : ""}
                                key={key}
                                onClick={() => setActiveTabKey(key)}
                            >
                                <Icon size={17} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="admin-kpi-grid admin-kpi-grid-three">
                    <div className="admin-kpi-card">
                        <div>
                            <span>Total registros</span>
                            <strong>{items.length}</strong>
                        </div>
                        <FileText size={24} />
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
                            <strong>{items.length - activeCount}</strong>
                        </div>
                        <XCircle size={24} />
                    </div>
                </div>

                {error && <div className="alert-error admin-feedback">{error}</div>}
                {message && <div className="alert-success admin-feedback">{message}</div>}

                <form className="admin-site-toolbar" onSubmit={handleSearch}>
                    <div className="admin-search">
                        <Search size={17} />
                        <input
                            value={filters.q}
                            onChange={(event) => updateFilter("q", event.target.value)}
                            placeholder={`Buscar en ${activeTab.label.toLowerCase()}...`}
                        />
                    </div>

                    <select
                        value={filters.pagina}
                        onChange={(event) => updateFilter("pagina", event.target.value)}
                    >
                        <option value="">Todas las páginas</option>
                        <option value="GLOBAL">GLOBAL</option>
                        <option value="HOME">HOME</option>
                        <option value="CONTACTO">CONTACTO</option>
                    </select>

                    <select
                        value={filters.activo}
                        onChange={(event) => updateFilter("activo", event.target.value)}
                    >
                        <option value="">Todos</option>
                        <option value="1">Activos</option>
                        <option value="0">Inactivos</option>
                    </select>

                    <button className="admin-clean-button" type="submit">
                        Buscar
                    </button>

                    <button
                        className="admin-primary-link"
                        type="button"
                        onClick={startCreate}
                    >
                        <Plus size={17} />
                        Nuevo
                    </button>
                </form>

                <div className="admin-site-layout">
                    <article className="admin-panel admin-site-list-panel">
                        <div className="admin-panel-title-row">
                            <div>
                                <span className="eyebrow">{activeTab.label}</span>
                                <h2>Registros</h2>
                            </div>
                        </div>

                        {loading ? (
                            <div className="admin-empty">Cargando contenido...</div>
                        ) : items.length ? (
                            <div className="admin-site-list">
                                {items.map((item) => {
                                    const title =
                                        item[activeTab.titleField] ||
                                        item[activeTab.keyField] ||
                                        "Sin título";

                                    const itemKey = item[activeTab.keyField] || `ID ${item.id}`;

                                    return (
                                        <div
                                            className={`admin-site-list-card ${form.id === item.id ? "is-selected" : ""
                                                }`}
                                            key={item.id}
                                        >
                                            <button type="button" onClick={() => startEdit(item)}>
                                                <strong>{title}</strong>
                                                <span>{itemKey}</span>
                                                <small>
                                                    Orden {item.orden ?? 0} · Actualizado{" "}
                                                    {formatDate(item.updated_at)}
                                                </small>
                                            </button>

                                            <div className="admin-site-card-actions">
                                                <span
                                                    className={`quote-status ${Number(item.activo) === 1
                                                        ? "status-CERRADO"
                                                        : "status-CANCELADO"
                                                        }`}
                                                >
                                                    {Number(item.activo) === 1 ? "Activo" : "Inactivo"}
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={() => startEdit(item)}
                                                    title="Editar"
                                                >
                                                    <Edit3 size={15} />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => toggleActive(item)}
                                                    title="Activar / desactivar"
                                                >
                                                    {Number(item.activo) === 1 ? (
                                                        <XCircle size={15} />
                                                    ) : (
                                                        <CheckCircle2 size={15} />
                                                    )}
                                                </button>

                                                <button
                                                    type="button"
                                                    className="danger"
                                                    onClick={() => handleDelete(item)}
                                                    title="Desactivar"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="admin-empty">
                                No hay registros para esta pestaña.
                            </div>
                        )}
                    </article>

                    <article className="admin-panel admin-site-form-panel">
                        <div className="admin-panel-title-row">
                            <div>
                                <span className="eyebrow">Mantenimiento</span>
                                <h2>{isEditing ? "Editar registro" : activeTab.emptyLabel}</h2>
                            </div>

                            {isEditing && (
                                <button
                                    className="admin-small-action"
                                    type="button"
                                    onClick={startCreate}
                                >
                                    <Plus size={16} />
                                    Nuevo
                                </button>
                            )}
                        </div>

                        <form className="admin-site-form" onSubmit={handleSubmit}>
                            <div className="admin-site-fields">
                                {activeTab.fields.map(renderField)}
                            </div>

                            <button className="btn-primary full" type="submit" disabled={saving}>
                                {saving ? (
                                    <Loader2 size={17} className="spin-icon" />
                                ) : (
                                    <Save size={17} />
                                )}
                                {isEditing ? "Guardar cambios" : "Crear registro"}
                            </button>
                        </form>
                    </article>
                </div>
            </div>
        </section>
    );
}