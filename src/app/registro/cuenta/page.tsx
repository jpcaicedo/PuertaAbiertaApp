import { redirect } from "next/navigation";
import { lookupUnit } from "@/lib/auth/actions";
import { CrearCuentaForm } from "./crear-cuenta-form";

type Props = { searchParams: Promise<{ codigo?: string }> };

/** R4 · Crear cuenta (484:2006). Requiere un código válido en la URL. */
export default async function CrearCuentaPage({ searchParams }: Props) {
  const { codigo } = await searchParams;
  const unitLabel = codigo ? await lookupUnit(codigo) : null;
  if (!codigo || !unitLabel) redirect("/registro/codigo");
  return <CrearCuentaForm code={codigo.toUpperCase()} unitLabel={unitLabel} />;
}
