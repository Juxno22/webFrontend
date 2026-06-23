import "@/app/styles/admin-commercial-tasks.css";
import "@/app/styles/admin-exports.css";
import AdminCommercialTasksClient from "@/components/AdminCommercialTasksClient";

export const metadata = {
  title: "Pendientes comerciales | Panel Andyfers",
};

export default function AdminCommercialTasksPage() {
  return <AdminCommercialTasksClient />;
}
