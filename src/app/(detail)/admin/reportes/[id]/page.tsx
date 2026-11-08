import { notFound, redirect } from "next/navigation";
import { ReviewReport } from "@/components/admin/report";
import { getReportById } from "@/lib/admin/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Revisar reporte · Administración" };

/** X7 · Revisar reporte */
export default async function RevisarReportePage({ params }: Props) {
  const r = await getReportById((await params).id);
  if (!r) notFound();
  if (!r.open) redirect("/admin");
  const { open: _open, ...report } = r;
  void _open;
  return <ReviewReport report={report} remote={isSupabaseConfigured} />;
}
