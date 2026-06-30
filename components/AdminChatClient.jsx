"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  Loader2,
  MessageCircle,
  Phone,
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
  updateAdminChatNotaInterna,
  updateAdminChatPrioridad,
} from "@/app/lib/adminApi";
import { useAdminAuth } from "@/app/hooks/useAdminAuth";

const ESTADOS_CHAT = [
  { value: "", label: "Todos" },
  { value: "ABIERTO", label: "Abiertos" },
  { value: "ATENDIENDO", label: "Atendiendo" },
  { value: "CERRADO", label: "Cerrados" },
];

const BANDEJAS_CHAT = [
  { value: "ACTUAL", label: "Atención actual" },
  { value: "HISTORIAL", label: "Historial cerrado" },
  { value: "TODOS", label: "Todos" },
];

const PRIORIDADES_CHAT = [
  { value: "BAJA", label: "Baja" },
  { value: "MEDIA", label: "Media" },
  { value: "ALTA", label: "Alta" },
  { value: "URGENTE", label: "Urgente" },
];

const CIERRE_MOTIVOS_CHAT = [
  { value: "COTIZACION_ENVIADA", label: "Cotización enviada" },
  { value: "CLIENTE_NO_RESPONDIO", label: "Cliente no respondió" },
  { value: "PRODUCTO_NO_DISPONIBLE", label: "Producto no disponible" },
  { value: "DUDA_RESUELTA", label: "Duda resuelta" },
  { value: "VENTA_CANALIZADA", label: "Venta canalizada" },
  { value: "OTRO", label: "Otro" },
];

const REAPERTURA_MOTIVOS_CHAT = [
  { value: "Cliente volvió a escribir", label: "Cliente volvió a escribir" },
  { value: "Seguimiento pendiente", label: "Seguimiento pendiente" },
  { value: "Error de cierre", label: "Error de cierre" },
  { value: "Reapertura manual", label: "Reapertura manual" },
];

function getPriorityLabel(value) {
  return (
    PRIORIDADES_CHAT.find((item) => item.value === value)?.label ||
    value ||
    "Media"
  );
}

function getCloseReasonLabel(value) {
  return (
    CIERRE_MOTIVOS_CHAT.find((item) => item.value === value)?.label ||
    value ||
    "—"
  );
}

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
  if (conversation.producto_codigo) {
    return `Producto ${conversation.producto_codigo}`;
  }

  if (conversation.cotizacion_folio) {
    return `Cotización ${conversation.cotizacion_folio}`;
  }

  if (conversation.pedido_folio) {
    return `Pedido ${conversation.pedido_folio}`;
  }

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

function buildWhatsAppHref(whatsapp) {
  const digits = String(whatsapp || "").replace(/\D/g, "");

  if (!digits) return "";

  const normalized = digits.length === 10 ? `52${digits}` : digits;

  return `https://wa.me/${normalized}`;
}

function buildPublicChatUrl(token) {
  if (!token) return "";

  if (typeof window === "undefined") {
    return `/cotizacion/${encodeURIComponent(token)}`;
  }

  return `${window.location.origin}/cotizacion/${encodeURIComponent(token)}`;
}

function getQuickReplies(conversation = {}) {
  const nombre = conversation?.cliente_nombre || "buen día";
  const producto = conversation?.producto_codigo;

  const replies = [
    `Hola ${nombre}, gracias por escribirnos. Ya estamos revisando tu solicitud de cotización.`,
    "Para validarlo correctamente, ¿me puedes confirmar modelo, año y motor del vehículo?",
    "Permíteme revisar existencia, compatibilidad y precio final para darte una respuesta correcta.",
    "Con gusto. Te confirmo la información y te respondo por este mismo chat.",
  ];

  if (producto) {
    replies.unshift(
      `Hola ${nombre}, gracias por escribirnos. Ya recibimos el código ${producto}. Permíteme validar existencia, compatibilidad y precio.`
    );
  }

  return replies;
}

export default function AdminChatClient() {
  const { checking } = useAdminAuth();
  const searchParams = useSearchParams();

  const messagesEndRef = useRef(null);
  const lastMessageIdRef = useRef(0);
  const selectedIdRef = useRef("");

  const requestedId = searchParams.get("id");
  const requestedFolio = searchParams.get("folio");

  const [filters, setFilters] = useState({
    q: "",
    bandeja: "ACTUAL",
    estado: "",
    prioridad: "",
    cierre_motivo: "",
    no_leidos: false,
    desde: "",
    hasta: "",
    limit: 50,
    offset: 0,
  })

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
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
  const [copiedLink, setCopiedLink] = useState(false);

  const [messageText, setMessageText] = useState("");
  const [error, setError] = useState("");

  const activeConversation = selected?.conversation || null;
  const isClosed = activeConversation?.estado === "CERRADO";
  const whatsappHref = buildWhatsAppHref(activeConversation?.cliente_whatsapp);

  const [closeDraft, setCloseDraft] = useState({
    open: false,
    motivo: "COTIZACION_ENVIADA",
    nota: "",
  });

  const [reopenDraft, setReopenDraft] = useState({
    open: false,
    estado: "ABIERTO",
    motivo: "Cliente volvió a escribir",
  });

  const [internalNote, setInternalNote] = useState("");
  const [savingPriority, setSavingPriority] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  const quickReplies = useMemo(
    () => getQuickReplies(activeConversation),
    [activeConversation]
  );

  useEffect(() => {
    setInternalNote(activeConversation?.nota_interna || "");
  }, [activeConversation?.id, activeConversation?.nota_interna]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const loadConversations = useCallback(
    async ({
      keepSelected = true,
      silent = false,
      filtersOverride = null,
    } = {}) => {
      try {
        if (!silent) setLoadingList(true);

        setError("");

        const activeFilters = filtersOverride || filters;
        const response = await getAdminChatConversaciones(activeFilters);
        const list = response.data || [];

        setConversations(list);
        setSummary(response.summary || null);

        window.dispatchEvent(
          new CustomEvent("andyfers_admin_chat_summary_updated", {
            detail: {
              summary: response.summary || null,
            },
          })
        );

        const currentSelectedId = selectedIdRef.current;
        const selectedStillExists = list.some(
          (item) => String(item.id) === String(currentSelectedId)
        );

        if (!keepSelected && list.length > 0) {
          setSelectedId(String(list[0].id));
          return;
        }

        if (!currentSelectedId && list.length > 0 && !requestedId) {
          setSelectedId(String(list[0].id));
          return;
        }

        if (currentSelectedId && !selectedStillExists && list.length > 0) {
          setSelectedId(String(list[0].id));
        }

        if (currentSelectedId && !selectedStillExists && list.length === 0) {
          setSelectedId("");
          setSelected(null);
          setMessages([]);
        }
      } catch (err) {
        setError(err.message || "No se pudieron cargar conversaciones.");
      } finally {
        setLoadingList(false);
      }
    },
    [filters, requestedId]
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
            await loadConversations({ keepSelected: true, silent: true });
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
        await loadConversations({ keepSelected: true });
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

    const interval = window.setInterval(() => {
      if (!document.hidden) {
        loadConversations({ keepSelected: true, silent: true });
      }
    }, 8000);

    return () => window.clearInterval(interval);
  }, [checking, loadConversations]);

  useEffect(() => {
    if (checking || !selectedId || isClosed) return;

    const interval = window.setInterval(() => {
      if (!document.hidden) {
        loadConversationDetail(selectedId, {
          incremental: true,
          silent: true,
        });
      }
    }, 3500);

    return () => window.clearInterval(interval);
  }, [checking, selectedId, isClosed, loadConversationDetail]);

  useEffect(() => {
    function refreshOnFocus() {
      loadConversations({ keepSelected: true, silent: true });

      if (selectedIdRef.current) {
        loadConversationDetail(selectedIdRef.current, {
          incremental: true,
          silent: true,
        });
      }
    }

    window.addEventListener("focus", refreshOnFocus);

    return () => window.removeEventListener("focus", refreshOnFocus);
  }, [loadConversations, loadConversationDetail]);

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

  function applyFilterPatch(patch) {
    const nextFilters = {
      ...filters,
      ...patch,
      offset: 0,
    };

    setFilters(nextFilters);

    loadConversations({
      keepSelected: true,
      filtersOverride: nextFilters,
    });
  }

  function clearAdvancedFilters() {
    const nextFilters = {
      ...filters,
      prioridad: "",
      cierre_motivo: "",
      no_leidos: false,
      desde: "",
      hasta: "",
      offset: 0,
    };

    setFilters(nextFilters);

    loadConversations({
      keepSelected: true,
      filtersOverride: nextFilters,
    });
  }

  function clearAllFilters() {
    const nextFilters = {
      q: "",
      bandeja: "ACTUAL",
      estado: "",
      prioridad: "",
      cierre_motivo: "",
      no_leidos: false,
      desde: "",
      hasta: "",
      limit: 50,
      offset: 0,
    };

    setFilters(nextFilters);

    loadConversations({
      keepSelected: false,
      filtersOverride: nextFilters,
    });
  }

  async function submitFilters(event) {
    event.preventDefault();

    await loadConversations({
      keepSelected: true,
      filtersOverride: filters,
    });
  }

  async function refreshAll() {
    await loadConversations({ keepSelected: true });

    if (selectedIdRef.current) {
      await loadConversationDetail(selectedIdRef.current);
    }
  }

  async function handleSendMessage(event) {
    event.preventDefault();

    const clean = messageText.trim();

    if (!activeConversation?.id || !clean || isClosed) return;

    try {
      setSending(true);
      setError("");

      await sendAdminChatMensaje(activeConversation.id, clean);

      setMessageText("");

      await loadConversationDetail(activeConversation.id, {
        incremental: true,
        silent: true,
      });

      await loadConversations({ keepSelected: true, silent: true });
    } catch (err) {
      setError(err.message || "No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  }

  async function handleChangeStatus(estado) {
    if (!activeConversation?.id) return;

    if (estado === "CERRADO") {
      setCloseDraft({
        open: true,
        motivo: "COTIZACION_ENVIADA",
        nota: "",
      });
      return;
    }

    if (activeConversation.estado === "CERRADO" && estado !== "CERRADO") {
      setReopenDraft({
        open: true,
        estado,
        motivo: "Cliente volvió a escribir",
      });
      return;
    }

    try {
      setChangingStatus(true);
      setError("");

      await updateAdminChatEstado(activeConversation.id, { estado });

      await loadConversationDetail(activeConversation.id);
      await loadConversations({ keepSelected: true, silent: true });
    } catch (err) {
      setError(err.message || "No se pudo cambiar el estado.");
    } finally {
      setChangingStatus(false);
    }
  }

  async function confirmCloseConversation() {
    if (!activeConversation?.id || !closeDraft.motivo) return;

    try {
      setChangingStatus(true);
      setError("");

      await updateAdminChatEstado(activeConversation.id, {
        estado: "CERRADO",
        cierre_motivo: closeDraft.motivo,
        cierre_nota: closeDraft.nota,
      });

      setCloseDraft({
        open: false,
        motivo: "COTIZACION_ENVIADA",
        nota: "",
      });

      await loadConversationDetail(activeConversation.id);
      await loadConversations({ keepSelected: true, silent: true });
    } catch (err) {
      setError(err.message || "No se pudo cerrar la conversación.");
    } finally {
      setChangingStatus(false);
    }
  }

  async function confirmReopenConversation() {
    if (!activeConversation?.id) return;

    try {
      setChangingStatus(true);
      setError("");

      await updateAdminChatEstado(activeConversation.id, {
        estado: reopenDraft.estado,
        reabierto_motivo: reopenDraft.motivo,
      });

      setReopenDraft({
        open: false,
        estado: "ABIERTO",
        motivo: "Cliente volvió a escribir",
      });

      await loadConversationDetail(activeConversation.id);
      await loadConversations({ keepSelected: true, silent: true });
    } catch (err) {
      setError(err.message || "No se pudo reabrir la conversación.");
    } finally {
      setChangingStatus(false);
    }
  }

  async function handlePriorityChange(event) {
    if (!activeConversation?.id) return;

    const prioridad = event.target.value;

    try {
      setSavingPriority(true);
      setError("");

      await updateAdminChatPrioridad(activeConversation.id, prioridad);

      await loadConversationDetail(activeConversation.id);
      await loadConversations({ keepSelected: true, silent: true });
    } catch (err) {
      setError(err.message || "No se pudo actualizar la prioridad.");
    } finally {
      setSavingPriority(false);
    }
  }

  async function saveInternalNote() {
    if (!activeConversation?.id) return;

    try {
      setSavingNote(true);
      setError("");

      await updateAdminChatNotaInterna(activeConversation.id, internalNote);

      await loadConversationDetail(activeConversation.id);
      await loadConversations({ keepSelected: true, silent: true });
    } catch (err) {
      setError(err.message || "No se pudo guardar la nota interna.");
    } finally {
      setSavingNote(false);
    }
  }

  function handleMessageKeyDown(event) {
    if (event.key !== "Enter") return;
    if (event.shiftKey) return;

    event.preventDefault();

    if (!sending && messageText.trim()) {
      handleSendMessage(event);
    }
  }

  function useQuickReply(reply) {
    setMessageText(reply);
  }

  async function copyPublicLink() {
    const url = buildPublicChatUrl(activeConversation?.public_token);

    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);

      window.setTimeout(() => {
        setCopiedLink(false);
      }, 1800);
    } catch {
      setError("No se pudo copiar la liga pública del chat.");
    }
  }

  if (checking) return null;

  return (
    <section className="admin-workspace admin-chat-os admin-chat-whatsapp">
      <div className="admin-page-hero admin-chat-hero">
        <div>
          <h1>Chat de cotizaciones</h1>
        </div>

        <div className="admin-page-hero-actions">
          <Link href="/admin/ventas" className="admin-primary-button">
            <ShoppingCart size={18} />
            Ventas ecommerce
          </Link>

          <Link href="/admin/cotizaciones" className="admin-secondary-button">
            <MessageCircle size={18} />
            Historial cotizaciones
          </Link>

          <button
            type="button"
            className="admin-refresh-button"
            onClick={refreshAll}
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

      <div className="admin-chat-layout">
        <aside className="admin-chat-sidebar">
          <div className="admin-chat-sidebar-head">
            <div>
              <span>Conversaciones</span>
              <strong>{formatNumber(summary?.total)} chats</strong>
            </div>

            <button
              type="button"
              onClick={() => loadConversations({ keepSelected: true })}
              disabled={loadingList}
              aria-label="Actualizar conversaciones"
            >
              {loadingList ? (
                <Loader2 size={17} className="admin-spin" />
              ) : (
                <RefreshCw size={17} />
              )}
            </button>
          </div>

          <div className="admin-chat-mini-summary">
            <div>
              <strong>{formatNumber(summary?.actuales)}</strong>
              <span>Actuales</span>
            </div>

            <div>
              <strong>{formatNumber(summary?.cerrados)}</strong>
              <span>Historial</span>
            </div>

            <div>
              <strong>{formatNumber(summary?.no_leidos_admin)}</strong>
              <span>No leídos</span>
            </div>
          </div>

          <form className="admin-chat-filters" onSubmit={submitFilters}>
            <div className="admin-chat-inbox-tabs">
              {BANDEJAS_CHAT.map((item) => (
                <button
                  type="button"
                  key={item.value}
                  className={filters.bandeja === item.value ? "is-active" : ""}
                  onClick={() =>
                    applyFilterPatch({
                      bandeja: item.value,
                      estado: "",
                    })
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>

            <label>
              Buscar
              <div>
                <Search size={16} />
                <input
                  type="search"
                  value={filters.q}
                  onChange={(event) => updateFilter("q", event.target.value)}
                  placeholder="Cliente, WhatsApp, producto..."
                />
              </div>
            </label>

            <div className="admin-chat-status-tabs">
              {ESTADOS_CHAT.map((item) => (
                <button
                  type="button"
                  key={item.value || "TODOS"}
                  className={filters.estado === item.value ? "is-active" : ""}
                  onClick={() =>
                    applyFilterPatch({
                      estado: item.value,
                      bandeja: item.value === "CERRADO" ? "HISTORIAL" : filters.bandeja,
                    })
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="admin-chat-filter-actions">
              <button
                type="button"
                className={filters.no_leidos ? "is-active" : ""}
                onClick={() =>
                  applyFilterPatch({
                    no_leidos: !filters.no_leidos,
                  })
                }
              >
                Solo no leídos
              </button>

              <button
                type="button"
                onClick={() => setShowAdvancedFilters((current) => !current)}
              >
                {showAdvancedFilters ? "Ocultar filtros" : "Más filtros"}
              </button>
            </div>

            {showAdvancedFilters && (
              <div className="admin-chat-advanced-filters">
                <label>
                  Prioridad
                  <select
                    value={filters.prioridad}
                    onChange={(event) => updateFilter("prioridad", event.target.value)}
                  >
                    <option value="">Todas</option>
                    {PRIORIDADES_CHAT.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Motivo cierre
                  <select
                    value={filters.cierre_motivo}
                    onChange={(event) =>
                      updateFilter("cierre_motivo", event.target.value)
                    }
                  >
                    <option value="">Todos</option>
                    {CIERRE_MOTIVOS_CHAT.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Desde
                  <input
                    type="date"
                    value={filters.desde}
                    onChange={(event) => updateFilter("desde", event.target.value)}
                  />
                </label>

                <label>
                  Hasta
                  <input
                    type="date"
                    value={filters.hasta}
                    onChange={(event) => updateFilter("hasta", event.target.value)}
                  />
                </label>

                <button
                  type="button"
                  className="admin-chat-clear-filters"
                  onClick={clearAdvancedFilters}
                >
                  Limpiar avanzados
                </button>
              </div>
            )}

            <div className="admin-chat-submit-row">
              <button className="admin-primary-button" type="submit">
                Filtrar
              </button>

              <button
                type="button"
                className="admin-secondary-button"
                onClick={clearAllFilters}
              >
                Limpiar
              </button>
            </div>
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
                const unread = Number(conversation.unread_admin || 0);

                return (
                  <button
                    type="button"
                    key={conversation.id}
                    className={`admin-chat-conversation ${active ? "is-active" : ""
                      } ${unread > 0 ? "has-unread" : ""}`}
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

                        <mark
                          className={`admin-priority-pill priority-${conversation.prioridad || "MEDIA"}`}
                        >
                          {getPriorityLabel(conversation.prioridad)}
                        </mark>
                      </div>

                      <p>
                        {conversation.ultimo_mensaje ||
                          "Sin mensajes todavía."}
                      </p>

                      <span>
                        {getReferenceLabel(conversation)} ·{" "}
                        {formatTime(
                          conversation.last_message_at ||
                          conversation.created_at
                        )}
                      </span>
                    </div>

                    {unread > 0 && <b>{formatNumber(unread)}</b>}
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

                  {whatsappHref && (
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noreferrer"
                      className="admin-secondary-button"
                    >
                      <Phone size={15} />
                      WhatsApp
                    </a>
                  )}

                  {activeConversation.public_token && (
                    <button
                      type="button"
                      className="admin-secondary-button"
                      onClick={copyPublicLink}
                    >
                      <Copy size={15} />
                      {copiedLink ? "Copiado" : "Copiar liga"}
                    </button>
                  )}

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
                    changingStatus ||
                    activeConversation.estado === "ATENDIENDO"
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

              {closeDraft.open && (
                <section className="admin-chat-operational-panel">
                  <div>
                    <span>Cerrar conversación</span>
                    <strong>Selecciona motivo de cierre</strong>
                  </div>

                  <label>
                    Motivo
                    <select
                      value={closeDraft.motivo}
                      onChange={(event) =>
                        setCloseDraft((current) => ({
                          ...current,
                          motivo: event.target.value,
                        }))
                      }
                    >
                      {CIERRE_MOTIVOS_CHAT.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Nota de cierre
                    <textarea
                      value={closeDraft.nota}
                      onChange={(event) =>
                        setCloseDraft((current) => ({
                          ...current,
                          nota: event.target.value,
                        }))
                      }
                      placeholder="Ej. Se envió cotización por WhatsApp, pendiente confirmación del cliente..."
                      rows={3}
                    />
                  </label>

                  <div className="admin-chat-operational-actions">
                    <button
                      type="button"
                      className="admin-secondary-button"
                      onClick={() =>
                        setCloseDraft({
                          open: false,
                          motivo: "COTIZACION_ENVIADA",
                          nota: "",
                        })
                      }
                      disabled={changingStatus}
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      className="admin-secondary-button danger"
                      onClick={confirmCloseConversation}
                      disabled={changingStatus}
                    >
                      Cerrar conversación
                    </button>
                  </div>
                </section>
              )}

              {reopenDraft.open && (
                <section className="admin-chat-operational-panel">
                  <div>
                    <span>Reabrir conversación</span>
                    <strong>Indica motivo de reapertura</strong>
                  </div>

                  <label>
                    Motivo
                    <select
                      value={reopenDraft.motivo}
                      onChange={(event) =>
                        setReopenDraft((current) => ({
                          ...current,
                          motivo: event.target.value,
                        }))
                      }
                    >
                      {REAPERTURA_MOTIVOS_CHAT.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="admin-chat-operational-actions">
                    <button
                      type="button"
                      className="admin-secondary-button"
                      onClick={() =>
                        setReopenDraft({
                          open: false,
                          estado: "ABIERTO",
                          motivo: "Cliente volvió a escribir",
                        })
                      }
                      disabled={changingStatus}
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      className="admin-primary-button"
                      onClick={confirmReopenConversation}
                      disabled={changingStatus}
                    >
                      Reabrir conversación
                    </button>
                  </div>
                </section>
              )}

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

              {isClosed ? (
                <div className="admin-chat-closed">
                  Conversación cerrada. Puedes reabrirla cambiando el estado.
                </div>
              ) : (
                <form className="admin-chat-compose" onSubmit={handleSendMessage}>
                  <textarea
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    onKeyDown={handleMessageKeyDown}
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

              {activeConversation.producto_codigo && (
                <div className="admin-chat-product-focus">
                  <span>Producto solicitado</span>
                  <strong>{activeConversation.producto_codigo}</strong>

                  <Link
                    href={`/catalogo?q=${encodeURIComponent(
                      activeConversation.producto_codigo
                    )}`}
                    target="_blank"
                  >
                    Buscar en catálogo
                    <ExternalLink size={15} />
                  </Link>
                </div>
              )}

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
                  <span>Prioridad</span>
                  <strong>{getPriorityLabel(activeConversation.prioridad)}</strong>
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

              <div className="admin-chat-priority-box">
                <span>Prioridad operativa</span>

                <select
                  value={activeConversation.prioridad || "MEDIA"}
                  onChange={handlePriorityChange}
                  disabled={savingPriority}
                >
                  {PRIORIDADES_CHAT.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-chat-internal-note">
                <span>Nota interna</span>

                <textarea
                  value={internalNote}
                  onChange={(event) => setInternalNote(event.target.value)}
                  placeholder="Nota solo visible para el admin..."
                  rows={5}
                />

                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={saveInternalNote}
                  disabled={savingNote}
                >
                  {savingNote ? "Guardando..." : "Guardar nota"}
                </button>
              </div>

              {activeConversation.estado === "CERRADO" && (
                <div className="admin-chat-close-info">
                  <span>Cierre</span>

                  <strong>
                    {getCloseReasonLabel(activeConversation.cierre_motivo)}
                  </strong>

                  {activeConversation.cierre_nota && (
                    <p>{activeConversation.cierre_nota}</p>
                  )}
                </div>
              )}

              {!isClosed && (
                <div className="admin-chat-quick-replies">
                  <span>Respuestas rápidas</span>

                  {quickReplies.map((reply) => (
                    <button
                      type="button"
                      key={reply}
                      onClick={() => useQuickReply(reply)}
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}

              <div className="admin-chat-meta-actions">
                {whatsappHref && (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="admin-secondary-button"
                  >
                    <Phone size={15} />
                    Abrir WhatsApp
                  </a>
                )}

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