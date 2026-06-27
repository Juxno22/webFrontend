"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  FileSearch,
  FileText,
  Gauge,
  ImagePlus,
  LayoutDashboard,
  ListChecks,
  LockKeyhole,
  Server,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";

const links = [
  {
    href: "/admin",
    label: "Inicio",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/admin/cotizaciones",
    label: "Cotizaciones",
    icon: ClipboardList,
  },
  {
    href: "/admin/ventas",
    label: "Ventas Web",
    icon: ShoppingCart,
  },
  {
    href: "/admin/productos",
    label: "Productos",
    icon: Boxes,
  },
  {
    href: "/admin/ecommerce",
    label: "Ecommerce",
    icon: ShoppingCart,
  },
  {
    href: "/admin/catalogo-calidad",
    label: "Calidad Catálogo",
    icon: ShieldCheck,
  },
  {
    href: "/admin/pendientes-comerciales",
    label: "Pendientes",
    icon: ListChecks,
  },
  {
    href: "/admin/multimedia-macheo",
    label: "Macheo Multimedia",
    icon: FileSearch,
  },
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
  {
    href: "/admin/seguridad",
    label: "Seguridad",
    icon: LockKeyhole,
  },
  {
    href: "/admin/produccion",
    label: "Producción",
    icon: Server,
  },
  {
    href: "/admin/contenido",
    label: "Contenido Web",
    icon: FileText,
    exact: true,
  },
  {
    href: "/admin/contenido/home-hero",
    label: "Flyers Home",
    icon: ImagePlus,
  },
];

export default function AdminModuleNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-module-nav" aria-label="Navegación de módulos admin">
      {links.map((item) => {
        const Icon = item.icon;
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link
            href={item.href}
            className={active ? "active" : ""}
            key={item.href}
          >
            <Icon size={17} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
