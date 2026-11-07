import { RequestSent } from "@/components/agenda/request-sent";
import { readDraft, type DraftSearchParams } from "@/lib/agenda/draft";

export const metadata = { title: "Solicitud enviada · Agenda" };

/** A7 · Solicitud enviada (484:3176) */
export default async function SolicitudEnviadaPage({ searchParams }: { searchParams: Promise<DraftSearchParams> }) {
  return <RequestSent draft={readDraft(await searchParams)} />;
}
