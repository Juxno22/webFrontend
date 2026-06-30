"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  ShoppingCart,
  UserRound,
  XCircle,
} from "lucide-react";
import {
  createAdminChatFromCotizacion,
  getAdminChatConversacion,
  getAdminChatConversaciones,
  sendAdminChatMensaje,
  updateAdminChatEstado,
} from "@/app/lib/adminApi";
import { useAdminAuth } from "@/app/hooks/useAdminAuth";

const ESTADOS_CHAT = [
  { value: "", label: "Todos" },
  { value: "ABIERTO", label: "Abiertos" },
  { value: "ATENDIENDO", label: "Atendiendo" },
  { value: "CERRADO", label: "Cerrados" },
];

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

function formatNumber(value) {
  return new Intl.NumberFormat("es-MX").format(Number(value || 0));
}

function getEstadoLabel(estado) {
  switch (estado) {
    case "ABIERTO":
      return "Abierto";
    case "ATENDIENDO":
      return "Atendiendo";
    case "CERRADO":
      return "Cerrado";
    default:
      return estado || "—";
  }
}

function getIntencionLabel(value) {
  switch (value) {
    case "COTIZACION":
      return "Cotización";
    case "DUDA_PRODUCTO":
      return "Duda producto";
    case "COMPATIBILIDAD":
      return "Compatibilidad";
    case "EXISTENCIA_PRECIO":
      return "Existencia / precio";
    case "ENVIO":
      return "Envío";
    case "SEGUIMIENTO_PEDIDO":
      return "Seguimiento pedido";
    case "OTRO":
      return "Otra duda";
    default:
      return "Consulta";
  }
}

function getInitials(name = "") {
  const parts = String(name || "Cliente")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "C";

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getMessageAuthor(message = {}) {
  if (message.emisor_tipo === "ADMIN") return message.emisor_nombre || "Admin";
  if (message.emisor_tipo === "SISTEMA") return "Sistema";
  return message.emisor_nombre || "Cliente";
}

function getConversationTitle(conversation = {}) {
  return (
    conversation.cliente_nombre ||
    conversation.cotizacion_folio ||
    conversation.asunto ||
    `Chat #${conversation.id}`
  );
}

function getReferenceLabel(conversation = {}) {
  if (conversation.producto_codigo) return `Producto ${conversation.producto_codigo}`;
  if (conversation.cotizacion_folio) return `Cotización ${conversation.cotizacion_folio}`;
  if (conversation.pedido_folio) return `Pedido ${conversation.pedido_folio}`;
  return "Consulta comercial";
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

export default function AdminChatClient() {
  const { checking } = useAdminAuth();
  const searchParams = useSearchParams();

  const messagesEndRef = useRef(null);
  const lastMessageIdRef = useRef(0);

  const [filters, setFilters] = useState({
    q: "",
    estado: "",
    limit: 40,
  });

  const [summary, setSummary] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [sending, setSending] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [creatingFromQuote, setCreatingFromQuote] = useState(false);

  const [messageText, setMessageText] = useState("");
  const [error, setError] = useState("");

  const requestedId = searchParams.get("id");
  const requestedFolio = searchParams.get("folio");

  const activeConversation = selected?.conversation || null;

  const loadConversations = useCallback(
    async ({ keepSelected = true, silent = false } = {}) => {
      try {
        if (!silent) setLoadingList(true);

        setError("");

        const response = await getAdminChatConversaciones(filters);
        const list = response.data || [];

        setConversations(list);
        setSummary(response.summary || null);

        if (!keepSelected && list.length > 0) {
          setSelectedId(String(list[0].id));
        }

        if (!selectedId && list.length > 0 && !requestedId && !requestedFolio) {
          setSelectedId(String(list[0].id));
        }
      } catch (err) {
        setError(err.message || "No se pudieron cargar conversaciones.");
      } finally {
        setLoadingList(false);
      }
    },
    [filters, selectedId, requestedId, requestedFolio]
  );

  const loadConversationDetail = useCallback(
    async (id, { incremental = false, silent = false } = {}) => {
      if (!id) return;

      try {
        if (!silent) setLoadingDetail(true);

        setError("");

        const params = incremental
          ? { after_id: lastMessageIdRef.current }
          : {};

        const response = await getAdminChatConversacion(id, params);

        setSelected(response.data || null);

        const incomingMessages = response.data?.messages || [];

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
        setError(err.message || "No se pudo cargar la conversación.");
      } finally {
        setLoadingDetail(false);
      }
    },
    []
  );

  useEffect(() => {
    if (checking) return;

    async function bootstrap() {
      if (requestedFolio) {
        try {
          setCreatingFromQuote(true);
          setError("");

          const response = await createAdminChatFromCotizacion(requestedFolio);
          const id = response.data?.id;

          if (id) {
            setSelectedId(String(id));
            await loadConversations({ silent: true });
          }
        } catch (err) {
          setError(err.message || "No se pudo abrir el chat de la cotización.");
        } finally {
          setCreatingFromQuote(false);
        }

        return;
      }

      if (requestedId) {
        setSelectedId(String(requestedId));
        await loadConversations({ silent: true });
        return;
      }

      await loadConversations({ keepSelected: false });
    }

    bootstrap();
  }, [checking, requestedId, requestedFolio, loadConversations]);

  useEffect(() => {
    if (!selectedId) return;

    lastMessageIdRef.current = 0;
    setMessages([]);
    loadConversationDetail(selectedId);
  }, [selectedId, loadConversationDetail]);

  useEffect(() => {
    if (checking) return;

    const conversationInterval = window.setInterval(() => {
      if (!document.hidden) {
        loadConversations({ silent: true });
      }
    }, 12000);

    return () => window.clearInterval(conversationInterval);
  }, [checking, loadConversations]);

  useEffect(() => {
    if (checking || !selectedId) return;

    const detailInterval = window.setInterval(() => {
      if (!document.hidden) {
        loadConversationDetail(selectedId, {
          incremental: true,
          silent: true,
        });
      }
    }, 4000);

    return () => window.clearInterval(detailInterval);
  }, [checking, selectedId, loadConversationDetail]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  function updateFilter(name, value) {
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function submitFilters(event) {
    event.preventDefault();
    await loadConversations({ keepSelected: true });
  }

  async function handleSendMessage(event) {
    event.preventDefault();

    const clean = messageText.trim();

    if (!activeConversation?.id || !clean) return;

    try {
      setSending(true);
      setError("");

      await sendAdminChatMensaje(activeConversation.id, clean);

      setMessageText("");

      await loadConversationDetail(activeConversation.id, {
        incremental: true,
        silent: true,
      });

      await loadConversations({ silent: true });
    } catch (err) {
      setError(err.message || "No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  }

  async function handleChangeStatus(estado) {
    if (!activeConversation?.id) return;

    try {
      setChangingStatus(true);
      setError("");

      await updateAdminChatEstado(activeConversation.id, estado);

      await loadConversationDetail(activeConversation.id);
      await loadConversations({ silent: true });
    } catch (err) {
      setError(err.message || "No se pudo cambiar el estado.");
    } finally {
      setChangingStatus(false);
    }
  }

  if (checking) return null;

  return (
    <section className="admin-workspace admin-chat-os">
      <div className="admin-page-hero">
        <div>
          <span>Atención comercial</span>
          <h1>Chat clientes</h1>
          <p>
            Bandeja tipo WhatsApp para resolver dudas antes de comprar, validar
            compatibilidad, cotizar productos y dar seguimiento comercial.
          </p>
        </div>

        <div className="admin-page-hero-actions">
          <Link href="/admin/ventas" className="admin-primary-button">
            <ShoppingCart size={18} />
            Ventas ecommerce
          </Link>

          <Link href="/admin/cotizaciones" className="admin-secondary-button">
            <MessageCircle size={18} />
            Cotizaciones
          </Link>

          <button
            type="button"
            className="admin-refresh-button"
            onClick={() => {
              loadConversations();
              if (selectedId) loadConversationDetail(selectedId);
            }}
            disabled={loadingList || loadingDetail}
          >
            {loadingList || loadingDetail ? (
              <Loader2 size={18} className="admin-spin" />
            ) : (
              <RefreshCw size={18} />
            )}
            Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-alert">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {creatingFromQuote && (
        <div className="admin-chat-creating">
          <Loader2 size={18} className="admin-spin" />
          Creando conversación desde cotización...
        </div>
      )}

      <section className="admin-kpi-grid admin-chat-kpi-grid">
        <article className="admin-kpi-card">
          <MessageCircle size={22} />
          <span>Total chats</span>
          <strong>{formatNumber(summary?.total)}</strong>
          <small>Conversaciones creadas</small>
        </article>

        <article className="admin-kpi-card">
          <Clock3 size={22} />
          <span>Abiertos</span>
          <strong>{formatNumber(summary?.abiertos)}</strong>
          <small>Esperando atención</small>
        </article>

        <article className="admin-kpi-card">
          <UserRound size={22} />
          <span>Atendiendo</span>
          <strong>{formatNumber(summary?.atendiendo)}</strong>
          <small>Seguimiento activo</small>
        </article>

        <article className="admin-kpi-card">
          <AlertTriangle size={22} />
          <span>No leídos</span>
          <strong>{formatNumber(summary?.no_leidos_admin)}</strong>
          <small>Mensajes del cliente</small>
        </article>

        <article className="admin-kpi-card">
          <CheckCircle2 size={22} />
          <span>Cerrados</span>
          <strong>{formatNumber(summary?.cerrados)}</strong>
          <small>Conversaciones finalizadas</small>
        </article>
      </section>

      <div className="admin-chat-layout">
        <aside className="admin-chat-sidebar">
          <form className="admin-chat-filters" onSubmit={submitFilters}>
            <label>
              Buscar conversación
              <div>
                <Search size={16} />
                <input
                  type="search"
                  value={filters.q}
                  onChange={(event) => updateFilter("q", event.target.value)}
                  placeholder="Cliente, producto, WhatsApp..."
                />
              </div>
            </label>

            <label>
              Estado
              <select
                value={filters.estado}
                onChange={(event) => updateFilter("estado", event.target.value)}
              >
                {ESTADOS_CHAT.map((item) => (
                  <option key={item.value || "todos"} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <button className="admin-primary-button" type="submit">
              Filtrar
            </button>
          </form>

          <div className="admin-chat-list">
            {loadingList ? (
              <div className="admin-chat-list-loading">
                <Loader2 size={24} className="admin-spin" />
                Cargando conversaciones...
              </div>
            ) : conversations.length > 0 ? (
              conversations.map((conversation) => {
                const active = String(conversation.id) === String(selectedId);

                return (
                  <button
                    type="button"
                    key={conversation.id}
                    className={`admin-chat-conversation ${
                      active ? "is-active" : ""
                    }`}
                    onClick={() => setSelectedId(String(conversation.id))}
                  >
                    <div className="admin-chat-avatar">
                      {getInitials(conversation.cliente_nombre)}
                    </div>

                    <div className="admin-chat-conversation-main">
                      <div>
                        <strong>{getConversationTitle(conversation)}</strong>

                        <mark
                          className={`admin-status-pill status-${conversation.estado}`}
                        >
                          {getEstadoLabel(conversation.estado)}
                        </mark>
                      </div>

                      <p>{conversation.ultimo_mensaje || "Sin mensajes todavía."}</p>

                      <span>
                        {getIntencionLabel(conversation.tipo_intencion)} ·{" "}
                        {getReferenceLabel(conversation)} ·{" "}
                        {formatDate(
                          conversation.last_message_at ||
                            conversation.created_at
                        )}
                      </span>
                    </div>

                    {Number(conversation.unread_admin) > 0 && (
                      <b>{formatNumber(conversation.unread_admin)}</b>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="admin-chat-list-loading">
                No hay conversaciones con esos filtros.
              </div>
            )}
          </div>
        </aside>

        <main className="admin-chat-window">
          {loadingDetail ? (
            <div className="admin-chat-empty">
              <Loader2 size={34} className="admin-spin" />
              <strong>Cargando conversación...</strong>
            </div>
          ) : activeConversation ? (
            <>
              <header className="admin-chat-window-head">
                <div>
                  <span>{getIntencionLabel(activeConversation.tipo_intencion)}</span>
                  <h2>{getConversationTitle(activeConversation)}</h2>
                  <p>
                    {activeConversation.cliente_whatsapp || "Sin WhatsApp"} ·{" "}
                    {getReferenceLabel(activeConversation)}
                  </p>
                </div>

                <div className="admin-chat-window-actions">
                  <mark
                    className={`admin-status-pill status-${activeConversation.estado}`}
                  >
                    {getEstadoLabel(activeConversation.estado)}
                  </mark>

                  {activeConversation.cotizacion_folio && (
                    <Link
                      href={`/admin/cotizaciones/${encodeURIComponent(
                        activeConversation.cotizacion_folio
                      )}`}
                      className="admin-secondary-button"
                    >
                      Ver cotización
                      <ArrowRight size={15} />
                    </Link>
                  )}

                  {activeConversation.pedido_folio && (
                    <Link
                      href={`/admin/ventas?q=${encodeURIComponent(
                        activeConversation.pedido_folio
                      )}`}
                      className="admin-secondary-button"
                    >
                      Ver pedido
                      <ArrowRight size={15} />
                    </Link>
                  )}
                </div>
              </header>

              <section className="admin-chat-status-actions">
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() => handleChangeStatus("ABIERTO")}
                  disabled={
                    changingStatus || activeConversation.estado === "ABIERTO"
                  }
                >
                  Abrir
                </button>

                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() => handleChangeStatus("ATENDIENDO")}
                  disabled={
                    changingStatus || activeConversation.estado === "ATENDIENDO"
                  }
                >
                  Atendiendo
                </button>

                <button
                  type="button"
                  className="admin-secondary-button danger"
                  onClick={() => handleChangeStatus("CERRADO")}
                  disabled={
                    changingStatus || activeConversation.estado === "CERRADO"
                  }
                >
                  <XCircle size={15} />
                  Cerrar
                </button>
              </section>

              <section className="admin-chat-messages">
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <article
                      key={message.id}
                      className={`admin-chat-message from-${String(
                        message.emisor_tipo || ""
                      ).toLowerCase()}`}
                    >
                      <div>
                        <strong>{getMessageAuthor(message)}</strong>
                        <span>{formatTime(message.created_at)}</span>
                      </div>

                      <p>{message.mensaje}</p>
                    </article>
                  ))
                ) : (
                  <div className="admin-chat-empty-message">
                    Todavía no hay mensajes en esta conversación.
                  </div>
                )}

                <div ref={messagesEndRef} />
              </section>

              {activeConversation.estado === "CERRADO" ? (
                <div className="admin-chat-closed">
                  Conversación cerrada. Puedes reabrirla cambiando el estado a
                  abierto.
                </div>
              ) : (
                <form className="admin-chat-compose" onSubmit={handleSendMessage}>
                  <textarea
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    placeholder="Escribe una respuesta para el cliente..."
                    rows={3}
                  />

                  <button
                    className="admin-primary-button"
                    type="submit"
                    disabled={sending || !messageText.trim()}
                  >
                    {sending ? (
                      <Loader2 size={18} className="admin-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                    Enviar
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="admin-chat-empty">
              <MessageCircle size={38} />
              <strong>Selecciona una conversación</strong>
              <p>
                Cuando un cliente escriba desde la página pública, aparecerá
                aquí para darle seguimiento.
              </p>
            </div>
          )}
        </main>

        <aside className="admin-chat-meta-panel">
          {activeConversation ? (
            <>
              <div className="admin-chat-meta-head">
                <div className="admin-chat-avatar large">
                  {getInitials(activeConversation.cliente_nombre)}
                </div>

                <h3>{activeConversation.cliente_nombre || "Cliente"}</h3>
                <p>{activeConversation.cliente_whatsapp || "Sin WhatsApp"}</p>
              </div>

              <div className="admin-chat-meta-list">
                <div>
                  <span>Motivo</span>
                  <strong>
                    {getIntencionLabel(activeConversation.tipo_intencion)}
                  </strong>
                </div>

                <div>
                  <span>Referencia</span>
                  <strong>{getReferenceLabel(activeConversation)}</strong>
                </div>

                <div>
                  <span>Estado</span>
                  <strong>{getEstadoLabel(activeConversation.estado)}</strong>
                </div>

                <div>
                  <span>Canal</span>
                  <strong>{activeConversation.canal || "PUBLICO"}</strong>
                </div>

                <div>
                  <span>Último mensaje</span>
                  <strong>
                    {formatDate(
                      activeConversation.last_message_at ||
                        activeConversation.created_at
                    )}
                  </strong>
                </div>
              </div>

              <div className="admin-chat-meta-actions">
                {activeConversation.cotizacion_folio && (
                  <Link
                    href={`/admin/cotizaciones/${encodeURIComponent(
                      activeConversation.cotizacion_folio
                    )}`}
                    className="admin-secondary-button"
                  >
                    Ver cotización
                  </Link>
                )}

                {activeConversation.producto_codigo && (
                  <Link
                    href={`/catalogo?q=${encodeURIComponent(
                      activeConversation.producto_codigo
                    )}`}
                    target="_blank"
                    className="admin-secondary-button"
                  >
                    Ver producto público
                  </Link>
                )}
              </div>
            </>
          ) : (
            <div className="admin-chat-meta-empty">
              <UserRound size={30} />
              <strong>Datos del cliente</strong>
              <p>Selecciona una conversación para ver el contexto comercial.</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}