import { NewPqrs } from "@/components/pqrs/new-pqrs";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "Nuevo reporte · Puerta Abierta" };

/** Reportar un daño o enviar una PQRS. */
export default function NuevoPqrsPage() {
  return <NewPqrs remote={isSupabaseConfigured} />;
}
