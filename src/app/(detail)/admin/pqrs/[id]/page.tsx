import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PqrsDetail } from "@/components/pqrs/pqrs-detail";
import { getPqrs } from "@/lib/pqrs/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Revisar reporte · Administración" };

/** Administración · Revisar un reporte y cambiar su estado. */
export default async function AdminPqrsDetailPage({ params }: Props) {
  const { id } = await params;
  const item = isSupabaseConfigured ? await getPqrs(id) : undefined;
  if (isSupabaseConfigured && !item) notFound();
  return (
    <Suspense>
      <PqrsDetail id={id} item={item ?? undefined} admin remote={isSupabaseConfigured} />
    </Suspense>
  );
}
