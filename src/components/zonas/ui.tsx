import * as React from "react";
import Link from "next/link";
import { Check, ChevronRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTimeRange, parseDay, weekdayLong, weekdayShort } from "@/lib/agenda/format";
import type { BookingMode, Zone } from "@/lib/zones/data";

/* ───────────────────────── Etiqueta de modo de reserva ───────────────────────── */

const tagTone: Record<BookingMode, string> = {
  approval: "bg-warning-soft text-warning",
  slots: "bg-brand-soft text-brand",
  free: "bg-segment text-text-secondary",
};

export const tagLabel: Record<BookingMode, string> = {
  approval: "Requiere aprobación",
  slots: "Turno inmediato",
  free: "Sin reserva",
};

/** Píldora 12/16 Medium, padding 3/9, radio 12 (Z1, Z2, Z7, Z8). */
export function ZoneTag({
  mode,
  children,
  className,
}: {
  mode: BookingMode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-[12px] px-[9px] py-[3px] text-overline font-medium",
        tagTone[mode],
        className,
      )}
    >
      {children ?? tagLabel[mode]}
    </span>
  );
}

/* ───────────────────────── Tarjeta de zona (Z1) ───────────────────────── */

/** Blanca, radio 18, padding 12, gap 12: icono 22 en caja azul 14, nombre, horario, etiqueta y chevron. */
export function ZoneCard({ zone }: { zone: Zone }) {
  const Icon = zone.icon;
  return (
    <li>
      <Link
        href={`/zonas-comunes/${zone.id}`}
        className="flex w-full items-center gap-3 rounded-[18px] bg-surface p-3 transition-colors hover:bg-brand-soft/30 outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <span aria-hidden className="inline-flex shrink-0 rounded-chip bg-brand-soft p-[11px] text-brand">
          <Icon className="size-[22px]" strokeWidth={2} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col items-start">
          <span className="text-body font-semibold text-text">{zone.name}</span>
          <span className="mt-0.5 text-caption text-text-secondary">{zone.summary}</span>
          <ZoneTag mode={zone.booking} className="mt-1.5" />
        </span>
        <ChevronRight className="size-5 shrink-0 text-text-secondary" strokeWidth={2} aria-hidden />
      </Link>
    </li>
  );
}

/* ───────────────────────── Normas de uso (Z2, Z8) ───────────────────────── */

export function RulesCard({ rules }: { rules: string[] }) {
  return (
    <section aria-labelledby="normas" className="flex w-full flex-col gap-2.5 rounded-[18px] bg-surface p-4">
      <h2 id="normas" className="text-body font-semibold text-text">
        Normas de uso
      </h2>
      <ul className="flex flex-col gap-2.5">
        {rules.map((r) => (
          <li key={r} className="flex items-start gap-2 text-caption text-text-secondary">
            <Check className="size-4 shrink-0 text-success" strokeWidth={2} aria-hidden />
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ───────────────────────── Franja / turno seleccionable (Z3, Z7) ───────────────────────── */

export type SlotState = "available" | "taken" | "mine";

/**
 * Opción de franja: 52 de alto, borde #e2e0e1, radio 14.
 * Elegida → fondo azul suave, borde 2 azul, 54 de alto y check relleno.
 * Ocupada → gris con candado «Reservado».
 */
export function SlotOption({
  start,
  end,
  state,
  selected,
  onSelect,
  mineLabel = "Tu reserva",
}: {
  mineLabel?: string;
  start: string;
  end: string;
  state: SlotState;
  selected: boolean;
  onSelect: () => void;
}) {
  const label = formatTimeRange(start, end);
  const disabled = state !== "available";
  return (
    <li>
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        disabled={disabled}
        onClick={onSelect}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-[14px] px-4 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
          selected
            ? "h-[54px] border-2 border-brand bg-brand-soft"
            : state === "available"
              ? "h-[52px] cursor-pointer border border-step-pending bg-surface hover:border-brand/40"
              : "h-[52px] border border-step-pending bg-note",
        )}
      >
        <span
          className={cn(
            "text-body",
            selected ? "font-semibold text-brand" : state === "available" ? "text-text" : "text-text-tertiary",
          )}
        >
          {label}
        </span>
        {selected ? (
          <span aria-hidden className="grid size-5 place-items-center rounded-full bg-brand text-white">
            <Check className="size-3" strokeWidth={3} />
          </span>
        ) : state === "available" ? (
          <span className="text-caption font-medium text-success">Disponible</span>
        ) : (
          <span className="flex items-center gap-1 text-caption text-text-secondary">
            <Lock className="size-3.5" strokeWidth={2} aria-hidden />
            {state === "mine" ? mineLabel : "Reservado"}
          </span>
        )}
      </button>
    </li>
  );
}

export function SlotList({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <ul role="radiogroup" aria-label={label} className="flex w-full flex-col gap-3.5">
      {children}
    </ul>
  );
}

/* ───────────────────────── Tira de días (Z3) ───────────────────────── */

/** 7 días de 60 de alto (12/16 + 20/28), radio 14 y 5 de separación. */
export function DayStrip({
  days,
  value,
  onChange,
}: {
  days: string[];
  value: string;
  onChange: (day: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Fecha" className="flex w-full gap-[5px]">
      {days.map((d) => {
        const selected = d === value;
        return (
          <button
            key={d}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${weekdayLong(d)} ${parseDay(d).getDate()}`}
            onClick={() => onChange(d)}
            className={cn(
              "flex h-[60px] min-w-0 flex-1 cursor-pointer flex-col items-center justify-center rounded-chip transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
              selected ? "bg-brand text-white" : "bg-surface text-text hover:bg-brand-soft/50",
            )}
          >
            <span className={cn("text-overline font-medium", !selected && "text-text-tertiary")}>
              {weekdayShort(d)}
            </span>
            <span className="text-subtitle font-semibold">{parseDay(d).getDate()}</span>
          </button>
        );
      })}
    </div>
  );
}
