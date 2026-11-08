import { notFound, redirect } from "next/navigation";
import { ReviewRequest } from "@/components/admin/requests";
import { getAdminRequest } from "@/lib/admin/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const r = await getAdminRequest((await params).id);
  return { title: r ? `${r.title} · Solicitudes` : "Solicitudes" };
}

/** X3 · Revisar solicitud */
export default async function RevisarSolicitudPage({ params }: Props) {
  const r = await getAdminRequest((await params).id);
  if (!r) notFound();
  // Ya respondida (por ejemplo, desde otro teléfono): de vuelta a la lista.
  if (!r.pending) redirect("/admin/solicitudes");
  const { pending: _pending, ...request } = r;
  void _pending;
  return <ReviewRequest request={request} remote={isSupabaseConfigured} />;
}
