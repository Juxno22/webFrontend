const LAST_ORDER_KEY = "ANDYFERS_LAST_ORDER_V1";

export function saveLastOrder(order = {}) {
  if (typeof window === "undefined") return;

  const payload = {
    folio: order.folio || "",
    whatsapp: order.whatsapp || "",
    nombre_cliente: order.nombre_cliente || "",
    created_at: new Date().toISOString(),
  };

  window.localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(payload));
}

export function getLastOrder() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(LAST_ORDER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}