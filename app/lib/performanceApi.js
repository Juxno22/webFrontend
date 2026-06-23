const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const SESSION_KEY = "andyfers_session_id";
const VISITOR_KEY = "andyfers_visitante_id";

function createId(prefix) {
  const cryptoObj = typeof window !== "undefined" ? window.crypto : null;
  const random = cryptoObj?.randomUUID ? cryptoObj.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${random}`;
}

export function getPerformanceSessionId() {
  if (typeof window === "undefined") return null;

  let value = sessionStorage.getItem(SESSION_KEY);
  if (!value) {
    value = createId("ses");
    sessionStorage.setItem(SESSION_KEY, value);
  }
  return value;
}

export function getPerformanceVisitorId() {
  if (typeof window === "undefined") return null;

  let value = localStorage.getItem(VISITOR_KEY);
  if (!value) {
    value = createId("vis");
    localStorage.setItem(VISITOR_KEY, value);
  }
  return value;
}

export function sendPerformanceMetrics(events = []) {
  if (typeof window === "undefined" || !events.length) return;

  const payload = JSON.stringify({
    session_id: getPerformanceSessionId(),
    visitante_id: getPerformanceVisitorId(),
    events,
  });

  const endpoint = `${API_URL}/api/performance/web-vitals`;

  if (navigator.sendBeacon) {
    const blob = new Blob([payload], { type: "application/json" });
    const sent = navigator.sendBeacon(endpoint, blob);
    if (sent) return;
  }

  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => null);
}
