"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { trackAnalyticsBeacon } from "@/app/lib/analytics";
import {
  ArrowRight,
  Clock,
  ClipboardList,
  Mail,
  MapPin,
  Phone,
  Send,
  ShieldCheck,
} from "lucide-react";

function cleanPhone(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

function normalizeWhatsappNumber(value) {
  const clean = cleanPhone(value);

  if (!clean) return "";

  if (clean.length === 10) return `52${clean}`;

  return clean;
}

function findBlock(blocks, key) {
  return blocks?.find((item) => item.content_key === key) || null;
}

function findChannel(channels, key, type) {
  return (
    channels?.find((item) => item.channel_key === key) ||
    channels?.find((item) => item.tipo === type) ||
    null
  );
}

function appendTextToWhatsappUrl(url, text) {
  if (!url) return "";

  if (url.includes("text=")) return url;

  const separator = url.includes("?") ? "&" : "?";

  return `${url}${separator}text=${encodeURIComponent(text)}`;
}

export default function ContactClient({
  contentBlocks = [],
  contactChannels = [],
}) {
  const hero = findBlock(contentBlocks, "contacto_hero");
  const formText = findBlock(contentBlocks, "contacto_formulario");
  const proceso = findBlock(contentBlocks, "contacto_proceso");
  const ctaFinal = findBlock(contentBlocks, "contacto_cta_final");

  const whatsappChannel = findChannel(
    contactChannels,
    "whatsapp_principal",
    "WHATSAPP"
  );
  const emailChannel = findChannel(
    contactChannels,
    "email_principal",
    "EMAIL"
  );
  const horarioChannel = findChannel(
    contactChannels,
    "horario_atencion",
    "HORARIO"
  );
  const ubicacionChannel = findChannel(
    contactChannels,
    "ubicacion_cobertura",
    "UBICACION"
  );

  const [form, setForm] = useState({
    nombre: "",
    whatsapp: "",
    ciudad: "",
    mensaje: "",
  });

  const whatsappLink = useMemo(() => {
    const text = `Hola, quiero contactar a ventas de Andyfers.
Nombre: ${form.nombre || "-"}
WhatsApp: ${form.whatsapp || "-"}
Ciudad: ${form.ciudad || "-"}
Mensaje: ${
      form.mensaje || "Quiero información sobre productos y cotización."
    }`;

    if (whatsappChannel?.url) {
      return appendTextToWhatsappUrl(whatsappChannel.url, text);
    }

    const phone = normalizeWhatsappNumber(whatsappChannel?.valor);

    if (!phone) return "";

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }, [form, whatsappChannel]);

  function updateForm(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!whatsappLink) {
      window.dispatchEvent(
        new CustomEvent("andyfers_toast", {
          detail: {
            message: "Configura WhatsApp principal en contenido editable.",
          },
        })
      );

      return;
    }

    trackAnalyticsBeacon("CONTACTO_FORMULARIO", {
      metadata: {
        nombre: form.nombre,
        whatsapp: form.whatsapp,
        ciudad: form.ciudad,
        mensaje: form.mensaje,
        ubicacion: "CONTACTO_FORMULARIO",
      },
    });

    trackAnalyticsBeacon("WHATSAPP_CLICK", {
      metadata: {
        ubicacion: "CONTACTO_FORMULARIO",
        url: whatsappLink,
      },
    });

    window.open(whatsappLink, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <section className="contact-hero">
        <div className="contact-home-decor contact-home-decor-left" />
        <div className="contact-home-decor contact-home-decor-right" />

        <div className="container contact-hero-grid">
          <div>
            <h1>{hero?.titulo || "Ventas te ayuda a validar tu cotización."}</h1>

            <p>
              {hero?.contenido ||
                "La página te permite buscar productos y enviar solicitudes. El equipo de ventas confirma compatibilidad, existencia y precio final antes de continuar con el pedido."}
            </p>

            <div className="contact-hero-actions">
              <Link href={hero?.cta_url || "/catalogo"} className="btn-primary">
                {hero?.cta_texto || "Ver catálogo"}
                <ArrowRight size={18} />
              </Link>

              <Link href="/cotizacion" className="btn-secondary contact-secondary">
                Mi cotización
                <ClipboardList size={18} />
              </Link>
            </div>
          </div>

          <aside className="contact-info-panel">
            <div className="contact-info-card highlight">
              <Clock size={24} />
              <span>{horarioChannel?.etiqueta || "Horario de ventas"}</span>
              <strong>{horarioChannel?.valor || "Pendiente de configurar"}</strong>
            </div>

            <div className="contact-info-card">
              <MapPin size={22} />
              <span>{ubicacionChannel?.etiqueta || "Ubicación / cobertura"}</span>
              <strong>{ubicacionChannel?.valor || "México"}</strong>
            </div>

            <div className="contact-info-card">
              <Phone size={22} />
              <span>{whatsappChannel?.etiqueta || "WhatsApp"}</span>
              <strong>{whatsappChannel?.valor || "Pendiente de configurar"}</strong>
            </div>

            <div className="contact-info-card">
              <Mail size={22} />
              <span>{emailChannel?.etiqueta || "Correo"}</span>
              <strong>{emailChannel?.valor || "Pendiente de configurar"}</strong>
            </div>
          </aside>
        </div>
      </section>

      <section className="contact-main-section">
        <div className="container contact-main-grid">
          <main className="contact-form-panel">
            <span className="eyebrow">{formText?.etiqueta || "Mensaje rápido"}</span>

            <h2>{formText?.titulo || "Contactar a ventas"}</h2>

            <p>
              {formText?.contenido ||
                "Este formulario no guarda datos en la base. Solo prepara un mensaje para abrir WhatsApp con la información del cliente."}
            </p>

            <form className="contact-form" onSubmit={handleSubmit}>
              <label>
                Nombre
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(event) => updateForm("nombre", event.target.value)}
                  placeholder="Nombre del cliente"
                />
              </label>

              <label>
                WhatsApp del cliente
                <input
                  type="tel"
                  value={form.whatsapp}
                  onChange={(event) =>
                    updateForm("whatsapp", event.target.value)
                  }
                  placeholder="Ej. 2381234567"
                />
              </label>

              <label>
                Ciudad
                <input
                  type="text"
                  value={form.ciudad}
                  onChange={(event) => updateForm("ciudad", event.target.value)}
                  placeholder="Ej. Tehuacán"
                />
              </label>

              <label>
                Mensaje
                <textarea
                  value={form.mensaje}
                  onChange={(event) => updateForm("mensaje", event.target.value)}
                  placeholder="Describe qué producto, vehículo o duda quieres revisar."
                  rows={5}
                />
              </label>

              <button className="btn-primary full" type="submit">
                <Send size={18} />
                {formText?.cta_texto || "Abrir WhatsApp"}
              </button>
            </form>
          </main>

          <aside className="contact-process-panel">
            <span className="eyebrow">{proceso?.etiqueta || "Proceso comercial"}</span>

            <h2>{proceso?.titulo || "Cómo funciona la atención"}</h2>

            <div className="contact-process-list">
              <div>
                <strong>1. Busca productos</strong>
                <p>Consulta por línea, código, cruce, descripción o atributo.</p>
              </div>

              <div>
                <strong>2. Solicita cotización</strong>
                <p>Agrega productos y envía la solicitud con tus datos.</p>
              </div>

              <div>
                <strong>3. Ventas valida</strong>
                <p>Un asesor revisa compatibilidad, existencia y precio final.</p>
              </div>

              <div>
                <strong>4. Seguimiento externo</strong>
                <p>La venta continúa por WhatsApp, llamada o canal habitual.</p>
              </div>
            </div>

            <div className="contact-warning">
              <ShieldCheck size={20} />
              <p>
                {proceso?.contenido ||
                  "La solicitud desde la web no confirma compra ni pago. Todo pedido debe ser validado por ventas."}
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="contact-cta-section">
        <div className="container contact-cta-inner">
          <div>
            <span>{ctaFinal?.etiqueta || "Andyfers Smart Catalog"}</span>
            <h2>
              {ctaFinal?.titulo ||
                "También puedes armar una cotización desde el catálogo."}
            </h2>
          </div>

          <div className="contact-cta-actions">
            <Link href={ctaFinal?.cta_url || "/catalogo"} className="btn-primary">
              {ctaFinal?.cta_texto || "Explorar productos"}
              <ArrowRight size={18} />
            </Link>

            <Link href="/cotizacion" className="btn-secondary contact-secondary">
              Ver mi cotización
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}