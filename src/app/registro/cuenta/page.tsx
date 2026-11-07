import { redirect } from "next/navigation";
import { formatUnit, lookupResidenceCode } from "@/lib/mock-data";
import { CrearCuentaForm } from "./crear-cuenta-form";

type Props = { searchParams: Promise<{ codigo?: string }> };

/** R4 · Crear cuenta (484:2006). Requiere un código válido en la URL. */
export default async function CrearCuentaPage({ searchParams }: Props) {
  const { codigo } = await searchParams;
  const unit = codigo ? lookupResidenceCode(codigo) : null;
  if (!unit) redirect("/registro/codigo");
  return <CrearCuentaForm unitLabel={formatUnit(unit)} />;
}
