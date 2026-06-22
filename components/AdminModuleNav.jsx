"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  ClipboardList,
  FileText,
  ImagePlus,
  LayoutDashboard,
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
    href: "/admin/productos",
    label: "Productos",
    icon: Boxes,
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
    <nav className="admin-module-nav">
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
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}