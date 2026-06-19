"use client";

import { useEffect, useRef, useState } from "react";
import { Play, X } from "lucide-react";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export default function HomeVideoSection() {
  const sectionRef = useRef(null);
  const rafRef = useRef(null);
  const [modalOpen, setModalOpen] = useState(false);

  const videoUrl = process.env.NEXT_PUBLIC_HOME_VIDEO_URL || "";
  const posterUrl = process.env.NEXT_PUBLIC_HOME_VIDEO_POSTER_URL || "";

  if (!videoUrl) {
    return null;
  }

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    function updateProgress() {
      rafRef.current = null;

      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;

      const raw =
        (viewportHeight * 0.86 - rect.top) /
        (viewportHeight * 0.72 + rect.height * 0.36);

      const progress = clamp(raw, 0, 1);

      const eased = progress * progress * (3 - 2 * progress);

      const bgProgress = clamp((eased - 0.14) / 0.72, 0, 1);
      const invertedBgProgress = 1 - bgProgress;

      section.style.setProperty("--video-progress", eased.toFixed(4));
      section.style.setProperty("--video-bg-progress", invertedBgProgress.toFixed(4));
    }

    function requestUpdate() {
      if (rafRef.current) return;
      rafRef.current = window.requestAnimationFrame(updateProgress);
    }

    updateProgress();

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);

      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!modalOpen) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    document.body.classList.add("andy-video-modal-open");
    document.documentElement.classList.add("andy-video-modal-open");

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setModalOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;

      document.body.classList.remove("andy-video-modal-open");
      document.documentElement.classList.remove("andy-video-modal-open");

      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [modalOpen]);

  return (
    <section className="andy-video-scroll-section" ref={sectionRef}>
      <div className="andy-video-scroll-stage">
        <video
          className="andy-video-scroll-player"
          src={videoUrl}
          poster={posterUrl || undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />

        <div className="andy-video-scroll-dim" aria-hidden="true" />

        <button
          type="button"
          className="andy-video-fullscreen-button"
          onClick={() => setModalOpen(true)}
          aria-label="Reproducir video de Andyfers en pantalla completa"
        >
          <span className="andy-video-play-glyph" aria-hidden="true">
            <Play size={17} fill="currentColor" strokeWidth={2.6} />
          </span>
        </button>
      </div>

      {modalOpen && (
        <div
          className="andy-video-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Video Andyfers"
        >
          <button
            type="button"
            className="andy-video-modal-close"
            onClick={() => setModalOpen(false)}
            aria-label="Cerrar video"
          >
            <X size={25} />
          </button>

          <video
            className="andy-video-modal-player"
            src={videoUrl}
            poster={posterUrl || undefined}
            controls
            autoPlay
            playsInline
          />
        </div>
      )}
    </section>
  );
}