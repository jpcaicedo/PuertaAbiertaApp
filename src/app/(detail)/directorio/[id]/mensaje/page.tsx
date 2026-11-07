import { notFound } from "next/navigation";
import { ChatScreen } from "@/components/directorio/chat";
import { getService, sampleChats, services } from "@/lib/directory/data";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return services.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: Props) {
  const s = getService((await params).id);
  return { title: s ? `Mensaje a ${s.neighbor.firstName}` : "Mensaje" };
}

/** D4 · Mensaje a Camila (484:3808) */
export default async function MensajeVecinoPage({ params }: Props) {
  const s = getService((await params).id);
  if (!s) notFound();
  return (
    <ChatScreen
      backHref={`/directorio/${s.id}`}
      name={s.neighbor.name}
      avatar={s.neighbor.avatar}
      subtitle={`${s.shortRole} · Torre ${s.neighbor.tower}`}
      phone={s.callHours ? s.phone : undefined}
      initialMessages={sampleChats[s.id] ?? []}
    />
  );
}
