import ContactClient from "../../components/ContactClient";
import { getSiteContacto, getSiteContent } from "@/app/lib/api";

export const metadata = {
  title: "Contacto | Andyfers",
  description:
    "Contacta a ventas Andyfers para validar disponibilidad, compatibilidad y precio final de tus productos.",
};

export default async function ContactoPage() {
  let contentBlocks = [];
  let contactChannels = [];

  try {
    const [contentRes, contactoRes] = await Promise.all([
      getSiteContent("CONTACTO"),
      getSiteContacto(),
    ]);

    contentBlocks = contentRes.data || [];
    contactChannels = contactoRes.data || [];
  } catch {
    contentBlocks = [];
    contactChannels = [];
  }

  return (
    <ContactClient
      contentBlocks={contentBlocks}
      contactChannels={contactChannels}
    />
  );
}