import LegalPage from "@/components/LegalPage";

export const metadata = {
  title: "Términos y condiciones | Andyfers",
  description: "Términos y condiciones de compra en Andyfers.",
};

export default function TerminosCondicionesPage() {
  return (
    <LegalPage
      kicker="Condiciones de uso"
      title="Términos y condiciones"
      updatedAt="Junio 2026"
    >
      <h2>1. Uso del sitio</h2>
      <p>
        Al utilizar este sitio web, el usuario acepta estos términos y condiciones.
        Andyfers ofrece productos automotrices para consulta, cotización y compra
        en línea.
      </p>

      <h2>2. Información de productos</h2>
      <p>
        Andyfers procura mostrar información clara sobre códigos, aplicaciones,
        equivalencias, cruces y características de los productos. Sin embargo, el
        usuario debe validar que la pieza sea compatible con su vehículo antes de
        finalizar la compra.
      </p>

      <h2>3. Precios web</h2>
      <p>
        Los precios mostrados o cobrados en el proceso de compra web pueden ser
        diferentes a precios de mostrador. El precio web puede incluir costos
        operativos o de envío integrados.
      </p>

      <h2>4. Disponibilidad</h2>
      <p>
        La disponibilidad de productos depende del inventario asignado al canal
        ecommerce. En caso de una incidencia operativa con existencia, Andyfers se
        comunicará con el cliente para ofrecer una solución.
      </p>

      <h2>5. Pagos</h2>
      <p>
        Los pagos en línea son gestionados por Mercado Pago. Andyfers no procesa
        ni almacena datos bancarios sensibles. La orden se considera pagada cuando
        Mercado Pago confirma la operación y el sistema registra el estado como
        pagado.
      </p>

      <h2>6. Pedido y seguimiento</h2>
      <p>
        Al completar una compra, el cliente recibirá un número de pedido Andyfers.
        Este número puede utilizarse para consultar el estado del pedido en la
        página pública de seguimiento o por WhatsApp.
      </p>

      <h2>7. Cancelaciones</h2>
      <p>
        Las cancelaciones estarán sujetas al estado del pedido, disponibilidad de
        producto, preparación, entrega y confirmación de pago.
      </p>

      <h2>8. Modificaciones</h2>
      <p>
        Andyfers puede actualizar estos términos cuando sea necesario. La versión
        vigente estará disponible en esta página.
      </p>
    </LegalPage>
  );
}