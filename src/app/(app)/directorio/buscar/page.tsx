import { ServiceSearchScreen } from "@/components/directorio/services";

export const metadata = { title: "Buscar vecinos · Directorio" };

/** D2 · Buscar vecinos · D2b · Sin resultados */
export default async function BuscarVecinosPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  return <ServiceSearchScreen initialQuery={(await searchParams).q ?? ""} />;
}
