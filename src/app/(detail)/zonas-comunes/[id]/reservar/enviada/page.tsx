import { notFound, redirect } from "next/navigation";
import { ReservationSent } from "@/components/zonas/reservation-status";
import { getApprovalZone, parseReservation } from "@/lib/zones/reservation";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = { title: "Solicitud enviada · Zonas comunes" };

/** Z5 · Solicitud de reserva enviada */
export default async function Page({ params, searchParams }: Props) {
  const zone = getApprovalZone((await params).id);
  if (!zone) notFound();
  const r = parseReservation(zone, await searchParams);
  if (!r) redirect(`/zonas-comunes/${zone.id}/reservar`);
  return <ReservationSent r={r} />;
}
