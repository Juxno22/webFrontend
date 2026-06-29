"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Car,
  ClipboardList,
  Copy,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Package,
  Phone,
  Save,
  ShoppingCart,
  UserRound,
} from "lucide-react";
import {
  addCotizacionEvento,
  getAdminCotizacion,
  updateCotizacionEstado,
} from "@/app/lib/adminApi";
import { useAdminAuth } from "@/app/hooks/useAdminAuth";

const ESTADOS = [
  { value: "NUEVA", label: "Nueva" },
  { value: "EN_REVISION", label: "En revisión" },
  { value: "CONTACTADO", label: "Contactado" },
  { value: "COTIZADO", label: "Cotizado" },
  { value: "EN_PROCESO", label: "En proceso" },
  { value: "REQUIERE_DATOS", label: "Requiere datos" },
  { value: "CERRADO", label: "Cerrado" },
  { value: "CANCELADO", label: "Cancelado" },
];

function formatDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getEstadoLabel(estado) {
  return ESTADOS.find((item) => item.value === estado)?.label || estado || "—";
}

function getVehicleLabel(cotizacion = {}) {
  return [
    cotizacion.marca_vehiculo,
    cotizacion.modelo_vehiculo,
    cotizacion.anio_vehiculo,
    cotizacion.motor_vehiculo,
  ]
    .filter(Boolean)
    .join(" ");
}

function getLocationLabel(cotizacion = {}) {
  return [cotizacion.ciudad, cotizacion.estado_cliente]
    .filter(Boolean)
    .join(", ");
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function buildWhatsappHref(phone, message) {
  const clean = normalizePhone(phone);

  if (!clean) return null;

  const normalized = clean.startsWith("52") ? clean : `52${clean}`;

  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

function buildWhatsappMessage(cotizacion) {
  const items = cotizacion.items || [];

  const productos = items
    .map((item, index) => {
      return `${index + 1}. ${
        item.descripcion_producto || "Producto"
      }\nCódigo: ${
        item.codigo_andyfers || item.codigo_importacion || "-"
      }\nCantidad: ${item.cantidad || 1}`;
    })
    .join("\n\n");

  const vehiculo = getVehicleLabel(cotizacion);

  return `Hola ${cotizacion.nombre_cliente || ""}, te contacto de Andyfers por tu cotización ${cotizacion.folio}.

Productos solicitados:
${productos || "-"}

Vehículo:
${vehiculo || "No especificado"}

Vamos a validar disponibilidad, compatibilidad y precio final para darte seguimiento.`;
}

export default function AdminCotizacionDetailClient({ folio }) {
  const { checking } = useAdminAuth();

  const [cotizacion, setCotizacion] = useState(null);
  const [estado, setEstado] = useState("");
  const [comentarioEstado, setComentarioEstado] = useState("");
  const [nota, setNota] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingEstado, setSavingEstado] = useState(false);
  const [savingNota, setSavingNota] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const whatsappMessage = useMemo(() => {
    if (!cotizacion) return "";
    return buildWhatsappMessage(cotizacion);
  }, [cotizacion]);

  const whatsappLink = useMemo(() => {
    if (!cotizacion || !whatsappMessage) return null;

    return buildWhatsappHref(cotizacion.whatsapp, whatsappMessage);
  }, [cotizacion, whatsappMessage]);

  const vehicleLabel = useMemo(() => {
    if (!cotizacion) return "";
    return getVehicleLabel(cotizacion);
  }, [cotizacion]);

  const locationLabel = useMemo(() => {
    if (!cotizacion) return "";
    return getLocationLabel(cotizacion);
  }, [cotizacion]);

  async function loadCotizacion() {
    try {
      setLoading(true);
      setError("");

      const response = await getAdminCotizacion(folio);
      const data = response.data;

      setCotizacion(data);
      setEstado(data.estado || "NUEVA");
    } catch (err) {
      setError(err.message || "No se pudo cargar la cotización.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!checking) {
      loadCotizacion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking, folio]);

  async function saveEstado(event) {
    event.preventDefault();

    try {
      setSavingEstado(true);
      setError("");

      await updateCotizacionEstado(folio, {
        estado,
        comentario: comentarioEstado,
      });

      setComentarioEstado("");
      await loadCotizacion();
    } catch (err) {
      setError(err.message || "No se pudo cambiar el estado.");
    } finally {
      setSavingEstado(false);
    }
  }

  async function saveNota(event) {
    event.preventDefault();

    if (!nota.trim()) return;

    try {
      setSavingNota(true);
      setError("");

      await addCotizacionEvento(folio, {
        comentario: nota,
      });

      setNota("");
      await loadCotizacion();
    } catch (err) {
      setError(err.message || "No se pudo agregar la nota.");
    } finally {
      setSavingNota(false);
    }
  }

  async function copyMessage() {
    if (!whatsappMessage) return;

    await navigator.clipboard.writeText(whatsappMessage);
    setCopied(true);

    window.dispatchEvent(
      new CustomEvent("andyfers_toast", {
        detail: {
          message: "Mensaje copiado para WhatsApp.",
        },
      })
    );

    setTimeout(() => setCopied(false), 1800);
  }

  function openWhatsapp() {
    if (!whatsappLink) return;

    window.open(whatsappLink, "_blank", "noopener,noreferrer");
  }

  if (checking || loading) {
    return (
      <section className="admin-workspace">
        <div className="admin-loading-panel">
          <Loader2 size={34} className="admin-spin" />
          <strong>Cargando cotización...</strong>
        </div>
      </section>
    );
  }

  if (error && !cotizacion) {
    return (
      <section className="admin-workspace">
        <div className="admin-loading-panel">
          <AlertTriangle size={34} />
          <strong>No se pudo cargar la cotización.</strong>
          <p>{error}</p>
          <Link href="/admin/cotizaciones" className="admin-primary-button">
            Volver a cotizaciones
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-workspace admin-quote-detail-os">
      <div className="admin-page-hero">
        <div>
          <span>Detalle comercial</span>
          <h1>{cotizacion.folio}</h1>
          <p>
            Solicitud recibida el {formatDate(cotizacion.created_at)}. Revisa
            productos, cliente, vehículo, estado y seguimiento comercial.
          </p>
        </div>

        <div className="admin-page-hero-actions">
          <Link href="/admin/cotizaciones" className="admin-secondary-button">
            <ArrowLeft size={18} />
            Volver
          </Link>

          <Link
            href={`/admin/chat?folio=${encodeURIComponent(cotizacion.folio)}`}
            className="admin-primary-button"
          >
            <MessageCircle size={18} />
            Chat clientes
          </Link>

          <Link href="/admin/ventas" className="admin-secondary-button">
            <ShoppingCart size={18} />
            Ventas ecommerce
          </Link>
        </div>
      </div>

      {error && (
        <div className="admin-alert">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      <section className="admin-quote-detail-summary">
        <article className="admin-kpi-card">
          <ClipboardList size={22} />
          <span>Estado</span>
          <strong>{getEstadoLabel(cotizacion.estado)}</strong>
          <small>{cotizacion.origen || "Origen no especificado"}</small>
        </article>

        <article className="admin-kpi-card">
          <UserRound size={22} />
          <span>Cliente</span>
          <strong>{cotizacion.nombre_cliente || "—"}</strong>
          <small>{cotizacion.whatsapp || "Sin WhatsApp"}</small>
        </article>

        <article className="admin-kpi-card">
          <Package size={22} />
          <span>Productos</span>
          <strong>{cotizacion.items?.length || 0}</strong>
          <small>Partidas solicitadas</small>
        </article>

        <article className="admin-kpi-card">
          <Car size={22} />
          <span>Vehículo</span>
          <strong>{vehicleLabel || "—"}</strong>
          <small>{locationLabel || "Sin ubicación"}</small>
        </article>
      </section>

      <div className="admin-quote-detail-layout-os">
        <main className="admin-quote-detail-main-os">
          <article className="admin-panel">
            <div className="admin-panel-head">
              <div>
                <span>Cliente</span>
                <h2>Datos de contacto</h2>
                <p>Información principal para seguimiento comercial.</p>
              </div>

              <mark className={`admin-status-pill status-${cotizacion.estado}`}>
                {getEstadoLabel(cotizacion.estado)}
              </mark>
            </div>

            <div className="admin-info-grid-os">
              <div>
                <UserRound size={18} />
                <span>Cliente</span>
                <strong>{cotizacion.nombre_cliente || "—"}</strong>
              </div>

              <div>
                <Phone size={18} />
                <span>WhatsApp</span>
                <strong>
                  {cotizacion.whatsapp ? (
                    <a href={`tel:${normalizePhone(cotizacion.whatsapp)}`}>
                      {cotizacion.whatsapp}
                    </a>
                  ) : (
                    "—"
                  )}
                </strong>
              </div>

              <div>
                <Mail size={18} />
                <span>Correo</span>
                <strong>{cotizacion.correo || "—"}</strong>
              </div>

              <div>
                <MapPin size={18} />
                <span>Ciudad / Estado</span>
                <strong>{locationLabel || "—"}</strong>
              </div>

              <div>
                <Car size={18} />
                <span>Vehículo</span>
                <strong>{vehicleLabel || "—"}</strong>
              </div>

              <div>
                <ClipboardList size={18} />
                <span>Origen</span>
                <strong>{cotizacion.origen || "—"}</strong>
              </div>
            </div>

            {cotizacion.mensaje_cliente && (
              <div className="admin-quote-customer-message">
                <span>Comentario del cliente</span>
                <p>{cotizacion.mensaje_cliente}</p>
              </div>
            )}
          </article>

          <article className="admin-panel">
            <div className="admin-panel-head">
              <div>
                <span>Productos</span>
                <h2>Productos solicitados</h2>
                <p>Códigos, cantidades, familia y notas del comprador.</p>
              </div>
            </div>

            <div className="admin-quote-items-os">
              {cotizacion.items?.length > 0 ? (
                cotizacion.items.map((item) => (
                  <article key={item.id}>
                    <div>
                      <strong>{item.descripcion_producto || "Producto"}</strong>

                      <p>
                        Código:{" "}
                        {item.codigo_andyfers || item.codigo_importacion || "—"}
                      </p>

                      <span>
                        Familia: {item.familia || "—"} · Cantidad:{" "}
                        {item.cantidad || 1}
                      </span>

                      {item.notas_cliente && (
                        <small>Notas: {item.notas_cliente}</small>
                      )}
                    </div>

                    {item.compatibilidad_estimada && (
                      <mark>{item.compatibilidad_estimada}%</mark>
                    )}
                  </article>
                ))
              ) : (
                <div className="admin-empty-mini-os">
                  Esta cotización no tiene productos registrados.
                </div>
              )}
            </div>
          </article>

          <article className="admin-panel">
            <div className="admin-panel-head">
              <div>
                <span>Seguimiento</span>
                <h2>Historial y notas</h2>
                <p>Cambios de estado y comentarios internos.</p>
              </div>
            </div>

            <form className="admin-note-form-os" onSubmit={saveNota}>
              <textarea
                value={nota}
                onChange={(event) => setNota(event.target.value)}
                placeholder="Agregar nota interna..."
                rows={3}
              />

              <button className="admin-primary-button" disabled={savingNota}>
                {savingNota ? (
                  <Loader2 size={16} className="admin-spin" />
                ) : (
                  <Save size={16} />
                )}
                {savingNota ? "Guardando..." : "Agregar nota"}
              </button>
            </form>

            <div className="admin-events-list-os">
              {cotizacion.eventos?.length > 0 ? (
                cotizacion.eventos.map((evento) => (
                  <article key={evento.id}>
                    <strong>
                      {evento.estado_anterior || "—"} →{" "}
                      {evento.estado_nuevo || "—"}
                    </strong>

                    <p>{evento.comentario || "Sin comentario"}</p>

                    <span>
                      {evento.usuario_interno || "Sistema"} ·{" "}
                      {formatDate(evento.created_at)}
                    </span>
                  </article>
                ))
              ) : (
                <div className="admin-empty-mini-os">
                  Sin eventos registrados.
                </div>
              )}
            </div>
          </article>
        </main>

        <aside className="admin-quote-detail-side-os">
          <article className="admin-panel">
            <div className="admin-panel-head">
              <div>
                <span>Acción principal</span>
                <h2>Estado comercial</h2>
                <p>Actualiza el avance de atención.</p>
              </div>
            </div>

            <form className="admin-state-form-os" onSubmit={saveEstado}>
              <label>
                Estado de cotización
                <select
                  value={estado}
                  onChange={(event) => setEstado(event.target.value)}
                >
                  {ESTADOS.map((item) => (
                    <option value={item.value} key={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Comentario
                <textarea
                  value={comentarioEstado}
                  onChange={(event) => setComentarioEstado(event.target.value)}
                  placeholder="Comentario opcional del cambio..."
                  rows={3}
                />
              </label>

              <button className="admin-primary-button" disabled={savingEstado}>
                {savingEstado ? (
                  <Loader2 size={16} className="admin-spin" />
                ) : (
                  <Save size={16} />
                )}
                {savingEstado ? "Guardando..." : "Guardar estado"}
              </button>
            </form>
          </article>

          <article className="admin-panel">
            <div className="admin-panel-head">
              <div>
                <span>WhatsApp</span>
                <h2>Mensaje sugerido</h2>
                <p>Úsalo mientras activamos el chat en tiempo real.</p>
              </div>
            </div>

            <pre className="admin-whatsapp-preview-os">{whatsappMessage}</pre>

            <div className="admin-whatsapp-actions-os">
              <button className="admin-secondary-button" onClick={copyMessage}>
                <Copy size={16} />
                {copied ? "Copiado" : "Copiar mensaje"}
              </button>

              {whatsappLink && (
                <button className="admin-primary-button" onClick={openWhatsapp}>
                  <ExternalLink size={16} />
                  Abrir WhatsApp
                </button>
              )}
            </div>
          </article>

          <article className="admin-panel admin-quote-chat-ready">
            <MessageSquare size={26} />
            <span>Próximo módulo</span>
            <h2>Chat en tiempo real</h2>
            <p>
              Esta cotización podrá convertirse en una conversación activa entre
              comprador y administrador usando WebSockets.
            </p>

            <Link
              href={`/admin/chat?folio=${encodeURIComponent(cotizacion.folio)}`}
              className="admin-secondary-button"
            >
              Ir al chat
              <ArrowRight size={16} />
            </Link>
          </article>
        </aside>
      </div>
    </section>
  );
}