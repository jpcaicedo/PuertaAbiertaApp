"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, Info, Star, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Screen, ScreenActions, ScreenBody, ScreenDescription, ScreenHeader, ScreenTitle } from "@/components/app/screen";
import { InfoList, InfoRow, Note } from "@/components/agenda/primitives";
import { Avatar, VerifiedMark } from "@/components/directorio/ui";
import { currentResident, demoUser } from "@/lib/mock-data";
import { directoryActions, useDirectoryState } from "@/lib/directory/store";

/** D6 · Vista previa del servicio (484:3906) */
export default function VistaPreviaServicioPage() {
  const router = useRouter();
  const { serviceDraft: d } = useDirectoryState();
  const publishing = React.useRef(false);

  // Sin borrador (recarga o enlace directo) se vuelve al formulario.
  React.useEffect(() => {
    if (d === null && !publishing.current) {
      const t = setTimeout(() => router.replace("/directorio/ofrecer"), 0);
      return () => clearTimeout(t);
    }
  }, [d, router]);
  if (!d) return null;

  function publish() {
    // TODO: POST /api/servicios con el borrador.
    publishing.current = true;
    router.push("/directorio/ofrecer/listo");
    directoryActions.saveServiceDraft(null);
  }

  return (
    <Screen>
      <ScreenHeader backHref="/directorio/ofrecer" />
      <ScreenBody gap={16} className="pt-3">
        <ScreenTitle>Así te verán tus vecinos</ScreenTitle>
        <ScreenDescription size="sm">Revisa que todo esté bien antes de publicar.</ScreenDescription>

        {/* Tarjeta con borde punteado azul: es una vista previa, no se puede tocar */}
        <section aria-label="Vista previa" className="flex w-full flex-col items-start gap-2.5 rounded-[18px] border-[1.5px] border-dashed border-brand bg-surface p-4">
          <div className="flex items-center gap-3">
            <Avatar name={demoUser.name} src={demoUser.avatar} size={48} />
            <div className="flex flex-col gap-0.5">
              <p className="flex items-center gap-1.5 text-body font-semibold text-text">
                {demoUser.name}
                <VerifiedMark />
              </p>
              {d.showApartment && <p className="text-caption text-text-secondary">{currentResident.unitLabel.split(" · ").reverse().join(" · ")}</p>}
            </div>
          </div>
          <h2 className="text-heading font-semibold text-text">{d.title}</h2>
          <span className="inline-flex items-center gap-[5px] rounded-[20px] bg-brand-soft py-1 pr-2.5 pl-2 text-overline font-medium text-brand">
            <Star className="size-3.5" strokeWidth={2} aria-hidden />
            Nuevo · todavía sin reseñas
          </span>
          <p className="text-caption text-text-secondary">{d.description}</p>
          <InfoList className="gap-2.5 rounded-none bg-transparent p-0">
            <InfoRow icon={Tag}>{d.price}</InfoRow>
            <InfoRow icon={Clock}>{d.availability}</InfoRow>
          </InfoList>
          <p className="text-overline text-text-tertiary">{d.acceptCalls ? "Acepta llamadas y mensajes" : "Solo mensajes en la app"}</p>
        </section>

        <Note icon={Info} tone="neutral">
          Al publicar, tu servicio queda sujeto a las normas de la comunidad que aceptaste al registrarte.
        </Note>
      </ScreenBody>

      <ScreenActions className="pb-[max(44px,env(safe-area-inset-bottom))]">
        <Button className="rounded-[80px]" onClick={publish}>
          Publicar
        </Button>
        <Button asChild variant="secondary" className="rounded-[80px]">
          <Link href="/directorio/ofrecer">Editar</Link>
        </Button>
      </ScreenActions>
    </Screen>
  );
}
