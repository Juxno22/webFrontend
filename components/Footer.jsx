"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSiteContacto, getSiteContent } from "@/app/lib/api";

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

export default function Footer() {
  const [contentBlocks, setContentBlocks] = useState([]);
  const [contactChannels, setContactChannels] = useState([]);

  useEffect(() => {
    let active = true;

    async function loadFooterContent() {
      try {
        const [contentRes, contactRes] = await Promise.all([
          getSiteContent("GLOBAL"),
          getSiteContacto(),
        ]);

        if (!active) return;

        setContentBlocks(contentRes.data || []);
        setContactChannels(contactRes.data || []);
      } catch {
        if (!active) return;

        setContentBlocks([]);
        setContactChannels([]);
      }
    }

    loadFooterContent();

    return () => {
      active = false;
    };
  }, []);

  const footerText = findBlock(contentBlocks, "footer_texto_principal");
  const whatsapp = findChannel(
    contactChannels,
    "whatsapp_principal",
    "WHATSAPP"
  );
  const email = findChannel(contactChannels, "email_principal", "EMAIL");

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <div className="footer-brand">ANDYFERS</div>

          <p>
            {footerText?.contenido ||
              "Catálogo inteligente de refacciones automotrices con asistencia para encontrar productos compatibles y solicitar cotización."}
          </p>
        </div>

        <div>
          <h4>Navegación</h4>
          <Link href="/">Inicio</Link>
          <Link href="/catalogo">Catálogo</Link>
          <Link href="/cotizacion">Mi cotización</Link>
          <Link href="/contacto">Contacto</Link>
        </div>

        <div>
          <h4>Contacto</h4>
          <p>
            {whatsapp?.valor ? `WhatsApp: ${whatsapp.valor}` : "WhatsApp pendiente"}
          </p>
          <p>{email?.valor ? `Correo: ${email.valor}` : "Correo pendiente"}</p>
        </div>

        <nav className="footer-legal-links" aria-label="Información legal">
          <Link href="/aviso-privacidad">Aviso de privacidad</Link>
          <Link href="/terminos-condiciones">Términos y condiciones</Link>
          <Link href="/politica-envios">Envíos</Link>
          <Link href="/politica-devoluciones">Devoluciones</Link>
        </nav>

        <div>
          <h4>Importante</h4>
          <p>
            La disponibilidad, compatibilidad y precio final serán validados por
            un asesor de ventas.
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} Andyfers. Todos los derechos reservados.
        </span>
      </div>
    </footer>
  );
}