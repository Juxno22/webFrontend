"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  MessageCircle,
  Send,
} from "lucide-react";
import { getChatPublico, iniciarChatPublico } from "@/app/lib/api";

const CHAT_STORAGE_KEY = "andyfers_cotizacion_chat";

function readStoredChat() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStoredChat(data) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    CHAT_STORAGE_KEY,
    JSON.stringify({
      token: data.token,
      nombre: data.nombre || "",
      whatsapp: data.whatsapp || "",
      conversation_id: data.conversation_id || null,
      updated_at: new Date().toISOString(),
    })
  );
}

function clearStoredChat() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CHAT_STORAGE_KEY);
}

export default function PublicChatStartClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const forceNew =
    searchParams.get("nuevo") === "1" || searchParams.get("reset") === "1";

  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [checkingStoredChat, setCheckingStoredChat] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function validateStoredChat() {
      try {
        setCheckingStoredChat(true);

        if (forceNew) {
          clearStoredChat();
          return;
        }

        const stored = readStoredChat();

        if (stored?.nombre) setNombre(stored.nombre);
        if (stored?.whatsapp) setWhatsapp(stored.whatsapp);

        if (!stored?.token) return;

        const response = await getChatPublico(stored.token);
        const conversation = response.data?.conversation;

        if (!conversation || conversation.estado === "CERRADO") {
          clearStoredChat();
          return;
        }

        if (!cancelled) {
          router.replace(`/cotizacion/${encodeURIComponent(stored.token)}`);
        }
      } catch {
        clearStoredChat();
      } finally {
        if (!cancelled) {
          setCheckingStoredChat(false);
        }
      }
    }

    validateStoredChat();

    return () => {
      cancelled = true;
    };
  }, [forceNew, router]);

  async function iniciarChat(event) {
    event.preventDefault();

    const cleanNombre = nombre.trim();
    const cleanWhatsapp = whatsapp.trim();
    const cleanMensaje = mensaje.trim();

    if (!cleanNombre || !cleanWhatsapp || !cleanMensaje) {
      setError("Nombre, WhatsApp y mensaje son obligatorios.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await iniciarChatPublico({
        nombre: cleanNombre,
        whatsapp: cleanWhatsapp,
        mensaje: cleanMensaje,
      });

      const token = response.data?.public_token;
      const conversation = response.data?.conversation;

      if (!token) {
        throw new Error("No se recibió el token del chat.");
      }

      saveStoredChat({
        token,
        nombre: conversation?.cliente_nombre || cleanNombre,
        whatsapp: conversation?.cliente_whatsapp || cleanWhatsapp,
        conversation_id: conversation?.id || null,
      });

      router.push(`/cotizacion/${encodeURIComponent(token)}`);
    } catch (err) {
      setError(err.message || "No se pudo abrir el chat.");
    } finally {
      setLoading(false);
    }
  }

  if (checkingStoredChat) {
    return (
      <main className="public-chat-page">
        <section className="public-chat-shell">
          <article className="public-chat-card">
            <div className="public-chat-icon">
              <Loader2 size={34} className="public-chat-spin" />
            </div>

            <span>Chat de cotización</span>
            <h1>Revisando tu conversación</h1>
            <p>Estamos verificando si tienes un chat abierto con Andyfers.</p>
          </article>
        </section>
      </main>
    );
  }

  return (
    <main className="public-chat-page">
      <section className="public-chat-shell">
        <Link href="/" className="public-chat-back">
          <ArrowLeft size={18} />
          Volver a Andyfers
        </Link>

        <article className="public-chat-card">
          <div className="public-chat-icon">
            <MessageCircle size={34} />
          </div>

          <span>Chat de cotización</span>

          <h1>Escríbenos para cotizar</h1>

          <p>
            Déjanos tus datos y tu mensaje. Un asesor de Andyfers te responderá
            desde este mismo chat.
          </p>

          {error && (
            <div className="public-chat-alert">
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          <form className="public-chat-form" onSubmit={iniciarChat}>
            <label>
              Nombre
              <input
                type="text"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Tu nombre"
                required
              />
            </label>

            <label>
              WhatsApp
              <input
                type="tel"
                value={whatsapp}
                onChange={(event) => setWhatsapp(event.target.value)}
                placeholder="Ej. 2381234567"
                required
              />
            </label>

            <label className="public-chat-form-full">
              Mensaje
              <textarea
                value={mensaje}
                onChange={(event) => setMensaje(event.target.value)}
                placeholder="Cuéntanos qué producto necesitas, para qué vehículo o qué duda tienes..."
                rows={4}
                required
              />
            </label>

            <button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 size={18} className="public-chat-spin" />
              ) : (
                <Send size={18} />
              )}
              {loading ? "Abriendo chat..." : "Iniciar chat"}
            </button>
          </form>
        </article>
      </section>
    </main>
  );
}