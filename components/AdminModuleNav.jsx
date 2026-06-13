"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, ClipboardList, LayoutDashboard } from "lucide-react";

const links = [
  {
    href: "/admin",
    label: "Inicio",
    icon: LayoutDashboard,
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
];

export default function AdminModuleNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-module-nav">
      {links.map((item) => {
        const Icon = item.icon;

        const active =
          item.href === "/admin"
            ? pathname === "/admin"
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