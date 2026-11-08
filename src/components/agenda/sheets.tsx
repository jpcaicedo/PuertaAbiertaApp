"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, Calendar, CalendarCheck, ChevronRight, Clock, MapPin, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetTitle,
} from "@/components/ui/bottom-sheet";
import { Switch } from "@/components/ui/switch";
import { categories, timesOfDay, type Category, type CommunityActivity, type TimeOfDay } from "@/lib/agenda/data";
import { agendaActions } from "@/lib/agenda/store";
import { cn } from "@/lib/utils";
import { StatusCircle } from "./primitives";

/** Agarradera 40×5. `soft` = #D5DAE3 (A13) · por defecto #C6C6CD (A2, A4, A5). */
function Handle({ soft = false, centered = false }: { soft?: boolean; centered?: boolean }) {
  return (
    <div aria-hidden className={cn("flex w-full", centered && "justify-center")}>
      <div className={cn("h-[5px] w-10 rounded-[3px]", soft ? "bg-handle" : "bg-border")} />
    </div>
  );
}

/* ───────────────────────── Hoja de resultado (A4, A5, A5b, A10) ───────────────────────── */

type ResultSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: LucideIcon;
  tone: "success" | "warning";
  title: string;
  /** Resumen en negrita 15/22 (A4). */
  summary?: string;
  description: string;
  /** Sin agarradera y con padding superior 24 (A10). */
  noHandle?: boolean;
  children: React.ReactNode;
};

/** Hoja de confirmación: padding 12/20/36, gap 12, círculo de estado, título 22/28 Bold. */
export function ResultSheet({ open, onOpenChange, icon, tone, title, summary, description, noHandle, children }: ResultSheetProps) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetContent className={cn("gap-3 pb-[max(36px,env(safe-area-inset-bottom))]", noHandle ? "pt-6" : "pt-3")}>
        {!noHandle && <Handle />}
        <StatusCircle icon={icon} tone={tone} />
        <BottomSheetTitle className="text-title font-bold">{title}</BottomSheetTitle>
        {summary && <p className="w-full text-body font-semibold text-text">{summary}</p>}
        <BottomSheetDescription>{description}</BottomSheetDescription>
        {children}
      </BottomSheetContent>
    </BottomSheet>
  );
}

/* ───────────────────────── Lista de espera (A5 → A5b) ───────────────────────── */

export function WaitlistSheets({ activity, onClose }: { activity: CommunityActivity | null; onClose: () => void }) {
  const [position, setPosition] = React.useState<number | null>(null);
  const [joining, startJoin] = React.useTransition();
  const open = activity !== null;

  function close() {
    onClose();
    // Espera a que termine la animación antes de volver al paso inicial.
    setTimeout(() => setPosition(null), 250);
  }

  if (!activity) return null;
  return position === null ? (
    <ResultSheet
      open={open}
      onOpenChange={(o) => !o && close()}
      icon={Clock}
      tone="warning"
      title="Cupos llenos"
      description={`La ${activity.title} ya tiene ${activity.enrolled} de ${activity.capacity} inscritos. Si alguien cancela, te avisamos y tienes 2 horas para confirmar tu cupo.`}
    >
      <Button
        disabled={joining}
        onClick={() =>
          startJoin(async () => {
            const p = await agendaActions.joinWaitlist(activity);
            // 0 = se liberó un cupo y quedó inscrita directamente.
            if (p === 0) close();
            else setPosition(p);
          })
        }
      >
        {joining ? "Uniéndote…" : "Unirme a la lista de espera"}
      </Button>
      <BottomSheetClose asChild>
        <Button variant="link">Ahora no</Button>
      </BottomSheetClose>
    </ResultSheet>
  ) : (
    <ResultSheet
      open={open}
      onOpenChange={(o) => !o && close()}
      icon={Bell}
      tone="success"
      title="Estás en la lista de espera"
      description={`Eres la número ${position}. Te avisamos apenas se libere un cupo en la ${activity.title}.`}
    >
      <BottomSheetClose asChild>
        <Button>Volver a la agenda</Button>
      </BottomSheetClose>
    </ResultSheet>
  );
}

/* ───────────────────────── Filtros (A2) ───────────────────────── */

export type AgendaFilters = { categories: Category[]; times: TimeOfDay[]; onlyWithSpots: boolean };

type FilterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: AgendaFilters;
  /** Cuenta cuántas actividades quedan con los filtros dados (para "Ver N actividades"). */
  count: (f: AgendaFilters) => number;
  onApply: (f: AgendaFilters) => void;
};

/** Chip de selección múltiple: seleccionado = fondo #DAE2FD, borde y texto azul. */
function ToggleChip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-[20px] border px-3.5 py-2 text-caption font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand",
        selected ? "border-brand bg-brand-soft text-brand" : "border-border bg-surface text-text hover:border-brand/60",
      )}
    >
      {children}
    </button>
  );
}

export function FilterSheet({ open, onOpenChange, value, count, onApply }: FilterSheetProps) {
  const [draft, setDraft] = React.useState(value);
  React.useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  const n = count(draft);

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetContent className="gap-3 pt-3 pb-[max(36px,env(safe-area-inset-bottom))]">
        <Handle />
        <BottomSheetTitle className="text-title font-bold">Filtrar actividades</BottomSheetTitle>
        <BottomSheetDescription className="sr-only">Elige categorías, horario y disponibilidad.</BottomSheetDescription>

        <p className="text-caption font-semibold text-text-secondary">Categoría</p>
        <div className="flex w-full flex-wrap gap-2">
          {categories.map((c) => (
            <ToggleChip
              key={c.id}
              selected={draft.categories.includes(c.id)}
              onClick={() => setDraft((d) => ({ ...d, categories: toggle(d.categories, c.id) }))}
            >
              {c.label}
            </ToggleChip>
          ))}
        </div>

        <p className="text-caption font-semibold text-text-secondary">Horario</p>
        <div className="flex gap-2">
          {timesOfDay.map((t) => (
            <ToggleChip
              key={t.id}
              selected={draft.times.includes(t.id)}
              onClick={() => setDraft((d) => ({ ...d, times: toggle(d.times, t.id) }))}
            >
              {t.label}
            </ToggleChip>
          ))}
        </div>

        <div className="flex w-full items-center justify-between py-1.5">
          <label htmlFor="solo-cupos" className="cursor-pointer text-body text-text">
            Solo actividades con cupos
          </label>
          <Switch id="solo-cupos" checked={draft.onlyWithSpots} onCheckedChange={(v) => setDraft((d) => ({ ...d, onlyWithSpots: v }))} />
        </div>

        <Button
          onClick={() => {
            onApply(draft);
            onOpenChange(false);
          }}
        >
          {n === 0 ? "No hay actividades" : `Ver ${n} ${n === 1 ? "actividad" : "actividades"}`}
        </Button>
        <Button variant="link" onClick={() => setDraft({ categories: [], times: [], onlyWithSpots: false })}>
          Limpiar filtros
        </Button>
      </BottomSheetContent>
    </BottomSheet>
  );
}

/* ───────────────────────── Proponer un plan (A13) ───────────────────────── */

type OptionProps = {
  href: string;
  icon: LucideIcon;
  tone: "blue" | "orange";
  title: string;
  description: string;
  ruleIcon: LucideIcon;
  rule: string;
};

/** Opción: borde #E3E7EE, radio 18, padding 16/16/14; tile 44 (padding 11 + icono 22). */
function PlanOption({ href, icon: Icon, tone, title, description, ruleIcon: RuleIcon, rule }: OptionProps) {
  return (
    <Link
      href={href}
      className="flex w-full flex-col gap-3 rounded-[18px] border border-option-border bg-surface px-4 pt-4 pb-3.5 transition-[border-color,box-shadow] hover:border-brand/40 hover:shadow-card outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <span className="flex w-full items-start gap-3.5">
        <span
          aria-hidden
          className={cn(
            "inline-flex shrink-0 rounded-field p-[11px]",
            tone === "blue" ? "bg-option-blue text-brand" : "bg-option-orange text-illustration-ink",
          )}
        >
          <Icon className="size-[22px]" strokeWidth={2} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-heading font-bold text-text">{title}</span>
          <span className="text-body text-text-tertiary">{description}</span>
        </span>
        <ChevronRight className="mt-3 size-5 shrink-0 text-text-tertiary" strokeWidth={2} aria-hidden />
      </span>
      <span aria-hidden className="h-px w-full bg-option-border" />
      <span className="flex w-full items-center gap-2 text-caption font-medium text-text-tertiary">
        <RuleIcon className="size-4 shrink-0" strokeWidth={2} aria-hidden />
        {rule}
      </span>
    </Link>
  );
}

export function ProposeSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetContent className="max-h-[calc(100dvh-24px)] gap-4 overflow-y-auto pt-3 pb-[max(28px,env(safe-area-inset-bottom))]">
        <Handle soft centered />
        <div className="flex w-full flex-col gap-1.5 px-1 pt-1">
          <BottomSheetTitle className="text-headline font-bold">¿Qué plan quieres proponer?</BottomSheetTitle>
          <BottomSheetDescription className="text-text-tertiary">Lo verán tus vecinos en la Agenda.</BottomSheetDescription>
        </div>

        <div className="flex w-full flex-col gap-3">
          <PlanOption
            href="/agenda/crear"
            icon={Calendar}
            tone="blue"
            title="Tú lo organizas"
            description="Una caminata, un torneo o una tarde de juegos."
            ruleIcon={ShieldCheck}
            rule="Salón o BBQ: lo aprueba la administración."
          />
          <PlanOption
            href="/agenda/compartir"
            icon={MapPin}
            tone="orange"
            title="Otra persona lo organiza"
            description="Una feria, un concierto o un taller del barrio."
            ruleIcon={Users}
            rule="Tus vecinos marcan «Voy» y ven quién va."
          />
        </div>

        <Link
          href="/zonas-comunes"
          className="flex w-full items-center gap-3 rounded-card bg-surface-muted py-3.5 pr-4 pl-3.5 transition-colors hover:bg-brand-soft/50 outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <span aria-hidden className="inline-flex shrink-0 rounded-[10px] bg-surface p-2 text-brand">
            <CalendarCheck className="size-5" strokeWidth={2} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-label text-text-tertiary">¿Solo quieres apartar un espacio?</span>
            <span className="text-body font-semibold text-brand">Resérvalo en Zonas comunes</span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-brand" strokeWidth={2} aria-hidden />
        </Link>

        <BottomSheetClose asChild>
          <Button variant="link">Cancelar</Button>
        </BottomSheetClose>
      </BottomSheetContent>
    </BottomSheet>
  );
}
