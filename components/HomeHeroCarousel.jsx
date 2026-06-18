"use client";

import Link from "next/link";
import {
  ClipboardList,
  Search,
  ShieldCheck,
  Sparkles,
  Timer,
} from "lucide-react";

const heroImages = [
  "/andyfers-home/reel1.jfif",
  "/andyfers-home/reel2.jfif",
  "/andyfers-home/reel3.jfif",
  "/andyfers-home/image4.jpeg",
];

export default function HomeHeroCarousel() {
  return (
    <section className="andy-hero-racing">
      <div className="andy-home-decor-left" />
      <div className="andy-home-decor-right" />
      <div className="andy-hero-center-fade" />

      <div className="container andy-hero-racing-grid">
        <div className="andy-hero-copy">
          <span className="andy-hero-eyebrow">
            <Sparkles size={15} />
            Catálogo inteligente
          </span>

          <h1>
            El poder<div></div><span>de avanzar.</span>
          </h1>

          <p>
            Busca piezas para sistema de enfriamiento por vehículo, código,
            cruce o descripción. Agrega productos a tu cotización y nuestro
            equipo valida compatibilidad, disponibilidad y precio final.
          </p>

          <div className="andy-hero-actions">
            <Link href="/catalogo" className="andy-hero-btn catalogo">
              Buscar en catálogo
              <Search size={18} />
            </Link>

            <Link href="/cotizacion" className="andy-hero-btn cotizacion">
              Mi cotización
              <ClipboardList size={18} />
            </Link>
          </div>
        </div>

        <div className="andy-hero-carousel">
          <div className="andy-hero-carousel-window">
            <div className="andy-hero-carousel-track">
              {[...heroImages, ...heroImages].map((image, index) => (
                <div className="andy-hero-slide" key={`${image}-${index}`}>
                  <img src={image} alt="Andyfers Autopartes" />
                </div>
              ))}
            </div>
          </div>

          <div className="andy-hero-power-text">
            <strong>El poder</strong>
            <span>de avanzar</span>
          </div>
        </div>
      </div>
    </section>
  );
}