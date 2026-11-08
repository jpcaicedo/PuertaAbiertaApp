import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PqrsDetail } from "@/components/pqrs/pqrs-detail";
import { getPqrs } from "@/lib/pqrs/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Reporte · Puerta Abierta" };

/** Estado e historial de un reporte. En modo demo, los creados en el navegador se buscan allá. */
export default async function PqrsDetailPage({ params }: Props) {
  const { id } = await params;
  const item = isSupabaseConfigured ? await getPqrs(id) : undefined;
  if (isSupabaseConfigured && !item) notFound();
  return (
    <Suspense>
      <PqrsDetail id={id} item={item ?? undefined} remote={isSupabaseConfigured} />
    </Suspense>
  );
}
