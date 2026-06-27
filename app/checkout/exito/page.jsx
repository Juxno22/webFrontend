import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Pago recibido | Andyfers",
};

export default function CheckoutSuccessPage() {
  return (
    <section className="checkout-return-page">
      <div className="checkout-return-card">
        <CheckCircle2 size={46} />
        <span>Pago recibido</span>
        <h1>Gracias por tu compra</h1>
        <p>
          Mercado Pago recibió tu pago. Estamos validando la confirmación para
          preparar tu pedido.
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