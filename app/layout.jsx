import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ChatWidget from "../components/ChatWidget";
import ToastListener from "../components/ToastListener";

export const metadata = {
    title: "Andyfers | Catálogo inteligente de refacciones",
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
                <Header />
                <main>{children}</main>
                <Footer />
                <ChatWidget />
                <ToastListener />
            </body>
        </html>
    );
}