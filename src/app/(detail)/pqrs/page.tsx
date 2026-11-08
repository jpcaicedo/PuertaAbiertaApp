import { PqrsList } from "@/components/pqrs/pqrs-list";
import { getMyPqrs } from "@/lib/pqrs/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "Reportes y PQRS · Puerta Abierta" };

/** Mis reportes de daños y PQRS. */
export default async function PqrsPage() {
  if (!isSupabaseConfigured) return <PqrsList />;
  return <PqrsList items={await getMyPqrs()} />;
}
