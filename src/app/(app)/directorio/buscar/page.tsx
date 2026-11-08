import { ServiceSearchScreen } from "@/components/directorio/services";
import { getServices } from "@/lib/directory/queries";

export const metadata = { title: "Buscar vecinos · Directorio" };

/** D2 · Buscar vecinos · D2b · Sin resultados */
export default async function BuscarVecinosPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [{ q }, services] = await Promise.all([searchParams, getServices()]);
  return <ServiceSearchScreen initialQuery={q ?? ""} services={services} />;
}
