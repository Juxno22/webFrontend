import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Home,
  MessageCircle,
  PackageCheck,
  PhoneCall,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { getCotizacionPublica } from "../../lib/api";

export async function generateMetadata({ params }) {
  const { folio } = await params;

  return {
    title: `${folio} | Solicitud enviada | Andyfers`,
    description: `Solicitud de cotización ${folio} recibida por Andyfers.`,
  };
}

function formatFecha(value) {
  if (!value) return "Solicitud registrada";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Solicitud registrada";

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getVehicleLabel(cotizacion) {
  return [
    cotizacion?.marca_vehiculo,
    cotizacion?.modelo_vehiculo,
    cotizacion?.anio_vehiculo,
    cotizacion?.motor_vehiculo,
  ]
    .filter(Boolean)
    .join(" ");
}

function getCodigoItem(item) {
  return item.codigo_andyfers || item.codigo_importacion || "SIN CÓDIGO";
}

export default async function SolicitudEnviadaPage({ params }) {
  const { folio } = await params;

  let cotizacion = null;
  let error = "";

  try {
    const response = await getCotizacionPublica(folio);
    cotizacion = response.data;
  } catch (err) {
    error = err.message;
  }

  if (error || !cotizacion) {
    return (
      <main className="success-page">
        <section className="success-error-section">
          <div className="container">
            <div className="success-error-card">
              <div className="success-error-icon">
                <ClipboardList size={42} />
              </div>

              <span className="eyebrow">Solicitud no encontrada</span>

              <h1>No encontramos esta solicitud</h1>

              <p>{error || "La cotización no existe o no está disponible."}</p>

              <div className="success-error-actions">
                <Link href="/catalogo" className="btn-primary">
                  Volver al catálogo
                </Link>

                <Link href="/" className="btn-secondary detail-secondary">
                  Ir al inicio
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const items = Array.isArray(cotizacion.items) ? cotizacion.items : [];
  const totalPiezas = items.reduce(
    (total, item) => total + Number(item.cantidad || 0),
    0
  );
  const vehicleLabel = getVehicleLabel(cotizacion);

  return (
    <main className="success-page">
      <section className="success-hero">
        <div className="success-home-decor success-home-decor-left" />
        <div className="success-home-decor success-home-decor-right" />

        <div className="container success-hero-grid">
          <div className="success-hero-copy">
            <div className="success-status-pill">
              <CheckCircle2 size={18} />
              Solicitud recibida correctamente
            </div>

            <span className="eyebrow">Cotización enviada</span>

            <h1>Tu solicitud ya está en manos de ventas.</h1>

            <p>
              Andyfers revisará existencia, compatibilidad y precio final. Un
              asesor continuará el seguimiento por WhatsApp o llamada con los
              datos proporcionados.
            </p>

            <div className="success-folio-card">
              <span>Folio de seguimiento</span>
              <strong>{cotizacion.folio}</strong>
              <small>{formatFecha(cotizacion.created_at)}</small>
            </div>

            <div className="success-actions">
              <Link href="/catalogo" className="btn-primary">
                Seguir agregando productos
                <ArrowRight size={18} />
              </Link>

              <Link href="/" className="btn-secondary detail-secondary">
                <Home size={18} />
                Ir al inicio
              </Link>
            </div>
          </div>

          <aside className="success-summary-card">
            <div className="success-summary-logo" aria-hidden="true">
              <img src="/andyfers-home/logo-andyfers.png" alt="" />
            </div>

            <div className="success-summary-title">
              <ClipboardList size={28} />
              <div>
                <span>Resumen de solicitud</span>
                <h2>{cotizacion.estado || "NUEVA"}</h2>
              </div>
            </div>

            <div className="success-summary-grid">
              <div>
                <span>Cliente</span>
                <strong>{cotizacion.nombre_cliente}</strong>
              </div>

              <div>
                <span>Productos</span>
                <strong>{items.length}</strong>
              </div>

              <div>
                <span>Piezas</span>
                <strong>{totalPiezas}</strong>
              </div>

              <div>
                <span>Origen</span>
                <strong>{cotizacion.origen || "CATÁLOGO"}</strong>
              </div>
            </div>

            {vehicleLabel ? (
              <div className="success-vehicle-box">
                <span>Vehículo capturado</span>
                <strong>{vehicleLabel}</strong>
              </div>
            ) : null}
          </aside>
        </div>
      </section>

      <section className="success-workflow-section">
        <div className="container success-workflow-layout">
          <div className="success-main-stack">
            <article className="success-panel success-products-panel">
              <div className="success-panel-title">
                <PackageCheck size={22} />
                <div>
                  <span>Detalle de solicitud</span>
                  <h2>Productos solicitados</h2>
                </div>
              </div>

              <div className="success-items">
                {items.map((item) => (
                  <div className="success-item" key={item.id}>
                    <div className="success-item-media">
                      <PackageCheck size={24} />
                    </div>

                    <div className="success-item-info">
                      <span>{getCodigoItem(item)}</span>
                      <h3>{item.descripcion_producto}</h3>

                      <div className="quote-item-tags">
                        {item.categoria && <span>{item.categoria}</span>}
                        {item.familia && <span>{item.familia}</span>}
                        {item.armadora && <span>{item.armadora}</span>}
                      </div>
                    </div>

                    <strong>Cant. {item.cantidad}</strong>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <aside className="success-side-stack">
            <article className="success-panel success-next-panel">
              <div className="success-panel-title">
                <MessageCircle size={22} />
                <div>
                  <span>Seguimiento</span>
                  <h2>Siguiente paso</h2>
                </div>
              </div>

              <div className="success-attention-card">
                <Clock3 size={20} />
                <div>
                  <span>Horario de atención de ventas</span>
                  <strong>8:00 a.m. a 8:00 p.m.</strong>
                </div>
              </div>

              <p className="success-muted">
                Esta solicitud no representa compra confirmada ni pago realizado.
                El equipo de ventas validará la información antes de continuar.
              </p>

              <div className="success-next-list">
                <div>
                  <ShieldCheck size={18} />
                  <span>Ventas revisa los productos solicitados.</span>
                </div>

                <div>
                  <PackageCheck size={18} />
                  <span>Se valida existencia y compatibilidad.</span>
                </div>

                <div>
                  <PhoneCall size={18} />
                  <span>Se confirma precio final con el cliente.</span>
                </div>

                <div>
                  <MessageCircle size={18} />
                  <span>La venta continúa por el canal habitual.</span>
                </div>
              </div>
            </article>

            <article className="success-panel success-help-panel">
              <strong>¿Necesitas agregar otra pieza?</strong>
              <p>
                Puedes volver al catálogo y generar otra solicitud. El folio
                actual seguirá disponible para seguimiento.
              </p>
              <Link href="/catalogo" className="btn-primary full">
                Ver más refacciones
              </Link>
            </article>
          </aside>
        </div>
      </section>
    </main>
  );
}
