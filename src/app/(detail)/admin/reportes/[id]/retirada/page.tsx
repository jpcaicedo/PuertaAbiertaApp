import { notFound } from "next/navigation";
import { AdminConfirmation } from "@/components/admin/ui";
import { getReport, reports } from "@/lib/admin/data";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return reports.map((r) => ({ id: r.id }));
}

export const metadata = { title: "Publicación retirada · Administración" };

/** X8 · Publicación retirada */
export default async function RetiradaPage({ params }: Props) {
  const r = getReport((await params).id);
  if (!r) notFound();
  return (
    <AdminConfirmation
      title="Publicación retirada"
      description={`Le avisamos a ${r.product.sellerName} con el motivo. Si tiene dudas, puede escribirle a la administración.`}
    />
  );
}
