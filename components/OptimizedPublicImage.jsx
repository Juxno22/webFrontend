"use client";

import Image from "next/image";
import { Wrench } from "lucide-react";

function isCloudinaryUrl(url) {
  return typeof url === "string" && url.includes("res.cloudinary.com");
}

function isCloudinaryTransformSegment(segment = "") {
  if (!segment || segment.startsWith("v")) return false;

  const tokens = segment.split(",").filter(Boolean);
  if (tokens.length === 0) return false;

  return tokens.every((token) =>
    /^(a_|ar_|b_|bo_|c_|co_|cs_|d_|dl_|dn_|dpr_|e_|eo_|f_|fl_|fn_|g_|h_|ki_|l_|o_|pg_|q_|r_|so_|t_|u_|vc_|vs_|w_|x_|y_|z_)/.test(token)
  );
}

function applyCloudinaryTransform(url, transform = "f_auto,q_auto") {
  if (!isCloudinaryUrl(url) || !transform) return url;

  const uploadMarker = "/upload/";
  const uploadIndex = url.indexOf(uploadMarker);

  if (uploadIndex === -1) return url;

  const beforeUpload = url.slice(0, uploadIndex + uploadMarker.length);
  const afterUpload = url.slice(uploadIndex + uploadMarker.length);
  const slashIndex = afterUpload.indexOf("/");

  if (slashIndex === -1) {
    return `${beforeUpload}${transform}/${afterUpload}`;
  }

  const firstSegment = afterUpload.slice(0, slashIndex);
  const rest = afterUpload.slice(slashIndex + 1);

  if (isCloudinaryTransformSegment(firstSegment)) {
    return `${beforeUpload}${transform}/${rest}`;
  }

  return `${beforeUpload}${transform}/${afterUpload}`;
}

function normalizeCloudinaryQuality(value) {
  if (value === undefined || value === null || value === "") return "q_auto";

  const normalized = String(value).trim();

  if (!normalized) return "q_auto";
  if (normalized.startsWith("q_")) return normalized;
  if (normalized.startsWith("auto")) return `q_${normalized}`;

  return `q_${normalized}`;
}

export function buildOptimizedImageUrl(src, options = {}) {
  if (!src) return null;

  const width = Number(options.width || 0);
  const height = Number(options.height || 0);
  const crop = options.crop || "c_fit";
  const quality = normalizeCloudinaryQuality(options.cloudinaryQuality);

  const parts = ["f_auto", quality];

  if (width > 0) parts.push(`w_${width}`);
  if (height > 0) parts.push(`h_${height}`);
  if ((width > 0 || height > 0) && crop) parts.push(crop);

  return applyCloudinaryTransform(src, parts.join(","));
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
  cloudinaryQuality = "auto",
  cloudinaryCrop = "c_fit",
}) {
  const optimizedSrc = buildOptimizedImageUrl(src, {
    width: cloudinaryWidth || width,
    height: cloudinaryHeight || height,
    cloudinaryQuality,
    crop: cloudinaryCrop,
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
