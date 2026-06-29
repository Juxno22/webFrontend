"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

const CHAT_SESSION_KEY = "andyfers_ai_session_id";

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

function isApproximateProduct(product = {}) {
  return Boolean(
    product.busqueda_relajada_medidas ||
    product.coincidencia_aproximada ||
    product.es_aproximado,
  );
}

function getRelaxedSearchInfo(message = {}) {
  const relaxed =
    message.intent?.busqueda_medidas_relajada ||
    message.meta?.busqueda_medidas_relajada ||
    null;

  if (!relaxed?.activa) return null;

  return {
    active: true,
    motivo: relaxed.motivo || "",
    etiqueta: relaxed.etiqueta || "",
    vehiculoRelajado: Boolean(relaxed.vehiculo_relajado),
    medidaFiltrada: relaxed.medida_filtrada || null,
  };
}

function renderBotText(text = "") {
  return String(text)
    .split("\n")
    .map((line, index) => (
      <span key={`${index}-${line.slice(0, 12)}`}>
        {index > 0 && <br />}
        {line}
      </span>
    ));
}

function buildRelaxedSearchNotice(relaxedSearch = null) {
  if (!relaxedSearch?.active) return "";

  if (relaxedSearch.motivo === "PRODUCT_ONLY_WITHOUT_MEASUREMENT_FILTERS") {
    return "No encontré coincidencia exacta con todas las medidas. Te muestro opciones por pieza y vehículo para validar con ventas.";
  }

  if (
    relaxedSearch.motivo ===
    "PRODUCT_ONLY_WITHOUT_MEASUREMENTS_OR_VEHICLE_FILTER"
  ) {
    return "No encontré coincidencia exacta con medidas ni aplicación vehicular. Te muestro opciones orientativas del catálogo para validar físicamente.";
  }

  if (relaxedSearch.vehiculoRelajado) {
    return "No encontré coincidencia exacta con todas las medidas y el vehículo. Te muestro opciones aproximadas por medida principal.";
  }

  return "No encontré coincidencia exacta con todas las medidas. Te muestro opciones aproximadas por medida principal.";
}

function dispatchToast(message) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("andyfers_toast", {
      detail: { message },
    }),
  );
}

function HorseMascot({ active }) {
  const frames = Array.from(
    { length: 16 },
    (_, index) => `/img/horse-clean/horse${index + 1}.png`,
  );

  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    if (!active) return;

    // Preload diferido: solo cuando la mascota está visible.
    frames.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [active]);

  useEffect(() => {
    if (!active) return;

    const interval = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % frames.length);
    }, 180);

    return () => window.clearInterval(interval);
  }, [active, frames.length]);

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
  const [mascotActive, setMascotActive] = useState(false);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
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

  function openChatProductDetail(product) {
    const code = getProductCode(product);

    if (!code) return;

    router.push(`/producto/${encodeURIComponent(code)}`);
  }

  function handleChatProductKeyDown(event, product) {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    openChatProductDetail(product);
  }

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = window.localStorage.getItem(CHAT_SESSION_KEY);

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
    window.localStorage.setItem(CHAT_SESSION_KEY, nextSessionId);
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
    } catch (error) {
      if (typeof window !== "undefined") {
        const shouldForgetSession =
          error?.message?.includes("404") ||
          error?.message?.toLowerCase?.().includes("sesión") ||
          error?.message?.toLowerCase?.().includes("sesion");

        if (shouldForgetSession) {
          window.localStorage.removeItem(CHAT_SESSION_KEY);
        }
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

    dispatchToast(
      isApproximateProduct(product)
        ? "Producto agregado para validar medidas en cotización"
        : "Producto agregado a tu cotización",
    );
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
        busqueda_medidas_relajada:
          data.intencion?.busqueda_medidas_relajada || null,
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

              const messageContext =
                message.context || message.meta?.contexto_corto || null;

              const contextLabel = messageContext
                ? [
                  messageContext.marca_auto,
                  messageContext.modelo_auto,
                  messageContext.anio,
                  messageContext.motor,
                ]
                  .filter(Boolean)
                  .join(" ")
                : "";

              const relaxedSearch = getRelaxedSearchInfo(message);
              const relaxedSearchNotice =
                buildRelaxedSearchNotice(relaxedSearch);

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
                    {message.role === "bot"
                      ? renderBotText(message.text)
                      : message.text}
                  </div>

                  {contextLabel && (
                    <div className="andy-chat-context-chip">
                      Contexto: {contextLabel}
                    </div>
                  )}

                  {message.role === "bot" &&
                    message.followup &&
                    !(message.products?.length > 0) && (
                      <div className="andy-chat-followup">
                        {message.followup.preguntas.length > 0 && (
                          <div className="andy-chat-followup-questions">
                            {message.followup.preguntas.map(
                              (question, questionIndex) => (
                                <div
                                  className="andy-chat-followup-question"
                                  key={`${message.id}-q-${questionIndex}`}
                                >
                                  {question}
                                </div>
                              ),
                            )}
                          </div>
                        )}

                        {message.followup.respuestasRapidas.length > 0 && (
                          <div className="andy-chat-followup-actions">
                            {message.followup.respuestasRapidas.map(
                              (reply, replyIndex) => (
                                <button
                                  type="button"
                                  className="andy-chat-followup-btn"
                                  key={`${message.id}-r-${replyIndex}`}
                                  onClick={() => handleQuickReply(reply)}
                                  disabled={loading}
                                >
                                  {reply}
                                </button>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    )}

                  {message.role === "bot" &&
                    message.products?.length > 0 &&
                    relaxedSearchNotice && (
                      <div className="andy-chat-approx-alert">
                        <strong>Opciones aproximadas</strong>
                        <span>{relaxedSearchNotice}</span>
                      </div>
                    )}

                  {message.products?.length > 0 && (
                    <div className="andy-chat-products">
                      {message.products.map((product) => {
                        const code = getProductCode(product);
                        const approximateProduct =
                          isApproximateProduct(product) ||
                          Boolean(relaxedSearch?.active);

                        const productForQuote = {
                          ...product,
                          busqueda_relajada_medidas: approximateProduct,
                        };

                        return (
                          <article
                            className={`andy-chat-product-card ${approximateProduct ? "is-approximate" : ""
                              } ${code ? "is-clickable" : ""}`}
                            key={`${product.producto_id || product.id}-${code}`}
                            role={code ? "link" : undefined} fhref={`/producto/${encodeURIComponent(code)}`}
                            tabIndex={code ? 0 : undefined}
                            aria-label={
                              code ? `Ver detalle de ${code}` : undefined
                            }
                            onClick={() => openChatProductDetail(product)}
                            onKeyDown={(event) =>
                              handleChatProductKeyDown(event, product)
                            }
                          >
                            <div className="andy-chat-product-main">
                              <strong>{code || "Sin código"}</strong>
                              <p>{product.descripcion}</p>
                              <span>
                                {product.familia ||
                                  product.categoria ||
                                  "Producto"}
                              </span>

                              {approximateProduct && (
                                <div className="andy-chat-product-badges">
                                  <em>Coincidencia aproximada</em>
                                  <em>Validar medidas</em>
                                </div>
                              )}
                            </div>

                            <div className="andy-chat-product-actions">
                              {code && (
                                <Link
                                  href={`/producto/${encodeURIComponent(code)}`}
                                  className="andy-chat-product-link"
                                  title="Ver detalle"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <ExternalLink size={15} />
                                </Link>
                              )}

                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleAddToQuote(productForQuote);
                                }}
                              >
                                <ShoppingBag size={15} />
                                {approximateProduct
                                  ? "Agregar para validar"
                                  : "Agregar"}
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
      )}

      {!open && (
        <button
          type="button"
          className="andy-chat-closed"
          onMouseEnter={() => setMascotActive(true)}
          onFocus={() => setMascotActive(true)}
          onClick={() => {
            setMascotActive(true);
            setOpen(true);
          }}
          aria-label="Abrir asistente Andyfers"
        >
          <div className="andy-chat-speech-bubble">
            ¿Tienes dudas sobre refacciones?
            <br />
            ¡Habla conmigo!
          </div>

          <div className="andy-chat-horse-container">
            <HorseMascot active={mascotActive && !open} />
          </div>
        </button>
      )}
    </div>
  );
}
