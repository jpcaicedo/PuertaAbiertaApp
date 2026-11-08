import { notFound } from "next/navigation";
import { ReserveDate } from "@/components/zonas/reserve-date";
import { bookableDays } from "@/lib/zones/data";
import { getZoneOccupancy } from "@/lib/zones/queries";
import { getApprovalZone } from "@/lib/zones/reservation";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ dia?: string; franja?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const z = getApprovalZone((await params).id);
  return {
    title: z ? `Reservar ${z.withArticle} · Zonas comunes` : "Zonas comunes",
  };
}

/** Z3 · Elegir fecha y franja */
export default async function ReservarPage({ params, searchParams }: Props) {
  const zone = getApprovalZone((await params).id);
  if (!zone) notFound();
  const { dia, franja } = await searchParams;
  const days = bookableDays(zone);
  const occupancy = await getZoneOccupancy(zone.id, days[0], days.at(-1)!);
  return <ReserveDate zoneId={zone.id} day={dia} start={franja} occupancy={occupancy} />;
}
