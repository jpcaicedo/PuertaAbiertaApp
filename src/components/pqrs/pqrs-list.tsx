"use client";

import Link from "next/link";
import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Screen, ScreenHeader } from "@/components/app/screen";
import { ListGroup, PageHeading, SectionLabel } from "@/components/perfil/ui";
import type { Pqrs } from "@/lib/pqrs/data";
import { useDemoPqrs } from "@/lib/pqrs/store";
import { PqrsRow } from "./ui";

/** Mis reportes a la administración: abiertos arriba, resueltos abajo. */
export function PqrsList({ items: serverItems }: { items?: Pqrs[] }) {
  const demo = useDemoPqrs();
  const items = serverItems ?? demo ?? [];
  const loading = !serverItems && !demo;
  const open = items.filter((p) => p.status !== "resuelto");
  const done = items.filter((p) => p.status === "resuelto");

  return (
    <Screen>
      <ScreenHeader backHref="/perfil" />
      <div className="flex flex-col items-start gap-4 px-5 pt-3 pb-10">
        <PageHeading
          title="Reportes y PQRS"
          description="Cuéntale a la administración un daño, una petición, una queja o una sugerencia, y sigue cómo va."
        />
        <Button asChild className="w-full">
          <Link href="/pqrs/nuevo">Nuevo reporte</Link>
        </Button>

        {!loading && items.length === 0 && (
          <div className="flex w-full flex-col items-center gap-3 rounded-[18px] border border-option-border bg-surface px-6 py-8 text-center">
            <span aria-hidden className="grid size-12 place-items-center rounded-full bg-option-blue text-brand">
              <Wrench className="size-6" strokeWidth={2} />
            </span>
            <p className="text-callout font-semibold text-text">Aún no has enviado reportes</p>
            <p className="text-label text-text-tertiary">
              Si algo se daña en el conjunto, repórtalo aquí con una foto. Te avisamos cuando cambie el estado.
            </p>
          </div>
        )}

        {open.length > 0 && (
          <>
            <SectionLabel>En curso</SectionLabel>
            <ListGroup label="En curso">
              {open.map((p) => (
                <PqrsRow key={p.id} item={p} href={`/pqrs/${p.id}`} />
              ))}
            </ListGroup>
          </>
        )}
        {done.length > 0 && (
          <>
            <SectionLabel>Resueltos</SectionLabel>
            <ListGroup label="Resueltos">
              {done.map((p) => (
                <PqrsRow key={p.id} item={p} href={`/pqrs/${p.id}`} />
              ))}
            </ListGroup>
          </>
        )}
      </div>
    </Screen>
  );
}
