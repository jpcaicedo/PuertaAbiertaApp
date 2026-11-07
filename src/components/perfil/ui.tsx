import * as React from "react";
import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* ───────────────────────── Encabezado (P2, P3, P4, N1) ───────────────────────── */

/** Título 24/30 Bold y descripción 15/22 a 6px, con 4px extra debajo. */
export function PageHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex w-full flex-col gap-1.5 pb-1">
      <h1 className="text-headline font-bold text-text">{title}</h1>
      {description && <p className="text-body text-text-tertiary">{description}</p>}
    </div>
  );
}

/** Subtítulo de sección: 16/24 SemiBold ("Mi actividad", "Próximas", "Nuevas"). */
export function SectionLabel({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} className="text-callout font-semibold text-text">
      {children}
    </h2>
  );
}

/* ───────────────────────── Grupo de filas ───────────────────────── */

/** Tarjeta blanca con borde #E3E7EE, radio 18 y divisores de 1px entre filas. */
export function ListGroup({
  children,
  label,
  className,
}: {
  children: React.ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <ul
      aria-label={label}
      className={cn(
        "flex w-full flex-col divide-y divide-option-border overflow-hidden rounded-[18px] border border-option-border bg-surface",
        className,
      )}
    >
      {children}
    </ul>
  );
}

const rowBase = "flex w-full items-center gap-3.5 px-4 py-3.5 text-left";
const rowInteractive =
  "cursor-pointer transition-colors hover:bg-surface-muted/70 outline-none focus-visible:bg-surface-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand";

const tileTone = {
  brand: "bg-option-blue text-brand",
  neutral: "bg-surface-muted text-text",
} as const;

/** Icono 20 en caja de 38 (padding 9, radio 12). */
export function RowIcon({ icon: Icon, tone = "brand" }: { icon: LucideIcon; tone?: keyof typeof tileTone }) {
  return (
    <span aria-hidden className={cn("inline-flex shrink-0 rounded-field p-[9px]", tileTone[tone])}>
      <Icon className="size-5" strokeWidth={2} />
    </span>
  );
}

type NavRowProps = {
  icon: LucideIcon;
  tone?: keyof typeof tileTone;
  title: string;
  subtitle?: string;
} & ({ href: string; onClick?: never } | { href?: never; onClick: () => void });

/** Fila de navegación de P1: icono, título 16/24, subtítulo 14/20 y chevron. */
export function NavRow({ icon, tone, title, subtitle, href, onClick }: NavRowProps) {
  const content = (
    <>
      <RowIcon icon={icon} tone={tone} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-callout font-semibold text-text">{title}</span>
        {subtitle && <span className="text-label text-text-tertiary">{subtitle}</span>}
      </span>
      <ChevronRight className="size-5 shrink-0 text-text-tertiary" strokeWidth={2} aria-hidden />
    </>
  );
  return (
    <li>
      {href ? (
        <Link href={href} className={cn(rowBase, rowInteractive)}>
          {content}
        </Link>
      ) : (
        <button type="button" onClick={onClick} className={cn(rowBase, rowInteractive)}>
          {content}
        </button>
      )}
    </li>
  );
}

/** Fila de ajuste (P3, P4): título y descripción a la izquierda, control a la derecha. */
export function SettingRow({
  id,
  title,
  description,
  control,
}: {
  id: string;
  title: string;
  description: string;
  control: React.ReactNode;
}) {
  return (
    <li className={rowBase}>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span id={`${id}-label`} className="text-callout font-semibold text-text">
          {title}
        </span>
        <span id={`${id}-desc`} className="text-label text-text-tertiary">
          {description}
        </span>
      </span>
      {control}
    </li>
  );
}

/* ───────────────────────── Estado (P2) ───────────────────────── */

const pillTone = {
  confirmed: "bg-status-success-soft text-status-success",
  pending: "bg-option-orange text-status-pending",
  past: "bg-surface-muted text-text-tertiary",
} as const;

/** Píldora 12/16 SemiBold, padding 3/10, radio 12. */
export function StatusPill({ status, children }: { status: keyof typeof pillTone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-[12px] px-2.5 py-[3px] text-overline font-semibold",
        pillTone[status],
      )}
    >
      {children}
    </span>
  );
}
