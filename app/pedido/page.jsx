import { Suspense } from "react";
import "@/app/styles/order-tracking.css";
import OrderTrackingClient from "@/components/OrderTrackingClient";

export const metadata = {
  title: "Consultar pedido | Andyfers",
  description: "Consulta el estado de tu pedido Andyfers.",
};

function PedidoLoading() {
  return (
    <section className="order-tracking-page">
      <div className="container order-tracking-layout">
        <div className="order-tracking-main">
          <div className="order-tracking-heading">
            <span>Consulta pública</span>
            <h1>Rastrea tu pedido Andyfers</h1>
            <p>Cargando consulta de pedido...</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function PedidoPage() {
  return (
    <Suspense fallback={<PedidoLoading />}>
      <OrderTrackingClient />
    </Suspense>
  );
}