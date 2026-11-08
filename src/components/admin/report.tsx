"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Screen, ScreenHeader } from "@/components/app/screen";
import { formatPrice } from "@/lib/directory/data";
import type { Report } from "@/lib/admin/data";
import { adminActions } from "@/lib/admin/store";
import { resolveReport } from "@/lib/admin/actions";
import * as React from "react";
import { AdminActionBar, Tag } from "./ui";

/** X7 · Revisar reporte (484:5929) → X8 */
export function ReviewReport({ report, remote }: { report: Report; remote: boolean }) {
  const p = report.product;
  const router = useRouter();
  const [error, setError] = React.useState<string>();
  const [saving, startSave] = React.useTransition();

  function resolve(result: "removed" | "kept") {
    const next = result === "removed" ? `/admin/reportes/${report.id}/retirada` : "/admin";
    if (!remote) {
      // Modo demo: queda en el navegador.
      adminActions.resolveReport(report.id, result);
      return router.push(next);
    }
    setError(undefined);
    startSave(async () => {
      const r = await resolveReport(report.id, result);
      if (!r.ok) return setError(r.error);
      router.push(next);
    });
  }

  return (
    <Screen>
      <ScreenHeader backHref="/admin" />
      <div className="flex flex-col items-start gap-4 px-5 pt-3">
        <div className="flex w-full flex-col items-start gap-2 pb-1">
          <Tag tone="pending">Reporte del marketplace</Tag>
          <h1 className="text-headline font-bold text-text">Revisa esta publicación</h1>
        </div>

        <section
          aria-label="Publicación reportada"
          className="flex w-full items-center gap-3.5 rounded-[18px] border border-option-border bg-surface p-3.5"
        >
          <Image
            src={p.image || "/images/marketplace/buso.jpg"}
            alt=""
            width={72}
            height={72}
            className="size-[72px] shrink-0 rounded-field object-cover"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="text-callout font-semibold text-text">{p.title}</p>
            <p className="text-callout font-bold text-text">{formatPrice(p.price)}</p>
            <p className="text-caption text-text-tertiary">Vende {p.seller}</p>
          </div>
        </section>

        <div className="flex w-full flex-col gap-1.5 rounded-card bg-option-orange px-4 py-3.5">
          <p className="text-caption font-semibold text-status-pending">Motivo del reporte</p>
          <p className="text-[17px] leading-6 font-bold text-text">{report.reason}</p>
        </div>

        <p className="flex w-full items-start gap-2 px-1 text-caption text-text-tertiary">
          <EyeOff className="size-4 shrink-0" strokeWidth={2} aria-hidden />
          Lo reportó un vecino. Su nombre no se le muestra a nadie, tampoco al vendedor.
        </p>

        <div className="flex w-full flex-col gap-1.5">
          <h2 className="text-callout font-semibold text-text">Qué revisar</h2>
          <p className="text-body text-text-tertiary">{report.guidance}</p>
        </div>
      </div>

      <AdminActionBar>
        {error && (
          <p role="alert" className="text-caption text-error">
            {error}
          </p>
        )}
        <Button onClick={() => resolve("removed")} disabled={saving}>
          {saving ? "Guardando…" : "Retirar publicación"}
        </Button>
        <Button variant="secondary" onClick={() => resolve("kept")} disabled={saving}>
          Mantener publicación
        </Button>
      </AdminActionBar>
    </Screen>
  );
}
