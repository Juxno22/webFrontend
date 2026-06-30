"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Clock3,
  Loader2,
  MessageCircle,
  Send,
} from "lucide-react";
import { getChatPublico, sendChatPublicoMensaje } from "@/app/lib/api";

function formatDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatTime(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getEstadoLabel(estado) {
  switch (estado) {
    case "ABIERTO":
      return "Abierto";
    case "ATENDIENDO":
      return "En atención";
    case "CERRADO":
      return "Cerrado";
    default:
      return estado || "—";
  }
}

function getAuthor(message) {
  if (message.emisor_tipo === "ADMIN") return "Andyfers";
  if (message.emisor_tipo === "SISTEMA") return "Sistema";
  return message.emisor_nombre || "Tú";
}

function getLastMessageId(messages = []) {
  return messages.reduce((max, item) => Math.max(max, Number(item.id || 0)), 0);
}

function mergeMessages(current = [], incoming = []) {
  const existing = new Set(current.map((item) => Number(item.id)));

  return [
    ...current,
    ...incoming.filter((item) => !existing.has(Number(item.id))),
  ];
}

export default function PublicChatClient({ token }) {
  const messagesEndRef = useRef(null);
  const lastMessageIdRef = useRef(0);

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [mensaje, setMensaje] = useState("");

  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const isClosed = conversation?.estado === "CERRADO";

  const loadChat = useCallback(
    async ({ incremental = false, silent = false } = {}) => {
      try {
        if (!silent) setLoading(true);
        if (silent) setPolling(true);

        setError("");

        const params = incremental
          ? { after_id: lastMessageIdRef.current }
          : {};

        const response = await getChatPublico(token, params);

        const nextConversation = response.data?.conversation || null;
        const incomingMessages = response.data?.messages || [];

        setConversation(nextConversation);

        if (incremental) {
          if (incomingMessages.length > 0) {
            setMessages((current) => {
              const merged = mergeMessages(current, incomingMessages);
              lastMessageIdRef.current = getLastMessageId(merged);
              return merged;
            });
          }
        } else {
          setMessages(incomingMessages);
          lastMessageIdRef.current = getLastMessageId(incomingMessages);
        }
      } catch (err) {
        setError(err.message || "No se pudo cargar el chat.");
      } finally {
        setLoading(false);
        setPolling(false);
      }
    },
    [token]
  );

  useEffect(() => {
    loadChat();
  }, [loadChat]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!document.hidden) {
        loadChat({ incremental: true, silent: true });
      }
    }, 5000);

    return () => window.clearInterval(interval);
  }, [loadChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  async function sendMessage(event) {
    event.preventDefault();

    const clean = mensaje.trim();

    if (!clean || isClosed) return;

    try {
      setSending(true);
      setError("");

      await sendChatPublicoMensaje(token, clean);

      setMensaje("");
      await loadChat({ incremental: true, silent: true });
    } catch (err) {
      setError(err.message || "No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  }

  if (loading && !conversation) {
    return (
      <main className="public-chat-page">
        <section className="public-chat-shell">
          <article className="public-chat-card">
            <Loader2 size={34} className="public-chat-spin" />
            <p>Cargando conversación...</p>
          </article>
        </section>
      </main>
    );
  }

  if (error && !conversation) {
    return (
      <main className="public-chat-page">
        <section className="public-chat-shell">
          <Link href="/chat" className="public-chat-back">
            <ArrowLeft size={18} />
            Volver
          </Link>

          <article className="public-chat-card">
            <AlertTriangle size={34} />
            <h1>No se pudo abrir el chat</h1>
            <p>{error}</p>
          </article>
        </section>
      </main>
    );
  }

  return (
    <main className="public-chat-page">
      <section className="public-chat-shell public-chat-shell-wide">
        <Link href="/" className="public-chat-back">
          <ArrowLeft size={18} />
          Volver a Andyfers
        </Link>

        <article className="public-chat-window">
          <header className="public-chat-window-head">
            <div className="public-chat-avatar">
              <MessageCircle size={26} />
            </div>

            <div>
              <span>Chat Andyfers</span>
              <h1>{conversation?.cliente_nombre || "Conversación"}</h1>
              <p>
                {conversation?.cliente_whatsapp || "Sin WhatsApp"} ·{" "}
                {getEstadoLabel(conversation?.estado)}
              </p>
            </div>

            <mark>{getEstadoLabel(conversation?.estado)}</mark>
          </header>

          {error && (
            <div className="public-chat-alert">
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          <section className="public-chat-meta">
            <Clock3 size={17} />
            Última actividad:{" "}
            {formatDate(
              conversation?.last_message_at ||
                conversation?.updated_at ||
                conversation?.created_at
            )}
            {polling ? " · actualizando..." : ""}
          </section>

          <section className="public-chat-messages">
            {messages.length > 0 ? (
              messages.map((message) => (
                <article
                  key={message.id}
                  className={`public-chat-message from-${String(
                    message.emisor_tipo || ""
                  ).toLowerCase()}`}
                >
                  <div>
                    <strong>{getAuthor(message)}</strong>
                    <span>{formatTime(message.created_at)}</span>
                  </div>

                  <p>{message.mensaje}</p>
                </article>
              ))
            ) : (
              <div className="public-chat-empty">
                Todavía no hay mensajes. Escribe para iniciar la conversación.
              </div>
            )}

            <div ref={messagesEndRef} />
          </section>

          {isClosed ? (
            <div className="public-chat-closed">
              Esta conversación está cerrada. Para una nueva duda, inicia otro
              chat.
            </div>
          ) : (
            <form className="public-chat-compose" onSubmit={sendMessage}>
              <textarea
                value={mensaje}
                onChange={(event) => setMensaje(event.target.value)}
                placeholder="Escribe tu mensaje..."
                rows={3}
              />

              <button type="submit" disabled={sending || !mensaje.trim()}>
                {sending ? (
                  <Loader2 size={18} className="public-chat-spin" />
                ) : (
                  <Send size={18} />
                )}
                Enviar
              </button>
            </form>
          )}
        </article>
      </section>
    </main>
  );
}