import { trackAnalyticsEvent } from "./analytics";

const STORAGE_KEY = "DEBdlt4GA8ANmbqTgO0xALKcVvN6LU";

function safeParseJson(value, fallback = []) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function trackQuoteCartAdd(producto, cantidad = 1) {
  if (typeof window === "undefined" || !producto) return;

  trackAnalyticsEvent("PRODUCTO_AGREGADO_CARRITO", {
    producto_id: producto.id || producto.producto_id || null,
    codigo_andyfers: producto.codigo_andyfers || null,
    codigo_importacion: producto.codigo_importacion || null,
    categoria_nombre: producto.categoria || null,
    familia: producto.familia || null,
    cantidad,
    metadata: {
      descripcion: producto.descripcion || "",
      armadora: producto.armadora || "",
      product_key:
        producto.codigo_andyfers ||
        producto.codigo_importacion ||
        String(producto.id || producto.producto_id || ""),
    },
  });
}

export function getQuoteCart() {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = safeParseJson(raw, []);

  return Array.isArray(parsed) ? parsed : [];
}

export function saveQuoteCart(items) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

  window.dispatchEvent(new CustomEvent("andyfers_quote_cart_updated"));
}

export function addToQuoteCart(producto) {
  const current = getQuoteCart();

  const productKey =
    producto.codigo_andyfers ||
    producto.codigo_importacion ||
    String(producto.id);

  const existingIndex = current.findIndex(
    (item) => item.product_key === productKey
  );

  if (existingIndex >= 0) {
    current[existingIndex].cantidad += 1;
    saveQuoteCart(current);
    trackQuoteCartAdd(producto, 1);
    return current;
  }

  const nextItem = {
    product_key: productKey,
    producto_id: producto.id,
    codigo_andyfers: producto.codigo_andyfers,
    codigo_importacion: producto.codigo_importacion,
    descripcion: producto.descripcion,
    familia: producto.familia,
    armadora: producto.armadora,
    categoria: producto.categoria,
    cantidad: 1,
  };

  const updated = [...current, nextItem];

  saveQuoteCart(updated);
  trackQuoteCartAdd(producto, 1);

  return updated;
}

export function updateQuoteItemQuantity(productKey, cantidad) {
  const nextQuantity = Number(cantidad);

  if (!Number.isFinite(nextQuantity) || nextQuantity < 1) {
    return getQuoteCart();
  }

  const updated = getQuoteCart().map((item) => {
    if (item.product_key !== productKey) return item;

    return {
      ...item,
      cantidad: nextQuantity,
    };
  });

  saveQuoteCart(updated);

  return updated;
}

export function removeQuoteItem(productKey) {
  const updated = getQuoteCart().filter(
    (item) => item.product_key !== productKey
  );

  saveQuoteCart(updated);

  return updated;
}

export function clearQuoteCart() {
  saveQuoteCart([]);
  return [];
}

export function getQuoteCartCount() {
  return getQuoteCart().reduce(
    (total, item) => total + Number(item.cantidad || 0),
    0
  );
}