import { notFound } from "next/navigation";
import { ChatScreen } from "@/components/directorio/chat";
import { sampleChats } from "@/lib/directory/data";
import { getServiceBySlug } from "@/lib/directory/queries";
import { getConversation } from "@/lib/messages/queries";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const s = await getServiceBySlug((await params).id);
  return { title: s ? `Mensaje a ${s.neighbor.firstName}` : "Mensaje" };
}

/** D4 · Mensaje a Camila (484:3808) */
export default async function MensajeVecinoPage({ params }: Props) {
  const s = await getServiceBySlug((await params).id);
  if (!s) notFound();
  // Vecino con cuenta: conversación real. Vecino de ejemplo: el chat de muestra del diseño.
  const conversation = s.ownerId ? await getConversation(s.ownerId) : null;
  return (
    <ChatScreen
      backHref={`/directorio/${s.id}`}
      name={s.neighbor.name}
      avatar={s.neighbor.avatar}
      subtitle={`${s.shortRole} · Torre ${s.neighbor.tower}`}
      phone={s.callHours ? s.phone : undefined}
      initialMessages={conversation ? conversation.messages : (sampleChats[s.id] ?? [])}
      remote={
        conversation
          ? { me: conversation.me, peerId: conversation.peer.id, acceptsMessages: conversation.peer.acceptsMessages }
          : undefined
      }
    />
  );
}
