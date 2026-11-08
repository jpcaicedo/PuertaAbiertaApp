import { AgendaScreen } from "@/components/agenda/agenda-screen";
import { agendaItems, categories, timesOfDay, type Category, type TimeOfDay } from "@/lib/agenda/data";
import { getAgenda } from "@/lib/agenda/queries";
import { AgendaStateProvider } from "@/lib/agenda/store";
import { agendaToday } from "@/lib/agenda/today";

export const metadata = { title: "Agenda · Puerta Abierta" };

type Props = { searchParams: Promise<{ dia?: string; cat?: string; horario?: string; cupos?: string }> };

const isDay = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
const list = <T extends string>(raw: string | undefined, allowed: readonly T[]) =>
  (raw?.split(",") ?? []).filter((x): x is T => (allowed as readonly string[]).includes(x));

/** A1 · Agenda. Día y filtros viven en la URL para poder compartir o volver atrás. */
export default async function AgendaPage({ searchParams }: Props) {
  const sp = await searchParams;
  const day = isDay(sp.dia) ? sp.dia! : agendaToday();
  const filters = {
    categories: list<Category>(sp.cat, categories.map((c) => c.id)),
    times: list<TimeOfDay>(sp.horario, timesOfDay.map((t) => t.id)),
    onlyWithSpots: sp.cupos === "1",
  };

  const data = await getAgenda();
  // Modo demo: datos de ejemplo y estado en el navegador.
  if (!data) return <AgendaScreen day={day} filters={filters} items={agendaItems} />;
  return (
    <AgendaStateProvider value={data.mine}>
      <AgendaScreen day={day} filters={filters} items={data.items} />
    </AgendaStateProvider>
  );
}
