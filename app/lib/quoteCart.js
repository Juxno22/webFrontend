import { trackAnalyticsEvent } from "./analytics";

const OLD_STORAGE_KEY = "DEBdlt4GA8ANmbqTgO0xALKcVvN6LU";

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

function cleanProductCode(value) {
  const clean = String(value || "").trim();

  if (!clean) return "";

  if (INVALID_PRODUCT_CODES.has(clean.toUpperCase())) return "";

  return clean;
}

function getProductCode(producto = {}) {
  return (
    cleanProductCode(producto.codigo_andyfers) ||
    cleanProductCode(producto.codigo_publico) ||
    cleanProductCode(producto.codigo_importacion) ||
    cleanProductCode(producto.product_key) ||
    cleanProductCode(producto.codigo) ||
    ""
  );
}

function buildChatUrl(producto = {}) {
  const code = getProductCode(producto);

  if (!code) return "/cotizacion";

  return `/cotizacion?producto_codigo=${encodeURIComponent(code)}`;
}

function clearOldQuoteCartStorage() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(OLD_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("andyfers_quote_cart_updated"));
}

function dispatchToast(message) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("andyfers_toast", {
      detail: { message },
    })
  );
}

function trackChatQuoteIntent(producto) {
  if (typeof window === "undefined" || !producto) return;

  trackAnalyticsEvent("PRODUCTO_AGREGADO_COTIZACION", {
    producto_id: producto.id || producto.producto_id || null,
    codigo_andyfers: producto.codigo_andyfers || null,
    codigo_importacion: producto.codigo_importacion || null,
    categoria_nombre: producto.categoria || null,
    familia: producto.familia || null,
    cantidad: 1,
    metadata: {
      descripcion: producto.descripcion || "",
      armadora: producto.armadora || "",
      flujo: "CHAT_COTIZACION",
      product_key:
        getProductCode(producto) ||
        String(producto.id || producto.producto_id || ""),
    },
  });
}

export function addToQuoteCart(producto) {
  clearOldQuoteCartStorage();
  trackChatQuoteIntent(producto);

  if (typeof window !== "undefined") {
    dispatchToast("Abriendo chat de cotización...");
    window.location.href = buildChatUrl(producto);
  }

  return [];
}

export function getQuoteCart() {
  clearOldQuoteCartStorage();
  return [];
}

export function saveQuoteCart() {
  clearOldQuoteCartStorage();
  return [];
}

export function updateQuoteItemQuantity() {
  clearOldQuoteCartStorage();
  return [];
}

export function removeQuoteItem() {
  clearOldQuoteCartStorage();
  return [];
}

export function clearQuoteCart() {
  clearOldQuoteCartStorage();
  return [];
}

export function getQuoteCartCount() {
  clearOldQuoteCartStorage();
  return 0;
}