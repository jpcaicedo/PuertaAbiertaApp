import { notFound } from "next/navigation";
import { ReviewRequest } from "@/components/admin/requests";
import { adminRequests, getAdminRequest } from "@/lib/admin/data";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return adminRequests.map((r) => ({ id: r.id }));
}

export async function generateMetadata({ params }: Props) {
  const r = getAdminRequest((await params).id);
  return { title: r ? `${r.title} · Solicitudes` : "Solicitudes" };
}

/** X3 · Revisar solicitud */
export default async function RevisarSolicitudPage({ params }: Props) {
  const r = getAdminRequest((await params).id);
  if (!r) notFound();
  return <ReviewRequest id={r.id} />;
}
