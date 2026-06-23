"use client";

import { Wrench } from "lucide-react";
import OptimizedPublicImage from "@/components/OptimizedPublicImage";

const IMAGE_PRESETS = {
  thumbnail: {
    width: 520,
    height: 390,
    sizes: "(max-width: 768px) 75vw, (max-width: 1200px) 28vw, 310px",
    cloudinaryWidth: 620,
    cloudinaryHeight: 520,
    cloudinaryQuality: "auto",
  },
  full: {
    width: 1440,
    height: 1080,
    sizes: "(max-width: 768px) 92vw, (max-width: 1200px) 48vw, 760px",
    cloudinaryWidth: null,
    cloudinaryHeight: null,
    cloudinaryQuality: null,
  },
};

export function getProductImageUrl(producto, mode = "thumbnail") {
  if (!producto) return null;

  if (mode === "full" || mode === "detail") {
    return (
      producto.imagen_principal?.secure_url ||
      producto.imagen_url ||
      producto.imagen_principal?.thumbnail_url ||
      producto.imagen_thumbnail_url ||
      null
    );
  }

  return (
    producto.imagen_thumbnail_url ||
    producto.imagen_principal?.thumbnail_url ||
    producto.imagen_url ||
    producto.imagen_principal?.secure_url ||
    null
  );
}

export function getProductGallery(producto) {
  if (!Array.isArray(producto?.galeria)) return [];

  return producto.galeria
    .filter((item) => item?.tipo === "IMAGEN" || !item?.tipo)
    .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0));
}

export default function ProductMediaImage({
  producto,
  alt,
  mode = "thumbnail",
  className = "",
  fallbackClassName = "",
  iconSize = 42,
  loading,
  priority,
  width,
  height,
  sizes,
  fill = false,
  objectFit = "contain",
  quality,
  cloudinaryWidth,
  cloudinaryHeight,
  cloudinaryQuality,
  cloudinaryCrop = "c_fit",
}) {
  const resolvedMode = mode === "detail" ? "full" : mode;
  const preset = IMAGE_PRESETS[resolvedMode] || IMAGE_PRESETS.thumbnail;
  const isFull = resolvedMode === "full";

  const imageUrl = getProductImageUrl(producto, resolvedMode);

  const imageAlt =
    alt ||
    producto?.descripcion ||
    producto?.codigo_andyfers ||
    producto?.codigo_importacion ||
    "Producto Andyfers";

  if (isFull) {
    if (!imageUrl) {
      return (
        <div className={fallbackClassName} aria-label="Producto sin imagen">
          <Wrench size={iconSize} />
        </div>
      );
    }

    return (
      <img
        src={imageUrl}
        alt={imageAlt}
        className={className}
        loading={loading || "eager"}
        decoding="async"
        draggable="false"
        width={width || preset.width}
        height={height || preset.height}
        style={{ objectFit }}
      />
    );
  }

  return (
    <OptimizedPublicImage
      src={imageUrl}
      alt={imageAlt}
      className={className}
      fallbackClassName={fallbackClassName}
      iconSize={iconSize}
      loading={loading || "lazy"}
      priority={priority ?? false}
      width={width || preset.width}
      height={height || preset.height}
      sizes={sizes || preset.sizes}
      fill={fill}
      objectFit={objectFit}
      quality={quality}
      cloudinaryWidth={cloudinaryWidth || preset.cloudinaryWidth}
      cloudinaryHeight={cloudinaryHeight || preset.cloudinaryHeight}
      cloudinaryQuality={cloudinaryQuality || preset.cloudinaryQuality}
      cloudinaryCrop={cloudinaryCrop}
    />
  );
}
