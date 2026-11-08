import { notFound } from "next/navigation";
import { TurnBooking } from "@/components/zonas/turn-booking";
import { ZoneDetail } from "@/components/zonas/zone-detail";
import { getZone, zones, zonesToday } from "@/lib/zones/data";
import { getZoneOccupancy } from "@/lib/zones/queries";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ turno?: string }>;
};

export function generateStaticParams() {
  return zones.map((z) => ({ id: z.id }));
}

export async function generateMetadata({ params }: Props) {
  const z = getZone((await params).id);
  return { title: z ? `${z.name} · Zonas comunes` : "Zonas comunes" };
}

/** Z2 · Salón social / BBQ · Z7 · Turco / Cancha · Z8 · Piscina / Gimnasio */
export default async function ZonaPage({ params, searchParams }: Props) {
  const zone = getZone((await params).id);
  if (!zone) notFound();
  if (zone.booking === "slots") {
    const today = zonesToday();
    const occupancy = await getZoneOccupancy(zone.id, today, today);
    return <TurnBooking zoneId={zone.id} initialStart={(await searchParams).turno} occupancy={occupancy} />;
  }
  return <ZoneDetail zone={zone} />;
}
