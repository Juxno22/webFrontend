"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Menu, Search, ShoppingBag, X } from "lucide-react";
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
  const pathname = usePathname();
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [lineasOpen, setLineasOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const closeTimerRef = useRef(null);

  const isHome = pathname === "/";
  const isLineas = pathname?.startsWith("/lineas");
  const isCatalog = pathname?.startsWith("/catalogo") || pathname?.startsWith("/producto");
  const isQuote = pathname?.startsWith("/cotizacion");
  const isContact = pathname?.startsWith("/contacto");

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

  useEffect(() => {
    setMobileSearchOpen(false);
    setLineasOpen(false);
  }, [pathname]);

  function navClass(active) {
    return active ? "is-active" : "";
  }

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

  function submitHeaderSearch(event) {
    event.preventDefault();

    const term = searchQuery.trim();
    const nextUrl = term ? `/catalogo?q=${encodeURIComponent(term)}` : "/catalogo";

    closeNow();
    setMobileSearchOpen(false);
    router.push(nextUrl);
  }

  const searchForm = (className, inputId) => (
    <form className={className} onSubmit={submitHeaderSearch} role="search">
      <Search size={17} />
      <input
        id={inputId}
        type="search"
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder="Buscar código, pieza o cruce"
        aria-label="Buscar en catálogo"
      />
      <button type="submit" aria-label="Buscar en catálogo">
        🔍
      </button>
    </form>
  );

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
          <Link href="/" className={navClass(isHome)} onClick={closeNow}>
            Inicio
          </Link>

          <div
            className="lineas-nav-dropdown"
            onMouseEnter={openLineasDropdown}
            onMouseLeave={closeLineasDropdown}
          >
            <button
              type="button"
              className={`lineas-nav-trigger ${navClass(isLineas || lineasOpen)}`}
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
                    className={`lineas-nav-item ${item.featured ? "featured" : ""}`}
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

          <Link href="/catalogo" className={navClass(isCatalog)} onClick={closeNow}>
            Catálogo
          </Link>

          <Link href="/cotizacion" className={navClass(isQuote)} onClick={closeNow}>
            Cotización
          </Link>

          <Link href="/contacto" className={navClass(isContact)} onClick={closeNow}>
            Contacto
          </Link>
        </nav>

        {searchForm("header-search", "header-search-input")}

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

          <button
            type="button"
            className="mobile-search-trigger icon-action"
            aria-label={mobileSearchOpen ? "Cerrar buscador" : "Abrir buscador"}
            aria-expanded={mobileSearchOpen}
            onClick={() => setMobileSearchOpen((current) => !current)}
          >
            {mobileSearchOpen ? <X size={19} /> : <Search size={19} />}
          </button>

          <button className="mobile-menu-button" aria-label="Abrir menú" type="button">
            <Menu size={22} />
          </button>
        </div>
      </div>

      {mobileSearchOpen && (
        <div className="mobile-search-layer">
          {searchForm("mobile-search-box", "mobile-header-search-input")}
        </div>
      )}
    </header>
  );
}
