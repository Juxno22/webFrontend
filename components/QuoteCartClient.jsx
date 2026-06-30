"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";

export default function QuoteCartClient() {
  return (
    <main className="public-chat-page">
      <section className="public-chat-shell">
        <article className="public-chat-card">
          <div className="public-chat-icon">
            <MessageCircle size={34} />
          </div>

          <span>Chat de cotización</span>

          <h1>La cotización ahora es por chat</h1>

          <p>
            El carrito de cotización fue reemplazado por una conversación directa
            con ventas. Escríbenos tu duda, producto o código para que un asesor
            pueda validar existencia, compatibilidad y precio.
          </p>

          <Link href="/cotizacion?nuevo=1" className="public-chat-legacy-link">
            Abrir chat de cotización
          </Link>
        </article>
      </section>
    </main>
  );
}