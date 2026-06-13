"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  Copy,
  MessageSquare,
  Package,
  Save,
} from "lucide-react";
import AdminModuleNav from "../components/AdminModuleNav";
import {
  getAdminCotizacion,
  getAdminUser,
  updateCotizacionEstado,
  addCotizacionEvento,
} from "../app/lib/adminApi";

const ESTADOS = [
  "NUEVA",
  "EN_REVISION",
  "CONTACTADO",
  "COTIZADO",
  "EN_PROCESO",
  "CERRADO",
  "CANCELADO",
  "REQUIERE_DATOS",
];

function formatDate(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function buildWhatsappMessage(cotizacion) {
  const items = cotizacion.items || [];

  const productos = items
    .map((item, index) => {
      return `${index + 1}. ${item.descripcion_producto || "Producto"}\nCódigo: ${item.codigo_andyfers || item.codigo_importacion || "-"
        }\nCantidad: ${item.cantidad || 1}`;
    })
    .join("\n\n");

  const vehiculo = [
    cotizacion.marca_vehiculo,
    cotizacion.modelo_vehiculo,
    cotizacion.anio_vehiculo,
    cotizacion.motor_vehiculo,
  ]
    .filter(Boolean)
    .join(" ");

  return `Hola ${cotizacion.nombre_cliente || ""}, te contacto de Andyfers por tu cotización ${cotizacion.folio}.

Productos solicitados:
${productos || "-"}

Vehículo:
${vehiculo || "No especificado"}

Vamos a validar disponibilidad, compatibilidad y precio final para darte seguimiento.`;
}

export default function AdminCotizacionDetailClient({ folio }) {
  const router = useRouter();

  const [cotizacion, setCotizacion] = useState(null);
  const [estado, setEstado] = useState("");
  const [comentarioEstado, setComentarioEstado] = useState("");
  const [nota, setNota] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingEstado, setSavingEstado] = useState(false);
  const [savingNota, setSavingNota] = useState(false);
  const [error, setError] = useState("");

  const whatsappMessage = useMemo(() => {
    if (!cotizacion) return "";
    return buildWhatsappMessage(cotizacion);
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
    const user = getAdminUser();

    if (!user) {
      router.push("/admin/login");
      return;
    }

    loadCotizacion();
  }, [folio, router]);

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
    await navigator.clipboard.writeText(whatsappMessage);

    window.dispatchEvent(
      new CustomEvent("andyfers_toast", {
        detail: {
          message: "Mensaje copiado para WhatsApp.",
        },
      })
    );
  }

  if (loading) {
    return (
      <section className="admin-page">
        <div className="container">
          <div className="admin-empty">Cargando cotización...</div>
        </div>
      </section>
    );
  }

  if (error && !cotizacion) {
    return (
      <section className="admin-page">
        <div className="container">
          <div className="admin-empty">
            <h1>No se pudo cargar</h1>
            <p>{error}</p>
            <Link href="/admin/cotizaciones" className="btn-primary">
              Volver a cotizaciones
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <div className="container">
        <Link href="/admin/cotizaciones" className="admin-back">
          <ArrowLeft size={17} />
          Volver a cotizaciones
        </Link>

        <AdminModuleNav />

        <div className="admin-detail-header">
          <div>
            <span className="eyebrow">Detalle cotización</span>
            <h1>{cotizacion.folio}</h1>
            <p>{formatDate(cotizacion.created_at)}</p>
          </div>

          <span className={`quote-status status-${cotizacion.estado}`}>
            {cotizacion.estado}
          </span>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <div className="admin-quote-detail-layout">
          <main className="admin-quote-detail-main">
            <article className="admin-panel">
              <div className="admin-panel-title">
                <ClipboardList size={20} />
                <h2>Datos del cliente</h2>
              </div>

              <div className="admin-info-grid">
                <div>
                  <span>Cliente</span>
                  <strong>{cotizacion.nombre_cliente || "-"}</strong>
                </div>

                <div>
                  <span>WhatsApp</span>
                  <strong>{cotizacion.whatsapp || "-"}</strong>
                </div>

                <div>
                  <span>Correo</span>
                  <strong>{cotizacion.correo || "-"}</strong>
                </div>

                <div>
                  <span>Ciudad / Estado</span>
                  <strong>
                    {[cotizacion.ciudad, cotizacion.estado_cliente]
                      .filter(Boolean)
                      .join(", ") || "-"}
                  </strong>
                </div>

                <div>
                  <span>Origen</span>
                  <strong>{cotizacion.origen || "-"}</strong>
                </div>

                <div>
                  <span>Vehículo</span>
                  <strong>
                    {[
                      cotizacion.marca_vehiculo,
                      cotizacion.modelo_vehiculo,
                      cotizacion.anio_vehiculo,
                      cotizacion.motor_vehiculo,
                    ]
                      .filter(Boolean)
                      .join(" ") || "-"}
                  </strong>
                </div>
              </div>
            </article>

            <article className="admin-panel">
              <div className="admin-panel-title">
                <Package size={20} />
                <h2>Productos solicitados</h2>
              </div>

              <div className="admin-items-list">
                {cotizacion.items?.length > 0 ? (
                  cotizacion.items.map((item) => (
                    <div className="admin-item-card" key={item.id}>
                      <div>
                        <strong>{item.descripcion_producto}</strong>

                        <p>
                          Código:{" "}
                          {item.codigo_andyfers ||
                            item.codigo_importacion ||
                            "-"}{" "}
                          · Familia: {item.familia || "-"} · Cantidad:{" "}
                          {item.cantidad || 1}
                        </p>

                        {item.notas_cliente && (
                          <p>Notas: {item.notas_cliente}</p>
                        )}
                      </div>

                      {item.compatibilidad_estimada && (
                        <span>{item.compatibilidad_estimada}%</span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="admin-empty-mini">
                    Esta cotización no tiene productos registrados.
                  </div>
                )}
              </div>
            </article>

            <article className="admin-panel">
              <div className="admin-panel-title">
                <MessageSquare size={20} />
                <h2>Historial y notas</h2>
              </div>

              <form className="admin-note-form" onSubmit={saveNota}>
                <textarea
                  value={nota}
                  onChange={(event) => setNota(event.target.value)}
                  placeholder="Agregar nota interna..."
                  rows={3}
                />

                <button className="btn-primary" disabled={savingNota}>
                  <Save size={16} />
                  {savingNota ? "Guardando..." : "Agregar nota"}
                </button>
              </form>

              <div className="admin-events-list">
                {cotizacion.eventos?.length > 0 ? (
                  cotizacion.eventos.map((evento) => (
                    <div className="admin-event-card" key={evento.id}>
                      <strong>
                        {evento.estado_anterior} → {evento.estado_nuevo}
                      </strong>
                      <p>{evento.comentario}</p>
                      <span>
                        {evento.usuario_interno || "-"} ·{" "}
                        {formatDate(evento.created_at)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="admin-empty-mini">Sin eventos registrados.</div>
                )}
              </div>
            </article>
          </main>

          <aside className="admin-quote-detail-side">
            <article className="admin-panel">
              <h2>Estado</h2>

              <form className="admin-state-form" onSubmit={saveEstado}>
                <label>
                  Estado de cotización
                  <select
                    value={estado}
                    onChange={(event) => setEstado(event.target.value)}
                  >
                    {ESTADOS.map((item) => (
                      <option value={item} key={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Comentario
                  <textarea
                    value={comentarioEstado}
                    onChange={(event) =>
                      setComentarioEstado(event.target.value)
                    }
                    placeholder="Comentario opcional del cambio..."
                    rows={3}
                  />
                </label>

                <button className="btn-primary full" disabled={savingEstado}>
                  <Save size={16} />
                  {savingEstado ? "Guardando..." : "Guardar estado"}
                </button>
              </form>
            </article>

            <article className="admin-panel">
              <h2>Mensaje WhatsApp</h2>

              <pre className="admin-whatsapp-preview">{whatsappMessage}</pre>

              <button className="btn-primary full" onClick={copyMessage}>
                <Copy size={16} />
                Copiar mensaje
              </button>
            </article>
          </aside>
        </div>
      </div>
    </section>
  );
}