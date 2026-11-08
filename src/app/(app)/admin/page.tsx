import { AdminHome } from "@/components/admin/admin-home";
import { getAdminRequests, getOpenReports } from "@/lib/admin/queries";
import { getNotices } from "@/lib/notices/queries";
import { countOpenPqrs } from "@/lib/pqrs/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "Administración · Puerta Abierta" };

/** X1 · Inicio de la administración */
export default async function AdminPage() {
  if (!isSupabaseConfigured) return <AdminHome />;
  const [allNotices, requests, openReports, openPqrs] = await Promise.all([
    getNotices(),
    getAdminRequests(),
    getOpenReports(),
    countOpenPqrs(),
  ]);
  const notices = allNotices.map((n) => ({
    id: n.id,
    title: n.title,
    when: n.cardSummary,
    shareable: n.shareable !== false,
  }));
  return <AdminHome notices={notices} requests={requests} openReports={openReports} openPqrs={openPqrs} />;
}
