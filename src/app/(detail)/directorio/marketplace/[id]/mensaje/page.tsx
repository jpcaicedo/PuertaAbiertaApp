import { notFound } from "next/navigation";
import { ChatScreen } from "@/components/directorio/chat";
import { getProduct, products, sampleChats } from "@/lib/directory/data";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

/** D4b · Mensaje al vendedor (484:4063) */
export default async function MensajeVendedorPage({ params }: Props) {
  const p = getProduct((await params).id);
  if (!p) notFound();
  return (
    <ChatScreen
      backHref={`/directorio/marketplace/${p.id}`}
      name={p.seller.name}
      avatar={p.seller.avatar}
      subtitle={`Vende: ${p.title} · Torre ${p.seller.tower}`}
      initialMessages={sampleChats[p.id] ?? []}
    />
  );
}
