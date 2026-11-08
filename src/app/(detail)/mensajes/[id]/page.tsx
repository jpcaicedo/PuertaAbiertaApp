import { notFound } from "next/navigation";
import { ChatScreen } from "@/components/directorio/chat";
import { getConversation } from "@/lib/messages/queries";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Mensaje · Puerta Abierta" };
export const dynamic = "force-dynamic";

/** Conversación con un vecino desde la bandeja de Mensajes. */
export default async function ConversacionPage({ params }: Props) {
  const conversation = await getConversation((await params).id);
  if (!conversation) notFound();
  const { peer } = conversation;
  return (
    <ChatScreen
      backHref="/mensajes"
      name={peer.name}
      avatar={peer.avatar}
      subtitle={peer.tower ? `Torre ${peer.tower}` : "Vecino del conjunto"}
      initialMessages={conversation.messages}
      remote={{ me: conversation.me, peerId: peer.id, acceptsMessages: peer.acceptsMessages }}
    />
  );
}
