import * as React from "react";
import Link from "next/link";
import { Check, ChevronRight, ClipboardList, Lightbulb, MessageSquareWarning, Wrench, type LucideIcon } from "lucide-react";
import { Tag, type TagTone } from "@/components/admin/ui";
import { kindLabel, pqrsDate, statusLabel, statusSteps, type Pqrs, type PqrsKind, type PqrsStatus } from "@/lib/pqrs/data";
import { cn } from "@/lib/utils";

const statusTone: Record<PqrsStatus, TagTone> = { recibido: "brand", en_proceso: "pending", resuelto: "success" };

export function StatusTag({ status }: { status: PqrsStatus }) {
  return <Tag tone={statusTone[status]}>{statusLabel[status]}</Tag>;
}

const kindIcon: Record<PqrsKind, LucideIcon> = {
  dano: Wrench,
  peticion: ClipboardList,
  queja: MessageSquareWarning,
  reclamo: MessageSquareWarning,
  sugerencia: Lightbulb,
};

export function KindIcon({ kind, className }: { kind: PqrsKind; className?: string }) {
  const Icon = kindIcon[kind];
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 rounded-field p-[9px]",
        kind === "dano" ? "bg-option-orange text-status-pending" : "bg-option-blue text-brand",
        className,
      )}
    >
      <Icon className="size-5" strokeWidth={2} />
    </span>
  );
}

/** Fila de la lista: icono por tipo, título, radicado · fecha y estado. */
export function PqrsRow({ item, href, showBy = false }: { item: Pqrs; href: string; showBy?: boolean }) {
  return (
    <li>
      <Link
        href={href}
        className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-surface-muted/70 outline-none focus-visible:bg-surface-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
      >
        <KindIcon kind={item.kind} />
        <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
          <span className="w-full truncate text-callout font-semibold text-text">{item.title}</span>
          <span className="text-caption text-text-tertiary">
            {showBy && item.by ? `${item.by.name}, ${item.by.unit} · ` : `${kindLabel(item.kind)} · `}
            {pqrsDate(item.createdAt)}
          </span>
          <StatusTag status={item.status} />
        </span>
        <ChevronRight className="size-5 shrink-0 text-text-tertiary" strokeWidth={2} aria-hidden />
      </Link>
    </li>
  );
}

/** Recibido → En proceso → Resuelto, con la fecha de cada paso alcanzado. */
export function StatusStepper({ item }: { item: Pqrs }) {
  const current = statusSteps.indexOf(item.status);
  const reachedAt = (s: PqrsStatus) => [...item.events].reverse().find((e) => e.status === s)?.at;

  return (
    <ol aria-label="Estado del reporte" className="flex w-full items-start rounded-[18px] border border-option-border bg-surface px-3 py-4">
      {statusSteps.map((s, i) => {
        const done = i <= current;
        const at = done ? reachedAt(s) : undefined;
        return (
          <li
            key={s}
            aria-current={i === current ? "step" : undefined}
            className="relative flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center"
          >
            {i > 0 && (
              <span
                aria-hidden
                className={cn("absolute top-[13px] right-1/2 h-0.5 w-full", i <= current ? "bg-brand" : "bg-option-border")}
              />
            )}
            <span
              className={cn(
                "relative z-10 grid size-7 place-items-center rounded-full border-2 text-overline font-bold",
                done ? "border-brand bg-brand text-white" : "border-option-border bg-surface text-text-tertiary",
              )}
            >
              {done ? <Check className="size-4" strokeWidth={3} aria-hidden /> : i + 1}
            </span>
            <span className={cn("text-caption font-semibold", done ? "text-text" : "text-text-tertiary")}>
              {statusLabel[s]}
            </span>
            {at && <span className="text-overline text-text-tertiary">{pqrsDate(at)}</span>}
          </li>
        );
      })}
    </ol>
  );
}

/** Historial: cada cambio con la nota de la administración (lo más reciente arriba). */
export function Timeline({ item }: { item: Pqrs }) {
  const events = [...item.events].reverse();
  return (
    <ol aria-label="Historial" className="flex w-full flex-col">
      {events.map((e, i) => (
        <li key={`${e.at}-${i}`} className="relative flex gap-3 pb-4 last:pb-0">
          {i < events.length - 1 && <span aria-hidden className="absolute top-4 left-[5px] h-full w-0.5 bg-option-border" />}
          <span
            aria-hidden
            className={cn("relative mt-1.5 size-3 shrink-0 rounded-full", i === 0 ? "bg-brand" : "bg-option-border")}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="text-callout font-semibold text-text">
              {e.status === "recibido" && i === events.length - 1 ? "Reporte recibido" : statusLabel[e.status]}
            </p>
            <p className="text-caption text-text-tertiary">{pqrsDate(e.at)}</p>
            {e.note ? (
              <p className="mt-1 rounded-card bg-surface px-3.5 py-2.5 text-body text-text">{e.note}</p>
            ) : (
              e.status === "recibido" &&
              i === events.length - 1 && (
                <p className="text-caption text-text-tertiary">La administración ya puede verlo.</p>
              )
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
