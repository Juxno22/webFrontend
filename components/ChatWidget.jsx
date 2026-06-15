"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Loader2,
  RotateCcw,
  Send,
  ShoppingBag,
  X,
} from "lucide-react";
import { buscarConIA } from "../app/lib/api";
import { addToQuoteCart } from "../app/lib/quoteCart";

const SESSION_STORAGE_KEY = "andyfers_ai_session_id";

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getProductCode(product) {
  return product.codigo_andyfers || product.codigo_importacion || "";
}

function normalizeProduct(product) {
  return {
    ...product,
    id: product.id || product.producto_id,
  };
}

function dispatchToast(message) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("andyfers_toast", {
      detail: { message },
    })
  );
}

function HorseMascot() {
  const frames = Array.from(
    { length: 16 },
    (_, index) => `/img/horse-clean/horse${index + 1}.png`
  );

  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    // Preload para evitar parpadeos entre frames
    frames.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % frames.length);
    }, 180);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <img
      src={frames[frameIndex]}
      alt=""
      className="andy-chat-horse-img"
      aria-hidden="true"
      draggable="false"
    />
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "bot",
      text: "🐴 ¡Hola! Soy el asistente virtual de Andyfers. Estoy conectado a la base de datos de refacciones. ¿En qué te ayudo hoy?",
      products: [],
    },
  ]);

  const bodyRef = useRef(null);
  const lastBotRowRef = useRef(null);
  const loadingRowRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);

    if (stored) {
      setSessionId(stored);
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    const lastMessage = messages[messages.length - 1];

    if (!lastMessage || lastMessage.id === "welcome") return;

    const frame = window.requestAnimationFrame(() => {
      if (lastMessage.role === "bot" && lastBotRowRef.current) {
        lastBotRowRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        return;
      }

      if (bodyRef.current) {
        bodyRef.current.scrollTo({
          top: bodyRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [messages, open]);

  useEffect(() => {
    if (!open || !loading) return;

    const frame = window.requestAnimationFrame(() => {
      if (loadingRowRef.current) {
        loadingRowRef.current.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [loading, open]);

  function saveSession(nextSessionId) {
    if (!nextSessionId || typeof window === "undefined") return;

    setSessionId(nextSessionId);
    window.localStorage.setItem(SESSION_STORAGE_KEY, nextSessionId);
  }

  function addBotMessage(payload) {
    setMessages((current) => [
      ...current,
      {
        id: createId(),
        role: "bot",
        text: payload.text,
        products: payload.products || [],
        meta: payload.meta || null,
        intent: payload.intent || null,
        context: payload.context || payload.meta?.contexto_corto || null,
        followup: payload.followup || null,
        service: payload.service || null,
        requiresMoreData: Boolean(payload.requiresMoreData),
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  async function sendQuestion(questionText) {
    const pregunta = String(questionText || "").trim();

    if (!pregunta || loading) return;

    setMessages((current) => [
      ...current,
      {
        id: createId(),
        role: "user",
        text: pregunta,
        products: [],
      },
    ]);

    setInput("");
    setLoading(true);

    try {
      const data = await buscarConIA({
        pregunta,
        origen: "CHAT_PUBLICO",
        session_id: sessionId || null,
      });

      if (data.session_id) {
        saveSession(data.session_id);
      }

      setMessages((current) => [
        ...current,
        buildBotMessageFromAiResponse(data),
      ]);
    } catch (error) {
      addBotMessage({
        text:
          error.message ||
          "No pude conectarme con el asistente. Intenta nuevamente.",
        products: [],
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await sendQuestion(input);
  }

  async function resetSession() {
    if (!sessionId) {
      setMessages([
        {
          id: "welcome-reset",
          role: "bot",
          text: "Listo. Puedes iniciar una nueva búsqueda escribiendo tu vehículo o la pieza que necesitas.",
          products: [],
        },
      ]);
      return;
    }

    setLoading(true);

    try {
      const data = await buscarConIA({
        pregunta: "Olvida mi carro",
        origen: "CHAT_PUBLICO",
        session_id: sessionId,
      });

      if (data.session_id) {
        saveSession(data.session_id);
      }

      setMessages([buildBotMessageFromAiResponse(data)]);
    } catch {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
      }

      setSessionId("");
      setMessages([
        {
          id: createId(),
          role: "bot",
          text: "Listo. Puedes iniciar una nueva búsqueda.",
          products: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleAddToQuote(product) {
    const normalized = normalizeProduct(product);

    addToQuoteCart(normalized);
    dispatchToast("Producto agregado a tu cotización");
  }

  function normalizeFollowup(followup) {
    if (!followup || typeof followup !== "object") {
      return null;
    }

    const questions = Array.isArray(followup.preguntas_seguimiento)
      ? followup.preguntas_seguimiento.filter(Boolean)
      : [];

    const quickReplies = Array.isArray(followup.respuestas_rapidas)
      ? followup.respuestas_rapidas.filter(Boolean)
      : [];

    if (!questions.length && !quickReplies.length) {
      return null;
    }

    return {
      requiereSeguimiento: Boolean(followup.requiere_seguimiento),
      bloqueante: Boolean(followup.bloqueante),
      siguienteAccion: followup.siguiente_accion || "NONE",
      datosFaltantes: Array.isArray(followup.datos_faltantes)
        ? followup.datos_faltantes
        : [],
      preguntas: questions.slice(0, 3),
      respuestasRapidas: quickReplies.slice(0, 6),
    };
  }

  function buildBotMessageFromAiResponse(data = {}) {
    const products = Array.isArray(data.productos) ? data.productos : [];
    const hasProducts = products.length > 0;

    return {
      id: createId(),
      role: "bot",
      text:
        data.respuesta ||
        "No pude generar una respuesta en este momento. Intenta con más datos del vehículo o el código de la pieza.",
      products,
      intent: data.intencion || null,
      context: data.contexto_corto || null,
      // Si ya hay productos, las acciones viven en la tarjeta del producto.
      // No mandamos respuestas rápidas como mensaje nuevo para evitar respuestas genéricas.
      followup: hasProducts ? null : normalizeFollowup(data.seguimiento),
      service: data.servicio_ia || null,
      requiresMoreData: Boolean(data.requiere_mas_datos),
      meta: {
        total_candidatos: data.total_candidatos || 0,
        total_recomendados: data.total_recomendados || 0,
        requiere_mas_datos: Boolean(data.requiere_mas_datos),
        modo_busqueda: data.intencion?.modo_busqueda,
        contexto_corto: data.contexto_corto,
      },
      createdAt: new Date().toISOString(),
    };
  }

  async function handleQuickReply(reply) {
    const value = String(reply || "").trim();

    if (!value || loading) return;

    await sendQuestion(value);
  }

  return (
    <div className={`andy-chat-widget ${open ? "is-open" : ""}`}>
      {open && (
        <section className="andy-chat-window" aria-label="Asistente Andyfers">
          <header className="andy-chat-header">
            <div className="andy-chat-header-info">
              <strong>Andy-Bot</strong>
              <span>
                {sessionId
                  ? "En línea · memoria corta activa"
                  : "En línea · busca refacciones"}
              </span>
            </div>

            <div className="andy-chat-header-actions">
              <button
                type="button"
                onClick={resetSession}
                aria-label="Reiniciar búsqueda"
                title="Reiniciar búsqueda"
              >
                <RotateCcw size={16} />
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar chat"
                title="Cerrar"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          <div className="andy-chat-body" ref={bodyRef}>
            {messages.map((message, index) => {
              const isLastBotMessage =
                message.role === "bot" &&
                index === messages.length - 1 &&
                message.id !== "welcome";
              const messageContext = message.context || message.meta?.contexto_corto || null;

              return (
                <div
                  ref={isLastBotMessage ? lastBotRowRef : null}
                  className={`andy-chat-row ${message.role === "user" ? "is-user" : "is-bot"
                    }`}
                  key={message.id}
                >
                  <div
                    className={`andy-chat-message ${message.role === "user" ? "is-user" : "is-bot"
                      }`}
                  >
                    {message.text}
                  </div>

                  {messageContext && Object.keys(messageContext).length > 0 && (
                    <div className="andy-chat-context-chip">
                      Contexto:{" "}
                      {[
                        messageContext.marca_auto,
                        messageContext.modelo_auto,
                        messageContext.anio,
                        messageContext.motor,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    </div>
                  )}

                  {message.role === "bot" && message.followup && !(message.products?.length > 0) && (
                    <div className="andy-chat-followup">
                      {message.followup.preguntas.length > 0 && (
                        <div className="andy-chat-followup-questions">
                          {message.followup.preguntas.map((question, questionIndex) => (
                            <div
                              className="andy-chat-followup-question"
                              key={`${message.id}-q-${questionIndex}`}
                            >
                              {question}
                            </div>
                          ))}
                        </div>
                      )}

                      {message.followup.respuestasRapidas.length > 0 && (
                        <div className="andy-chat-followup-actions">
                          {message.followup.respuestasRapidas.map((reply, replyIndex) => (
                            <button
                              type="button"
                              className="andy-chat-followup-btn"
                              key={`${message.id}-r-${replyIndex}`}
                              onClick={() => handleQuickReply(reply)}
                              disabled={loading}
                            >
                              {reply}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {message.products?.length > 0 && (
                    <div className="andy-chat-products">
                      {message.products.map((product) => {
                        const code = getProductCode(product);

                        return (
                          <article
                            className="andy-chat-product-card"
                            key={`${product.producto_id || product.id}-${code}`}
                          >
                            <div className="andy-chat-product-main">
                              <strong>{code || "Sin código"}</strong>
                              <p>{product.descripcion}</p>
                              <span>
                                {product.familia ||
                                  product.categoria ||
                                  "Producto"}
                              </span>
                            </div>

                            <div className="andy-chat-product-actions">
                              {code && (
                                <Link
                                  href={`/producto/${encodeURIComponent(code)}`}
                                  className="andy-chat-product-link"
                                  title="Ver detalle"
                                >
                                  <ExternalLink size={15} />
                                </Link>
                              )}

                              <button
                                type="button"
                                onClick={() => handleAddToQuote(product)}
                              >
                                <ShoppingBag size={15} />
                                Agregar
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            {loading && (
              <div className="andy-chat-row is-bot" ref={loadingRowRef}>
                <div className="andy-chat-message is-bot andy-chat-loading">
                  <Loader2 size={16} className="andy-chat-spin" />
                  Buscando en el catálogo Andyfers...
                </div>
              </div>
            )}
          </div>

          <form className="andy-chat-footer" onSubmit={handleSubmit}>
            <input
              type="text"
              className="andy-chat-input"
              placeholder="Pregunta por una refacción..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={loading}
            />

            <button
              type="submit"
              className="andy-chat-send-btn"
              disabled={loading || !input.trim()}
              aria-label="Enviar mensaje"
            >
              {loading ? (
                <Loader2 size={20} className="andy-chat-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </form>
        </section>
      )
      }

      {
        !open && (
          <button
            type="button"
            className="andy-chat-closed"
            onClick={() => setOpen(true)}
            aria-label="Abrir asistente Andyfers"
          >
            <div className="andy-chat-speech-bubble">
              ¿Tienes dudas sobre refacciones?
              <br />
              ¡Habla conmigo!
            </div>

            <div className="andy-chat-horse-container">
              <HorseMascot />
            </div>
          </button>
        )
      }
    </div >
  );
}