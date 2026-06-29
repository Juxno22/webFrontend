import "@/app/styles/order-tracking.css";
import OrderTrackingClient from "@/components/OrderTrackingClient";

export const metadata = {
  title: "Consultar pedido | Andyfers",
  description: "Consulta el estado de tu pedido Andyfers.",
};

export default function PedidoPage() {
  return <OrderTrackingClient />;
}