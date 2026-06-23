"use client";

import OptimizedPublicImage from "@/components/OptimizedPublicImage";

export function getProductImageUrl(producto, mode = "thumbnail") {
  if (!producto) return null;

  if (mode === "full") {
    return (
      producto.imagen_url ||
      producto.imagen_principal?.secure_url ||
      producto.imagen_thumbnail_url ||
      producto.imagen_principal?.thumbnail_url ||
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
  loading = "lazy",
  priority = false,
  width = 520,
  height = 390,
  sizes = "(max-width: 768px) 75vw, (max-width: 1200px) 28vw, 310px",
  fill = false,
}) {
  const imageUrl = getProductImageUrl(producto, mode);

  const imageAlt =
    alt ||
    producto?.descripcion ||
    producto?.codigo_andyfers ||
    producto?.codigo_importacion ||
    "Producto Andyfers";

  return (
    <OptimizedPublicImage
      src={imageUrl}
      alt={imageAlt}
      className={className}
      fallbackClassName={fallbackClassName}
      iconSize={iconSize}
      loading={loading}
      priority={priority}
      width={width}
      height={height}
      sizes={sizes}
      fill={fill}
      cloudinaryWidth={mode === "full" ? 1200 : 620}
      cloudinaryHeight={mode === "full" ? 900 : 520}
    />
  );
}
