"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Search,
  Sparkles,
} from "lucide-react";
import { getHomeHeroSlides } from "@/app/lib/api";

const fallbackSlides = [
  {
    id: "fallback-1",
    secure_url:
      "https://res.cloudinary.com/dm65frp96/image/upload/v1781829050/flayer1.png",
    titulo: "Promoción Andyfers",
  },
  {
    id: "fallback-2",
    secure_url:
      "https://res.cloudinary.com/dm65frp96/image/upload/v1781829049/flayer2.png",
    titulo: "Promoción Andyfers",
  },
  {
    id: "fallback-3",
    secure_url:
      "https://res.cloudinary.com/dm65frp96/image/upload/v1781829048/flayer3.png",
    titulo: "Promoción Andyfers",
  },
];

function getSlideImage(slide) {
  return slide?.secure_url || slide?.thumbnail_url || "";
}

export default function HomeHeroCarousel() {
  const [slides, setSlides] = useState(fallbackSlides);

  useEffect(() => {
    let active = true;

    async function loadSlides() {
      try {
        const response = await getHomeHeroSlides();
        const nextSlides = Array.isArray(response.data)
          ? response.data.filter((slide) => getSlideImage(slide))
          : [];

        if (!active || !nextSlides.length) return;

        setSlides(nextSlides);
      } catch {
        if (active) {
          setSlides(fallbackSlides);
        }
      }
    }

    loadSlides();

    return () => {
      active = false;
    };
  }, []);

  const carouselSlides = useMemo(() => {
    return slides.length > 1 ? [...slides, ...slides] : slides;
  }, [slides]);

  return (
    <section className="andy-hero-racing">
      <div className="andy-home-decor-left" />
      <div className="andy-home-decor-right" />
      <div className="andy-hero-center-fade" />

      <div className="container andy-hero-racing-grid">
        <div className="andy-hero-copy">
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
              {carouselSlides.map((slide, index) => {
                const imageUrl = getSlideImage(slide);

                return (
                  <div className="andy-hero-slide" key={`${slide.id}-${index}`}>
                    <img
                      src={imageUrl}
                      alt={slide.titulo || "Flyer promocional Andyfers"}
                      loading={index === 0 ? "eager" : "lazy"}
                    />
                  </div>
                );
              })}
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
