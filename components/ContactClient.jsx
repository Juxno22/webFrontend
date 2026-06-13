"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
    ArrowRight,
    Clock,
    ClipboardList,
    Mail,
    MapPin,
    MessageCircle,
    Phone,
    Send,
    ShieldCheck,
} from "lucide-react";

const CONTACT_WHATSAPP = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP || "";
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "";
const CONTACT_CITY = process.env.NEXT_PUBLIC_CONTACT_CITY || "México";

function cleanPhone(value) {
    return String(value || "").replace(/[^\d]/g, "");
}

export default function ContactClient() {
    const [form, setForm] = useState({
        nombre: "",
        whatsapp: "",
        ciudad: "",
        mensaje: "",
    });

    const whatsappLink = useMemo(() => {
        const phone = cleanPhone(CONTACT_WHATSAPP);

        if (!phone) return "";

        const text = `Hola, quiero contactar a ventas de Andyfers.
            Nombre: ${form.nombre || "-"}
            WhatsApp: ${form.whatsapp || "-"}
            Ciudad: ${form.ciudad || "-"}
            Mensaje: ${form.mensaje || "Quiero información sobre productos y cotización."}`;
        return `https://wa.me/52${phone}?text=${encodeURIComponent(text)}`;
    }, [form]);

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
                        message: "Configura NEXT_PUBLIC_CONTACT_WHATSAPP para activar WhatsApp.",
                    },
                })
            );

            return;
        }

        window.open(whatsappLink, "_blank", "noopener,noreferrer");
    }

    return (
        <>
            <section className="contact-hero">
                <div className="contact-home-decor contact-home-decor-left" />
                <div className="contact-home-decor contact-home-decor-right" />
                <div className="container contact-hero-grid">
                    <div>
                        <h1>Ventas te ayuda a validar tu cotización.</h1>

                        <p>
                            La página te permite buscar productos y enviar solicitudes. El
                            equipo de ventas confirma compatibilidad, existencia y precio final
                            antes de continuar con el pedido.
                        </p>

                        <div className="contact-hero-actions">
                            <Link href="/catalogo" className="btn-primary">
                                Ver catálogo
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
                            <span>Horario de ventas</span>
                            <strong>8:00 a.m. a 8:00 p.m.</strong>
                        </div>

                        <div className="contact-info-card">
                            <MapPin size={22} />
                            <span>Ubicación / cobertura</span>
                            <strong>{CONTACT_CITY}</strong>
                        </div>

                        <div className="contact-info-card">
                            <Phone size={22} />
                            <span>WhatsApp</span>
                            <strong>{CONTACT_WHATSAPP || "Pendiente de configurar"}</strong>
                        </div>

                        <div className="contact-info-card">
                            <Mail size={22} />
                            <span>Correo</span>
                            <strong>{CONTACT_EMAIL || "Pendiente de configurar"}</strong>
                        </div>
                    </aside>
                </div>
            </section>

            <section className="contact-main-section">
                <div className="container contact-main-grid">
                    <main className="contact-form-panel">
                        <span className="eyebrow">Mensaje rápido</span>

                        <h2>Contactar a ventas</h2>

                        <p>
                            Este formulario no guarda datos en la base. Solo prepara un mensaje
                            para abrir WhatsApp con la información del cliente.
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
                                    onChange={(event) => updateForm("whatsapp", event.target.value)}
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
                                Abrir WhatsApp
                            </button>
                        </form>
                    </main>

                    <aside className="contact-process-panel">
                        <span className="eyebrow">Proceso comercial</span>

                        <h2>Cómo funciona la atención</h2>

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
                                La solicitud desde la web no confirma compra ni pago. Todo pedido
                                debe ser validado por ventas.
                            </p>
                        </div>
                    </aside>
                </div>
            </section>

            <section className="contact-cta-section">
                <div className="container contact-cta-inner">
                    <div>
                        <span>Andyfers Smart Catalog</span>
                        <h2>También puedes armar una cotización desde el catálogo.</h2>
                    </div>

                    <div className="contact-cta-actions">
                        <Link href="/catalogo" className="btn-primary">
                            Explorar productos
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