import Link from "next/link";

export default function LegalPage({ kicker, title, updatedAt, children }) {
  return (
    <main className="legal-page">
      <section className="container legal-hero">
        <Link href="/" className="legal-back">
          ← Volver al inicio
        </Link>

        <span>{kicker}</span>
        <h1>{title}</h1>
        <p>Última actualización: {updatedAt}</p>
      </section>

      <section className="container legal-content">
        {children}
      </section>
    </main>
  );
}