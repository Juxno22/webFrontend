"use client";

import { useEffect } from "react";
import { sendPerformanceMetrics } from "@/app/lib/performanceApi";

function getDeviceType() {
  if (typeof window === "undefined") return null;
  const width = window.innerWidth || 0;
  if (width <= 640) return "MOBILE";
  if (width <= 1024) return "TABLET";
  return "DESKTOP";
}

function getConnectionType() {
  if (typeof navigator === "undefined") return null;
  return navigator.connection?.effectiveType || navigator.connection?.type || null;
}

function baseMetricPayload(name, value, extra = {}) {
  return {
    metric_name: name,
    metric_value: value,
    url: window.location.href,
    pathname: window.location.pathname,
    referrer: document.referrer || null,
    device_type: getDeviceType(),
    connection_type: getConnectionType(),
    viewport_width: window.innerWidth || null,
    viewport_height: window.innerHeight || null,
    navigation_type: performance.getEntriesByType("navigation")?.[0]?.type || null,
    ...extra,
  };
}

export default function PublicPerformanceMonitor() {
  useEffect(() => {
    if (typeof window === "undefined" || typeof performance === "undefined") return undefined;
    if (window.__ANDYFERS_PERFORMANCE_MONITOR_ACTIVE__) return undefined;
    window.__ANDYFERS_PERFORMANCE_MONITOR_ACTIVE__ = true;

    const queue = [];
    let flushTimer = null;

    function enqueue(event) {
      queue.push(event);
      if (flushTimer) return;
      flushTimer = window.setTimeout(() => {
        flushTimer = null;
        const batch = queue.splice(0, queue.length);
        sendPerformanceMetrics(batch);
      }, 1600);
    }

    function flush() {
      if (flushTimer) {
        window.clearTimeout(flushTimer);
        flushTimer = null;
      }
      if (queue.length) {
        const batch = queue.splice(0, queue.length);
        sendPerformanceMetrics(batch);
      }
    }

    function captureNavigationTiming() {
      const nav = performance.getEntriesByType("navigation")?.[0];
      if (!nav) return;

      const ttfb = nav.responseStart;
      const domReady = nav.domContentLoadedEventEnd;
      const load = nav.loadEventEnd;

      if (Number.isFinite(ttfb) && ttfb > 0) enqueue(baseMetricPayload("TTFB", ttfb));
      if (Number.isFinite(domReady) && domReady > 0) enqueue(baseMetricPayload("DOM_READY", domReady));
      if (Number.isFinite(load) && load > 0) enqueue(baseMetricPayload("LOAD", load));
    }

    const observers = [];

    try {
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === "first-contentful-paint") {
            enqueue(baseMetricPayload("FCP", entry.startTime));
          }
        }
      });
      fcpObserver.observe({ type: "paint", buffered: true });
      observers.push(fcpObserver);
    } catch {}

    try {
      let lastLcp = null;
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        lastLcp = entries[entries.length - 1];
      });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
      observers.push(lcpObserver);

      const sendLcp = () => {
        if (lastLcp?.startTime) {
          enqueue(baseMetricPayload("LCP", lastLcp.startTime, {
            metadata: {
              element: lastLcp.element?.tagName || null,
              url: lastLcp.url || null,
            },
          }));
          lastLcp = null;
        }
      };
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") sendLcp();
      });
      window.addEventListener("pagehide", sendLcp);
    } catch {}

    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) clsValue += entry.value || 0;
        }
      });
      clsObserver.observe({ type: "layout-shift", buffered: true });
      observers.push(clsObserver);

      const sendCls = () => {
        if (clsValue > 0) {
          enqueue(baseMetricPayload("CLS", clsValue));
          clsValue = 0;
        }
      };
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") sendCls();
      });
      window.addEventListener("pagehide", sendCls);
    } catch {}

    try {
      let maxInp = 0;
      const inpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const duration = entry.duration || 0;
          if (duration > maxInp) maxInp = duration;
        }
      });
      inpObserver.observe({ type: "event", buffered: true, durationThreshold: 40 });
      observers.push(inpObserver);

      const sendInp = () => {
        if (maxInp > 0) {
          enqueue(baseMetricPayload("INP", maxInp));
          maxInp = 0;
        }
      };
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") sendInp();
      });
      window.addEventListener("pagehide", sendInp);
    } catch {}

    if (document.readyState === "complete") {
      captureNavigationTiming();
    } else {
      window.addEventListener("load", captureNavigationTiming, { once: true });
    }

    window.addEventListener("pagehide", flush);

    return () => {
      observers.forEach((observer) => observer.disconnect());
      flush();
      window.__ANDYFERS_PERFORMANCE_MONITOR_ACTIVE__ = false;
    };
  }, []);

  return null;
}
