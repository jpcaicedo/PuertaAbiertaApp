import { notFound } from "next/navigation";
import { TurnBooking } from "@/components/zonas/turn-booking";
import { ZoneDetail } from "@/components/zonas/zone-detail";
import { getZone, zones } from "@/lib/zones/data";

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
  if (zone.booking === "slots") return <TurnBooking zoneId={zone.id} initialStart={(await searchParams).turno} />;
  return <ZoneDetail zone={zone} />;
}
