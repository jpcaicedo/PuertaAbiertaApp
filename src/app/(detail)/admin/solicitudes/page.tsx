import { RequestsScreen, type RequestFilter } from "@/components/admin/requests";

export const metadata = { title: "Solicitudes · Administración" };

const filters: RequestFilter[] = ["todas", "actividades", "reservas"];

/** X2 · Solicitudes */
export default async function SolicitudesPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const tipo = (await searchParams).tipo as RequestFilter | undefined;
  return <RequestsScreen filter={tipo && filters.includes(tipo) ? tipo : "todas"} />;
}
