"use client";

import { useState } from "react";
import { Bot, Send, X } from "lucide-react";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <section className="chat-panel">
          <div className="chat-header">
            <div>
              <strong>Asistente Andyfers</strong>
              <span>Próximamente...</span>
            </div>

            <button onClick={() => setOpen(false)} aria-label="Cerrar chat">
              <X size={18} />
            </button>
          </div>

          <div className="chat-body">
            <div className="chat-message bot">
              Hola. En el siguiente módulo conectaremos este asistente a la base
              de datos para responder usando productos reales de Andyfers.
            </div>

            <div className="chat-message bot muted">
              Ejemplo futuro: “Busco termostato para Tsuru 2010 1.6”.
            </div>
          </div>

          <form className="chat-input" onSubmit={(e) => e.preventDefault()}>
            <input
              type="text"
              placeholder="Pregunta por una refacción..."
              disabled
            />
            <button type="submit" disabled>
              <Send size={17} />
            </button>
          </form>
        </section>
      )}

      <button className="chat-float" onClick={() => setOpen(true)}>
        <Bot size={24} />
      </button>
    </>
  );
}
