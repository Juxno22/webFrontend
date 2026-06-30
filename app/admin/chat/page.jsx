import { Suspense } from "react";
import "@/app/styles/admin-chat.css";
import AdminChatClient from "@/components/AdminChatClient";

export const metadata = {
  title: "Chat clientes | Admin Andyfers",
};

function AdminChatLoading() {
  return (
    <section className="admin-workspace">
      <div className="admin-loading-panel">
        <strong>Cargando chat...</strong>
      </div>
    </section>
  );
}

export default function AdminChatPage() {
  return (
    <Suspense fallback={<AdminChatLoading />}>
      <AdminChatClient />
    </Suspense>
  );
}