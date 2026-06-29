import AdminProductoDetailClient from "@/components/AdminProductoDetailClient";

export const metadata = {
  title: "Editar producto | Admin Andyfers",
};

export default async function AdminProductoPage({ params }) {
  const { id } = await params;

  return <AdminProductoDetailClient id={id} />;
}