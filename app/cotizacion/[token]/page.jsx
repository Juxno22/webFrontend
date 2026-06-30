import { notFound } from "next/navigation";
import "@/app/styles/public-chat.css";
import PublicChatClient from "@/components/PublicChatClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Chat Andyfers",
};

export default async function CotizacionChatTokenPage({ params }) {
  const resolvedParams = await params;
  const token = resolvedParams?.token;

  if (!token) {
    notFound();
  }

  return <PublicChatClient token={token} />;
}