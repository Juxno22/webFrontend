import CheckoutReturnClient from "@/components/CheckoutReturnClient";

export const metadata = {
  title: "Pago pendiente | Andyfers",
};

export default function CheckoutPendingPage() {
  return <CheckoutReturnClient type="pendiente" />;
}