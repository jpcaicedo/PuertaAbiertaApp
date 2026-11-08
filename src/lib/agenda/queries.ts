import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { agendaItems, type AgendaItem, type Category, type Person } from "./data";
import { formatTimeRange, formatWhen, spotsLeft } from "./format";
import { getZone, ofZone } from "@/lib/zones/data";
import type { AgendaState } from "./store";
import type { Activity } from "@/lib/mock-data";
import { nextActivity as demoNextActivity } from "@/lib/mock-data";
import { colombiaToday } from "./today";

/**
 * Lecturas de la agenda en Supabase. En modo demo devuelven los datos de ejemplo.
 * Lo que el usuario hizo (inscrito, en espera, voy) llega aparte en `mine`.
 */

type Row = {
  id: string;
  slug: string;
  tipo: "actividad" | "barrio";
  titulo: string;
  fecha: string;
  inicio: string;
  fin: string;
  lugar: string;
  categorias: string[];
  imagen: string | null;
  imagen_alt: string | null;
  descripcion: string;
  cupos: number | null;
  inscritos_base: number;
  organizador_nombre: string;
  organizador_torre: string | null;
  organizador_lider: boolean;
  extra: Record<string, unknown>;
};

type Attendee = {
  actividad_id: string;
  perfil_id: string;
  estado: "inscrito" | "espera" | "voy";
  created_at: string;
  nombre: string;
  avatar_url: string | null;
  torre: string;
};

export type AgendaData = { items: AgendaItem[]; mine: AgendaState };

const emptyMine = (): AgendaState => ({ enrolled: [], waitlist: {}, going: [] });

const COLUMNS =
  "id, slug, tipo, titulo, fecha, inicio, fin, lugar, categorias, imagen, imagen_alt, descripcion, cupos, inscritos_base, organizador_nombre, organizador_torre, organizador_lider, extra";

const hhmm = (t: string) => t.slice(0, 5);
const firstName = (name: string) => name.split(/\s+/)[0];

/** "Camila y Juan" · "Camila, Juan y Paula" */
function joinNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} y ${names.at(-1)}`;
}

/** "Camila, Juan y 14 vecinos más" (como en el diseño). */
function attendeesLabel(people: Person[], total: number) {
  if (total === 0) return "Aún no hay inscritos. Sé la primera persona.";
  const names = people.slice(0, 2).map((p) => firstName(p.name));
  const rest = total - names.length;
  if (rest <= 0) return joinNames(names);
  return `${names.join(", ")} y ${rest} ${rest === 1 ? "vecino más" : "vecinos más"}`;
}

function toItem(row: Row, attendees: Attendee[], me: string): AgendaItem {
  const others = attendees.filter((a) => a.actividad_id === row.id && a.perfil_id !== me);
  const toPerson = (a: Attendee): Person => ({ name: a.nombre, tower: a.torre, avatar: a.avatar_url ?? undefined });
  const extra = row.extra as Record<string, never>;
  const base = {
    id: row.slug,
    dbId: row.id,
    title: row.titulo,
    date: row.fecha,
    start: hhmm(row.inicio),
    end: hhmm(row.fin),
    place: row.lugar,
    categories: (row.categorias.length ? row.categorias : ["cultura"]) as Category[],
    image: row.imagen ?? undefined,
    imageAlt: row.imagen_alt ?? undefined,
  };

  if (row.tipo === "barrio") {
    const real = others.filter((a) => a.estado === "voy").map(toPerson);
    const sample = (extra.goingFromBuilding as Person[] | undefined) ?? [];
    const going = [...real, ...sample];
    const n = going.length;
    return {
      ...base,
      kind: "barrio",
      distanceLabel: (extra.distanceLabel as string) ?? "cerca",
      sharedBy: (extra.sharedBy as Person) ?? { name: row.organizador_nombre, tower: row.organizador_torre ?? undefined },
      sharedByQuote: (extra.sharedByQuote as string) ?? "",
      costLabel: (extra.costLabel as string) ?? "Gratis",
      audienceLabel: extra.audienceLabel as string | undefined,
      goingFromBuilding: going.slice(0, 3),
      goingSummary: n ? `${joinNames(going.slice(0, 3).map((p) => firstName(p.name)))} ${n === 1 ? "va" : "van"}` : "Aún nadie del conjunto",
      goingCountLabel: n ? `${n === 1 ? "Va" : "Van"} ${n} ${n === 1 ? "familia" : "familias"} de tu conjunto` : "Sé el primero del conjunto en ir",
      organizerNote: (extra.organizerNote as string) ?? "",
    };
  }

  const real = others.filter((a) => a.estado === "inscrito");
  const people = [...real.map(toPerson), ...((extra.attendees as Person[] | undefined) ?? [])];
  const enrolled = row.inscritos_base + real.length;
  return {
    ...base,
    kind: "actividad",
    organizer: {
      name: row.organizador_nombre,
      tower: row.organizador_torre ?? undefined,
      leader: row.organizador_lider || undefined,
    },
    capacity: row.cupos ?? 999,
    // Sin contar al usuario: la pantalla lo suma cuando está inscrito.
    enrolled,
    description: row.descripcion,
    attendees: people.slice(0, 3),
    attendeesLabel: attendeesLabel(people, enrolled),
  };
}

function toMine(rows: Row[], attendees: Attendee[], me: string): AgendaState {
  const mine = emptyMine();
  for (const row of rows) {
    const own = attendees.find((a) => a.actividad_id === row.id && a.perfil_id === me);
    if (!own) continue;
    if (own.estado === "inscrito") mine.enrolled.push(row.slug);
    if (own.estado === "voy") mine.going.push(row.slug);
    if (own.estado === "espera") {
      mine.waitlist[row.slug] = attendees.filter(
        (a) => a.actividad_id === row.id && a.estado === "espera" && a.created_at <= own.created_at,
      ).length;
    }
  }
  return mine;
}

async function load(filter: { slug?: string; from?: string }): Promise<AgendaData & { me: string | null }> {
  const supabase = await createClient();
  const user = await getSessionUser();
  if (!user) return { items: [], mine: emptyMine(), me: null };

  let query = supabase.from("actividades").select(COLUMNS).eq("estado", "publicada");
  if (filter.slug) query = query.eq("slug", filter.slug);
  if (filter.from) query = query.gte("fecha", filter.from);
  const { data: rows } = await query.order("fecha").order("inicio").returns<Row[]>();
  if (!rows?.length) return { items: [], mine: emptyMine(), me: user.id };

  const { data: attendees } = await supabase
    .from("asistentes")
    .select("actividad_id, perfil_id, estado, created_at, nombre, avatar_url, torre")
    .in(
      "actividad_id",
      rows.map((r) => r.id),
    )
    .order("created_at", { ascending: false })
    .returns<Attendee[]>();

  const list = attendees ?? [];
  return { items: rows.map((r) => toItem(r, list, user.id)), mine: toMine(rows, list, user.id), me: user.id };
}

/** A1 · Todo lo publicado en la agenda del conjunto. */
export const getAgenda = cache(async (): Promise<AgendaData | null> => {
  if (!isSupabaseConfigured) return null;
  const { items, mine } = await load({});
  return { items, mine };
});

/** A3/A9 · Una actividad por su slug. */
export const getAgendaEntry = cache(async (slug: string): Promise<{ item: AgendaItem; mine: AgendaState } | null> => {
  if (!isSupabaseConfigured) {
    const item = agendaItems.find((i) => i.id === slug);
    return item ? { item, mine: emptyMine() } : null;
  }
  const { items, mine } = await load({ slug });
  return items[0] ? { item: items[0], mine } : null;
});

/** I1 · "Próxima actividad": la siguiente actividad del conjunto que aún no empieza. */
export async function getNextActivity(): Promise<Activity | null> {
  if (!isSupabaseConfigured) return demoNextActivity;
  const today = colombiaToday();
  const nowTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Bogota",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());

  const { items, mine } = await load({ from: today });
  const next = items.find(
    (i) => i.kind === "actividad" && (i.date > today || i.start > nowTime),
  );
  if (!next || next.kind !== "actividad") return null;
  const enrolled = next.enrolled + (mine.enrolled.includes(next.id) ? 1 : 0);
  return {
    id: next.id,
    title: next.title,
    whenLabel: formatWhen(next, today),
    place: next.place,
    organizer: next.organizer.name,
    spotsLeft: spotsLeft({ ...next, enrolled }),
    capacity: next.capacity,
    image: next.image ?? "",
    imageAlt: next.imageAlt ?? "",
  };
}

export type MyAgendaEntry = {
  id: string;
  day: string;
  title: string;
  detail: string;
  status: "confirmed" | "pending" | "past";
  statusLabel: string;
  href: string;
};

type MyReservation = {
  id: string;
  zona: string;
  lugar: string;
  fecha: string;
  inicio: string;
  fin: string;
  tipo: "privada" | "comunidad" | "turno";
  estado: "pendiente" | "aprobada" | "propuesta" | "rechazada" | "cancelada";
  respuesta: string | null;
  actividad_id: string | null;
};

type MyProposal = {
  id: string;
  slug: string;
  titulo: string;
  fecha: string;
  inicio: string;
  fin: string;
  lugar: string;
  estado: "pendiente" | "publicada" | "propuesta" | "rechazada" | "cancelada";
  respuesta: string | null;
};

const answer = (label: string, message: string | null) => (message ? `${label}: ${message}` : label);

/** Reservas de zonas y actividades que organiza el usuario, con el estado de la administración. */
async function myRequests(me: string): Promise<MyAgendaEntry[]> {
  const supabase = await createClient();
  const [{ data: reservations }, { data: proposals }] = await Promise.all([
    supabase
      .from("reservas")
      .select("id, zona, lugar, fecha, inicio, fin, tipo, estado, respuesta, actividad_id")
      .eq("perfil_id", me)
      .neq("estado", "cancelada")
      .returns<MyReservation[]>(),
    supabase
      .from("actividades")
      .select("id, slug, titulo, fecha, inicio, fin, lugar, estado, respuesta")
      .eq("organizador_id", me)
      .neq("estado", "cancelada")
      .returns<MyProposal[]>(),
  ]);

  const fromReservations = (reservations ?? [])
    // Si era para la comunidad y se aprobó, ya aparece como actividad que organiza.
    .filter((r) => !r.actividad_id)
    .flatMap((r): MyAgendaEntry[] => {
      const zone = getZone(r.zona);
      if (!zone) return [];
      const isTurn = r.tipo === "turno";
      const range = formatTimeRange(hhmm(r.inicio), hhmm(r.fin));
      return [
        {
          id: `reserva-${r.id}`,
          day: r.fecha,
          title: isTurn ? `Turno en ${zone.withArticle}` : `Reserva ${ofZone(zone)}`,
          detail: `De ${range}`,
          status: r.estado === "rechazada" ? "past" : r.estado === "aprobada" ? "confirmed" : "pending",
          statusLabel:
            r.estado === "aprobada"
              ? isTurn
                ? "Turno confirmado"
                : "Reserva confirmada"
              : r.estado === "propuesta"
                ? answer("La administración propone", r.respuesta)
                : r.estado === "rechazada"
                  ? answer("No aprobada", r.respuesta)
                  : "En revisión de la administración",
          href: `/zonas-comunes/${zone.id}`,
        },
      ];
    });

  const fromProposals = (proposals ?? []).map(
    (a): MyAgendaEntry => ({
      id: `organiza-${a.id}`,
      day: a.fecha,
      title: a.titulo,
      detail: `Organizas tú. ${a.lugar}, de ${formatTimeRange(hhmm(a.inicio), hhmm(a.fin))}`,
      status: a.estado === "publicada" ? "confirmed" : a.estado === "rechazada" ? "past" : "pending",
      statusLabel:
        a.estado === "publicada"
          ? "Publicada en la Agenda"
          : a.estado === "propuesta"
            ? answer("La administración propone", a.respuesta)
            : a.estado === "rechazada"
              ? answer("No aprobada", a.respuesta)
              : "En revisión de la administración",
      href: a.estado === "publicada" ? `/agenda/${a.slug}` : `/agenda?dia=${a.fecha}`,
    }),
  );

  return [...fromReservations, ...fromProposals];
}

/** P2 · Mis reservas y actividades: inscripciones, reservas y planes que organiza. */
export async function getMyAgenda(): Promise<MyAgendaEntry[] | null> {
  if (!isSupabaseConfigured) return null;
  const { items, mine, me } = await load({});
  const today = colombiaToday();
  const requests = me ? await myRequests(me) : [];
  const organized = new Set(requests.map((r) => r.href));
  const enrolledEntries = items.flatMap((i) => {
    const enrolled = mine.enrolled.includes(i.id) || mine.going.includes(i.id);
    const waiting = mine.waitlist[i.id];
    if (!enrolled && !waiting) return [];
    const past = i.date < today;
    return [
      {
        id: `agenda-${i.id}`,
        day: i.date,
        title: i.title,
        detail: `${i.place}, ${formatWhen(i, today).split(" · ")[1]}`,
        status: past ? "past" : waiting ? "pending" : "confirmed",
        statusLabel: past
          ? "Asististe"
          : waiting
            ? `En lista de espera · puesto ${waiting}`
            : i.kind === "barrio"
              ? "Vas a ir"
              : "Inscripción confirmada",
        href: `/agenda/${i.id}`,
      } satisfies MyAgendaEntry,
    ];
  });
  // Si se inscribió en su propia actividad, se muestra una sola vez.
  return [...requests, ...enrolledEntries.filter((e) => !organized.has(e.href))];
}
