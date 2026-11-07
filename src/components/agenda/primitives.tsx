import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, ChevronLeft, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Person } from "@/lib/agenda/data";

/* ───────────────────────── Icono en círculo (hojas y confirmaciones) ───────────────────────── */

const circleTone = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
} as const;

/** Círculo de estado: padding 14, radio 30, icono 28 (A4, A5, A5b, A7, A8, A10). `lg` = padding 18, icono 34 (A12). */
export function StatusCircle({
  icon: Icon,
  tone,
  size = "md",
}: {
  icon: LucideIcon;
  tone: keyof typeof circleTone;
  size?: "md" | "lg";
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0",
        size === "md" ? "rounded-[30px] p-3.5" : "rounded-[40px] p-[18px]",
        circleTone[tone],
      )}
    >
      <Icon className={size === "md" ? "size-7" : "size-[34px]"} strokeWidth={2} />
    </span>
  );
}

/* ───────────────────────── Filas de datos con icono ───────────────────────── */

type InfoRowProps = { icon: LucideIcon; children: React.ReactNode; tone?: "default" | "success" | "warning" | "muted" };
const rowTone = { default: "text-text", success: "text-success", warning: "text-warning", muted: "text-text-secondary" };

/**
 * Lista de datos (fecha, hora, lugar, cupos).
 * sm → icono 16, texto 13/18, gap 6 (A3, A8) · md → icono 18, texto 15/22, gap 8 (A9).
 */
export function InfoList({
  size = "sm",
  className,
  children,
}: {
  size?: "sm" | "md";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <ul
      className={cn(
        "flex w-full flex-col gap-2.5 rounded-[18px] bg-surface p-4",
        size === "sm"
          ? "text-caption [&_li]:gap-1.5 [&_svg]:size-4"
          : "text-body [&_li]:gap-2 [&_svg]:size-[18px]",
        className,
      )}
    >
      {children}
    </ul>
  );
}

export function InfoRow({ icon: Icon, children, tone = "default" }: InfoRowProps) {
  return (
    <li className={cn("flex items-center", rowTone[tone])}>
      <Icon
        className={cn("shrink-0", tone === "default" ? "text-brand" : tone === "muted" ? "text-text-secondary" : "")}
        strokeWidth={2}
        aria-hidden
      />
      <span>{children}</span>
    </li>
  );
}

/* ───────────────────────── Avatares superpuestos ───────────────────────── */

/** Avatares de 34 con solape de 10 y texto 13/18 a 18px (A3 "Quién va", A9 "Van de tu conjunto"). */
export function AvatarStack({ people, label }: { people: Person[]; label: string }) {
  return (
    <div className="flex items-center">
      {people.map((p, i) => (
        <span key={`${p.name}-${i}`} className="-mr-2.5 inline-flex">
          {p.avatar ? (
            <Image src={p.avatar} alt="" width={34} height={34} className="size-[34px] rounded-full object-cover ring-2 ring-bg" />
          ) : (
            <span className="grid size-[34px] place-items-center rounded-full border-2 border-white bg-brand-soft text-overline font-medium text-brand">
              {initials(p.name)}
            </span>
          )}
        </span>
      ))}
      <span className="pl-[18px] text-caption text-text-secondary">{label}</span>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/* ───────────────────────── Cabecera de detalle ───────────────────────── */

type DetailHeroProps = {
  backHref: string;
  /** Foto 300px de alto, o cabecera ilustrada de 240px si no hay foto. */
  image?: string;
  imageAlt?: string;
  illustration?: LucideIcon;
  /** Alto de la foto: 300 (Agenda), 260 (Mapa), 360 (Marketplace) o 240 (Zonas comunes). */
  photoHeight?: 240 | 260 | 300 | 360;
  /** Color de la cabecera ilustrada: cálido (Agenda) o azul (Zonas comunes). */
  illustrationTone?: "warm" | "brand";
};

/**
 * Cabecera de A3/A9: foto (300) o ilustración (240), botón Atrás blanco de 44 a 16/48,
 * y la hoja de contenido que sube 24px con radio superior 24.
 */
const photoHeights = { 240: "h-[240px]", 260: "h-[260px]", 300: "h-[300px]", 360: "h-[360px]" };
const illustrationTones = {
  warm: { box: "bg-illustration", icon: "top-20 size-20 text-illustration-ink" },
  brand: { box: "bg-brand-soft", icon: "top-[90px] size-[70px] text-brand" },
};

export function DetailHero({ backHref, image, imageAlt = "", illustration: Illustration = BookOpen, photoHeight = 300, illustrationTone = "warm" }: DetailHeroProps) {
  const tone = illustrationTones[illustrationTone];
  return (
    <div className={cn("relative w-full shrink-0", image ? photoHeights[photoHeight] : cn("h-[240px]", tone.box))}>
      {image ? (
        <Image src={image} alt={imageAlt} fill priority sizes="(max-width: 430px) 100vw, 430px" quality={90} className="object-cover" />
      ) : (
        <Illustration className={cn("absolute left-1/2 -translate-x-1/2", tone.icon)} strokeWidth={2} aria-hidden />
      )}
      <Link
        href={backHref}
        aria-label="Atrás"
        className="absolute top-[max(48px,env(safe-area-inset-top))] left-4 grid size-11 place-items-center rounded-full bg-surface text-ink shadow-[0_1px_2px_rgb(0_0_0/0.08)] transition-transform active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <ChevronLeft className="size-[22px]" strokeWidth={2} aria-hidden />
      </Link>
    </div>
  );
}

/** Hoja que monta sobre la cabecera: -24px, radio superior 24, padding 24/20. */
export function DetailSheet({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative -mt-6 flex flex-1 flex-col items-start gap-3.5 rounded-t-[24px] bg-bg px-5 pt-6", className)}>
      {children}
    </div>
  );
}

/* ───────────────────────── Barra de acción inferior ───────────────────────── */

/**
 * Barra fija inferior (A3, A6, A9, A11): blanca, padding 12/20/28, sombra hacia arriba.
 * Deja un espaciador del mismo alto para que el contenido no quede tapado.
 */
export function ActionBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <>
      <div aria-hidden className="h-[124px] shrink-0" />
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[430px] bg-surface px-5 pt-3 pb-[max(28px,calc(var(--safe-bottom)+12px))] shadow-bar">
        <div className={cn("flex w-full gap-2", className)}>{children}</div>
      </div>
    </>
  );
}

/* ───────────────────────── Nota informativa ───────────────────────── */

const noteTone = {
  warning: "bg-warning-soft text-warning",
  neutral: "bg-note text-text-secondary",
} as const;

/** Nota con icono 18 (A6, A9, A11) o 20 (A8). */
export function Note({
  icon: Icon,
  tone = "warning",
  children,
  className,
}: {
  icon: LucideIcon;
  tone?: keyof typeof noteTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("flex w-full items-start gap-2 rounded-field p-3 text-caption", noteTone[tone], className)}>
      <Icon className="size-[18px] shrink-0" strokeWidth={2} aria-hidden />
      <span>{children}</span>
    </p>
  );
}
