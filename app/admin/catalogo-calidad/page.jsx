import "@/app/styles/admin-catalog-quality.css";
import "@/app/styles/admin-exports.css";
import AdminCatalogQualityClient from "@/components/AdminCatalogQualityClient";

export const metadata = {
  title: "Calidad del catálogo | Panel Andyfers",
};

export default function AdminCatalogQualityPage() {
  return <AdminCatalogQualityClient />;
}
