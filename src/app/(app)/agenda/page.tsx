import { AgendaScreen } from "@/components/agenda/agenda-screen";
import { AGENDA_TODAY, categories, timesOfDay, type Category, type TimeOfDay } from "@/lib/agenda/data";

export const metadata = { title: "Agenda · Puerta Abierta" };

type Props = { searchParams: Promise<{ dia?: string; cat?: string; horario?: string; cupos?: string }> };

const isDay = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
const list = <T extends string>(raw: string | undefined, allowed: readonly T[]) =>
  (raw?.split(",") ?? []).filter((x): x is T => (allowed as readonly string[]).includes(x));

/** A1 · Agenda. Día y filtros viven en la URL para poder compartir o volver atrás. */
export default async function AgendaPage({ searchParams }: Props) {
  const sp = await searchParams;
  const day = isDay(sp.dia) ? sp.dia! : AGENDA_TODAY;
  const filters = {
    categories: list<Category>(sp.cat, categories.map((c) => c.id)),
    times: list<TimeOfDay>(sp.horario, timesOfDay.map((t) => t.id)),
    onlyWithSpots: sp.cupos === "1",
  };
  return <AgendaScreen day={day} filters={filters} />;
}
