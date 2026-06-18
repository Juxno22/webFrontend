"use client";

import { Wrench } from "lucide-react";

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
}) {
  const imageUrl = getProductImageUrl(producto, mode);

  const imageAlt =
    alt ||
    producto?.descripcion ||
    producto?.codigo_andyfers ||
    producto?.codigo_importacion ||
    "Producto Andyfers";

  if (!imageUrl) {
    return (
      <div className={fallbackClassName}>
        <Wrench size={iconSize} />
      </div>
    );
  }

  return (
    <img
      className={className}
      src={imageUrl}
      alt={imageAlt}
      loading={loading}
    />
  );
}