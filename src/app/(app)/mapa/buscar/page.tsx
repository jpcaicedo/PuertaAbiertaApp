import { SearchScreen } from "@/components/mapa/search-screen";

export const metadata = { title: "Buscar lugares · Puerta Abierta" };

/** M2 · Buscar lugares · M2b · Sin resultados */
export default async function BuscarLugaresPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return <SearchScreen initialQuery={q ?? ""} />;
}
