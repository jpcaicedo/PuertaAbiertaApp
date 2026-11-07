import { notFound, redirect } from "next/navigation";
import { ReservationConfirmed } from "@/components/zonas/reservation-status";
import { getApprovalZone, parseReservation } from "@/lib/zones/reservation";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = { title: "Reserva confirmada · Zonas comunes" };

/** Z6 · Reserva confirmada */
export default async function Page({ params, searchParams }: Props) {
  const zone = getApprovalZone((await params).id);
  if (!zone) notFound();
  const r = parseReservation(zone, await searchParams);
  if (!r) redirect(`/zonas-comunes/${zone.id}/reservar`);
  return <ReservationConfirmed r={r} />;
}
