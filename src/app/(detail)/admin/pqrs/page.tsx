import { AdminPqrsList } from "@/components/pqrs/admin-pqrs-list";
import { getAdminPqrs } from "@/lib/pqrs/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "Reportes y PQRS · Administración" };

/** Administración · Reportes y PQRS del conjunto. */
export default async function AdminPqrsPage() {
  if (!isSupabaseConfigured) return <AdminPqrsList />;
  return <AdminPqrsList items={await getAdminPqrs()} />;
}
