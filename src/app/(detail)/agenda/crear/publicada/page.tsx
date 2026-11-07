import Link from "next/link";
import { Award, Building, Calendar, Check, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/app/badge";
import { Screen, ScreenActions } from "@/components/app/screen";
import { InfoList, InfoRow, StatusCircle } from "@/components/agenda/primitives";
import { NotifyNeighborsButton } from "@/components/agenda/notify-neighbors";
import { draftWhen, readDraft, type DraftSearchParams } from "@/lib/agenda/draft";

export const metadata = { title: "Actividad publicada · Agenda" };

type Props = { searchParams: Promise<DraftSearchParams & { aprobada?: string }> };

/** A8 · Actividad publicada (484:3208) */
export default async function ActividadPublicadaPage({ searchParams }: Props) {
  const sp = await searchParams;
  const draft = readDraft(sp);

  return (
    <Screen>
      <div className="flex flex-col items-start gap-4 px-5 pt-[120px]">
        <StatusCircle icon={Check} tone="success" />
        <h1 className="text-title font-bold text-text">Tu actividad ya está en la Agenda</h1>
        {sp.aprobada === "1" && <Badge icon={Building}>Aprobada por la administración</Badge>}

        <section aria-label="Vista previa" className="flex w-full flex-col gap-2 rounded-[18px] bg-surface p-4">
          <h2 className="text-heading font-semibold text-text">{draft.name}</h2>
          <InfoList className="gap-2 rounded-none bg-transparent p-0">
            <InfoRow icon={Calendar} tone="muted">
              {draftWhen(draft)}
            </InfoRow>
            <InfoRow icon={MapPin} tone="muted">
              {draft.place}
            </InfoRow>
            <InfoRow icon={Users} tone="muted">
              0 de {draft.capacity} inscritos
            </InfoRow>
          </InfoList>
        </section>

        <p className="flex w-full items-start gap-2.5 rounded-chip bg-warning-soft p-3 text-caption text-warning">
          <Award className="size-5 shrink-0" strokeWidth={2} aria-hidden />
          Si organizas actividades con frecuencia, la administración puede reconocerte como líder comunitaria.
        </p>
      </div>

      <ScreenActions className="pb-[max(44px,env(safe-area-inset-bottom))]">
        <Button asChild className="rounded-[80px]">
          <Link href={`/agenda?dia=${draft.date}`}>Ver en la agenda</Link>
        </Button>
        <NotifyNeighborsButton draft={draft} />
      </ScreenActions>
    </Screen>
  );
}
