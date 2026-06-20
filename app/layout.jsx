import "./globals.css";
import AppShell from "../components/AppShell";

export const metadata = {
  title: "Andyfer's",
  description:
    "Catálogo inteligente de refacciones Andyfers. Encuentra productos, consulta compatibilidad y solicita cotización con apoyo de asistencia inteligente.",
  keywords: [
    "Andyfers",
    "refacciones",
    "catálogo automotriz",
    "termostatos",
    "bombas de agua",
    "tomas de agua",
    "refacciones automotrices",
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}