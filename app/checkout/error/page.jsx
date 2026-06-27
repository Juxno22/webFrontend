import Link from "next/link";
import { XCircle } from "lucide-react";

export const metadata = {
  title: "Pago no completado | Andyfers",
};

export default function CheckoutErrorPage() {
  return (
    <section className="checkout-return-page">
      <div className="checkout-return-card">
        <XCircle size={46} />
        <span>Pago no completado</span>
        <h1>No se pudo completar el pago</h1>
        <p>
          Mercado Pago no aprobó la operación o el proceso fue cancelado.
          Puedes intentar nuevamente desde el catálogo.
        </p>

        <div className="checkout-return-actions">
          <Link href="/catalogo" className="btn-primary">
            Ver catálogo
          </Link>
          <Link href="/" className="btn-secondary">
            Volver al inicio
          </Link>
        </div>
      </div>
    </section>
  );
}