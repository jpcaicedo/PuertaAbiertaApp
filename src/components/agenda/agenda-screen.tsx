"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, CalendarCheck, Plus, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HomeHeader } from "@/components/app/home-header";
import { Screen } from "@/components/app/screen";
import { type AgendaItem, type Category, type TimeOfDay } from "@/lib/agenda/data";
import { spotsLeft, timeOfDay, weekdayLong } from "@/lib/agenda/format";
import { activityStatus } from "@/lib/agenda/today";
import { setZonesOrigin } from "@/lib/zones/origin";
import { cn } from "@/lib/utils";
import { ActivityListCard, NeighborhoodEventCard } from "./cards";
import { FilterSheet, ProposeSheet, type AgendaFilters } from "./sheets";
import { WeekStrip } from "./week-strip";

type Props = { day: string; today: string; filters: AgendaFilters; items: AgendaItem[] };

/** Atajos de categoría visibles en la pantalla (el resto está en Filtrar). */
const quickCategories: { id: Category; label: string }[] = [
  { id: "deporte", label: "Deporte" },
  { id: "mascotas", label: "Mascotas" },
];

function applyFilters(items: AgendaItem[], f: AgendaFilters) {
  return items.filter((i) => {
    if (f.categories.length && !i.categories.some((c) => f.categories.includes(c))) return false;
    if (f.times.length && !f.times.includes(timeOfDay(i.start))) return false;
    if (f.onlyWithSpots && i.kind === "actividad" && (spotsLeft(i) === 0 || activityStatus(i) !== "upcoming")) return false;
    return true;
  });
}

function toQuery(day: string, f: AgendaFilters) {
  const q = new URLSearchParams({ dia: day });
  if (f.categories.length) q.set("cat", f.categories.join(","));
  if (f.times.length) q.set("horario", f.times.join(","));
  if (f.onlyWithSpots) q.set("cupos", "1");
  return `?${q.toString()}`;
}

/** A1 · Agenda (484:2381) · A2b · Día sin actividades (484:2533) · y las hojas A2, A5, A5b y A13. */
export function AgendaScreen({ day, today, filters, items }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [proposeOpen, setProposeOpen] = React.useState(false);

  // Las que ya terminaron van al final del día; el resto, por hora de inicio.
  const ended = (i: AgendaItem) => (activityStatus(i) === "ended" ? 1 : 0);
  const dayItems = items
    .filter((i) => i.date === day)
    .sort((a, b) => ended(a) - ended(b) || a.start.localeCompare(b.start));
  const visible = applyFilters(dayItems, filters);
  const hasAdvancedFilters = filters.times.length > 0 || filters.onlyWithSpots || filters.categories.length > 1;
  const href = (d: string, f: AgendaFilters = filters) => `${pathname}${toQuery(d, f)}`;
  const quick = (c?: Category) => href(day, { ...filters, categories: c ? [c] : [] });
  const isQuickActive = (c?: Category) =>
    c ? filters.categories.length === 1 && filters.categories[0] === c : filters.categories.length === 0;

  return (
    <Screen className="pb-tabbar">
      <div className="pt-[max(40px,env(safe-area-inset-top))]">
        <HomeHeader />
      </div>

      <div className="flex flex-col items-start gap-4 px-5 pt-3">
        {/* Título + acciones: Proponer un plan · Reservar un espacio */}
        <div className="flex w-full flex-col gap-3">
          <h1 className="text-title font-bold text-text">Agenda</h1>
          <div className="grid w-full grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setProposeOpen(true)}
              className="inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-[20px] bg-brand px-3 text-caption max-[359px]:px-2 max-[359px]:[&>svg]:hidden font-semibold whitespace-nowrap text-white transition-colors hover:bg-brand-hover active:scale-[0.97] outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              <Plus className="size-4 shrink-0" strokeWidth={2.25} aria-hidden />
              Proponer un plan
            </button>
            <Link
              href="/zonas-comunes"
              onClick={() => setZonesOrigin("agenda")}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[20px] border border-brand bg-surface px-3 text-caption max-[359px]:px-2 max-[359px]:[&>svg]:hidden font-semibold whitespace-nowrap text-brand transition-colors hover:bg-brand-soft/50 active:scale-[0.97] outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              <CalendarCheck className="size-4 shrink-0" strokeWidth={2.25} aria-hidden />
              Reservar un espacio
            </Link>
          </div>
        </div>

        {/* Semana: se desliza para ver los días siguientes */}
        <WeekStrip day={day} today={today} hasItems={(d) => items.some((i) => i.date === d)} href={(d) => href(d)} />

        {/* Categorías rápidas + filtro */}
        <div className="flex items-center gap-2">
          <QuickChip href={quick()} active={isQuickActive()}>
            Todas
          </QuickChip>
          {quickCategories.map((c) => (
            <QuickChip key={c.id} href={quick(c.id)} active={isQuickActive(c.id)}>
              {c.label}
            </QuickChip>
          ))}
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            aria-label={hasAdvancedFilters ? "Filtrar actividades (filtros activos)" : "Filtrar actividades"}
            className="relative cursor-pointer rounded-[20px] border border-border bg-surface p-[7px] text-ink transition-colors hover:border-brand/60 outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <SlidersHorizontal className="size-[18px]" strokeWidth={2} aria-hidden />
            {hasAdvancedFilters && <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-brand ring-2 ring-bg" />}
          </button>
        </div>

        {/* Lista o vacío */}
        {visible.length > 0 ? (
          <ul className="flex w-full flex-col gap-4">
            {visible.map((item) => (
              <li key={item.id}>
                {item.kind === "actividad" ? (
                  <ActivityListCard activity={item} />
                ) : (
                  <NeighborhoodEventCard event={item} />
                )}
              </li>
            ))}
          </ul>
        ) : dayItems.length > 0 ? (
          <EmptyState
            title="Ningún plan coincide con tus filtros"
            description="Prueba con otra categoría u horario, o quita los filtros para ver todo lo del día."
            action={
              <Button asChild className="rounded-[80px]">
                <Link href={href(day, { categories: [], times: [], onlyWithSpots: false })}>Limpiar filtros</Link>
              </Button>
            }
          />
        ) : (
          <EmptyState
            title={`No hay actividades el ${weekdayLong(day)}`}
            description="¿Te animas a organizar algo? Una caminata, una tarde de juegos o una clase. Tus vecinos te lo van a agradecer."
            action={
              <Button asChild className="rounded-[80px]">
                <Link href="/agenda/crear">Crear una actividad</Link>
              </Button>
            }
          />
        )}
      </div>

      <FilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        value={filters}
        count={(f) => applyFilters(dayItems, f).length}
        onApply={(f) => router.replace(href(day, f), { scroll: false })}
      />
      <ProposeSheet open={proposeOpen} onOpenChange={setProposeOpen} />
    </Screen>
  );
}

/** Chip de categoría: radio 20, padding 7/14, 13/18 SemiBold. Activo = negro. */
function QuickChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={cn(
        "rounded-[20px] border px-3.5 py-[7px] text-caption font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand",
        active ? "border-ink bg-ink text-text-on-dark" : "border-border bg-surface text-text hover:border-brand/60",
      )}
    >
      {children}
    </Link>
  );
}

/** Vacío (A2b): padding 40/20/20, gap 10, tile 68 (#DAE2FD, radio 40, icono 32), textos centrados de 310. */
function EmptyState({ title, description, action }: { title: string; description: string; action: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col items-center gap-2.5 px-5 pt-10 pb-5 text-center">
      <span aria-hidden className="inline-flex rounded-[40px] bg-brand-soft p-[18px] text-brand">
        <Calendar className="size-8" strokeWidth={2} />
      </span>
      <p className="max-w-[310px] text-heading font-semibold text-text">{title}</p>
      <p className="max-w-[310px] text-body text-text-secondary">{description}</p>
      <div className="w-full">{action}</div>
    </div>
  );
}

export type { TimeOfDay };
