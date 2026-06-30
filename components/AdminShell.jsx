"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  BellOff,
  Boxes,
  ClipboardList,
  FileSearch,
  FileText,
  Gauge,
  Home,
  ImagePlus,
  ListChecks,
  LockKeyhole,
  LogOut,
  Menu,
  MessageCircle,
  Server,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  X,
} from "lucide-react";
import {
  clearAdminSession,
  getAdminChatSummary,
  getAdminUser,
} from "@/app/lib/adminApi";

const CHAT_SOUND_KEY = "andyfers_admin_chat_sound_enabled";

function getUnreadChatCount(summary) {
  return Number(summary?.no_leidos_admin || 0);
}

function formatBadge(value) {
  const count = Number(value || 0);

  if (count > 99) return "99+";

  return String(count);
}

function readChatSoundPreference() {
  if (typeof window === "undefined") return false;

  return window.localStorage.getItem(CHAT_SOUND_KEY) === "1";
}

function saveChatSoundPreference(enabled) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(CHAT_SOUND_KEY, enabled ? "1" : "0");
}

function playAdminChatSound() {
  if (typeof window === "undefined") return;

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) return;

    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, context.currentTime);

    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.24);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.26);

    window.setTimeout(() => {
      context.close().catch(() => { });
    }, 420);
  } catch { }
}

const primaryModules = [
  {
    href: "/admin/ventas",
    label: "Ventas ecommerce",
    description: "Pedidos Mercado Pago",
    icon: ShoppingCart,
    tone: "red",
  },
  {
    href: "/admin/chat",
    label: "Chat clientes",
    description: "Cotizaciones en tiempo real",
    icon: MessageCircle,
    tone: "blue",
  },
];

const navGroups = [
  {
    label: "Centro",
    items: [
      {
        href: "/admin",
        label: "Inicio",
        icon: Home,
        exact: true,
      },
      {
        href: "/admin/operacion",
        label: "Operación diaria",
        icon: Activity,
      },
    ],
  },
  {
    label: "Ventas",
    items: [
      {
        href: "/admin/ventas",
        label: "Ventas Mercado Pago",
        icon: ShoppingCart,
      },
      {
        href: "/admin/chat",
        label: "Chat clientes cotizacion",
        icon: MessageCircle,
      },
    ],
  },
  {
    label: "Ecommerce",
    items: [
      {
        href: "/admin/ecommerce",
        label: "Inventario web",
        icon: ShoppingCart,
      },
      {
        href: "/admin/productos",
        label: "Productos",
        icon: Boxes,
      },
      {
        href: "/admin/catalogo-calidad",
        label: "Calidad catálogo",
        icon: ShieldCheck,
      },
      {
        href: "/admin/pendientes-comerciales",
        label: "Pendientes",
        icon: ListChecks,
      },
      {
        href: "/admin/multimedia-macheo",
        label: "Macheo multimedia",
        icon: FileSearch,
      },
    ],
  },
  {
    label: "Inteligencia",
    items: [
      {
        href: "/admin/analitica",
        label: "Analítica",
        icon: BarChart3,
      },
      {
        href: "/admin/performance",
        label: "Performance",
        icon: Gauge,
      },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        href: "/admin/produccion",
        label: "Producción",
        icon: Server,
      },
      {
        href: "/admin/seguridad",
        label: "Seguridad",
        icon: LockKeyhole,
      },
      {
        href: "/admin/contenido",
        label: "Contenido web",
        icon: FileText,
        exact: true,
      },
      {
        href: "/admin/contenido/home-hero",
        label: "Flyers home",
        icon: ImagePlus,
      },
    ],
  },
];

function isActivePath(pathname, item) {
  if (item.exact) return pathname === item.href;

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function getModuleTitle(pathname) {
  const allItems = navGroups.flatMap((group) => group.items);
  const active = allItems
    .filter((item) => isActivePath(pathname, item))
    .sort((a, b) => b.href.length - a.href.length)[0];

  if (active) return active.label;

  if (pathname.startsWith("/admin/chat")) return "Chat clientes";

  return "Administración";
}

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [chatSummary, setChatSummary] = useState(null);
  const [chatSoundEnabled, setChatSoundEnabled] = useState(false);
  const [chatPulse, setChatPulse] = useState(false);

  const lastUnreadRef = useRef(null);
  const chatPulseTimeoutRef = useRef(null);

  const isLogin = pathname === "/admin/login";

  const moduleTitle = useMemo(() => getModuleTitle(pathname), [pathname]);
  const chatUnread = getUnreadChatCount(chatSummary);

  useEffect(() => {
    if (isLogin) {
      setChecking(false);
      return;
    }

    const currentUser = getAdminUser();

    if (!currentUser) {
      router.push("/admin/login");
      return;
    }

    setUser(currentUser);
    setChecking(false);
  }, [isLogin, router]);

  useEffect(() => {
    setChatSoundEnabled(readChatSoundPreference());
  }, []);

  const applyChatSummary = useCallback(
    (summary) => {
      if (!summary) return;

      const nextUnread = getUnreadChatCount(summary);
      const previousUnread = lastUnreadRef.current;

      setChatSummary(summary);

      if (previousUnread !== null && nextUnread > previousUnread) {
        setChatPulse(true);

        if (chatPulseTimeoutRef.current) {
          window.clearTimeout(chatPulseTimeoutRef.current);
        }

        chatPulseTimeoutRef.current = window.setTimeout(() => {
          setChatPulse(false);
        }, 1800);

        if (chatSoundEnabled) {
          playAdminChatSound();
        }

        window.dispatchEvent(
          new CustomEvent("andyfers_admin_chat_unread_new", {
            detail: {
              unread: nextUnread,
              previous_unread: previousUnread,
              summary,
            },
          })
        );
      }

      lastUnreadRef.current = nextUnread;
    },
    [chatSoundEnabled]
  );

  const loadChatSummary = useCallback(async () => {
    if (isLogin || checking) return;

    try {
      const response = await getAdminChatSummary();
      applyChatSummary(response.summary);
    } catch { }
  }, [applyChatSummary, checking, isLogin]);

  useEffect(() => {
    if (isLogin || checking || !user) return;

    loadChatSummary();

    const interval = window.setInterval(() => {
      if (!document.hidden) {
        loadChatSummary();
      }
    }, 10000);

    function handleFocus() {
      loadChatSummary();
    }

    function handleExternalSummary(event) {
      applyChatSummary(event.detail?.summary);
    }

    window.addEventListener("focus", handleFocus);
    window.addEventListener(
      "andyfers_admin_chat_summary_updated",
      handleExternalSummary
    );

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener(
        "andyfers_admin_chat_summary_updated",
        handleExternalSummary
      );
    };
  }, [applyChatSummary, checking, isLogin, loadChatSummary, user]);

  useEffect(() => {
    if (isLogin || typeof document === "undefined") return;

    const baseTitle = `${moduleTitle || "Administración"} | Andyfers`;

    document.title =
      chatUnread > 0 ? `(${formatBadge(chatUnread)}) ${baseTitle}` : baseTitle;
  }, [chatUnread, isLogin, moduleTitle]);

  useEffect(() => {
    return () => {
      if (chatPulseTimeoutRef.current) {
        window.clearTimeout(chatPulseTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function toggleChatSound() {
    setChatSoundEnabled((current) => {
      const next = !current;

      saveChatSoundPreference(next);

      if (next) {
        playAdminChatSound();
      }

      return next;
    });
  }

  function logout() {
    clearAdminSession();
    router.push("/admin/login");
  }

  if (isLogin) {
    return children;
  }

  if (checking) {
    return (
      <main className="admin-os-loading">
        <div>
          <Sparkles size={34} />
          <strong>Cargando administración...</strong>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-os">
      <aside className={`admin-os-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="admin-os-brand">
          <div className="admin-os-brand-mark">A</div>
          <div>
            <strong>Andyfers</strong>
          </div>
        </div>

        <div className="admin-os-priority">
          {primaryModules.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item);

            const isChat = item.href === "/admin/chat";

            return (
              <Link
                href={item.href}
                key={item.href}
                className={`admin-os-priority-card tone-${item.tone} ${active ? "is-active" : ""
                  } ${isChat && chatPulse ? "has-chat-pulse" : ""}`}
              >
                <Icon size={20} />

                <div>
                  <strong>{item.label}</strong>
                  <span>
                    {isChat && chatUnread > 0
                      ? `${formatBadge(chatUnread)} mensajes sin leer`
                      : item.description}
                  </span>
                </div>

                {isChat && chatUnread > 0 && (
                  <em className="admin-chat-nav-badge">{formatBadge(chatUnread)}</em>
                )}
              </Link>
            );
          })}
        </div>

        <nav className="admin-os-nav" aria-label="Navegación admin">
          {navGroups.map((group) => (
            <section key={group.label}>
              <span>{group.label}</span>

              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(pathname, item);

                const isChat = item.href === "/admin/chat";

                return (
                  <Link
                    href={item.href}
                    key={item.href}
                    className={`${active ? "is-active" : ""} ${isChat && chatPulse ? "has-chat-pulse" : ""
                      }`}
                  >
                    <Icon size={17} />
                    <small>{item.label}</small>

                    {isChat && chatUnread > 0 && (
                      <em className="admin-chat-nav-mini-badge">
                        {formatBadge(chatUnread)}
                      </em>
                    )}
                  </Link>
                );
              })}
            </section>
          ))}
        </nav>

        <button type="button" className="admin-os-logout" onClick={logout}>
          <LogOut size={17} />
          Salir
        </button>
      </aside>

      {mobileOpen && (
        <button
          type="button"
          className="admin-os-backdrop"
          aria-label="Cerrar menú"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <section className="admin-os-main">
        <header className="admin-os-topbar">
          <button
            type="button"
            className="admin-os-menu-button"
            onClick={() => setMobileOpen((current) => !current)}
            aria-label={mobileOpen ? "Cerrar menú admin" : "Abrir menú admin"}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div>
            <span>Panel interno</span>
            <strong>{moduleTitle}</strong>
          </div>

          <div className="admin-os-top-actions">
            <Link href="/admin/ventas" className="admin-os-top-primary">
              <ShoppingCart size={17} />
              Ventas
            </Link>

            <Link
              href="/admin/chat"
              className={`admin-os-top-secondary ${chatUnread > 0 ? "has-chat-unread" : ""
                } ${chatPulse ? "has-chat-pulse" : ""}`}
            >
              <MessageCircle size={17} />
              <span>Chat</span>

              {chatUnread > 0 && (
                <em className="admin-os-top-chat-badge">{formatBadge(chatUnread)}</em>
              )}
            </Link>

            <button
              type="button"
              className={`admin-os-chat-sound-toggle ${chatSoundEnabled ? "is-on" : ""
                }`}
              onClick={toggleChatSound}
              title={
                chatSoundEnabled
                  ? "Desactivar sonido de nuevos chats"
                  : "Activar sonido de nuevos chats"
              }
            >
              {chatSoundEnabled ? <Bell size={17} /> : <BellOff size={17} />}
              <span>{chatSoundEnabled ? "Sonido" : "Silencio"}</span>
            </button>

            <button type="button" onClick={logout}>
              <LogOut size={17} />
              <span>Salir</span>
            </button>
          </div>
        </header>

        <div className="admin-os-content">{children}</div>
      </section>
    </main>
  );
}