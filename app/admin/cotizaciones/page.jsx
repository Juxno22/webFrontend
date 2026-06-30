import { Suspense } from "react";
import "@/app/styles/public-chat.css";
import PublicChatStartClient from "@/components/PublicChatStartClient";

export const metadata = {
  title: "Chat de cotización | Andyfers",
  description:
    "Chatea con Andyfers para resolver dudas, pedir apoyo comercial y solicitar cotizaciones.",
};

function LoadingChatStart() {
  return (
    <main className="public-chat-page">
      <section className="public-chat-shell">
        <article className="public-chat-card">
          <p>Cargando chat...</p>
        </article>
      </section>
    </main>
  );
}

export default function CotizacionPage() {
  return (
    <Suspense fallback={<LoadingChatStart />}>
      <PublicChatStartClient />
    </Suspense>
  );
}