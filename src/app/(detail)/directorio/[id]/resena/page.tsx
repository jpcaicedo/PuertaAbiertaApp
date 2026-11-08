import { notFound, redirect } from "next/navigation";
import { ReviewForm } from "@/components/directorio/review-form";
import { getServiceBySlug, getServiceReviews } from "@/lib/directory/queries";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Dejar reseña · Directorio" };

/** Dejar o editar la reseña de un servicio (solo quien ya le escribió al vecino). */
export default async function ResenaPage({ params }: Props) {
  const [s, me] = await Promise.all([getServiceBySlug((await params).id), getCurrentUser()]);
  if (!s) notFound();
  if (s.ownerId && s.ownerId === me?.id) redirect(`/directorio/${s.id}`);
  const { mine, access } = await getServiceReviews(s.dbId);
  if (isSupabaseConfigured && access !== "si") redirect(`/directorio/${s.id}#resenas`);
  return (
    <ReviewForm
      slug={s.id}
      dbId={s.dbId}
      name={s.neighbor.name}
      firstName={s.neighbor.firstName}
      avatar={s.neighbor.avatarLarge ?? s.neighbor.avatar}
      serviceTitle={s.title}
      mine={mine}
      remote={isSupabaseConfigured}
    />
  );
}
