"use client";

import { useEffect, useState } from "react";

export default function ToastListener() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    function handleToast(event) {
      setMessage(event.detail?.message || "Acción realizada");

      window.clearTimeout(window.__andyfersToastTimer);
      window.__andyfersToastTimer = window.setTimeout(() => {
        setMessage("");
      }, 2400);
    }

    window.addEventListener("andyfers_toast", handleToast);

    return () => {
      window.removeEventListener("andyfers_toast", handleToast);
    };
  }, []);

  if (!message) return null;

  return <div className="toast">{message}</div>;
}