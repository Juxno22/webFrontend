import Link from "next/link";
import { MessageCircle, Sparkles } from "lucide-react";

export const metadata = {
  title: "Chat clientes | Admin Andyfers",
};

export default function AdminChatPage() {
  return (
    <section className="admin-home-os">
      <div className="admin-home-os-hero">
        <span>Atención en tiempo real</span>
        <h1>Chat clientes</h1>
        <p>
          Este será el centro de conversaciones con compradores y solicitudes de
          cotización. El siguiente bloque agregará WebSockets, bandeja tipo
          Messenger y chat público para clientes.
        </p>
      </div>

      <div className="admin-home-priority-grid">
        <article className="admin-home-priority-card chat">
          <div>
            <MessageCircle size={34} />
            <span>Próximo módulo</span>
            <h2>Bandeja Messenger</h2>
            <p>
              Lista de conversaciones, mensajes en tiempo real, no leídos,
              asignación de atención y cierre de chats.
            </p>
          </div>

          <strong>
            WebSockets pendiente
            <Sparkles size={17} />
          </strong>
        </article>

        <Link href="/admin/cotizaciones" className="admin-home-priority-card">
          <div>
            <MessageCircle size={34} />
            <span>Mientras tanto</span>
            <h2>Cotizaciones</h2>
            <p>
              Revisa las solicitudes actuales de cotización y estados
              comerciales antes de activar el chat en tiempo real.
            </p>
          </div>

          <strong>Ir a cotizaciones</strong>
        </Link>
      </div>
    </section>
  );
}