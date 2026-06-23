import AdminPerformanceClient from "@/components/AdminPerformanceClient";

export const metadata = {
  title: "Performance pública | Admin Andyfers",
  description: "Monitoreo de velocidad, Core Web Vitals y páginas públicas lentas.",
};

export default function AdminPerformancePage() {
  return <AdminPerformanceClient />;
}
