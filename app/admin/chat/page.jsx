import { Suspense } from "react";
import "@/app/styles/public-chat.css";
import PublicChatStartClient from "@/components/PublicChatStartClient";

export const metadata = {
  title: "Chat comercial | Andyfers",
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

export default function ChatStartPage() {
  return (
    <Suspense fallback={<LoadingChatStart />}>
      <PublicChatStartClient />
    </Suspense>
  );
}