import AdminCotizacionDetailClient from "../../../../components/AdminCotizacionDetailClient";

export const metadata = {
  title: "Detalle cotización | Andyfers",
};

export default async function AdminCotizacionDetailPage({ params }) {
  const { folio } = await params;

  return <AdminCotizacionDetailClient folio={folio} />;
}