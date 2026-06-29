import LegalPage from "@/components/LegalPage";

export const metadata = {
  title: "Aviso de privacidad | Andyfers",
  description: "Aviso de privacidad de Andyfers.",
};

export default function AvisoPrivacidadPage() {
  return (
    <LegalPage
      kicker="Privacidad"
      title="Aviso de privacidad"
      updatedAt="Junio 2026"
    >
      <h2>1. Responsable del tratamiento de datos</h2>
      <p>
        Andyfers es responsable del uso y protección de los datos personales que
        los usuarios proporcionan al utilizar este sitio web, realizar una compra,
        solicitar una cotización o contactar por medios digitales.
      </p>

      <h2>2. Datos que podemos solicitar</h2>
      <p>
        Podemos solicitar nombre, número de WhatsApp o teléfono, correo electrónico,
        dirección de entrega, datos de facturación cuando aplique, información del
        pedido, historial de cotizaciones y mensajes enviados por el usuario.
      </p>

      <h2>3. Datos de pago</h2>
      <p>
        Andyfers no almacena ni procesa directamente datos sensibles de tarjetas
        bancarias. Los pagos son gestionados por Mercado Pago dentro de su propia
        plataforma segura.
      </p>

      <h2>4. Finalidades del uso de datos</h2>
      <p>
        Los datos se utilizan para procesar pedidos, dar seguimiento a compras,
        responder cotizaciones, coordinar entregas, brindar soporte, enviar
        información relacionada con la compra y mejorar la atención comercial.
      </p>

      <h2>5. Comunicación con el cliente</h2>
      <p>
        El usuario acepta que Andyfers pueda contactarlo por WhatsApp, teléfono o
        correo electrónico para asuntos relacionados con sus pedidos, cotizaciones
        o solicitudes realizadas en el sitio.
      </p>

      <h2>6. Conservación de datos</h2>
      <p>
        La información se conservará durante el tiempo necesario para cumplir con
        finalidades operativas, administrativas, comerciales y de soporte.
      </p>

      <h2>7. Derechos del usuario</h2>
      <p>
        El usuario puede solicitar la actualización, corrección o eliminación de
        sus datos personales contactando directamente a Andyfers por los medios
        oficiales publicados en el sitio.
      </p>

      <h2>8. Cambios al aviso</h2>
      <p>
        Andyfers puede modificar este aviso de privacidad cuando sea necesario.
        La versión vigente estará disponible en esta misma página.
      </p>
    </LegalPage>
  );
}