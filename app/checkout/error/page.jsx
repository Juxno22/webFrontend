import CheckoutReturnClient from "@/components/CheckoutReturnClient";

export const metadata = {
  title: "Pago no completado | Andyfers",
};

export default function CheckoutErrorPage() {
  return <CheckoutReturnClient type="error" />;
}