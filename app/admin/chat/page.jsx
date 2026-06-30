import { Suspense } from "react";
import "@/app/styles/admin-chat.css";
import AdminChatClient from "@/components/AdminChatClient";

export const metadata = {
  title: "Chat cotizaciones | Panel Andyfers",
};

function LoadingAdminChat() {
  return (
    <section className="admin-workspace admin-chat-os">
      <div className="admin-chat-empty">
        <strong>Cargando chat de cotizaciones...</strong>
      </div>
    </section>
  );
}

export default function AdminChatPage() {
  return (
    <Suspense fallback={<LoadingAdminChat />}>
      <AdminChatClient />
    </Suspense>
  );
}