"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Screen, ScreenHeader } from "@/components/app/screen";
import { parseDay, weekdayShort } from "@/lib/agenda/format";
import { zonesToday } from "@/lib/zones/data";
import type { MyActivity } from "@/lib/profile/data";
import { useMyActivity } from "@/lib/profile/activity";
import { cn } from "@/lib/utils";
import { ListGroup, PageHeading, SectionLabel, StatusPill } from "./ui";

const cap = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

/** Fecha 52 de ancho: día 12/16 SemiBold y número 20/26 Bold, radio 12. Gris si ya pasó. */
function DateTile({ day, past }: { day: string; past: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex w-[52px] shrink-0 flex-col items-center rounded-field py-1.5",
        past ? "bg-surface-muted text-text-muted" : "bg-option-blue text-brand",
      )}
    >
      <span className="text-overline font-semibold">{day === zonesToday() ? "Hoy" : cap(weekdayShort(day))}</span>
      <span className="text-[20px] leading-[26px] font-bold">{parseDay(day).getDate()}</span>
    </span>
  );
}

function ActivityRow({ a, past }: { a: MyActivity; past: boolean }) {
  const content = (
    <>
      <DateTile day={a.day} past={past} />
      <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <span className={cn("text-callout font-semibold", past ? "text-text-tertiary" : "text-text")}>{a.title}</span>
        <span className="text-label text-text-tertiary">{a.detail}</span>
        <StatusPill status={past ? "past" : a.status}>{a.statusLabel}</StatusPill>
      </span>
      <ChevronRight className="size-5 shrink-0 text-text-tertiary" strokeWidth={2} aria-hidden />
    </>
  );
  const base = "flex w-full items-center gap-3.5 py-3.5 pr-4 pl-3.5 text-left";
  return (
    <li>
      {a.href ? (
        <Link
          href={a.href}
          className={cn(
            base,
            "transition-colors hover:bg-surface-muted/70 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand",
          )}
        >
          {content}
        </Link>
      ) : (
        <div className={base}>{content}</div>
      )}
    </li>
  );
}

/** P2 · Mis reservas y actividades (484:5441) */
export function ActivityScreen() {
  const { upcoming, past } = useMyActivity();
  return (
    <Screen>
      <ScreenHeader backHref="/perfil" />
      <div className="flex flex-col items-start gap-4 px-5 pt-3 pb-8">
        <PageHeading
          title="Mis reservas y actividades"
          description="Lo que tienes apartado o en lo que te inscribiste."
        />

        <SectionLabel>Próximas</SectionLabel>
        {upcoming.length ? (
          <ListGroup label="Próximas">
            {upcoming.map((a) => (
              <ActivityRow key={a.id} a={a} past={false} />
            ))}
          </ListGroup>
        ) : (
          <p className="text-body text-text-tertiary">
            No tienes nada apartado.{" "}
            <Link href="/agenda" className="font-semibold text-brand">
              Mira la Agenda
            </Link>
          </p>
        )}

        {past.length > 0 && (
          <>
            <SectionLabel>Anteriores</SectionLabel>
            <ListGroup label="Anteriores">
              {past.map((a) => (
                <ActivityRow key={a.id} a={a} past />
              ))}
            </ListGroup>
          </>
        )}
      </div>
    </Screen>
  );
}
