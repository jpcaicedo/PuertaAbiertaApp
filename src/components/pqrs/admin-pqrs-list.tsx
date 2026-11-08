"use client";

import * as React from "react";
import { Screen, ScreenHeader } from "@/components/app/screen";
import { ListGroup, PageHeading } from "@/components/perfil/ui";
import type { Pqrs } from "@/lib/pqrs/data";
import { useDemoPqrs } from "@/lib/pqrs/store";
import { cn } from "@/lib/utils";
import { PqrsRow } from "./ui";

/** Administración · Reportes y PQRS del conjunto, con pestañas Abiertos / Resueltos. */
export function AdminPqrsList({ items: serverItems }: { items?: Pqrs[] }) {
  const demo = useDemoPqrs();
  const items = serverItems ?? demo ?? [];
  const loading = !serverItems && !demo;
  const [tab, setTab] = React.useState<"open" | "done">("open");
  const open = items.filter((p) => p.status !== "resuelto");
  const done = items.filter((p) => p.status === "resuelto");
  const shown = tab === "open" ? open : done;

  return (
    <Screen>
      <ScreenHeader backHref="/admin" />
      <div className="flex flex-col items-start gap-4 px-5 pt-3 pb-10">
        <PageHeading title="Reportes y PQRS" description="Daños, peticiones, quejas y sugerencias de los vecinos." />

        <div role="tablist" aria-label="Filtrar reportes" className="flex w-full gap-1 rounded-[14px] bg-surface-muted p-1">
          {(
            [
              ["open", `Abiertos (${open.length})`],
              ["done", `Resueltos (${done.length})`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                "flex-1 cursor-pointer rounded-[10px] px-3 py-2 text-label font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand",
                tab === id ? "bg-surface text-text shadow-sm" : "text-text-tertiary",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {shown.length ? (
          <ListGroup label={tab === "open" ? "Abiertos" : "Resueltos"}>
            {shown.map((p) => (
              <PqrsRow key={p.id} item={p} href={`/admin/pqrs/${p.id}`} showBy />
            ))}
          </ListGroup>
        ) : loading ? null : (
          <p className="w-full rounded-[18px] border border-option-border bg-surface px-4 py-6 text-center text-body text-text-tertiary">
            {tab === "open" ? "No hay reportes abiertos. Estás al día." : "Todavía no hay reportes resueltos."}
          </p>
        )}
      </div>
    </Screen>
  );
}
