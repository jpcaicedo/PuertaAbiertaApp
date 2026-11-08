import { RequestsScreen, type RequestFilter } from "@/components/admin/requests";
import { getAdminRequests } from "@/lib/admin/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "Solicitudes · Administración" };

const filters: RequestFilter[] = ["todas", "actividades", "reservas"];

/** X2 · Solicitudes */
export default async function SolicitudesPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const tipo = (await searchParams).tipo as RequestFilter | undefined;
  const filter = tipo && filters.includes(tipo) ? tipo : "todas";
  if (!isSupabaseConfigured) return <RequestsScreen filter={filter} />;
  return <RequestsScreen filter={filter} requests={await getAdminRequests()} />;
}
