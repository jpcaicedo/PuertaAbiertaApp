import * as React from "react";
import Link from "next/link";
import { Check, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/app/screen";
import { cn } from "@/lib/utils";

/* ───────────────────────── Etiqueta ───────────────────────── */

const tagTone = {
  brand: "bg-option-blue text-brand",
  neutral: "bg-surface-muted text-text-tertiary",
  success: "bg-status-success-soft text-status-success",
  pending: "bg-option-orange text-status-pending",
} as const;

export type TagTone = keyof typeof tagTone;

/** Píldora 12/16 SemiBold, padding 3/10, radio 12. */
export function Tag({ tone, children }: { tone: TagTone; children: React.ReactNode }) {
  return (
    <span
      className={cn("inline-flex shrink-0 rounded-[12px] px-2.5 py-[3px] text-overline font-semibold", tagTone[tone])}
    >
      {children}
    </span>
  );
}

/* ───────────────────────── Dato con icono ───────────────────────── */

/** Icono 16 (con 2px arriba para alinearlo a la primera línea) y texto 14/20. */
export function Fact({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <p className="flex w-full items-start gap-2 text-label text-text-tertiary">
      <Icon className="mt-0.5 size-4 shrink-0" strokeWidth={2} aria-hidden />
      <span className="min-w-0 flex-1">{children}</span>
    </p>
  );
}

/* ───────────────────────── Barra de acción ───────────────────────── */

/** Barra fija blanca con borde superior #E3E7EE, padding 12/20/28 y botones apilados a 8. */
export function AdminActionBar({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div aria-hidden className="h-[140px] shrink-0" />
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto flex w-full max-w-[430px] flex-col gap-2 border-t border-option-border bg-surface px-5 pt-3 pb-[max(28px,calc(var(--safe-bottom)+12px))]">
        {children}
      </div>
    </>
  );
}

/* ───────────────────────── Confirmación (X4, X6, X8) ───────────────────────── */

/** Círculo verde de 76 a 230px, título 24/30 centrado, texto 15/22 y «Volver al inicio» en la barra. */
export function AdminConfirmation({ title, description }: { title: string; description: string }) {
  return (
    <Screen>
      <div className="flex flex-col items-center px-5 pt-[230px] text-center">
        <span
          aria-hidden
          className="grid size-[76px] place-items-center rounded-full bg-status-success-soft text-status-success"
        >
          <Check className="size-9" strokeWidth={2} />
        </span>
        <h1 className="mt-9 text-headline font-bold text-text">{title}</h1>
        <p className="mt-3 text-body text-text-tertiary">{description}</p>
      </div>
      <AdminActionBar>
        <Button asChild>
          <Link href="/admin">Volver al inicio</Link>
        </Button>
      </AdminActionBar>
    </Screen>
  );
}
