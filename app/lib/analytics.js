"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function getOrCreateStorageId(key, prefix) {
  if (typeof window === "undefined") return "";

  const current = window.localStorage.getItem(key);

  if (current) return current;

  const next = `${prefix}_${Date.now()}_${Math.random()
    .toString(16)
    .slice(2)}`;

  window.localStorage.setItem(key, next);

  return next;
}

export function getAnalyticsSessionId() {
  if (typeof window === "undefined") return "";

  const key = "andyfers_analytics_session_id";
  const current = window.sessionStorage.getItem(key);

  if (current) return current;

  const next = `ses_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  window.sessionStorage.setItem(key, next);

  return next;
}

export function getAnalyticsVisitorId() {
  return getOrCreateStorageId("andyfers_analytics_visitor_id", "vis");
}

function buildAnalyticsBody(evento, payload = {}) {
  return {
    evento,
    session_id: getAnalyticsSessionId(),
    visitante_id: getAnalyticsVisitorId(),
    origen: "PUBLIC_WEB",
    ...payload,
  };
}

export async function trackAnalyticsEvent(evento, payload = {}) {
  if (typeof window === "undefined") return null;

  const body = buildAnalyticsBody(evento, payload);

  try {
    const response = await fetch(`${API_URL}/api/analytics/event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-andyfers-session-id": body.session_id,
        "x-andyfers-visitor-id": body.visitante_id,
      },
      body: JSON.stringify(body),
      keepalive: true,
    });

    return await response.json().catch(() => null);
  } catch {
    return null;
  }
}

export function trackAnalyticsBeacon(evento, payload = {}) {
  if (typeof window === "undefined") return;

  const body = buildAnalyticsBody(evento, payload);
  const url = `${API_URL}/api/analytics/event`;

  if (navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(body)], {
      type: "application/json",
    });

    navigator.sendBeacon(url, blob);
    return;
  }

  trackAnalyticsEvent(evento, payload);
}
