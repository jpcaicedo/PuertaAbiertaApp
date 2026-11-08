import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Screen } from "@/components/app/screen";
import { ActivityDetail, NeighborhoodEventDetail } from "@/components/agenda/detail";
import { getAgendaEntry } from "@/lib/agenda/queries";
import { AgendaStateProvider } from "@/lib/agenda/store";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const entry = await getAgendaEntry((await params).id);
  return { title: entry ? `${entry.item.title} · Agenda` : "Agenda" };
}

/** A3/A4 (actividad del conjunto) y A9/A10 (evento del barrio). Sin barra inferior. */
export default async function AgendaItemPage({ params }: Props) {
  const entry = await getAgendaEntry((await params).id);
  if (!entry) notFound();
  const { item } = entry;

  const content = (
    <Screen>
      <Suspense>
        {item.kind === "actividad" ? <ActivityDetail activity={item} /> : <NeighborhoodEventDetail event={item} />}
      </Suspense>
    </Screen>
  );
  return isSupabaseConfigured ? <AgendaStateProvider value={entry.mine}>{content}</AgendaStateProvider> : content;
}
