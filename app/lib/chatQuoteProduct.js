const INVALID_PRODUCT_CODES = new Set([
  "#N/A",
  "N/A",
  "NA",
  "ND",
  "N.D.",
  "SIN CODIGO",
  "SIN CÓDIGO",
  "NULL",
  "0",
]);

export function cleanQuoteProductCode(value) {
  const clean = String(value || "").trim();

  if (!clean) return "";

  const normalized = clean.toUpperCase();

  if (INVALID_PRODUCT_CODES.has(normalized)) return "";

  return clean;
}

export function getQuoteProductCode(producto = {}) {
  return (
    cleanQuoteProductCode(producto.codigo_andyfers) ||
    cleanQuoteProductCode(producto.codigo_publico) ||
    cleanQuoteProductCode(producto.codigo_importacion) ||
    ""
  );
}

export function buildQuoteChatUrl(productOrCode) {
  const code =
    typeof productOrCode === "string"
      ? cleanQuoteProductCode(productOrCode)
      : getQuoteProductCode(productOrCode);

  if (!code) return "/cotizacion";

  return `/cotizacion?producto_codigo=${encodeURIComponent(code)}`;
}