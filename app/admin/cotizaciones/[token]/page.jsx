import "@/app/styles/public-chat.css";
import PublicChatClient from "@/components/PublicChatClient";

export const metadata = {
  title: "Chat Andyfers",
};

export default async function CotizacionChatTokenPage({ params }) {
  const { token } = await params;

  return <PublicChatClient token={token} />;
}