import Link from "next/link";
import { Clock3 } from "lucide-react";

export const metadata = {
  title: "Pago pendiente | Andyfers",
};

export default function CheckoutPendingPage() {
  return (
    <section className="checkout-return-page">
      <div className="checkout-return-card">
        <Clock3 size={46} />
        <span>Pago pendiente</span>
        <h1>Tu pago está en revisión</h1>
        <p>
          Mercado Pago todavía no confirma el pago. Cuando se apruebe,
          actualizaremos el estado de la venta.
        </p>

        <div className="checkout-return-actions">
          <Link href="/catalogo" className="btn-primary">
            Seguir comprando
          </Link>
          <Link href="/" className="btn-secondary">
            Volver al inicio
          </Link>
        </div>
      </div>
    </section>
  );
}