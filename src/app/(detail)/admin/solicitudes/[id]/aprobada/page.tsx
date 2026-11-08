import { notFound } from "next/navigation";
import { AdminConfirmation } from "@/components/admin/ui";
import { getAdminRequest } from "@/lib/admin/queries";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Solicitud aprobada · Administración" };

/** X4 · Solicitud aprobada */
export default async function AprobadaPage({ params }: Props) {
  const r = await getAdminRequest((await params).id);
  if (!r) notFound();
  return (
    <AdminConfirmation
      title={`${r.title} ${r.kind === "activity" ? "aprobada" : "aprobado"}`}
      description={
        r.kind === "activity"
          ? `Le avisamos a ${r.by.name} y ya está en la Agenda para todo el conjunto.`
          : `Le avisamos a ${r.by.name}. La reserva queda confirmada en su perfil.`
      }
    />
  );
}
