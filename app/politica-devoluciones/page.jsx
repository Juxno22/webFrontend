import LegalPage from "@/components/LegalPage";

export const metadata = {
  title: "Política de devoluciones | Andyfers",
  description: "Política de cambios y devoluciones de Andyfers.",
};

export default function PoliticaDevolucionesPage() {
  return (
    <LegalPage
      kicker="Cambios y devoluciones"
      title="Política de devoluciones"
      updatedAt="Junio 2026"
    >
      <h2>1. Revisión del producto</h2>
      <p>
        El cliente debe revisar que el producto recibido corresponda al pedido
        realizado y reportar cualquier incidencia a Andyfers lo antes posible.
      </p>

      <h2>2. Compatibilidad de piezas</h2>
      <p>
        El cliente es responsable de validar la compatibilidad de la pieza con su
        vehículo antes de comprar. Andyfers puede apoyar con información de códigos,
        cruces, equivalencias y aplicaciones, pero la validación final debe hacerse
        antes de instalar la pieza.
      </p>

      <h2>3. Condiciones generales</h2>
      <p>
        Para solicitar un cambio o devolución, el producto debe conservarse en buen
        estado, sin instalación, sin alteraciones y con empaque cuando aplique.
      </p>

      <h2>4. Productos instalados o usados</h2>
      <p>
        Los productos instalados, usados, manipulados o dañados por causas ajenas
        a Andyfers pueden no ser elegibles para cambio o devolución.
      </p>

      <h2>5. Procedimiento</h2>
      <p>
        Para iniciar una solicitud, el cliente deberá contactar a Andyfers con su
        número de pedido, datos de contacto, descripción del problema y evidencia
        cuando sea necesario.
      </p>

      <h2>6. Resolución</h2>
      <p>
        Andyfers revisará cada caso y podrá ofrecer cambio, reposición, devolución
        o una solución comercial según corresponda.
      </p>
    </LegalPage>
  );
}