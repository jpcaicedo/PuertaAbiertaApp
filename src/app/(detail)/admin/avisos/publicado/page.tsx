import { AdminConfirmation } from "@/components/admin/ui";
import { audiences } from "@/lib/admin/data";

export const metadata = { title: "Aviso publicado · Administración" };

/** X6 · Aviso publicado */
export default async function AvisoPublicadoPage({ searchParams }: { searchParams: Promise<{ para?: string }> }) {
  const { para } = await searchParams;
  const a = audiences.find((x) => x.id === para) ?? audiences[0];
  const who = a.id === "todos" ? "del conjunto" : `de la ${a.label}`;
  return (
    <AdminConfirmation
      title="Aviso publicado"
      description={`Les llegó a los ${a.apartments} apartamentos ${who}. Ya aparece en su Inicio.`}
    />
  );
}
