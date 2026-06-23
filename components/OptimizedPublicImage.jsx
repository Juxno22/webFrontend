"use client";

import Image from "next/image";
import { Wrench } from "lucide-react";

function isCloudinaryUrl(url) {
  return typeof url === "string" && url.includes("res.cloudinary.com");
}

function injectCloudinaryTransform(url, transform = "f_auto,q_auto") {
  if (!isCloudinaryUrl(url) || !transform) return url;
  if (url.includes("/upload/")) {
    return url.replace("/upload/", `/upload/${transform}/`);
  }
  return url;
}

export function buildOptimizedImageUrl(src, options = {}) {
  if (!src) return null;
  const width = Number(options.width || 0);
  const height = Number(options.height || 0);
  const crop = options.crop || "c_fit";

  const parts = ["f_auto", "q_auto"];
  if (width > 0) parts.push(`w_${width}`);
  if (height > 0) parts.push(`h_${height}`);
  if ((width > 0 || height > 0) && crop) parts.push(crop);

  return injectCloudinaryTransform(src, parts.join(","));
}

export default function OptimizedPublicImage({
  src,
  alt = "Imagen Andyfers",
  className = "",
  fallbackClassName = "",
  iconSize = 42,
  width = 520,
  height = 390,
  sizes = "(max-width: 768px) 80vw, 320px",
  priority = false,
  loading,
  quality,
  objectFit = "contain",
  fill = false,
  cloudinaryWidth,
  cloudinaryHeight,
}) {
  const optimizedSrc = buildOptimizedImageUrl(src, {
    width: cloudinaryWidth || width,
    height: cloudinaryHeight || height,
  });

  if (!optimizedSrc) {
    return (
      <div className={fallbackClassName} aria-label="Producto sin imagen">
        <Wrench size={iconSize} />
      </div>
    );
  }

  const commonProps = {
    className,
    src: optimizedSrc,
    alt,
    sizes,
    priority,
    quality,
    loading: loading || (priority ? "eager" : "lazy"),
    style: { objectFit },
  };

  if (fill) {
    return <Image {...commonProps} fill alt={alt} />;
  }

  return <Image {...commonProps} width={width} height={height} alt={alt} />;
}
