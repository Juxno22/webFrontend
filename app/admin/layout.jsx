import "@/app/styles/admin-os.css";
import AdminShell from "@/components/AdminShell";

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}