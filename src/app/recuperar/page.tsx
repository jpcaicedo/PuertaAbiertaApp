import { RecuperarForm } from "./recuperar-form";

type Props = { searchParams: Promise<{ correo?: string }> };

/** R8 · Recuperar contraseña (484:2218) */
export default async function RecuperarPage({ searchParams }: Props) {
  const { correo } = await searchParams;
  return <RecuperarForm defaultEmail={correo ?? ""} />;
}
