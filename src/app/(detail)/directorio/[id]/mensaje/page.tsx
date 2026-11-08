import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
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
  const [s, me] = await Promise.all([getServiceBySlug((await params).id), getCurrentUser()]);
  if (!s) notFound();
  // Es su propio servicio: lo que le escriben está en la bandeja.
  if (s.ownerId && s.ownerId === me?.id) redirect("/mensajes");
  // Vecino con cuenta: conversación real. Vecino de ejemplo: se guarda lo que escribes, pero no responde.
  const conversation = await getConversation(s.ownerId ?? `demo-s-${s.id}`);
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
          ? {
              me: conversation.me,
              peerId: conversation.peer.id,
              acceptsMessages: conversation.peer.acceptsMessages,
              demo: conversation.peer.demo,
            }
          : undefined
      }
    />
  );
}
