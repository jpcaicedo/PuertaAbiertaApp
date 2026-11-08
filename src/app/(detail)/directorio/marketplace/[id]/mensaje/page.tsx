import { notFound, redirect } from "next/navigation";
import { ChatScreen } from "@/components/directorio/chat";
import { sampleChats } from "@/lib/directory/data";
import { getProductBySlug } from "@/lib/directory/queries";
import { getConversation } from "@/lib/messages/queries";
import { getCurrentUser } from "@/lib/auth/current-user";

type Props = { params: Promise<{ id: string }> };

/** D4b · Mensaje al vendedor (484:4063) */
export default async function MensajeVendedorPage({ params }: Props) {
  const [p, me] = await Promise.all([getProductBySlug((await params).id), getCurrentUser()]);
  if (!p) notFound();
  if (p.ownerId && p.ownerId === me?.id) redirect("/directorio/mis-publicaciones");
  // Vendedor con cuenta: conversación real (queda ligada al producto). Vendedor de ejemplo: chat de muestra.
  const conversation = p.ownerId ? await getConversation(p.ownerId) : null;
  return (
    <ChatScreen
      backHref={`/directorio/marketplace/${p.id}`}
      name={p.seller.name}
      avatar={p.seller.avatar}
      subtitle={`Vende: ${p.title} · Torre ${p.seller.tower}`}
      initialMessages={conversation ? conversation.messages : (sampleChats[p.id] ?? [])}
      remote={
        conversation
          ? {
              me: conversation.me,
              peerId: conversation.peer.id,
              acceptsMessages: conversation.peer.acceptsMessages,
              productId: p.dbId,
            }
          : undefined
      }
    />
  );
}
