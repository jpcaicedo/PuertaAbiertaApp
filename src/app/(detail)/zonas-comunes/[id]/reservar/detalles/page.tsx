import { notFound, redirect } from "next/navigation";
import { ReserveDetails } from "@/components/zonas/reserve-details";
import { getApprovalZone, parseSlot } from "@/lib/zones/reservation";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = { title: "¿Para quién es la reserva? · Zonas comunes" };

/** Z4 · ¿Para quién es la reserva? */
export default async function DetallesReservaPage({ params, searchParams }: Props) {
  const zone = getApprovalZone((await params).id);
  if (!zone) notFound();
  const sel = parseSlot(zone, await searchParams);
  if (!sel) redirect(`/zonas-comunes/${zone.id}/reservar`);
  return <ReserveDetails zoneId={zone.id} day={sel.day} start={sel.slot.start} />;
}
