"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
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
import { clearAdminSession, getAdminUser } from "@/app/lib/adminApi";

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
        href: "/admin/cotizaciones",
        label: "Cotizaciones",
        icon: ClipboardList,
      },
      {
        href: "/admin/chat",
        label: "Chat clientes",
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

  const isLogin = pathname === "/admin/login";

  const moduleTitle = useMemo(() => getModuleTitle(pathname), [pathname]);

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
    setMobileOpen(false);
  }, [pathname]);

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
            <span>Admin OS</span>
          </div>
        </div>

        <div className="admin-os-priority">
          {primaryModules.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item);

            return (
              <Link
                href={item.href}
                key={item.href}
                className={`admin-os-priority-card tone-${item.tone} ${
                  active ? "is-active" : ""
                }`}
              >
                <Icon size={20} />
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.description}</span>
                </div>
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

                return (
                  <Link
                    href={item.href}
                    key={item.href}
                    className={active ? "is-active" : ""}
                  >
                    <Icon size={17} />
                    <small>{item.label}</small>
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

            <Link href="/admin/chat" className="admin-os-top-secondary">
              <MessageCircle size={17} />
              Chat
            </Link>

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