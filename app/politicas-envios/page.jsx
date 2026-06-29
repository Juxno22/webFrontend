import LegalPage from "@/components/LegalPage";

export const metadata = {
  title: "Política de envíos | Andyfers",
  description: "Política de envíos y entregas de Andyfers.",
};

export default function PoliticaEnviosPage() {
  return (
    <LegalPage
      kicker="Entregas"
      title="Política de envíos"
      updatedAt="Junio 2026"
    >
      <h2>1. Envío integrado en precio web</h2>
      <p>
        Los precios web pueden incluir costos operativos o de envío para ofrecer
        una experiencia de compra más sencilla al cliente. Por ello, el precio web
        puede ser diferente al precio de mostrador.
      </p>

      <h2>2. Confirmación del pedido</h2>
      <p>
        Una vez confirmado el pago por Mercado Pago, Andyfers preparará el pedido
        y se comunicará con el cliente cuando sea necesario para validar datos de
        entrega.
      </p>

      <h2>3. Datos de entrega</h2>
      <p>
        El cliente es responsable de proporcionar nombre, teléfono y dirección de
        entrega correctos. Si la información está incompleta, Andyfers podrá
        contactar al cliente para corregirla antes de enviar o entregar el pedido.
      </p>

      <h2>4. Tiempos de entrega</h2>
      <p>
        Los tiempos de entrega pueden variar según disponibilidad, zona, paquetería
        y operación interna. El estado del pedido podrá consultarse con el número
        de pedido Andyfers.
      </p>

      <h2>5. Incidencias de entrega</h2>
      <p>
        Si existe una incidencia con la entrega, Andyfers contactará al cliente
        para dar seguimiento y acordar una solución.
      </p>
    </LegalPage>
  );
}