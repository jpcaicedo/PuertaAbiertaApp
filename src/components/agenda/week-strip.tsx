"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { parseDay, toDay, weekdayLong, weekdayShort, weekOf } from "@/lib/agenda/format";
import { cn } from "@/lib/utils";

/** Semanas que se pueden recorrer deslizando: desde la de hoy hasta 7 semanas después. */
const WEEKS_AHEAD = 7;

function addDays(day: string, n: number) {
  const d = parseDay(day);
  d.setDate(d.getDate() + n);
  return toDay(d);
}

function monthLabel(day: string) {
  const s = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric" }).format(parseDay(day)).replace(" de ", " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Calendario de la Agenda: una semana por página. Se desliza con el dedo (solo el calendario,
 * no la pantalla) para ver las semanas siguientes; las flechas hacen lo mismo con el mouse o el teclado.
 */
export function WeekStrip({
  day,
  today,
  hasItems,
  href,
}: {
  day: string;
  today: string;
  hasItems: (day: string) => boolean;
  href: (day: string) => string;
}) {
  // Desde la semana de hoy (o la del día elegido, si es anterior) hasta 7 semanas después.
  const weeks = React.useMemo(() => {
    const start = weekOf(day < today ? day : today)[0];
    const last = weekOf(addDays(day > today ? day : today, WEEKS_AHEAD * 7))[0];
    const list: string[][] = [];
    for (let monday = start; monday <= last; monday = addDays(monday, 7)) list.push(weekOf(monday));
    return list;
  }, [day, today]);

  const selectedWeek = Math.max(0, weeks.findIndex((w) => w.includes(day)));
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(selectedWeek);

  // Al abrir (o al elegir un día de otra semana), mostrar la semana del día elegido sin animación.
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ left: selectedWeek * el.clientWidth, behavior: "instant" });
    setVisible(selectedWeek);
  }, [selectedWeek]);

  function onScroll() {
    const el = ref.current;
    if (!el || !el.clientWidth) return;
    setVisible(Math.round(el.scrollLeft / el.clientWidth));
  }

  function go(delta: number) {
    const el = ref.current;
    if (!el) return;
    const next = Math.min(weeks.length - 1, Math.max(0, visible + delta));
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  }

  const shown = weeks[visible] ?? weeks[selectedWeek];

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex w-full items-center justify-between">
        <p aria-live="polite" className="text-callout font-semibold text-text">
          {monthLabel(shown[3])}
        </p>
        <div className="-mr-2 flex items-center">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={visible === 0}
            aria-label="Semana anterior"
            className="grid size-9 cursor-pointer place-items-center rounded-full text-text transition-colors hover:bg-brand-soft/60 disabled:cursor-default disabled:text-text-tertiary/40 disabled:hover:bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <ChevronLeft className="size-5" strokeWidth={2} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={visible === weeks.length - 1}
            aria-label="Semana siguiente"
            className="grid size-9 cursor-pointer place-items-center rounded-full text-text transition-colors hover:bg-brand-soft/60 disabled:cursor-default disabled:text-text-tertiary/40 disabled:hover:bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <ChevronRight className="size-5" strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>

      <div
        ref={ref}
        onScroll={onScroll}
        className="flex w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {weeks.map((week, wi) => (
          <nav
            key={week[0]}
            aria-label={`Semana del ${parseDay(week[0]).getDate()} de ${monthLabel(week[0]).split(" ")[0].toLowerCase()}`}
            aria-hidden={wi !== visible ? true : undefined}
            inert={wi !== visible ? true : undefined}
            className="flex w-full shrink-0 snap-start snap-always justify-between"
          >
            {week.map((d) => {
              const selected = d === day;
              const withItems = hasItems(d);
              const isToday = d === today;
              return (
                <Link
                  key={d}
                  href={href(d)}
                  scroll={false}
                  aria-current={selected ? "date" : undefined}
                  aria-label={`${isToday ? "Hoy, " : ""}${weekdayLong(d)} ${parseDay(d).getDate()}${withItems ? ", con actividades" : ""}`}
                  className={cn(
                    "flex h-[66px] w-[46px] flex-col items-center gap-0.5 rounded-chip py-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand",
                    selected ? "bg-brand text-white" : "bg-surface text-text hover:bg-brand-soft/50",
                    !selected && isToday && "ring-1 ring-inset ring-brand/50",
                    !selected && d < today && "opacity-60",
                  )}
                >
                  <span className={cn("text-overline font-medium", !selected && "text-text-tertiary")}>{weekdayShort(d)}</span>
                  <span className="text-heading font-semibold">{parseDay(d).getDate()}</span>
                  <span aria-hidden className={cn("size-[5px] rounded-full", withItems ? (selected ? "bg-white" : "bg-brand") : "bg-transparent")} />
                </Link>
              );
            })}
          </nav>
        ))}
      </div>
    </div>
  );
}
