"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  MessageCircle,
  Send,
} from "lucide-react";
import { iniciarChatPublico } from "@/app/lib/api";

const MOTIVOS = [
  { value: "COTIZACION", label: "Quiero cotizar" },
  { value: "DUDA_PRODUCTO", label: "Tengo duda sobre un producto" },
  { value: "COMPATIBILIDAD", label: "Quiero validar compatibilidad" },
  { value: "EXISTENCIA_PRECIO", label: "Quiero saber existencia o precio" },
  { value: "ENVIO", label: "Tengo duda sobre envío" },
  { value: "SEGUIMIENTO_PEDIDO", label: "Quiero preguntar por mi pedido" },
  { value: "OTRO", label: "Otra duda" },
];

export default function PublicChatStartClient() {
  const searchParams = useSearchParams();

  const productoInicial = useMemo(() => {
    return searchParams.get("producto") || "";
  }, [searchParams]);

  const folioInicial = useMemo(() => {
    return searchParams.get("folio") || "";
  }, [searchParams]);

  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [tipoIntencion, setTipoIntencion] = useState("COTIZACION");
  const [productoCodigo, setProductoCodigo] = useState(productoInicial);
  const [cotizacionFolio, setCotizacionFolio] = useState(folioInicial);
  const [pedidoFolio, setPedidoFolio] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function iniciarChat(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response = await iniciarChatPublico({
        nombre,
        whatsapp,
        tipo_intencion: tipoIntencion,
        producto_codigo: productoCodigo,
        cotizacion_folio: cotizacionFolio,
        pedido_folio: pedidoFolio,
        mensaje,
      });

      const token = response.data?.public_token;

      if (!token) {
        throw new Error("No se recibió el token del chat.");
      }

      window.location.href = `/chat/${encodeURIComponent(token)}`;
    } catch (err) {
      setError(err.message || "No se pudo abrir el chat.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="public-chat-page">
      <section className="public-chat-shell">
        <Link href="/" className="public-chat-back">
          <ArrowLeft size={18} />
          Volver a Andyfers
        </Link>

        <article className="public-chat-card">
          <div className="public-chat-icon">
            <MessageCircle size={34} />
          </div>

          <span>Atención Andyfers</span>

          <h1>¿Tienes dudas antes de comprar?</h1>

          <p>
            Escríbenos para cotizar, validar compatibilidad, revisar existencia,
            precio, envío o resolver dudas sobre algún producto.
          </p>

          {error && (
            <div className="public-chat-alert">
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          <form className="public-chat-form" onSubmit={iniciarChat}>
            <label>
              Nombre completo
              <input
                type="text"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Tu nombre completo"
                required
              />
            </label>

            <label>
              WhatsApp
              <input
                type="tel"
                value={whatsapp}
                onChange={(event) => setWhatsapp(event.target.value)}
                placeholder="Ej. 2381234567"
                required
              />
            </label>

            <label>
              Motivo
              <select
                value={tipoIntencion}
                onChange={(event) => setTipoIntencion(event.target.value)}
                required
              >
                {MOTIVOS.map((motivo) => (
                  <option key={motivo.value} value={motivo.value}>
                    {motivo.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Código de producto opcional
              <input
                type="text"
                value={productoCodigo}
                onChange={(event) => setProductoCodigo(event.target.value)}
                placeholder="Ej. AT1067"
              />
            </label>

            <label>
              Folio de cotización opcional
              <input
                type="text"
                value={cotizacionFolio}
                onChange={(event) => setCotizacionFolio(event.target.value)}
                placeholder="Ej. COT-2026-000001"
              />
            </label>

            <label>
              Folio de pedido opcional
              <input
                type="text"
                value={pedidoFolio}
                onChange={(event) => setPedidoFolio(event.target.value)}
                placeholder="Ej. VTA-2026-000001"
              />
            </label>

            <label className="public-chat-form-full">
              Mensaje
              <textarea
                value={mensaje}
                onChange={(event) => setMensaje(event.target.value)}
                placeholder="Cuéntanos tu duda..."
                rows={4}
                required
              />
            </label>

            <button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 size={18} className="public-chat-spin" />
              ) : (
                <Send size={18} />
              )}
              {loading ? "Abriendo chat..." : "Enviar mensaje"}
            </button>
          </form>
        </article>
      </section>
    </main>
  );
}