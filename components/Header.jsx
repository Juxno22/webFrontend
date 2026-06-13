"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, ShoppingBag } from "lucide-react";
import { getQuoteCartCount } from "../app/lib/quoteCart";

const lineasMenu = [
  {
    title: "Ver todas las líneas",
    description: "Página comercial de líneas Andyfers",
    href: "/lineas",
    featured: true,
  },
  {
    title: "Catálogo completo",
    description: "Todos los productos disponibles",
    href: "/catalogo",
  },
  {
    title: "Termostatos",
    description: "Control de temperatura del motor",
    href: "/catalogo?familia=TERMOSTATO",
  },
  {
    title: "Bombas de agua",
    description: "Circulación de refrigerante",
    href: "/catalogo?familia=BOMBAS%20DE%20AGUA",
  },
  {
    title: "Depósitos y tapones",
    description: "Presión y recuperación",
    href: "/catalogo?q=deposito",
  },
  {
    title: "Tomas y carcasas",
    description: "Conexiones del sistema",
    href: "/catalogo?q=toma",
  },
  {
    title: "Mangueras",
    description: "Soluciones flexibles",
    href: "/catalogo?familia=MANGUERA%20MULTIFLEX",
  },
  {
    title: "Poleas",
    description: "Cruces, diámetro, material y canales",
    href: "/catalogo?familia=POLEAS",
  },
];

export default function Header() {
  const [count, setCount] = useState(0);
  const [lineasOpen, setLineasOpen] = useState(false);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    function refreshCount() {
      setCount(getQuoteCartCount());
    }

    refreshCount();

    window.addEventListener("andyfers_quote_cart_updated", refreshCount);
    window.addEventListener("storage", refreshCount);

    return () => {
      window.removeEventListener("andyfers_quote_cart_updated", refreshCount);
      window.removeEventListener("storage", refreshCount);
    };
  }, []);

  function openLineasDropdown() {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }

    setLineasOpen(true);
  }

  function closeLineasDropdown() {
    closeTimerRef.current = window.setTimeout(() => {
      setLineasOpen(false);
    }, 180);
  }

  function closeNow() {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }

    setLineasOpen(false);
  }

  return (
    <header className="site-header">
      <div className="container header-inner clean-header">
        <Link href="/" className="brand brand-image-link" onClick={closeNow}>
          <img
            src="/andyfers-home/logo-andyfers.png"
            alt="Andyfers Autopartes"
            className="brand-logo-image"
          />
        </Link>

        <nav className="desktop-nav">
          <Link href="/" onClick={closeNow}>
            Inicio
          </Link>

          <div
            className="lineas-nav-dropdown"
            onMouseEnter={openLineasDropdown}
            onMouseLeave={closeLineasDropdown}
          >
            <button
              type="button"
              className="lineas-nav-trigger"
              onClick={() => setLineasOpen((current) => !current)}
              aria-expanded={lineasOpen}
            >
              Líneas
              <ChevronDown size={15} />
            </button>

            {lineasOpen && (
              <div
                className="lineas-nav-menu"
                onMouseEnter={openLineasDropdown}
                onMouseLeave={closeLineasDropdown}
              >
                {lineasMenu.map((item) => (
                  <Link
                    href={item.href}
                    className={`lineas-nav-item ${item.featured ? "featured" : ""
                      }`}
                    key={item.title}
                    onClick={closeNow}
                  >
                    <strong>{item.title}</strong>
                    <span>{item.description}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link href="/catalogo" onClick={closeNow}>
            Catálogo
          </Link>

          <Link href="/cotizacion" onClick={closeNow}>
            Cotización
          </Link>

          <Link href="/contacto" onClick={closeNow}>
            Contacto
          </Link>
        </nav>

        <div className="header-actions">
          <Link
            href="/cotizacion"
            className="quote-action"
            aria-label="Mi cotización"
            onClick={closeNow}
          >
            <ShoppingBag size={18} />
            <span>Mi cotización</span>

            {count > 0 && <strong className="quote-count">{count}</strong>}
          </Link>

          <button className="mobile-menu-button" aria-label="Abrir menú">
            <Menu size={22} />
          </button>
        </div>
      </div>
    </header>
  );
}