"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Esqueleto de pantalla móvil (frames de 390×844 en Figma).
 * - Columna centrada, máx. 430px (iPhone Pro Max) para que en desktop no se estire.
 * - Las acciones se pegan al fondo con `mt-auto`, como en todos los frames.
 * - La barra de estado "9:41" del mockup NO se renderiza: es la del sistema operativo.
 *   Se reserva su alto (48px) en `ScreenHeader`.
 */
export function Screen({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <main
      className={cn("relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-bg", className)}
      {...props}
    >
      {children}
    </main>
  );
}

type ScreenHeaderProps = {
  /** Ruta a la que vuelve. Si se omite, usa el historial del navegador. */
  backHref?: string;
  /** Oculta el botón Atrás pero conserva el espacio (p. ej. pantallas de confirmación). */
  hideBack?: boolean;
};

/** Zona superior: 48px de barra de estado + botón Atrás de 44×44 a 12px del borde. */
export function ScreenHeader({ backHref, hideBack = false }: ScreenHeaderProps) {
  return (
    <header className="h-[92px] shrink-0 pt-[max(48px,env(safe-area-inset-top))] pl-3">
      {!hideBack && <BackButton href={backHref} />}
    </header>
  );
}

const backClasses =
  "grid size-11 cursor-pointer place-items-center rounded-full text-ink transition-colors hover:bg-brand-soft/60 active:bg-brand-soft outline-none focus-visible:ring-2 focus-visible:ring-brand";

export function BackButton({ href }: { href?: string }) {
  const router = useRouter();
  const icon = <ChevronLeft className="size-6" strokeWidth={2} aria-hidden />;
  if (href) {
    return (
      <Link href={href} aria-label="Atrás" className={backClasses}>
        {icon}
      </Link>
    );
  }
  return (
    <button type="button" aria-label="Atrás" onClick={() => router.back()} className={backClasses}>
      {icon}
    </button>
  );
}

type Gap = 12 | 14 | 16 | 18 | 20;
const gapClass: Record<Gap, string> = { 12: "gap-3", 14: "gap-3.5", 16: "gap-4", 18: "gap-[18px]", 20: "gap-5" };

type ScreenBodyProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Separación vertical entre bloques, tal como la define cada frame. */
  gap?: Gap;
};

/** Contenido: 20px a los lados (ancho útil 350px en un frame de 390). */
export function ScreenBody({ gap = 20, className, ...props }: ScreenBodyProps) {
  return <div className={cn("flex flex-col items-start px-5 pt-4", gapClass[gap], className)} {...props} />;
}

type TextProps = React.HTMLAttributes<HTMLElement>;

/** Título de pantalla: 22/28 Bold. */
export function ScreenTitle({ className, ...props }: TextProps) {
  return <h1 className={cn("w-full text-title font-bold text-text", className)} {...props} />;
}

/** Descripción bajo el título. `size="sm"` = 13/18 (R5, R6); por defecto 15/22. */
export function ScreenDescription({ className, size = "md", ...props }: TextProps & { size?: "sm" | "md" }) {
  return (
    <p
      className={cn("w-full text-text-secondary", size === "md" ? "text-body" : "text-caption", className)}
      {...props}
    />
  );
}

/** Pila de botones al fondo: gap 8 y la base del último botón a ~39px del borde (805/844). */
export function ScreenActions({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mt-auto flex w-full flex-col items-center gap-2 px-5 pt-8 pb-[max(39px,env(safe-area-inset-bottom))]",
        className,
      )}
      {...props}
    />
  );
}
