import "./globals.css";
import AppShell from "../components/AppShell";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_PUBLIC_URL ||
  "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Andyfers | Catálogo inteligente de refacciones",
    template: "%s | Andyfers",
  },
  description:
    "Catálogo inteligente de refacciones Andyfers. Encuentra productos de sistema de enfriamiento, consulta compatibilidad y solicita cotización con asistencia inteligente.",
  keywords: [
    "Andyfers",
    "refacciones",
    "catálogo automotriz",
    "termostatos",
    "bombas de agua",
    "tomas de agua",
    "depósitos anticongelante",
    "tapones",
    "poleas",
    "fan clutch",
    "sistema de enfriamiento",
    "refacciones automotrices",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: "/",
    siteName: "Andyfers",
    title: "Andyfers | Catálogo inteligente de refacciones",
    description:
      "Encuentra refacciones de sistema de enfriamiento, consulta compatibilidad y solicita cotización.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Andyfers | Catálogo inteligente de refacciones",
    description:
      "Encuentra refacciones de sistema de enfriamiento, consulta compatibilidad y solicita cotización.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es-MX">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
