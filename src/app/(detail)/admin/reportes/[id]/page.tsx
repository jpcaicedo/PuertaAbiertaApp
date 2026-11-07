import { notFound } from "next/navigation";
import { ReviewReport } from "@/components/admin/report";
import { getReport, reports } from "@/lib/admin/data";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return reports.map((r) => ({ id: r.id }));
}

export const metadata = { title: "Revisar reporte · Administración" };

/** X7 · Revisar reporte */
export default async function RevisarReportePage({ params }: Props) {
  const r = getReport((await params).id);
  if (!r) notFound();
  return <ReviewReport id={r.id} />;
}
