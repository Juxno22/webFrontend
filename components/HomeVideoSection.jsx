"use client";

import { useMemo, useState } from "react";
import { Play, Video } from "lucide-react";

export default function HomeVideoSection() {
  const [playing, setPlaying] = useState(false);

  const videoUrl = process.env.NEXT_PUBLIC_HOME_VIDEO_URL || "";
  const posterUrl = process.env.NEXT_PUBLIC_HOME_VIDEO_POSTER_URL || "";

  const hasVideo = useMemo(() => {
    return Boolean(videoUrl.trim());
  }, [videoUrl]);

  return (
    <section className="andy-video-promo-section">
      <div className="container andy-video-promo-grid">
        <div className="andy-video-copy">
          <span className="andy-section-kicker">Video de presentación</span>

          <h2>Conoce el catálogo Andyfers.</h2>
        </div>

        <div className="andy-video-card">
          {hasVideo && playing ? (
            <video
              className="andy-video-player"
              src={videoUrl}
              poster={posterUrl || undefined}
              controls
              autoPlay
              playsInline
            />
          ) : (
            <button
              type="button"
              className="andy-video-preview"
              onClick={() => hasVideo && setPlaying(true)}
              aria-label="Reproducir video de presentación"
            >
              {posterUrl ? (
                <img src={posterUrl} alt="Video de presentación Andyfers" />
              ) : (
                <div className="andy-video-placeholder">
                  <Video size={58} />
                </div>
              )}

              <span className="andy-video-play-button">
                <Play size={34} fill="currentColor" />
              </span>

              <div className="andy-video-caption">
                <strong>Video promocional</strong>
                <small>
                  {hasVideo
                    ? "Reproducir presentación"
                    : "Pendiente de cargar desde Cloudinary"}
                </small>
              </div>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}