import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <div className="footer-brand">ANDYFERS</div>
          <p>
            Catálogo inteligente de refacciones automotrices con asistencia para
            encontrar productos compatibles y solicitar cotización.
          </p>
        </div>

        <div>
          <h4>Navegación</h4>
          <Link href="/">Inicio</Link>
          <Link href="/catalogo">Catálogo</Link>
          <Link href="/cotizacion">Mi cotización</Link>
          <Link href="/contacto">Contacto</Link>
        </div>

        <div>
          <h4>Importante</h4>
          <p>
            La disponibilidad, compatibilidad y precio final serán validados por
            un asesor de ventas.
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} Andyfers. Todos los derechos reservados.
        </span>
      </div>
    </footer>
  );
}
