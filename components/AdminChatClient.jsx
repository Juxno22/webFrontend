"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
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

export default function AdminChatClient() {
  const { checking } = useAdminAuth();
  const searchParams = useSearchParams();

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

  const selectedConversation = useMemo(() => {
    if (!selectedId) return null;

    return conversations.find((item) => String(item.id) === String(selectedId)) || activeConversation;
  }, [conversations, selectedId, activeConversation]);

  const loadConversations = useCallback(
    async ({ keepSelected = true } = {}) => {
      try {
        setLoadingList(true);
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

  const loadConversationDetail = useCallback(async (id) => {
    if (!id) return;

    try {
      setLoadingDetail(true);
      setError("");

      const response = await getAdminChatConversacion(id);

      setSelected(response.data || null);
      setMessages(response.data?.messages || []);
    } catch (err) {
      setError(err.message || "No se pudo cargar la conversación.");
    } finally {
      setLoadingDetail(false);
    }
  }, []);

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
            await loadConversations();
            await loadConversationDetail(id);
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
        await loadConversations();
        await loadConversationDetail(requestedId);
        return;
      }

      await loadConversations({ keepSelected: false });
    }

    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking, requestedId, requestedFolio]);

  useEffect(() => {
    if (!selectedId) return;

    loadConversationDetail(selectedId);
  }, [selectedId, loadConversationDetail]);

  useEffect(() => {
    if (checking) return;

    const interval = window.setInterval(() => {
      if (!document.hidden) {
        loadConversations();
        if (selectedId) {
          loadConversationDetail(selectedId);
        }
      }
    }, 15_000);

    return () => window.clearInterval(interval);
  }, [checking, selectedId, loadConversations, loadConversationDetail]);

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
      await loadConversationDetail(activeConversation.id);
      await loadConversations();
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
      await loadConversations();
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
          <span>Atención en tiempo real</span>
          <h1>Chat clientes</h1>
          <p>
            Bandeja comercial tipo Messenger para dar seguimiento a compradores,
            cotizaciones y conversaciones activas. Esta versión usa REST con
            actualización automática; después agregamos WebSockets.
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
                  placeholder="Cliente, folio, WhatsApp..."
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
                    className={`admin-chat-conversation ${active ? "is-active" : ""}`}
                    onClick={() => setSelectedId(String(conversation.id))}
                  >
                    <div className="admin-chat-avatar">
                      {getInitials(conversation.cliente_nombre)}
                    </div>

                    <div className="admin-chat-conversation-main">
                      <div>
                        <strong>{getConversationTitle(conversation)}</strong>

                        <mark className={`admin-status-pill status-${conversation.estado}`}>
                          {getEstadoLabel(conversation.estado)}
                        </mark>
                      </div>

                      <p>{conversation.ultimo_mensaje || "Sin mensajes todavía."}</p>

                      <span>
                        {conversation.cotizacion_folio || "Sin cotización"} ·{" "}
                        {formatDate(conversation.last_message_at || conversation.created_at)}
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
                  <span>{activeConversation.cotizacion_folio || "Chat comercial"}</span>
                  <h2>{getConversationTitle(activeConversation)}</h2>
                  <p>
                    {activeConversation.cliente_whatsapp || "Sin WhatsApp"} ·{" "}
                    {activeConversation.cliente_correo || "Sin correo"}
                  </p>
                </div>

                <div className="admin-chat-window-actions">
                  <mark className={`admin-status-pill status-${activeConversation.estado}`}>
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
                </div>
              </header>

              <section className="admin-chat-status-actions">
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() => handleChangeStatus("ABIERTO")}
                  disabled={changingStatus || activeConversation.estado === "ABIERTO"}
                >
                  Abrir
                </button>

                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() => handleChangeStatus("ATENDIENDO")}
                  disabled={changingStatus || activeConversation.estado === "ATENDIENDO"}
                >
                  Atendiendo
                </button>

                <button
                  type="button"
                  className="admin-secondary-button danger"
                  onClick={() => handleChangeStatus("CERRADO")}
                  disabled={changingStatus || activeConversation.estado === "CERRADO"}
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
              </section>

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
            </>
          ) : (
            <div className="admin-chat-empty">
              <MessageCircle size={38} />
              <strong>Selecciona una conversación</strong>
              <p>
                Cuando un cliente escriba desde una cotización, aparecerá aquí
                para darle seguimiento.
              </p>
            </div>
          )}
        </main>
      </div>
    </section>
  );
}