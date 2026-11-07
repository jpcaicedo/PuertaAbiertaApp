import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Screen } from "@/components/app/screen";
import { ActivityDetail, NeighborhoodEventDetail } from "@/components/agenda/detail";
import { agendaItems, getAgendaItem } from "@/lib/agenda/data";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return agendaItems.map((i) => ({ id: i.id }));
}

export async function generateMetadata({ params }: Props) {
  const item = getAgendaItem((await params).id);
  return { title: item ? `${item.title} · Agenda` : "Agenda" };
}

/** A3/A4 (actividad del conjunto) y A9/A10 (evento del barrio). Sin barra inferior. */
export default async function AgendaItemPage({ params }: Props) {
  const item = getAgendaItem((await params).id);
  if (!item) notFound();

  return (
    <Screen>
      <Suspense>
        {item.kind === "actividad" ? <ActivityDetail activity={item} /> : <NeighborhoodEventDetail event={item} />}
      </Suspense>
    </Screen>
  );
}
